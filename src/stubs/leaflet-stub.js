/**
 * Stub for the `leaflet` package on native platforms.
 * LeafletAdapter is only ever instantiated on web.
 */
const L = {
  map: () => ({ on: () => {}, remove: () => {}, addLayer: () => {} }),
  tileLayer: () => ({ addTo: () => {} }),
  geoJSON: () => ({ addTo: () => {}, addData: () => {}, clearLayers: () => {}, setStyle: () => {} }),
  latLng: (lat, lng) => ({ lat, lng }),
};
module.exports = L;
module.exports.default = L;
