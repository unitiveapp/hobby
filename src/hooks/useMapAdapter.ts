import { useContext } from 'react';
import { MapAdapterContext } from '../components/Map/MapAdapterContext';
import type { MapAdapter } from '../adapters/base/MapAdapter';

export function useMapAdapter(): MapAdapter {
  const adapter = useContext(MapAdapterContext);
  if (!adapter) {
    throw new Error('useMapAdapter must be used within a <MapContainer>');
  }
  return adapter;
}
