import { useEffect } from 'react';
import { useSelectionStore } from '../store/selectionStore';
import { selectionManager } from '../selection/SelectionManager';
import { useMapAdapter } from './useMapAdapter';
import type { SelectionToolType } from '../types/events';
import type { SelectionEvent } from '../types/events';

export function useSelection(): {
  activeTool: SelectionToolType | null;
  selections: SelectionEvent[];
  isMultiSelectMode: boolean;
  setTool(tool: SelectionToolType | null): void;
  clearAll(): void;
  toggleMultiSelect(): void;
  finalizePolygon(): void;
} {
  const adapter = useMapAdapter();

  useEffect(() => {
    if (!adapter) return; // wait until adapter is ready
    selectionManager.attach(adapter);
    return () => selectionManager.detach();
  }, [adapter]);

  const activeTool = useSelectionStore((s) => s.activeTool);
  const selections = useSelectionStore((s) => s.selections);
  const isMultiSelectMode = useSelectionStore((s) => s.isMultiSelectMode);

  return {
    activeTool,
    selections,
    isMultiSelectMode,
    setTool: (tool) => selectionManager.setActiveTool(tool),
    clearAll: () => useSelectionStore.getState().clearAll(),
    toggleMultiSelect: () => useSelectionStore.getState().toggleMultiSelect(),
    finalizePolygon: () => void selectionManager.finalizePolygon(
      useSelectionStore.getState().isMultiSelectMode
    ),
  };
}
