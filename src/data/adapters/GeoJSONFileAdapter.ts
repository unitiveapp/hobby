import type { FeatureCollection } from 'geojson';
import type { DataSource, DataSourceConfig, DataFeedStatus, DataSourceListener } from '../types';

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };

export class GeoJSONFileAdapter implements DataSource {
  readonly config: DataSourceConfig;

  private features: FeatureCollection = EMPTY;
  private status: DataFeedStatus;
  private listeners: Set<DataSourceListener> = new Set();

  constructor(config: DataSourceConfig) {
    this.config = config;
    this.status = { sourceId: config.id, state: 'idle', featureCount: 0 };
  }

  async connect(): Promise<void> {
    await this.loadFile();
  }

  disconnect(): void {
    this.status = { ...this.status, state: 'idle' };
  }

  async refresh(): Promise<void> {
    await this.loadFile();
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

  private async loadFile(): Promise<void> {
    try {
      this.status = { ...this.status, state: 'loading' };

      const resp = await fetch(this.config.url, { headers: this.config.authHeaders });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const raw: unknown = await resp.json();
      const fc = this.config.transform ? this.config.transform(raw) : (raw as FeatureCollection);

      this.features = {
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

      this.status = {
        sourceId: this.config.id,
        state: 'live',
        featureCount: this.features.features.length,
        lastUpdated: new Date(),
      };

      for (const listener of this.listeners) {
        listener(this.features);
      }
    } catch (e) {
      this.status = {
        sourceId: this.config.id,
        state: 'error',
        featureCount: 0,
        error: String(e),
      };
    }
  }
}
