import { concave as turfConcave } from '@turf/concave';
import { convex as turfConvex } from '@turf/convex';
import { featureCollection, point } from '@turf/helpers';

/** Leaflet-style geographic coordinate: [latitude, longitude]. */
export type MapCoordinate = [number, number];

export type MapAreaGeometry = {
  positions: MapCoordinate[];
  source: 'concave' | 'convex';
};

/**
 * Derive a display polygon from geographic coordinates.
 * Input/output use Leaflet [lat, lng]; Turf internally uses GeoJSON [lng, lat].
 */
export function deriveAreaGeometry(
  coordinates: readonly MapCoordinate[],
): MapAreaGeometry | null {
  if (coordinates.length < 3) return null;

  const points = featureCollection(
    coordinates.map(([lat, lng]) => point([lng, lat])),
  );

  try {
    const concave = turfConcave(points, { maxEdge: 0.08 });
    const ring = concave?.geometry?.coordinates?.[0];
    if (ring && ring.length >= 4) {
      return {
        positions: ring.map(([lng, lat]) => [lat, lng] as MapCoordinate),
        source: 'concave',
      };
    }
  } catch {
    /* fall through to convex */
  }

  try {
    const convex = turfConvex(points);
    const ring = convex?.geometry?.coordinates?.[0];
    if (ring && ring.length >= 4) {
      return {
        positions: ring.map(([lng, lat]) => [lat, lng] as MapCoordinate),
        source: 'convex',
      };
    }
  } catch {
    /* no valid polygon */
  }

  return null;
}
