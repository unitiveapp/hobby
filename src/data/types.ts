import type { FeatureCollection } from 'geojson';

// ─── Data Source Config ───────────────────────────────────────────────────────

export type DataSourceType = 'rest' | 'websocket' | 'geojson-file' | 'tile-server';

export interface DataSourceConfig {
  id: string;
  type: DataSourceType;
  /** URL of the data endpoint or file */
  url: string;
  /** For REST: polling interval in ms (0 = fetch once) */
  refreshIntervalMs?: number;
  /** HTTP headers for authenticated requests */
  authHeaders?: Record<string, string>;
  /** Optional transform from raw API response to GeoJSON */
  transform?: (raw: unknown) => FeatureCollection;
  /** Feature property used as dedup/merge key across sources */
  mergeKey?: string;
  /** Higher priority wins when two sources provide the same mergeKey */
  priority?: number;
  /** Whether to perform spatial merging (turf.union) for polygon features */
  spatialMerge?: boolean;
}

// ─── Data Feed Status ─────────────────────────────────────────────────────────

export type DataFeedState = 'idle' | 'loading' | 'live' | 'error' | 'paused';

export interface DataFeedStatus {
  sourceId: string;
  state: DataFeedState;
  lastUpdated?: Date;
  featureCount: number;
  error?: string;
}

// ─── DataSource Interface ─────────────────────────────────────────────────────

export type DataSourceListener = (features: FeatureCollection) => void;

export interface DataSource {
  readonly config: DataSourceConfig;

  /** Establish connection / start fetching */
  connect(): Promise<void>;

  /** Disconnect / stop polling */
  disconnect(): void;

  /** Force an immediate refresh (for REST sources) */
  refresh(): Promise<void>;

  /** Get latest cached feature collection */
  getFeatures(): FeatureCollection;

  /** Get current feed status */
  getStatus(): DataFeedStatus;

  /** Subscribe to feature updates; returns unsubscribe function */
  subscribe(listener: DataSourceListener): () => void;
}

// ─── Merge Listener ───────────────────────────────────────────────────────────

export type MergeListener = (mergedCollection: FeatureCollection) => void;
