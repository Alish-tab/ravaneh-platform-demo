import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RoutePolygons } from '@/features/planning/components/layers/RoutePolygons';
import type { RouteAreaEntry } from '@/features/planning/map/route-area';
import type { AreaPolygonPresentation, AreaPolygonVisualState } from '@/shared/map/AreaPolygon';

vi.mock('@/shared/map/AreaPolygon', () => ({
  AreaPolygon: ({
    color,
    visualState,
    presentation,
    dashArray,
    onClick,
  }: {
    color: string;
    visualState: AreaPolygonVisualState;
    presentation: Record<AreaPolygonVisualState, AreaPolygonPresentation>;
    dashArray?: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      data-testid={`planning-polygon-${visualState}`}
      data-color={color}
      data-weight={presentation[visualState].weight}
      data-opacity={presentation[visualState].opacity}
      data-fill-opacity={presentation[visualState].fillOpacity}
      data-dash-array={dashArray ?? ''}
      onClick={onClick}
    />
  ),
}));

const positions: Array<[number, number]> = [[35.7, 51.3], [35.8, 51.4], [35.7, 51.5]];
const areas: RouteAreaEntry[] = [
  { areaId: 'A-01', routeId: 'A-01', color: '#123456', planState: 'assigned', area: { positions, source: 'convex' } },
  { areaId: 'A-02', routeId: 'A-02', color: '#654321', planState: 'modified', area: { positions, source: 'convex' } },
  { areaId: 'A-03', routeId: 'A-03', color: '#287a54', planState: 'assigned', area: { positions, source: 'convex' } },
];

describe('RoutePolygons shared renderer integration', () => {
  it('preserves selected, ambient, modified-dash, and Planning selection behavior', () => {
    const onSelectRoute = vi.fn();
    render(<RoutePolygons areas={areas} activeAreaId="A-01" onSelectRoute={onSelectRoute} />);

    const selected = screen.getByTestId('planning-polygon-selected');
    const ambient = screen.getAllByTestId('planning-polygon-ambient');

    expect(selected).toHaveAttribute('data-color', '#123456');
    expect(selected).toHaveAttribute('data-weight', '3.5');
    expect(selected).toHaveAttribute('data-opacity', '1');
    expect(selected).toHaveAttribute('data-fill-opacity', '0.34');
    expect(selected).toHaveAttribute('data-dash-array', '');
    expect(ambient.map((polygon) => polygon.dataset.color)).toEqual(['#654321', '#287a54']);
    for (const polygon of ambient) {
      expect(polygon).toHaveAttribute('data-weight', '2');
      expect(polygon).toHaveAttribute('data-opacity', '0.75');
      expect(polygon).toHaveAttribute('data-fill-opacity', '0.08');
    }
    expect(ambient[0]!).toHaveAttribute('data-dash-array', '6 6');
    expect(ambient[1]!).toHaveAttribute('data-dash-array', '');

    fireEvent.click(ambient[0]!);
    expect(onSelectRoute).toHaveBeenCalledWith('A-02');
  });

  it('keeps every polygon in the normal state when no area is selected', () => {
    render(<RoutePolygons areas={areas} activeAreaId={null} onSelectRoute={vi.fn()} />);

    const polygons = screen.getAllByTestId('planning-polygon-normal');

    expect(polygons).toHaveLength(3);
    expect(polygons.map((polygon) => polygon.dataset.color)).toEqual(['#123456', '#654321', '#287a54']);
    for (const polygon of polygons) {
      expect(polygon).toHaveAttribute('data-weight', '2');
      expect(polygon).toHaveAttribute('data-opacity', '0.8');
      expect(polygon).toHaveAttribute('data-fill-opacity', '0.12');
    }
  });
});
