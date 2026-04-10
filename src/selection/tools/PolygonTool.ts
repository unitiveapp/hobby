/**
 * PolygonTool — click to add vertices, double-click or call finalize() to close.
 */
import type { Polygon } from 'geojson';
import type { NormalizedPointerEvent, SelectionToolType } from '../../types/events';
import type { SelectionTool } from '../types';
import type { LngLat } from '../../types/geo';
import { closeRing } from '../geo/turfHelpers';

const DOUBLE_CLICK_MS = 300;

export class PolygonTool implements SelectionTool {
  readonly type: SelectionToolType = 'polygon';

  private vertices: LngLat[] = [];
  private lastClickTime = 0;

  onPointerDown(_event: NormalizedPointerEvent): void {}

  onPointerMove(_event: NormalizedPointerEvent): void {}

  onPointerUp(event: NormalizedPointerEvent): void {
    const now = Date.now();
    const isDoubleClick = now - this.lastClickTime < DOUBLE_CLICK_MS;
    this.lastClickTime = now;

    if (isDoubleClick && this.vertices.length >= 3) {
      // Double-click closes the polygon (handled by SelectionManager calling finalize)
      return;
    }

    this.vertices.push(event.lngLat);
  }

  getPreviewGeometry(): Polygon | null {
    if (this.vertices.length < 2) return null;
    return closeRing(this.vertices);
  }

  finalize(): Polygon | null {
    if (this.vertices.length < 3) return null;
    return closeRing(this.vertices);
  }

  reset(): void {
    this.vertices = [];
    this.lastClickTime = 0;
  }

  getVertices(): LngLat[] {
    return [...this.vertices];
  }
}
