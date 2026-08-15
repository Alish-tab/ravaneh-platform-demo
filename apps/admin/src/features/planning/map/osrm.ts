/**
 * Temporary Planning-local OSRM integration (dev only).
 * Replace with Ravaneh routing when backend is available.
 * Do not import this from outside features/planning.
 */

export type LatLngTuple = [number, number];

export type RouteGeometryResult = {
  positions: LatLngTuple[];
  source: 'osrm' | 'straight';
};

const DEFAULT_OSRM_BASE = 'https://router.project-osrm.org';

type OsrmRouteResponse = {
  code?: string;
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
};

function osrmBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_OSRM_URL as string | undefined;
  return (fromEnv?.replace(/\/$/, '') || DEFAULT_OSRM_BASE).trim();
}

/** Straight polyline through waypoints — always available offline. */
export function straightLineGeometry(waypoints: LatLngTuple[]): LatLngTuple[] {
  return waypoints.map(([lat, lng]) => [lat, lng]);
}

/**
 * Request road-following geometry from public OSRM.
 * Waypoints are [lat, lng]; OSRM expects lon,lat.
 */
export async function fetchOsrmGeometry(waypoints: LatLngTuple[]): Promise<LatLngTuple[]> {
  if (waypoints.length < 2) {
    return straightLineGeometry(waypoints);
  }

  const coordPath = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `${osrmBaseUrl()}/route/v1/driving/${coordPath}?overview=full&geometries=geojson`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OSRM HTTP ${response.status}`);
  }

  const data = (await response.json()) as OsrmRouteResponse;
  if (data.code && data.code !== 'Ok') {
    throw new Error(`OSRM code ${data.code}`);
  }

  const coords = data.routes?.[0]?.geometry?.coordinates;
  if (!coords || coords.length < 2) {
    throw new Error('OSRM returned empty geometry');
  }

  return coords.map(([lng, lat]) => [lat, lng] as LatLngTuple);
}

/**
 * Prefer OSRM; fall back to straight segments so the map stays usable offline.
 */
export async function resolveRouteGeometry(waypoints: LatLngTuple[]): Promise<RouteGeometryResult> {
  if (waypoints.length < 2) {
    return { positions: straightLineGeometry(waypoints), source: 'straight' };
  }

  try {
    const positions = await fetchOsrmGeometry(waypoints);
    if (positions.length >= 2) {
      return { positions, source: 'osrm' };
    }
  } catch {
    /* public OSRM may be unavailable — keep UI working */
  }

  return { positions: straightLineGeometry(waypoints), source: 'straight' };
}
