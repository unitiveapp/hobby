import { Platform } from 'react-native';
import type { AdapterId } from '../store/mapStore';
import type { MapAdapter } from './base/MapAdapter';
import { MapboxWebAdapter } from './mapbox/MapboxWebAdapter';
import { MapboxNativeAdapter } from './mapbox/MapboxNativeAdapter';
import { MapLibreWebAdapter } from './maplibre/MapLibreWebAdapter';
import { LeafletAdapter } from './leaflet/LeafletAdapter';
import { GoogleMapsAdapter } from './google/GoogleMapsAdapter';

/** Choose the best adapter for the current platform / env */
export function resolveDefaultAdapter(): AdapterId {
  if (Platform.OS !== 'web') {
    return 'mapbox-native';
  }
  // On web: prefer Mapbox if a public token is configured, otherwise MapLibre
  const token =
    typeof process !== 'undefined'
      ? (process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '')
      : '';
  return token ? 'mapbox-web' : 'maplibre-web';
}

/** Instantiate an adapter by id */
export function createAdapter(id: AdapterId): MapAdapter {
  switch (id) {
    case 'mapbox-web':
      return new MapboxWebAdapter();
    case 'mapbox-native':
      return new MapboxNativeAdapter();
    case 'maplibre-web':
      return new MapLibreWebAdapter();
    case 'leaflet':
      return new LeafletAdapter();
    case 'google':
      return new GoogleMapsAdapter();
    default: {
      const _exhaustive: never = id;
      throw new Error(`Unknown adapter id: ${_exhaustive}`);
    }
  }
}

export { MapboxWebAdapter } from './mapbox/MapboxWebAdapter';
export { MapboxNativeAdapter } from './mapbox/MapboxNativeAdapter';
export { MapLibreWebAdapter } from './maplibre/MapLibreWebAdapter';
export { LeafletAdapter } from './leaflet/LeafletAdapter';
export { GoogleMapsAdapter } from './google/GoogleMapsAdapter';
export type { MapAdapter } from './base/MapAdapter';
export type { LayerSpec, SourceSpec, MapInitOptions, LayerType, SourceType } from './base/MapAdapter';
