import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, Polygon, MultiPolygon, Point, LineString } from 'geojson';
import type { LngLat } from '../../types/geo';

/** Compute area in km² */
export function computeArea(polygon: Feature<Polygon | MultiPolygon>): number {
  return turf.area(polygon) / 1_000_000;
}

/** Compute centroid */
export function computeCentroid(polygon: Feature<Polygon | MultiPolygon>): Point {
  return turf.centroid(polygon).geometry;
}

/** Compute bounding box [west, south, east, north] */
export function computeBBox(
  polygon: Feature<Polygon | MultiPolygon>
): [number, number, number, number] {
  return turf.bbox(polygon) as [number, number, number, number];
}

/** Close a ring of LngLat points into a valid Polygon */
export function closeRing(points: LngLat[]): Polygon | null {
  if (points.length < 3) return null;
  const coords = [...points, points[0]];
  try {
    const poly = turf.polygon([coords]);
    const cleaned = turf.cleanCoords(poly);
    const rewound = turf.rewind(cleaned);
    return rewound.geometry as Polygon;
  } catch {
    return null;
  }
}

/** Simplify a polygon to reduce point count */
export function simplifyPolygon(polygon: Polygon, tolerance = 0.0001): Polygon {
  try {
    const feature = turf.feature(polygon);
    const simplified = turf.simplify(feature, { tolerance, highQuality: false });
    return simplified.geometry as Polygon;
  } catch {
    return polygon;
  }
}

/** Simplify a linestring */
export function simplifyLine(coords: LngLat[], tolerance = 0.0001): LngLat[] {
  if (coords.length < 3) return coords;
  try {
    const line = turf.lineString(coords);
    const simplified = turf.simplify(line, { tolerance });
    return simplified.geometry.coordinates as LngLat[];
  } catch {
    return coords;
  }
}

/** Check if a point is inside a polygon */
export function pointInPolygon(point: LngLat, polygon: Feature<Polygon | MultiPolygon>): boolean {
  return turf.booleanPointInPolygon(turf.point(point), polygon);
}

/** Find all features from a collection that fall within a polygon */
export function featuresWithin(
  polygon: Feature<Polygon | MultiPolygon>,
  collection: FeatureCollection
): string[] {
  const ids: string[] = [];
  for (const feature of collection.features) {
    try {
      if (turf.booleanWithin(feature as Feature, polygon)) {
        const id =
          (feature.properties?._mergeKey as string | undefined) ??
          String(feature.id ?? '');
        if (id) ids.push(id);
      }
    } catch {
      // Skip malformed features
    }
  }
  return ids;
}

/** Union two polygons */
export function unionPolygons(
  a: Feature<Polygon | MultiPolygon>,
  b: Feature<Polygon | MultiPolygon>
): Feature<Polygon | MultiPolygon> | null {
  try {
    return turf.union(a as Feature<Polygon>, b as Feature<Polygon>);
  } catch {
    return null;
  }
}

/** Create a bounding-box rectangle from two corner points */
export function bboxFromCorners(corner1: LngLat, corner2: LngLat): Polygon {
  const minLng = Math.min(corner1[0], corner2[0]);
  const maxLng = Math.max(corner1[0], corner2[0]);
  const minLat = Math.min(corner1[1], corner2[1]);
  const maxLat = Math.max(corner1[1], corner2[1]);
  return turf.bboxPolygon([minLng, minLat, maxLng, maxLat]).geometry as Polygon;
}
