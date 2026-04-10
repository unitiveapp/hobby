import type { AnimationDriver, AnimationHandle, AnimationSpec, AnimationTarget } from '../types';
import { Easing } from '../types';

/**
 * Web animation driver using requestAnimationFrame.
 * Drives position/opacity/scale updates by calling frame callbacks —
 * the actual map API calls happen in the layer component that owns the marker.
 */

function createRafHandle(
  duration: number,
  easingFn: (t: number) => number,
  repeat: boolean | number,
  delay: number,
  onFrame: (progress: number) => void,
  onComplete: () => void
): AnimationHandle {
  let startTime: number | null = null;
  let pausedAt: number | null = null;
  let rafId: number | null = null;
  let elapsed = 0;
  let loopsRemaining = repeat === true ? Infinity : (typeof repeat === 'number' ? repeat : 1);
  let frameCallbacks: Array<(p: number) => void> = [onFrame];
  let completeCallbacks: Array<() => void> = [onComplete];
  let stopped = false;

  function tick(now: number): void {
    if (stopped) return;

    if (startTime === null) startTime = now + delay;
    if (now < startTime) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    const raw = (now - startTime + elapsed) / duration;
    const clamped = Math.min(raw, 1);
    const progress = easingFn(clamped);

    frameCallbacks.forEach((cb) => cb(progress));

    if (clamped < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      loopsRemaining -= 1;
      if (loopsRemaining > 0) {
        elapsed = 0;
        startTime = null;
        rafId = requestAnimationFrame(tick);
      } else {
        completeCallbacks.forEach((cb) => cb());
      }
    }
  }

  rafId = requestAnimationFrame(tick);

  return {
    pause() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      pausedAt = performance.now();
    },
    resume() {
      if (pausedAt !== null && startTime !== null) {
        elapsed += pausedAt - startTime;
        startTime = null;
        pausedAt = null;
        rafId = requestAnimationFrame(tick);
      }
    },
    stop() {
      stopped = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    },
    seek(progress: number) {
      frameCallbacks.forEach((cb) => cb(easingFn(Math.max(0, Math.min(1, progress)))));
    },
    onComplete(cb) {
      completeCallbacks.push(cb);
    },
    onFrame(cb) {
      frameCallbacks.push(cb);
    },
  };
}

export class WebAnimationDriver implements AnimationDriver {
  readonly platform = 'web' as const;
  private handles: AnimationHandle[] = [];

  start(spec: AnimationSpec, _target: AnimationTarget): AnimationHandle {
    const easing = spec.easing ?? Easing.easeInOut;
    const handle = createRafHandle(
      spec.duration,
      easing,
      spec.repeat ?? 1,
      spec.delay ?? 0,
      () => {},
      () => {}
    );
    this.handles.push(handle);
    return handle;
  }

  stopAll(): void {
    this.handles.forEach((h) => h.stop());
    this.handles = [];
  }
}
