import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapContainer } from '../src/components/Map/MapContainer';
import { MapControls } from '../src/components/Map/MapControls';
import { SelectionToolbar } from '../src/components/Selection/SelectionToolbar';
import { SelectionPreview } from '../src/components/Selection/SelectionPreview';
import { SkinPicker } from '../src/components/SkinEditor/SkinPicker';
import { TokenEditor } from '../src/components/SkinEditor/TokenEditor';
import { DataSourceList } from '../src/components/DataPanel/DataSourceList';
import { GeoJSONLayer } from '../src/components/Layers/GeoJSONLayer';
import { useMapStore } from '../src/store/mapStore';

export default function HomeScreen() {
  const isReady = useMapStore((s) => s.isReady);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <MapContainer style={styles.map}>
        {/* Layers — rendered imperatively inside the map */}
        {isReady && (
          <>
            <GeoJSONLayer id="merged-data" visible />
          </>
        )}

        {/* Floating UI overlays */}
        <SelectionToolbar />
        <SkinPicker />
        <MapControls />
        <DataSourceList />
        <TokenEditor />
        <SelectionPreview />
      </MapContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  map: {
    flex: 1,
  },
});
