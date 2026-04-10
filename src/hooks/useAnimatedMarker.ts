import { useEffect, useRef } from 'react';
import { animationManager } from '../animation/AnimationManager';
import type { AnimationSpec, AnimationHandle } from '../animation/types';

/**
 * Start an animation for a marker and clean it up when the component unmounts.
 * Returns the AnimationHandle so the component can pause/resume/seek.
 */
export function useAnimatedMarker(
  markerId: string,
  spec: AnimationSpec | null
): AnimationHandle | null {
  const handleRef = useRef<AnimationHandle | null>(null);

  useEffect(() => {
    if (!spec) return;
    const handle = animationManager.startAnimation(spec, {
      targetId: markerId,
      targetType: 'marker',
    });
    handleRef.current = handle;
    return () => {
      handle.stop();
      handleRef.current = null;
    };
  // spec is intentionally not in the deps — only restart when markerId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerId]);

  return handleRef.current;
}
