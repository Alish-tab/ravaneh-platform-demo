import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

import type { PlanningLatLng } from '@/features/planning/fixture/update-stop-location';

type LocationCorrectionLayerProps = {
  savedLocation: PlanningLatLng;
  proposedLocation: PlanningLatLng | null;
  onMapClick: (coords: PlanningLatLng) => void;
};

/**
 * Crosshair click capture + ghost/proposed markers during location correction.
 */
export function LocationCorrectionLayer({
  savedLocation,
  proposedLocation,
  onMapClick,
}: LocationCorrectionLayerProps) {
  const map = useMap();
  const onClickRef = useRef(onMapClick);
  useEffect(() => {
    onClickRef.current = onMapClick;
  });

  useEffect(() => {
    const handler = (event: L.LeafletMouseEvent) => {
      event.originalEvent.stopPropagation();
      onClickRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    };
    map.on('click', handler);
    map.getContainer().style.cursor = 'crosshair';
    map.getContainer().setAttribute('data-correction-mode', 'true');
    return () => {
      map.off('click', handler);
      map.getContainer().style.cursor = '';
      map.getContainer().removeAttribute('data-correction-mode');
    };
  }, [map]);

  useEffect(() => {
    const icon = L.divIcon({
      className: '',
      html: `<div data-testid="correction-saved-marker" style="width:18px;height:18px;border-radius:50%;border:2px dashed rgba(255,255,255,0.55);background:rgba(100,130,160,0.22);box-sizing:border-box;"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const marker = L.marker([savedLocation.lat, savedLocation.lng], {
      icon,
      interactive: false,
      zIndexOffset: 500,
    }).addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, savedLocation.lat, savedLocation.lng]);

  useEffect(() => {
    if (!proposedLocation) return;
    const icon = L.divIcon({
      className: '',
      html: `<div data-testid="correction-proposed-marker" style="width:16px;height:16px;border-radius:50%;background:#3d7bd4;border:2.5px solid white;box-shadow:0 0 0 2px #3d7bd4,0 2px 10px rgba(0,0,0,0.6);box-sizing:border-box;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const marker = L.marker([proposedLocation.lat, proposedLocation.lng], {
      icon,
      interactive: false,
      zIndexOffset: 600,
    }).addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, proposedLocation]);

  return null;
}
