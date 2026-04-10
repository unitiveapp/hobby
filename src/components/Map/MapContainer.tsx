import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapAdapterContext } from './MapAdapterContext';
import { useMapStore } from '../../store/mapStore';
import { useSkinStore } from '../../store/skinStore';
import { useSkin } from '../../hooks/useSkin';
import { createAdapter } from '../../adapters/index';
import { mapboxSkinTranslator } from '../../skins/translators/mapboxSkinTranslator';
import { leafletSkinTranslator } from '../../skins/translators/leafletSkinTranslator';
import { googleSkinTranslator } from '../../skins/translators/googleSkinTranslator';
import type { MapAdapter } from '../../adapters/base/MapAdapter';
import type { AdapterId } from '../../store/mapStore';
import type { ResolvedSkin } from '../../skins/types';

interface Props {
  children?: ReactNode;
  style?: object;
}

function translateSkin(adapterId: AdapterId, skin: ResolvedSkin) {
  switch (adapterId) {
    case 'mapbox-web':
    case 'mapbox-native':
      return {
        resolvedSkin: skin,
        payload: mapboxSkinTranslator.translate(skin),
      };
    case 'leaflet':
      return {
        resolvedSkin: skin,
        payload: leafletSkinTranslator.translate(skin),
      };
    case 'google':
      return {
        resolvedSkin: skin,
        payload: googleSkinTranslator.translate(skin),
      };
  }
}

export function MapContainer({ children, style }: Props) {
  const containerRef = useRef<View>(null);
  const adapterRef = useRef<MapAdapter | null>(null);
  // liveAdapter is the state-backed copy of adapterRef — updating it triggers
  // a re-render so the context value propagates to children.
  const [liveAdapter, setLiveAdapter] = useState<MapAdapter | null>(null);

  const { activeAdapterId, viewport, setReady } = useMapStore();
  const resolvedSkin = useSkin();

  // No boot effect needed — mapStore initialises activeAdapterId at module load
  // time via resolveInitialAdapter(), so the correct adapter is set before
  // any component mounts.

  // (Re-)create adapter when activeAdapterId changes
  useEffect(() => {
    if (!activeAdapterId) return;

    const prevAdapter = adapterRef.current;
    prevAdapter?.destroy();

    const adapter = createAdapter(activeAdapterId);
    adapterRef.current = adapter;
    setLiveAdapter(null); // reset context while new adapter initialises
    setReady(false);

    const token =
      typeof process !== 'undefined'
        ? (process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '')
        : '';

    void adapter.initialize(containerRef.current, {
      viewport,
      accessToken: token || undefined,
    }).then(() => {
      // Set liveAdapter BEFORE setReady so context consumers already have the
      // adapter instance when isReady triggers their re-render.
      setLiveAdapter(adapter);
      setReady(true);
      // Apply current skin immediately after init
      const skin = useSkinStore.getState().resolvedSkin;
      if (skin) {
        adapter.applySkin(translateSkin(activeAdapterId, skin));
      }
    });

    return () => {
      adapter.destroy();
      setLiveAdapter(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAdapterId]);

  // Apply skin whenever resolved skin changes
  useEffect(() => {
    const adapter = adapterRef.current;
    if (!adapter?.isReady() || !resolvedSkin) return;
    adapter.applySkin(translateSkin(activeAdapterId, resolvedSkin));
  }, [resolvedSkin, activeAdapterId]);

  return (
    <MapAdapterContext.Provider value={liveAdapter}>
      <View ref={containerRef} style={[styles.container, style]}>
        {children}
      </View>
    </MapAdapterContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
