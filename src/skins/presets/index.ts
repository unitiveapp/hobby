import type { MapSkin } from '../types';
import lightSkin from './light.skin.json';
import darkSkin from './dark.skin.json';
import satelliteSkin from './satellite.skin.json';

export const PRESET_SKINS: MapSkin[] = [
  lightSkin as MapSkin,
  darkSkin as MapSkin,
  satelliteSkin as MapSkin,
];

export { lightSkin, darkSkin, satelliteSkin };
