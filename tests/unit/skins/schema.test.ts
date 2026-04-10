import { describe, it, expect } from 'vitest';
import { MapSkinSchema } from '../../../src/skins/schema';
import lightSkin from '../../../src/skins/presets/light.skin.json';
import darkSkin from '../../../src/skins/presets/dark.skin.json';
import satelliteSkin from '../../../src/skins/presets/satellite.skin.json';

describe('MapSkinSchema', () => {
  it('validates the light preset', () => {
    expect(() => MapSkinSchema.parse(lightSkin)).not.toThrow();
  });

  it('validates the dark preset', () => {
    expect(() => MapSkinSchema.parse(darkSkin)).not.toThrow();
  });

  it('validates the satellite preset', () => {
    expect(() => MapSkinSchema.parse(satelliteSkin)).not.toThrow();
  });

  it('rejects a skin without id', () => {
    const invalid = { name: 'No ID', tokens: {}, layerOverrides: [] };
    expect(() => MapSkinSchema.parse(invalid)).toThrow();
  });

  it('rejects globalOpacity > 1', () => {
    const invalid = {
      id: 'bad',
      name: 'Bad',
      tokens: { globalOpacity: 1.5 },
      layerOverrides: [],
    };
    expect(() => MapSkinSchema.parse(invalid)).toThrow();
  });
});
