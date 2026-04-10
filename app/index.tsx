import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapContainer } from '../src/components/Map/MapContainer';
import { MapControls } from '../src/components/Map/MapControls';
import { SelectionToolbar } from '../src/components/Selection/SelectionToolbar';
import { SelectionPreview } from '../src/components/Selection/SelectionPreview';
import { SkinPicker } from '../src/components/SkinEditor/SkinPicker';
import { TokenEditor } from '../src/components/SkinEditor/TokenEditor';
import { DataSourceList } from '../src/components/DataPanel/DataSourceList';
import { GeoJSONLayer } from '../src/components/Layers/GeoJSONLayer';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <MapContainer style={styles.map}>
        {/* Every child guards itself against null adapter — no isReady gate needed */}
        <GeoJSONLayer id="merged-data" visible />
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
