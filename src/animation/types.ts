import type { LngLat } from '../types/geo';

// ─── Easing ───────────────────────────────────────────────────────────────────

export type EasingFn = (t: number) => number;

export const Easing = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
} as const;

// ─── Animation Payloads ───────────────────────────────────────────────────────

export interface TranslatePayload {
  /** Start position [lng, lat] */
  from: LngLat;
  /** End position [lng, lat] */
  to: LngLat;
}

export interface PulsePayload {
  /** Center of the pulsing point */
  center: LngLat;
  /** Min radius in pixels */
  minRadius: number;
  /** Max radius in pixels */
  maxRadius: number;
  /** Color of the pulse ring */
  color: string;
  opacity: number;
}

export interface RoutePayload {
  /** Ordered waypoints along the route */
  waypoints: LngLat[];
  /** Speed in km/h (used to compute step durations) */
  speedKmh?: number;
}

export interface TimePlaybackPayload {
  /** ISO timestamps for each "frame" of data */
  timestamps: string[];
  /** Current frame index (controlled externally via seek) */
  currentIndex?: number;
}

// ─── Animation Spec ───────────────────────────────────────────────────────────

export type AnimationSpecType = 'translate' | 'pulse' | 'route' | 'timePlayback';

export interface AnimationSpecBase {
  type: AnimationSpecType;
  /** Total duration in ms */
  duration: number;
  easing?: EasingFn;
  /** true = loop forever, number = loop N times */
  repeat?: boolean | number;
  /** Delay before starting in ms */
  delay?: number;
}

export interface TranslateAnimationSpec extends AnimationSpecBase {
  type: 'translate';
  payload: TranslatePayload;
}

export interface PulseAnimationSpec extends AnimationSpecBase {
  type: 'pulse';
  payload: PulsePayload;
}

export interface RouteAnimationSpec extends AnimationSpecBase {
  type: 'route';
  payload: RoutePayload;
}

export interface TimePlaybackAnimationSpec extends AnimationSpecBase {
  type: 'timePlayback';
  payload: TimePlaybackPayload;
}

export type AnimationSpec =
  | TranslateAnimationSpec
  | PulseAnimationSpec
  | RouteAnimationSpec
  | TimePlaybackAnimationSpec;

// ─── Animation Handle ─────────────────────────────────────────────────────────

export interface AnimationHandle {
  pause(): void;
  resume(): void;
  stop(): void;
  /** Seek to progress 0..1 */
  seek(progress: number): void;
  onComplete(cb: () => void): void;
  onFrame(cb: (progress: number) => void): void;
}

// ─── Animation Target ─────────────────────────────────────────────────────────

export interface AnimationTarget {
  /** ID of the marker / feature to animate */
  targetId: string;
  /** Type of map element */
  targetType: 'marker' | 'layer' | 'source';
}

// ─── Animation Driver Interface ───────────────────────────────────────────────

export interface AnimationDriver {
  readonly platform: 'native' | 'web';
  start(spec: AnimationSpec, target: AnimationTarget): AnimationHandle;
  stopAll(): void;
}
