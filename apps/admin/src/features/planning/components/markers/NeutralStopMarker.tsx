import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

import type { PlanningStop } from '@/features/planning/fixture/types';
import { toPersianDigits } from '@/shared/lib/format';

type NeutralStopMarkerProps = {
  stop: PlanningStop;
};

/**
 * Pre-generation delivery location — neutral, not route-colored (designer NeutralStopMarkerPreOpt).
 */
export function NeutralStopMarker({ stop }: NeutralStopMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | L.CircleMarker | null>(null);

  useEffect(() => {
    const count = stop.tasks.length;
    const primary = stop.tasks[0];

    if (count > 1) {
      const size = 22;
      const icon = L.divIcon({
        className: '',
        html: `<div data-testid="map-stop-${stop.stopId}" data-marker-kind="neutral" style="width:${size}px;height:${size}px;border-radius:50%;background:#1a2434;border:2px solid #4a5e78;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#7d95b5;font-family:Vazirmatn,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.5);cursor:default;box-sizing:border-box;">${toPersianDigits(count)}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker([stop.lat, stop.lng], { icon, zIndexOffset: 200 }).addTo(map);
      markerRef.current = marker;
      const names =
        stop.tasks
          .slice(0, 3)
          .map((task) => task.recipientName)
          .join('، ') + (stop.tasks.length > 3 ? '…' : '');
      marker.bindTooltip(
        `<div dir="rtl" style="font-family:Vazirmatn,sans-serif;font-size:11px;max-width:200px"><div style="font-weight:600;margin-bottom:3px">${toPersianDigits(count)} سفارش</div><div style="color:#7d95b5;font-size:10px">${names}</div></div>`,
        {
          direction: 'top',
          offset: [0, -(size / 2 + 6)],
          className: 'planning-map-tooltip',
        },
      );
      return () => {
        marker.remove();
        markerRef.current = null;
      };
    }

    const circle = L.circleMarker([stop.lat, stop.lng], {
      radius: 5,
      color: '#4a5e78',
      weight: 1.5,
      fillColor: '#1a2434',
      fillOpacity: 0.9,
      opacity: 1,
    }).addTo(map);
    // Test hook — Leaflet path DOM gets a class we can query.
    const el = circle.getElement();
    if (el) {
      el.setAttribute('data-testid', `map-stop-${stop.stopId}`);
      el.setAttribute('data-marker-kind', 'neutral');
    }
    circle.bindTooltip(
      `<div dir="rtl" style="font-family:Vazirmatn,sans-serif;font-size:11px"><div style="font-weight:600;margin-bottom:2px">${primary?.recipientName ?? stop.stopId}</div><div style="color:#7d95b5;font-size:10px">${primary?.address ?? ''}</div></div>`,
      { direction: 'top', offset: [0, -8], className: 'planning-map-tooltip' },
    );
    markerRef.current = circle;
    return () => {
      circle.remove();
      markerRef.current = null;
    };
  }, [map, stop]);

  return null;
}
