import { useEffect } from 'react';
import type { LatLngBoundsExpression } from 'leaflet';
import { useMap } from 'react-leaflet';

type FitBoundsOnMountProps = {
  bounds: LatLngBoundsExpression | null;
};

/** Fit the map to the supplied bounds on mount or when they change. */
export function FitBoundsOnMount({ bounds }: FitBoundsOnMountProps) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    try {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    } catch {
      /* ignore invalid bounds */
    }
  }, [bounds, map]);
  return null;
}

type InvalidateOnLayoutProps = {
  trigger: unknown;
};

export function InvalidateOnLayout({ trigger }: InvalidateOnLayoutProps) {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 220);
    return () => window.clearTimeout(timer);
  }, [map, trigger]);
  return null;
}

/** Ensure Leaflet measures a non-zero pane after the flex layout settles. */
export function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 0);
    return () => window.clearTimeout(timer);
  }, [map]);
  return null;
}
