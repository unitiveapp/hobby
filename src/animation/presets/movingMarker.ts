import type { TranslateAnimationSpec } from '../types';
import type { LngLat } from '../../types/geo';
import { Easing } from '../types';

export function createMoveSpec(
  from: LngLat,
  to: LngLat,
  options: { duration?: number; repeat?: boolean } = {}
): TranslateAnimationSpec {
  return {
    type: 'translate',
    duration: options.duration ?? 2000,
    easing: Easing.easeInOut,
    repeat: options.repeat ?? false,
    payload: { from, to },
  };
}
