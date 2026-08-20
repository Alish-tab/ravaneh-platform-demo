import { useMemo, useState } from 'react';
import type { LatLngBoundsExpression } from 'leaflet';
import { useMap } from 'react-leaflet';

import { DeliveryLocationMarker } from '@/features/execution/components/DeliveryLocationMarker';
import { MapErrorBoundary } from '@/features/execution/components/MapErrorBoundary';
import { locationOrders, locationStatus } from '@/features/execution/model/derive';
import type { ExecutionSnapshot } from '@/features/execution/model/types';
import { AreaPolygon, type AreaPolygonVisualState } from '@/shared/map/AreaPolygon';
import { MapClickDeselect } from '@/shared/map/MapClickDeselect';
import { MapToolbar } from '@/shared/map/MapToolbar';
import { FitBoundsOnMount, InvalidateOnLayout, InvalidateOnMount } from '@/shared/map/MapViewport';
import { BaseMap } from '@/shared/map/BaseMap';

const AREA_STYLE = {
  selected: { weight: 3, opacity: 0.9, fillOpacity: 0.18 },
  ambient: { weight: 1.5, opacity: 0.28, fillOpacity: 0.05 },
  normal: { weight: 2, opacity: 0.7, fillOpacity: 0.12 },
} as const;

type ExecutionMapControlsProps = {
  allBounds: LatLngBoundsExpression | null;
  selectedBounds: LatLngBoundsExpression | null;
  showAreas: boolean;
  onToggleAreas: () => void;
};

function ExecutionMapControls({
  allBounds,
  selectedBounds,
  showAreas,
  onToggleAreas,
}: ExecutionMapControlsProps) {
  const map = useMap();

  return (
    <MapToolbar
      onZoomIn={() => map.zoomIn()}
      onZoomOut={() => map.zoomOut()}
      onFitAll={() => {
        if (allBounds) map.fitBounds(allBounds, { padding: [60, 60], maxZoom: 14 });
      }}
      onFitSelected={() => {
        if (!selectedBounds) return;
        map.fitBounds(selectedBounds, { padding: [80, 80], maxZoom: 14, animate: true });
      }}
      onToggleAreas={onToggleAreas}
      hasSelection={selectedBounds !== null}
      showAreas={showAreas}
    />
  );
}

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
  const [showAreas, setShowAreas] = useState(true);
  const bounds = useMemo((): LatLngBoundsExpression | null => {
    const points = snapshot.locations.map((location) => [location.lat, location.lng] as [number, number]);
    return points.length > 0 ? points : null;
  }, [snapshot.locations]);
  const allBounds = useMemo((): LatLngBoundsExpression | null => {
    const points = [
      ...snapshot.locations.map((location) => [location.lat, location.lng] as [number, number]),
      ...snapshot.areas.flatMap((area) => area.polygon),
    ];
    return points.length > 0 ? points : null;
  }, [snapshot.areas, snapshot.locations]);
  const selectedBounds = useMemo((): LatLngBoundsExpression | null => {
    if (!selectedAreaId) return null;
    const area = snapshot.areas.find((item) => item.id === selectedAreaId);
    if (area?.polygon.length) return area.polygon;
    const locations = snapshot.locations
      .filter((location) => location.areaId === selectedAreaId)
      .map((location) => [location.lat, location.lng] as [number, number]);
    return locations.length > 0 ? locations : null;
  }, [selectedAreaId, snapshot.areas, snapshot.locations]);

  return (
    <div
      className="shared-map-pane"
      data-testid="execution-map"
      data-selected-area-id={selectedAreaId ?? ''}
      data-selected-location-id={selectedLocationId ?? ''}
      data-show-areas={showAreas ? 'true' : 'false'}
    >
      <MapErrorBoundary>
        <BaseMap className="h-full w-full" zoomControl={false} scrollWheelZoom zoom={12}>
          <InvalidateOnMount />
          <InvalidateOnLayout trigger={panelCollapsed} />
          <FitBoundsOnMount bounds={bounds} />
          <MapClickDeselect enabled onClearSelection={onClearSelection} />
          <ExecutionMapControls
            allBounds={allBounds}
            selectedBounds={selectedBounds}
            showAreas={showAreas}
            onToggleAreas={() => setShowAreas((visible) => !visible)}
          />
          {showAreas ? snapshot.areas.map((area) => {
            const isSelected = selectedAreaId === area.id;
            const isAmbient = selectedAreaId !== null && !isSelected;
            const visualState: AreaPolygonVisualState = isSelected
              ? 'selected'
              : isAmbient
                ? 'ambient'
                : 'normal';
            return (
              <AreaPolygon
                key={area.id}
                positions={area.polygon}
                color={area.color}
                visualState={visualState}
                presentation={AREA_STYLE}
                onClick={() => onSelectArea(area.id)}
              />
            );
          }) : null}
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
