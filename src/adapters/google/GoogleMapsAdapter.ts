/**
 * GoogleMapsAdapter wraps @react-google-maps/api for web.
 * Like MapboxNativeAdapter, this is semi-declarative — it stores
 * intent and the <GoogleMapsRenderer> component reads from it.
 */
import type { MapAdapter, MapInitOptions, LayerSpec, SourceSpec } from '../base/MapAdapter';
import type { BBox, EdgeInsets, ScreenPoint, Viewport } from '../../types/geo';
import type { MapEventType, MapEventHandler, NormalizedPointerEvent } from '../../types/events';
import type { PlatformCapabilities } from '../../types/platform';
import type { AnimationHandle, AnimationSpec } from '../../animation/types';
import type { TranslatedSkin } from '../../skins/types';
import type { GoogleTranslatedPayload } from '../../skins/translators/googleSkinTranslator';
import type { Feature, FeatureCollection } from 'geojson';

export class GoogleMapsAdapter implements MapAdapter {
  readonly id = 'google';
  readonly platform = 'web' as const;
  readonly capabilities: PlatformCapabilities = {
    supports3D: false,
    supportsVectorTiles: false,
    supportsCustomProjection: false,
    supportsImageOverlay: true,
    supportsHeatmap: true,
    supportsAnimation: true,
    supportsCanvasOverlay: false,
  };

  private mapInstance: google.maps.Map | null = null;
  private layers: Map<string, LayerSpec> = new Map();
  private sources: Map<string, FeatureCollection> = new Map();
  private dataLayers: Map<string, google.maps.Data> = new Map();
  private ready = false;
  private translatedPayload: GoogleTranslatedPayload | null = null;
  private pointerHandlers: Array<(e: NormalizedPointerEvent) => void> = [];

  async initialize(_container: unknown, options: MapInitOptions): Promise<void> {
    // Map instance is set externally by the renderer component via setMapInstance()
    this.ready = true;
    void options;
  }

  setMapInstance(map: google.maps.Map): void {
    this.mapInstance = map;

    // Wire pointer events
    map.addListener('mousedown', (e: google.maps.MapMouseEvent) =>
      this.emitPointer('down', e)
    );
    map.addListener('mousemove', (e: google.maps.MapMouseEvent) =>
      this.emitPointer('move', e)
    );
    map.addListener('mouseup', (e: google.maps.MapMouseEvent) =>
      this.emitPointer('up', e)
    );
  }

  destroy(): void {
    this.mapInstance = null;
    this.layers.clear();
    this.sources.clear();
    this.dataLayers.clear();
    this.ready = false;
    this.pointerHandlers = [];
  }

  isReady(): boolean {
    return this.ready;
  }

  getTranslatedPayload(): GoogleTranslatedPayload | null {
    return this.translatedPayload;
  }

  getLayers(): LayerSpec[] {
    return Array.from(this.layers.values());
  }

  getViewport(): Viewport {
    if (!this.mapInstance) return { center: [0, 0], zoom: 2 };
    const c = this.mapInstance.getCenter();
    return {
      center: [c?.lng() ?? 0, c?.lat() ?? 0],
      zoom: this.mapInstance.getZoom() ?? 2,
    };
  }

  setViewport(viewport: Partial<Viewport>, animate = true): void {
    if (!this.mapInstance) return;
    if (viewport.center) {
      if (animate) {
        this.mapInstance.panTo({ lat: viewport.center[1], lng: viewport.center[0] });
      } else {
        this.mapInstance.setCenter({ lat: viewport.center[1], lng: viewport.center[0] });
      }
    }
    if (viewport.zoom !== undefined) {
      this.mapInstance.setZoom(viewport.zoom);
    }
  }

  setInteractive(_interactive: boolean): void { /* Google Maps handles this separately */ }

  fitBounds(bbox: BBox): void {
    if (!this.mapInstance) return;
    this.mapInstance.fitBounds({
      west: bbox[0],
      south: bbox[1],
      east: bbox[2],
      north: bbox[3],
    });
  }

  applySkin(translated: TranslatedSkin): void {
    const payload = translated.payload as GoogleTranslatedPayload;
    this.translatedPayload = payload;
    if (this.mapInstance) {
      this.mapInstance.setMapTypeId(payload.mapTypeId);
      // @ts-ignore — styles is a valid option but types may not include it
      this.mapInstance.set('styles', payload.styles);
    }
  }

  addLayer(layer: LayerSpec): void {
    this.layers.set(layer.id, layer);
    if (this.mapInstance) {
      const data = this.sources.get(layer.sourceId);
      if (data) {
        const dataLayer = new google.maps.Data();
        dataLayer.addGeoJson(data);
        dataLayer.setMap(layer.visible !== false ? this.mapInstance : null);
        this.dataLayers.set(layer.id, dataLayer);
      }
    }
  }

  removeLayer(layerId: string): void {
    this.layers.delete(layerId);
    const dl = this.dataLayers.get(layerId);
    if (dl) {
      dl.setMap(null);
      this.dataLayers.delete(layerId);
    }
  }

  updateLayer(layerId: string, updates: Partial<LayerSpec>): void {
    const existing = this.layers.get(layerId);
    if (existing) this.layers.set(layerId, { ...existing, ...updates });
  }

  setLayerVisibility(layerId: string, visible: boolean): void {
    const dl = this.dataLayers.get(layerId);
    if (dl) dl.setMap(visible && this.mapInstance ? this.mapInstance : null);
  }

  hasLayer(layerId: string): boolean {
    return this.layers.has(layerId);
  }

  moveLayer(_layerId: string, _beforeId?: string): void {}

  addSource(sourceId: string, source: SourceSpec): void {
    if (source.data && typeof source.data !== 'string') {
      this.sources.set(sourceId, source.data as FeatureCollection);
    }
  }

  removeSource(sourceId: string): void {
    this.sources.delete(sourceId);
  }

  updateSourceData(sourceId: string, data: FeatureCollection): void {
    this.sources.set(sourceId, data);
    // Update any data layers for this source
    for (const [layerId, layerSpec] of this.layers) {
      if (layerSpec.sourceId === sourceId) {
        const dl = this.dataLayers.get(layerId);
        if (dl) {
          dl.forEach((f) => dl.remove(f));
          dl.addGeoJson(data);
        }
      }
    }
  }

  hasSource(sourceId: string): boolean {
    return this.sources.has(sourceId);
  }

  on<E extends MapEventType>(event: E, handler: MapEventHandler<E>): () => void {
    if (!this.mapInstance) return () => {};
    const listener = this.mapInstance.addListener(event, (e: google.maps.MapMouseEvent) => {
      handler({
        type: event,
        lngLat: [e.latLng?.lng() ?? 0, e.latLng?.lat() ?? 0],
        point: { x: 0, y: 0 },
      } as Parameters<MapEventHandler<E>>[0]);
    });
    return () => google.maps.event.removeListener(listener);
  }

  onPointer(handler: (event: NormalizedPointerEvent) => void): () => void {
    this.pointerHandlers.push(handler);
    return () => {
      this.pointerHandlers = this.pointerHandlers.filter((h) => h !== handler);
    };
  }

  private emitPointer(type: NormalizedPointerEvent['type'], e: google.maps.MapMouseEvent): void {
    this.pointerHandlers.forEach((h) =>
      h({
        type,
        lngLat: [e.latLng?.lng() ?? 0, e.latLng?.lat() ?? 0],
        point: { x: 0, y: 0 },
        shiftKey: false,
      })
    );
  }

  queryFeaturesAtPoint(_point: ScreenPoint, _layerIds?: string[]): Feature[] {
    return [];
  }

  queryFeaturesInBBox(_bbox: BBox, _layerIds?: string[]): Feature[] {
    return [];
  }

  animateMarker(_markerId: string, _spec: AnimationSpec): AnimationHandle {
    throw new Error('Use AnimationManager.startAnimation() to animate markers');
  }
}
