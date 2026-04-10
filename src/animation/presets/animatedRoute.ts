import type { RouteAnimationSpec } from '../types';
import type { LngLat } from '../../types/geo';
import { Easing } from '../types';

/** Create a route animation that moves a marker along a series of waypoints */
export function createRouteSpec(
  waypoints: LngLat[],
  options: { speedKmh?: number; duration?: number; repeat?: boolean } = {}
): RouteAnimationSpec {
  return {
    type: 'route',
    duration: options.duration ?? 10000,
    easing: Easing.linear,
    repeat: options.repeat ?? false,
    payload: {
      waypoints,
      speedKmh: options.speedKmh ?? 60,
    },
  };
}

/**
 * Interpolate a position along a route given progress 0..1.
 * Simple linear interpolation between waypoints.
 */
export function interpolateRoute(waypoints: LngLat[], progress: number): LngLat {
  if (waypoints.length === 0) return [0, 0];
  if (waypoints.length === 1) return waypoints[0];

  const totalSegments = waypoints.length - 1;
  const segmentProgress = progress * totalSegments;
  const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
  const segmentFraction = segmentProgress - segmentIndex;

  const from = waypoints[segmentIndex];
  const to = waypoints[segmentIndex + 1];

  return [
    from[0] + (to[0] - from[0]) * segmentFraction,
    from[1] + (to[1] - from[1]) * segmentFraction,
  ];
}
