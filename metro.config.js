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
  'mapbox-gl': path.resolve(__dirname, 'src/stubs/mapbox-gl-stub.js'),
};

// On native platforms stub out web-only GL libraries so the module graph
// still resolves even though these adapters are never instantiated.
const nativeStubs = {
  'maplibre-gl': path.resolve(__dirname, 'src/stubs/maplibre-gl-stub.js'),
  'maplibre-gl/dist/maplibre-gl.css': path.resolve(__dirname, 'src/stubs/empty.js'),
  'leaflet': path.resolve(__dirname, 'src/stubs/leaflet-stub.js'),
  'leaflet/dist/leaflet.css': path.resolve(__dirname, 'src/stubs/empty.js'),
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
      return { filePath: webStubs[moduleName], type: 'sourceFile' };
    }
    if (platform !== 'web' && nativeStubs[moduleName]) {
      return { filePath: nativeStubs[moduleName], type: 'sourceFile' };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
