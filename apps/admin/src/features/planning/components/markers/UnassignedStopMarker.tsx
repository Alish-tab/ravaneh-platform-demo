import { useEffect, useRef } from 'react';
import { CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

import { stopMapClickPropagation } from '@/features/planning/components/map/MapClickDeselect';
import type { PlanningStop } from '@/features/planning/fixture/types';
import { toPersianDigits } from '@/shared/lib/format';

type UnassignedStopMarkerProps = {
  stop: PlanningStop;
  isSelected: boolean;
  onSelect: () => void;
};

export function UnassignedStopMarker({ stop, isSelected, onSelect }: UnassignedStopMarkerProps) {
  if (stop.tasks.length > 1) {
    return <UnassignedMultiStopMarker stop={stop} isSelected={isSelected} onSelect={onSelect} />;
  }

  const radius = isSelected ? 9 : 5;
  return (
    <CircleMarker
      center={[stop.lat, stop.lng]}
      radius={radius}
      pathOptions={{
        color: isSelected ? '#dfaa55' : '#4a5e78',
        weight: isSelected ? 2.5 : 1.5,
        fillColor: isSelected ? '#2a1e08' : '#22303f',
        fillOpacity: 0.9,
        opacity: 1,
        dashArray: isSelected ? undefined : '3,3',
      }}
      eventHandlers={{
        click: (event) => {
          stopMapClickPropagation(event);
          onSelect();
        },
      }}
    >
      {!isSelected ? (
        <Tooltip direction="top" offset={[0, -8]} className="planning-map-tooltip">
          <div className="text-start text-[11px]" dir="rtl">
            <div className="font-semibold text-[var(--warning-text)]">بدون محدوده</div>
            <div className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
              {toPersianDigits(stop.tasks.length)} سفارش
            </div>
          </div>
        </Tooltip>
      ) : null}
    </CircleMarker>
  );
}

function UnassignedMultiStopMarker({ stop, isSelected, onSelect }: UnassignedStopMarkerProps) {
  const map = useMap();
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    const count = stop.tasks.length;
    const size = isSelected ? 26 : 22;
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${isSelected ? '#2a1e08' : '#22303f'};border:2px ${isSelected ? 'solid #dfaa55' : 'dashed #4a5e78'};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:${isSelected ? '#dfaa55' : '#7d95b5'};font-family:Vazirmatn,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.5);cursor:pointer;box-sizing:border-box;">${toPersianDigits(count)}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    const marker = L.marker([stop.lat, stop.lng], { icon, pane: 'markerPane', zIndexOffset: 180 }).addTo(
      map,
    );
    marker.on('click', (event) => {
      stopMapClickPropagation(event);
      onSelectRef.current();
    });
    return () => {
      marker.remove();
    };
  }, [isSelected, map, stop]);

  return null;
}
