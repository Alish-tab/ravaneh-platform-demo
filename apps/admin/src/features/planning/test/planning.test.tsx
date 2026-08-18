import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRoutes } from '@/app/router';
import { PlanningSidePanel } from '@/features/planning/components/PlanningSidePanel';
import { PlanningWorkspace } from '@/features/planning/components/PlanningWorkspace';
import {
  assignDriverToRoute,
  removeDriverFromRoute,
  setDriverAssignmentLocked,
} from '@/features/planning/fixture/assign-driver';
import { assignStopToRoute } from '@/features/planning/fixture/assign-stop';
import {
  moveOrderToRoute,
  moveStopToRoute,
  removeStopFromRoute,
} from '@/features/planning/fixture/transfer-stop';
import {
  createPlanningFixture,
  getPlanningFixture,
  PLANNING_FIXTURE_PLAN_ID,
  PLANNING_PLAN_FIXTURE,
} from '@/features/planning/fixture/planning-fixture';
import { countRoutesWithoutDriver } from '@/features/planning/fixture/drivers';
import {
  countRemainingUnassignedOrders,
  isOrderExcluded,
  isUnassignedStopFullyExcluded,
} from '@/features/planning/fixture/exclude-order';
import {
  isValidPlanningLatLng,
  updateStopLocation,
} from '@/features/planning/fixture/update-stop-location';
import { usePlanningSelection } from '@/features/planning/hooks/usePlanningSelection';
import { createPlansFixturePort } from '@/features/plans/fixture/plans-fixture';
import { PLANNING_ROUTE_STATE_LABEL } from '@/features/planning/presentation';
import { buildRouteAreas, type RouteAreaEntry } from '@/features/planning/map/route-area';
import type { PlanningPlanFixture } from '@/features/planning/fixture/types';

vi.mock('@/shared/config/env', () => ({
  env: {
    apiBaseUrl: 'http://localhost:8080',
    mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    mapAttribution: '© OpenStreetMap contributors',
  },
}));

vi.mock('@/features/execution/components/ExecutionMap', () => ({
  ExecutionMap: () => <div data-testid="execution-map-stub">execution-map</div>,
}));

vi.mock('@/features/planning/components/PlanningMap', () => ({
  PlanningMap: ({
    fixture,
    areas,
    areasGenerated = true,
    showRouteAreas = true,
    activeRouteId,
    selectedStopId,
    selectedUnassignedStopId,
    routeFitTrigger,
    correctionStopId = null,
    proposedLocation = null,
    onSelectStop,
    onSelectRoute,
    onClearMapSelection,
    onToggleRouteAreas,
    onCorrectionMapClick,
  }: {
    fixture: PlanningPlanFixture;
    areas: RouteAreaEntry[];
    areasGenerated?: boolean;
    showRouteAreas?: boolean;
    activeRouteId: string | null;
    selectedStopId: string | null;
    selectedUnassignedStopId: string | null;
    routeFitTrigger: string | null;
    correctionStopId?: string | null;
    proposedLocation?: { lat: number; lng: number } | null;
    onSelectStop: (stopId: string) => void;
    onSelectRoute: (routeId: string) => void;
    onClearMapSelection?: () => void;
    onToggleRouteAreas?: () => void;
    onCorrectionMapClick?: (coords: { lat: number; lng: number }) => void;
  }) => {
    const fitSource = (() => {
      if (!areasGenerated || !activeRouteId) return 'none';
      const area = areas.find((entry) => entry.routeId === activeRouteId)?.area;
      // Fit uses derived polygon geometry even when polygons are hidden.
      return area ? 'polygon' : 'stops';
    })();

    const preStops = [
      ...fixture.routes.flatMap((route) => route.stops),
      ...fixture.unassignedStops,
    ];

    const correctionStop =
      correctionStopId == null
        ? null
        : fixture.routes.flatMap((route) => route.stops).find((stop) => stop.stopId === correctionStopId) ??
          fixture.unassignedStops.find((stop) => stop.stopId === correctionStopId) ??
          null;

    const renderAreas = areasGenerated && showRouteAreas;

    return (
      <div
        data-testid="planning-map"
        data-areas-generated={areasGenerated ? 'true' : 'false'}
        data-show-route-areas={showRouteAreas ? 'true' : 'false'}
        data-correction-mode={correctionStopId ? 'true' : 'false'}
        data-scroll-wheel-zoom="true"
      >
        {renderAreas
          ? areas.map((entry) => {
              const selected = activeRouteId === entry.routeId;
              return (
                <button
                  key={entry.routeId}
                  type="button"
                  data-testid={`route-area-${entry.routeId}`}
                  data-selected={selected ? 'true' : 'false'}
                  data-ambient={activeRouteId !== null && !selected ? 'true' : 'false'}
                  data-has-polygon={entry.area ? 'true' : 'false'}
                  data-point-count={entry.area?.positions.length ?? 0}
                  onClick={() => {
                    if (!correctionStopId) onSelectRoute(entry.routeId);
                  }}
                >
                  area-{entry.routeId}
                </button>
              );
            })
          : null}
        {areasGenerated
          ? fixture.routes.flatMap((route) =>
              route.stops.map((stop) => (
                <button
                  key={stop.stopId}
                  type="button"
                  data-testid={`map-stop-${stop.stopId}`}
                  data-marker-kind="routed"
                  data-route-id={route.routeId}
                  data-lat={String(stop.lat)}
                  data-lng={String(stop.lng)}
                  data-selected={selectedStopId === stop.stopId ? 'true' : 'false'}
                  data-route-active={activeRouteId === route.routeId ? 'true' : 'false'}
                  data-ambient={
                    activeRouteId !== null && activeRouteId !== route.routeId ? 'true' : 'false'
                  }
                  onClick={() => {
                    if (!correctionStopId) onSelectStop(stop.stopId);
                  }}
                >
                  {stop.stopId}
                </button>
              )),
            )
          : preStops.map((stop) => (
              <div
                key={stop.stopId}
                data-testid={`map-stop-${stop.stopId}`}
                data-marker-kind="neutral"
              >
                {stop.stopId}
              </div>
            ))}
        {areasGenerated
          ? fixture.unassignedStops.map((stop) => (
              <button
                key={stop.stopId}
                type="button"
                data-testid={`map-stop-${stop.stopId}`}
                data-marker-kind="unassigned"
                data-selected={selectedUnassignedStopId === stop.stopId ? 'true' : 'false'}
                onClick={() => {
                  if (!correctionStopId) onSelectStop(stop.stopId);
                }}
              >
                {stop.stopId}
              </button>
            ))
          : null}
        {correctionStop ? (
          <>
            <div
              data-testid="correction-saved-marker"
              data-lat={String(correctionStop.lat)}
              data-lng={String(correctionStop.lng)}
            />
            {proposedLocation ? (
              <div
                data-testid="correction-proposed-marker"
                data-lat={String(proposedLocation.lat)}
                data-lng={String(proposedLocation.lng)}
              />
            ) : null}
            <button
              type="button"
              data-testid="correction-map-click"
              onClick={() => onCorrectionMapClick?.({ lat: 35.751, lng: 51.401 })}
            >
              propose
            </button>
            <div data-testid="correction-banner">اصلاح موقعیت — روی نقشه کلیک کنید</div>
          </>
        ) : null}
        {!correctionStopId ? (
          <button
            type="button"
            data-testid="empty-map-click"
            onClick={() => onClearMapSelection?.()}
          >
            empty
          </button>
        ) : null}
        {areasGenerated ? (
          <button
            type="button"
            data-testid="toggle-route-areas"
            aria-pressed={showRouteAreas}
            aria-label={showRouteAreas ? 'پنهان کردن محدوده‌ها' : 'نمایش محدوده‌ها'}
            title={showRouteAreas ? 'پنهان کردن محدوده‌ها' : 'نمایش محدوده‌ها'}
            onClick={() => onToggleRouteAreas?.()}
          >
            areas
          </button>
        ) : null}
        <div data-testid="route-fit-trigger">{routeFitTrigger ?? ''}</div>
        <div data-testid="fit-selected-source">{fitSource}</div>
        <div data-testid="route-r01-stop-count">
          {fixture.routes.find((route) => route.routeId === 'R-01')?.stops.length ?? 0}
        </div>
        <div data-testid="unassigned-stop-count">{fixture.unassignedStops.length}</div>
        <button
          type="button"
          data-testid="fit-selected-route"
          disabled={!activeRouteId}
        >
          fit-selected
        </button>
      </div>
    );
  },
}));

afterEach(() => {
  cleanup();
});

function cloneFixture(): PlanningPlanFixture {
  return structuredClone(PLANNING_PLAN_FIXTURE);
}

function renderPlanningPage(planId = PLANNING_FIXTURE_PLAN_ID) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [`/plans/${planId}/planning`],
  });
  const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
  return {
    router,
    ...render(
      <AppProviders plansPort={port}>
        <RouterProvider router={router} />
      </AppProviders>,
    ),
  };
}

function WorkspaceHarness() {
  return (
    <PlanningWorkspace
      initialFixture={cloneFixture()}
      initialGenerationPhase="generated"
    />
  );
}

const FAST_GENERATION_TIMING = { submittingMs: 20, completeMs: 50 };

function PanelHarness() {
  const planning = usePlanningSelection(PLANNING_PLAN_FIXTURE);
  return (
    <PlanningSidePanel
      fixture={PLANNING_PLAN_FIXTURE}
      selectedRouteId={planning.selection.selectedRouteId}
      selectedStopId={planning.selection.selectedStopId}
      selectedOrderId={planning.selection.selectedOrderId}
      selectedUnassignedStopId={planning.selection.selectedUnassignedStopId}
      areaPickerStopId={planning.areaPickerStopId}
      transferFlow={planning.transferFlow}
      driverPickerRouteId={planning.driverPickerRouteId}
      pendingDriver={planning.pendingDriver}
      removeDriverRouteId={planning.removeDriverRouteId}
      justAssignedRouteId={planning.justAssignedRouteId}
      correctionStopId={planning.correctionStopId}
      proposedLocation={planning.proposedLocation}
      excludedOrderIds={planning.excludedOrderIds}
      areaFilter={planning.areaFilter}
      isPending={false}
      onAreaFilterChange={planning.setAreaFilter}
      onSelectRoute={planning.selectRoute}
      onSelectStop={planning.selectStop}
      onSelectOrder={planning.selectOrder}
      onOpenAreaPicker={planning.openAreaPicker}
      onCloseAreaPicker={planning.closeAreaPicker}
      onConfirmAreaAssign={() => undefined}
      onExcludeUnassignedStop={planning.excludeUnassignedStopOrders}
      onOpenTransferFromStop={planning.openTransferFromStop}
      onOpenTransferFromOrder={planning.openTransferFromOrder}
      onSetTransferScope={planning.setTransferScope}
      onBackFromTransferPick={planning.backFromTransferPick}
      onCloseTransferPicker={planning.closeTransferPicker}
      onConfirmAreaTransfer={() => undefined}
      onOpenDriverPicker={planning.openDriverPicker}
      onCloseDriverPicker={planning.closeDriverPicker}
      onSelectDriverCandidate={planning.selectDriverCandidate}
      onClearDriverCandidate={planning.clearDriverCandidate}
      onConfirmDriverAssign={() => undefined}
      onOpenRemoveDriver={planning.openRemoveDriver}
      onCloseRemoveDriver={planning.closeRemoveDriver}
      onConfirmRemoveDriver={() => undefined}
      onToggleDriverLock={() => undefined}
      onOpenLocationCorrection={planning.openLocationCorrection}
      onSaveLocationCorrection={() => undefined}
      onCancelLocationCorrection={planning.cancelLocationCorrection}
      onBackFromOrder={planning.backFromOrder}
      onBackFromStop={planning.backFromStop}
      onBackFromRoute={planning.backFromRoute}
      onCollapse={() => planning.setPanelCollapsed(true)}
    />
  );
}

describe('Planning workspace', () => {
  it('renders the planning page shell in pre-generation with active stage', async () => {
    renderPlanningPage();

    expect(await screen.findAllByText(PLANNING_PLAN_FIXTURE.planName)).not.toHaveLength(0);
    expect(screen.getByRole('link', { name: /برنامه‌ریزی و تخصیص/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByTestId('planning-body')).toHaveAttribute('data-generation-phase', 'ready');
    expect(screen.getByTestId('generation-panel')).toBeInTheDocument();
    expect(screen.getByTestId('start-generation')).toBeInTheDocument();
    expect(screen.queryByTestId('route-row-R-01')).not.toBeInTheDocument();
    expect(screen.getByTestId('planning-map')).toHaveAttribute('data-areas-generated', 'false');
  });

  it('is plan-scoped at /plans/:planId/planning with active Planning stage', async () => {
    const { router } = renderPlanningPage('P-2404');

    expect(await screen.findAllByText(PLANNING_PLAN_FIXTURE.planName)).toHaveLength(2);
    expect(router.state.location.pathname).toBe('/plans/P-2404/planning');
    expect(screen.getByRole('link', { name: /برنامه‌ریزی و تخصیص/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const top = document.querySelector('.admin-shell-top');
    expect(top).not.toBeNull();
    expect(within(top as HTMLElement).getByRole('link', { name: 'برنامه‌ها' })).toHaveAttribute(
      'href',
      '/plans',
    );
  });

  it('navigates Planning → Review while preserving planId', async () => {
    const user = userEvent.setup();
    const { router } = renderPlanningPage('P-2404');
    await screen.findByRole('link', { name: /برنامه‌ریزی و تخصیص/ });

    await user.click(screen.getByRole('link', { name: /بررسی داده/ }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/plans/P-2404/review'),
    );
  });

  it('navigates Review → Planning when plan is already in planning state', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/plans/P-2404/review'],
    });
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    render(
      <AppProviders plansPort={port}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    await screen.findByRole('link', { name: /بررسی داده/ });
    const plan = await port.getPlan('P-2404');
    expect(plan).toMatchObject({ currentStage: 'planning', status: 'planning_active' });

    await user.click(screen.getByRole('link', { name: /برنامه‌ریزی و تخصیص/ }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/plans/P-2404/planning'),
    );
    expect(await screen.findByTestId('planning-map')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /برنامه‌ریزی و تخصیص/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('navigates Intake → Planning stage click while preserving planId', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/plans/P-2404/intake'],
    });
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    render(
      <AppProviders plansPort={port}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    await screen.findByRole('link', { name: /داده‌های برنامه/ });
    await user.click(screen.getByRole('link', { name: /برنامه‌ریزی و تخصیص/ }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/plans/P-2404/planning'),
    );
  });

  it('shows plan-not-found for an unknown plan id', async () => {
    renderPlanningPage('P-MISSING');
    expect(await screen.findByText('برنامه یافت نشد.')).toBeInTheDocument();
  });

  it('does not keep a standalone /planning production route', () => {
    const paths = appRoutes[0]?.children?.map((route) => route.path) ?? [];
    expect(paths).toContain('plans/:planId/planning');
    expect(paths).not.toContain('planning');
  });

  it('renders route area polygons through the mocked Leaflet boundary', () => {
    render(<WorkspaceHarness />);

    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-has-polygon', 'true');
    expect(screen.getByTestId('route-area-R-02')).toHaveAttribute('data-has-polygon', 'true');
    expect(screen.getByTestId('route-area-R-03')).toHaveAttribute('data-has-polygon', 'true');
  });

  it('selects a route from a polygon and updates selected vs ambient areas', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('route-area-R-01'));

    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('route-area-R-02')).toHaveAttribute('data-ambient', 'true');
    expect(screen.getByLabelText('جزئیات محدوده ۱')).toBeInTheDocument();
    expect(screen.getByTestId('fit-selected-source')).toHaveTextContent('polygon');
  });

  it('selects a route from the panel and highlights areas', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('route-row-R-01'));

    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByLabelText('جزئیات محدوده ۱')).toBeInTheDocument();
  });

  it('lists ordered stop sequence for the selected route', async () => {
    const user = userEvent.setup();
    render(<PanelHarness />);

    await user.click(screen.getByTestId('route-row-R-01'));
    const list = screen.getByTestId('route-stop-list');
    const rows = within(list).getAllByTestId(/stop-row-/);
    expect(rows.map((row) => row.getAttribute('data-stop-seq'))).toEqual(['1', '2', '3', '4']);
  });

  it('keeps route context when selecting a stop from the route list', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('route-row-R-01'));
    await user.click(screen.getByTestId('stop-row-S-102'));

    expect(screen.getByLabelText('جزئیات نقطه تحویل')).toBeInTheDocument();
    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('map-stop-S-102')).toHaveAttribute('data-selected', 'true');
  });

  it('synchronizes unassigned selection between panel and map', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('unassigned-row-U-001'));

    expect(screen.getByTestId('map-stop-U-001')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('unassigned-row-U-001')).toHaveAttribute('aria-selected', 'true');
  });

  it('assigns an unassigned stop to a route via area picker', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    const r01Before = Number(screen.getByTestId('route-r01-stop-count').textContent);
    const unassignedBefore = Number(screen.getByTestId('unassigned-stop-count').textContent);

    expect(screen.getByTestId('map-stop-U-001')).toHaveAttribute('data-marker-kind', 'unassigned');

    await user.click(screen.getByTestId('assign-unassigned-U-001'));
    expect(screen.getByTestId('area-picker')).toBeInTheDocument();

    await user.click(screen.getByTestId('area-picker-route-R-01'));
    await user.click(screen.getByTestId('confirm-area-assign'));

    await waitFor(() => {
      expect(screen.queryByTestId('area-picker')).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('unassigned-row-U-001')).not.toBeInTheDocument();
    expect(screen.getByTestId('unassigned-stop-count')).toHaveTextContent(
      String(unassignedBefore - 1),
    );
    expect(screen.getByTestId('route-r01-stop-count')).toHaveTextContent(String(r01Before + 1));

    expect(screen.getByTestId('map-stop-U-001')).toHaveAttribute('data-marker-kind', 'routed');
    expect(screen.getByTestId('map-stop-U-001')).toHaveAttribute('data-route-id', 'R-01');
    expect(screen.getByTestId('map-stop-U-001')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-selected', 'true');

    expect(screen.getByLabelText('جزئیات نقطه تحویل')).toBeInTheDocument();
    expect(screen.getByTestId('order-row-10129001')).toBeInTheDocument();

    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-has-polygon', 'true');
    expect(screen.getByTestId('route-area-R-02')).toHaveAttribute('data-has-polygon', 'true');
  });

  it('shows updated stop sequence after assignment', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('assign-unassigned-U-001'));
    await user.click(screen.getByTestId('area-picker-route-R-01'));
    await user.click(screen.getByTestId('confirm-area-assign'));

    await waitFor(() => expect(screen.queryByTestId('area-picker')).not.toBeInTheDocument());

    // Back to route list detail via route context — stop detail is open; go back
    await user.click(screen.getByRole('button', { name: /محدوده ۱/ }));
    const list = screen.getByTestId('route-stop-list');
    const rows = within(list).getAllByTestId(/stop-row-/);
    expect(rows.map((row) => row.getAttribute('data-stop-id'))).toEqual([
      'S-101',
      'S-102',
      'S-103',
      'S-104',
      'U-001',
    ]);
    expect(rows.at(-1)).toHaveAttribute('data-stop-seq', '5');
  });

  it('opens transfer picker from a routed stop and excludes the current route', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('route-row-R-01'));
    await user.click(screen.getByTestId('stop-row-S-101'));
    await user.click(screen.getByTestId('start-area-transfer'));

    expect(screen.getByTestId('area-transfer-picker')).toBeInTheDocument();
    expect(screen.queryByTestId('transfer-dest-route-R-01')).not.toBeInTheDocument();
    expect(screen.getByTestId('transfer-dest-route-R-02')).toBeInTheDocument();
    expect(screen.getByTestId('transfer-dest-route-R-03')).toBeInTheDocument();
    expect(screen.getByTestId('transfer-dest-unassigned')).toBeInTheDocument();
  });

  it('transfers a routed stop to another route', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    const r01Before = Number(screen.getByTestId('route-r01-stop-count').textContent);

    await user.click(screen.getByTestId('route-row-R-01'));
    await user.click(screen.getByTestId('stop-row-S-101'));
    await user.click(screen.getByTestId('start-area-transfer'));
    await user.click(screen.getByTestId('transfer-dest-route-R-02'));
    await user.click(screen.getByTestId('confirm-area-transfer'));

    await waitFor(() => {
      expect(screen.queryByTestId('area-transfer-picker')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('route-r01-stop-count')).toHaveTextContent(String(r01Before - 1));
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-marker-kind', 'routed');
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-route-id', 'R-02');
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('route-area-R-02')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-has-polygon', 'true');
    expect(screen.getByTestId('route-area-R-02')).toHaveAttribute('data-has-polygon', 'true');

    await user.click(screen.getByRole('button', { name: /محدوده ۲/ }));
    const list = screen.getByTestId('route-stop-list');
    const rows = within(list).getAllByTestId(/stop-row-/);
    expect(rows.map((row) => row.getAttribute('data-stop-id'))).toEqual([
      'S-201',
      'S-202',
      'S-203',
      'S-101',
    ]);
    expect(rows.at(-1)).toHaveAttribute('data-stop-seq', '4');
  });

  it('returns a routed stop to unassigned', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    const unassignedBefore = Number(screen.getByTestId('unassigned-stop-count').textContent);
    const r01Before = Number(screen.getByTestId('route-r01-stop-count').textContent);

    await user.click(screen.getByTestId('route-row-R-01'));
    await user.click(screen.getByTestId('stop-row-S-104'));
    await user.click(screen.getByTestId('start-area-transfer'));
    await user.click(screen.getByTestId('transfer-dest-unassigned'));
    await user.click(screen.getByTestId('confirm-area-transfer'));

    await waitFor(() => {
      expect(screen.queryByTestId('area-transfer-picker')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('unassigned-stop-count')).toHaveTextContent(
      String(unassignedBefore + 1),
    );
    expect(screen.getByTestId('route-r01-stop-count')).toHaveTextContent(String(r01Before - 1));
    expect(screen.getByTestId('map-stop-S-104')).toHaveAttribute('data-marker-kind', 'unassigned');
    expect(screen.getByTestId('map-stop-S-104')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('unassigned-row-S-104')).toBeInTheDocument();
    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-has-polygon', 'true');
  });

  it('shows fixture planState labels on route rows', () => {
    render(<PanelHarness />);
    expect(
      within(screen.getByTestId('route-row-R-01')).getByText(PLANNING_ROUTE_STATE_LABEL.assigned),
    ).toBeInTheDocument();
  });

  it('keeps demo plan fixtures independent and plan-scoped', () => {
    const a = createPlanningFixture('P-2404');
    const b = createPlanningFixture('P-2403', { planName: 'برنامه تحویل — ۷ مرداد — ۱۲ تا ۱۵' });
    expect(a.planId).toBe('P-2404');
    expect(b.planId).toBe('P-2403');
    expect(b.planName).toContain('۷ مرداد');
    expect(a).not.toBe(b);
    expect(a.routes).not.toBe(b.routes);
    a.unassignedStops.pop();
    expect(b.unassignedStops).toHaveLength(2);
    expect(getPlanningFixture('P-2403').planId).toBe('P-2403');
    expect(PLANNING_PLAN_FIXTURE.planId).toBe(PLANNING_FIXTURE_PLAN_ID);
    expect(buildRouteAreas(PLANNING_PLAN_FIXTURE.routes)).toHaveLength(3);
  });

  it('renders Planning workspace for an execution-stage demo plan', async () => {
    renderPlanningPage('P-2403');
    expect(await screen.findByTestId('planning-map')).toBeInTheDocument();
    expect(screen.getByTestId('generation-panel')).toBeInTheDocument();
    expect(
      screen.queryByText('داده‌های برنامه‌ریزی برای این برنامه موجود نیست.'),
    ).not.toBeInTheDocument();
  });

  it('blocks Intake → Planning skip-ahead for an ineligible draft plan', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/plans/P-2407/intake'],
    });
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    render(
      <AppProviders plansPort={port}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    await screen.findByRole('link', { name: /داده‌های برنامه/ });
    await user.click(screen.getByRole('link', { name: /برنامه‌ریزی و تخصیص/ }));
    expect(router.state.location.pathname).toBe('/plans/P-2407/planning');
  });
});

describe('distribution area generation', () => {
  it('shows pre-generation header, target count, CTA, and no route polygons', () => {
    render(
      <PlanningWorkspace
        initialFixture={cloneFixture()}
        generationTiming={FAST_GENERATION_TIMING}
      />,
    );

    expect(screen.getByTestId('planning-body')).toHaveAttribute('data-generation-phase', 'ready');
    expect(screen.getByTestId('target-area-count')).toHaveValue(3);
    expect(screen.getByTestId('start-generation')).toHaveTextContent('ساخت محدوده‌های توزیع');
    expect(screen.getByTestId('generation-ready')).toBeInTheDocument();
    expect(screen.queryByTestId('route-area-R-01')).not.toBeInTheDocument();
    expect(screen.getByTestId('planning-map')).toHaveAttribute('data-areas-generated', 'false');
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-marker-kind', 'neutral');
  });

  it('updates editable target area count before generation', () => {
    render(
      <PlanningWorkspace
        initialFixture={cloneFixture()}
        generationTiming={FAST_GENERATION_TIMING}
      />,
    );

    const input = screen.getByTestId('target-area-count');
    fireEvent.change(input, { target: { value: '5' } });
    expect(input).toHaveValue(5);
  });

  it('transitions submitting → generating → generated and reveals polygons', async () => {
    const user = userEvent.setup();
    render(
      <PlanningWorkspace
        initialFixture={cloneFixture()}
        generationTiming={FAST_GENERATION_TIMING}
      />,
    );

    await user.click(screen.getByTestId('start-generation'));
    expect(screen.getByTestId('planning-body')).toHaveAttribute(
      'data-generation-phase',
      'submitting',
    );
    expect(screen.getByTestId('generation-progress')).toBeInTheDocument();
    expect(screen.getByTestId('generation-busy-pill')).toBeInTheDocument();
    expect(screen.queryByTestId('start-generation')).not.toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByTestId('planning-body')).toHaveAttribute(
        'data-generation-phase',
        'generating',
      ),
    );

    await waitFor(() =>
      expect(screen.getByTestId('planning-body')).toHaveAttribute(
        'data-generation-phase',
        'generated',
      ),
    );
    expect(screen.getByLabelText('پانل محدوده‌ها')).toBeInTheDocument();
    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-has-polygon', 'true');
    expect(screen.getByTestId('planning-map')).toHaveAttribute('data-areas-generated', 'true');
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-marker-kind', 'routed');
  });

  it('prevents duplicate generation while busy', async () => {
    const user = userEvent.setup();
    render(
      <PlanningWorkspace
        initialFixture={cloneFixture()}
        generationTiming={FAST_GENERATION_TIMING}
      />,
    );

    await user.click(screen.getByTestId('start-generation'));
    expect(screen.queryByTestId('start-generation')).not.toBeInTheDocument();
    expect(screen.getByTestId('planning-body')).toHaveAttribute(
      'data-generation-phase',
      'submitting',
    );
    // CTA removed while busy — no second submission path.
    expect(screen.queryByTestId('start-generation-retry')).not.toBeInTheDocument();
  });
});

describe('distribution area generation retry', () => {
  it('retries after failure and preserves target area count', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [fail, setFail] = useState(true);
      return (
        <div>
          <button type="button" data-testid="allow-success" onClick={() => setFail(false)}>
            allow
          </button>
          <PlanningWorkspace
            initialFixture={cloneFixture()}
            simulateGenerationFail={fail}
            generationTiming={FAST_GENERATION_TIMING}
          />
        </div>
      );
    }

    render(<Harness />);
    fireEvent.change(screen.getByTestId('target-area-count'), { target: { value: '4' } });
    expect(screen.getByTestId('target-area-count')).toHaveValue(4);

    await user.click(screen.getByTestId('start-generation'));
    await waitFor(() => expect(screen.getByTestId('generation-failed')).toBeInTheDocument());
    expect(screen.getByTestId('target-area-count')).toHaveValue(4);
    expect(screen.queryByTestId('route-area-R-01')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('allow-success'));
    await user.click(screen.getByTestId('generation-retry'));
    expect(screen.getByTestId('planning-body')).toHaveAttribute(
      'data-generation-phase',
      'submitting',
    );
    await waitFor(() =>
      expect(screen.getByTestId('planning-body')).toHaveAttribute(
        'data-generation-phase',
        'generated',
      ),
    );
    expect(screen.getByTestId('route-area-R-01')).toBeInTheDocument();
  });
});

describe('assignStopToRoute mutation', () => {
  it('moves the stop to the end of the target route and updates counts', () => {
    const next = assignStopToRoute(cloneFixture(), 'U-001', 'R-02');
    expect(next).not.toBeNull();
    expect(next!.unassignedStops.some((stop) => stop.stopId === 'U-001')).toBe(false);
    const route = next!.routes.find((item) => item.routeId === 'R-02')!;
    expect(route.stops.at(-1)?.stopId).toBe('U-001');
    expect(route.stops.at(-1)?.seq).toBe(4);
    expect(route.stops).toHaveLength(4);
  });

  it('returns null for unknown stop or route', () => {
    expect(assignStopToRoute(cloneFixture(), 'missing', 'R-01')).toBeNull();
    expect(assignStopToRoute(cloneFixture(), 'U-001', 'missing')).toBeNull();
  });
});

describe('stop transfer mutations', () => {
  it('moveStopToRoute appends to destination and reindexes source', () => {
    const next = moveStopToRoute(cloneFixture(), 'S-101', 'R-02');
    expect(next).not.toBeNull();
    const source = next!.routes.find((item) => item.routeId === 'R-01')!;
    const dest = next!.routes.find((item) => item.routeId === 'R-02')!;
    expect(source.stops.map((stop) => stop.stopId)).toEqual(['S-102', 'S-103', 'S-104']);
    expect(source.stops.map((stop) => stop.seq)).toEqual([1, 2, 3]);
    expect(dest.stops.at(-1)?.stopId).toBe('S-101');
    expect(dest.stops.at(-1)?.seq).toBe(4);
    expect(dest.stops.at(-1)?.tasks).toHaveLength(1);
  });

  it('moveStopToRoute rejects same-route and unknown ids', () => {
    expect(moveStopToRoute(cloneFixture(), 'S-101', 'R-01')).toBeNull();
    expect(moveStopToRoute(cloneFixture(), 'missing', 'R-02')).toBeNull();
    expect(moveStopToRoute(cloneFixture(), 'S-101', 'missing')).toBeNull();
  });

  it('removeStopFromRoute moves the stop to unassigned and reindexes', () => {
    const next = removeStopFromRoute(cloneFixture(), 'S-102');
    expect(next).not.toBeNull();
    const source = next!.routes.find((item) => item.routeId === 'R-01')!;
    expect(source.stops.map((stop) => stop.stopId)).toEqual(['S-101', 'S-103', 'S-104']);
    expect(source.stops.map((stop) => stop.seq)).toEqual([1, 2, 3]);
    const unassigned = next!.unassignedStops.find((stop) => stop.stopId === 'S-102');
    expect(unassigned?.seq).toBe(0);
    expect(unassigned?.tasks).toHaveLength(2);
  });

  it('moveOrderToRoute splits one order and keeps remaining tasks on source', () => {
    const result = moveOrderToRoute(cloneFixture(), '10123457', 'R-02');
    expect(result).not.toBeNull();
    const source = result!.fixture.routes.find((route) => route.routeId === 'R-01')!;
    const dest = result!.fixture.routes.find((route) => route.routeId === 'R-02')!;
    const sourceStop = source.stops.find((stop) => stop.stopId === 'S-102');
    expect(sourceStop?.tasks.map((task) => task.orderId)).toEqual(['10123458']);
    const destStop = dest.stops.find((stop) => stop.stopId === result!.destinationStopId);
    expect(destStop?.tasks.map((task) => task.orderId)).toEqual(['10123457']);
    expect(destStop?.lat).toBe(35.74);
    expect(dest.stops).toHaveLength(4);
  });

  it('moveOrderToRoute removes source stop when last order moves and merges same location', () => {
    const first = moveOrderToRoute(cloneFixture(), '10123457', 'R-03')!;
    const second = moveOrderToRoute(first.fixture, '10123458', 'R-03')!;
    const source = second.fixture.routes.find((route) => route.routeId === 'R-01')!;
    expect(source.stops.some((stop) => stop.stopId === 'S-102')).toBe(false);
    const dest = second.fixture.routes.find((route) => route.routeId === 'R-03')!;
    const merged = dest.stops.find((stop) => stop.stopId === first.destinationStopId);
    expect(merged?.tasks.map((task) => task.orderId)).toEqual(['10123457', '10123458']);
    expect(second.destinationStopId).toBe(first.destinationStopId);
  });
});

describe('order-level transfer UI', () => {
  it('shows whole-point vs single-order choice from a multi-order stop', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('route-row-R-01'));
    await user.click(screen.getByTestId('stop-row-S-102'));
    await user.click(screen.getByTestId('order-row-10123457'));
    expect(screen.getByTestId('order-detail')).toBeInTheDocument();
    await user.click(screen.getByTestId('start-order-transfer'));
    expect(screen.getByTestId('transfer-scope-picker')).toBeInTheDocument();
    expect(screen.getByTestId('transfer-scope-stop')).toHaveTextContent('انتقال کل نقطه تحویل');
    expect(screen.getByTestId('transfer-scope-order')).toHaveTextContent('انتقال فقط این سفارش');

    await user.click(screen.getByTestId('transfer-scope-order'));
    expect(screen.getByTestId('area-transfer-picker')).toBeInTheDocument();
    expect(screen.queryByTestId('transfer-dest-route-R-01')).not.toBeInTheDocument();
    expect(screen.queryByTestId('transfer-dest-unassigned')).not.toBeInTheDocument();
    expect(screen.getByText('انتقال فقط سفارش #10123457')).toBeInTheDocument();
  });

  it('transfers only one order and updates markers/selection', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('map-stop-S-102'));
    expect(screen.getByTestId('map-stop-S-102')).toBeInTheDocument();
    await user.click(screen.getByTestId('order-row-10123457'));
    await user.click(screen.getByTestId('start-order-transfer'));
    await user.click(screen.getByTestId('transfer-scope-order'));
    await user.click(screen.getByTestId('transfer-dest-route-R-02'));
    await user.click(screen.getByTestId('confirm-area-transfer'));

    await waitFor(() => expect(screen.queryByTestId('area-transfer-picker')).not.toBeInTheDocument());
    expect(screen.getByTestId('order-detail')).toBeInTheDocument();
    expect(screen.getByTestId('map-stop-S-102')).toBeInTheDocument();
    expect(screen.getByTestId('map-stop-S-102-10123457-xfer')).toHaveAttribute(
      'data-route-id',
      'R-02',
    );
    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-has-polygon', 'true');
    expect(screen.getByTestId('route-area-R-02')).toHaveAttribute('data-has-polygon', 'true');
    expect(screen.getByTestId('route-area-R-02')).toHaveAttribute('data-selected', 'true');
  });
});

describe('driver assignment mutations', () => {
  it('assigns a free driver and rejects drivers already on another area', () => {
    const assigned = assignDriverToRoute(cloneFixture(), 'R-03', {
      driverId: 'D-052',
      driverName: 'نادر عبادی',
    });
    expect(assigned).not.toBeNull();
    expect(assigned!.routes.find((route) => route.routeId === 'R-03')).toMatchObject({
      driverId: 'D-052',
      driverName: 'نادر عبادی',
      planState: 'assigned',
    });
    expect(countRoutesWithoutDriver(assigned!.routes)).toBe(0);

    expect(
      assignDriverToRoute(cloneFixture(), 'R-03', {
        driverId: 'D-041',
        driverName: 'کاوه میرزایی',
      }),
    ).toBeNull();
  });

  it('changes and removes a driver assignment, clearing lock on remove', () => {
    const locked = setDriverAssignmentLocked(cloneFixture(), 'R-01', true)!;
    expect(locked.routes.find((route) => route.routeId === 'R-01')?.driverAssignmentLocked).toBe(
      true,
    );

    const changed = assignDriverToRoute(locked, 'R-01', {
      driverId: 'D-001',
      driverName: 'محمد قاسمی',
    })!;
    expect(changed.routes.find((route) => route.routeId === 'R-01')).toMatchObject({
      driverId: 'D-001',
      driverName: 'محمد قاسمی',
      driverAssignmentLocked: true,
    });

    const removed = removeDriverFromRoute(changed, 'R-01')!;
    expect(removed.routes.find((route) => route.routeId === 'R-01')).toMatchObject({
      driverId: null,
      driverName: null,
      driverAssignmentLocked: false,
      planState: 'draft',
    });
  });

  it('cannot lock a route without a driver', () => {
    expect(setDriverAssignmentLocked(cloneFixture(), 'R-03', true)).toBeNull();
  });
});

describe('driver assignment UI', () => {
  it('opens assign flow, confirms, and updates route presentation', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('route-row-R-03'));
    expect(screen.getByTestId('assign-driver')).toBeInTheDocument();
    expect(screen.queryByTestId('toggle-driver-lock')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('assign-driver'));
    expect(screen.getByTestId('driver-picker')).toBeInTheDocument();
    expect(screen.getByTestId('driver-option-D-041')).toHaveAttribute('data-driver-status', 'assigned');
    expect(screen.getByTestId('driver-option-D-041')).toBeDisabled();
    expect(screen.getByTestId('driver-option-D-052')).toHaveAttribute(
      'data-driver-status',
      'available',
    );

    await user.click(screen.getByTestId('driver-option-D-052'));
    expect(screen.getByTestId('driver-confirm')).toHaveAttribute('data-flow', 'assign');
    await user.click(screen.getByTestId('driver-confirm-cancel'));
    expect(screen.getByTestId('driver-picker')).toBeInTheDocument();
    expect(screen.getByTestId('route-area-R-03')).toHaveAttribute('data-selected', 'true');

    await user.click(screen.getByTestId('driver-option-D-052'));
    await user.click(screen.getByTestId('driver-confirm-submit'));
    await waitFor(() => expect(screen.getByTestId('route-driver-name')).toHaveTextContent('نادر عبادی'));
    expect(screen.getByTestId('driver-just-assigned')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-driver-lock')).toHaveAttribute('data-locked', 'false');
    expect(screen.getByTestId('route-area-R-03')).toHaveAttribute('data-selected', 'true');
  });

  it('changes and removes a driver with confirmation cancel preserving assignment', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('route-row-R-01'));
    expect(screen.getByTestId('route-driver-name')).toHaveTextContent('کاوه میرزایی');

    await user.click(screen.getByTestId('change-driver'));
    expect(screen.getByTestId('driver-option-D-041')).toHaveAttribute('data-driver-status', 'current');
    await user.click(screen.getByTestId('driver-option-D-001'));
    expect(screen.getByTestId('driver-confirm')).toHaveAttribute('data-flow', 'change');
    await user.click(screen.getByTestId('driver-confirm-submit'));
    await waitFor(() => expect(screen.getByTestId('route-driver-name')).toHaveTextContent('محمد قاسمی'));

    await user.click(screen.getByTestId('remove-driver'));
    expect(screen.getByTestId('remove-driver-confirm')).toBeInTheDocument();
    await user.click(screen.getByTestId('remove-driver-cancel'));
    expect(screen.getByTestId('route-driver-name')).toHaveTextContent('محمد قاسمی');

    await user.click(screen.getByTestId('remove-driver'));
    await user.click(screen.getByTestId('remove-driver-submit'));
    await waitFor(() => expect(screen.getByTestId('assign-driver')).toBeInTheDocument());
    expect(screen.queryByTestId('route-driver-name')).not.toBeInTheDocument();
    expect(screen.queryByTestId('toggle-driver-lock')).not.toBeInTheDocument();
  });

  it('locks and unlocks an assigned driver', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('route-row-R-01'));
    const lock = screen.getByTestId('toggle-driver-lock');
    expect(lock).toHaveAttribute('data-locked', 'false');
    await user.click(lock);
    expect(screen.getByTestId('toggle-driver-lock')).toHaveAttribute('data-locked', 'true');
    await user.click(screen.getByTestId('toggle-driver-lock'));
    expect(screen.getByTestId('toggle-driver-lock')).toHaveAttribute('data-locked', 'false');
    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-selected', 'true');
  });
});

describe('updateStopLocation mutation', () => {
  it('updates routed stop coordinates without changing ownership or tasks', () => {
    const before = cloneFixture();
    const stop = before.routes[0]!.stops[0]!;
    const taskIds = stop.tasks.map((task) => task.orderId);
    const next = updateStopLocation(before, stop.stopId, { lat: 35.751, lng: 51.401 })!;

    const updated = next.routes[0]!.stops[0]!;
    expect(updated).toMatchObject({
      stopId: stop.stopId,
      seq: stop.seq,
      lat: 35.751,
      lng: 51.401,
    });
    expect(updated.tasks.map((task) => task.orderId)).toEqual(taskIds);
    expect(next.routes[0]!.driverId).toBe(before.routes[0]!.driverId);
    expect(next.routes[0]!.stops).toHaveLength(before.routes[0]!.stops.length);
    expect(next.unassignedStops).toHaveLength(before.unassignedStops.length);
  });

  it('rejects invalid coordinates', () => {
    expect(isValidPlanningLatLng({ lat: 91, lng: 0 })).toBe(false);
    expect(updateStopLocation(cloneFixture(), 'S-101', { lat: 91, lng: 51 })).toBeNull();
  });

  it('can update unassigned stop coordinates in the fixture helper', () => {
    const before = cloneFixture();
    const stopId = before.unassignedStops[0]!.stopId;
    const next = updateStopLocation(before, stopId, { lat: 35.7, lng: 51.4 })!;
    expect(next.unassignedStops.find((stop) => stop.stopId === stopId)).toMatchObject({
      lat: 35.7,
      lng: 51.4,
    });
    expect(next.routes).toEqual(before.routes);
  });
});

describe('location correction UI', () => {
  it('enters correction mode for a routed stop with saved coords and disabled save', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('map-stop-S-101'));
    await user.click(screen.getByTestId('start-location-correction'));

    expect(screen.getByTestId('location-correction-panel')).toBeInTheDocument();
    expect(screen.getByTestId('planning-map')).toHaveAttribute('data-correction-mode', 'true');
    expect(screen.getByTestId('correction-banner')).toHaveTextContent(
      'اصلاح موقعیت — روی نقشه کلیک کنید',
    );
    expect(screen.getByTestId('correction-saved-marker')).toHaveAttribute('data-lat', '35.747');
    expect(screen.getByTestId('correction-saved-coords')).toHaveTextContent('35.74700, 51.36200');
    expect(screen.getByTestId('correction-save')).toBeDisabled();
    expect(screen.queryByTestId('correction-proposed-marker')).not.toBeInTheDocument();
  });

  it('sets proposed coordinates from map click and renders proposed marker', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('map-stop-S-101'));
    await user.click(screen.getByTestId('start-location-correction'));
    await user.click(screen.getByTestId('correction-map-click'));

    expect(screen.getByTestId('correction-proposed-marker')).toHaveAttribute('data-lat', '35.751');
    expect(screen.getByTestId('correction-proposed-coords')).toHaveTextContent('35.75100, 51.40100');
    expect(screen.getByTestId('correction-save')).not.toBeDisabled();
  });

  it('cancels and discards the proposed location', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('map-stop-S-101'));
    await user.click(screen.getByTestId('start-location-correction'));
    await user.click(screen.getByTestId('correction-map-click'));
    await user.click(screen.getByTestId('correction-cancel'));

    expect(screen.queryByTestId('location-correction-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('planning-map')).toHaveAttribute('data-correction-mode', 'false');
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-lat', '35.747');
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-selected', 'true');
  });

  it('saves corrected coordinates, recomputes the route polygon, and keeps ownership', async () => {
    const user = userEvent.setup();
    const beforeAreas = buildRouteAreas(cloneFixture().routes);
    const beforeR01Positions = beforeAreas.find((entry) => entry.routeId === 'R-01')?.area?.positions ?? [];
    render(<WorkspaceHarness />);

    const beforeR02 = screen.getByTestId('route-area-R-02').getAttribute('data-point-count');
    const beforeStopCount = screen.getByTestId('route-r01-stop-count').textContent;
    const beforeUnassigned = screen.getByTestId('unassigned-stop-count').textContent;

    await user.click(screen.getByTestId('map-stop-S-101'));
    await user.click(screen.getByTestId('start-location-correction'));
    await user.click(screen.getByTestId('correction-map-click'));
    await user.click(screen.getByTestId('correction-save'));

    await waitFor(() =>
      expect(screen.queryByTestId('location-correction-panel')).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-lat', '35.751');
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-lng', '51.401');
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-route-id', 'R-01');
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('route-r01-stop-count').textContent).toBe(beforeStopCount);
    expect(screen.getByTestId('unassigned-stop-count').textContent).toBe(beforeUnassigned);
    expect(screen.getByTestId('route-area-R-02')).toHaveAttribute('data-point-count', beforeR02!);

    const afterFixture = updateStopLocation(cloneFixture(), 'S-101', { lat: 35.751, lng: 51.401 })!;
    const afterAreas = buildRouteAreas(afterFixture.routes);
    const afterR01 = afterAreas.find((entry) => entry.routeId === 'R-01');
    expect(afterR01?.area?.positions).not.toEqual(beforeR01Positions);
    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute(
      'data-point-count',
      String(afterR01?.area?.positions.length ?? 0),
    );
    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-has-polygon', 'true');
  });

  it('suppresses normal map selection while correcting and restores it after exit', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('map-stop-S-101'));
    await user.click(screen.getByTestId('start-location-correction'));
    await user.click(screen.getByTestId('map-stop-S-201'));
    expect(screen.getByTestId('location-correction-panel')).toBeInTheDocument();
    expect(screen.getByTestId('planning-map')).toHaveAttribute('data-correction-mode', 'true');

    await user.click(screen.getByTestId('correction-cancel'));
    await user.click(screen.getByTestId('map-stop-S-201'));
    expect(screen.getByTestId('map-stop-S-201')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('route-area-R-02')).toHaveAttribute('data-selected', 'true');
  });

  it('does not expose location correction for unassigned stops', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    const unassignedId = PLANNING_PLAN_FIXTURE.unassignedStops[0]!.stopId;
    await user.click(screen.getByTestId(`map-stop-${unassignedId}`));
    expect(screen.queryByTestId('start-location-correction')).not.toBeInTheDocument();
  });

  it('prevents double-submit while save is pending', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('map-stop-S-101'));
    await user.click(screen.getByTestId('start-location-correction'));
    await user.click(screen.getByTestId('correction-map-click'));

    const save = screen.getByTestId('correction-save');
    await user.click(save);
    expect(save).toBeDisabled();
    fireEvent.click(save);
    fireEvent.click(save);

    await waitFor(() =>
      expect(screen.queryByTestId('location-correction-panel')).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-lat', '35.751');
  });
});

describe('unassigned order exclusion', () => {
  it('excludes all orders on an unassigned stop and updates remaining readiness count', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    expect(screen.getByTestId('summary-remaining-unassigned')).toBeInTheDocument();
    expect(screen.getByTestId('unassigned-queue-remaining')).toBeInTheDocument();

    await user.click(screen.getByTestId('exclude-unassigned-U-001'));

    expect(screen.getByTestId('unassigned-row-U-001')).toHaveAttribute('data-excluded', 'true');
    expect(screen.getByTestId('unassigned-excluded-U-001')).toHaveTextContent('مستثنا شد');
    expect(screen.queryByTestId('assign-unassigned-U-001')).not.toBeInTheDocument();
    expect(screen.queryByTestId('exclude-unassigned-U-001')).not.toBeInTheDocument();
    expect(PLANNING_PLAN_FIXTURE.unassignedStops.some((stop) => stop.stopId === 'U-001')).toBe(
      true,
    );
    expect(screen.getByTestId('map-stop-U-001')).toBeInTheDocument();
  });

  it('keeps a multi-order stop actionable when only one order is excluded', async () => {
    const user = userEvent.setup();
    function ExclusionHarness() {
      const planning = usePlanningSelection(PLANNING_PLAN_FIXTURE);
      const remaining = countRemainingUnassignedOrders(
        PLANNING_PLAN_FIXTURE,
        planning.excludedOrderIds,
      );
      const u002Excluded = isUnassignedStopFullyExcluded(
        PLANNING_PLAN_FIXTURE.unassignedStops[1]!,
        planning.excludedOrderIds,
      );
      return (
        <div>
          <button
            type="button"
            data-testid="exclude-one-order"
            onClick={() => planning.excludeOrder('10129102')}
          >
            exclude-one
          </button>
          <div data-testid="remaining">{remaining}</div>
          <div data-testid="u002-excluded">{String(u002Excluded)}</div>
          <div data-testid="has-10129102">
            {String(planning.excludedOrderIds.has('10129102'))}
          </div>
        </div>
      );
    }

    render(<ExclusionHarness />);
    await user.click(screen.getByTestId('exclude-one-order'));
    expect(screen.getByTestId('has-10129102')).toHaveTextContent('true');
    expect(screen.getByTestId('u002-excluded')).toHaveTextContent('false');
    expect(screen.getByTestId('remaining')).toHaveTextContent('2');
  });

  it('blocks assignment for a fully excluded unassigned stop', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('exclude-unassigned-U-001'));
    expect(screen.queryByTestId('assign-unassigned-U-001')).not.toBeInTheDocument();
    expect(
      assignStopToRoute(cloneFixture(), 'U-001', 'R-01', new Set(['10129001'])),
    ).toBeNull();
  });

  it('excludes every order on a multi-order stop via the queue action', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('exclude-unassigned-U-002'));
    expect(screen.getByTestId('unassigned-row-U-002')).toHaveAttribute('data-excluded', 'true');
    expect(screen.queryByTestId('assign-unassigned-U-002')).not.toBeInTheDocument();
    expect(screen.getByTestId('unassigned-queue-remaining')).toHaveTextContent('۱ از ۳');
    expect(screen.getByTestId('summary-remaining-unassigned')).toHaveTextContent('۱ بدون محدوده');

    await user.click(screen.getByTestId('exclude-unassigned-U-001'));
    expect(screen.getByTestId('unassigned-queue-remaining')).toHaveTextContent('همه تعیین‌تکلیف');
    expect(screen.queryByTestId('summary-remaining-unassigned')).not.toBeInTheDocument();
  });
});

describe('exclude-order helpers', () => {
  it('tracks remaining unassigned for readiness without deleting fixture orders', () => {
    const excluded = new Set(['10129001', '10129102']);
    expect(countRemainingUnassignedOrders(PLANNING_PLAN_FIXTURE, excluded)).toBe(1);
    expect(isOrderExcluded(excluded, '10129001')).toBe(true);
    expect(
      isUnassignedStopFullyExcluded(PLANNING_PLAN_FIXTURE.unassignedStops[0]!, excluded),
    ).toBe(true);
    expect(
      isUnassignedStopFullyExcluded(PLANNING_PLAN_FIXTURE.unassignedStops[1]!, excluded),
    ).toBe(false);
    expect(PLANNING_PLAN_FIXTURE.unassignedStops).toHaveLength(2);
  });
});

describe('map deselection and route-area toggle', () => {
  it('clears selection when empty map space is clicked', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('route-row-R-02'));
    expect(screen.getByTestId('route-area-R-02')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('map-stop-S-201')).toHaveAttribute('data-route-active', 'true');

    await user.click(screen.getByTestId('empty-map-click'));
    expect(screen.queryByTestId('route-driver-name')).not.toBeInTheDocument();
    expect(screen.getByTestId('route-area-R-02')).toHaveAttribute('data-selected', 'false');
    expect(screen.getByTestId('map-stop-S-201')).toHaveAttribute('data-route-active', 'false');
    expect(screen.getByTestId('route-row-R-02')).toBeInTheDocument();
  });

  it('does not immediately deselect when a marker or polygon is clicked', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('map-stop-S-101'));
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-selected', 'true');

    await user.click(screen.getByTestId('route-area-R-02'));
    expect(screen.getByTestId('route-area-R-02')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('map-stop-S-201')).toHaveAttribute('data-route-active', 'true');
  });

  it('proposes a correction location instead of clearing selection in correction mode', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('map-stop-S-101'));
    await user.click(screen.getByTestId('start-location-correction'));
    expect(screen.queryByTestId('empty-map-click')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('correction-map-click'));
    expect(screen.getByTestId('location-correction-panel')).toBeInTheDocument();
    expect(screen.getByTestId('correction-proposed-marker')).toBeInTheDocument();
  });

  it('toggles polygon visibility while keeping markers and selection', async () => {
    const user = userEvent.setup();
    render(<WorkspaceHarness />);

    await user.click(screen.getByTestId('route-row-R-02'));
    expect(screen.getByTestId('route-area-R-02')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-route-areas')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('fit-selected-source')).toHaveTextContent('polygon');

    await user.click(screen.getByTestId('toggle-route-areas'));
    expect(screen.getByTestId('planning-map')).toHaveAttribute('data-show-route-areas', 'false');
    expect(screen.getByTestId('toggle-route-areas')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('toggle-route-areas')).toHaveAttribute(
      'aria-label',
      'نمایش محدوده‌ها',
    );
    expect(screen.queryByTestId('route-area-R-02')).not.toBeInTheDocument();
    expect(screen.getByTestId('map-stop-S-201')).toHaveAttribute('data-route-active', 'true');
    expect(screen.getByTestId('map-stop-S-101')).toHaveAttribute('data-ambient', 'true');
    expect(screen.getByTestId('route-driver-name')).toBeInTheDocument();
    expect(screen.getByTestId('fit-selected-route')).not.toBeDisabled();
    expect(screen.getByTestId('fit-selected-source')).toHaveTextContent('polygon');

    await user.click(screen.getByTestId('toggle-route-areas'));
    expect(screen.getByTestId('route-area-R-02')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('route-area-R-01')).toHaveAttribute('data-ambient', 'true');
    expect(screen.getByTestId('toggle-route-areas')).toHaveAttribute('aria-pressed', 'true');
  });
});
