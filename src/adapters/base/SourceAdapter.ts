import type { FeatureCollection } from 'geojson';
import type { SourceSpec } from './MapAdapter';

/**
 * Thin wrapper that a data-driven component uses to manage its own
 * GeoJSON source registration within the parent adapter.
 */
export interface SourceAdapter {
  add(sourceId: string, spec: SourceSpec): void;
  remove(sourceId: string): void;
  updateData(sourceId: string, data: FeatureCollection): void;
  exists(sourceId: string): boolean;
}
