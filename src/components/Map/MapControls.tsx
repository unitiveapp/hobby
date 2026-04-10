import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useMapAdapter } from '../../hooks/useMapAdapter';
import { useMapStore } from '../../store/mapStore';

export function MapControls() {
  const adapter = useMapAdapter();
  const { viewport, setViewport } = useMapStore();

  const zoomIn = () => {
    const current = adapter.getViewport();
    adapter.setViewport({ zoom: (current.zoom ?? 2) + 1 });
    setViewport({ zoom: (viewport.zoom ?? 2) + 1 });
  };

  const zoomOut = () => {
    const current = adapter.getViewport();
    adapter.setViewport({ zoom: Math.max(0, (current.zoom ?? 2) - 1) });
    setViewport({ zoom: Math.max(0, (viewport.zoom ?? 2) - 1) });
  };

  const resetNorth = () => {
    adapter.setViewport({ bearing: 0, pitch: 0 });
    setViewport({ bearing: 0, pitch: 0 });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={zoomIn}>
        <Text style={styles.label}>+</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={zoomOut}>
        <Text style={styles.label}>−</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={resetNorth}>
        <Text style={styles.label}>N</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    bottom: 80,
    gap: 8,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});
