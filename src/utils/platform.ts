import { Platform } from 'react-native';
import type { PlatformOS } from '../types/platform';

export function getPlatform(): PlatformOS {
  return Platform.OS === 'web' ? 'web' : 'native';
}

export function isWeb(): boolean {
  return Platform.OS === 'web';
}

export function isNative(): boolean {
  return Platform.OS !== 'web';
}
