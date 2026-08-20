import { describe, expect, it } from 'vitest';

import { buildExecutionAreaPolygon } from '@/features/execution/data/area-geometry';
import { deriveAreaGeometry, type MapCoordinate } from '@/shared/map/area-geometry';

describe('Execution area geometry adapter', () => {
  it('preserves the shared polygon output for published stop coordinates', () => {
    const points = [
      { lat: 35.747, lng: 51.362 },
      { lat: 35.74, lng: 51.38 },
      { lat: 35.734, lng: 51.368 },
      { lat: 35.728, lng: 51.396 },
    ];
    const coordinates = points.map(({ lat, lng }) => [lat, lng] as MapCoordinate);

    expect(buildExecutionAreaPolygon(points)).toEqual(
      deriveAreaGeometry(coordinates)?.positions,
    );
  });

  it('preserves the existing empty polygon fallback for fewer than three points', () => {
    expect(buildExecutionAreaPolygon([{ lat: 35.7, lng: 51.4 }])).toEqual([]);
  });
});
