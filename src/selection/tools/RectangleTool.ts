import type { Polygon } from 'geojson';
import type { NormalizedPointerEvent, SelectionToolType } from '../../types/events';
import type { SelectionTool } from '../types';
import type { LngLat } from '../../types/geo';
import { bboxFromCorners } from '../geo/turfHelpers';

export class RectangleTool implements SelectionTool {
  readonly type: SelectionToolType = 'rectangle';

  private anchor: LngLat | null = null;
  private current: LngLat | null = null;

  onPointerDown(event: NormalizedPointerEvent): void {
    this.anchor = event.lngLat;
    this.current = event.lngLat;
  }

  onPointerMove(event: NormalizedPointerEvent): void {
    if (!this.anchor) return;
    this.current = event.lngLat;
  }

  onPointerUp(event: NormalizedPointerEvent): void {
    this.current = event.lngLat;
  }

  getPreviewGeometry(): Polygon | null {
    if (!this.anchor || !this.current) return null;
    return bboxFromCorners(this.anchor, this.current);
  }

  finalize(): Polygon | null {
    if (!this.anchor || !this.current) return null;
    // Require minimum size
    const dx = Math.abs(this.anchor[0] - this.current[0]);
    const dy = Math.abs(this.anchor[1] - this.current[1]);
    if (dx < 0.0001 && dy < 0.0001) return null;
    return bboxFromCorners(this.anchor, this.current);
  }

  reset(): void {
    this.anchor = null;
    this.current = null;
  }
}
