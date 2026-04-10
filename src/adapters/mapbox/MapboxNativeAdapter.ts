/**
 * MapboxNativeAdapter wraps @rnmapbox/maps for React Native (iOS/Android).
 *
 * NOTE: Unlike the web adapter which imperatively controls a map instance,
 * the native adapter works differently — @rnmapbox/maps is declarative React.
 * This adapter stores intent (sources, layers, skin) and the
 * <MapboxNativeRenderer> component reads from it to build the declarative JSX tree.
 */
import Mapbox from '@rnmapbox/maps';
import type { MapAdapter, MapInitOptions, LayerSpec, SourceSpec } from '../base/MapAdapter';
import type { BBox, EdgeInsets, ScreenPoint, Viewport } from '../../types/geo';
import type { MapEventType, MapEventHandler, NormalizedPointerEvent } from '../../types/events';
import type { PlatformCapabilities } from '../../types/platform';
import type { AnimationHandle, AnimationSpec } from '../../animation/types';
import type { TranslatedSkin } from '../../skins/types';
import type { MapboxTranslatedPayload } from '../../skins/translators/mapboxSkinTranslator';
import type { Feature, FeatureCollection } from 'geojson';

export class MapboxNativeAdapter implements MapAdapter {
  readonly id = 'mapbox-native';
  readonly platform = 'native' as const;
  readonly capabilities: PlatformCapabilities = {
    supports3D: true,
    supportsVectorTiles: true,
    supportsCustomProjection: false,
    supportsImageOverlay: true,
    supportsHeatmap: true,
    supportsAnimation: true,
    supportsCanvasOverlay: false,
  };

  private cameraRef: Mapbox.Camera | null = null;
  private styleUrl = 'mapbox://styles/mapbox/light-v11';
  private layers: Map<string, LayerSpec> = new Map();
  private sources: Map<string, SourceSpec & { data?: FeatureCollection }> = new Map();
  private ready = false;
  private pointerHandlers: Array<(e: NormalizedPointerEvent) => void> = [];
  private eventHandlers: Map<string, Array<MapEventHandler>> = new Map();

  setAccessToken(token: string): void {
    Mapbox.setAccessToken(token);
  }

  async initialize(_container: unknown, options: MapInitOptions): Promise<void> {
    if (options.accessToken) {
      Mapbox.setAccessToken(options.accessToken);
    }
    // Native map is rendered declaratively — mark ready immediately
    this.ready = true;
  }

  destroy(): void {
    this.layers.clear();
    this.sources.clear();
    this.ready = false;
    this.pointerHandlers = [];
    this.eventHandlers.clear();
  }

  isReady(): boolean {
    return this.ready;
  }

  /** Called by <MapboxNativeRenderer> to register the Camera ref */
  setCameraRef(ref: Mapbox.Camera): void {
    this.cameraRef = ref;
  }

  getStyleUrl(): string {
    return this.styleUrl;
  }

  getLayers(): LayerSpec[] {
    return Array.from(this.layers.values());
  }

  getSources(): Array<[string, SourceSpec]> {
    return Array.from(this.sources.entries());
  }

  getViewport(): Viewport {
    // Viewport is tracked externally via onRegionDidChange
    return { center: [0, 0], zoom: 2 };
  }

  setViewport(viewport: Partial<Viewport>, animate = true): void {
    if (!this.cameraRef) return;
    if (animate) {
      this.cameraRef.flyTo(viewport.center ?? [0, 0]);
    } else {
      this.cameraRef.setCamera({ centerCoordinate: viewport.center, zoomLevel: viewport.zoom });
    }
  }

  fitBounds(bbox: BBox, padding?: EdgeInsets): void {
    if (!this.cameraRef) return;
    this.cameraRef.fitBounds(
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]],
      padding ? [padding.top, padding.right, padding.bottom, padding.left] : undefined
    );
  }

  applySkin(translated: TranslatedSkin): void {
    const payload = translated.payload as MapboxTranslatedPayload;
    if (payload.baseStyleUrl) {
      this.styleUrl = payload.baseStyleUrl;
    }
    // Property updates are applied declaratively via the renderer component
  }

  addLayer(layer: LayerSpec): void {
    this.layers.set(layer.id, layer);
  }

  removeLayer(layerId: string): void {
    this.layers.delete(layerId);
  }

  updateLayer(layerId: string, updates: Partial<LayerSpec>): void {
    const existing = this.layers.get(layerId);
    if (existing) {
      this.layers.set(layerId, { ...existing, ...updates });
    }
  }

  setLayerVisibility(layerId: string, visible: boolean): void {
    this.updateLayer(layerId, { visible });
  }

  hasLayer(layerId: string): boolean {
    return this.layers.has(layerId);
  }

  moveLayer(layerId: string, beforeId?: string): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      this.layers.delete(layerId);
      // Re-insert with beforeId hint
      this.layers.set(layerId, { ...layer, beforeId });
    }
  }

  addSource(sourceId: string, source: SourceSpec): void {
    this.sources.set(sourceId, source);
  }

  removeSource(sourceId: string): void {
    this.sources.delete(sourceId);
  }

  updateSourceData(sourceId: string, data: FeatureCollection): void {
    const existing = this.sources.get(sourceId);
    if (existing) {
      this.sources.set(sourceId, { ...existing, data });
    }
  }

  hasSource(sourceId: string): boolean {
    return this.sources.has(sourceId);
  }

  on<E extends MapEventType>(event: E, handler: MapEventHandler<E>): () => void {
    const handlers = this.eventHandlers.get(event) ?? [];
    handlers.push(handler as MapEventHandler);
    this.eventHandlers.set(event, handlers);
    return () => {
      const current = this.eventHandlers.get(event) ?? [];
      this.eventHandlers.set(
        event,
        current.filter((h) => h !== handler)
      );
    };
  }

  onPointer(handler: (event: NormalizedPointerEvent) => void): () => void {
    this.pointerHandlers.push(handler);
    return () => {
      this.pointerHandlers = this.pointerHandlers.filter((h) => h !== handler);
    };
  }

  /** Called by the renderer when a map press occurs */
  emitPointerEvent(event: NormalizedPointerEvent): void {
    this.pointerHandlers.forEach((h) => h(event));
  }

  queryFeaturesAtPoint(_point: ScreenPoint, _layerIds?: string[]): Feature[] {
    // Feature querying on native requires async; return empty synchronously
    return [];
  }

  queryFeaturesInBBox(_bbox: BBox, _layerIds?: string[]): Feature[] {
    return [];
  }

  animateMarker(_markerId: string, _spec: AnimationSpec): AnimationHandle {
    throw new Error('Use AnimationManager.startAnimation() to animate markers');
  }
}
