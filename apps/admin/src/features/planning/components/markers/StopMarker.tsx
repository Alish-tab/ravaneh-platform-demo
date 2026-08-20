import { useEffect, useRef } from 'react';
import { CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

import { stopMapClickPropagation } from '@/shared/map/MapClickDeselect';
import type { PlanningStop } from '@/features/planning/fixture/types';
import { toPersianDigits } from '@/shared/lib/format';

type StopMarkerProps = {
  stop: PlanningStop;
  routeColor: string;
  routeIsSelected: boolean;
  isStopSelected: boolean;
  isAmbiguous: boolean;
  onSelect: () => void;
};

export function StopMarker({
  stop,
  routeColor,
  routeIsSelected,
  isStopSelected,
  isAmbiguous,
  onSelect,
}: StopMarkerProps) {
  if (stop.tasks.length > 1) {
    return (
      <MultiStopMarker
        stop={stop}
        routeColor={routeColor}
        routeIsSelected={routeIsSelected}
        isStopSelected={isStopSelected}
        isAmbiguous={isAmbiguous}
        onSelect={onSelect}
      />
    );
  }

  const radius = isStopSelected ? 8 : routeIsSelected ? 6 : isAmbiguous ? 3.5 : 5;
  const opacity = isAmbiguous ? 0.35 : 1;
  const fillOpacity = isAmbiguous ? 0.3 : isStopSelected ? 1 : routeIsSelected ? 1 : 0.9;
  const task = stop.tasks[0];

  return (
    <CircleMarker
      center={[stop.lat, stop.lng]}
      radius={radius}
      pathOptions={{
        color: isStopSelected || routeIsSelected ? '#ffffff' : routeColor,
        weight: isStopSelected ? 2.5 : routeIsSelected ? 2 : 1.5,
        fillColor: routeColor,
        fillOpacity,
        opacity,
      }}
      eventHandlers={{
        click: (event) => {
          stopMapClickPropagation(event);
          onSelect();
        },
      }}
    >
      {!isStopSelected && task ? (
        <Tooltip direction="top" offset={[0, -8]} className="map-tooltip">
          <div className="text-start text-[11px]" dir="rtl">
            <div className="mb-0.5 font-semibold">{task.recipientName}</div>
            <div className="text-[10px] text-[var(--text-secondary)]">{task.address}</div>
          </div>
        </Tooltip>
      ) : null}
    </CircleMarker>
  );
}

function MultiStopMarker({
  stop,
  routeColor,
  routeIsSelected,
  isStopSelected,
  isAmbiguous,
  onSelect,
}: StopMarkerProps) {
  const map = useMap();
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    const count = stop.tasks.length;
    const size = isStopSelected ? 28 : routeIsSelected ? 24 : isAmbiguous ? 18 : 22;
    const opacity = isAmbiguous ? 0.35 : 1;
    const ring = isStopSelected
      ? `0 0 0 3px #fff, 0 0 0 5px ${routeColor}88, 0 2px 10px rgba(0,0,0,0.6)`
      : routeIsSelected
        ? `0 0 0 3px ${routeColor}44,0 2px 8px rgba(0,0,0,0.6)`
        : '0 2px 6px rgba(0,0,0,0.5)';

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${routeColor};border:${isStopSelected ? '2.5px solid #fff' : `2px solid ${routeColor}`};display:flex;align-items:center;justify-content:center;font-size:${count > 9 ? 9 : 10}px;font-weight:700;color:#0f1318;font-family:Vazirmatn,sans-serif;box-shadow:${ring};cursor:pointer;box-sizing:border-box;opacity:${opacity};">${toPersianDigits(count)}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    const marker = L.marker([stop.lat, stop.lng], {
      icon,
      pane: 'markerPane',
      zIndexOffset: 200,
    }).addTo(map);
    marker.on('click', (event) => {
      stopMapClickPropagation(event);
      onSelectRef.current();
    });
    if (!isStopSelected) {
      const names = stop.tasks.map((task) => task.recipientName).join('، ');
      marker.bindTooltip(
        `<div dir="rtl" style="font-family:Vazirmatn,sans-serif;font-size:11px;max-width:200px"><div style="font-weight:600;margin-bottom:3px">${toPersianDigits(count)} سفارش</div><div style="color:#7d95b5;font-size:10px">${names}</div></div>`,
        { direction: 'top', offset: [0, -(size / 2 + 6)], className: 'map-tooltip' },
      );
    }
    return () => {
      marker.remove();
    };
  }, [isAmbiguous, isStopSelected, map, routeColor, routeIsSelected, stop]);

  return null;
}
