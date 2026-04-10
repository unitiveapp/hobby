import type * as GeoJSON from 'geojson';

// ─── Projection ───────────────────────────────────────────────────────────────

export type ProjectionType =
  | 'mercator'
  | 'albers'
  | 'equalEarth'
  | 'naturalEarth'
  | 'conic';

// ─── Layer Hierarchy ──────────────────────────────────────────────────────────

/** One node in the Illustrator layer tree (top-level or sublayer). */
export interface IllustratorLayer {
  /** SVG group id — must be Snake_Case or PascalCase; no spaces. */
  id: string;
  /** Human-readable label shown in Illustrator's Layers panel. */
  label: string;
  /** Renders `i:locked="yes"` on the group. */
  locked?: boolean;
  /** Renders `i:dimmedPercent="N"` on the group (0–100). */
  dimPercent?: number;
  sublayers?: IllustratorLayer[];
}

// ─── Rendering ────────────────────────────────────────────────────────────────

export type RenderMode = 'fill' | 'stroke' | 'symbol' | 'pattern' | 'text';

export type ConfidenceTier =
  | 'verified'
  | 'high'
  | 'medium'
  | 'low'
  | 'speculative';

export interface LayerStyle {
  fill?: string;
  fillOpacity?: number;
  /** Reference to a `<pattern>` or `<linearGradient>` id defined in `<defs>`. */
  fillPattern?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokeDasharray?: string;
  opacity?: number;
  /** Font size in px (text render mode). */
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  textAnchor?: 'start' | 'middle' | 'end';
}

export interface LayerRenderSpec {
  /** Must match an `IllustratorLayer.id` in the hierarchy. */
  layerId: string;
  features: GeoJSON.Feature[];
  renderMode: RenderMode;
  style: LayerStyle;
  confidenceTier?: ConfidenceTier;
}

// ─── Symbol ───────────────────────────────────────────────────────────────────

export type SymbolShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'star';

export interface SymbolStyle extends LayerStyle {
  shape: SymbolShape;
  /** Radius / half-size in px. */
  size: number;
}

// ─── Print Layout ─────────────────────────────────────────────────────────────

export interface PrintLayoutSpec {
  widthPx: number;
  heightPx: number;
  /** Dots-per-inch: 300 for press-ready print, 96 for screen. */
  dpi: number;
  projection: ProjectionType;
  /** Geographic extent: [minLng, minLat, maxLng, maxLat] */
  bbox: [number, number, number, number];
  title?: string;
  subtitle?: string;
  credits?: string;
  showScaleBar?: boolean;
  showNorthArrow?: boolean;
  showLegend?: boolean;
  /**
   * When true, top-level layer groups with no rendered content are still
   * emitted as empty `<g>` elements (useful to preserve layer structure for
   * cartographers who will add content manually in Illustrator).
   */
  keepEmptyLayers?: boolean;
}

// ─── Data Package ─────────────────────────────────────────────────────────────

/**
 * All GeoJSON data that SVGExporter knows how to place into the canonical
 * layer hierarchy. Every field is optional — missing data simply skips
 * the corresponding sublayer group.
 *
 * For roads and settlements, the exporter inspects feature properties
 * to route them into the correct sublayer:
 *   roads: `properties.highway_class` → 'highway' | 'primary' | 'secondary' | 'local'
 *   roads: `properties.confidence`   → ConfidenceTier (generates tier sublayer)
 *   settlements: `properties.place_type` → 'city' | 'town' | 'village'
 */
export interface ExportDataPackage {
  terrain?: GeoJSON.FeatureCollection;
  water?: GeoJSON.FeatureCollection;
  landUse?: GeoJSON.FeatureCollection;
  nationalBoundaries?: GeoJSON.FeatureCollection;
  disputedBoundaries?: GeoJSON.FeatureCollection;
  provincialBoundaries?: GeoJSON.FeatureCollection;
  /** Features may carry `properties.highway_class` and `properties.confidence`. */
  roads?: GeoJSON.FeatureCollection;
  /** Features may carry `properties.place_type` and `properties.confidence`. */
  settlements?: GeoJSON.FeatureCollection;
  /** Arbitrary additional data layers appended to Data_Overlays → Custom_Data. */
  dataOverlays?: GeoJSON.FeatureCollection[];
  conflictZones?: GeoJSON.FeatureCollection;
  annotations?: GeoJSON.FeatureCollection;
  /** Point/polygon labels — rendered as SVG `<text>` in the Labels layer. */
  labels?: GeoJSON.FeatureCollection;
}

// ─── Internal group representation ───────────────────────────────────────────

/** Internal tree node produced during rendering, before serialisation. */
export interface IllustratorLayerGroup {
  id: string;
  isTopLevel: boolean;
  locked: boolean;
  dimPercent?: number;
  /** Serialised SVG element strings that belong directly in this group. */
  elements: string[];
  children: IllustratorLayerGroup[];
}
