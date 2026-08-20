import { useEffect, useRef } from 'react';
import L from 'leaflet';

import { MapIcon, MAP_TOOLBAR_ICONS } from '@/shared/map/MapIcon';

type MapToolbarProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitAll: () => void;
  onFitSelected: () => void;
  onToggleAreas: () => void;
  hasSelection: boolean;
  showAreas: boolean;
  showAreaToggle?: boolean;
};

export function MapToolbar({
  onZoomIn,
  onZoomOut,
  onFitAll,
  onFitSelected,
  onToggleAreas,
  hasSelection,
  showAreas,
  showAreaToggle = true,
}: MapToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (toolbarRef.current) L.DomEvent.disableClickPropagation(toolbarRef.current);
  }, []);

  return (
    <div
      ref={toolbarRef}
      className="shared-map-toolbar"
      aria-label="کنترل‌های نقشه"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="shared-map-tool-cluster">
        <button type="button" className="shared-map-tool-btn" title="بزرگ‌نمایی" onClick={onZoomIn}>
          +
        </button>
        <div className="shared-map-tool-sep" />
        <button type="button" className="shared-map-tool-btn" title="کوچک‌نمایی" onClick={onZoomOut}>
          −
        </button>
      </div>

      <div className="shared-map-tool-cluster">
        <button type="button" className="shared-map-tool-btn" title="نمای همه محدوده‌ها" onClick={onFitAll}>
          <MapIcon d={MAP_TOOLBAR_ICONS.target} size={13} />
        </button>
        <div className="shared-map-tool-sep" />
        <button
          type="button"
          className="shared-map-tool-btn"
          title={hasSelection ? 'مرکز کردن محدوده انتخاب‌شده' : 'ابتدا یک محدوده انتخاب کنید'}
          aria-label={hasSelection ? 'مرکز کردن محدوده انتخاب‌شده' : 'ابتدا یک محدوده انتخاب کنید'}
          disabled={!hasSelection}
          data-testid="fit-selected-route"
          onClick={onFitSelected}
        >
          <MapIcon d={MAP_TOOLBAR_ICONS.focus_area} size={13} />
        </button>
      </div>

      {showAreaToggle ? (
        <div className="shared-map-tool-cluster">
          <button
            type="button"
            className="shared-map-tool-btn"
            title={showAreas ? 'پنهان کردن محدوده‌ها' : 'نمایش محدوده‌ها'}
            aria-label={showAreas ? 'پنهان کردن محدوده‌ها' : 'نمایش محدوده‌ها'}
            aria-pressed={showAreas}
            data-testid="toggle-route-areas"
            onClick={onToggleAreas}
          >
            <MapIcon d={MAP_TOOLBAR_ICONS.layers} size={13} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
