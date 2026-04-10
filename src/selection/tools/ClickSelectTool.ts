/**
 * ClickSelectTool — selects the region or feature under the click point.
 * Unlike the drawing tools, this produces the SelectionEvent directly
 * by calling the provided queryFeatures and regionLookup callbacks.
 */
import type { Polygon } from 'geojson';
import type { NormalizedPointerEvent, SelectionToolType } from '../../types/events';
import type { SelectionTool } from '../types';
import type { LngLat } from '../../types/geo';
import * as turf from '@turf/turf';

export class ClickSelectTool implements SelectionTool {
  readonly type: SelectionToolType = 'click';

  private lastPoint: LngLat | null = null;

  onPointerDown(_event: NormalizedPointerEvent): void {}
  onPointerMove(_event: NormalizedPointerEvent): void {}

  onPointerUp(event: NormalizedPointerEvent): void {
    this.lastPoint = event.lngLat;
  }

  getPreviewGeometry(): Polygon | null {
    if (!this.lastPoint) return null;
    // Show a small circle as preview
    return turf.circle(this.lastPoint, 0.1, { units: 'kilometers', steps: 16 })
      .geometry as Polygon;
  }

  finalize(): Polygon | null {
    if (!this.lastPoint) return null;
    // Return a tiny bounding box around the click point
    const [lng, lat] = this.lastPoint;
    const delta = 0.0001;
    return turf.bboxPolygon([lng - delta, lat - delta, lng + delta, lat + delta])
      .geometry as Polygon;
  }

  reset(): void {
    this.lastPoint = null;
  }

  getLastPoint(): LngLat | null {
    return this.lastPoint;
  }
}
