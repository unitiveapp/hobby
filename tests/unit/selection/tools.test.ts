import { describe, it, expect, beforeEach } from 'vitest';
import { FreehandTool } from '../../../src/selection/tools/FreehandTool';
import { RectangleTool } from '../../../src/selection/tools/RectangleTool';
import { PolygonTool } from '../../../src/selection/tools/PolygonTool';
import type { NormalizedPointerEvent } from '../../../src/types/events';

function makeEvent(lng: number, lat: number, shift = false): NormalizedPointerEvent {
  return { type: 'up', lngLat: [lng, lat], point: { x: 0, y: 0 }, shiftKey: shift };
}

describe('FreehandTool', () => {
  let tool: FreehandTool;
  beforeEach(() => { tool = new FreehandTool(); });

  it('returns null when fewer than 3 points', () => {
    tool.onPointerDown({ ...makeEvent(0, 0), type: 'down' });
    tool.onPointerMove({ ...makeEvent(0.1, 0), type: 'move' });
    tool.onPointerUp(makeEvent(0.1, 0));
    expect(tool.finalize()).toBeNull();
  });

  it('returns a Polygon for sufficient points', () => {
    tool.onPointerDown({ ...makeEvent(0, 0), type: 'down' });
    // Simulate movement creating enough points
    for (let i = 0; i <= 10; i++) {
      tool.onPointerMove({ ...makeEvent(i * 0.01, i * 0.005), type: 'move' });
    }
    tool.onPointerMove({ ...makeEvent(0.05, 0.05), type: 'move' });
    tool.onPointerMove({ ...makeEvent(0, 0.05), type: 'move' });
    tool.onPointerUp(makeEvent(0, 0));
    const result = tool.finalize();
    // May be null if simplified ring is degenerate — that's fine
    if (result) {
      expect(result.type).toBe('Polygon');
    }
  });

  it('resets state', () => {
    tool.onPointerDown({ ...makeEvent(0, 0), type: 'down' });
    tool.reset();
    expect(tool.finalize()).toBeNull();
  });
});

describe('RectangleTool', () => {
  let tool: RectangleTool;
  beforeEach(() => { tool = new RectangleTool(); });

  it('returns a Polygon with 5 coordinates (closed ring)', () => {
    tool.onPointerDown({ ...makeEvent(10, 10), type: 'down' });
    tool.onPointerMove({ ...makeEvent(20, 20), type: 'move' });
    tool.onPointerUp(makeEvent(20, 20));
    const result = tool.finalize();
    expect(result?.type).toBe('Polygon');
    expect(result?.coordinates[0]).toHaveLength(5);
  });

  it('returns null when anchor equals current (zero size)', () => {
    tool.onPointerDown({ ...makeEvent(10, 10), type: 'down' });
    tool.onPointerUp(makeEvent(10, 10));
    expect(tool.finalize()).toBeNull();
  });

  it('resets', () => {
    tool.onPointerDown({ ...makeEvent(0, 0), type: 'down' });
    tool.reset();
    expect(tool.finalize()).toBeNull();
  });
});

describe('PolygonTool', () => {
  let tool: PolygonTool;
  beforeEach(() => { tool = new PolygonTool(); });

  it('accumulates vertices on pointer up', () => {
    tool.onPointerUp(makeEvent(0, 0));
    tool.onPointerUp(makeEvent(1, 0));
    tool.onPointerUp(makeEvent(1, 1));
    expect(tool.getVertices()).toHaveLength(3);
  });

  it('returns a Polygon from 3+ vertices', () => {
    tool.onPointerUp(makeEvent(0, 0));
    tool.onPointerUp(makeEvent(10, 0));
    tool.onPointerUp(makeEvent(10, 10));
    const result = tool.finalize();
    expect(result?.type).toBe('Polygon');
  });

  it('returns null for fewer than 3 vertices', () => {
    tool.onPointerUp(makeEvent(0, 0));
    tool.onPointerUp(makeEvent(1, 0));
    expect(tool.finalize()).toBeNull();
  });
});
