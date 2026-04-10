import type { GeoProjection, GeoPath } from 'd3-geo';
import { geoPath } from 'd3-geo';
import type * as GeoJSON from 'geojson';
import type { LayerStyle } from '../types';

// ─── Attribute helpers ────────────────────────────────────────────────────────

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function styleAttrs(style: LayerStyle): string {
  const parts: string[] = [];

  const fillRef = style.fillPattern
    ? `url(#${style.fillPattern})`
    : (style.fill ?? 'none');
  parts.push(`fill="${esc(fillRef)}"`);

  if (style.fillOpacity !== undefined)
    parts.push(`fill-opacity="${style.fillOpacity}"`);

  if (style.stroke) {
    parts.push(`stroke="${esc(style.stroke)}"`);
    if (style.strokeWidth !== undefined)
      parts.push(`stroke-width="${style.strokeWidth}"`);
    if (style.strokeOpacity !== undefined)
      parts.push(`stroke-opacity="${style.strokeOpacity}"`);
    if (style.strokeDasharray)
      parts.push(`stroke-dasharray="${esc(style.strokeDasharray)}"`);
  } else {
    parts.push('stroke="none"');
  }

  if (style.opacity !== undefined) parts.push(`opacity="${style.opacity}"`);

  return parts.join(' ');
}

// ─── Core renderer ────────────────────────────────────────────────────────────

/**
 * Converts a single GeoJSON Feature to an SVG element string using the
 * supplied D3 projection + path generator.
 *
 * Geometry types:
 *   Point / MultiPoint        → delegates to symbolRenderer (returns '')
 *   LineString / MultiLine    → `<path>` with fill="none"
 *   Polygon / MultiPolygon    → `<path>` with fill
 *   GeometryCollection        → recursively renders each member
 *
 * Returns an empty string if the feature cannot be projected (e.g., the
 * geometry falls entirely outside the viewport).
 */
export function renderFeature(
  feature: GeoJSON.Feature,
  proj: GeoProjection,
  style: LayerStyle,
  idPrefix?: string,
): string {
  if (!feature.geometry) return '';

  const pathGen: GeoPath = geoPath(proj);
  const geomType = feature.geometry.type;

  // Point types are handled by symbolRenderer — skip here.
  if (geomType === 'Point' || geomType === 'MultiPoint') return '';

  if (geomType === 'GeometryCollection') {
    return (feature.geometry as GeoJSON.GeometryCollection).geometries
      .map((geom, i) =>
        renderFeature(
          { type: 'Feature', geometry: geom, properties: feature.properties },
          proj,
          style,
          idPrefix ? `${idPrefix}_${i}` : undefined,
        ),
      )
      .join('\n');
  }

  const d = pathGen(feature as GeoJSON.Feature<GeoJSON.Geometry>);
  if (!d) return ''; // geometry off-screen

  const attrs = styleAttrs(style);
  const id = idPrefix ? ` id="${esc(idPrefix)}"` : '';

  return `<path${id} ${attrs} d="${esc(d)}"/>`;
}

/**
 * Renders an entire FeatureCollection into SVG path elements.
 * Returns an array of SVG element strings (one per feature).
 */
export function renderFeatureCollection(
  collection: GeoJSON.FeatureCollection,
  proj: GeoProjection,
  style: LayerStyle,
  idPrefix?: string,
): string[] {
  return collection.features
    .map((f, i) =>
      renderFeature(f, proj, style, idPrefix ? `${idPrefix}_${i}` : undefined),
    )
    .filter(Boolean);
}

/**
 * Renders an SVG `<text>` element for label features.
 * Expects `feature.geometry.type === 'Point'` and
 * `feature.properties.label` (or `.name`) as the text content.
 */
export function renderLabel(
  feature: GeoJSON.Feature<GeoJSON.Point>,
  proj: GeoProjection,
  style: LayerStyle,
): string {
  if (feature.geometry.type !== 'Point') return '';

  const projected = proj(feature.geometry.coordinates as [number, number]);
  if (!projected) return '';
  const [x, y] = projected;

  const text =
    (feature.properties?.label as string | undefined) ??
    (feature.properties?.name as string | undefined) ??
    '';
  if (!text) return '';

  const fontSize = style.fontSize ?? 10;
  const fontFamily = style.fontFamily ?? 'sans-serif';
  const fontWeight = style.fontWeight ?? 'normal';
  const anchor = style.textAnchor ?? 'middle';
  const fill = style.fill ?? '#333';

  return (
    `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}"` +
    ` font-size="${fontSize}"` +
    ` font-family="${esc(fontFamily)}"` +
    ` font-weight="${fontWeight}"` +
    ` text-anchor="${anchor}"` +
    ` fill="${esc(fill)}"` +
    ` dominant-baseline="central">` +
    `${esc(text)}</text>`
  );
}
