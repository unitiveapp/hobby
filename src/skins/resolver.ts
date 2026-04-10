import type { MapSkin, ResolvedSkin, SkinTokens, SkinLayerOverride } from './types';
import { deepMerge } from '../utils/deepMerge';

type SkinRegistry = Record<string, MapSkin>;

/** Default fallback tokens — every resolved skin is guaranteed to have all fields */
const DEFAULT_TOKENS: SkinTokens = {
  background: '#f8f4f0',
  water: '#a0c4ff',
  waterway: '#74b9e0',
  landuse: '#e8ead0',
  park: '#c8e6c9',
  roads: {
    highway: '#f4a261',
    arterial: '#e9c46a',
    local: '#ffffff',
    path: '#e0d7ce',
  },
  labels: {
    primary: '#333333',
    secondary: '#666666',
    halo: '#ffffff',
    haloWidth: 1.5,
  },
  buildings: {
    fill: '#e8e0d8',
    outline: '#ccbfb4',
    extrusion: '#d4c8bc',
  },
  borders: '#aaaaaa',
  poi: '#e74c3c',
  fontStack: ['Open Sans Regular', 'Arial Unicode MS Regular'],
  labelMinZoom: 10,
  buildingMinZoom: 15,
  globalOpacity: 1,
};

/**
 * Walk the `extends` chain and deep-merge tokens from ancestor → child.
 * Throws if a circular reference is detected.
 */
export function resolveSkin(id: string, registry: SkinRegistry): ResolvedSkin {
  const visited = new Set<string>();

  function resolve(skinId: string): MapSkin {
    if (visited.has(skinId)) {
      throw new Error(`[SkinResolver] Circular skin inheritance detected: ${skinId}`);
    }
    visited.add(skinId);

    const skin = registry[skinId];
    if (!skin) {
      throw new Error(`[SkinResolver] Skin "${skinId}" not found in registry`);
    }

    if (!skin.extends) {
      return skin;
    }

    const parent = resolve(skin.extends);
    return mergeSkins(parent, skin);
  }

  const merged = resolve(id);

  return {
    ...merged,
    tokens: deepMerge(DEFAULT_TOKENS, merged.tokens as Partial<SkinTokens>),
    extends: undefined,
  } as ResolvedSkin;
}

/** Merge parent and child skins — child wins on conflict */
function mergeSkins(parent: MapSkin, child: MapSkin): MapSkin {
  const mergedTokens = deepMerge(
    (parent.tokens ?? {}) as Record<string, unknown>,
    (child.tokens ?? {}) as Record<string, unknown>
  );

  // Layer overrides: child overrides replace parent overrides with the same layerId
  const parentOverrides = parent.layerOverrides ?? [];
  const childOverrides = child.layerOverrides ?? [];
  const overrideMap = new Map<string, SkinLayerOverride>();
  for (const o of parentOverrides) overrideMap.set(o.layerId, o);
  for (const o of childOverrides) overrideMap.set(o.layerId, o);

  return {
    ...parent,
    ...child,
    tokens: mergedTokens as Partial<SkinTokens>,
    layerOverrides: Array.from(overrideMap.values()),
    adapterHints: deepMerge(
      (parent.adapterHints ?? {}) as Record<string, unknown>,
      (child.adapterHints ?? {}) as Record<string, unknown>
    ) as MapSkin['adapterHints'],
  };
}
