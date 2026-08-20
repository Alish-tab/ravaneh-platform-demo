import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RoutePolygons } from '@/features/planning/components/layers/RoutePolygons';
import type { RouteAreaEntry } from '@/features/planning/map/route-area';
import type { AreaPolygonPresentation, AreaPolygonVisualState } from '@/shared/map/AreaPolygon';

vi.mock('@/shared/map/AreaPolygon', () => ({
  AreaPolygon: ({
    visualState,
    presentation,
    dashArray,
    onClick,
  }: {
    visualState: AreaPolygonVisualState;
    presentation: Record<AreaPolygonVisualState, AreaPolygonPresentation>;
    dashArray?: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      data-testid={`planning-polygon-${visualState}`}
      data-opacity={presentation[visualState].opacity}
      data-dash-array={dashArray ?? ''}
      onClick={onClick}
    />
  ),
}));

const positions: Array<[number, number]> = [[35.7, 51.3], [35.8, 51.4], [35.7, 51.5]];
const areas: RouteAreaEntry[] = [
  { areaId: 'A-01', routeId: 'A-01', color: '#123456', planState: 'assigned', area: { positions, source: 'convex' } },
  { areaId: 'A-02', routeId: 'A-02', color: '#654321', planState: 'modified', area: { positions, source: 'convex' } },
];

describe('RoutePolygons shared renderer integration', () => {
  it('preserves selected, ambient, modified-dash, and Planning selection behavior', () => {
    const onSelectRoute = vi.fn();
    render(<RoutePolygons areas={areas} activeAreaId="A-01" onSelectRoute={onSelectRoute} />);

    expect(screen.getByTestId('planning-polygon-selected')).toHaveAttribute('data-opacity', '0.9');
    expect(screen.getByTestId('planning-polygon-selected')).toHaveAttribute('data-dash-array', '');
    expect(screen.getByTestId('planning-polygon-ambient')).toHaveAttribute('data-opacity', '0.22');
    expect(screen.getByTestId('planning-polygon-ambient')).toHaveAttribute('data-dash-array', '6 6');

    fireEvent.click(screen.getByTestId('planning-polygon-ambient'));
    expect(onSelectRoute).toHaveBeenCalledWith('A-02');
  });
});
