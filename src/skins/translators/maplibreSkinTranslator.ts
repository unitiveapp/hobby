import type { ResolvedSkin, SkinTranslator } from '../types';
import type { MapLibreTranslatedPayload } from '../../adapters/maplibre/MapLibreWebAdapter';

/**
 * Free CartoCDN GL styles — no API key required.
 * These are vector tile styles that render identically to Mapbox equivalents.
 */
const CARTO_STYLES = {
  positron:    'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  darkMatter:  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  voyager:     'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
} as const;

export const maplibreSkinTranslator: SkinTranslator<MapLibreTranslatedPayload> = {
  translate(skin: ResolvedSkin): MapLibreTranslatedPayload {
    const hints = skin.adapterHints?.maplibre as {
      styleUrl?: string;
      updates?: MapLibreTranslatedPayload['updates'];
    } | undefined;

    // Fall back to positron (light) when no explicit hint
    const styleUrl = hints?.styleUrl ?? CARTO_STYLES.positron;

    return {
      styleUrl,
      updates: hints?.updates ?? [],
    };
  },
};
