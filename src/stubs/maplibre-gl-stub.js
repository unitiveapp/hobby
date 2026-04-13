/**
 * Stub for maplibre-gl when bundled on native platforms.
 * MapLibreWebAdapter is only instantiated on web; this stub satisfies
 * the module graph without pulling in the full WebGL library.
 */

const Map = class MapLibreMap {
  constructor() {}
  on() { return this; }
  off() { return this; }
  once() { return this; }
  remove() {}
  setStyle() {}
  getStyle() { return null; }
  isStyleLoaded() { return false; }
  addControl() {}
  removeControl() {}
  addSource() {}
  removeSource() {}
  getSource() { return null; }
  addLayer() {}
  removeLayer() {}
  getLayer() { return null; }
  setPaintProperty() {}
  setLayoutProperty() {}
  setFilter() {}
  moveLayer() {}
  setCenter() {}
  setZoom() {}
  easeTo() {}
  flyTo() {}
  jumpTo() {}
  fitBounds() {}
  getCenter() { return { lng: 0, lat: 0 }; }
  getZoom() { return 2; }
  getPitch() { return 0; }
  getBearing() { return 0; }
  project() { return { x: 0, y: 0 }; }
  unproject() { return { lng: 0, lat: 0 }; }
  queryRenderedFeatures() { return []; }
  loaded() { return false; }
};

const maplibregl = {
  Map,
  NavigationControl: class {},
  ScaleControl: class {},
  GeolocateControl: class {},
  Popup: class {},
  Marker: class { addTo() { return this; } remove() {} setLngLat() { return this; } setHTML() { return this; } },
  LngLatBounds: class {},
  version: '0.0.0-stub',
};

module.exports = maplibregl;
module.exports.default = maplibregl;
