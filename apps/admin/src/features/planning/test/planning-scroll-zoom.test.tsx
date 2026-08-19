import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlanningMap } from '@/features/planning/components/PlanningMap';
import { PLANNING_PLAN_FIXTURE } from '@/features/planning/fixture/planning-fixture';
import { buildRouteAreas } from '@/features/planning/map/route-area';

const baseMapCalls: Array<{ scrollWheelZoom?: boolean }> = [];

vi.mock('@/shared/map/BaseMap', () => ({
  BaseMap: ({
    children,
    scrollWheelZoom,
  }: {
    children?: ReactNode;
    scrollWheelZoom?: boolean;
  }) => {
    baseMapCalls.push({ scrollWheelZoom });
    return (
      <div data-testid="base-map-stub" data-scroll-wheel-zoom={String(Boolean(scrollWheelZoom))}>
        {children}
      </div>
    );
  },
}));

vi.mock('@/features/planning/components/map/MapViewport', () => ({
  FitBoundsOnMount: () => null,
  FitOnGenerate: () => null,
  FitSelectedRoute: () => null,
  InvalidateOnLayout: () => null,
  InvalidateOnMount: () => null,
  PanToPoint: () => null,
}));

vi.mock('@/features/planning/components/map/MapClickDeselect', () => ({
  MapClickDeselect: () => null,
  stopMapClickPropagation: () => undefined,
}));

vi.mock('@/features/planning/components/layers/RoutePolygons', () => ({
  RoutePolygons: () => null,
}));

vi.mock('@/features/planning/components/layers/LocationCorrectionLayer', () => ({
  LocationCorrectionLayer: () => null,
}));

vi.mock('@/features/planning/components/markers/DepotMarker', () => ({
  DepotMarker: () => null,
}));

vi.mock('@/features/planning/components/markers/NeutralStopMarker', () => ({
  NeutralStopMarker: () => null,
}));

vi.mock('@/features/planning/components/markers/StopMarker', () => ({
  StopMarker: () => null,
}));

vi.mock('@/features/planning/components/markers/UnassignedStopMarker', () => ({
  UnassignedStopMarker: () => null,
}));

vi.mock('@/features/planning/components/PlanningMapToolbar', () => ({
  PlanningMapToolbar: () => null,
}));

describe('PlanningMap scroll-wheel zoom', () => {
  afterEach(() => {
    cleanup();
    baseMapCalls.length = 0;
  });

  it('enables Leaflet scrollWheelZoom through BaseMap', () => {
    render(
      <PlanningMap
        fixture={PLANNING_PLAN_FIXTURE}
        areas={buildRouteAreas(PLANNING_PLAN_FIXTURE.areas)}
        areasGenerated
        showRouteAreas
        activeRouteId={null}
        selectedStopId={null}
        selectedUnassignedStopId={null}
        selectedStopCoords={null}
        activeRouteStops={null}
        routeFitTrigger={null}
        panelCollapsed={false}
        correctionStopId={null}
        proposedLocation={null}
        onSelectStop={() => undefined}
        onSelectRoute={() => undefined}
        onClearMapSelection={() => undefined}
        onToggleRouteAreas={() => undefined}
        onCorrectionMapClick={() => undefined}
      />,
    );

    expect(screen.getByTestId('planning-map-shell')).toHaveAttribute(
      'data-scroll-wheel-zoom',
      'true',
    );
    expect(screen.getByTestId('base-map-stub')).toHaveAttribute('data-scroll-wheel-zoom', 'true');
    expect(baseMapCalls.at(-1)?.scrollWheelZoom).toBe(true);
  });
});
