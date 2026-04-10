import { describe, it, expect } from 'vitest';
import { resolveSkin } from '../../../src/skins/resolver';
import type { MapSkin } from '../../../src/skins/types';

const baseSkin: MapSkin = {
  id: 'base',
  name: 'Base',
  tokens: {
    background: '#ffffff',
    water: '#aaaaff',
  },
  layerOverrides: [
    { layerId: 'road-local', paint: { 'line-color': '#eeeeee' } },
  ],
};

const childSkin: MapSkin = {
  id: 'child',
  name: 'Child',
  extends: 'base',
  tokens: {
    background: '#000000', // override
    // water inherits from base
  },
  layerOverrides: [
    { layerId: 'road-local', paint: { 'line-color': '#222222' } }, // override parent
    { layerId: 'water', paint: { 'fill-color': '#001133' } },       // new override
  ],
};

const registry = { base: baseSkin, child: childSkin };

describe('resolveSkin', () => {
  it('resolves a skin with no parent using defaults', () => {
    const resolved = resolveSkin('base', registry);
    expect(resolved.tokens.background).toBe('#ffffff');
    expect(resolved.tokens.water).toBe('#aaaaff');
    // Should fill in all default token fields
    expect(resolved.tokens.park).toBeDefined();
    expect(resolved.tokens.roads).toBeDefined();
  });

  it('child overrides parent tokens', () => {
    const resolved = resolveSkin('child', registry);
    expect(resolved.tokens.background).toBe('#000000');
    expect(resolved.tokens.water).toBe('#aaaaff'); // inherited
  });

  it('child layer overrides replace parent overrides with same layerId', () => {
    const resolved = resolveSkin('child', registry);
    const roadOverride = resolved.layerOverrides.find((o) => o.layerId === 'road-local');
    expect(roadOverride?.paint?.['line-color']).toBe('#222222');
  });

  it('child adds new layer overrides not in parent', () => {
    const resolved = resolveSkin('child', registry);
    const waterOverride = resolved.layerOverrides.find((o) => o.layerId === 'water');
    expect(waterOverride).toBeDefined();
  });

  it('throws on missing skin', () => {
    expect(() => resolveSkin('nonexistent', registry)).toThrow(/not found/);
  });

  it('throws on circular inheritance', () => {
    const circularA: MapSkin = { id: 'a', name: 'A', extends: 'b', tokens: {}, layerOverrides: [] };
    const circularB: MapSkin = { id: 'b', name: 'B', extends: 'a', tokens: {}, layerOverrides: [] };
    expect(() => resolveSkin('a', { a: circularA, b: circularB })).toThrow(/[Cc]ircular/);
  });
});
