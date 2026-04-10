import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Stub react-native for web tests
      'react-native': 'react-native-web',
      // Stub native-only modules
      '@rnmapbox/maps': path.resolve(__dirname, 'tests/__mocks__/@rnmapbox/maps.ts'),
      'react-native-reanimated': path.resolve(
        __dirname,
        'tests/__mocks__/react-native-reanimated.ts'
      ),
    },
  },
});
