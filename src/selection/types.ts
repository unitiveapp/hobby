import type { Polygon, MultiPolygon } from 'geojson';
import type { NormalizedPointerEvent, SelectionEvent, SelectionToolType } from '../types/events';

// ─── Selection Tool State ─────────────────────────────────────────────────────

export type SelectionState = 'idle' | 'drawing' | 'confirming' | 'selected';

// ─── Selection Tool Interface ─────────────────────────────────────────────────

export interface SelectionTool {
  readonly type: SelectionToolType;

  onPointerDown(event: NormalizedPointerEvent): void;
  onPointerMove(event: NormalizedPointerEvent): void;
  onPointerUp(event: NormalizedPointerEvent): void;

  /** Returns a live preview geometry while drawing, or null if not started */
  getPreviewGeometry(): Polygon | null;

  /** Finalise the drawn shape and return the polygon, or null if invalid */
  finalize(): Polygon | null;

  /** Reset tool to initial state */
  reset(): void;
}

// ─── Region Lookup Result ─────────────────────────────────────────────────────

export interface RegionInfo {
  countryCode?: string;
  countryName?: string;
  regionName?: string;
  adminLevel?: number;
}

// ─── Selection Manager Events ─────────────────────────────────────────────────

export type SelectionManagerEvent = 'stateChange' | 'selectionAdded' | 'selectionRemoved' | 'cleared';

export type SelectionManagerListener = (event: SelectionManagerEvent, data?: SelectionEvent) => void;

// Re-export for convenience
export type { SelectionEvent, SelectionToolType, NormalizedPointerEvent };
