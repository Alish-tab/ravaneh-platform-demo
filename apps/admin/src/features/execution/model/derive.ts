import type {
  AreaExecState,
  AreaFilter,
  AreaViewModel,
  ExecutionLocation,
  ExecutionOrder,
  ExecutionPhase,
  ExecutionSnapshot,
  ExecutionSummaryCounts,
  ExecutionUiStatus,
} from '@/features/execution/model/types';

export function countByStatus(orders: ExecutionOrder[]): ExecutionSummaryCounts {
  return {
    total: orders.length,
    delivered: orders.filter((order) => order.uiStatus === 'delivered').length,
    pending: orders.filter((order) => order.uiStatus === 'pending').length,
    followup: orders.filter((order) => order.uiStatus === 'followup').length,
  };
}

export function derivePhase(orders: ExecutionOrder[]): ExecutionPhase {
  if (orders.length === 0) return 'not-started';
  const counts = countByStatus(orders);
  if (counts.delivered === 0 && counts.followup === 0) return 'not-started';
  if (counts.pending === 0) return 'completed';
  return 'in-progress';
}

export function areaExecState(counts: ExecutionSummaryCounts): AreaExecState {
  if (counts.delivered === 0 && counts.followup === 0) return 'not-started';
  if (counts.pending === 0) return 'completed';
  return 'in-progress';
}

export function completionPct(counts: ExecutionSummaryCounts): number {
  if (counts.total === 0) return 0;
  return Math.round((counts.delivered / counts.total) * 100);
}

export function deriveSummary(snapshot: ExecutionSnapshot): ExecutionSummaryCounts {
  return countByStatus(snapshot.orders);
}

export function deriveAreas(snapshot: ExecutionSnapshot): AreaViewModel[] {
  return snapshot.areas.map((area) => {
    const counts = countByStatus(snapshot.orders.filter((order) => order.areaId === area.id));
    return {
      ...area,
      ...counts,
      execState: areaExecState(counts),
      completionPct: completionPct(counts),
    };
  });
}

export function filterAreas(areas: AreaViewModel[], filter: AreaFilter): AreaViewModel[] {
  if (filter === 'all') return areas;
  if (filter === 'pending') return areas.filter((area) => area.pending > 0);
  if (filter === 'delivered') return areas.filter((area) => area.delivered > 0);
  return areas.filter((area) => area.followup > 0);
}

export function locationOrders(
  snapshot: ExecutionSnapshot,
  locationId: string,
): ExecutionOrder[] {
  return snapshot.orders.filter((order) => order.locationId === locationId);
}

export function locationStatus(orders: ExecutionOrder[]): ExecutionUiStatus {
  if (orders.some((order) => order.uiStatus === 'followup')) return 'followup';
  if (orders.some((order) => order.uiStatus === 'pending')) return 'pending';
  return 'delivered';
}

export function locationsForArea(
  snapshot: ExecutionSnapshot,
  areaId: string,
): ExecutionLocation[] {
  return snapshot.locations.filter((location) => location.areaId === areaId);
}

export function followupOrders(snapshot: ExecutionSnapshot): ExecutionOrder[] {
  return snapshot.orders.filter((order) => order.uiStatus === 'followup');
}
