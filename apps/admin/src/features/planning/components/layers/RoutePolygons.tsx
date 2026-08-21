import type { RouteAreaEntry } from '@/features/planning/map/route-area';
import { AreaPolygon, type AreaPolygonVisualState } from '@/shared/map/AreaPolygon';

/** A03 polygon pathOptions — primary Planning area visual. */
export const ROUTE_AREA_STYLE = {
  selected: { weight: 3.5, opacity: 1, fillOpacity: 0.34 },
  ambient: { weight: 2, opacity: 0.75, fillOpacity: 0.08 },
  normal: { weight: 2, opacity: 0.8, fillOpacity: 0.12 },
} as const;

type RoutePolygonsProps = {
  areas: RouteAreaEntry[];
  activeAreaId: string | null;
  onSelectRoute: (areaId: string) => void;
};

/**
 * Colored geographic delivery areas for each Planning Area.
 * Visualization only — not membership.
 */
export function RoutePolygons({ areas, activeAreaId, onSelectRoute }: RoutePolygonsProps) {
  return (
    <>
      {areas.map((entry) => {
        if (!entry.area || entry.area.positions.length < 3) return null;

        const isSelected = activeAreaId === entry.areaId;
        const isAmbient = activeAreaId !== null && !isSelected;
        const visualState: AreaPolygonVisualState = isSelected
          ? 'selected'
          : isAmbient
            ? 'ambient'
            : 'normal';
        const hasIssue = entry.planState === 'modified';

        return (
          <AreaPolygon
            key={entry.areaId}
            positions={entry.area.positions}
            color={entry.color}
            visualState={visualState}
            presentation={ROUTE_AREA_STYLE}
            dashArray={hasIssue && !isSelected ? '6 6' : undefined}
            onClick={() => onSelectRoute(entry.areaId)}
          />
        );
      })}
    </>
  );
}
