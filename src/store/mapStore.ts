import { create } from 'zustand';
import { Platform } from 'react-native';
import type { Viewport } from '../types/geo';

export type AdapterId = 'mapbox-web' | 'mapbox-native' | 'maplibre-web' | 'leaflet' | 'google';
export type MapType = 'geographic' | 'custom-tile' | 'image';

interface MapState {
  activeAdapterId: AdapterId;
  viewport: Viewport;
  isReady: boolean;
  mapType: MapType;

  setAdapter(id: AdapterId): void;
  setViewport(v: Partial<Viewport>): void;
  setReady(ready: boolean): void;
  setMapType(type: MapType): void;
}

const DEFAULT_VIEWPORT: Viewport = {
  center: [0, 20],
  zoom: 2,
  pitch: 0,
  bearing: 0,
};

/** Pick the right adapter at module load time so the store never holds a stale default. */
function resolveInitialAdapter(): AdapterId {
  if (Platform.OS !== 'web') return 'mapbox-native';
  const token =
    typeof process !== 'undefined'
      ? (process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '')
      : '';
  return token ? 'mapbox-web' : 'maplibre-web';
}

export const useMapStore = create<MapState>((set) => ({
  activeAdapterId: resolveInitialAdapter(),
  viewport: DEFAULT_VIEWPORT,
  isReady: false,
  mapType: 'geographic',

  // Only reset isReady when the adapter actually changes — avoids re-triggering
  // MapContainer's initialization effect when the same id is set again.
  setAdapter: (id) =>
    set((state) => ({
      activeAdapterId: id,
      isReady: id === state.activeAdapterId ? state.isReady : false,
    })),
  setViewport: (v) =>
    set((state) => ({ viewport: { ...state.viewport, ...v } })),
  setReady: (ready) => set({ isReady: ready }),
  setMapType: (type) => set({ mapType: type }),
}));
