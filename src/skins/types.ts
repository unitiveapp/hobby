// ─── Token Primitives ─────────────────────────────────────────────────────────

/** A CSS color string, number, or expression value usable as a map style token */
export type SkinToken = string | number | boolean;

export interface RoadTokens {
  highway: string;
  arterial: string;
  local: string;
  path: string;
}

export interface LabelTokens {
  primary: string;
  secondary: string;
  halo: string;
  haloWidth: number;
}

export interface BuildingTokens {
  fill: string;
  outline: string;
  extrusion: string;
}

/** Full set of design tokens that drive map appearance */
export interface SkinTokens {
  // Colors
  background: string;
  water: string;
  waterway: string;
  landuse: string;
  park: string;
  roads: RoadTokens;
  labels: LabelTokens;
  buildings: BuildingTokens;
  borders: string;
  poi: string;
  // Typography
  fontStack: string[];
  // Zoom / visibility
  labelMinZoom: number;
  buildingMinZoom: number;
  // Global opacity
  globalOpacity: number;
}

// ─── Skin Layer Override ──────────────────────────────────────────────────────

/** Override the style of a specific layer or a wildcard pattern */
export interface SkinLayerOverride {
  /** Exact layer id or glob pattern (e.g. "road-*") */
  layerId: string;
  paint?: Record<string, SkinToken>;
  layout?: Record<string, SkinToken>;
  /** Mapbox/expression filter */
  filter?: unknown[];
  minZoom?: number;
  maxZoom?: number;
  visible?: boolean;
}

// ─── Adapter Hints ────────────────────────────────────────────────────────────

export interface MapSkinAdapterHints {
  mapbox?: {
    /** Full Mapbox style URL to use as base (overrides token-driven style) */
    styleUrl?: string;
    /** Extra raw Mapbox GL expressions to set */
    rawExpressions?: Record<string, unknown>;
  };
  leaflet?: {
    /** OSM / tile server URL template {z}/{x}/{y} */
    tileUrl?: string;
    attribution?: string;
    /** CSS variables to inject on the map container */
    cssVars?: Record<string, string>;
  };
  google?: {
    mapTypeId?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
    /** google.maps.MapTypeStyle[] serialised as plain objects */
    styles?: Record<string, unknown>[];
  };
}

// ─── MapSkin ─────────────────────────────────────────────────────────────────

/** A skin definition. Only `id` and partial tokens are required. */
export interface MapSkin {
  id: string;
  name: string;
  description?: string;
  /** Parent skin id for inheritance */
  extends?: string;
  /** Partial token overrides — only specify what differs from parent */
  tokens: Partial<SkinTokens>;
  /** Per-layer style overrides */
  layerOverrides: SkinLayerOverride[];
  adapterHints?: MapSkinAdapterHints;
  meta?: {
    author?: string;
    version?: string;
    /** URL or data URI for a preview thumbnail */
    thumbnail?: string;
    tags?: string[];
  };
}

/** A fully resolved skin — all tokens present, no `extends` */
export interface ResolvedSkin extends Omit<MapSkin, 'extends' | 'tokens'> {
  tokens: SkinTokens;
}

// ─── Translated Skin (per adapter) ────────────────────────────────────────────

/** What an adapter receives after translation */
export interface TranslatedSkin {
  /** The resolved skin it was translated from */
  resolvedSkin: ResolvedSkin;
  /** Adapter-specific payload */
  payload: unknown;
}

export interface SkinTranslator<P = unknown> {
  translate(skin: ResolvedSkin): P;
}
