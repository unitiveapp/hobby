// MapLibre's CSS is required for the map canvas and controls to render correctly.
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * MapLibreWebAdapter — WebGL vector-tile map for web.
 *
 * Uses MapLibre GL JS (free, open-source Mapbox GL fork).
 * No access token required. Default styles come from CartoCDN's free
 * GL styles (Positron / Dark Matter / Voyager) which render like Mapbox.
 */
import maplibregl, {
  type Map as MapLibreMap,
  type StyleSpecification,
  type GeoJSONSourceSpecification,
  type LayerSpecification,
} from 'maplibre-gl';
import type { MapAdapter, MapInitOptions, LayerSpec, SourceSpec } from '../base/MapAdapter';
import type { BBox, EdgeInsets, ScreenPoint, Viewport } from '../../types/geo';
import type { MapEventType, MapEventHandler, NormalizedPointerEvent } from '../../types/events';
import type { PlatformCapabilities } from '../../types/platform';
import type { AnimationHandle, AnimationSpec } from '../../animation/types';
import type { TranslatedSkin } from '../../skins/types';
import type { Feature, FeatureCollection } from 'geojson';

export interface MapLibreTranslatedPayload {
  /** Full MapLibre StyleSpecification URL or object */
  styleUrl?: string;
  styleSpec?: StyleSpecification;
  /** Fine-grained property updates applied after the style loads */
  updates?: Array<{
    type: 'paint' | 'layout' | 'filter';
    layerId: string;
    property: string;
    value: unknown;
  }>;
}

export class MapLibreWebAdapter implements MapAdapter {
  readonly id = 'maplibre-web';
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

  private map: MapLibreMap | null = null;
  private ready = false;
  private pointerHandlers: Array<(e: NormalizedPointerEvent) => void> = [];

  async initialize(container: HTMLElement, options: MapInitOptions): Promise<void> {
    this.map = new maplibregl.Map({
      container,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: options.viewport.center as [number, number],
      zoom: options.viewport.zoom ?? 2,
      pitch: options.viewport.pitch ?? 0,
      bearing: options.viewport.bearing ?? 0,
      attributionControl: true,
    });

    await new Promise<void>((resolve) => {
      this.map!.on('load', () => {
        this.ready = true;
        resolve();
      });
    });

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
    if (!this.map) return { center: [0, 20], zoom: 2 };
    const c = this.map.getCenter();
    return {
      center: [c.lng, c.lat],
      zoom: this.map.getZoom(),
      pitch: this.map.getPitch(),
      bearing: this.map.getBearing(),
    };
  }

  setViewport(viewport: Partial<Viewport>, animate = true): void {
    if (!this.map) return;
    if (animate) {
      this.map.easeTo({
        center: viewport.center as [number, number] | undefined,
        zoom: viewport.zoom,
        pitch: viewport.pitch,
        bearing: viewport.bearing,
      });
    } else {
      this.map.jumpTo({
        center: viewport.center as [number, number] | undefined,
        zoom: viewport.zoom,
        pitch: viewport.pitch,
        bearing: viewport.bearing,
      });
    }
  }

  setInteractive(interactive: boolean): void {
    if (!this.map) return;
    if (interactive) {
      this.map.dragPan.enable();
      this.map.dragRotate.enable();
      (this.map.getCanvas()).style.cursor = '';
    } else {
      this.map.dragPan.disable();
      this.map.dragRotate.disable();
      (this.map.getCanvas()).style.cursor = 'crosshair';
    }
  }

  fitBounds(bbox: BBox, padding?: EdgeInsets, animate = true): void {
    if (!this.map) return;
    this.map.fitBounds(
      [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
      { padding: padding as maplibregl.PaddingOptions, animate }
    );
  }

  applySkin(translated: TranslatedSkin): void {
    if (!this.map) return;
    const payload = translated.payload as MapLibreTranslatedPayload;

    if (payload.styleSpec) {
      this.map.setStyle(payload.styleSpec);
      if (payload.updates?.length) {
        this.map.once('style.load', () => this.applyUpdates(payload.updates ?? []));
      }
    } else if (payload.styleUrl) {
      this.map.setStyle(payload.styleUrl);
      if (payload.updates?.length) {
        this.map.once('style.load', () => this.applyUpdates(payload.updates ?? []));
      }
    } else if (payload.updates?.length) {
      this.applyUpdates(payload.updates);
    }
  }

  private applyUpdates(updates: NonNullable<MapLibreTranslatedPayload['updates']>): void {
    if (!this.map) return;
    for (const u of updates) {
      try {
        if (u.type === 'paint') {
          this.map.setPaintProperty(u.layerId, u.property, u.value);
        } else if (u.type === 'layout') {
          this.map.setLayoutProperty(u.layerId, u.property, u.value);
        } else if (u.type === 'filter') {
          this.map.setFilter(u.layerId, u.value as maplibregl.FilterSpecification);
        }
      } catch {
        // Layer may not exist in this style — skip
      }
    }
  }

  addLayer(layer: LayerSpec): void {
    if (!this.map?.isStyleLoaded()) return;
    try {
      this.map.addLayer({
        id: layer.id,
        type: layer.type as LayerSpecification['type'],
        source: layer.sourceId,
        'source-layer': layer.sourceLayer,
        paint: layer.paint as LayerSpecification['paint'],
        layout: {
          ...(layer.layout as object),
          visibility: layer.visible === false ? 'none' : 'visible',
        } as LayerSpecification['layout'],
        filter: layer.filter as maplibregl.FilterSpecification,
        minzoom: layer.minZoom,
        maxzoom: layer.maxZoom,
      } as LayerSpecification, layer.beforeId);
    } catch (e) {
      console.warn('[MapLibreWebAdapter] addLayer failed:', e);
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
    if (!this.map?.isStyleLoaded()) return;
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, source as GeoJSONSourceSpecification);
    }
  }

  removeSource(sourceId: string): void {
    if (!this.map || !this.map.getSource(sourceId)) return;
    this.map.removeSource(sourceId);
  }

  updateSourceData(sourceId: string, data: FeatureCollection): void {
    if (!this.map) return;
    const src = this.map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
    src?.setData(data);
  }

  hasSource(sourceId: string): boolean {
    return !!this.map?.getSource(sourceId);
  }

  on<E extends MapEventType>(event: E, handler: MapEventHandler<E>): () => void {
    if (!this.map) return () => {};
    const wrapped = (e: maplibregl.MapMouseEvent) => {
      handler({
        type: event,
        lngLat: [e.lngLat?.lng ?? 0, e.lngLat?.lat ?? 0],
        point: { x: e.point?.x ?? 0, y: e.point?.y ?? 0 },
        originalEvent: e.originalEvent,
      } as Parameters<MapEventHandler<E>>[0]);
    };
    this.map.on(event as maplibregl.MapEventType, wrapped);
    return () => this.map?.off(event as maplibregl.MapEventType, wrapped);
  }

  onPointer(handler: (event: NormalizedPointerEvent) => void): () => void {
    this.pointerHandlers.push(handler);
    return () => {
      this.pointerHandlers = this.pointerHandlers.filter((h) => h !== handler);
    };
  }

  private emitPointer(type: NormalizedPointerEvent['type'], e: maplibregl.MapMouseEvent): void {
    this.pointerHandlers.forEach((h) =>
      h({
        type,
        lngLat: [e.lngLat.lng, e.lngLat.lat],
        point: { x: e.point.x, y: e.point.y },
        shiftKey: (e.originalEvent as MouseEvent)?.shiftKey ?? false,
        originalEvent: e.originalEvent,
      })
    );
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
      [[bbox[0], bbox[1]], [bbox[2], bbox[3]]] as [maplibregl.PointLike, maplibregl.PointLike],
      layerIds ? { layers: layerIds } : undefined
    ) as Feature[];
  }

  animateMarker(_markerId: string, _spec: AnimationSpec): AnimationHandle {
    throw new Error('Use AnimationManager.startAnimation() to animate markers');
  }
}
