import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

import { stopMapClickPropagation } from '@/shared/map/MapClickDeselect';

type DepotMarkerProps = {
  lat: number;
  lng: number;
  name: string;
};

export function DepotMarker({ lat, lng, name }: DepotMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const icon = L.divIcon({
      className: '',
      html: `<div title="${name}" style="width:22px;height:22px;border-radius:50%;background:#3d7bd4;border:2.5px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.55);cursor:default;"><svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M8 1C5.8 1 4 2.8 4 5c0 3.5 4 9 4 9s4-5.5 4-9c0-2.2-1.8-4-4-4zm0 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    const marker = L.marker([lat, lng], { icon, pane: 'markerPane', zIndexOffset: 500 }).addTo(map);
    marker.bindTooltip(name, { direction: 'top', offset: [0, -14], className: 'map-tooltip' });
    marker.on('click', stopMapClickPropagation);
    markerRef.current = marker;
    return () => {
      marker.remove();
    };
  }, [lat, lng, map, name]);

  return null;
}
