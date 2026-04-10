import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useSkinStore } from '../src/store/skinStore';
import { useMapStore } from '../src/store/mapStore';
import { resolveDefaultAdapter } from '../src/adapters/index';
import { PRESET_SKINS } from '../src/skins/presets/index';

export default function RootLayout() {
  const registerSkin = useSkinStore((s) => s.registerSkin);
  const setAdapter = useMapStore((s) => s.setAdapter);

  useEffect(() => {
    // Register all preset skins
    for (const skin of PRESET_SKINS) {
      registerSkin(skin);
    }

    // Pick the best adapter for the current platform
    const adapterId = resolveDefaultAdapter();
    setAdapter(adapterId);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
