import { describe, expect, it } from 'vitest';

import { deriveRouteArea, buildRouteAreas } from '@/features/planning/map/route-area';
import { PLANNING_PLAN_FIXTURE } from '@/features/planning/fixture/planning-fixture';
import type { PlanningStop } from '@/features/planning/fixture/types';

describe('deriveRouteArea', () => {
  it('returns null when fewer than 3 stops', () => {
    expect(deriveRouteArea([])).toBeNull();
    expect(
      deriveRouteArea([
        { lat: 35.7, lng: 51.4 },
        { lat: 35.71, lng: 51.41 },
      ]),
    ).toBeNull();
  });

  it('returns a closed Leaflet polygon for a valid stop cluster', () => {
    const stops: Array<Pick<PlanningStop, 'lat' | 'lng'>> = [
      { lat: 35.747, lng: 51.362 },
      { lat: 35.74, lng: 51.38 },
      { lat: 35.734, lng: 51.368 },
      { lat: 35.728, lng: 51.396 },
    ];
    const result = deriveRouteArea(stops);
    expect(result).not.toBeNull();
    expect(result!.positions.length).toBeGreaterThanOrEqual(4);
    expect(['concave', 'convex']).toContain(result!.source);
    // Leaflet order [lat, lng]
    for (const [lat, lng] of result!.positions) {
      expect(lat).toBeGreaterThan(35);
      expect(lng).toBeGreaterThan(51);
    }
  });

  it('falls back safely for collinear / degenerate points', () => {
    const collinear: Array<Pick<PlanningStop, 'lat' | 'lng'>> = [
      { lat: 35.7, lng: 51.4 },
      { lat: 35.71, lng: 51.4 },
      { lat: 35.72, lng: 51.4 },
    ];
    // May return null or convex — must not throw
    expect(() => deriveRouteArea(collinear)).not.toThrow();
    const result = deriveRouteArea(collinear);
    if (result) {
      expect(result.positions.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('builds area entries for fixture routes without throwing', () => {
    const entries = buildRouteAreas(PLANNING_PLAN_FIXTURE.routes);
    expect(entries).toHaveLength(3);
    for (const entry of entries) {
      expect(entry.routeId).toMatch(/^R-0/);
      if (entry.area) {
        expect(entry.area.positions.length).toBeGreaterThanOrEqual(4);
      }
    }
    // All current fixture routes have ≥3 spatially spread stops
    expect(entries.every((entry) => entry.area !== null)).toBe(true);
  });
});
