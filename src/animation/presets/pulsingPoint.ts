import type { PulseAnimationSpec } from '../types';
import type { LngLat } from '../../types/geo';
import { Easing } from '../types';

export function createPulseSpec(
  center: LngLat,
  options: {
    minRadius?: number;
    maxRadius?: number;
    color?: string;
    opacity?: number;
    duration?: number;
  } = {}
): PulseAnimationSpec {
  return {
    type: 'pulse',
    duration: options.duration ?? 1500,
    easing: Easing.easeOut,
    repeat: true,
    payload: {
      center,
      minRadius: options.minRadius ?? 8,
      maxRadius: options.maxRadius ?? 24,
      color: options.color ?? '#e74c3c',
      opacity: options.opacity ?? 0.6,
    },
  };
}
