import mapboxgl from 'mapbox-gl';
import type { MapAdapter, MapInitOptions, LayerSpec, SourceSpec } from '../base/MapAdapter';
import type { BBox, EdgeInsets, ScreenPoint, Viewport } from '../../types/geo';
import type { MapEventType, MapEventHandler, NormalizedPointerEvent } from '../../types/events';
import type { PlatformCapabilities } from '../../types/platform';
import type { AnimationHandle, AnimationSpec } from '../../animation/types';
import type { TranslatedSkin } from '../../skins/types';
import type { MapboxTranslatedPayload } from '../../skins/translators/mapboxSkinTranslator';
import type { Feature, FeatureCollection } from 'geojson';

export class MapboxWebAdapter implements MapAdapter {
  readonly id = 'mapbox-web';
  readonly platform = 'web' as const;
  readonly capabilities: PlatformCapabilities = {
    supports3D: true,
    supportsVectorTiles: true,
    supportsCustomProjection: true,
    supportsImageOverlay: true,
    supportsHeatmap: true,
    supportsAnimation: true,
    supportsCanvasOverlay: true,
  };

  private map: mapboxgl.Map | null = null;
  private ready = false;
  private pointerHandlers: Array<(e: NormalizedPointerEvent) => void> = [];

  async initialize(container: HTMLElement, options: MapInitOptions): Promise<void> {
    if (options.accessToken) {
      mapboxgl.accessToken = options.accessToken;
    }

    this.map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/light-v11',
      center: options.viewport.center,
      zoom: options.viewport.zoom,
      pitch: options.viewport.pitch ?? 0,
      bearing: options.viewport.bearing ?? 0,
      attributionControl: options.attributionControl ?? true,
      interactive: options.interactive ?? true,
    });

    await new Promise<void>((resolve) => {
      this.map!.on('load', () => {
        this.ready = true;
        resolve();
      });
    });

    // Wire up pointer event normalization
    this.map.on('mousedown', (e) => this.emitPointer('down', e));
    this.map.on('mousemove', (e) => this.emitPointer('move', e));
    this.map.on('mouseup', (e) => this.emitPointer('up', e));
  }

  destroy(): void {
    this.map?.remove();
    this.map = null;
    this.ready = false;
    this.pointerHandlers = [];
  }

  isReady(): boolean {
    return this.ready;
  }

  getViewport(): Viewport {
    if (!this.map) return { center: [0, 0], zoom: 2 };
    const center = this.map.getCenter();
    return {
      center: [center.lng, center.lat],
      zoom: this.map.getZoom(),
      pitch: this.map.getPitch(),
      bearing: this.map.getBearing(),
    };
  }

  setViewport(viewport: Partial<Viewport>, animate = true): void {
    if (!this.map) return;
    const fn = animate ? this.map.easeTo.bind(this.map) : this.map.jumpTo.bind(this.map);
    fn({
      center: viewport.center,
      zoom: viewport.zoom,
      pitch: viewport.pitch,
      bearing: viewport.bearing,
    });
  }

  setInteractive(interactive: boolean): void {
    if (!this.map) return;
    if (interactive) {
      this.map.dragPan.enable();
      this.map.dragRotate.enable();
      this.map.getCanvas().style.cursor = '';
    } else {
      this.map.dragPan.disable();
      this.map.dragRotate.disable();
      this.map.getCanvas().style.cursor = 'crosshair';
    }
  }

  fitBounds(bbox: BBox, padding?: EdgeInsets, animate = true): void {
    if (!this.map) return;
    this.map.fitBounds([bbox[0], bbox[1], bbox[2], bbox[3]], {
      padding: padding as mapboxgl.PaddingOptions,
      animate,
    });
  }

  applySkin(translated: TranslatedSkin): void {
    if (!this.map) return;
    const payload = translated.payload as MapboxTranslatedPayload;

    if (payload.baseStyleUrl) {
      this.map.setStyle(payload.baseStyleUrl);
      // Re-apply property updates after style loads
      this.map.once('style.load', () => this.applyUpdates(payload));
    } else {
      this.applyUpdates(payload);
    }
  }

  private applyUpdates(payload: MapboxTranslatedPayload): void {
    if (!this.map) return;
    for (const update of payload.updates) {
      try {
        if (update.type === 'paint') {
          this.map.setPaintProperty(update.layerId, update.property, update.value);
        } else if (update.type === 'layout') {
          this.map.setLayoutProperty(update.layerId, update.property, update.value);
        } else if (update.type === 'filter') {
          this.map.setFilter(update.layerId, update.value as mapboxgl.FilterSpecification);
        }
      } catch {
        // Layer may not exist in this style — skip silently
      }
    }
  }

  addLayer(layer: LayerSpec): void {
    if (!this.map) return;
    try {
      this.map.addLayer({
        id: layer.id,
        type: layer.type as mapboxgl.LayerSpecification['type'],
        source: layer.sourceId,
        'source-layer': layer.sourceLayer,
        paint: layer.paint as mapboxgl.LayerSpecification['paint'],
        layout: {
          ...(layer.layout as object),
          visibility: layer.visible === false ? 'none' : 'visible',
        },
        filter: layer.filter as mapboxgl.FilterSpecification,
        minzoom: layer.minZoom,
        maxzoom: layer.maxZoom,
      } as mapboxgl.LayerSpecification, layer.beforeId);
    } catch (e) {
      console.warn('[MapboxWebAdapter] addLayer failed:', e);
    }
  }

  removeLayer(layerId: string): void {
    if (!this.map || !this.map.getLayer(layerId)) return;
    this.map.removeLayer(layerId);
  }

  updateLayer(layerId: string, updates: Partial<LayerSpec>): void {
    if (!this.map) return;
    if (updates.paint) {
      for (const [k, v] of Object.entries(updates.paint)) {
        this.map.setPaintProperty(layerId, k, v);
      }
    }
    if (updates.layout) {
      for (const [k, v] of Object.entries(updates.layout)) {
        this.map.setLayoutProperty(layerId, k, v);
      }
    }
  }

  setLayerVisibility(layerId: string, visible: boolean): void {
    if (!this.map) return;
    this.map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }

  hasLayer(layerId: string): boolean {
    return !!this.map?.getLayer(layerId);
  }

  moveLayer(layerId: string, beforeId?: string): void {
    if (!this.map) return;
    this.map.moveLayer(layerId, beforeId);
  }

  addSource(sourceId: string, source: SourceSpec): void {
    if (!this.map) return;
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, source as mapboxgl.SourceSpecification);
    }
  }

  removeSource(sourceId: string): void {
    if (!this.map || !this.map.getSource(sourceId)) return;
    this.map.removeSource(sourceId);
  }

  updateSourceData(sourceId: string, data: FeatureCollection): void {
    if (!this.map) return;
    const src = this.map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
    src?.setData(data);
  }

  hasSource(sourceId: string): boolean {
    return !!this.map?.getSource(sourceId);
  }

  on<E extends MapEventType>(event: E, handler: MapEventHandler<E>): () => void {
    if (!this.map) return () => {};
    const wrapped = (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent | Event) => {
      const me = e as mapboxgl.MapMouseEvent;
      handler({
        type: event,
        lngLat: [me.lngLat?.lng ?? 0, me.lngLat?.lat ?? 0],
        point: { x: me.point?.x ?? 0, y: me.point?.y ?? 0 },
        originalEvent: me.originalEvent,
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

  private emitPointer(type: NormalizedPointerEvent['type'], e: mapboxgl.MapMouseEvent): void {
    const event: NormalizedPointerEvent = {
      type,
      lngLat: [e.lngLat.lng, e.lngLat.lat],
      point: { x: e.point.x, y: e.point.y },
      shiftKey: e.originalEvent?.shiftKey ?? false,
      originalEvent: e.originalEvent,
    };
    this.pointerHandlers.forEach((h) => h(event));
  }

  queryFeaturesAtPoint(point: ScreenPoint, layerIds?: string[]): Feature[] {
    if (!this.map) return [];
    return this.map.queryRenderedFeatures(
      [point.x, point.y],
      layerIds ? { layers: layerIds } : undefined
    ) as Feature[];
  }

  queryFeaturesInBBox(bbox: BBox, layerIds?: string[]): Feature[] {
    if (!this.map) return [];
    return this.map.queryRenderedFeatures(
      [[bbox[0], bbox[1]], [bbox[2], bbox[3]]] as mapboxgl.PointLike[],
      layerIds ? { layers: layerIds } : undefined
    ) as Feature[];
  }

  animateMarker(_markerId: string, _spec: AnimationSpec): AnimationHandle {
    // Delegated to AnimationManager in a real integration
    throw new Error('Use AnimationManager.startAnimation() to animate markers');
  }
}
