/**
 * Stub for mapbox-gl on web when no Mapbox token is configured.
 *
 * mapbox-gl uses dynamic `import()` expressions internally that Metro's
 * bundler cannot process. Since the LeafletAdapter is used by default (no
 * EXPO_PUBLIC_MAPBOX_TOKEN), the MapboxWebAdapter — and therefore mapbox-gl —
 * is never instantiated. This stub satisfies the module graph at bundle time
 * without pulling in the full library.
 */

const Map = class MapboxMap {
  constructor() {}
  on() { return this; }
  off() { return this; }
  once() { return this; }
  remove() {}
  addControl() {}
  removeControl() {}
  addSource() {}
  removeSource() {}
  addLayer() {}
  removeLayer() {}
  getLayer() { return null; }
  getSource() { return null; }
  setPaintProperty() {}
  setLayoutProperty() {}
  setStyle() {}
  setCenter() {}
  setZoom() {}
  easeTo() {}
  flyTo() {}
  fitBounds() {}
  getCanvas() { return null; }
  project() { return { x: 0, y: 0 }; }
  unproject() { return { lng: 0, lat: 0 }; }
  queryRenderedFeatures() { return []; }
  loaded() { return false; }
};

const mapboxgl = {
  Map,
  NavigationControl: class {},
  ScaleControl: class {},
  GeolocateControl: class {},
  Popup: class {},
  Marker: class { addTo() { return this; } remove() {} setLngLat() { return this; } setHTML() { return this; } },
  LngLatBounds: class {},
  accessToken: '',
  version: '0.0.0-stub',
  supported: () => false,
};

module.exports = mapboxgl;
module.exports.default = mapboxgl;
