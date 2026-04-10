/**
 * regionLookup — looks up country / admin region info for a given LngLat.
 * Uses a bundled simplified world boundaries GeoJSON.
 *
 * The actual boundary data file is loaded lazily to avoid bloating the bundle.
 */
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { LngLat } from '../../types/geo';
import type { RegionInfo } from '../types';
import { pointInPolygon } from './turfHelpers';

let boundaryCache: FeatureCollection | null = null;

async function loadBoundaries(): Promise<FeatureCollection> {
  if (boundaryCache) return boundaryCache;
  try {
    // Boundaries file bundled in assets/boundaries/world.geojson
    const resp = await fetch('/assets/boundaries/world.geojson');
    if (!resp.ok) throw new Error('Could not load boundary data');
    boundaryCache = (await resp.json()) as FeatureCollection;
    return boundaryCache;
  } catch {
    // Return empty collection if boundary data unavailable
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Look up region info for a point.
 * Returns undefined if no matching region is found.
 */
export async function lookupRegion(point: LngLat): Promise<RegionInfo | undefined> {
  const boundaries = await loadBoundaries();

  for (const feature of boundaries.features) {
    if (
      feature.geometry.type !== 'Polygon' &&
      feature.geometry.type !== 'MultiPolygon'
    ) {
      continue;
    }

    if (pointInPolygon(point, feature as Feature<Polygon | MultiPolygon>)) {
      const props = feature.properties ?? {};
      return {
        countryCode: props.ISO_A2 as string | undefined,
        countryName: props.NAME as string | undefined,
        regionName: props.ADMIN as string | undefined,
        adminLevel: props.ADMIN_LEVEL as number | undefined,
      };
    }
  }

  return undefined;
}
