import { useEffect } from 'react';
import { useMapAdapter } from '../../hooks/useMapAdapter';
import { useMapStore } from '../../store/mapStore';

interface Props {
  id: string;
  tiles: string[];
  minZoom?: number;
  maxZoom?: number;
  visible?: boolean;
}

export function TileLayer({ id, tiles, minZoom, maxZoom, visible = true }: Props) {
  const adapter = useMapAdapter();
  const isReady = useMapStore((s) => s.isReady);

  useEffect(() => {
    if (!isReady) return;

    const sourceId = `${id}-source`;
    if (!adapter.hasSource(sourceId)) {
      adapter.addSource(sourceId, { type: 'raster', tiles, minzoom: minZoom, maxzoom: maxZoom });
    }
    if (!adapter.hasLayer(id)) {
      adapter.addLayer({ id, type: 'raster', sourceId, visible });
    }

    return () => {
      if (adapter.hasLayer(id)) adapter.removeLayer(id);
      if (adapter.hasSource(sourceId)) adapter.removeSource(sourceId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;
    adapter.setLayerVisibility(id, visible);
  }, [visible, id, adapter, isReady]);

  return null;
}
