import { describe, it, expect } from 'vitest';
import { resolveSkin } from '../../../src/skins/resolver';
import { mapboxSkinTranslator } from '../../../src/skins/translators/mapboxSkinTranslator';
import { leafletSkinTranslator } from '../../../src/skins/translators/leafletSkinTranslator';
import { googleSkinTranslator } from '../../../src/skins/translators/googleSkinTranslator';
import type { MapSkin } from '../../../src/skins/types';

const testSkin: MapSkin = {
  id: 'test',
  name: 'Test',
  tokens: {
    background: '#fafafa',
    water: '#0088cc',
  },
  layerOverrides: [
    { layerId: 'custom-layer', paint: { 'fill-color': '#ff0000' } },
  ],
  adapterHints: {
    mapbox: { styleUrl: 'mapbox://styles/test/custom' },
    leaflet: { tileUrl: 'https://custom/{z}/{x}/{y}.png', attribution: 'Custom' },
    google: { mapTypeId: 'terrain' },
  },
};

const registry = { test: testSkin };

describe('mapboxSkinTranslator', () => {
  it('includes baseStyleUrl from adapterHints', () => {
    const resolved = resolveSkin('test', registry);
    const payload = mapboxSkinTranslator.translate(resolved);
    expect(payload.baseStyleUrl).toBe('mapbox://styles/test/custom');
  });

  it('includes layer override updates', () => {
    const resolved = resolveSkin('test', registry);
    const payload = mapboxSkinTranslator.translate(resolved);
    const customUpdate = payload.updates.find(
      (u) => u.layerId === 'custom-layer' && u.property === 'fill-color'
    );
    expect(customUpdate?.value).toBe('#ff0000');
  });
});

describe('leafletSkinTranslator', () => {
  it('returns tile URL from adapterHints', () => {
    const resolved = resolveSkin('test', registry);
    const payload = leafletSkinTranslator.translate(resolved);
    expect(payload.tileUrl).toBe('https://custom/{z}/{x}/{y}.png');
    expect(payload.attribution).toBe('Custom');
  });

  it('includes CSS variables derived from tokens', () => {
    const resolved = resolveSkin('test', registry);
    const payload = leafletSkinTranslator.translate(resolved);
    expect(payload.cssVars['--map-bg']).toBe('#fafafa');
    expect(payload.cssVars['--map-water']).toBe('#0088cc');
  });
});

describe('googleSkinTranslator', () => {
  it('uses mapTypeId from adapterHints', () => {
    const resolved = resolveSkin('test', registry);
    const payload = googleSkinTranslator.translate(resolved);
    expect(payload.mapTypeId).toBe('terrain');
  });
});
