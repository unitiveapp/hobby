import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useDataStore } from '../../store/dataStore';
import { dataSourceManager } from '../../data/DataSourceManager';
import type { DataSourceConfig } from '../../data/types';
import { generateId } from '../../utils/idgen';

const STATUS_COLORS: Record<string, string> = {
  idle: '#aaa',
  loading: '#f39c12',
  live: '#27ae60',
  error: '#e74c3c',
  paused: '#95a5a6',
};

export function DataSourceList() {
  const { sources, feedStatuses } = useDataStore();
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState('');
  const [type, setType] = useState<DataSourceConfig['type']>('rest');
  const [expanded, setExpanded] = useState(true);

  const handleAdd = () => {
    if (!url) return;
    const config: DataSourceConfig = {
      id: generateId('src'),
      type,
      url,
      refreshIntervalMs: type === 'rest' ? 30_000 : 0,
    };
    void dataSourceManager.registerSource(config);
    setUrl('');
    setShowAdd(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.headerLabel}>
          Data Sources ({Object.keys(sources).length}) {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {Object.values(sources).map((src) => {
              const status = feedStatuses[src.id];
              return (
                <View key={src.id} style={styles.row}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: STATUS_COLORS[status?.state ?? 'idle'] },
                    ]}
                  />
                  <View style={styles.info}>
                    <Text style={styles.srcId} numberOfLines={1}>{src.id}</Text>
                    <Text style={styles.srcUrl} numberOfLines={1}>{src.url}</Text>
                    <Text style={styles.srcStatus}>
                      {status?.state ?? 'idle'} · {status?.featureCount ?? 0} features
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => dataSourceManager.unregisterSource(src.id)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeLabel}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
            <Text style={styles.addLabel}>+ Add Source</Text>
          </TouchableOpacity>

          {showAdd && (
            <View style={styles.addForm}>
              <TextInput
                style={styles.urlInput}
                value={url}
                onChangeText={setUrl}
                placeholder="https://..."
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.typeRow}>
                {(['rest', 'websocket', 'geojson-file'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, type === t && styles.typeActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.typeLabel, type === t && styles.typeLabelActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd}>
                <Text style={styles.confirmLabel}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 12,
    width: 270,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    maxHeight: 320,
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
  list: {
    maxHeight: 160,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  info: {
    flex: 1,
  },
  srcId: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  srcUrl: {
    fontSize: 10,
    color: '#666',
  },
  srcStatus: {
    fontSize: 10,
    color: '#999',
  },
  removeBtn: {
    padding: 4,
  },
  removeLabel: {
    fontSize: 13,
    color: '#e74c3c',
  },
  addBtn: {
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  addLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3498db',
  },
  addForm: {
    padding: 10,
    gap: 8,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    color: '#333',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  typeActive: {
    backgroundColor: '#3498db',
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555',
  },
  typeLabelActive: {
    color: '#fff',
  },
  confirmBtn: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
