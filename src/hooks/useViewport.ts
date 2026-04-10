import { useMapStore } from '../store/mapStore';
import type { Viewport } from '../types/geo';

export function useViewport(): Viewport {
  return useMapStore((s) => s.viewport);
}
