import { describe, it, expect } from 'vitest';
import {
  computeArea,
  computeCentroid,
  computeBBox,
  closeRing,
  bboxFromCorners,
  featuresWithin,
} from '../../../src/selection/geo/turfHelpers';
import * as turf from '@turf/turf';
import type { FeatureCollection } from 'geojson';

const unitSquare = turf.bboxPolygon([0, 0, 1, 1]).geometry;
const unitFeature = turf.feature(unitSquare);

describe('computeArea', () => {
  it('returns positive area in km²', () => {
    const area = computeArea(unitFeature);
    expect(area).toBeGreaterThan(0);
  });
});

describe('computeCentroid', () => {
  it('returns a Point geometry', () => {
    const centroid = computeCentroid(unitFeature);
    expect(centroid.type).toBe('Point');
    expect(centroid.coordinates).toHaveLength(2);
  });

  it('centroid of unit square is approx [0.5, 0.5]', () => {
    const centroid = computeCentroid(unitFeature);
    expect(centroid.coordinates[0]).toBeCloseTo(0.5, 1);
    expect(centroid.coordinates[1]).toBeCloseTo(0.5, 1);
  });
});

describe('computeBBox', () => {
  it('returns [west, south, east, north]', () => {
    const bbox = computeBBox(unitFeature);
    expect(bbox).toHaveLength(4);
    expect(bbox[0]).toBeLessThan(bbox[2]);
    expect(bbox[1]).toBeLessThan(bbox[3]);
  });
});

describe('closeRing', () => {
  it('returns null for fewer than 3 points', () => {
    expect(closeRing([[0, 0], [1, 0]])).toBeNull();
  });

  it('returns a Polygon for valid ring', () => {
    const result = closeRing([[0, 0], [10, 0], [10, 10], [0, 10]]);
    expect(result?.type).toBe('Polygon');
  });
});

describe('bboxFromCorners', () => {
  it('creates a valid rectangle polygon', () => {
    const poly = bboxFromCorners([0, 0], [5, 5]);
    expect(poly.type).toBe('Polygon');
    expect(poly.coordinates[0]).toHaveLength(5); // closed ring
  });

  it('works when corners are reversed', () => {
    const poly = bboxFromCorners([5, 5], [0, 0]);
    expect(poly.type).toBe('Polygon');
  });
});

describe('featuresWithin', () => {
  it('returns ids of features within the selection polygon', () => {
    const collection: FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        turf.point([0.5, 0.5], { _mergeKey: 'inside' }) as ReturnType<typeof turf.point>,
        turf.point([2, 2], { _mergeKey: 'outside' }) as ReturnType<typeof turf.point>,
      ],
    };
    const ids = featuresWithin(unitFeature, collection);
    expect(ids).toContain('inside');
    expect(ids).not.toContain('outside');
  });
});
