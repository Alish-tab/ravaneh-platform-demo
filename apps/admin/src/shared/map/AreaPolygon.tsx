import type { PathOptions } from 'leaflet';
import { Polygon, type PolygonProps } from 'react-leaflet';

import { stopMapClickPropagation } from '@/shared/map/MapClickDeselect';

export type AreaPolygonVisualState = 'normal' | 'selected' | 'ambient';

export type AreaPolygonPresentation = Pick<PathOptions, 'weight' | 'opacity' | 'fillOpacity'>;

type AreaPolygonProps = {
  positions: PolygonProps['positions'];
  color: string;
  visualState: AreaPolygonVisualState;
  presentation: Record<AreaPolygonVisualState, AreaPolygonPresentation>;
  dashArray?: string;
  onClick: () => void;
};

/** Product-neutral colored geographic area with isolated map-click handling. */
export function AreaPolygon({
  positions,
  color,
  visualState,
  presentation,
  dashArray,
  onClick,
}: AreaPolygonProps) {
  const style = presentation[visualState];

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color,
        weight: style.weight,
        opacity: style.opacity,
        fillColor: color,
        fillOpacity: style.fillOpacity,
        dashArray,
      }}
      eventHandlers={{
        click: (event) => {
          stopMapClickPropagation(event);
          onClick();
        },
      }}
    />
  );
}
