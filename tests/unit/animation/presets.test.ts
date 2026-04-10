import { describe, it, expect } from 'vitest';
import { createPulseSpec } from '../../../src/animation/presets/pulsingPoint';
import { createMoveSpec } from '../../../src/animation/presets/movingMarker';
import { createRouteSpec, interpolateRoute } from '../../../src/animation/presets/animatedRoute';
import { createTimePlaybackSpec, getFrameIndex } from '../../../src/animation/presets/timePlayback';

describe('createPulseSpec', () => {
  it('returns a PulseAnimationSpec', () => {
    const spec = createPulseSpec([0, 0]);
    expect(spec.type).toBe('pulse');
    expect(spec.repeat).toBe(true);
    expect(spec.payload.center).toEqual([0, 0]);
  });

  it('accepts custom options', () => {
    const spec = createPulseSpec([1, 2], { color: '#00ff00', duration: 500 });
    expect(spec.payload.color).toBe('#00ff00');
    expect(spec.duration).toBe(500);
  });
});

describe('createMoveSpec', () => {
  it('returns a TranslateAnimationSpec', () => {
    const spec = createMoveSpec([0, 0], [1, 1]);
    expect(spec.type).toBe('translate');
    expect(spec.payload.from).toEqual([0, 0]);
    expect(spec.payload.to).toEqual([1, 1]);
  });
});

describe('interpolateRoute', () => {
  const waypoints = [[0, 0], [10, 0], [10, 10]] as [number, number][];

  it('returns first waypoint at progress 0', () => {
    expect(interpolateRoute(waypoints, 0)).toEqual([0, 0]);
  });

  it('returns last waypoint at progress 1', () => {
    expect(interpolateRoute(waypoints, 1)[0]).toBeCloseTo(10);
    expect(interpolateRoute(waypoints, 1)[1]).toBeCloseTo(10);
  });

  it('interpolates midpoint', () => {
    const mid = interpolateRoute(waypoints, 0.5);
    expect(mid[0]).toBeCloseTo(10);
    expect(mid[1]).toBeCloseTo(0);
  });
});

describe('getFrameIndex', () => {
  const timestamps = ['t1', 't2', 't3', 't4'];

  it('returns 0 at progress 0', () => {
    expect(getFrameIndex(0, timestamps)).toBe(0);
  });

  it('returns last index at progress 1', () => {
    expect(getFrameIndex(1, timestamps)).toBe(3);
  });

  it('returns correct mid-frame', () => {
    expect(getFrameIndex(0.5, timestamps)).toBe(2);
  });
});
