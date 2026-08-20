import { describe, expect, it } from 'vitest';

import { deriveAreaGeometry, type MapCoordinate } from '@/shared/map/area-geometry';

describe('deriveAreaGeometry', () => {
  it('returns null for fewer than three coordinates', () => {
    expect(deriveAreaGeometry([])).toBeNull();
    expect(deriveAreaGeometry([[35.7, 51.4], [35.71, 51.41]])).toBeNull();
  });

  it('uses concave geometry for a connected coordinate cluster', () => {
    const result = deriveAreaGeometry([
      [35.7, 51.4],
      [35.7004, 51.4003],
      [35.7, 51.4006],
      [35.6996, 51.4005],
      [35.6996, 51.4001],
      [35.7, 51.4003],
    ]);

    expect(result?.source).toBe('concave');
    expect(result?.positions.length).toBeGreaterThanOrEqual(4);
  });

  it('falls back to convex geometry when maxEdge prevents a concave polygon', () => {
    const result = deriveAreaGeometry([
      [35.5, 51.1],
      [35.5, 51.5],
      [35.9, 51.5],
      [35.9, 51.1],
    ]);

    expect(result?.source).toBe('convex');
    expect(result?.positions.length).toBeGreaterThanOrEqual(4);
  });

  it('preserves Leaflet latitude/longitude orientation', () => {
    const coordinates: MapCoordinate[] = [
      [35.71, 51.31],
      [35.72, 51.33],
      [35.69, 51.34],
      [35.68, 51.3],
    ];
    const result = deriveAreaGeometry(coordinates);

    expect(result).not.toBeNull();
    for (const [lat, lng] of result!.positions) {
      expect(lat).toBeGreaterThanOrEqual(35.68);
      expect(lat).toBeLessThanOrEqual(35.72);
      expect(lng).toBeGreaterThanOrEqual(51.3);
      expect(lng).toBeLessThanOrEqual(51.34);
    }
  });
});
