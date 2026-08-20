import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

import { stopMapClickPropagation } from '@/shared/map/MapClickDeselect';
import { toPersianDigits } from '@/shared/lib/format';
import type { ExecutionUiStatus } from '@/features/execution/model/types';

type DeliveryLocationMarkerProps = {
  id: string;
  lat: number;
  lng: number;
  status: ExecutionUiStatus;
  orderCount: number;
  selected: boolean;
  dimmed: boolean;
  label: string;
  onSelect: () => void;
};

function markerSvg(status: ExecutionUiStatus, selected: boolean, count: number): string {
  const size = selected ? 22 : count > 1 ? 20 : 16;
  const opacity = 1;
  if (status === 'delivered') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true" style="opacity:${opacity}">
      <circle cx="8" cy="8" r="7" fill="#2b9d6f" stroke="#0c1520" stroke-width="1.2"/>
      <path d="M5 8.2 l2 2 l4-4" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
  if (status === 'followup') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true" style="opacity:${opacity}">
      <polygon points="8,1.5 14.5,8 8,14.5 1.5,8" fill="#c99035" stroke="#0c1520" stroke-width="1.2"/>
      <line x1="8" y1="5" x2="8" y2="9" stroke="#0c1520" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="8" cy="11.2" r="0.8" fill="#0c1520"/>
    </svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true" style="opacity:${opacity}">
    <circle cx="8" cy="8" r="6" fill="#1a2a3a" stroke="#3d5268" stroke-width="1.8"/>
  </svg>`;
}

export function DeliveryLocationMarker({
  id,
  lat,
  lng,
  status,
  orderCount,
  selected,
  dimmed,
  label,
  onSelect,
}: DeliveryLocationMarkerProps) {
  const map = useMap();
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    const size = selected ? 22 : orderCount > 1 ? 20 : 16;
    const ring = selected ? `0 0 0 3px rgba(220,229,240,0.85)` : 'none';
    const countBadge =
      orderCount > 1
        ? `<span style="position:absolute;inset-inline-end:-4px;top:-4px;min-width:12px;height:12px;padding:0 3px;border-radius:6px;background:#0f1318;border:1px solid #3d5268;color:#dce5f0;font-size:8px;font-family:Vazirmatn,sans-serif;line-height:11px;text-align:center">${toPersianDigits(orderCount)}</span>`
        : '';
    const icon = L.divIcon({
      className: '',
      html: `<div data-location-id="${id}" data-status="${status}" style="position:relative;width:${size}px;height:${size}px;opacity:${dimmed ? 0.38 : 1};filter:${selected ? 'none' : 'none'};box-shadow:${ring};cursor:pointer">${markerSvg(status, selected, orderCount)}${countBadge}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    const marker = L.marker([lat, lng], { icon, pane: 'markerPane', zIndexOffset: selected ? 400 : 200 }).addTo(
      map,
    );
    marker.on('click', (event) => {
      stopMapClickPropagation(event);
      onSelectRef.current();
    });
    marker.bindTooltip(
      `<div dir="rtl" style="font-family:Vazirmatn,sans-serif;font-size:11px">${label}</div>`,
      { direction: 'top', offset: [0, -(size / 2 + 4)], className: 'map-tooltip' },
    );
    return () => {
      marker.remove();
    };
  }, [dimmed, id, label, lat, lng, map, orderCount, selected, status]);

  return null;
}
