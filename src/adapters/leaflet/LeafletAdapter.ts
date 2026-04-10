/**
 * LeafletAdapter wraps Leaflet for web.
 * Used as a fallback when no Mapbox token is available.
 */
import L from 'leaflet';
import type { MapAdapter, MapInitOptions, LayerSpec, SourceSpec } from '../base/MapAdapter';
import type { BBox, EdgeInsets, ScreenPoint, Viewport } from '../../types/geo';
import type { MapEventType, MapEventHandler, NormalizedPointerEvent } from '../../types/events';
import type { PlatformCapabilities } from '../../types/platform';
import type { AnimationHandle, AnimationSpec } from '../../animation/types';
import type { TranslatedSkin } from '../../skins/types';
import type { LeafletTranslatedPayload } from '../../skins/translators/leafletSkinTranslator';
import type { Feature, FeatureCollection } from 'geojson';

export class LeafletAdapter implements MapAdapter {
  readonly id = 'leaflet';
  readonly platform = 'web' as const;
  readonly capabilities: PlatformCapabilities = {
    supports3D: false,
    supportsVectorTiles: false,
    supportsCustomProjection: false,
    supportsImageOverlay: true,
    supportsHeatmap: false,
    supportsAnimation: true,
    supportsCanvasOverlay: true,
  };

  private map: L.Map | null = null;
  private tileLayer: L.TileLayer | null = null;
  private geojsonLayers: Map<string, L.GeoJSON> = new Map();
  private sources: Map<string, FeatureCollection> = new Map();
  private ready = false;
  private pointerHandlers: Array<(e: NormalizedPointerEvent) => void> = [];
  private container: HTMLElement | null = null;

  async initialize(container: HTMLElement, options: MapInitOptions): Promise<void> {
    this.container = container;
    this.map = L.map(container, {
      center: [options.viewport.center[1], options.viewport.center[0]],
      zoom: options.viewport.zoom,
      zoomControl: true,
    });

    this.tileLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '© OpenStreetMap contributors' }
    ).addTo(this.map);

    // Pointer normalisation
    this.map.on('mousedown', (e) => this.emitPointer('down', e));
    this.map.on('mousemove', (e) => this.emitPointer('move', e));
    this.map.on('mouseup', (e) => this.emitPointer('up', e));

    this.ready = true;
  }

  destroy(): void {
    this.map?.remove();
    this.map = null;
    this.ready = false;
    this.pointerHandlers = [];
    this.geojsonLayers.clear();
    this.sources.clear();
  }

  isReady(): boolean {
    return this.ready;
  }

  getViewport(): Viewport {
    if (!this.map) return { center: [0, 0], zoom: 2 };
    const c = this.map.getCenter();
    return { center: [c.lng, c.lat], zoom: this.map.getZoom() };
  }

  setViewport(viewport: Partial<Viewport>, animate = true): void {
    if (!this.map) return;
    const center = viewport.center
      ? L.latLng(viewport.center[1], viewport.center[0])
      : this.map.getCenter();
    if (animate) {
      this.map.flyTo(center, viewport.zoom);
    } else {
      this.map.setView(center, viewport.zoom);
    }
  }

  fitBounds(bbox: BBox, padding?: EdgeInsets): void {
    if (!this.map) return;
    this.map.fitBounds(
      [[bbox[1], bbox[0]], [bbox[3], bbox[2]]],
      { padding: padding ? [padding.top, padding.right] : undefined }
    );
  }

  applySkin(translated: TranslatedSkin): void {
    const payload = translated.payload as LeafletTranslatedPayload;

    // Swap tile layer
    if (this.tileLayer && this.map) {
      this.map.removeLayer(this.tileLayer);
    }
    if (this.map) {
      this.tileLayer = L.tileLayer(payload.tileUrl, {
        attribution: payload.attribution,
      }).addTo(this.map);
    }

    // Apply CSS variables to container
    if (this.container) {
      for (const [key, value] of Object.entries(payload.cssVars)) {
        this.container.style.setProperty(key, value);
      }
    }
  }

  addLayer(layer: LayerSpec): void {
    if (!this.map) return;
    const sourceData = this.sources.get(layer.sourceId);
    if (!sourceData) return;

    const geojsonLayer = L.geoJSON(sourceData, {
      style: () => ({
        color: (layer.paint?.['line-color'] as string) ?? '#3388ff',
        fillColor: (layer.paint?.['fill-color'] as string) ?? '#3388ff',
        fillOpacity: (layer.paint?.['fill-opacity'] as number) ?? 0.2,
        weight: (layer.paint?.['line-width'] as number) ?? 2,
      }),
    });

    if (layer.visible !== false) {
      geojsonLayer.addTo(this.map);
    }
    this.geojsonLayers.set(layer.id, geojsonLayer);
  }

  removeLayer(layerId: string): void {
    const layer = this.geojsonLayers.get(layerId);
    if (layer && this.map) {
      this.map.removeLayer(layer);
      this.geojsonLayers.delete(layerId);
    }
  }

  updateLayer(layerId: string, updates: Partial<LayerSpec>): void {
    const layer = this.geojsonLayers.get(layerId);
    if (!layer) return;
    if (updates.paint) {
      layer.setStyle({
        color: updates.paint['line-color'] as string,
        fillColor: updates.paint['fill-color'] as string,
      });
    }
  }

  setLayerVisibility(layerId: string, visible: boolean): void {
    const layer = this.geojsonLayers.get(layerId);
    if (!layer || !this.map) return;
    if (visible) {
      layer.addTo(this.map);
    } else {
      this.map.removeLayer(layer);
    }
  }

  hasLayer(layerId: string): boolean {
    return this.geojsonLayers.has(layerId);
  }

  moveLayer(_layerId: string, _beforeId?: string): void {
    // Leaflet uses z-index for ordering — simplified here
  }

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
    // Update any layers that reference this source
    for (const [layerId, layer] of this.geojsonLayers) {
      layer.clearLayers();
      layer.addData(data);
    }
  }

  hasSource(sourceId: string): boolean {
    return this.sources.has(sourceId);
  }

  on<E extends MapEventType>(event: E, handler: MapEventHandler<E>): () => void {
    if (!this.map) return () => {};
    const wrapped = (e: L.LeafletMouseEvent) => {
      handler({
        type: event,
        lngLat: [e.latlng.lng, e.latlng.lat],
        point: { x: e.containerPoint.x, y: e.containerPoint.y },
        originalEvent: e.originalEvent,
      } as Parameters<MapEventHandler<E>>[0]);
    };
    this.map.on(event, wrapped);
    return () => this.map?.off(event, wrapped);
  }

  onPointer(handler: (event: NormalizedPointerEvent) => void): () => void {
    this.pointerHandlers.push(handler);
    return () => {
      this.pointerHandlers = this.pointerHandlers.filter((h) => h !== handler);
    };
  }

  private emitPointer(type: NormalizedPointerEvent['type'], e: L.LeafletMouseEvent): void {
    this.pointerHandlers.forEach((h) =>
      h({
        type,
        lngLat: [e.latlng.lng, e.latlng.lat],
        point: { x: e.containerPoint.x, y: e.containerPoint.y },
        shiftKey: (e.originalEvent as MouseEvent).shiftKey ?? false,
        originalEvent: e.originalEvent,
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
