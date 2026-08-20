import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExecutionMap } from '@/features/execution/components/ExecutionMap';
import type { ExecutionSnapshot } from '@/features/execution/model/types';
import type { AreaPolygonPresentation, AreaPolygonVisualState } from '@/shared/map/AreaPolygon';

const map = vi.hoisted(() => ({ zoomIn: vi.fn(), zoomOut: vi.fn(), fitBounds: vi.fn() }));
const baseMapProps = vi.hoisted(() => vi.fn());

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

vi.mock('react-leaflet', () => ({ useMap: () => map }));

vi.mock('@/shared/map/AreaPolygon', () => ({
  AreaPolygon: ({
    visualState,
    presentation,
    onClick,
  }: {
    visualState: AreaPolygonVisualState;
    presentation: Record<AreaPolygonVisualState, AreaPolygonPresentation>;
    onClick: () => void;
  }) => (
    <button
      type="button"
      data-testid={`execution-polygon-${visualState}`}
      data-opacity={presentation[visualState].opacity}
      onClick={onClick}
    />
  ),
}));
vi.mock('@/shared/map/BaseMap', () => ({
  BaseMap: ({ children, ...props }: { children: ReactNode; zoomControl?: boolean }) => {
    baseMapProps(props);
    return <div>{children}</div>;
  },
}));
vi.mock('@/shared/map/MapViewport', () => ({ FitBoundsOnMount: () => null, InvalidateOnLayout: () => null, InvalidateOnMount: () => null }));
vi.mock('@/shared/map/MapClickDeselect', () => ({
  MapClickDeselect: ({ onClearSelection }: { onClearSelection: () => void }) => (
    <button type="button" data-testid="execution-empty-map-click" onClick={onClearSelection} />
  ),
}));
vi.mock('@/features/execution/components/DeliveryLocationMarker', () => ({
  DeliveryLocationMarker: ({ id }: { id: string }) => <div data-testid={`execution-marker-${id}`} />,
}));

const snapshot: ExecutionSnapshot = {
  planId: 'P-1', publishedRevisionId: 'R-1', workingRevisionId: 'R-1',
  hasUnpublishedWorkingRevision: false, deliveryWindow: '', lastUpdatedLabel: '', phase: 'not-started',
  areas: [
    { id: 'A-01', name: 'one', color: '#123456', driverName: 'driver', polygon: [[35.7, 51.3], [35.8, 51.4], [35.7, 51.5]] },
    { id: 'A-02', name: 'two', color: '#654321', driverName: 'driver', polygon: [[35.6, 51.2], [35.7, 51.3], [35.6, 51.4]] },
  ],
  locations: [{ id: 'L-01', areaId: 'A-01', address: 'address', lat: 35.72, lng: 51.32 }],
  stopVisits: [],
  orders: [{ id: 'O-01', taskId: 'T-01', locationId: 'L-01', areaId: 'A-01', recipient: 'name', phone: '', uiStatus: 'pending', lastEventLabel: '', attempts: [] }],
  notes: [],
};

describe('ExecutionMap shared area polygon integration', () => {
  it('preserves selected, ambient, and Execution area selection behavior', () => {
    const onSelectArea = vi.fn();
    render(
      <ExecutionMap
        snapshot={snapshot}
        selectedAreaId="A-01"
        selectedLocationId={null}
        panelCollapsed={false}
        onSelectArea={onSelectArea}
        onSelectLocation={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );

    expect(screen.getByTestId('execution-polygon-selected')).toHaveAttribute('data-opacity', '0.9');
    expect(screen.getByTestId('execution-polygon-ambient')).toHaveAttribute('data-opacity', '0.28');
    fireEvent.click(screen.getByTestId('execution-polygon-ambient'));
    expect(onSelectArea).toHaveBeenCalledWith('A-02');
  });

  it('uses custom controls and keeps markers visible when polygons are hidden', () => {
    const onClearSelection = vi.fn();
    render(
      <ExecutionMap
        snapshot={snapshot}
        selectedAreaId="A-01"
        selectedLocationId={null}
        panelCollapsed={false}
        onSelectArea={vi.fn()}
        onSelectLocation={vi.fn()}
        onClearSelection={onClearSelection}
      />,
    );

    expect(baseMapProps).toHaveBeenLastCalledWith(expect.objectContaining({ zoomControl: false }));
    fireEvent.click(screen.getByTitle('بزرگ‌نمایی'));
    fireEvent.click(screen.getByTitle('کوچک‌نمایی'));
    expect(map.zoomIn).toHaveBeenCalledOnce();
    expect(map.zoomOut).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByTitle('نمای همه محدوده‌ها'));
    expect(map.fitBounds).toHaveBeenCalledWith(expect.any(Array), { padding: [60, 60], maxZoom: 14 });
    fireEvent.click(screen.getByRole('button', { name: 'مرکز کردن محدوده انتخاب‌شده' }));
    expect(map.fitBounds).toHaveBeenLastCalledWith(snapshot.areas[0]!.polygon, {
      padding: [80, 80], maxZoom: 14, animate: true,
    });
    expect(onClearSelection).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('toggle-route-areas'));
    expect(screen.queryByTestId('execution-polygon-selected')).not.toBeInTheDocument();
    expect(screen.getByTestId('execution-marker-L-01')).toBeInTheDocument();
    expect(screen.getByTestId('execution-map')).toHaveAttribute('data-selected-area-id', 'A-01');

    fireEvent.click(screen.getByTestId('execution-empty-map-click'));
    expect(onClearSelection).toHaveBeenCalledOnce();
  });

  it('disables selected-area fitting when no area is selected', () => {
    render(
      <ExecutionMap
        snapshot={snapshot}
        selectedAreaId={null}
        selectedLocationId={null}
        panelCollapsed={false}
        onSelectArea={vi.fn()}
        onSelectLocation={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'ابتدا یک محدوده انتخاب کنید' })).toBeDisabled();
  });
});
