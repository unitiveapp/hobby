import { getPlatform } from '../utils/platform';
import { WebAnimationDriver } from './drivers/WebAnimationDriver';
import { ReanimatedDriver } from './drivers/ReanimatedDriver';
import type { AnimationDriver, AnimationHandle, AnimationSpec, AnimationTarget } from './types';
import { useAnimationStore } from '../store/animationStore';
import { generateId } from '../utils/idgen';

class AnimationManager {
  private driver: AnimationDriver;

  constructor() {
    this.driver = getPlatform() === 'native' ? new ReanimatedDriver() : new WebAnimationDriver();
  }

  /**
   * Start an animation. Returns an AnimationHandle and also registers it
   * in the animationStore so the UI can observe running animations.
   */
  startAnimation(
    spec: AnimationSpec,
    target: AnimationTarget,
    animationId?: string
  ): AnimationHandle {
    const id = animationId ?? generateId('anim');
    const handle = this.driver.start(spec, target);

    useAnimationStore.getState().addAnimation(id, { spec, handle, targetId: target.targetId });

    handle.onComplete(() => {
      useAnimationStore.getState().removeAnimation(id);
    });

    return handle;
  }

  stopAnimation(id: string): void {
    const store = useAnimationStore.getState();
    store.runningAnimations[id]?.handle.stop();
    store.removeAnimation(id);
  }

  pauseAll(): void {
    useAnimationStore.getState().pauseAll();
  }

  resumeAll(): void {
    useAnimationStore.getState().resumeAll();
  }

  stopAll(): void {
    this.driver.stopAll();
    useAnimationStore.getState().stopAll();
  }

  getDriver(): AnimationDriver {
    return this.driver;
  }
}

export const animationManager = new AnimationManager();
