import type { BBox, LngLat, ScreenPoint } from './geo';
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon, Point } from 'geojson';

// ─── Map Events ────────────────────────────────────────────────────────────────

export type MapEventType =
  | 'click'
  | 'dblclick'
  | 'mousemove'
  | 'mouseenter'
  | 'mouseleave'
  | 'pointerdown'
  | 'pointermove'
  | 'pointerup'
  | 'zoom'
  | 'zoomstart'
  | 'zoomend'
  | 'move'
  | 'movestart'
  | 'moveend'
  | 'load'
  | 'idle';

export interface MapEvent {
  type: MapEventType;
  lngLat: LngLat;
  point: ScreenPoint;
  originalEvent?: Event;
  features?: Feature[];
}

export type MapEventHandler<E extends MapEventType = MapEventType> = (
  event: MapEvent & { type: E }
) => void;

// ─── Normalised Pointer Event (platform-agnostic) ──────────────────────────────

/** Pointer event normalised across all map libraries and platforms */
export interface NormalizedPointerEvent {
  type: 'down' | 'move' | 'up' | 'cancel';
  lngLat: LngLat;
  point: ScreenPoint;
  /** Whether shift/meta key is held (multi-select modifier) */
  shiftKey: boolean;
  originalEvent?: Event;
}

// ─── Selection Events ─────────────────────────────────────────────────────────

export type SelectionToolType = 'freehand' | 'rectangle' | 'polygon' | 'click';

export interface SelectionEvent {
  id: string;
  tool: SelectionToolType;
  geometry: Polygon | MultiPolygon;
  bbox: BBox;
  /** Computed by @turf/turf — km² */
  areaKm2: number;
  /** Centroid of the selection */
  centroid: Point;
  /** IDs of features from the merged data collection that fall within the selection */
  containedFeatureIds: string[];
  /** Country / admin region info if available */
  regionInfo?: {
    countryCode?: string;
    countryName?: string;
    regionName?: string;
    adminLevel?: number;
  };
  isMultiSelect: boolean;
  timestamp: number;
}

// ─── Data Events ──────────────────────────────────────────────────────────────

export type DataEventType = 'connected' | 'disconnected' | 'update' | 'error';

export interface DataEvent {
  type: DataEventType;
  sourceId: string;
  features?: FeatureCollection;
  error?: string;
  timestamp: number;
}

// ─── Animation Events ─────────────────────────────────────────────────────────

export type AnimationEventType = 'start' | 'pause' | 'resume' | 'complete' | 'stop';

export interface AnimationEvent {
  type: AnimationEventType;
  animationId: string;
  progress: number;
  timestamp: number;
}
