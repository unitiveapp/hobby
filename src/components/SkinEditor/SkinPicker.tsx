import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useSkinStore } from '../../store/skinStore';

export function SkinPicker() {
  const [open, setOpen] = useState(false);
  const { registry, activeSkinId, setActiveSkin } = useSkinStore();
  const skins = Object.values(registry);

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerLabel}>
          🎨 {registry[activeSkinId]?.name ?? 'Skin'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.heading}>Map Skin</Text>
            <FlatList
              data={skins}
              keyExtractor={(s) => s.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item.id === activeSkinId && styles.activeOption]}
                  onPress={() => {
                    setActiveSkin(item.id);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.skinName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.skinDesc}>{item.description}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.close} onPress={() => setOpen(false)}>
              <Text style={styles.closeLabel}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  triggerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#f8f9fa',
  },
  activeOption: {
    backgroundColor: '#ebf5fb',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  skinName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  skinDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  close: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  closeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
});
