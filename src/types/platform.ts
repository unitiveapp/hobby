export type PlatformOS = 'web' | 'native';

export interface PlatformCapabilities {
  /** Supports 3D perspective / pitch */
  supports3D: boolean;
  /** Can render Mapbox/MVT vector tiles */
  supportsVectorTiles: boolean;
  /** Supports custom map projections */
  supportsCustomProjection: boolean;
  /** Can render raster image overlays */
  supportsImageOverlay: boolean;
  /** Native heatmap layer support */
  supportsHeatmap: boolean;
  /** Web Animations API or Reanimated available */
  supportsAnimation: boolean;
  /** Canvas or WebGL draw overlay */
  supportsCanvasOverlay: boolean;
}
