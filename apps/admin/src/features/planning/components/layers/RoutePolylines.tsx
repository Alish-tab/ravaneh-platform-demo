import { Fragment } from 'react';
import { Polyline } from 'react-leaflet';

import type { RouteGeometryEntry } from '@/features/planning/hooks/useRouteGeometries';
import type { PlanningPlanFixture } from '@/features/planning/fixture/types';
import { ROUTE_LINE_STYLE } from '@/shared/map/grammar';

type RoutePolylinesProps = {
  fixture: PlanningPlanFixture;
  geometries: Record<string, RouteGeometryEntry>;
  activeRouteId: string | null;
  onSelectRoute: (areaId: string) => void;
};

/**
 * Optional route path overlay from fixture-local straight geometry.
 * Default Planning map uses Area polygons as the primary visual.
 */
export function RoutePolylines({
  fixture,
  geometries,
  activeRouteId,
  onSelectRoute,
}: RoutePolylinesProps) {
  return (
    <>
      {fixture.areas.map((area) => {
        const entry = geometries[area.areaId];
        if (!entry || entry.positions.length < 2) return null;

        const isSelected = activeRouteId === area.areaId;
        const isAmbient = activeRouteId !== null && !isSelected;
        const hasIssue = area.planState === 'modified';

        const line = isSelected
          ? ROUTE_LINE_STYLE.selected
          : isAmbient
            ? ROUTE_LINE_STYLE.ambientWhenOtherSelected
            : ROUTE_LINE_STYLE.default;

        return (
          <Fragment key={area.areaId}>
            {isSelected ? (
              <Polyline
                positions={entry.positions}
                pathOptions={{
                  color: area.color,
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
                color: area.color,
                weight: line.weight,
                opacity: line.opacity,
                dashArray: hasIssue && !isSelected ? '6 6' : undefined,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{
                click: () => onSelectRoute(area.areaId),
              }}
            />
          </Fragment>
        );
      })}
    </>
  );
}
