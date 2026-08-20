import { deriveAreaGeometry, type MapCoordinate } from '@/shared/map/area-geometry';

type ExecutionAreaPoint = {
  lat: number;
  lng: number;
};

/** Map published stop coordinates into the Execution polygon representation. */
export function buildExecutionAreaPolygon(
  points: readonly ExecutionAreaPoint[],
): MapCoordinate[] {
  const coordinates = points.map(({ lat, lng }) => [lat, lng] as MapCoordinate);
  return deriveAreaGeometry(coordinates)?.positions ??
    (coordinates.length >= 3 ? coordinates : []);
}
