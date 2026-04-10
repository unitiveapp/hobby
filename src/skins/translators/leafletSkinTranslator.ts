import type { ResolvedSkin, SkinTranslator } from '../types';

export interface LeafletTranslatedPayload {
  tileUrl: string;
  attribution: string;
  /** CSS variables to inject on the map container element */
  cssVars: Record<string, string>;
}

const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTRIBUTION = '© OpenStreetMap contributors';

export const leafletSkinTranslator: SkinTranslator<LeafletTranslatedPayload> = {
  translate(skin: ResolvedSkin): LeafletTranslatedPayload {
    const { tokens, adapterHints } = skin;
    const leafletHints = adapterHints?.leaflet;

    const cssVars: Record<string, string> = {
      '--map-bg': tokens.background,
      '--map-water': tokens.water,
      '--map-land': tokens.landuse,
      '--map-road-highway': tokens.roads.highway,
      '--map-road-arterial': tokens.roads.arterial,
      '--map-road-local': tokens.roads.local,
      '--map-label-primary': tokens.labels.primary,
      '--map-label-secondary': tokens.labels.secondary,
      '--map-building': tokens.buildings.fill,
      '--map-border': tokens.borders,
      '--map-opacity': String(tokens.globalOpacity),
      // Merge any explicit CSS var overrides from adapterHints
      ...(leafletHints?.cssVars ?? {}),
    };

    return {
      tileUrl: leafletHints?.tileUrl ?? DEFAULT_TILE_URL,
      attribution: leafletHints?.attribution ?? DEFAULT_ATTRIBUTION,
      cssVars,
    };
  },
};
