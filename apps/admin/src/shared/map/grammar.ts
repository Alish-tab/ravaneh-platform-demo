/**
 * Map visual grammar from Admin Foundation — Leaflet-ready presentation contracts.
 * Fake SVG map data / demo routes are intentionally NOT included.
 *
 * Route colors are presentation tokens only; never encode membership or status in color.
 */

export const ROUTE_PALETTE = [
  'var(--route-1)',
  'var(--route-2)',
  'var(--route-3)',
  'var(--route-4)',
  'var(--route-5)',
  'var(--route-6)',
] as const;

export const ROUTE_PALETTE_HEX = [
  '#7888d0',
  '#c07870',
  '#5aaa90',
  '#9a80c8',
  '#b89060',
  '#48acba',
] as const;

export type RoutePaletteIndex = 0 | 1 | 2 | 3 | 4 | 5;

/** Resolve a stable presentation color for a route index (0-based, wraps). */
export function routeColor(index: number): (typeof ROUTE_PALETTE_HEX)[number] {
  const safe = ((index % ROUTE_PALETTE_HEX.length) + ROUTE_PALETTE_HEX.length) % ROUTE_PALETTE_HEX.length;
  return ROUTE_PALETTE_HEX[safe as RoutePaletteIndex];
}

/**
 * Stop marker visual states from Foundation map grammar.
 * These are UI appearances — map to real Domain stop/task states later.
 */
export type StopVisualState =
  | 'normal'
  | 'selected'
  | 'hovered'
  | 'warning'
  | 'error'
  | 'unassigned'
  | 'completed';

export type StopMarkerStyle = {
  fill: string;
  stroke: string;
  radius: number;
  opacity: number;
  ringRadius?: number;
  ringStroke?: string;
  ringOpacity?: number;
  shape: 'circle' | 'triangle' | 'dashed-circle';
  showCheck?: boolean;
  showCross?: boolean;
};

export function stopMarkerStyle(
  state: StopVisualState,
  routeHex: string,
): StopMarkerStyle {
  switch (state) {
    case 'selected':
      return {
        fill: '#ffffff',
        stroke: routeHex,
        radius: 7,
        opacity: 1,
        ringRadius: 13,
        ringStroke: routeHex,
        ringOpacity: 0.5,
        shape: 'circle',
      };
    case 'hovered':
      return {
        fill: '#ffffff',
        stroke: routeHex,
        radius: 6.5,
        opacity: 1,
        ringRadius: 10,
        ringStroke: routeHex,
        ringOpacity: 0.5,
        shape: 'circle',
      };
    case 'warning':
      return {
        fill: '#c99035', // --warning
        stroke: '#0f1318', // --bg-base
        radius: 5,
        opacity: 1,
        shape: 'triangle',
      };
    case 'error':
      return {
        fill: '#c44444', // --error
        stroke: '#0f1318', // --bg-base
        radius: 5,
        opacity: 1,
        shape: 'circle',
        showCross: true,
      };
    case 'unassigned':
      return {
        fill: '#22303f', // --bg-surface
        stroke: '#4a5e78', // --text-muted
        radius: 5,
        opacity: 1,
        shape: 'dashed-circle',
      };
    case 'completed':
      return {
        fill: '#2b9d6f', // --success
        stroke: '#2b9d6f', // --success
        radius: 4,
        opacity: 0.7,
        shape: 'circle',
        showCheck: true,
      };
    case 'normal':
    default:
      return {
        fill: routeHex,
        stroke: routeHex,
        radius: 5,
        opacity: 1,
        shape: 'circle',
      };
  }
}

/** Route polyline / polygon opacity grammar when a route is selected vs ambient. */
export const ROUTE_LINE_STYLE = {
  selected: { weight: 3, opacity: 1, casingWeight: 8, casingOpacity: 0.25 },
  ambientWhenOtherSelected: { weight: 1.5, opacity: 0.35 },
  default: { weight: 2.5, opacity: 1 },
  polygonSelected: { fillOpacity: 0.12, strokeOpacity: 0.35 },
  polygonAmbient: { fillOpacity: 0.05, strokeOpacity: 0.12 },
} as const;

export const MAP_BASE_FILL = '#0f1318'; // --bg-base
