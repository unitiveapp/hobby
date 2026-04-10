import { create } from 'zustand';
import type { Viewport } from '../types/geo';

export type AdapterId = 'mapbox-web' | 'mapbox-native' | 'leaflet' | 'google';
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

export const useMapStore = create<MapState>((set) => ({
  activeAdapterId: 'mapbox-web',
  viewport: DEFAULT_VIEWPORT,
  isReady: false,
  mapType: 'geographic',

  setAdapter: (id) => set({ activeAdapterId: id, isReady: false }),
  setViewport: (v) =>
    set((state) => ({ viewport: { ...state.viewport, ...v } })),
  setReady: (ready) => set({ isReady: ready }),
  setMapType: (type) => set({ mapType: type }),
}));
