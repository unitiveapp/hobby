import { describe, it, expect, beforeEach } from 'vitest';
import { useSkinStore } from '../../../src/store/skinStore';
import type { MapSkin } from '../../../src/skins/types';

const testSkin: MapSkin = {
  id: 'test-skin',
  name: 'Test Skin',
  tokens: { background: '#112233' },
  layerOverrides: [],
};

describe('useSkinStore', () => {
  beforeEach(() => {
    // Reset store state
    useSkinStore.setState({
      registry: {},
      activeSkinId: 'light',
      resolvedSkin: null,
      userOverrides: {},
    });
  });

  it('registers a skin', () => {
    useSkinStore.getState().registerSkin(testSkin);
    expect(useSkinStore.getState().registry['test-skin']).toEqual(testSkin);
  });

  it('sets active skin', () => {
    useSkinStore.getState().registerSkin(testSkin);
    useSkinStore.getState().setActiveSkin('test-skin');
    expect(useSkinStore.getState().activeSkinId).toBe('test-skin');
  });

  it('warns if skin not found', () => {
    useSkinStore.getState().setActiveSkin('nonexistent');
    expect(useSkinStore.getState().activeSkinId).toBe('light'); // unchanged
  });

  it('applies token override', () => {
    useSkinStore.getState().applyTokenOverride('background', '#ff0000');
    expect(useSkinStore.getState().userOverrides.background).toBe('#ff0000');
  });

  it('resets overrides', () => {
    useSkinStore.getState().applyTokenOverride('background', '#ff0000');
    useSkinStore.getState().resetOverrides();
    expect(useSkinStore.getState().userOverrides).toEqual({});
  });

  it('imports valid skin JSON', () => {
    const json = JSON.stringify({ id: 'imported', name: 'Imported', tokens: {}, layerOverrides: [] });
    const result = useSkinStore.getState().importSkinJson(json);
    expect(result.success).toBe(true);
    expect(useSkinStore.getState().registry['imported']).toBeDefined();
  });

  it('rejects invalid JSON', () => {
    const result = useSkinStore.getState().importSkinJson('not-json');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects skin without id', () => {
    const result = useSkinStore.getState().importSkinJson(JSON.stringify({ name: 'No ID' }));
    expect(result.success).toBe(false);
  });
});
