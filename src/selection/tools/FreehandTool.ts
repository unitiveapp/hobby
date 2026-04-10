import type { Polygon } from 'geojson';
import type { NormalizedPointerEvent, SelectionToolType } from '../../types/events';
import type { SelectionTool } from '../types';
import type { LngLat } from '../../types/geo';
import { closeRing, simplifyLine } from '../geo/turfHelpers';

export class FreehandTool implements SelectionTool {
  readonly type: SelectionToolType = 'freehand';

  private points: LngLat[] = [];
  private drawing = false;

  onPointerDown(event: NormalizedPointerEvent): void {
    this.drawing = true;
    this.points = [event.lngLat];
  }

  onPointerMove(event: NormalizedPointerEvent): void {
    if (!this.drawing) return;
    // Throttle: only add point if it moved more than ~0.0001 degrees
    const last = this.points[this.points.length - 1];
    const dx = Math.abs(event.lngLat[0] - last[0]);
    const dy = Math.abs(event.lngLat[1] - last[1]);
    if (dx > 0.0001 || dy > 0.0001) {
      this.points.push(event.lngLat);
    }
  }

  onPointerUp(_event: NormalizedPointerEvent): void {
    this.drawing = false;
  }

  getPreviewGeometry(): Polygon | null {
    if (this.points.length < 2) return null;
    return closeRing(this.points);
  }

  finalize(): Polygon | null {
    if (this.points.length < 3) return null;
    const simplified = simplifyLine(this.points, 0.0001);
    return closeRing(simplified);
  }

  reset(): void {
    this.points = [];
    this.drawing = false;
  }
}
