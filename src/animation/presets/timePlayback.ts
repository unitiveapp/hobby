import type { TimePlaybackAnimationSpec } from '../types';
import { Easing } from '../types';

/** Create a time-playback animation that steps through timestamped data frames */
export function createTimePlaybackSpec(
  timestamps: string[],
  options: { duration?: number; repeat?: boolean } = {}
): TimePlaybackAnimationSpec {
  return {
    type: 'timePlayback',
    duration: options.duration ?? timestamps.length * 1000,
    easing: Easing.linear,
    repeat: options.repeat ?? false,
    payload: {
      timestamps,
      currentIndex: 0,
    },
  };
}

/** Given a progress 0..1 and timestamp array, return the current frame index */
export function getFrameIndex(progress: number, timestamps: string[]): number {
  if (timestamps.length === 0) return 0;
  return Math.min(Math.floor(progress * timestamps.length), timestamps.length - 1);
}
