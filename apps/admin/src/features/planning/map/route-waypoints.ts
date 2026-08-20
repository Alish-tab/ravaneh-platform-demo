import type { PlanningArea, PlanningPlanFixture, PlanningStop } from '@/features/planning/fixture/types';
import { orderedStopsForArea } from '@/features/planning/planning-model';

/** Ordered stops by Area membership / Route order. */
export function orderedRouteStops(
  area: PlanningArea,
  fixture?: PlanningPlanFixture,
): PlanningStop[] {
  if (fixture) return orderedStopsForArea(fixture, area);
  return [...area.stops].sort((a, b) => a.seq - b.seq);
}

export function routeOrderCount(area: PlanningArea): number {
  return area.stops.reduce((sum, stop) => sum + stop.tasks.length, 0);
}
