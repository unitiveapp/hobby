import type { MapAdapter, MapInitOptions, LayerSpec, SourceSpec } from '../../src/adapters/base/MapAdapter';
import type { BBox, EdgeInsets, ScreenPoint, Viewport } from '../../src/types/geo';
import type { MapEventType, MapEventHandler, NormalizedPointerEvent } from '../../src/types/events';
import type { PlatformCapabilities } from '../../src/types/platform';
import type { AnimationHandle, AnimationSpec } from '../../src/animation/types';
import type { TranslatedSkin } from '../../src/skins/types';
import type { Feature, FeatureCollection } from 'geojson';

export class MockMapAdapter implements MapAdapter {
  readonly id = 'mock';
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

  private _ready = false;
  private layers: Map<string, LayerSpec> = new Map();
  private sources: Map<string, SourceSpec> = new Map();
  private sourceData: Map<string, FeatureCollection> = new Map();
  private pointerHandlers: Array<(e: NormalizedPointerEvent) => void> = [];

  // Spies
  initialize = vi.fn(async (_container: unknown, _options: MapInitOptions) => {
    this._ready = true;
  });
  destroy = vi.fn(() => { this._ready = false; });
  applySkin = vi.fn((_translated: TranslatedSkin) => {});
  setViewport = vi.fn();
  fitBounds = vi.fn();

  isReady = () => this._ready;

  getViewport = vi.fn((): Viewport => ({ center: [0, 0], zoom: 2 }));

  addLayer = vi.fn((layer: LayerSpec) => { this.layers.set(layer.id, layer); });
  removeLayer = vi.fn((id: string) => { this.layers.delete(id); });
  updateLayer = vi.fn((id: string, updates: Partial<LayerSpec>) => {
    const existing = this.layers.get(id);
    if (existing) this.layers.set(id, { ...existing, ...updates });
  });
  setLayerVisibility = vi.fn((id: string, visible: boolean) => {
    const l = this.layers.get(id);
    if (l) this.layers.set(id, { ...l, visible });
  });
  hasLayer = vi.fn((id: string) => this.layers.has(id));
  moveLayer = vi.fn();

  addSource = vi.fn((id: string, source: SourceSpec) => { this.sources.set(id, source); });
  removeSource = vi.fn((id: string) => {
    this.sources.delete(id);
    this.sourceData.delete(id);
  });
  updateSourceData = vi.fn((id: string, data: FeatureCollection) => {
    this.sourceData.set(id, data);
  });
  hasSource = vi.fn((id: string) => this.sources.has(id));

  on = vi.fn(<E extends MapEventType>(_event: E, _handler: MapEventHandler<E>) => () => {});

  onPointer = vi.fn((handler: (e: NormalizedPointerEvent) => void) => {
    this.pointerHandlers.push(handler);
    return () => {
      this.pointerHandlers = this.pointerHandlers.filter((h) => h !== handler);
    };
  });

  queryFeaturesAtPoint = vi.fn((_point: ScreenPoint, _layerIds?: string[]): Feature[] => []);
  queryFeaturesInBBox = vi.fn((_bbox: BBox, _layerIds?: string[]): Feature[] => []);

  animateMarker = vi.fn((_markerId: string, _spec: AnimationSpec): AnimationHandle => ({
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    onComplete: vi.fn(),
    onFrame: vi.fn(),
  }));

  /** Test helper — simulate a pointer event */
  simulatePointer(event: NormalizedPointerEvent): void {
    this.pointerHandlers.forEach((h) => h(event));
  }

  /** Test helper — get registered layer by id */
  getLayer(id: string): LayerSpec | undefined {
    return this.layers.get(id);
  }

  /** Test helper — get source data */
  getSourceData(id: string): FeatureCollection | undefined {
    return this.sourceData.get(id);
  }
}
