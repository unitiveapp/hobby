/**
 * Deep-linkable map view: hobbymap://map/my-saved-map?skin=dark&source=ws://...
 */
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapContainer } from '../../src/components/Map/MapContainer';
import { MapControls } from '../../src/components/Map/MapControls';
import { SelectionToolbar } from '../../src/components/Selection/SelectionToolbar';
import { SelectionPreview } from '../../src/components/Selection/SelectionPreview';
import { SkinPicker } from '../../src/components/SkinEditor/SkinPicker';
import { DataSourceList } from '../../src/components/DataPanel/DataSourceList';
import { GeoJSONLayer } from '../../src/components/Layers/GeoJSONLayer';
import { useSkinStore } from '../../src/store/skinStore';
import { dataSourceManager } from '../../src/data/DataSourceManager';
import { useMapStore } from '../../src/store/mapStore';
import { generateId } from '../../src/utils/idgen';

export default function MapScreen() {
  const { id, skin, source } = useLocalSearchParams<{
    id: string;
    skin?: string;
    source?: string;
  }>();
  const isReady = useMapStore((s) => s.isReady);
  const setActiveSkin = useSkinStore((s) => s.setActiveSkin);

  useEffect(() => {
    // Apply skin from URL param
    if (skin) setActiveSkin(skin);
  }, [skin]);

  useEffect(() => {
    // Register data source from URL param
    if (!source) return;
    const isWs = source.startsWith('ws://') || source.startsWith('wss://');
    const config = {
      id: generateId('url-src'),
      type: (isWs ? 'websocket' : 'rest') as 'websocket' | 'rest',
      url: source,
    };
    void dataSourceManager.registerSource(config);
    return () => dataSourceManager.unregisterSource(config.id);
  }, [source]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <MapContainer style={styles.map}>
        {isReady && <GeoJSONLayer id="map-data" visible />}
        <SelectionToolbar />
        <SkinPicker />
        <MapControls />
        <DataSourceList />
        <SelectionPreview />
      </MapContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1a1a2e' },
  map: { flex: 1 },
});
