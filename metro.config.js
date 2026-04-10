const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ─── Web platform: stub native-only packages ──────────────────────────────────
// Metro uses the first matching extension, so .web.ts beats .ts on web.
// For packages that have NO web version at all, alias them to empty stubs below.

const webStubs = {
  // @rnmapbox/maps is handled by MapboxNativeAdapter.web.ts platform file,
  // so the import never actually reaches the native module on web.
  // As a safety net, also alias the package itself.
  '@rnmapbox/maps': path.resolve(__dirname, 'src/stubs/rnmapbox-stub.js'),

  // mapbox-gl uses dynamic import() expressions that Metro cannot process.
  // When EXPO_PUBLIC_MAPBOX_TOKEN is not set the LeafletAdapter is used and
  // mapbox-gl is never instantiated — the stub satisfies the module graph.
  'mapbox-gl': path.resolve(__dirname, 'src/stubs/mapbox-gl-stub.js'),
};

config.resolver = {
  ...config.resolver,
  // Support .web.ts / .web.tsx platform overrides
  sourceExts: [
    'web.tsx', 'web.ts', 'web.js',
    ...config.resolver.sourceExts,
  ],
  // Web-specific package aliases
  resolveRequest: (context, moduleName, platform) => {
    if (platform === 'web' && webStubs[moduleName]) {
      return {
        filePath: webStubs[moduleName],
        type: 'sourceFile',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
