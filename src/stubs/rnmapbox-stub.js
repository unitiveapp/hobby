/**
 * Empty stub for @rnmapbox/maps on web.
 * The MapboxNativeAdapter is never instantiated on web (the factory
 * returns 'leaflet' or 'mapbox-web' instead), so this stub just
 * prevents the build from failing when the module is imported.
 */
const Mapbox = {
  setAccessToken: () => {},
  Camera: class Camera {},
  MapView: () => null,
  ShapeSource: () => null,
  FillLayer: () => null,
  LineLayer: () => null,
  SymbolLayer: () => null,
  CircleLayer: () => null,
  HeatmapLayer: () => null,
  RasterLayer: () => null,
  MarkerView: () => null,
  PointAnnotation: () => null,
  offlineManager: {},
};

module.exports = Mapbox;
module.exports.default = Mapbox;
