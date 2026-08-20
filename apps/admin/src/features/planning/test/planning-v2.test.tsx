import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRoutes } from '@/app/router';
import { PlanningWorkspace } from '@/features/planning/components/PlanningWorkspace';
import { lookupDispatchOrder } from '@/features/planning/fixture/dispatch-lookup';
import { assignDriverToRoute } from '@/features/planning/fixture/assign-driver';
import { moveOrderToRoute, moveStopToRoute } from '@/features/planning/fixture/transfer-stop';
import { updateStopLocation } from '@/features/planning/fixture/update-stop-location';
import {
  createPlanningFixture,
  PLANNING_PLAN_FIXTURE,
} from '@/features/planning/fixture/planning-fixture';
import { deriveRouteArea } from '@/features/planning/map/route-area';
import {
  areaAndRouteIdentitiesAreDistinct,
  evaluatePublishReadiness,
} from '@/features/planning/planning-model';
import { recalculateRoutes } from '@/features/planning/fixture/generate-areas';
import { PLANNING_DRIVERS } from '@/features/planning/fixture/drivers';
import {
  createPlansFixturePort,
  PlanningPublishBlockedError,
} from '@/features/plans/fixture/plans-fixture';

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
    onCorrectionMapClick,
    onClearMapSelection,
    onSelectRoute,
    onSelectStop,
  }: {
    onCorrectionMapClick?: (coords: { lat: number; lng: number }) => void;
    onClearMapSelection?: () => void;
    onSelectRoute?: (areaId: string) => void;
    onSelectStop?: (stopId: string) => void;
  }) => (
    <div data-testid="planning-map">
      <button type="button" data-testid="map-select-A-01" onClick={() => onSelectRoute?.('A-01')}>
        select A-01
      </button>
      <button type="button" data-testid="map-select-S-101" onClick={() => onSelectStop?.('S-101')}>
        select S-101
      </button>
      <button type="button" data-testid="map-clear-selection" onClick={onClearMapSelection}>
        clear selection
      </button>
      <button
        type="button"
        data-testid="correction-map-click"
        onClick={() => onCorrectionMapClick?.({ lat: 35.751, lng: 51.401 })}
      >
        correction-map-click
      </button>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
});

function renderPlan(
  planId: string,
  port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 }),
) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [`/plans/${planId}/planning`],
  });
  return {
    port,
    router,
    ...render(
      <AppProviders plansPort={port}>
        <RouterProvider router={router} />
      </AppProviders>,
    ),
  };
}

async function makePublishable(port: ReturnType<typeof createPlansFixturePort>, planId: string) {
  await port.generatePlanningAreas(planId, 3);
  const fixture = await port.getPlanningState(planId);
  const areaWithoutDriver = fixture.areas.find((area) => !area.driverId || !area.driverName);
  if (areaWithoutDriver) {
    await port.assignPlanningDriver(
      planId,
      areaWithoutDriver.areaId,
      PLANNING_DRIVERS.find((driver) => driver.driverId === 'D-052') ?? PLANNING_DRIVERS[0]!,
    );
  }
  for (const stop of fixture.unassignedStops) {
    await port.assignPlanningStop(planId, stop.stopId, fixture.areas[0]!.areaId);
  }
  await port.recalculatePlanningRoutes(planId);
  expect(port.getPlanningPublishReadiness(planId).canPublish).toBe(true);
}

async function prepareWithUnassignedOrders(
  port: ReturnType<typeof createPlansFixturePort>,
  planId: string,
) {
  await port.generatePlanningAreas(planId, 3);
  const fixture = await port.getPlanningState(planId);
  const areaWithoutDriver = fixture.areas.find((area) => !area.driverId || !area.driverName);
  if (areaWithoutDriver) {
    await port.assignPlanningDriver(
      planId,
      areaWithoutDriver.areaId,
      PLANNING_DRIVERS.find((driver) => driver.driverId === 'D-052') ?? PLANNING_DRIVERS[0]!,
    );
  }
  await port.recalculatePlanningRoutes(planId);
  return fixture.unassignedStops.map((stop) => stop.stopId);
}

describe('A03 domain separation', () => {
  it('keeps Area identity distinct from Route identity', () => {
    expect(areaAndRouteIdentitiesAreDistinct(PLANNING_PLAN_FIXTURE)).toBe(true);
    const area = PLANNING_PLAN_FIXTURE.areas[0]!;
    const route = PLANNING_PLAN_FIXTURE.routes.find((item) => item.areaId === area.areaId)!;
    expect(area.areaId).toBe('A-01');
    expect(route.routeId).toBe('RT-01');
    expect(area.areaId).not.toBe(route.routeId);
    expect(area.memberStopIds).toEqual(area.stops.map((stop) => stop.stopId));
    expect(route.orderedStopIds).toEqual(area.memberStopIds);
  });

  it('does not treat polygon containment as Area membership', () => {
    const area = PLANNING_PLAN_FIXTURE.areas[0]!;
    const polygon = deriveRouteArea(area.stops);
    expect(polygon).not.toBeNull();
    const outsider = PLANNING_PLAN_FIXTURE.unassignedStops[0]!;
    expect(area.memberStopIds).not.toContain(outsider.stopId);
    expect(area.stops.some((stop) => stop.stopId === outsider.stopId)).toBe(false);
  });

  it('allows one Physical Stop to contain multiple Orders', () => {
    const multi = PLANNING_PLAN_FIXTURE.areas[0]!.stops.find((stop) => stop.stopId === 'S-102')!;
    expect(multi.tasks.map((task) => task.orderId)).toEqual(['10123457', '10123458']);
  });

  it('moving one Order does not move sibling Orders', () => {
    const result = moveOrderToRoute(createPlanningFixture('P-2404'), '10123457', 'A-02')!;
    const source = result.fixture.areas[0]!.stops.find((stop) => stop.stopId === 'S-102')!;
    expect(source.tasks.map((task) => task.orderId)).toEqual(['10123458']);
    const moved = result.fixture.areas[1]!.stops.find(
      (stop) => stop.stopId === result.destinationStopId,
    )!;
    expect(moved.tasks.map((task) => task.orderId)).toEqual(['10123457']);
    expect(moved.lat).toBe(source.lat);
    expect(moved.lng).toBe(source.lng);
  });
});

describe('A03 generation from current Plan', () => {
  it('uses Working Plan data rather than a hardcoded 181-order universe', async () => {
    const { port } = renderPlan('P-2404');
    expect(await screen.findByTestId('start-generation')).toHaveTextContent(
      'ساخت محدوده‌های توزیع',
    );
    const state = await port.getPlanningState('P-2404');
    expect(state.eligibleOrderCount).toBeGreaterThan(0);
    expect(state.eligibleOrderCount).toBeLessThan(50);
    expect(state.areas).toHaveLength(0);
    expect(screen.queryByText('181')).not.toBeInTheDocument();
  });

  it('generates areas asynchronously from the current Plan and supports retry', async () => {
    const user = userEvent.setup();
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    port.setNextPlanningGenerateFail(true);
    renderPlan('P-2404', port);

    await user.click(await screen.findByTestId('start-generation'));
    await waitFor(() => expect(screen.getByTestId('generation-failed')).toBeInTheDocument(), {
      timeout: 4000,
    });

    await user.click(screen.getByTestId('generation-retry'));
    await waitFor(
      async () => {
        const state = await port.getPlanningState('P-2404');
        expect(state.generationPhase).toBe('generated');
        expect(state.areas.length).toBeGreaterThan(0);
        expect(areaAndRouteIdentitiesAreDistinct(state)).toBe(true);
      },
      { timeout: 4000 },
    );
  });
});

describe('A03 driver steal / conflict', () => {
  it('does not silently steal a driver assigned to another Area', () => {
    const stolen = assignDriverToRoute(PLANNING_PLAN_FIXTURE, 'A-03', {
      driverId: 'D-041',
      driverName: 'کاوه میرزایی',
    });
    expect(stolen).toBeNull();
    expect(PLANNING_PLAN_FIXTURE.areas.find((area) => area.areaId === 'A-01')?.driverId).toBe(
      'D-041',
    );
  });
});

describe('A03 membership vs location', () => {
  it('keeps coordinates unchanged when transferring a Stop between Areas', () => {
    const before = PLANNING_PLAN_FIXTURE.areas[0]!.stops[0]!;
    const next = moveStopToRoute(createPlanningFixture('P-2404'), before.stopId, 'A-02')!;
    const moved = next.areas[1]!.stops.find((stop) => stop.stopId === before.stopId)!;
    expect(moved.lat).toBe(before.lat);
    expect(moved.lng).toBe(before.lng);
    expect(next.routes.some((route) => route.dirty)).toBe(true);
  });

  it('preserves raw source coordinates when saving operational location', () => {
    const before = createPlanningFixture('P-2404');
    const stop = before.areas[0]!.stops[0]!;
    const next = updateStopLocation(before, stop.stopId, { lat: 35.9, lng: 51.5 })!;
    const updated = next.areas[0]!.stops[0]!;
    expect(updated.lat).toBe(35.9);
    expect(updated.rawLat).toBe(stop.rawLat);
    expect(updated.rawLng).toBe(stop.rawLng);
    expect(next.lastMutationImpact?.dirtyRouteIds.length).toBeGreaterThan(0);
  });
});

describe('A03 recalc vs rebuild', () => {
  it('recalculation clears dirty routes without changing Area membership', () => {
    const dirty = createPlanningFixture('P-2404');
    const membership = dirty.areas.map((area) => area.memberStopIds);
    const next = recalculateRoutes(dirty);
    expect(next.areas.map((area) => area.memberStopIds)).toEqual(membership);
    expect(next.routes.every((route) => !route.dirty && route.recalcState === 'idle')).toBe(true);
  });

  it('disables structural rebuild during active execution', async () => {
    renderPlan('P-2403');
    await screen.findByTestId('planning-body');
    expect(screen.getByTestId('execution-lock-banner')).toBeInTheDocument();
  });
});

describe('A03 publish readiness and revision spine', () => {
  it('blocks publish for missing drivers, unassigned orders, and dirty routes', () => {
    const readiness = evaluatePublishReadiness(PLANNING_PLAN_FIXTURE);
    expect(readiness.canPublish).toBe(false);
    expect(readiness.blockers.map((item) => item.code)).toEqual(
      expect.arrayContaining(['area-without-driver', 'unassigned-order', 'dirty-route']),
    );
  });

  it('publishes a new immutable snapshot and advances workspace progression', async () => {
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    await port.generatePlanningAreas('P-2404', 3);
    const planBefore = await port.getPlan('P-2404');
    const statusBefore = planBefore?.status;

    await port.assignPlanningDriver('P-2404', 'A-03', {
      driverId: 'D-052',
      driverName: 'نادر عبادی',
    });
    await port.assignPlanningStop('P-2404', 'U-001', 'A-01');
    await port.assignPlanningStop('P-2404', 'U-002', 'A-02');
    await port.recalculatePlanningRoutes('P-2404');

    const published = await port.publishPlanning('P-2404', await port.getPlanningState('P-2404'));
    expect(published.publishedSnapshot).toBeTruthy();
    expect(published.currentStage).toBe('execution');
    expect(published.suggestedSection).toBe('execution');
    expect(published.status).toBe(statusBefore);
    const snapshot = port.getPublishedPlanningState('P-2404')!;
    const publishedDriver = snapshot.areas.find((area) => area.areaId === 'A-01')?.driverId;
    await port.assignPlanningDriver('P-2404', 'A-01', {
      driverId: 'D-001',
      driverName: 'محمد قاسمی',
    });
    const afterEdit = port.getPublishedPlanningState('P-2404')!;
    expect(afterEdit.areas.find((area) => area.areaId === 'A-01')?.driverId).toBe(publishedDriver);
    expect(port.hasUnpublishedPlanningChanges('P-2404')).toBe(true);
  });

  it('navigates to Execution only after a successful first publish', async () => {
    const user = userEvent.setup();
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    await makePublishable(port, 'P-2404');
    const { router } = renderPlan('P-2404', port);

    await user.click(await screen.findByTestId('open-publish-plan'));
    await user.click(screen.getByTestId('confirm-publish-plan'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/plans/P-2404/execution'));
    expect(port.getPublishedPlanningState('P-2404')).not.toBeNull();
    expect(await port.getPlan('P-2404')).toMatchObject({
      lifecycle: 'published',
      currentStage: 'execution',
      suggestedSection: 'execution',
      status: 'planning_active',
    });
    expect(await screen.findByTestId('execution-map-stub')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { current: 'page', name: 'اجرا و پیگیری' }),
    ).toBeInTheDocument();

    const publishedPlan = await port.getPlan('P-2404');
    await router.navigate('/plans');
    await user.click(await screen.findByRole('tab', { name: /همه برنامه‌ها/ }));
    await user.click(await screen.findByRole('button', { name: /گذشته/ }));
    await user.click(await screen.findByText(publishedPlan!.name));
    await waitFor(() => expect(router.state.location.pathname).toBe('/plans/P-2404/execution'));
  });

  it('uses the same excluded-order readiness in the UI and publish guard', async () => {
    const user = userEvent.setup();
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    const unassignedStopIds = await prepareWithUnassignedOrders(port, 'P-2404');
    const { router } = renderPlan('P-2404', port);

    for (const stopId of unassignedStopIds) {
      await user.click(await screen.findByTestId(`exclude-unassigned-${stopId}`));
    }
    await user.click(screen.getByTestId('open-publish-plan'));
    expect(screen.getByTestId('publish-ready')).toBeInTheDocument();
    await user.click(screen.getByTestId('confirm-publish-plan'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/plans/P-2404/execution'));
    expect(port.getPublishedPlanningState('P-2404')).not.toBeNull();
    expect(await port.getPlan('P-2404')).toMatchObject({
      lifecycle: 'published',
      currentStage: 'execution',
      suggestedSection: 'execution',
      status: 'planning_active',
    });
  });

  it('publishes the complete Working state produced by the real P-2404 UI flow', async () => {
    const user = userEvent.setup();
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    await port.generatePlanningAreas('P-2404', 3);
    const generated = await port.getPlanningState('P-2404');
    const unassignedStopIds = generated.unassignedStops.map((stop) => stop.stopId);
    const excludedOrderIds = generated.unassignedStops.flatMap((stop) =>
      stop.tasks.map((task) => task.orderId),
    );
    const { router } = renderPlan('P-2404', port);

    await user.click(await screen.findByTestId('route-row-A-03'));
    await user.click(screen.getByTestId('assign-driver'));
    await user.click(screen.getByTestId('driver-option-D-052'));
    await user.click(screen.getByTestId('driver-confirm-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('route-driver-name')).toHaveTextContent('نادر عبادی'),
    );

    await user.click(screen.getByTestId('map-select-A-01'));
    await user.click(screen.getByTestId('map-select-S-101'));
    await user.click(screen.getByTestId('start-location-correction'));
    await user.click(screen.getByTestId('correction-map-click'));
    await user.click(screen.getByTestId('correction-save'));
    await waitFor(() =>
      expect(screen.queryByTestId('location-correction-panel')).not.toBeInTheDocument(),
    );

    await user.click(screen.getByTestId('start-area-transfer'));
    await user.click(screen.getByTestId('transfer-dest-route-A-02'));
    await user.click(screen.getByTestId('confirm-area-transfer'));
    await waitFor(() =>
      expect(screen.queryByTestId('area-transfer-picker')).not.toBeInTheDocument(),
    );

    await user.click(screen.getByTestId('map-clear-selection'));
    for (const stopId of unassignedStopIds) {
      await user.click(await screen.findByTestId(`exclude-unassigned-${stopId}`));
    }
    await user.click(screen.getByTestId('recalculate-routes'));
    await waitFor(() => expect(screen.queryByTestId('recalculate-routes')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('open-publish-plan'));
    expect(screen.getByTestId('publish-ready')).toBeInTheDocument();
    await user.click(screen.getByTestId('confirm-publish-plan'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/plans/P-2404/execution'));
    expect(screen.queryByText('انتشار ناموفق بود.')).not.toBeInTheDocument();
    expect(await screen.findByTestId('execution-map-stub')).toBeInTheDocument();

    const published = port.getPublishedPlanningState('P-2404')!;
    expect(published.areas.find((area) => area.areaId === 'A-03')).toMatchObject({
      driverId: 'D-052',
      driverName: 'نادر عبادی',
    });
    const transferred = published.areas
      .find((area) => area.areaId === 'A-02')
      ?.stops.find((stop) => stop.stopId === 'S-101');
    expect(transferred).toMatchObject({ lat: 35.751, lng: 51.401 });
    expect(published.areas.find((area) => area.areaId === 'A-01')?.memberStopIds).not.toContain(
      'S-101',
    );
    expect(published.excludedOrderIds).toEqual(expect.arrayContaining(excludedOrderIds));
    expect(await port.getPlan('P-2404')).toMatchObject({
      lifecycle: 'published',
      currentStage: 'execution',
      suggestedSection: 'execution',
      status: 'planning_active',
    });
  });

  it('shows genuine unassigned-order blockers and keeps the publish guard authoritative', async () => {
    const user = userEvent.setup();
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    await prepareWithUnassignedOrders(port, 'P-2404');
    const { router } = renderPlan('P-2404', port);

    await user.click(await screen.findByTestId('open-publish-plan'));
    expect(screen.getByTestId('publish-blockers')).toHaveTextContent('سفارش بدون محدوده');
    expect(screen.getByTestId('confirm-publish-plan')).toBeDisabled();
    const working = await port.getPlanningState('P-2404');
    try {
      await port.publishPlanning('P-2404', working);
      throw new Error('expected publish to be blocked');
    } catch (error) {
      expect(error).toBeInstanceOf(PlanningPublishBlockedError);
      expect((error as PlanningPublishBlockedError).readiness).toEqual({
        canPublish: false,
        blockers: [expect.objectContaining({ code: 'unassigned-order' })],
      });
    }
    expect(router.state.location.pathname).toBe('/plans/P-2404/planning');
    expect(port.getPublishedPlanningState('P-2404')).toBeNull();
  });

  it('keeps Planning progression unchanged when publish fails', async () => {
    const user = userEvent.setup();
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    await makePublishable(port, 'P-2404');
    port.setNextPlanningFailure('server');
    const { router } = renderPlan('P-2404', port);

    await user.click(await screen.findByTestId('open-publish-plan'));
    await user.click(screen.getByTestId('confirm-publish-plan'));

    expect(await screen.findByText('انتشار ناموفق بود.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/plans/P-2404/planning');
    expect(port.getPublishedPlanningState('P-2404')).toBeNull();
    expect(await port.getPlan('P-2404')).toMatchObject({
      currentStage: 'planning',
      suggestedSection: 'planning',
    });
  });

  it('cancels publishing without snapshot, progression, or navigation', async () => {
    const user = userEvent.setup();
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    await makePublishable(port, 'P-2404');
    const { router } = renderPlan('P-2404', port);

    await user.click(await screen.findByTestId('open-publish-plan'));
    await user.click(screen.getByTestId('publish-cancel'));

    expect(screen.queryByTestId('publish-confirm')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/plans/P-2404/planning');
    expect(port.getPublishedPlanningState('P-2404')).toBeNull();
    expect(await port.getPlan('P-2404')).toMatchObject({
      currentStage: 'planning',
      suggestedSection: 'planning',
    });
  });

  it('retains in-progress lifecycle when republishing and returns to Execution', async () => {
    const user = userEvent.setup();
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    await makePublishable(port, 'P-2403');
    const { router } = renderPlan('P-2403', port);

    await user.click(await screen.findByTestId('open-publish-plan'));
    await user.click(screen.getByTestId('confirm-publish-plan'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/plans/P-2403/execution'));
    expect(await port.getPlan('P-2403')).toMatchObject({
      lifecycle: 'inProgress',
      a01Mode: 'execution-locked',
      currentStage: 'execution',
      suggestedSection: 'execution',
      status: 'active',
    });
  });
});

describe('A03 dispatch lookup', () => {
  it('is plan-local and uses dataset phone, not derived Order ID', () => {
    const found = lookupDispatchOrder(PLANNING_PLAN_FIXTURE, '10123456');
    expect(found.kind).toBe('found');
    if (found.kind === 'found') {
      expect(found.areaLabel).toBe('محدوده ۱');
      expect(found.driverName).toBe('کاوه میرزایی');
      expect(found.phone).toBe('09121110101');
      expect(found.phone).not.toContain('10123456');
    }
    expect(lookupDispatchOrder(PLANNING_PLAN_FIXTURE, 'NOPE').kind).toBe('notfound');
    expect(lookupDispatchOrder(PLANNING_PLAN_FIXTURE, '10129001').kind).toBe('unassigned');
    expect(lookupDispatchOrder(PLANNING_PLAN_FIXTURE, '10129001', new Set(['10129001'])).kind).toBe(
      'excluded',
    );
  });

  it('opens تفکیک پاکت‌ها and highlights a found order', async () => {
    const user = userEvent.setup();
    render(
      <PlanningWorkspace
        initialFixture={createPlanningFixture('P-2404')}
        initialGenerationPhase="generated"
      />,
    );
    await user.click(screen.getByTestId('open-dispatch-prep'));
    expect(screen.getByTestId('dispatch-prep-panel')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('dispatch-lookup-input'), {
      target: { value: '10123456' },
    });
    fireEvent.submit(screen.getByTestId('dispatch-lookup-input').closest('form')!);
    expect(screen.getByTestId('dispatch-found')).toHaveTextContent('محدوده ۱');
    expect(screen.getByTestId('dispatch-found')).toHaveTextContent('کاوه میرزایی');
  });
});

describe('A03 section / lifecycle', () => {
  it('keeps Planning section route-driven and does not restore a stepper', async () => {
    const { router, port } = renderPlan('P-2404');
    await screen.findByTestId('planning-body');
    expect(router.state.location.pathname).toBe('/plans/P-2404/planning');
    expect(screen.queryByRole('list', { name: /گام/ })).not.toBeInTheDocument();
    expect(document.querySelector('[aria-current="step"]')).toBeNull();
    const plan = await port.getPlan('P-2404');
    expect(plan?.currentStage).toBe('planning');
    expect(plan?.suggestedSection).toBe('planning');
  });
});

describe('A03 upstream non-spatial vs spatial', () => {
  it('does not dirty routes for a phone-only Review edit', async () => {
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    await port.generatePlanningAreas('P-2404', 3);
    const before = await port.getPlanningState('P-2404');
    const dirtyBefore = before.routes.filter((route) => route.dirty).length;
    const items = await port.listReviewItems('P-2404');
    const item = items[0]!;
    await port.updateReviewInformation('P-2404', item.reviewItemId, {
      name: item.name,
      phone: '09120000000',
      address: item.address,
    });
    const after = await port.getPlanningState('P-2404');
    expect(after.routes.filter((route) => route.dirty).length).toBe(dirtyBefore);
  });
});

describe('A03 system conflict', () => {
  it('does not apply a driver mutation on stale conflict', async () => {
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    await port.generatePlanningAreas('P-2404', 3);
    port.setNextPlanningFailure('conflict');
    await expect(
      port.assignPlanningDriver('P-2404', 'A-03', { driverId: 'D-052', driverName: 'نادر عبادی' }),
    ).rejects.toThrow('PLANNING_CONFLICT');
    const state = await port.getPlanningState('P-2404');
    expect(state.areas.find((area) => area.areaId === 'A-03')?.driverId).toBeNull();
  });
});
