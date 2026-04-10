import type { ResolvedSkin, SkinTranslator } from '../types';

export interface GoogleTranslatedPayload {
  mapTypeId: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
  styles: Record<string, unknown>[];
}

export const googleSkinTranslator: SkinTranslator<GoogleTranslatedPayload> = {
  translate(skin: ResolvedSkin): GoogleTranslatedPayload {
    const { tokens, adapterHints } = skin;
    const googleHints = adapterHints?.google;

    // If adapterHints provide explicit styles, use them; otherwise derive from tokens
    const derivedStyles: Record<string, unknown>[] = [
      {
        elementType: 'geometry',
        stylers: [{ color: tokens.landuse }],
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: tokens.water }],
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: tokens.roads.highway }],
      },
      {
        featureType: 'road.arterial',
        elementType: 'geometry',
        stylers: [{ color: tokens.roads.arterial }],
      },
      {
        featureType: 'road.local',
        elementType: 'geometry',
        stylers: [{ color: tokens.roads.local }],
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: tokens.park }],
      },
      {
        elementType: 'labels.text.fill',
        stylers: [{ color: tokens.labels.primary }],
      },
      {
        elementType: 'labels.text.stroke',
        stylers: [{ color: tokens.labels.halo }],
      },
      {
        featureType: 'administrative',
        elementType: 'geometry.stroke',
        stylers: [{ color: tokens.borders }],
      },
    ];

    return {
      mapTypeId: googleHints?.mapTypeId ?? 'roadmap',
      styles: googleHints?.styles ?? derivedStyles,
    };
  },
};
