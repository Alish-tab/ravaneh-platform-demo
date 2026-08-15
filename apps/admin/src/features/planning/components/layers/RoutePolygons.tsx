import { Polygon } from 'react-leaflet';

import { stopMapClickPropagation } from '@/features/planning/components/map/MapClickDeselect';
import type { RouteAreaEntry } from '@/features/planning/map/route-area';

/** A03 polygon pathOptions — primary Planning area visual. */
export const ROUTE_AREA_STYLE = {
  selected: { weight: 3, opacity: 0.9, fillOpacity: 0.18 },
  ambient: { weight: 1.5, opacity: 0.22, fillOpacity: 0.04 },
  normal: { weight: 2, opacity: 0.65, fillOpacity: 0.1 },
} as const;

type RoutePolygonsProps = {
  areas: RouteAreaEntry[];
  activeRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
};

/**
 * Colored geographic delivery areas for each fixture route.
 * Layer order: render under stop markers (markers use markerPane).
 */
export function RoutePolygons({ areas, activeRouteId, onSelectRoute }: RoutePolygonsProps) {
  return (
    <>
      {areas.map((entry) => {
        if (!entry.area || entry.area.positions.length < 3) return null;

        const isSelected = activeRouteId === entry.routeId;
        const isAmbient = activeRouteId !== null && !isSelected;
        const style = isSelected
          ? ROUTE_AREA_STYLE.selected
          : isAmbient
            ? ROUTE_AREA_STYLE.ambient
            : ROUTE_AREA_STYLE.normal;
        const hasIssue = entry.planState === 'modified';

        return (
          <Polygon
            key={entry.routeId}
            positions={entry.area.positions}
            pathOptions={{
              color: entry.color,
              weight: style.weight,
              opacity: style.opacity,
              fillColor: entry.color,
              fillOpacity: style.fillOpacity,
              dashArray: hasIssue && !isSelected ? '6 6' : undefined,
            }}
            eventHandlers={{
              click: (event) => {
                stopMapClickPropagation(event);
                onSelectRoute(entry.routeId);
              },
            }}
          />
        );
      })}
    </>
  );
}
