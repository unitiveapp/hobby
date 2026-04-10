/**
 * DataSourceManager — plain class singleton (not a React hook).
 * Manages all DataSource connections, merges their outputs, and
 * broadcasts the merged FeatureCollection to Zustand dataStore.
 */
import type { FeatureCollection, Feature } from 'geojson';
import type { DataSource, DataSourceConfig, MergeListener } from './types';
import { RestDataAdapter } from './adapters/RestDataAdapter';
import { WebSocketDataAdapter } from './adapters/WebSocketDataAdapter';
import { GeoJSONFileAdapter } from './adapters/GeoJSONFileAdapter';
import { TileServerAdapter } from './adapters/TileServerAdapter';
import { useDataStore } from '../store/dataStore';

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };

class DataSourceManager {
  private sources: Map<string, DataSource> = new Map();
  private unsubscribeFns: Map<string, () => void> = new Map();
  private mergeListeners: Set<MergeListener> = new Set();
  private mergeDebounce: ReturnType<typeof setTimeout> | null = null;

  /** Register and connect a new data source */
  async registerSource(config: DataSourceConfig): Promise<void> {
    if (this.sources.has(config.id)) {
      console.warn(`[DataSourceManager] Source "${config.id}" already registered`);
      return;
    }

    const source = this.createAdapter(config);
    this.sources.set(config.id, source);

    // Sync to Zustand
    useDataStore.getState().registerSource(config);

    // Subscribe to feature updates
    const unsub = source.subscribe((features) => {
      useDataStore.getState().updateFeedStatus(config.id, {
        state: source.getStatus().state,
        featureCount: features.features.length,
        lastUpdated: new Date(),
      });
      this.scheduleMerge();
    });
    this.unsubscribeFns.set(config.id, unsub);

    try {
      await source.connect();
      useDataStore.getState().updateFeedStatus(config.id, source.getStatus());
    } catch (e) {
      useDataStore.getState().updateFeedStatus(config.id, {
        state: 'error',
        error: String(e),
      });
    }
  }

  /** Disconnect and remove a source */
  unregisterSource(id: string): void {
    this.sources.get(id)?.disconnect();
    this.sources.delete(id);
    this.unsubscribeFns.get(id)?.();
    this.unsubscribeFns.delete(id);
    useDataStore.getState().unregisterSource(id);
    this.scheduleMerge();
  }

  pauseSource(id: string): void {
    this.sources.get(id)?.disconnect();
    useDataStore.getState().updateFeedStatus(id, { state: 'paused' });
  }

  async resumeSource(id: string): Promise<void> {
    const source = this.sources.get(id);
    if (source) {
      await source.connect();
      useDataStore.getState().updateFeedStatus(id, source.getStatus());
    }
  }

  getSource(id: string): DataSource | undefined {
    return this.sources.get(id);
  }

  getMergedCollection(): FeatureCollection {
    return useDataStore.getState().mergedCollection;
  }

  subscribe(listener: MergeListener): () => void {
    this.mergeListeners.add(listener);
    return () => this.mergeListeners.delete(listener);
  }

  /** Disconnect all sources */
  destroy(): void {
    for (const [id] of this.sources) {
      this.unregisterSource(id);
    }
  }

  private scheduleMerge(): void {
    if (this.mergeDebounce) clearTimeout(this.mergeDebounce);
    this.mergeDebounce = setTimeout(() => this.remerge(), 100);
  }

  private remerge(): void {
    const allFeatures = new Map<string | number, Feature>();

    // Collect all source configs sorted by priority (lower = lower priority)
    const sortedSources = Array.from(this.sources.values()).sort(
      (a, b) => (a.config.priority ?? 0) - (b.config.priority ?? 0)
    );

    for (const source of sortedSources) {
      const fc = source.getFeatures();
      for (const feature of fc.features) {
        const mergeKey =
          (feature.properties?._mergeKey as string | undefined) ??
          (feature.id as string | undefined) ??
          Math.random().toString(36);
        // Higher priority (later in sorted array) overwrites lower priority
        allFeatures.set(mergeKey, feature);
      }
    }

    const merged: FeatureCollection = {
      type: 'FeatureCollection',
      features: Array.from(allFeatures.values()),
    };

    useDataStore.getState().setMergedCollection(merged);

    for (const listener of this.mergeListeners) {
      listener(merged);
    }
  }

  private createAdapter(config: DataSourceConfig): DataSource {
    switch (config.type) {
      case 'rest':
        return new RestDataAdapter(config);
      case 'websocket':
        return new WebSocketDataAdapter(config);
      case 'geojson-file':
        return new GeoJSONFileAdapter(config);
      case 'tile-server':
        return new TileServerAdapter(config);
      default: {
        const _: never = config.type;
        throw new Error(`Unknown data source type: ${_}`);
      }
    }
  }
}

export { DataSourceManager };

// Singleton instance
export const dataSourceManager = new DataSourceManager();
