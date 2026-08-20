import { useMemo } from 'react';
import { Polygon } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';

import { DeliveryLocationMarker } from '@/features/execution/components/DeliveryLocationMarker';
import { MapErrorBoundary } from '@/features/execution/components/MapErrorBoundary';
import { locationOrders, locationStatus } from '@/features/execution/model/derive';
import type { ExecutionSnapshot } from '@/features/execution/model/types';
import { MapClickDeselect, stopMapClickPropagation } from '@/features/planning/components/map/MapClickDeselect';
import { FitBoundsOnMount, InvalidateOnLayout, InvalidateOnMount } from '@/features/planning/components/map/MapViewport';
import { BaseMap } from '@/shared/map/BaseMap';

const AREA_STYLE = {
  selected: { weight: 3, opacity: 0.9, fillOpacity: 0.18 },
  ambient: { weight: 1.5, opacity: 0.28, fillOpacity: 0.05 },
  normal: { weight: 2, opacity: 0.7, fillOpacity: 0.12 },
} as const;

type ExecutionMapProps = {
  snapshot: ExecutionSnapshot;
  selectedAreaId: string | null;
  selectedLocationId: string | null;
  panelCollapsed: boolean;
  onSelectArea: (areaId: string) => void;
  onSelectLocation: (locationId: string) => void;
  onClearSelection: () => void;
};

export function ExecutionMap({
  snapshot,
  selectedAreaId,
  selectedLocationId,
  panelCollapsed,
  onSelectArea,
  onSelectLocation,
  onClearSelection,
}: ExecutionMapProps) {
  const bounds = useMemo((): LatLngBoundsExpression | null => {
    const points = snapshot.locations.map((location) => [location.lat, location.lng] as [number, number]);
    return points.length > 0 ? points : null;
  }, [snapshot.locations]);

  return (
    <div
      className="execution-map-pane"
      data-testid="execution-map"
      data-selected-area-id={selectedAreaId ?? ''}
      data-selected-location-id={selectedLocationId ?? ''}
    >
      <MapErrorBoundary>
        <BaseMap className="h-full w-full" zoomControl scrollWheelZoom zoom={12}>
          <InvalidateOnMount />
          <InvalidateOnLayout trigger={panelCollapsed} />
          <FitBoundsOnMount bounds={bounds} />
          <MapClickDeselect enabled onClearSelection={onClearSelection} />
          {snapshot.areas.map((area) => {
            const isSelected = selectedAreaId === area.id;
            const isAmbient = selectedAreaId !== null && !isSelected;
            const style = isSelected ? AREA_STYLE.selected : isAmbient ? AREA_STYLE.ambient : AREA_STYLE.normal;
            return (
              <Polygon
                key={area.id}
                positions={area.polygon}
                pathOptions={{
                  color: area.color,
                  weight: style.weight,
                  opacity: style.opacity,
                  fillColor: area.color,
                  fillOpacity: style.fillOpacity,
                }}
                eventHandlers={{
                  click: (event) => {
                    stopMapClickPropagation(event);
                    onSelectArea(area.id);
                  },
                }}
              />
            );
          })}
          {snapshot.locations.map((location) => {
            const orders = locationOrders(snapshot, location.id);
            if (orders.length === 0) return null;
            return (
              <DeliveryLocationMarker
                key={location.id}
                id={location.id}
                lat={location.lat}
                lng={location.lng}
                status={locationStatus(orders)}
                orderCount={orders.length}
                selected={selectedLocationId === location.id}
                dimmed={Boolean(selectedAreaId && selectedAreaId !== location.areaId)}
                label={location.address}
                onSelect={() => onSelectLocation(location.id)}
              />
            );
          })}
        </BaseMap>
      </MapErrorBoundary>

      <div className="execution-map-legend" aria-label="راهنمای وضعیت تحویل">
        <div className="execution-map-legend-item">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <circle cx="5" cy="5" r="4" fill="#2b9d6f" />
          </svg>
          <span>تحویل‌شده</span>
        </div>
        <div className="execution-map-legend-item">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <polygon points="5,0 10,5 5,10 0,5" fill="#c99035" />
          </svg>
          <span>نیازمند پیگیری</span>
        </div>
        <div className="execution-map-legend-item">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <circle cx="5" cy="5" r="3.5" fill="#1a2a3a" stroke="#3d5268" strokeWidth="1.5" />
          </svg>
          <span>در انتظار</span>
        </div>
      </div>

      <div className="execution-map-a11y">
        {snapshot.areas.map((area) => (
          <button
            key={area.id}
            type="button"
            onClick={() => onSelectArea(area.id)}
          >
            {`map-select-${area.id}`}
          </button>
        ))}
        {snapshot.locations.map((location) => (
          <button
            key={location.id}
            type="button"
            onClick={() => onSelectLocation(location.id)}
          >
            {`map-select-${location.id}`}
          </button>
        ))}
      </div>
    </div>
  );
}
