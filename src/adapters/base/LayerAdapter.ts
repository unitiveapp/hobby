import type { LayerSpec } from './MapAdapter';

/**
 * Thin wrapper that a layer component uses to imperatively manage its
 * own layer registration within the parent adapter.
 */
export interface LayerAdapter {
  add(spec: LayerSpec): void;
  remove(layerId: string): void;
  update(layerId: string, updates: Partial<LayerSpec>): void;
  setVisibility(layerId: string, visible: boolean): void;
  exists(layerId: string): boolean;
}
