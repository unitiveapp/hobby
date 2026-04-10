import type { Feature, FeatureCollection, Geometry } from 'geojson';

/** [longitude, latitude] */
export type LngLat = [number, number];

/** [west, south, east, north] */
export type BBox = [number, number, number, number];

/** Pixel coordinate on the screen */
export interface ScreenPoint {
  x: number;
  y: number;
}

/** Padding applied to all four edges (pixels) */
export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Current camera state of the map */
export interface Viewport {
  /** Map center [longitude, latitude] */
  center: LngLat;
  /** Zoom level (0–22) */
  zoom: number;
  /** Camera tilt in degrees (0 = flat, 60 = steep) */
  pitch?: number;
  /** Compass bearing in degrees (0 = north) */
  bearing?: number;
  /** Bounding box visible in viewport */
  bounds?: BBox;
}

/** Re-export GeoJSON types for convenience */
export type { Feature, FeatureCollection, Geometry };

/** A GeoJSON feature with a guaranteed string id */
export type IdentifiedFeature<P = Record<string, unknown>> = Feature<Geometry, P> & {
  id: string;
};
