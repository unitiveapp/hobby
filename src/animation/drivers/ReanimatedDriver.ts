/**
 * ReanimatedDriver wraps react-native-reanimated for iOS/Android.
 * Creates shared values and returns AnimationHandle wrappers.
 *
 * Components use the exported `sharedValues` map to access the animated
 * value for a given animation ID and bind it to Animated.View styles.
 */
import Animated, {
  withTiming,
  withRepeat,
  withDelay,
  cancelAnimation,
  runOnJS,
  Easing as ReanimatedEasing,
} from 'react-native-reanimated';
import type { AnimationDriver, AnimationHandle, AnimationSpec, AnimationTarget } from '../types';

/** Map from animationId → shared progress value (0..1) */
export const sharedProgressValues = new Map<string, Animated.SharedValue<number>>();

let idCounter = 0;

export class ReanimatedDriver implements AnimationDriver {
  readonly platform = 'native' as const;
  private animIds: string[] = [];

  start(spec: AnimationSpec, target: AnimationTarget): AnimationHandle {
    const animId = `${target.targetId}_${++idCounter}`;
    const sv = Animated.useSharedValue(0);
    sharedProgressValues.set(animId, sv);
    this.animIds.push(animId);

    const duration = spec.duration;
    const repeat = spec.repeat === true ? -1 : (spec.repeat ?? 1);
    const delay = spec.delay ?? 0;

    let completeCallbacks: Array<() => void> = [];
    let frameCallbacks: Array<(p: number) => void> = [];

    const animation = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration,
          easing: ReanimatedEasing.inOut(ReanimatedEasing.ease),
        }),
        repeat,
        false,
        () => {
          'worklet';
          runOnJS(() => completeCallbacks.forEach((cb) => cb()))();
        }
      )
    );

    sv.value = animation;

    return {
      pause() {
        cancelAnimation(sv);
      },
      resume() {
        sv.value = withTiming(1, { duration });
      },
      stop() {
        cancelAnimation(sv);
        sv.value = 0;
        sharedProgressValues.delete(animId);
      },
      seek(progress: number) {
        cancelAnimation(sv);
        sv.value = Math.max(0, Math.min(1, progress));
      },
      onComplete(cb) {
        completeCallbacks.push(cb);
      },
      onFrame(cb) {
        frameCallbacks.push(cb);
      },
    };
  }

  stopAll(): void {
    for (const id of this.animIds) {
      const sv = sharedProgressValues.get(id);
      if (sv) cancelAnimation(sv);
      sharedProgressValues.delete(id);
    }
    this.animIds = [];
  }
}
