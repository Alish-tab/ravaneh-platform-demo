import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';

type FitSelectedRouteProps = {
  /** LatLng positions from OSRM geometry or stop coordinates. */
  positions: Array<[number, number]> | null;
  trigger: string | null;
};

export function FitSelectedRoute({ positions, trigger }: FitSelectedRouteProps) {
  const map = useMap();
  useEffect(() => {
    if (!positions || positions.length < 1 || !trigger) return;
    try {
      map.fitBounds(positions as LatLngBoundsExpression, {
        padding: [80, 80],
        maxZoom: 14,
        animate: true,
      });
    } catch {
      /* ignore */
    }
  }, [map, positions, trigger]);
  return null;
}

type PanToPointProps = {
  coords: [number, number] | null;
};

export function PanToPoint({ coords }: PanToPointProps) {
  const map = useMap();
  const prevKey = useRef<string | null>(null);
  useEffect(() => {
    if (!coords) return;
    const key = `${coords[0]},${coords[1]}`;
    if (key === prevKey.current) return;
    prevKey.current = key;
    map.panTo(coords, { animate: true, duration: 0.4 });
  }, [coords, map]);
  return null;
}

type FitOnGenerateProps = {
  areasGenerated: boolean;
  bounds: LatLngBoundsExpression | null;
};

/** Refit when distribution areas first become available. */
export function FitOnGenerate({ areasGenerated, bounds }: FitOnGenerateProps) {
  const map = useMap();
  const wasGenerated = useRef(false);
  useEffect(() => {
    if (areasGenerated && !wasGenerated.current && bounds) {
      try {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      } catch {
        /* ignore */
      }
    }
    wasGenerated.current = areasGenerated;
  }, [areasGenerated, bounds, map]);
  return null;
}
