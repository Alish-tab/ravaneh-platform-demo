import { useMemo } from 'react';
import type { LatLngBoundsExpression } from 'leaflet';

import {
  FitBoundsOnMount,
  FitOnGenerate,
  FitSelectedRoute,
  InvalidateOnLayout,
  InvalidateOnMount,
  PanToPoint,
} from '@/features/planning/components/map/MapViewport';
import { MapClickDeselect } from '@/features/planning/components/map/MapClickDeselect';
import { LocationCorrectionLayer } from '@/features/planning/components/layers/LocationCorrectionLayer';
import { RoutePolygons } from '@/features/planning/components/layers/RoutePolygons';
import { DepotMarker } from '@/features/planning/components/markers/DepotMarker';
import { NeutralStopMarker } from '@/features/planning/components/markers/NeutralStopMarker';
import { StopMarker } from '@/features/planning/components/markers/StopMarker';
import { UnassignedStopMarker } from '@/features/planning/components/markers/UnassignedStopMarker';
import { PlanningMapToolbar } from '@/features/planning/components/PlanningMapToolbar';
import { allStopPositions, findStopInPlan } from '@/features/planning/fixture/planning-fixture';
import type { PlanningPlanFixture, PlanningStop } from '@/features/planning/fixture/types';
import type { PlanningLatLng } from '@/features/planning/fixture/update-stop-location';
import { areaPositionsForRoute } from '@/features/planning/hooks/useRouteAreas';
import type { RouteAreaEntry } from '@/features/planning/map/route-area';
import type { LatLngTuple } from '@/features/planning/map/osrm';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { BaseMap } from '@/shared/map/BaseMap';

type PlanningMapProps = {
  fixture: PlanningPlanFixture;
  areas: RouteAreaEntry[];
  areasGenerated: boolean;
  showRouteAreas: boolean;
  activeRouteId: string | null;
  selectedStopId: string | null;
  selectedUnassignedStopId: string | null;
  selectedStopCoords: [number, number] | null;
  activeRouteStops: PlanningStop[] | null;
  routeFitTrigger: string | null;
  panelCollapsed: boolean;
  correctionStopId: string | null;
  proposedLocation: PlanningLatLng | null;
  onSelectStop: (stopId: string) => void;
  onSelectRoute: (routeId: string) => void;
  onClearMapSelection: () => void;
  onToggleRouteAreas: () => void;
  onCorrectionMapClick: (coords: PlanningLatLng) => void;
};

/**
 * Layer order (bottom → top):
 * route areas → stop markers → unassigned markers → depot → correction overlays
 * Pre-generation: neutral markers only (no polygons / route colors).
 */
export function PlanningMap({
  fixture,
  areas,
  areasGenerated,
  showRouteAreas,
  activeRouteId,
  selectedStopId,
  selectedUnassignedStopId,
  selectedStopCoords,
  activeRouteStops,
  routeFitTrigger,
  panelCollapsed,
  correctionStopId,
  proposedLocation,
  onSelectStop,
  onSelectRoute,
  onClearMapSelection,
  onToggleRouteAreas,
  onCorrectionMapClick,
}: PlanningMapProps) {
  const bounds = useMemo((): LatLngBoundsExpression | null => {
    const points = allStopPositions(fixture);
    return points.length > 0 ? points : null;
  }, [fixture]);

  const fitSelectedPositions = useMemo((): LatLngTuple[] | null => {
    if (!areasGenerated || !routeFitTrigger || !activeRouteId) return null;
    const fromArea = areaPositionsForRoute(areas, activeRouteId);
    if (fromArea && fromArea.length >= 3) return fromArea;
    if (!activeRouteStops || activeRouteStops.length < 1) return null;
    return activeRouteStops.map((stop) => [stop.lat, stop.lng]);
  }, [activeRouteId, activeRouteStops, areas, areasGenerated, routeFitTrigger]);

  const activeAreaPositions = areasGenerated
    ? areaPositionsForRoute(areas, activeRouteId)
    : null;

  const preGenerationStops = useMemo(() => {
    const stops: PlanningStop[] = [];
    for (const route of fixture.routes) {
      stops.push(...route.stops);
    }
    stops.push(...fixture.unassignedStops);
    return stops;
  }, [fixture]);

  const correctionStop = correctionStopId
    ? findStopInPlan(fixture, correctionStopId)?.stop ?? null
    : null;
  const correctionActive = Boolean(correctionStopId && correctionStop);
  const renderRouteAreas = areasGenerated && showRouteAreas;

  const handleSelectStop = (stopId: string) => {
    if (correctionActive) return;
    onSelectStop(stopId);
  };

  const handleSelectRoute = (routeId: string) => {
    if (correctionActive) return;
    onSelectRoute(routeId);
  };

  return (
    <div
      className="relative h-full w-full"
      data-testid="planning-map-shell"
      data-scroll-wheel-zoom="true"
      data-show-route-areas={showRouteAreas ? 'true' : 'false'}
    >
      <BaseMap
        center={[fixture.depot.lat, fixture.depot.lng]}
        zoom={12}
        className="h-full w-full"
        zoomControl={false}
        scrollWheelZoom
      >
        <FitBoundsOnMount bounds={bounds} />
        <FitOnGenerate areasGenerated={areasGenerated} bounds={bounds} />
        <FitSelectedRoute positions={fitSelectedPositions} trigger={routeFitTrigger} />
        <PanToPoint coords={selectedStopCoords} />
        <InvalidateOnMount />
        <InvalidateOnLayout trigger={panelCollapsed} />
        <InvalidateOnLayout trigger={areasGenerated} />
        <MapClickDeselect enabled={!correctionActive} onClearSelection={onClearMapSelection} />
        <PlanningMapToolbar
          bounds={bounds}
          activeRouteStops={areasGenerated ? activeRouteStops : null}
          activeRouteArea={activeAreaPositions}
          showRouteAreas={showRouteAreas}
          areasGenerated={areasGenerated}
          onToggleRouteAreas={onToggleRouteAreas}
        />

        {renderRouteAreas ? (
          <RoutePolygons
            areas={areas}
            activeRouteId={activeRouteId}
            onSelectRoute={handleSelectRoute}
          />
        ) : null}

        {!areasGenerated
          ? preGenerationStops.map((stop) => (
              <NeutralStopMarker key={stop.stopId} stop={stop} />
            ))
          : null}

        {areasGenerated
          ? fixture.routes.map((route) => {
              const routeIsSelected = activeRouteId === route.routeId;
              const isAmbiguous = activeRouteId !== null && !routeIsSelected;
              return route.stops.map((stop) => (
                <StopMarker
                  key={stop.stopId}
                  stop={stop}
                  routeColor={route.color}
                  routeIsSelected={routeIsSelected}
                  isStopSelected={selectedStopId === stop.stopId}
                  isAmbiguous={isAmbiguous}
                  onSelect={() => handleSelectStop(stop.stopId)}
                />
              ));
            })
          : null}

        {areasGenerated
          ? fixture.unassignedStops.map((stop) => (
              <UnassignedStopMarker
                key={stop.stopId}
                stop={stop}
                isSelected={selectedUnassignedStopId === stop.stopId}
                onSelect={() => handleSelectStop(stop.stopId)}
              />
            ))
          : null}

        <DepotMarker lat={fixture.depot.lat} lng={fixture.depot.lng} name={fixture.depot.name} />

        {correctionActive && correctionStop ? (
          <LocationCorrectionLayer
            savedLocation={{ lat: correctionStop.lat, lng: correctionStop.lng }}
            proposedLocation={proposedLocation}
            onMapClick={onCorrectionMapClick}
          />
        ) : null}
      </BaseMap>

      {correctionActive ? (
        <div className="planning-correction-banner" data-testid="correction-banner">
          <Icon d={ICONS.edit} size={11} stroke="var(--accent-text)" />
          <span>اصلاح موقعیت — روی نقشه کلیک کنید</span>
        </div>
      ) : null}
    </div>
  );
}
