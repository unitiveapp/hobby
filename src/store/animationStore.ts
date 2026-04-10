import { create } from 'zustand';
import type { AnimationSpec, AnimationHandle } from '../animation/types';

interface RunningAnimation {
  spec: AnimationSpec;
  handle: AnimationHandle;
  targetId: string;
}

interface AnimationState {
  runningAnimations: Record<string, RunningAnimation>;

  addAnimation(id: string, animation: RunningAnimation): void;
  removeAnimation(id: string): void;
  pauseAll(): void;
  resumeAll(): void;
  stopAll(): void;
  isRunning(id: string): boolean;
}

export const useAnimationStore = create<AnimationState>((set, get) => ({
  runningAnimations: {},

  addAnimation: (id, animation) =>
    set((state) => ({
      runningAnimations: { ...state.runningAnimations, [id]: animation },
    })),

  removeAnimation: (id) =>
    set((state) => {
      const { [id]: _removed, ...rest } = state.runningAnimations;
      return { runningAnimations: rest };
    }),

  pauseAll: () => {
    Object.values(get().runningAnimations).forEach((a) => a.handle.pause());
  },

  resumeAll: () => {
    Object.values(get().runningAnimations).forEach((a) => a.handle.resume());
  },

  stopAll: () => {
    Object.values(get().runningAnimations).forEach((a) => a.handle.stop());
    set({ runningAnimations: {} });
  },

  isRunning: (id) => id in get().runningAnimations,
}));
