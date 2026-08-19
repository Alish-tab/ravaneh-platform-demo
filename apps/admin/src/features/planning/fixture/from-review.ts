/**
 * Convert Working Review / Planning seed into ReviewItem rows for the shared spine.
 * Feature-local — not a Backend import mapper.
 */

import type { ReviewItem } from '@/features/import-review/review-types';
import {
  P2404_PHYSICAL_STOP_GROUPS,
  PLANNING_PLAN_FIXTURE,
} from '@/features/planning/fixture/planning-fixture';
import { collectTasks } from '@/features/planning/planning-model';

export function p2404ReviewItemsFromPlanningSeed(): ReviewItem[] {
  const fixture = PLANNING_PLAN_FIXTURE;
  const tasks = collectTasks(fixture);
  return tasks.map((task) => {
    const located =
      fixture.areas.flatMap((area) => area.stops).find((stop) =>
        stop.tasks.some((item) => item.orderId === task.orderId),
      ) ??
      fixture.unassignedStops.find((stop) =>
        stop.tasks.some((item) => item.orderId === task.orderId),
      );
    return {
      reviewItemId: task.taskId,
      externalOrderId: task.orderId,
      importBatchId: 'IB-P-2404',
      name: task.recipientName,
      phone: task.phone,
      address: task.address,
      rawCustomerName: task.recipientName,
      rawPhone: task.phone.replace(/\D/g, ''),
      rawAddress: task.address,
      rawLatitude: located ? String(located.rawLat ?? located.lat) : '',
      rawLongitude: located ? String(located.rawLng ?? located.lng) : '',
      resolvedLat: located?.lat ?? null,
      resolvedLng: located?.lng ?? null,
      locSource: located ? 'source_coords' : null,
      issues: [],
      state: 'ready' as const,
      overlay: null,
      downstreamImpact: 'none' as const,
      geocodeOutcome: 'clear' as const,
    };
  });
}

export { P2404_PHYSICAL_STOP_GROUPS };
