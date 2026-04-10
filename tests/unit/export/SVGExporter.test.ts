import { describe, it, expect } from 'vitest';
import type * as GeoJSON from 'geojson';
import { SVGExporter } from '../../../src/export/SVGExporter';
import { LAYER_STACK } from '../../../src/export/layers/hierarchy';
import type { PrintLayoutSpec, ExportDataPackage } from '../../../src/export/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LAYOUT: PrintLayoutSpec = {
  widthPx: 800,
  heightPx: 600,
  dpi: 96,
  projection: 'mercator',
  bbox: [-10, 35, 40, 60],
  title: 'Test Map',
  subtitle: 'Subtitle',
  credits: '© Test',
  showScaleBar: true,
  showNorthArrow: true,
  showLegend: true,
  keepEmptyLayers: true,
};

const poly: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [0, 45], [10, 45], [10, 55], [0, 55], [0, 45],
    ]],
  },
  properties: {},
};

const line: GeoJSON.Feature<GeoJSON.LineString> = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [[0, 48], [5, 52], [10, 48]],
  },
  properties: { highway_class: 'primary' },
};

const point: GeoJSON.Feature<GeoJSON.Point> = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [5, 50] },
  properties: { place_type: 'city', name: 'TestCity', label: 'TestCity', label_type: 'city' },
};

const DATA: ExportDataPackage = {
  terrain: { type: 'FeatureCollection', features: [poly] },
  water: { type: 'FeatureCollection', features: [poly] },
  nationalBoundaries: { type: 'FeatureCollection', features: [line] },
  disputedBoundaries:  { type: 'FeatureCollection', features: [line] },
  roads: {
    type: 'FeatureCollection',
    features: [
      { ...line, properties: { highway_class: 'highway' } },
      { ...line, properties: { highway_class: 'primary' } },
      { ...line, properties: { highway_class: 'local' } },
    ],
  },
  settlements: { type: 'FeatureCollection', features: [point] },
  conflictZones: { type: 'FeatureCollection', features: [poly] },
  labels: { type: 'FeatureCollection', features: [point] },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SVGExporter', () => {
  const exporter = new SVGExporter();
  let svg: string;

  // Generate once; all assertions below use the cached string.
  it('produces a non-empty SVG string', () => {
    svg = exporter.export(LAYOUT, DATA);
    expect(svg).toBeTruthy();
    expect(svg.length).toBeGreaterThan(100);
    // Store on the outer scope for subsequent tests.
    (globalThis as Record<string, unknown>).__svgFixture = svg;
  });

  it('includes required SVG namespaces', () => {
    svg = (globalThis as Record<string, unknown>).__svgFixture as string ?? exporter.export(LAYOUT, DATA);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('xmlns:i="http://ns.adobe.com/AdobeIllustrator/10.0/"');
    expect(svg).toContain('xmlns:x="http://ns.adobe.com/Extensibility/1.0/"');
    expect(svg).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
  });

  it('marks every top-level layer group with i:layer="yes"', () => {
    svg = exporter.export(LAYOUT, DATA);
    // Every top-level <g> should carry i:layer="yes"
    const topGroupMatches = svg.match(/<g [^>]*i:layer="yes"[^>]*>/g) ?? [];
    // We expect at least as many top-level groups as LAYER_STACK entries
    expect(topGroupMatches.length).toBeGreaterThanOrEqual(LAYER_STACK.length);
  });

  it('uses Illustrator-safe IDs (no spaces) on all layer groups', () => {
    svg = exporter.export(LAYOUT, DATA);
    const idMatches = [...svg.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    for (const id of idMatches) {
      expect(id).not.toMatch(/\s/);
    }
  });

  it('locks the Background layer', () => {
    svg = exporter.export(LAYOUT, DATA);
    expect(svg).toContain('id="Background"');
    // Background group should have i:locked="yes"
    const bgGroup = svg.match(/<g [^>]*id="Background"[^>]*>/)?.[0] ?? '';
    expect(bgGroup).toContain('i:locked="yes"');
  });

  it('includes a <defs> block with pattern definitions', () => {
    svg = exporter.export(LAYOUT, DATA);
    expect(svg).toContain('<defs>');
    expect(svg).toContain('id="conflict_hatch"');
    expect(svg).toContain('id="uncertain_dots"');
    expect(svg).toContain('id="restricted_zone"');
    expect(svg).toContain('id="terrain_gradient"');
  });

  it('renders canonical LAYER_STACK ids in the document', () => {
    svg = exporter.export(LAYOUT, DATA);
    const topLevelIds = LAYER_STACK.map(l => l.id);
    for (const id of topLevelIds) {
      expect(svg).toContain(`id="${id}"`);
    }
  });

  it('includes Road_Network sublayer groups', () => {
    svg = exporter.export(LAYOUT, DATA);
    expect(svg).toContain('id="Highways"');
    expect(svg).toContain('id="Primary_Roads"');
    expect(svg).toContain('id="Local_Roads"');
  });

  it('includes Settlements sublayer groups', () => {
    svg = exporter.export(LAYOUT, DATA);
    expect(svg).toContain('id="Cities"');
  });

  it('includes Frame_Elements sublayers', () => {
    svg = exporter.export(LAYOUT, DATA);
    expect(svg).toContain('id="Title"');
    expect(svg).toContain('id="Scale_Bar"');
    expect(svg).toContain('id="North_Arrow"');
    expect(svg).toContain('id="Legend"');
    expect(svg).toContain('id="Neat_Line"');
    expect(svg).toContain('id="Credits"');
  });

  it('renders the title text', () => {
    svg = exporter.export(LAYOUT, DATA);
    expect(svg).toContain('Test Map');
    expect(svg).toContain('Subtitle');
  });

  it('renders credits text', () => {
    svg = exporter.export(LAYOUT, DATA);
    expect(svg).toContain('© Test');
  });

  it('produces valid SVG structure (opens and closes svg tag)', () => {
    svg = exporter.export(LAYOUT, DATA);
    expect(svg.trimStart()).toMatch(/^<svg/);
    expect(svg.trimEnd()).toMatch(/<\/svg>$/);
  });

  it('renders conflict zones with hatch pattern fill', () => {
    svg = exporter.export(LAYOUT, DATA);
    expect(svg).toContain('url(#conflict_hatch)');
  });

  it('works with empty data (keepEmptyLayers=true)', () => {
    const emptySvg = exporter.export({ ...LAYOUT, keepEmptyLayers: true }, {});
    expect(emptySvg).toBeTruthy();
    // Still should have all top-level layer IDs
    for (const layer of LAYER_STACK) {
      expect(emptySvg).toContain(`id="${layer.id}"`);
    }
  });

  it('omits layers with no data when keepEmptyLayers=false', () => {
    const svg2 = exporter.export({ ...LAYOUT, keepEmptyLayers: false }, {});
    // Background is always rendered (has solid fill rect)
    expect(svg2).toContain('id="Background"');
    // Layers with sublayer content (Frame_Elements has neat line etc.)
    expect(svg2).toContain('id="Frame_Elements"');
    // Road_Network with no road data should be absent
    expect(svg2).not.toContain('id="Road_Network"');
  });
});

describe('LAYER_STACK', () => {
  it('has no duplicate ids', () => {
    const allIds: string[] = [];
    function collect(layers: typeof LAYER_STACK) {
      for (const l of layers) {
        allIds.push(l.id);
        if (l.sublayers) collect(l.sublayers);
      }
    }
    collect(LAYER_STACK);
    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
  });

  it('all ids are Illustrator-safe (no spaces)', () => {
    function check(layers: typeof LAYER_STACK) {
      for (const l of layers) {
        expect(l.id).not.toMatch(/\s/);
        if (l.sublayers) check(l.sublayers);
      }
    }
    check(LAYER_STACK);
  });

  it('ends with Frame_Elements (topmost visual layer)', () => {
    expect(LAYER_STACK[LAYER_STACK.length - 1].id).toBe('Frame_Elements');
  });

  it('starts with Background (bottommost layer)', () => {
    expect(LAYER_STACK[0].id).toBe('Background');
  });
});
