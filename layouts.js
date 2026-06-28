/**
 * Splitenry — Layout Preset Definitions
 *
 * Each layout is defined as:
 * - id: unique identifier
 * - name: human-readable name
 * - icon: SVG path data for the thumbnail preview
 * - panels: array of panel definitions with fractional bounds
 *   Each panel: { x, y, w, h } as fractions of the screen (0–1)
 *
 * The layout engine converts these fractions into pixel coordinates
 * based on the actual display workArea.
 */

const LAYOUTS = [
  // ── Row 1: Simple layouts ─────────────────────────────────────────
  {
    id: 'fullscreen',
    name: 'Full Screen',
    panels: [
      { x: 0, y: 0, w: 1, h: 1 },
    ],
  },
  {
    id: 'half-half',
    name: 'Half & Half',
    panels: [
      { x: 0,   y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    id: 'main-side',
    name: 'Main + Side',
    panels: [
      { x: 0,   y: 0, w: 0.6, h: 1 },
      { x: 0.6, y: 0, w: 0.4, h: 1 },
    ],
  },
  {
    id: 'grid-2x2',
    name: '2×2 Grid',
    panels: [
      { x: 0,   y: 0,   w: 0.5, h: 0.5 },
      { x: 0.5, y: 0,   w: 0.5, h: 0.5 },
      { x: 0,   y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },

  // ── Row 2: Asymmetric layouts ─────────────────────────────────────
  {
    id: 'left-3right',
    name: '1 Left + 3 Right',
    panels: [
      { x: 0,   y: 0,         w: 0.5,  h: 1 },
      { x: 0.5, y: 0,         w: 0.5,  h: 1/3 },
      { x: 0.5, y: 1/3,       w: 0.5,  h: 1/3 },
      { x: 0.5, y: 2/3,       w: 0.5,  h: 1/3 },
    ],
  },
  {
    id: 'main-3side',
    name: 'Main + 3 Side',
    panels: [
      { x: 0,   y: 0,         w: 0.6,  h: 1 },
      { x: 0.6, y: 0,         w: 0.4,  h: 1/3 },
      { x: 0.6, y: 1/3,       w: 0.4,  h: 1/3 },
      { x: 0.6, y: 2/3,       w: 0.4,  h: 1/3 },
    ],
  },
  {
    id: '3left-main',
    name: '3 Left + Main',
    panels: [
      { x: 0, y: 0,         w: 0.4,  h: 1/3 },
      { x: 0, y: 1/3,       w: 0.4,  h: 1/3 },
      { x: 0, y: 2/3,       w: 0.4,  h: 1/3 },
      { x: 0.4, y: 0,       w: 0.6,  h: 1 },
    ],
  },
  {
    id: '3-columns',
    name: '3 Columns',
    panels: [
      { x: 0,         y: 0, w: 1/3, h: 1 },
      { x: 1/3,       y: 0, w: 1/3, h: 1 },
      { x: 2/3,       y: 0, w: 1/3, h: 1 },
    ],
  },

  // ── Row 3: Horizontal splits & more ───────────────────────────────
  {
    id: 'top-bottom',
    name: 'Top & Bottom',
    panels: [
      { x: 0, y: 0,   w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    id: 'main-2side',
    name: 'Main + 2 Side',
    panels: [
      { x: 0,   y: 0,   w: 0.6, h: 1 },
      { x: 0.6, y: 0,   w: 0.4, h: 0.5 },
      { x: 0.6, y: 0.5, w: 0.4, h: 0.5 },
    ],
  },
  {
    id: 'center-stage',
    name: 'Center Stage',
    panels: [
      { x: 0,    y: 0, w: 0.2, h: 1 },
      { x: 0.2,  y: 0, w: 0.6, h: 1 },
      { x: 0.8,  y: 0, w: 0.2, h: 1 },
    ],
  },
  {
    id: 'grid-top2-bottom1',
    name: '2 Top + 1 Bottom',
    panels: [
      { x: 0,   y: 0,   w: 0.5, h: 0.5 },
      { x: 0.5, y: 0,   w: 0.5, h: 0.5 },
      { x: 0,   y: 0.5, w: 1,   h: 0.5 },
    ],
  },
];
