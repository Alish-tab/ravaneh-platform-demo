import { useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';

import { Icon, ICONS } from '@/features/plans/components/icons';
import type { PlanningStop } from '@/features/planning/fixture/types';
import type { LatLngTuple } from '@/features/planning/map/osrm';

type PlanningMapToolbarProps = {
  bounds: LatLngBoundsExpression | null;
  activeRouteStops: PlanningStop[] | null;
  activeRouteArea: LatLngTuple[] | null;
  showRouteAreas: boolean;
  areasGenerated: boolean;
  onToggleRouteAreas: () => void;
};

export function PlanningMapToolbar({
  bounds,
  activeRouteStops,
  activeRouteArea,
  showRouteAreas,
  areasGenerated,
  onToggleRouteAreas,
}: PlanningMapToolbarProps) {
  const map = useMap();
  const canFitSelected =
    (activeRouteArea && activeRouteArea.length > 0) ||
    (activeRouteStops && activeRouteStops.length > 0);

  const fitAll = () => {
    if (!bounds) return;
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
  };

  const fitSelected = () => {
    if (activeRouteArea && activeRouteArea.length > 0) {
      map.fitBounds(activeRouteArea as LatLngBoundsExpression, {
        padding: [80, 80],
        maxZoom: 14,
        animate: true,
      });
      return;
    }
    if (!activeRouteStops || activeRouteStops.length < 1) return;
    map.fitBounds(
      activeRouteStops.map((stop) => [stop.lat, stop.lng]) as LatLngBoundsExpression,
      { padding: [80, 80], maxZoom: 14, animate: true },
    );
  };

  return (
    <div className="planning-map-toolbar" aria-label="کنترل‌های نقشه">
      <div className="planning-map-tool-cluster">
        <button
          type="button"
          className="planning-map-tool-btn"
          title="بزرگ‌نمایی"
          onClick={() => map.zoomIn()}
        >
          +
        </button>
        <div className="planning-map-tool-sep" />
        <button
          type="button"
          className="planning-map-tool-btn"
          title="کوچک‌نمایی"
          onClick={() => map.zoomOut()}
        >
          −
        </button>
      </div>

      <div className="planning-map-tool-cluster">
        <button
          type="button"
          className="planning-map-tool-btn"
          title="نمای همه محدوده‌ها"
          onClick={fitAll}
        >
          <Icon d={ICONS.target} size={13} />
        </button>
        <div className="planning-map-tool-sep" />
        <button
          type="button"
          className="planning-map-tool-btn"
          title={canFitSelected ? 'نمای محدوده انتخابی' : 'ابتدا یک محدوده انتخاب کنید'}
          disabled={!canFitSelected}
          data-testid="fit-selected-route"
          onClick={fitSelected}
        >
          <Icon d={ICONS.layers} size={13} />
        </button>
      </div>

      {areasGenerated ? (
        <div className="planning-map-tool-cluster">
          <button
            type="button"
            className="planning-map-tool-btn"
            title={showRouteAreas ? 'پنهان کردن محدوده‌ها' : 'نمایش محدوده‌ها'}
            aria-label={showRouteAreas ? 'پنهان کردن محدوده‌ها' : 'نمایش محدوده‌ها'}
            aria-pressed={showRouteAreas}
            data-testid="toggle-route-areas"
            onClick={onToggleRouteAreas}
          >
            <Icon d={ICONS.layers} size={13} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
