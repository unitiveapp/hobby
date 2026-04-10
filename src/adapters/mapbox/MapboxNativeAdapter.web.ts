/**
 * Web stub for MapboxNativeAdapter.
 * Metro picks this file on web platform instead of MapboxNativeAdapter.ts,
 * preventing the native @rnmapbox/maps import from crashing the web bundle.
 *
 * The factory (src/adapters/index.ts) never instantiates this on web
 * (resolveDefaultAdapter() returns 'leaflet' or 'mapbox-web' on web),
 * so this class is never actually called — it just needs to exist.
 */
import type { MapAdapter, MapInitOptions, LayerSpec, SourceSpec } from '../base/MapAdapter';
import type { BBox, EdgeInsets, ScreenPoint, Viewport } from '../../types/geo';
import type { MapEventType, MapEventHandler, NormalizedPointerEvent } from '../../types/events';
import type { PlatformCapabilities } from '../../types/platform';
import type { AnimationHandle, AnimationSpec } from '../../animation/types';
import type { TranslatedSkin } from '../../skins/types';
import type { Feature, FeatureCollection } from 'geojson';

export class MapboxNativeAdapter implements MapAdapter {
  readonly id = 'mapbox-native';
  readonly platform = 'web' as const;
  readonly capabilities: PlatformCapabilities = {
    supports3D: false,
    supportsVectorTiles: false,
    supportsCustomProjection: false,
    supportsImageOverlay: false,
    supportsHeatmap: false,
    supportsAnimation: false,
    supportsCanvasOverlay: false,
  };

  async initialize(_c: unknown, _o: MapInitOptions): Promise<void> {
    throw new Error('MapboxNativeAdapter is not available on web');
  }
  destroy(): void {}
  isReady(): boolean { return false; }
  getViewport(): Viewport { return { center: [0, 0], zoom: 2 }; }
  setViewport(): void {}
  fitBounds(_bbox: BBox, _p?: EdgeInsets): void {}
  applySkin(_t: TranslatedSkin): void {}
  addLayer(_l: LayerSpec): void {}
  removeLayer(_id: string): void {}
  updateLayer(_id: string, _u: Partial<LayerSpec>): void {}
  setLayerVisibility(_id: string, _v: boolean): void {}
  hasLayer(_id: string): boolean { return false; }
  moveLayer(_id: string, _b?: string): void {}
  addSource(_id: string, _s: SourceSpec): void {}
  removeSource(_id: string): void {}
  updateSourceData(_id: string, _d: FeatureCollection): void {}
  hasSource(_id: string): boolean { return false; }
  on<E extends MapEventType>(_e: E, _h: MapEventHandler<E>): () => void { return () => {}; }
  onPointer(_h: (e: NormalizedPointerEvent) => void): () => void { return () => {}; }
  queryFeaturesAtPoint(_p: ScreenPoint): Feature[] { return []; }
  queryFeaturesInBBox(_b: BBox): Feature[] { return []; }
  animateMarker(_id: string, _s: AnimationSpec): AnimationHandle {
    throw new Error('Not available on web');
  }

  // Stub methods used only by native renderer component
  setAccessToken(_t: string): void {}
  setCameraRef(_r: unknown): void {}
  getStyleUrl(): string { return ''; }
  getLayers(): LayerSpec[] { return []; }
  getSources(): Array<[string, SourceSpec]> { return []; }
  emitPointerEvent(_e: NormalizedPointerEvent): void {}
}
