/**
 * TileServerAdapter represents a raster or vector tile source.
 * Unlike other adapters, it does not produce a FeatureCollection —
 * it produces a tile source config for the map adapter.
 *
 * The features() method returns an empty collection; the actual
 * tile URL is exposed separately for use when registering the source
 * with the map adapter.
 */
import type { FeatureCollection } from 'geojson';
import type { DataSource, DataSourceConfig, DataFeedStatus, DataSourceListener } from '../types';

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };

export class TileServerAdapter implements DataSource {
  readonly config: DataSourceConfig;

  private status: DataFeedStatus;

  constructor(config: DataSourceConfig) {
    this.config = config;
    this.status = { sourceId: config.id, state: 'idle', featureCount: 0 };
  }

  async connect(): Promise<void> {
    // Tile sources are always "live" once registered
    this.status = { ...this.status, state: 'live', lastUpdated: new Date() };
  }

  disconnect(): void {
    this.status = { ...this.status, state: 'idle' };
  }

  async refresh(): Promise<void> {
    // Tile sources refresh automatically by the map library
  }

  getFeatures(): FeatureCollection {
    return EMPTY;
  }

  getStatus(): DataFeedStatus {
    return this.status;
  }

  subscribe(_listener: DataSourceListener): () => void {
    // Tile sources don't emit feature updates
    return () => {};
  }

  /** The tile URL template for use with the map adapter's addSource() */
  getTileUrl(): string {
    return this.config.url;
  }
}
