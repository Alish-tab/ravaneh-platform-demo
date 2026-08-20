import { fireEvent, render, screen } from '@testing-library/react';
import type { LeafletMouseEvent } from 'leaflet';
import { describe, expect, it, vi } from 'vitest';

import { AreaPolygon } from '@/shared/map/AreaPolygon';
import { stopMapClickPropagation } from '@/shared/map/MapClickDeselect';

vi.mock('@/shared/map/MapClickDeselect', () => ({
  stopMapClickPropagation: vi.fn(),
}));

vi.mock('react-leaflet', () => ({
  Polygon: ({ eventHandlers }: { eventHandlers: { click: (event: LeafletMouseEvent) => void } }) => (
    <button
      type="button"
      data-testid="leaflet-polygon"
      onClick={() => eventHandlers.click({} as LeafletMouseEvent)}
    />
  ),
}));

describe('AreaPolygon', () => {
  it('isolates the polygon click before invoking the stage callback', () => {
    const onClick = vi.fn();
    render(
      <AreaPolygon
        positions={[[35.7, 51.3], [35.8, 51.4], [35.7, 51.5]]}
        color="#456789"
        visualState="normal"
        presentation={{
          normal: { weight: 2, opacity: 0.7, fillOpacity: 0.12 },
          selected: { weight: 3, opacity: 0.9, fillOpacity: 0.18 },
          ambient: { weight: 1.5, opacity: 0.28, fillOpacity: 0.05 },
        }}
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByTestId('leaflet-polygon'));

    expect(stopMapClickPropagation).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
