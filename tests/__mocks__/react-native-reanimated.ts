const Animated = {
  useSharedValue: (v: unknown) => ({ value: v }),
  withTiming: (v: unknown) => v,
  withRepeat: (v: unknown) => v,
  withDelay: (_: unknown, v: unknown) => v,
  cancelAnimation: vi.fn(),
  runOnJS: (fn: (...args: unknown[]) => void) => fn,
};

export default Animated;
export const {
  useSharedValue,
  withTiming,
  withRepeat,
  withDelay,
  cancelAnimation,
  runOnJS,
} = Animated;

export const Easing = {
  inOut: (fn: unknown) => fn,
  ease: (t: number) => t,
};
