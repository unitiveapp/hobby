/**
 * SVGExporter — produces Adobe Illustrator-compatible SVG documents from
 * cartographic data packages.
 *
 * Adobe Illustrator layer compatibility:
 *   • Root `<svg>` carries `xmlns:i` and `xmlns:x` namespace declarations.
 *   • Every top-level `<g>` child has `i:layer="yes"` → appears as a named
 *     layer in Illustrator's Layers panel.
 *   • Sub-groups within each layer appear as sub-layers (no `i:layer` needed).
 *   • Layer IDs use Snake_Case (Illustrator strips spaces from display names).
 *   • SVG paint order is bottom→top; Illustrator panel shows them reversed
 *     (Frame_Elements at top of panel = topmost visually).
 *
 * Usage:
 *   const exporter = new SVGExporter();
 *   const svg = exporter.export(layout, data);
 *   fs.writeFileSync('map.svg', svg, 'utf8');
 */

import {
  geoMercator,
  geoAlbers,
  geoEqualEarth,
  geoNaturalEarth1,
  geoConicEqualArea,
  geoPath,
} from 'd3-geo';
import type { GeoProjection, GeoPath } from 'd3-geo';
import type * as GeoJSON from 'geojson';

import type {
  PrintLayoutSpec,
  ExportDataPackage,
  IllustratorLayer,
  IllustratorLayerGroup,
  LayerStyle,
  SymbolStyle,
} from './types';
import { LAYER_STACK, HIGHWAY_CLASS_TO_SUBLAYER, PLACE_TYPE_TO_SUBLAYER } from './layers/hierarchy';
import { buildPatternDefs } from './layers/patternDefs';
import { renderFeatureCollection, renderLabel } from './layers/featureRenderer';
import { renderSymbolCollection } from './layers/symbolRenderer';

// ─── Default layer styles ─────────────────────────────────────────────────────

const DEFAULT_STYLES: Record<string, LayerStyle> = {
  Terrain:      { fill: 'url(#terrain_gradient)', stroke: '#c8b89a', strokeWidth: 0.3 },
  Land_Use:     { fill: '#e8e0d0', stroke: 'none' },
  Water_Bodies: { fill: 'url(#water_gradient)', stroke: '#5592b8', strokeWidth: 0.5 },
  National_Boundaries:  { fill: 'none', stroke: '#444', strokeWidth: 1.5 },
  Disputed_Boundaries:  { fill: 'none', stroke: '#c0392b', strokeWidth: 1.2, strokeDasharray: '4 3' },
  Provincial_Boundaries:{ fill: 'none', stroke: '#888', strokeWidth: 0.7, strokeDasharray: '2 2' },
  Highways:       { fill: 'none', stroke: '#c0392b', strokeWidth: 1.8 },
  Primary_Roads:  { fill: 'none', stroke: '#e67e22', strokeWidth: 1.2 },
  Secondary_Roads:{ fill: 'none', stroke: '#f39c12', strokeWidth: 0.8 },
  Local_Roads:    { fill: 'none', stroke: '#bdc3c7', strokeWidth: 0.5, opacity: 0.7 },
  Conflict_Zones: { fill: 'url(#conflict_hatch)', stroke: '#e05c00', strokeWidth: 0.8, fillOpacity: 0.8 },
  Heatmap:        { fill: '#e74c3c', fillOpacity: 0.4, stroke: 'none' },
  Custom_Data:    { fill: '#3498db', fillOpacity: 0.5, stroke: '#2980b9', strokeWidth: 0.5 },
  Annotations:    { fill: 'none', stroke: '#2c3e50', strokeWidth: 1, strokeDasharray: '1 2' },
};

const DEFAULT_SETTLEMENT_SYMBOLS: Record<string, SymbolStyle> = {
  Cities:   { shape: 'circle', size: 5, fill: '#2c3e50', stroke: '#fff', strokeWidth: 1 },
  Towns:    { shape: 'circle', size: 3, fill: '#555',    stroke: '#fff', strokeWidth: 0.7 },
  Villages: { shape: 'circle', size: 2, fill: '#888',    stroke: '#fff', strokeWidth: 0.5 },
};

const DEFAULT_LABEL_STYLE: LayerStyle = {
  fill: '#222', fontSize: 9, fontFamily: 'Arial, Helvetica, sans-serif',
  fontWeight: 'normal', textAnchor: 'middle',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function groupOpen(layer: IllustratorLayer, isTopLevel: boolean): string {
  const attrs: string[] = [`id="${layer.id}"`];
  if (isTopLevel) attrs.push('i:layer="yes"');
  if (layer.locked) attrs.push('i:locked="yes"');
  if (layer.dimPercent !== undefined) attrs.push(`i:dimmedPercent="${layer.dimPercent}"`);
  return `<g ${attrs.join(' ')}>`;
}

function serialiseGroup(group: IllustratorLayerGroup, indent = 2): string {
  const pad = ' '.repeat(indent);
  const layer: IllustratorLayer = {
    id: group.id,
    label: group.id,
    locked: group.locked,
    dimPercent: group.dimPercent,
  };
  const open = groupOpen(layer, group.isTopLevel);
  const inner: string[] = [
    ...group.elements.map(el => `${pad}  ${el}`),
    ...group.children.map(c => serialiseGroup(c, indent + 2).split('\n').map(l => `${pad}  ${l}`).join('\n')),
  ];
  return `${pad}${open}\n${inner.join('\n')}\n${pad}</g>`;
}

// ─── Projection builder ───────────────────────────────────────────────────────

function buildProjection(layout: PrintLayoutSpec): GeoProjection {
  const [minLng, minLat, maxLng, maxLat] = layout.bbox;
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  let proj: GeoProjection;
  switch (layout.projection) {
    case 'albers':
      proj = geoAlbers().center([0, centerLat]).rotate([-centerLng, 0]);
      break;
    case 'equalEarth':
      proj = geoEqualEarth().center([centerLng, centerLat]);
      break;
    case 'naturalEarth':
      proj = geoNaturalEarth1().center([centerLng, centerLat]);
      break;
    case 'conic':
      proj = geoConicEqualArea().center([0, centerLat]).rotate([-centerLng, 0]);
      break;
    case 'mercator':
    default:
      proj = geoMercator().center([centerLng, centerLat]);
  }

  // Fit the bbox extent to the SVG canvas with a 20px margin.
  const margin = 20;
  proj.fitExtent(
    [[margin, margin], [layout.widthPx - margin, layout.heightPx - margin]],
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [minLng, minLat], [maxLng, minLat],
          [maxLng, maxLat], [minLng, maxLat], [minLng, minLat],
        ]],
      },
      properties: null,
    } as GeoJSON.Feature,
  );

  return proj;
}

// ─── Frame element renderers ──────────────────────────────────────────────────

function renderNeatLine(layout: PrintLayoutSpec): string {
  const m = 8;
  return `<rect x="${m}" y="${m}" width="${layout.widthPx - m * 2}" height="${layout.heightPx - m * 2}" fill="none" stroke="#222" stroke-width="1.5"/>`;
}

function renderTitle(layout: PrintLayoutSpec): string {
  if (!layout.title) return '';
  const cx = layout.widthPx / 2;
  const lines: string[] = [`<text x="${cx.toFixed(1)}" y="32" font-size="18" font-family="Georgia, serif" font-weight="bold" text-anchor="middle" fill="#111">${esc(layout.title)}</text>`];
  if (layout.subtitle) {
    lines.push(`<text x="${cx.toFixed(1)}" y="50" font-size="11" font-family="Arial, sans-serif" text-anchor="middle" fill="#444">${esc(layout.subtitle)}</text>`);
  }
  return lines.join('\n');
}

function renderCredits(layout: PrintLayoutSpec): string {
  if (!layout.credits) return '';
  const x = layout.widthPx - 10;
  const y = layout.heightPx - 10;
  return `<text x="${x}" y="${y}" font-size="7" font-family="Arial, sans-serif" text-anchor="end" fill="#777">${esc(layout.credits)}</text>`;
}

function renderScaleBar(layout: PrintLayoutSpec, proj: GeoProjection): string {
  if (!layout.showScaleBar) return '';

  // Approximate scale: project two points 1° apart at map center
  const [minLng, minLat, maxLng, maxLat] = layout.bbox;
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const p1 = proj([centerLng, centerLat]);
  const p2 = proj([centerLng + 1, centerLat]);
  if (!p1 || !p2) return '';

  const pxPerDeg = Math.abs(p2[0] - p1[0]);
  // ~111 km per degree latitude; approximate for longitude at given latitude
  const kmPerDeg = 111.32 * Math.cos((centerLat * Math.PI) / 180);
  const pxPer100km = (pxPerDeg / kmPerDeg) * 100;
  const barWidth = Math.min(pxPer100km, layout.widthPx * 0.2);

  const x = 20;
  const y = layout.heightPx - 28;
  const h = 6;

  return [
    `<rect x="${x}" y="${y}" width="${barWidth.toFixed(1)}" height="${h}" fill="#333"/>`,
    `<rect x="${(x + barWidth / 2).toFixed(1)}" y="${y}" width="${(barWidth / 2).toFixed(1)}" height="${h}" fill="#fff" stroke="#333" stroke-width="0.5"/>`,
    `<text x="${x}" y="${y + h + 10}" font-size="8" font-family="Arial, sans-serif" fill="#333">0</text>`,
    `<text x="${(x + barWidth / 2).toFixed(1)}" y="${y + h + 10}" font-size="8" font-family="Arial, sans-serif" text-anchor="middle" fill="#333">50 km</text>`,
    `<text x="${(x + barWidth).toFixed(1)}" y="${y + h + 10}" font-size="8" font-family="Arial, sans-serif" text-anchor="end" fill="#333">100 km</text>`,
  ].join('\n');
}

function renderNorthArrow(layout: PrintLayoutSpec): string {
  if (!layout.showNorthArrow) return '';
  const x = layout.widthPx - 36;
  const y = layout.heightPx - 60;
  return [
    `<g transform="translate(${x},${y})">`,
    `  <polygon points="0,-18 5,0 0,-4 -5,0" fill="#222"/>`,
    `  <polygon points="0,-4 5,0 0,4 -5,0" fill="#aaa"/>`,
    `  <text x="0" y="16" font-size="9" font-family="Arial,sans-serif" text-anchor="middle" fill="#222">N</text>`,
    `</g>`,
  ].join('\n');
}

function renderLegend(layout: PrintLayoutSpec, _groups: IllustratorLayerGroup[]): string {
  if (!layout.showLegend) return '';
  const x = layout.widthPx - 130;
  const y = 60;
  const entries: Array<{ color: string; label: string }> = [
    { color: '#c0392b', label: 'Highway' },
    { color: '#e67e22', label: 'Primary Road' },
    { color: '#f39c12', label: 'Secondary Road' },
    { color: '#5592b8', label: 'Water' },
    { color: '#e05c00', label: 'Conflict Zone' },
    { color: '#3498db', label: 'Data Overlay' },
  ];

  const rows = entries.map((e, i) => {
    const ry = y + 20 + i * 14;
    return [
      `<rect x="${x + 4}" y="${ry - 6}" width="12" height="8" fill="${e.color}"/>`,
      `<text x="${x + 20}" y="${ry}" font-size="8" font-family="Arial,sans-serif" fill="#222">${esc(e.label)}</text>`,
    ].join('');
  });

  return [
    `<rect x="${x}" y="${y}" width="124" height="${22 + entries.length * 14}" fill="#fff" fill-opacity="0.88" stroke="#bbb" stroke-width="0.7" rx="2"/>`,
    `<text x="${x + 62}" y="${y + 13}" font-size="9" font-family="Arial,sans-serif" font-weight="bold" text-anchor="middle" fill="#222">Legend</text>`,
    ...rows,
  ].join('\n');
}

// ─── Layer builders ───────────────────────────────────────────────────────────

function makeGroup(
  id: string,
  isTopLevel: boolean,
  elements: string[],
  children: IllustratorLayerGroup[] = [],
  locked = false,
  dimPercent?: number,
): IllustratorLayerGroup {
  return { id, isTopLevel, locked, dimPercent, elements, children };
}

function buildRoadSubgroups(
  data: ExportDataPackage,
  proj: GeoProjection,
): IllustratorLayerGroup[] {
  if (!data.roads?.features.length) return [];

  // Partition by highway_class
  const bins: Record<string, GeoJSON.Feature[]> = {
    Highways: [], Primary_Roads: [], Secondary_Roads: [], Local_Roads: [],
  };

  for (const f of data.roads.features) {
    const cls = (f.properties?.highway_class as string | undefined) ?? 'local';
    const sublayerId = HIGHWAY_CLASS_TO_SUBLAYER[cls] ?? 'Local_Roads';
    bins[sublayerId]?.push(f);
  }

  return Object.entries(bins)
    .filter(([, feats]) => feats.length > 0)
    .map(([id, feats]) => {
      const style = DEFAULT_STYLES[id] ?? DEFAULT_STYLES.Local_Roads;
      const elements = renderFeatureCollection({ type: 'FeatureCollection', features: feats }, proj, style);
      return makeGroup(id, false, elements);
    });
}

function buildSettlementSubgroups(
  data: ExportDataPackage,
  proj: GeoProjection,
): IllustratorLayerGroup[] {
  if (!data.settlements?.features.length) return [];

  const bins: Record<string, GeoJSON.Feature[]> = {
    Cities: [], Towns: [], Villages: [],
  };

  for (const f of data.settlements.features) {
    const pt = (f.properties?.place_type as string | undefined) ?? 'village';
    const sublayerId = PLACE_TYPE_TO_SUBLAYER[pt] ?? 'Villages';
    bins[sublayerId]?.push(f);
  }

  return Object.entries(bins)
    .filter(([, feats]) => feats.length > 0)
    .map(([id, feats]) => {
      const symbolStyle = DEFAULT_SETTLEMENT_SYMBOLS[id] ?? DEFAULT_SETTLEMENT_SYMBOLS.Villages;
      const elements = renderSymbolCollection({ type: 'FeatureCollection', features: feats }, proj, symbolStyle);
      return makeGroup(id, false, elements);
    });
}

// ─── Main class ───────────────────────────────────────────────────────────────

export class SVGExporter {
  /**
   * Export a cartographic SVG document that opens correctly in Adobe
   * Illustrator with properly named, hierarchically grouped layers.
   *
   * @param layout  Canvas dimensions, projection, and map extent.
   * @param data    GeoJSON data to render, keyed by semantic type.
   * @returns       A complete SVG document string ready for file output.
   */
  export(layout: PrintLayoutSpec, data: ExportDataPackage): string {
    const proj = buildProjection(layout);
    const pathGen: GeoPath = geoPath(proj);
    const defs = buildPatternDefs();
    const groups = this.buildAllLayers(layout, data, proj, pathGen);
    return this.serialize(layout, defs, groups);
  }

  // ── Layer assembly ─────────────────────────────────────────────────────────

  private buildAllLayers(
    layout: PrintLayoutSpec,
    data: ExportDataPackage,
    proj: GeoProjection,
    _pathGen: GeoPath,
  ): IllustratorLayerGroup[] {
    const keep = layout.keepEmptyLayers ?? false;

    // Process LAYER_STACK in order (bottom → top).
    const groups: IllustratorLayerGroup[] = [];

    for (const layerDef of LAYER_STACK) {
      const group = this.buildTopLevelGroup(layerDef, data, proj, layout);
      if (keep || group.elements.length > 0 || group.children.some(c => c.elements.length > 0)) {
        groups.push(group);
      }
    }

    return groups;
  }

  private buildTopLevelGroup(
    layerDef: IllustratorLayer,
    data: ExportDataPackage,
    proj: GeoProjection,
    layout: PrintLayoutSpec,
  ): IllustratorLayerGroup {
    switch (layerDef.id) {
      case 'Background':
        return makeGroup('Background', true,
          [`<rect x="0" y="0" width="${layout.widthPx}" height="${layout.heightPx}" fill="#f5f0e8"/>`],
          [], true);

      case 'Base_Map':
        return makeGroup('Base_Map', true, [], [
          makeGroup('Terrain', false,
            data.terrain ? renderFeatureCollection(data.terrain, proj, DEFAULT_STYLES.Terrain) : []),
          makeGroup('Land_Use', false,
            data.landUse ? renderFeatureCollection(data.landUse, proj, DEFAULT_STYLES.Land_Use) : []),
          makeGroup('Water_Bodies', false,
            data.water ? renderFeatureCollection(data.water, proj, DEFAULT_STYLES.Water_Bodies) : []),
        ]);

      case 'Admin_Boundaries':
        return makeGroup('Admin_Boundaries', true, [], [
          makeGroup('Provincial_Boundaries', false,
            data.provincialBoundaries
              ? renderFeatureCollection(data.provincialBoundaries, proj, DEFAULT_STYLES.Provincial_Boundaries) : []),
          makeGroup('Disputed_Boundaries', false,
            data.disputedBoundaries
              ? renderFeatureCollection(data.disputedBoundaries, proj, DEFAULT_STYLES.Disputed_Boundaries) : []),
          makeGroup('National_Boundaries', false,
            data.nationalBoundaries
              ? renderFeatureCollection(data.nationalBoundaries, proj, DEFAULT_STYLES.National_Boundaries) : []),
        ]);

      case 'Road_Network':
        return makeGroup('Road_Network', true, [], buildRoadSubgroups(data, proj));

      case 'Settlements':
        return makeGroup('Settlements', true, [], buildSettlementSubgroups(data, proj));

      case 'Data_Overlays': {
        const customElements = (data.dataOverlays ?? []).flatMap(fc =>
          renderFeatureCollection(fc, proj, DEFAULT_STYLES.Custom_Data));
        return makeGroup('Data_Overlays', true, [], [
          makeGroup('Heatmap', false,
            data.conflictZones ? renderFeatureCollection(data.conflictZones, proj, DEFAULT_STYLES.Heatmap) : []),
          makeGroup('Conflict_Zones', false,
            data.conflictZones ? renderFeatureCollection(data.conflictZones, proj, DEFAULT_STYLES.Conflict_Zones) : []),
          makeGroup('Custom_Data', false, customElements),
        ]);
      }

      case 'Labels': {
        if (!data.labels?.features.length) return makeGroup('Labels', true, [], []);
        const cityLabels: string[] = [];
        const regionLabels: string[] = [];
        const poiLabels: string[] = [];
        for (const f of data.labels.features) {
          if (f.geometry?.type !== 'Point') continue;
          const el = renderLabel(f as GeoJSON.Feature<GeoJSON.Point>, proj, DEFAULT_LABEL_STYLE);
          if (!el) continue;
          const lt = (f.properties?.label_type as string | undefined) ?? 'poi';
          if (lt === 'region') regionLabels.push(el);
          else if (lt === 'city') cityLabels.push(el);
          else poiLabels.push(el);
        }
        return makeGroup('Labels', true, [], [
          makeGroup('Region_Labels', false, regionLabels),
          makeGroup('City_Labels', false, cityLabels),
          makeGroup('POI_Labels', false, poiLabels),
        ]);
      }

      case 'Annotations':
        return makeGroup('Annotations', true, [], [
          makeGroup('Notes', false, []),
          makeGroup('Callouts', false,
            data.annotations ? renderFeatureCollection(data.annotations, proj, DEFAULT_STYLES.Annotations) : []),
        ]);

      case 'Frame_Elements': {
        const proj2 = proj; // alias for closure
        return makeGroup('Frame_Elements', true, [], [
          makeGroup('Neat_Line',   false, [renderNeatLine(layout)]),
          makeGroup('Scale_Bar',   false, [renderScaleBar(layout, proj2)].filter(Boolean)),
          makeGroup('North_Arrow', false, [renderNorthArrow(layout)].filter(Boolean)),
          makeGroup('Legend',      false, [renderLegend(layout, [])].filter(Boolean)),
          makeGroup('Title',       false, [renderTitle(layout)].filter(Boolean)),
          makeGroup('Credits',     false, [renderCredits(layout)].filter(Boolean)),
        ]);
      }

      default:
        return makeGroup(layerDef.id, true, []);
    }
  }

  // ── Serialisation ──────────────────────────────────────────────────────────

  private serialize(
    layout: PrintLayoutSpec,
    defs: string,
    groups: IllustratorLayerGroup[],
  ): string {
    const w = layout.widthPx;
    const h = layout.heightPx;

    const svgOpen = [
      `<svg`,
      `  xmlns="http://www.w3.org/2000/svg"`,
      `  xmlns:xlink="http://www.w3.org/1999/xlink"`,
      `  xmlns:i="http://ns.adobe.com/AdobeIllustrator/10.0/"`,
      `  xmlns:x="http://ns.adobe.com/Extensibility/1.0/"`,
      `  width="${w}" height="${h}"`,
      `  viewBox="0 0 ${w} ${h}"`,
      `  version="1.1"`,
      `>`,
    ].join('\n');

    const defsBlock = `  ${defs.split('\n').join('\n  ')}`;

    // SVG renders bottom→top; groups are already in that order.
    const groupBlocks = groups.map(g => serialiseGroup(g, 2)).join('\n');

    return [svgOpen, defsBlock, groupBlocks, '</svg>'].join('\n');
  }
}
