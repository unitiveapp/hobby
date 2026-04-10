import { useEffect } from 'react';
import { useMapAdapter } from '../../hooks/useMapAdapter';
import { useMapStore } from '../../store/mapStore';
import type { FeatureCollection } from 'geojson';

interface Props {
  id: string;
  data: FeatureCollection;
  /** Property name in feature.properties used for color interpolation */
  valueProperty: string;
  /** [minValue, maxValue] for color scale */
  domain: [number, number];
  /** [lowColor, highColor] */
  colorRange?: [string, string];
  visible?: boolean;
}

export function ChoroplethLayer({
  id,
  data,
  valueProperty,
  domain,
  colorRange = ['#fee5d9', '#a50f15'],
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
      type: 'fill',
      sourceId,
      visible,
      paint: {
        'fill-color': [
          'interpolate', ['linear'],
          ['coalesce', ['get', valueProperty], 0],
          domain[0], colorRange[0],
          domain[1], colorRange[1],
        ],
        'fill-opacity': 0.75,
        'fill-outline-color': 'rgba(0,0,0,0.15)',
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
