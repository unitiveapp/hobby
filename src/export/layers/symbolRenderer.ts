import type { GeoProjection } from 'd3-geo';
import type * as GeoJSON from 'geojson';
import type { SymbolShape, SymbolStyle } from '../types';

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// ─── Shape generators ─────────────────────────────────────────────────────────

function circleElement(cx: number, cy: number, r: number, attrs: string): string {
  return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r}" ${attrs}/>`;
}

function squareElement(cx: number, cy: number, r: number, attrs: string): string {
  const x = (cx - r).toFixed(2);
  const y = (cy - r).toFixed(2);
  const size = (r * 2).toFixed(2);
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" ${attrs}/>`;
}

function triangleElement(cx: number, cy: number, r: number, attrs: string): string {
  // Equilateral triangle pointing up, centred on (cx, cy)
  const h = r * Math.sqrt(3);
  const p1 = `${cx.toFixed(2)},${(cy - (h * 2) / 3).toFixed(2)}`;
  const p2 = `${(cx - r).toFixed(2)},${(cy + h / 3).toFixed(2)}`;
  const p3 = `${(cx + r).toFixed(2)},${(cy + h / 3).toFixed(2)}`;
  return `<polygon points="${p1} ${p2} ${p3}" ${attrs}/>`;
}

function diamondElement(cx: number, cy: number, r: number, attrs: string): string {
  const p1 = `${cx.toFixed(2)},${(cy - r).toFixed(2)}`;
  const p2 = `${(cx + r).toFixed(2)},${cy.toFixed(2)}`;
  const p3 = `${cx.toFixed(2)},${(cy + r).toFixed(2)}`;
  const p4 = `${(cx - r).toFixed(2)},${cy.toFixed(2)}`;
  return `<polygon points="${p1} ${p2} ${p3} ${p4}" ${attrs}/>`;
}

function starElement(cx: number, cy: number, r: number, attrs: string): string {
  // 5-pointed star
  const inner = r * 0.4;
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : inner;
    points.push(
      `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return `<polygon points="${points.join(' ')}" ${attrs}/>`;
}

// ─── Attribute helpers ────────────────────────────────────────────────────────

function buildStyleAttrs(style: SymbolStyle): string {
  const parts: string[] = [];
  parts.push(`fill="${esc(style.fill ?? '#555')}"`);
  if (style.fillOpacity !== undefined)
    parts.push(`fill-opacity="${style.fillOpacity}"`);
  if (style.stroke) {
    parts.push(`stroke="${esc(style.stroke)}"`);
    parts.push(`stroke-width="${style.strokeWidth ?? 1}"`);
  } else {
    parts.push('stroke="none"');
  }
  if (style.opacity !== undefined) parts.push(`opacity="${style.opacity}"`);
  return parts.join(' ');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Renders a single Point feature as an SVG symbol element.
 * Returns an empty string if the point is outside the viewport.
 */
export function renderSymbol(
  feature: GeoJSON.Feature<GeoJSON.Point>,
  proj: GeoProjection,
  style: SymbolStyle,
): string {
  const projected = proj(feature.geometry.coordinates as [number, number]);
  if (!projected) return '';
  const [cx, cy] = projected;

  const attrs = buildStyleAttrs(style);
  const r = style.size;
  const shape: SymbolShape = style.shape;

  switch (shape) {
    case 'circle':   return circleElement(cx, cy, r, attrs);
    case 'square':   return squareElement(cx, cy, r, attrs);
    case 'triangle': return triangleElement(cx, cy, r, attrs);
    case 'diamond':  return diamondElement(cx, cy, r, attrs);
    case 'star':     return starElement(cx, cy, r, attrs);
    default:         return circleElement(cx, cy, r, attrs);
  }
}

/**
 * Renders all Point / MultiPoint features in a collection.
 * Non-point features are silently skipped.
 */
export function renderSymbolCollection(
  collection: GeoJSON.FeatureCollection,
  proj: GeoProjection,
  style: SymbolStyle,
): string[] {
  const results: string[] = [];
  for (const feature of collection.features) {
    if (feature.geometry?.type === 'Point') {
      const el = renderSymbol(
        feature as GeoJSON.Feature<GeoJSON.Point>,
        proj,
        style,
      );
      if (el) results.push(el);
    } else if (feature.geometry?.type === 'MultiPoint') {
      const mp = feature.geometry as GeoJSON.MultiPoint;
      for (const coord of mp.coordinates) {
        const el = renderSymbol(
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coord },
            properties: feature.properties,
          },
          proj,
          style,
        );
        if (el) results.push(el);
      }
    }
  }
  return results;
}
