import { create } from 'zustand';
import type { Geometry } from 'geojson';
import type { SelectionEvent, SelectionToolType } from '../types/events';

interface SelectionState {
  activeTool: SelectionToolType | null;
  selections: SelectionEvent[];
  activeSelectionId: string | null;
  isMultiSelectMode: boolean;
  /** Live preview geometry shown while the user is drawing */
  drawingPreview: Geometry | null;

  setActiveTool(tool: SelectionToolType | null): void;
  addSelection(event: SelectionEvent): void;
  removeSelection(id: string): void;
  setActiveSelection(id: string | null): void;
  clearAll(): void;
  toggleMultiSelect(): void;
  setDrawingPreview(geom: Geometry | null): void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  activeTool: null,
  selections: [],
  activeSelectionId: null,
  isMultiSelectMode: false,
  drawingPreview: null,

  setActiveTool: (tool) => set({ activeTool: tool, drawingPreview: null }),

  addSelection: (event) =>
    set((state) => ({
      selections: state.isMultiSelectMode
        ? [...state.selections, event]
        : [event],
      activeSelectionId: event.id,
      drawingPreview: null,
    })),

  removeSelection: (id) =>
    set((state) => ({
      selections: state.selections.filter((s) => s.id !== id),
      activeSelectionId:
        state.activeSelectionId === id ? null : state.activeSelectionId,
    })),

  setActiveSelection: (id) => set({ activeSelectionId: id }),

  clearAll: () =>
    set({ selections: [], activeSelectionId: null, drawingPreview: null }),

  toggleMultiSelect: () =>
    set((state) => ({ isMultiSelectMode: !state.isMultiSelectMode })),

  setDrawingPreview: (geom) => set({ drawingPreview: geom }),
}));
