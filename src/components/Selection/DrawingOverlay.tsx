/**
 * DrawingOverlay — renders the active drawing preview directly on the map.
 *
 * Uses three MapLibre/Mapbox layers (fill, line, vertices) so the preview
 * geometry scales perfectly with every pan/zoom — exactly like
 * @mapbox/mapbox-gl-draw.  Completed selections are also shown as translucent
 * fills so the user can see what they've already captured.
 */
import { useEffect } from 'react';
import { useMapAdapter } from '../../hooks/useMapAdapter';
import { useSelectionStore } from '../../store/selectionStore';
import type { MapAdapter } from '../../adapters/base/MapAdapter';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';

const PREVIEW_SOURCE  = '__drawing-preview';
const SELECTED_SOURCE = '__drawing-selected';
const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

const LAYER_DEFS: Array<Parameters<MapAdapter['addLayer']>[0]> = [
  { id: '__selected-fill',    type: 'fill',   sourceId: SELECTED_SOURCE,
    paint: { 'fill-color': '#3498db', 'fill-opacity': 0.15 } },
  { id: '__selected-line',    type: 'line',   sourceId: SELECTED_SOURCE,
    paint: { 'line-color': '#2980b9', 'line-width': 1.5, 'line-dasharray': [3, 2] } },
  { id: '__preview-fill',     type: 'fill',   sourceId: PREVIEW_SOURCE,
    paint: { 'fill-color': '#f39c12', 'fill-opacity': 0.25 } },
  { id: '__preview-line',     type: 'line',   sourceId: PREVIEW_SOURCE,
    paint: { 'line-color': '#e67e22', 'line-width': 2.5 } },
  { id: '__preview-vertices', type: 'circle', sourceId: PREVIEW_SOURCE,
    paint: { 'circle-radius': 5, 'circle-color': '#fff',
             'circle-stroke-color': '#e67e22', 'circle-stroke-width': 2 } },
];

function setupSourcesAndLayers(adapter: MapAdapter) {
  if (!adapter.hasSource(PREVIEW_SOURCE))
    adapter.addSource(PREVIEW_SOURCE,  { type: 'geojson', data: EMPTY_FC });
  if (!adapter.hasSource(SELECTED_SOURCE))
    adapter.addSource(SELECTED_SOURCE, { type: 'geojson', data: EMPTY_FC });
  LAYER_DEFS.forEach((l) => { if (!adapter.hasLayer(l.id)) adapter.addLayer(l); });
}

function teardownSourcesAndLayers(adapter: MapAdapter) {
  [...LAYER_DEFS].reverse().forEach(({ id }) => {
    if (adapter.hasLayer(id)) adapter.removeLayer(id);
  });
  if (adapter.hasSource(PREVIEW_SOURCE))  adapter.removeSource(PREVIEW_SOURCE);
  if (adapter.hasSource(SELECTED_SOURCE)) adapter.removeSource(SELECTED_SOURCE);
}

export function DrawingOverlay() {
  const adapter = useMapAdapter();
  const drawingPreview = useSelectionStore((s) => s.drawingPreview);
  const selections     = useSelectionStore((s) => s.selections);

  // ── Bootstrap layers once the adapter is ready ──────────────────────────────
  useEffect(() => {
    if (!adapter) return;
    setupSourcesAndLayers(adapter);

    // Re-add layers after a style swap (skin change wipes all custom layers)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (adapter as any).map;
    const onStyleLoad = () => setupSourcesAndLayers(adapter);
    map?.on('style.load', onStyleLoad);

    return () => {
      map?.off('style.load', onStyleLoad);
      teardownSourcesAndLayers(adapter);
    };
  }, [adapter]);

  // ── Push live drawing preview into the map source ───────────────────────────
  useEffect(() => {
    if (!adapter) return;
    const fc: FeatureCollection = drawingPreview
      ? { type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: drawingPreview, properties: {} }] }
      : EMPTY_FC;
    adapter.updateSourceData(PREVIEW_SOURCE, fc);
  }, [adapter, drawingPreview]);

  // ── Push completed selections into the map source ───────────────────────────
  useEffect(() => {
    if (!adapter) return;
    const fc: FeatureCollection = {
      type: 'FeatureCollection',
      features: selections.map((sel) => ({
        type: 'Feature',
        geometry: sel.geometry as Polygon | MultiPolygon,
        properties: { id: sel.id },
      })),
    };
    adapter.updateSourceData(SELECTED_SOURCE, fc);
  }, [adapter, selections]);

  return null;
}
