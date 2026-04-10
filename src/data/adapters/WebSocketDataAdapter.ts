import type { FeatureCollection } from 'geojson';
import type { DataSource, DataSourceConfig, DataFeedStatus, DataSourceListener } from '../types';

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };
const MAX_RETRIES = 6;
const BASE_DELAY_MS = 1000;

export class WebSocketDataAdapter implements DataSource {
  readonly config: DataSourceConfig;

  private features: FeatureCollection = EMPTY;
  private status: DataFeedStatus;
  private listeners: Set<DataSourceListener> = new Set();
  private ws: WebSocket | null = null;
  private retryCount = 0;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private disconnecting = false;
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingCollection: FeatureCollection | null = null;

  constructor(config: DataSourceConfig) {
    this.config = config;
    this.status = { sourceId: config.id, state: 'idle', featureCount: 0 };
  }

  async connect(): Promise<void> {
    this.disconnecting = false;
    this.openSocket();
    return Promise.resolve();
  }

  disconnect(): void {
    this.disconnecting = true;
    this.clearRetry();
    this.ws?.close();
    this.ws = null;
    this.setStatus('idle');
  }

  async refresh(): Promise<void> {
    // WebSocket data is push-based; no explicit refresh
    return Promise.resolve();
  }

  getFeatures(): FeatureCollection {
    return this.features;
  }

  getStatus(): DataFeedStatus {
    return this.status;
  }

  subscribe(listener: DataSourceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private openSocket(): void {
    const headers = this.config.authHeaders ?? {};
    // Build URL with any auth tokens as query params if needed
    const url = this.config.url;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.retryCount = 0;
      this.setStatus('live', this.features.features.length);
    };

    this.ws.onmessage = (event) => {
      try {
        const raw: unknown = JSON.parse(event.data as string);
        const fc = this.config.transform ? this.config.transform(raw) : (raw as FeatureCollection);
        this.pendingCollection = this.annotate(fc);
        this.scheduleMerge();
      } catch (e) {
        console.warn('[WebSocketDataAdapter] parse error:', e);
      }
    };

    this.ws.onerror = () => {
      this.setStatus('error', this.features.features.length, 'WebSocket error');
    };

    this.ws.onclose = () => {
      if (!this.disconnecting) {
        this.scheduleRetry();
      }
    };

    void headers; // headers are on the config but WebSocket doesn't support custom headers natively
  }

  /** Debounce rapid messages — flush after 100ms of silence */
  private scheduleMerge(): void {
    if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      if (this.pendingCollection) {
        this.features = this.pendingCollection;
        this.pendingCollection = null;
        this.setStatus('live', this.features.features.length);
        this.notify();
      }
    }, 100);
  }

  private scheduleRetry(): void {
    if (this.retryCount >= MAX_RETRIES) {
      this.setStatus('error', 0, 'Max reconnect attempts reached');
      return;
    }
    const delay = BASE_DELAY_MS * Math.pow(2, this.retryCount);
    this.retryCount += 1;
    this.retryTimeout = setTimeout(() => this.openSocket(), delay);
  }

  private clearRetry(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  private annotate(fc: FeatureCollection): FeatureCollection {
    return {
      ...fc,
      features: fc.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          _sourceId: this.config.id,
          _mergeKey: f.properties?.[this.config.mergeKey ?? 'id'] ?? f.id,
        },
      })),
    };
  }

  private setStatus(state: DataFeedStatus['state'], featureCount = 0, error?: string): void {
    this.status = {
      sourceId: this.config.id,
      state,
      featureCount,
      lastUpdated: state === 'live' ? new Date() : this.status.lastUpdated,
      error,
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.features);
    }
  }
}
