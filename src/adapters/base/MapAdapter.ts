import type { BBox, EdgeInsets, ScreenPoint, Viewport } from '../../types/geo';
import type { MapEventType, MapEventHandler, NormalizedPointerEvent } from '../../types/events';
import type { PlatformCapabilities } from '../../types/platform';
import type { AnimationHandle, AnimationSpec } from '../../animation/types';
import type { TranslatedSkin } from '../../skins/types';
import type { Feature, FeatureCollection } from 'geojson';

// ─── Layer / Source Specs ─────────────────────────────────────────────────────

export type LayerType =
  | 'fill'
  | 'line'
  | 'symbol'
  | 'circle'
  | 'heatmap'
  | 'fill-extrusion'
  | 'raster'
  | 'hillshade'
  | 'background';

export interface LayerSpec {
  id: string;
  type: LayerType;
  sourceId: string;
  /** Source layer within a vector tile source */
  sourceLayer?: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown[];
  minZoom?: number;
  maxZoom?: number;
  visible?: boolean;
  /** Layer to render this layer before */
  beforeId?: string;
}

export type SourceType = 'geojson' | 'vector' | 'raster' | 'raster-dem' | 'image' | 'video';

export interface SourceSpec {
  type: SourceType;
  /** For GeoJSON sources: the initial data */
  data?: FeatureCollection | string;
  /** For vector/raster: tile URL template */
  tiles?: string[];
  /** For image sources */
  url?: string;
  coordinates?: [[number, number], [number, number], [number, number], [number, number]];
  minzoom?: number;
  maxzoom?: number;
  [key: string]: unknown;
}

// ─── Map Init Options ─────────────────────────────────────────────────────────

export interface MapInitOptions {
  viewport: Viewport;
  accessToken?: string;
  interactive?: boolean;
  attributionControl?: boolean;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// ─── MapAdapter Interface ─────────────────────────────────────────────────────

export interface MapAdapter {
  readonly id: string;
  readonly platform: 'web' | 'native';
  readonly capabilities: PlatformCapabilities;

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  initialize(container: unknown, options: MapInitOptions): Promise<void>;
  destroy(): void;
  isReady(): boolean;

  // ── Viewport ─────────────────────────────────────────────────────────────────
  getViewport(): Viewport;
  setViewport(viewport: Partial<Viewport>, animate?: boolean): void;
  fitBounds(bbox: BBox, padding?: EdgeInsets, animate?: boolean): void;

  // ── Skin ─────────────────────────────────────────────────────────────────────
  applySkin(translated: TranslatedSkin): void;

  // ── Layers ───────────────────────────────────────────────────────────────────
  addLayer(layer: LayerSpec): void;
  removeLayer(layerId: string): void;
  updateLayer(layerId: string, updates: Partial<LayerSpec>): void;
  setLayerVisibility(layerId: string, visible: boolean): void;
  hasLayer(layerId: string): boolean;
  moveLayer(layerId: string, beforeId?: string): void;

  // ── Sources ──────────────────────────────────────────────────────────────────
  addSource(sourceId: string, source: SourceSpec): void;
  removeSource(sourceId: string): void;
  updateSourceData(sourceId: string, data: FeatureCollection): void;
  hasSource(sourceId: string): boolean;

  // ── Events ───────────────────────────────────────────────────────────────────
  on<E extends MapEventType>(event: E, handler: MapEventHandler<E>): () => void;
  onPointer(handler: (event: NormalizedPointerEvent) => void): () => void;

  // ── Querying ─────────────────────────────────────────────────────────────────
  queryFeaturesAtPoint(point: ScreenPoint, layerIds?: string[]): Feature[];
  queryFeaturesInBBox(bbox: BBox, layerIds?: string[]): Feature[];

  // ── Animation ────────────────────────────────────────────────────────────────
  animateMarker(markerId: string, spec: AnimationSpec): AnimationHandle;
}
