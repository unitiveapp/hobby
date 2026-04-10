import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Hobby Map',
  slug: 'hobby-map',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    backgroundColor: '#1a1a2e',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.unitiveapp.hobbymap',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Used to show your location on the map.',
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#1a1a2e',
    },
    package: 'com.unitiveapp.hobbymap',
    permissions: ['ACCESS_FINE_LOCATION'],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  // GitHub Pages serves the app at /hobby — this tells Expo Router
  // to prefix all routes and asset URLs with that path.
  experiments: {
    basePath: '/hobby',
  },
  plugins: [
    'expo-router',
    'react-native-reanimated/plugin',
    [
      '@rnmapbox/maps',
      {
        RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN ?? '',
      },
    ],
  ],
  scheme: 'hobbymap',
  extra: {
    mapboxPublicToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '',
  },
});
