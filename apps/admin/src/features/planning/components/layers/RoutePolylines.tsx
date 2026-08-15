import { Fragment } from 'react';
import { Polyline } from 'react-leaflet';

import type { RouteGeometryEntry } from '@/features/planning/hooks/useRouteGeometries';
import type { PlanningPlanFixture } from '@/features/planning/fixture/types';
import { ROUTE_LINE_STYLE } from '@/shared/map/grammar';

type RoutePolylinesProps = {
  fixture: PlanningPlanFixture;
  geometries: Record<string, RouteGeometryEntry>;
  activeRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
};

/**
 * Fixture route paths — OSRM or straight-line fallback.
 *
 * Not rendered in the default Planning map (A03 uses area polygons as the primary visual).
 * Kept for optional future overlays / fit fallbacks via `useRouteGeometries` + `osrm.ts`.
 */
export function RoutePolylines({
  fixture,
  geometries,
  activeRouteId,
  onSelectRoute,
}: RoutePolylinesProps) {
  return (
    <>
      {fixture.routes.map((route) => {
        const entry = geometries[route.routeId];
        if (!entry || entry.positions.length < 2) return null;

        const isSelected = activeRouteId === route.routeId;
        const isAmbient = activeRouteId !== null && !isSelected;
        const hasIssue = route.planState === 'modified';

        const line = isSelected
          ? ROUTE_LINE_STYLE.selected
          : isAmbient
            ? ROUTE_LINE_STYLE.ambientWhenOtherSelected
            : ROUTE_LINE_STYLE.default;

        return (
          <Fragment key={route.routeId}>
            {isSelected ? (
              <Polyline
                positions={entry.positions}
                pathOptions={{
                  color: route.color,
                  weight: ROUTE_LINE_STYLE.selected.casingWeight,
                  opacity: ROUTE_LINE_STYLE.selected.casingOpacity,
                  lineCap: 'round',
                  lineJoin: 'round',
                  interactive: false,
                }}
              />
            ) : null}
            <Polyline
              positions={entry.positions}
              pathOptions={{
                color: route.color,
                weight: line.weight,
                opacity: line.opacity,
                dashArray: hasIssue && !isSelected ? '6 6' : undefined,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{
                click: () => onSelectRoute(route.routeId),
              }}
            />
          </Fragment>
        );
      })}
    </>
  );
}
