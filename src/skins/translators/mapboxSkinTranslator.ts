import type { ResolvedSkin, SkinTranslator } from '../types';

/**
 * Translates a ResolvedSkin to Mapbox GL paint/layout property updates.
 * The payload is an array of {layerId, property, value} triples that the
 * MapboxWebAdapter / MapboxNativeAdapter apply via setPaintProperty / setLayoutProperty.
 */

export interface MapboxPaintUpdate {
  layerId: string;
  type: 'paint' | 'layout' | 'style' | 'filter';
  property: string;
  value: unknown;
}

export interface MapboxTranslatedPayload {
  /** If set, swap the entire base style first */
  baseStyleUrl?: string;
  updates: MapboxPaintUpdate[];
}

export const mapboxSkinTranslator: SkinTranslator<MapboxTranslatedPayload> = {
  translate(skin: ResolvedSkin): MapboxTranslatedPayload {
    const { tokens, layerOverrides, adapterHints } = skin;
    const updates: MapboxPaintUpdate[] = [];

    // ── Token → layer property mappings ────────────────────────────────────────
    const tokenMappings: Array<[string, string, string, unknown]> = [
      // [layerId-pattern, type, property, value]
      ['background', 'paint', 'background-color', tokens.background],
      ['water', 'paint', 'fill-color', tokens.water],
      ['waterway', 'paint', 'line-color', tokens.waterway],
      ['landuse', 'paint', 'fill-color', tokens.landuse],
      ['park', 'paint', 'fill-color', tokens.park],
      ['road-motorway', 'paint', 'line-color', tokens.roads.highway],
      ['road-trunk', 'paint', 'line-color', tokens.roads.highway],
      ['road-primary', 'paint', 'line-color', tokens.roads.arterial],
      ['road-secondary', 'paint', 'line-color', tokens.roads.arterial],
      ['road-street', 'paint', 'line-color', tokens.roads.local],
      ['road-path', 'paint', 'line-color', tokens.roads.path],
      ['settlement-label', 'paint', 'text-color', tokens.labels.primary],
      ['settlement-label', 'paint', 'text-halo-color', tokens.labels.halo],
      ['settlement-label', 'paint', 'text-halo-width', tokens.labels.haloWidth],
      ['poi-label', 'paint', 'text-color', tokens.labels.secondary],
      ['building', 'paint', 'fill-color', tokens.buildings.fill],
      ['building', 'paint', 'fill-outline-color', tokens.buildings.outline],
      ['admin-0-boundary', 'paint', 'line-color', tokens.borders],
    ];

    for (const [layerId, type, property, value] of tokenMappings) {
      updates.push({ layerId, type: type as 'paint' | 'layout', property, value });
    }

    // ── Per-layer overrides ────────────────────────────────────────────────────
    for (const override of layerOverrides) {
      if (override.paint) {
        for (const [prop, val] of Object.entries(override.paint)) {
          updates.push({ layerId: override.layerId, type: 'paint', property: prop, value: val });
        }
      }
      if (override.layout) {
        for (const [prop, val] of Object.entries(override.layout)) {
          updates.push({ layerId: override.layerId, type: 'layout', property: prop, value: val });
        }
      }
      if (override.filter) {
        updates.push({
          layerId: override.layerId,
          type: 'filter',
          property: 'filter',
          value: override.filter,
        });
      }
    }

    return {
      baseStyleUrl: adapterHints?.mapbox?.styleUrl,
      updates,
    };
  },
};
