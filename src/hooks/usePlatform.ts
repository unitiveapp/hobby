import { Platform } from 'react-native';
import type { PlatformOS } from '../types/platform';

export function usePlatform(): PlatformOS {
  return Platform.OS === 'web' ? 'web' : 'native';
}

export function useIsWeb(): boolean {
  return Platform.OS === 'web';
}
