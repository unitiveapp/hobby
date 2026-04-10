import { useEffect } from 'react';
import { useMapAdapter } from '../../hooks/useMapAdapter';
import { useDataStore } from '../../store/dataStore';
import type { LayerSpec } from '../../adapters/base/MapAdapter';

interface Props {
  id: string;
  sourceId?: string;
  layerSpec?: Partial<LayerSpec>;
  visible?: boolean;
}

const DEFAULT_PAINT = {
  'fill-color': '#3498db',
  'fill-opacity': 0.3,
  'line-color': '#2980b9',
  'line-width': 1,
};

export function GeoJSONLayer({ id, sourceId = `${id}-source`, layerSpec, visible = true }: Props) {
  const adapter = useMapAdapter();
  const mergedCollection = useDataStore((s) => s.mergedCollection);

  // Register source + layer once the adapter is ready
  useEffect(() => {
    if (!adapter) return;

    if (!adapter.hasSource(sourceId)) {
      adapter.addSource(sourceId, { type: 'geojson', data: mergedCollection });
    }
    if (!adapter.hasLayer(id)) {
      adapter.addLayer({
        id,
        type: 'fill',
        sourceId,
        paint: DEFAULT_PAINT,
        visible,
        ...layerSpec,
      });
    }

    return () => {
      if (adapter.hasLayer(id)) adapter.removeLayer(id);
      if (adapter.hasSource(sourceId)) adapter.removeSource(sourceId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adapter]);

  // Sync data updates
  useEffect(() => {
    if (!adapter) return;
    adapter.updateSourceData(sourceId, mergedCollection);
  }, [adapter, mergedCollection, sourceId]);

  // Sync visibility
  useEffect(() => {
    if (!adapter) return;
    adapter.setLayerVisibility(id, visible);
  }, [adapter, visible, id]);

  return null;
}
