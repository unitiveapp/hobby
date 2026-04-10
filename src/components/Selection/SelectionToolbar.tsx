import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSelection } from '../../hooks/useSelection';
import type { SelectionToolType } from '../../types/events';

const TOOLS: Array<{ type: SelectionToolType; label: string }> = [
  { type: 'freehand', label: 'Draw' },
  { type: 'rectangle', label: 'Rect' },
  { type: 'polygon', label: 'Poly' },
  { type: 'click', label: 'Click' },
];

export function SelectionToolbar() {
  const { activeTool, isMultiSelectMode, setTool, clearAll, toggleMultiSelect } = useSelection();

  return (
    <View style={styles.container}>
      {TOOLS.map((tool) => (
        <TouchableOpacity
          key={tool.type}
          style={[styles.button, activeTool === tool.type && styles.activeButton]}
          onPress={() => setTool(activeTool === tool.type ? null : tool.type)}
        >
          <Text style={[styles.label, activeTool === tool.type && styles.activeLabel]}>
            {tool.label}
          </Text>
        </TouchableOpacity>
      ))}
      <View style={styles.divider} />
      <TouchableOpacity
        style={[styles.button, isMultiSelectMode && styles.activeButton]}
        onPress={toggleMultiSelect}
      >
        <Text style={[styles.label, isMultiSelectMode && styles.activeLabel]}>Multi</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={clearAll}>
        <Text style={styles.label}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  activeButton: {
    backgroundColor: '#3498db',
  },
  divider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  activeLabel: {
    color: '#fff',
  },
});
