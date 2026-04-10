import type { Polygon, MultiPolygon } from 'geojson';
import type { NormalizedPointerEvent, SelectionEvent, SelectionToolType } from '../types/events';
import type { SelectionState, SelectionManagerListener } from './types';
import type { MapAdapter } from '../adapters/base/MapAdapter';
import { FreehandTool } from './tools/FreehandTool';
import { RectangleTool } from './tools/RectangleTool';
import { PolygonTool } from './tools/PolygonTool';
import { ClickSelectTool } from './tools/ClickSelectTool';
import {
  computeArea,
  computeBBox,
  computeCentroid,
  featuresWithin,
} from './geo/turfHelpers';
import { lookupRegion } from './geo/regionLookup';
import { useDataStore } from '../store/dataStore';
import { useSelectionStore } from '../store/selectionStore';
import { generateId } from '../utils/idgen';
import * as turf from '@turf/turf';

type ToolMap = Record<SelectionToolType, { onPointerDown: NormalizedPointerEvent['type'] extends 'down' ? never : never } & InstanceType<typeof FreehandTool>>;

export class SelectionManager {
  private state: SelectionState = 'idle';
  private activeTool: InstanceType<typeof FreehandTool> | InstanceType<typeof RectangleTool> | InstanceType<typeof PolygonTool> | InstanceType<typeof ClickSelectTool> | null = null;
  private listeners: Set<SelectionManagerListener> = new Set();
  private unsubPointer: (() => void) | null = null;

  private tools = {
    freehand: new FreehandTool(),
    rectangle: new RectangleTool(),
    polygon: new PolygonTool(),
    click: new ClickSelectTool(),
  };

  /** Attach to a map adapter to receive pointer events */
  attach(adapter: MapAdapter): void {
    this.unsubPointer?.();
    this.unsubPointer = adapter.onPointer((event) => this.handlePointer(event));
  }

  detach(): void {
    this.unsubPointer?.();
    this.unsubPointer = null;
  }

  setActiveTool(type: SelectionToolType | null): void {
    this.activeTool?.reset();
    this.activeTool = type ? this.tools[type] : null;
    this.setState('idle');
    useSelectionStore.getState().setActiveTool(type);
    useSelectionStore.getState().setDrawingPreview(null);
  }

  subscribe(listener: SelectionManagerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private handlePointer(event: NormalizedPointerEvent): void {
    if (!this.activeTool) return;

    if (event.type === 'down') {
      this.activeTool.onPointerDown(event);
      this.setState('drawing');
    } else if (event.type === 'move') {
      this.activeTool.onPointerMove(event);
      // Update live preview
      const preview = this.activeTool.getPreviewGeometry();
      useSelectionStore.getState().setDrawingPreview(preview);
    } else if (event.type === 'up') {
      this.activeTool.onPointerUp(event);

      // For polygon tool, only finalize on double-click
      if (this.activeTool.type === 'polygon') {
        useSelectionStore.getState().setDrawingPreview(this.activeTool.getPreviewGeometry());
        return;
      }

      this.finalize(event.shiftKey);
    }
  }

  /** Manually trigger finalization (e.g. from a "Done" button for polygon tool) */
  async finalizePolygon(isMultiSelect = false): Promise<void> {
    if (this.activeTool?.type === 'polygon') {
      await this.finalize(isMultiSelect);
    }
  }

  private async finalize(isMultiSelect: boolean): Promise<void> {
    if (!this.activeTool) return;
    const polygon = this.activeTool.finalize();
    if (!polygon) {
      this.setState('idle');
      return;
    }

    this.setState('confirming');

    const event = await this.buildEvent(polygon, isMultiSelect);
    this.activeTool.reset();
    this.setState('selected');

    useSelectionStore.getState().addSelection(event);
    this.listeners.forEach((l) => l('selectionAdded', event));
  }

  private async buildEvent(polygon: Polygon, isMultiSelect: boolean): Promise<SelectionEvent> {
    const feature = turf.feature(polygon);
    const areaKm2 = computeArea(feature);
    const centroid = computeCentroid(feature);
    const bbox = computeBBox(feature);

    const mergedCollection = useDataStore.getState().mergedCollection;
    const containedFeatureIds = featuresWithin(feature, mergedCollection);

    // Async region lookup — run deferred so it doesn't block
    let regionInfo: SelectionEvent['regionInfo'];
    try {
      regionInfo = await lookupRegion([centroid.coordinates[0], centroid.coordinates[1]]);
    } catch {
      regionInfo = undefined;
    }

    return {
      id: generateId('sel'),
      tool: this.activeTool!.type,
      geometry: polygon as Polygon | MultiPolygon,
      bbox,
      areaKm2,
      centroid,
      containedFeatureIds,
      regionInfo,
      isMultiSelect,
      timestamp: Date.now(),
    };
  }

  private setState(state: SelectionState): void {
    this.state = state;
    this.listeners.forEach((l) => l('stateChange'));
  }

  getState(): SelectionState {
    return this.state;
  }
}

export const selectionManager = new SelectionManager();
