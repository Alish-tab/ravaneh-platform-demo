import { describe, expect, it, vi, afterEach } from 'vitest';

import {
  fetchOsrmGeometry,
  resolveRouteGeometry,
  straightLineGeometry,
  type LatLngTuple,
} from '@/features/planning/map/osrm';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Planning OSRM boundary', () => {
  const waypoints: LatLngTuple[] = [
    [35.695, 51.389],
    [35.747, 51.362],
    [35.74, 51.38],
  ];

  it('falls back to straight geometry when OSRM fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );

    const result = await resolveRouteGeometry(waypoints);
    expect(result.source).toBe('straight');
    expect(result.positions).toEqual(straightLineGeometry(waypoints));
  });

  it('maps GeoJSON coordinates to Leaflet [lat, lng]', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          code: 'Ok',
          routes: [
            {
              geometry: {
                coordinates: [
                  [51.389, 35.695],
                  [51.37, 35.72],
                  [51.38, 35.74],
                ],
              },
            },
          ],
        }),
      })),
    );

    const positions = await fetchOsrmGeometry(waypoints);
    expect(positions).toEqual([
      [35.695, 51.389],
      [35.72, 51.37],
      [35.74, 51.38],
    ]);
  });
});
