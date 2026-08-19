import type { PlanningDispatchResult, PlanningPlanFixture } from '@/features/planning/fixture/types';

function allTasks(fixture: PlanningPlanFixture) {
  const rows: Array<{
    orderId: string;
    areaId: string | null;
    areaLabel: string | null;
    driverName: string | null;
    address: string;
    phone: string;
    stopId: string;
  }> = [];

  for (const area of fixture.areas) {
    for (const stop of area.stops) {
      for (const task of stop.tasks) {
        rows.push({
          orderId: task.orderId,
          areaId: area.areaId,
          areaLabel: area.label,
          driverName: area.driverName,
          address: task.address,
          phone: task.phone,
          stopId: stop.stopId,
        });
      }
    }
  }

  for (const stop of fixture.unassignedStops) {
    for (const task of stop.tasks) {
      rows.push({
        orderId: task.orderId,
        areaId: null,
        areaLabel: null,
        driverName: null,
        address: task.address,
        phone: task.phone,
        stopId: stop.stopId,
      });
    }
  }

  return rows;
}

/**
 * Plan-local exact lookup by External Order ID / barcode wedge input.
 * Not global Ops search. Phone comes from the dataset row.
 */
export function lookupDispatchOrder(
  fixture: PlanningPlanFixture,
  rawId: string,
  excludedOrderIds: ReadonlySet<string> = new Set(),
): PlanningDispatchResult {
  const orderId = rawId.trim();
  if (!orderId) return { kind: 'notfound', orderId };

  if (excludedOrderIds.has(orderId)) {
    return { kind: 'excluded', orderId };
  }

  const match = allTasks(fixture).find((row) => row.orderId === orderId);
  if (!match) return { kind: 'notfound', orderId };

  if (!match.areaId) {
    return {
      kind: 'unassigned',
      orderId,
      stopId: match.stopId,
      address: match.address,
      phone: match.phone,
    };
  }

  return {
    kind: 'found',
    orderId,
    areaId: match.areaId,
    areaLabel: match.areaLabel ?? '',
    driverName: match.driverName,
    address: match.address,
    phone: match.phone,
    stopId: match.stopId,
  };
}
