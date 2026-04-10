import { useContext } from 'react';
import { MapAdapterContext } from '../components/Map/MapAdapterContext';
import type { MapAdapter } from '../adapters/base/MapAdapter';

/**
 * Returns the active MapAdapter from the nearest <MapContainer>, or `null`
 * while the adapter is initialising.
 *
 * Components should guard against null:
 *   const adapter = useMapAdapter();
 *   if (!adapter) return null;
 */
export function useMapAdapter(): MapAdapter | null {
  return useContext(MapAdapterContext);
}
