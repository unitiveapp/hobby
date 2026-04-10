import type { IllustratorLayer } from '../types';

/**
 * Canonical layer stack for cartographic SVG exports.
 *
 * Order is **bottom-to-top** (SVG paint order).  Adobe Illustrator inverts
 * this when displaying the Layers panel, so the topmost visual layer
 * (Frame_Elements) appears first in the panel.
 *
 * Rules for Illustrator-compatible IDs:
 *  - Use Snake_Case or PascalCase
 *  - No spaces, no slashes
 *  - Must be unique within the document
 */
export const LAYER_STACK: IllustratorLayer[] = [
  // ── 1. Background ─────────────────────────────────────────────────────────
  {
    id: 'Background',
    label: 'Background',
    locked: true,
    sublayers: [],
  },

  // ── 2. Base Map ───────────────────────────────────────────────────────────
  {
    id: 'Base_Map',
    label: 'Base Map',
    sublayers: [
      { id: 'Terrain', label: 'Terrain' },
      { id: 'Land_Use', label: 'Land Use' },
      { id: 'Water_Bodies', label: 'Water Bodies' },
    ],
  },

  // ── 3. Admin Boundaries ───────────────────────────────────────────────────
  {
    id: 'Admin_Boundaries',
    label: 'Admin Boundaries',
    sublayers: [
      { id: 'Provincial_Boundaries', label: 'Provincial Boundaries' },
      { id: 'Disputed_Boundaries', label: 'Disputed Boundaries' },
      { id: 'National_Boundaries', label: 'National Boundaries' },
    ],
  },

  // ── 4. Road Network ───────────────────────────────────────────────────────
  // Static sub-layers by road class. Confidence-tier sub-layers
  // (Roads_Verified, Roads_Unverified, etc.) are inserted dynamically by
  // SVGExporter when the data carries `properties.confidence`.
  {
    id: 'Road_Network',
    label: 'Road Network',
    sublayers: [
      { id: 'Local_Roads', label: 'Local Roads' },
      { id: 'Secondary_Roads', label: 'Secondary Roads' },
      { id: 'Primary_Roads', label: 'Primary Roads' },
      { id: 'Highways', label: 'Highways' },
    ],
  },

  // ── 5. Settlements ────────────────────────────────────────────────────────
  {
    id: 'Settlements',
    label: 'Settlements',
    sublayers: [
      { id: 'Villages', label: 'Villages' },
      { id: 'Towns', label: 'Towns' },
      { id: 'Cities', label: 'Cities' },
    ],
  },

  // ── 6. Data Overlays ──────────────────────────────────────────────────────
  {
    id: 'Data_Overlays',
    label: 'Data Overlays',
    sublayers: [
      { id: 'Heatmap', label: 'Heatmap' },
      { id: 'Conflict_Zones', label: 'Conflict Zones' },
      { id: 'Custom_Data', label: 'Custom Data' },
    ],
  },

  // ── 7. Labels ─────────────────────────────────────────────────────────────
  {
    id: 'Labels',
    label: 'Labels',
    sublayers: [
      { id: 'Region_Labels', label: 'Region Labels' },
      { id: 'City_Labels', label: 'City Labels' },
      { id: 'POI_Labels', label: 'POI Labels' },
    ],
  },

  // ── 8. Annotations ────────────────────────────────────────────────────────
  {
    id: 'Annotations',
    label: 'Annotations',
    sublayers: [
      { id: 'Notes', label: 'Notes' },
      { id: 'Callouts', label: 'Callouts' },
    ],
  },

  // ── 9. Frame Elements (topmost — always drawn last) ───────────────────────
  {
    id: 'Frame_Elements',
    label: 'Frame Elements',
    sublayers: [
      { id: 'Neat_Line', label: 'Neat Line' },
      { id: 'Scale_Bar', label: 'Scale Bar' },
      { id: 'North_Arrow', label: 'North Arrow' },
      { id: 'Legend', label: 'Legend' },
      { id: 'Title', label: 'Title' },
      { id: 'Credits', label: 'Credits' },
    ],
  },
];

/** Flat map of every layer id → its definition (including sublayers). */
export const LAYER_INDEX: ReadonlyMap<string, IllustratorLayer> = (() => {
  const map = new Map<string, IllustratorLayer>();
  function index(layer: IllustratorLayer) {
    map.set(layer.id, layer);
    layer.sublayers?.forEach(index);
  }
  LAYER_STACK.forEach(index);
  return map;
})();

/** Road `highway_class` property value → sublayer id. */
export const HIGHWAY_CLASS_TO_SUBLAYER: Record<string, string> = {
  motorway: 'Highways',
  trunk: 'Highways',
  highway: 'Highways',
  primary: 'Primary_Roads',
  secondary: 'Secondary_Roads',
  tertiary: 'Secondary_Roads',
  local: 'Local_Roads',
  residential: 'Local_Roads',
  unclassified: 'Local_Roads',
};

/** Settlement `place_type` property value → sublayer id. */
export const PLACE_TYPE_TO_SUBLAYER: Record<string, string> = {
  city: 'Cities',
  town: 'Towns',
  village: 'Villages',
  hamlet: 'Villages',
};
