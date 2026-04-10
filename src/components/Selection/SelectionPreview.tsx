import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSelectionStore } from '../../store/selectionStore';

export function SelectionPreview() {
  const selections = useSelectionStore((s) => s.selections);
  const activeId = useSelectionStore((s) => s.activeSelectionId);
  const removeSelection = useSelectionStore((s) => s.removeSelection);

  if (selections.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{selections.length} Selection{selections.length > 1 ? 's' : ''}</Text>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {selections.map((sel) => (
          <View
            key={sel.id}
            style={[styles.item, activeId === sel.id && styles.activeItem]}
          >
            <View style={styles.row}>
              <Text style={styles.tool}>{sel.tool.toUpperCase()}</Text>
              <Text style={styles.area}>{sel.areaKm2.toFixed(2)} km²</Text>
              <TouchableOpacity onPress={() => removeSelection(sel.id)}>
                <Text style={styles.remove}>✕</Text>
              </TouchableOpacity>
            </View>
            {sel.regionInfo?.countryName && (
              <Text style={styles.region}>{sel.regionInfo.countryName}</Text>
            )}
            <Text style={styles.features}>{sel.containedFeatureIds.length} features</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 12,
    maxHeight: 200,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  list: {
    maxHeight: 140,
  },
  item: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeItem: {
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tool: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3498db',
    backgroundColor: '#ebf5fb',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  area: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  remove: {
    fontSize: 14,
    color: '#e74c3c',
    padding: 2,
  },
  region: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  features: {
    fontSize: 11,
    color: '#999',
  },
});
