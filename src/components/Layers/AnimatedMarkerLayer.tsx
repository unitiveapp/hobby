import React, { useEffect, useRef, useState } from 'react';
import { useAnimatedMarker } from '../../hooks/useAnimatedMarker';
import { interpolateRoute } from '../../animation/presets/animatedRoute';
import { getFrameIndex } from '../../animation/presets/timePlayback';
import type { AnimationSpec } from '../../animation/types';
import type { LngLat } from '../../types/geo';

interface AnimatedMarkerProps {
  id: string;
  initialPosition: LngLat;
  spec: AnimationSpec;
  /** Called each frame with the current position (for map integration) */
  onPositionChange?: (position: LngLat) => void;
}

export function AnimatedMarker({ id, initialPosition, spec, onPositionChange }: AnimatedMarkerProps) {
  const [position, setPosition] = useState<LngLat>(initialPosition);
  const handle = useAnimatedMarker(id, spec);

  useEffect(() => {
    if (!handle) return;

    handle.onFrame((progress) => {
      let newPos: LngLat = initialPosition;

      if (spec.type === 'translate') {
        const { from, to } = spec.payload;
        newPos = [
          from[0] + (to[0] - from[0]) * progress,
          from[1] + (to[1] - from[1]) * progress,
        ];
      } else if (spec.type === 'route') {
        newPos = interpolateRoute(spec.payload.waypoints, progress);
      } else if (spec.type === 'timePlayback') {
        const frameIndex = getFrameIndex(progress, spec.payload.timestamps);
        // For timePlayback, consumers should use frameIndex externally
        void frameIndex;
        newPos = initialPosition;
      }

      setPosition(newPos);
      onPositionChange?.(newPos);
    });
  }, [handle]);

  // This component only manages state — rendering is done by the parent
  // (e.g. a Mapbox Marker or a custom SVG overlay)
  return null;
}

interface PulsingDotProps {
  id: string;
  position: LngLat;
  color?: string;
  size?: number;
}

/**
 * Web-only pulsing dot rendered as an SVG overlay.
 * For native, use Mapbox's annotation layer instead.
 */
export function PulsingDot({ id, position, color = '#e74c3c', size = 20 }: PulsingDotProps) {
  // This is a placeholder — in a real implementation this would render
  // an SVG element positioned absolutely over the map canvas using
  // the adapter's project() method to convert lngLat → screen coordinates.
  return null;
}
