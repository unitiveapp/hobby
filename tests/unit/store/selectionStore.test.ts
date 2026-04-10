import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectionStore } from '../../../src/store/selectionStore';
import type { SelectionEvent } from '../../../src/types/events';

function makeEvent(id: string): SelectionEvent {
  return {
    id,
    tool: 'rectangle',
    geometry: {
      type: 'Polygon',
      coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]],
    },
    bbox: [0, 0, 1, 1],
    areaKm2: 1,
    centroid: { type: 'Point', coordinates: [0.5, 0.5] },
    containedFeatureIds: [],
    isMultiSelect: false,
    timestamp: Date.now(),
  };
}

describe('useSelectionStore', () => {
  beforeEach(() => {
    useSelectionStore.setState({
      activeTool: null,
      selections: [],
      activeSelectionId: null,
      isMultiSelectMode: false,
      drawingPreview: null,
    });
  });

  it('sets active tool', () => {
    useSelectionStore.getState().setActiveTool('freehand');
    expect(useSelectionStore.getState().activeTool).toBe('freehand');
  });

  it('clears preview when tool changes', () => {
    useSelectionStore.setState({ drawingPreview: { type: 'Point', coordinates: [0, 0] } });
    useSelectionStore.getState().setActiveTool('rectangle');
    expect(useSelectionStore.getState().drawingPreview).toBeNull();
  });

  it('adds a selection', () => {
    const event = makeEvent('sel1');
    useSelectionStore.getState().addSelection(event);
    expect(useSelectionStore.getState().selections).toHaveLength(1);
    expect(useSelectionStore.getState().activeSelectionId).toBe('sel1');
  });

  it('replaces selections when not in multi-select mode', () => {
    useSelectionStore.getState().addSelection(makeEvent('sel1'));
    useSelectionStore.getState().addSelection(makeEvent('sel2'));
    expect(useSelectionStore.getState().selections).toHaveLength(1);
    expect(useSelectionStore.getState().selections[0].id).toBe('sel2');
  });

  it('accumulates selections in multi-select mode', () => {
    useSelectionStore.setState({ isMultiSelectMode: true });
    useSelectionStore.getState().addSelection(makeEvent('sel1'));
    useSelectionStore.getState().addSelection(makeEvent('sel2'));
    expect(useSelectionStore.getState().selections).toHaveLength(2);
  });

  it('removes a selection', () => {
    useSelectionStore.getState().addSelection(makeEvent('sel1'));
    useSelectionStore.getState().removeSelection('sel1');
    expect(useSelectionStore.getState().selections).toHaveLength(0);
  });

  it('clears all', () => {
    useSelectionStore.setState({ isMultiSelectMode: true });
    useSelectionStore.getState().addSelection(makeEvent('a'));
    useSelectionStore.getState().addSelection(makeEvent('b'));
    useSelectionStore.getState().clearAll();
    expect(useSelectionStore.getState().selections).toHaveLength(0);
  });

  it('toggles multi-select mode', () => {
    expect(useSelectionStore.getState().isMultiSelectMode).toBe(false);
    useSelectionStore.getState().toggleMultiSelect();
    expect(useSelectionStore.getState().isMultiSelectMode).toBe(true);
  });
});
