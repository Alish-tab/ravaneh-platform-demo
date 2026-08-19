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
import { areaAndRouteIdentitiesAreDistinct, evaluatePublishReadiness } from '@/features/planning/planning-model';
import { recalculateRoutes } from '@/features/planning/fixture/generate-areas';
import { createPlansFixturePort } from '@/features/plans/fixture/plans-fixture';

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
  PlanningMap: () => <div data-testid="planning-map" />,
}));

afterEach(() => {
  cleanup();
});

function renderPlan(planId: string, port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 })) {
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
    const moved = result.fixture.areas[1]!.stops.find((stop) => stop.stopId === result.destinationStopId)!;
    expect(moved.tasks.map((task) => task.orderId)).toEqual(['10123457']);
    expect(moved.lat).toBe(source.lat);
    expect(moved.lng).toBe(source.lng);
  });
});

describe('A03 generation from current Plan', () => {
  it('uses Working Plan data rather than a hardcoded 181-order universe', async () => {
    const { port } = renderPlan('P-2404');
    expect(await screen.findByTestId('start-generation')).toHaveTextContent('ساخت محدوده‌های توزیع');
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
    expect(PLANNING_PLAN_FIXTURE.areas.find((area) => area.areaId === 'A-01')?.driverId).toBe('D-041');
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

  it('publishes a new immutable snapshot without using currentStage', async () => {
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    await port.generatePlanningAreas('P-2404', 3);
    const planBefore = await port.getPlan('P-2404');
    const stageBefore = planBefore?.currentStage;

    await port.assignPlanningDriver('P-2404', 'A-03', { driverId: 'D-052', driverName: 'نادر عبادی' });
    await port.assignPlanningStop('P-2404', 'U-001', 'A-01');
    await port.assignPlanningStop('P-2404', 'U-002', 'A-02');
    await port.recalculatePlanningRoutes('P-2404');

    const published = await port.publishPlanning('P-2404');
    expect(published.publishedSnapshot).toBeTruthy();
    expect(published.currentStage).toBe(stageBefore);
    const snapshot = port.getPublishedPlanningState('P-2404')!;
    const publishedDriver = snapshot.areas.find((area) => area.areaId === 'A-01')?.driverId;
    await port.assignPlanningDriver('P-2404', 'A-01', { driverId: 'D-001', driverName: 'محمد قاسمی' });
    const afterEdit = port.getPublishedPlanningState('P-2404')!;
    expect(afterEdit.areas.find((area) => area.areaId === 'A-01')?.driverId).toBe(publishedDriver);
    expect(port.hasUnpublishedPlanningChanges('P-2404')).toBe(true);
  });
});

describe('A03 dispatch lookup', () => {
  it('is plan-local and uses dataset phone, not derived Order ID', () => {
    const found = lookupDispatchOrder(PLANNING_PLAN_FIXTURE, '10123456');
    expect(found.kind).toBe('found');
    if (found.kind === 'found') {
      expect(found.areaLabel).toBe('محدوده ۱');
      expect(found.driverName).toBe('کاوه میرزایی');
      expect(found.phone).toBe('0912-111-0101');
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
    fireEvent.change(screen.getByTestId('dispatch-lookup-input'), { target: { value: '10123456' } });
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
