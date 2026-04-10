import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSkinStore } from '../../store/skinStore';
import type { SkinTokens } from '../../skins/types';

const COLOR_TOKENS: Array<{ key: keyof SkinTokens; label: string }> = [
  { key: 'background', label: 'Background' },
  { key: 'water', label: 'Water' },
  { key: 'landuse', label: 'Land Use' },
  { key: 'park', label: 'Parks' },
  { key: 'borders', label: 'Borders' },
  { key: 'poi', label: 'POI' },
];

export function TokenEditor() {
  const { resolvedSkin, applyTokenOverride, resetOverrides } = useSkinStore();
  const [expanded, setExpanded] = useState(false);

  if (!resolvedSkin) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.headerLabel}>Customize Tokens {expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {COLOR_TOKENS.map(({ key, label }) => {
            const value = resolvedSkin.tokens[key];
            if (typeof value !== 'string') return null;
            return (
              <View key={key} style={styles.row}>
                <View style={[styles.swatch, { backgroundColor: value }]} />
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={(v) => applyTokenOverride(key, v)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="#rrggbb"
                />
              </View>
            );
          })}
          <TouchableOpacity style={styles.resetButton} onPress={resetOverrides}>
            <Text style={styles.resetLabel}>Reset to Defaults</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 220,
    right: 12,
    width: 260,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  body: {
    maxHeight: 300,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  input: {
    width: 80,
    height: 28,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 6,
    fontSize: 11,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  resetButton: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#fee5e5',
    borderRadius: 8,
    alignItems: 'center',
  },
  resetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e74c3c',
  },
});
