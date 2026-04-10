/**
 * SVG `<defs>` block for cartographic fill patterns and gradients.
 *
 * These are embedded once near the top of every exported SVG document.
 * Layers reference them via `fill="url(#pattern_id)"`.
 *
 * Pattern IDs:
 *   conflict_hatch   — 45° diagonal red/orange stripes (conflict zones)
 *   uncertain_dots   — small grey circles (low-confidence areas)
 *   restricted_zone  — crosshatch dark-red (access-denied / exclusion zones)
 *
 * Gradient IDs:
 *   terrain_gradient — subtle elevation tint (light → dark for low → high)
 */

/** Returns the full `<defs>...</defs>` block as a string. */
export function buildPatternDefs(): string {
  return `<defs>
  <!-- ── Conflict zone: 45° red/orange diagonal hatch ──────────────────── -->
  <pattern id="conflict_hatch" x="0" y="0" width="8" height="8"
           patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="8" height="8" fill="#fff2ed" fill-opacity="0.6"/>
    <line x1="0" y1="0" x2="0" y2="8"
          stroke="#e05c00" stroke-width="3" stroke-opacity="0.7"/>
  </pattern>

  <!-- ── Uncertain / low-confidence: grey dot fill ─────────────────────── -->
  <pattern id="uncertain_dots" x="0" y="0" width="6" height="6"
           patternUnits="userSpaceOnUse">
    <rect width="6" height="6" fill="transparent"/>
    <circle cx="3" cy="3" r="1"
            fill="#9e9e9e" fill-opacity="0.55"/>
  </pattern>

  <!-- ── Restricted / exclusion zone: dark-red crosshatch ─────────────── -->
  <pattern id="restricted_zone" x="0" y="0" width="8" height="8"
           patternUnits="userSpaceOnUse">
    <rect width="8" height="8" fill="#ffe0e0" fill-opacity="0.4"/>
    <line x1="0" y1="0" x2="8" y2="8"
          stroke="#8b0000" stroke-width="1.2" stroke-opacity="0.6"/>
    <line x1="8" y1="0" x2="0" y2="8"
          stroke="#8b0000" stroke-width="1.2" stroke-opacity="0.6"/>
  </pattern>

  <!-- ── Terrain gradient: elevation tint (low → high) ─────────────────── -->
  <linearGradient id="terrain_gradient" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0%"   stop-color="#c8d8a8" stop-opacity="0.9"/>
    <stop offset="40%"  stop-color="#d4c4a0" stop-opacity="0.85"/>
    <stop offset="75%"  stop-color="#c0a882" stop-opacity="0.8"/>
    <stop offset="100%" stop-color="#a89070" stop-opacity="0.75"/>
  </linearGradient>

  <!-- ── Water gradient: coast → deep ─────────────────────────────────── -->
  <linearGradient id="water_gradient" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"   stop-color="#b8d8f0" stop-opacity="1"/>
    <stop offset="100%" stop-color="#6daed4" stop-opacity="1"/>
  </linearGradient>

  <!-- ── Disputed boundary: dashed red overlay ─────────────────────────── -->
  <!-- (Used as a stroke style reference; not a fill pattern.) -->
</defs>`;
}

/**
 * Known pattern / gradient IDs that can be referenced in `LayerStyle.fillPattern`.
 * Exported for use in tests and default style configs.
 */
export const PATTERN_IDS = {
  conflictHatch: 'conflict_hatch',
  uncertainDots: 'uncertain_dots',
  restrictedZone: 'restricted_zone',
  terrainGradient: 'terrain_gradient',
  waterGradient: 'water_gradient',
} as const;
