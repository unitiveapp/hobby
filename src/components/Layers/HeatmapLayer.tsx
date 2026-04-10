import { useEffect } from 'react';
import { useMapAdapter } from '../../hooks/useMapAdapter';
import { useMapStore } from '../../store/mapStore';
import type { FeatureCollection } from 'geojson';

interface Props {
  id: string;
  data: FeatureCollection;
  weightProperty?: string;
  radius?: number;
  intensity?: number;
  visible?: boolean;
}

export function HeatmapLayer({
  id,
  data,
  weightProperty,
  radius = 20,
  intensity = 1,
  visible = true,
}: Props) {
  const adapter = useMapAdapter();
  const isReady = useMapStore((s) => s.isReady);
  const sourceId = `${id}-source`;

  useEffect(() => {
    if (!isReady) return;

    adapter.addSource(sourceId, { type: 'geojson', data });
    adapter.addLayer({
      id,
      type: 'heatmap',
      sourceId,
      visible,
      paint: {
        'heatmap-radius': radius,
        'heatmap-intensity': intensity,
        'heatmap-weight': weightProperty
          ? ['get', weightProperty]
          : 1,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)',
        ],
      },
    });

    return () => {
      if (adapter.hasLayer(id)) adapter.removeLayer(id);
      if (adapter.hasSource(sourceId)) adapter.removeSource(sourceId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;
    adapter.updateSourceData(sourceId, data);
  }, [data, sourceId, adapter, isReady]);

  return null;
}
