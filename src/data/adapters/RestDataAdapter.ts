import type { FeatureCollection } from 'geojson';
import type { DataSource, DataSourceConfig, DataFeedStatus, DataSourceListener } from '../types';

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };

export class RestDataAdapter implements DataSource {
  readonly config: DataSourceConfig;

  private features: FeatureCollection = EMPTY;
  private status: DataFeedStatus;
  private listeners: Set<DataSourceListener> = new Set();
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(config: DataSourceConfig) {
    this.config = config;
    this.status = { sourceId: config.id, state: 'idle', featureCount: 0 };
  }

  async connect(): Promise<void> {
    this.setStatus('loading');
    await this.fetchOnce();

    const interval = this.config.refreshIntervalMs ?? 0;
    if (interval > 0) {
      this.intervalHandle = setInterval(() => {
        void this.fetchOnce();
      }, interval);
      this.setStatus('live');
    }
  }

  disconnect(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.setStatus('idle');
  }

  async refresh(): Promise<void> {
    await this.fetchOnce();
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

  private async fetchOnce(): Promise<void> {
    try {
      this.setStatus('loading');
      const resp = await fetch(this.config.url, {
        headers: this.config.authHeaders,
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      const raw: unknown = await resp.json();
      const fc = this.config.transform ? this.config.transform(raw) : (raw as FeatureCollection);
      this.features = this.annotate(fc);
      this.setStatus('live', this.features.features.length);
      this.notify();
    } catch (e) {
      this.setStatus('error', 0, String(e));
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
