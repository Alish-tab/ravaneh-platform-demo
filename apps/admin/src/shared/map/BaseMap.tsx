import type { ReactNode } from 'react';
import { MapContainer } from 'react-leaflet';

import { env } from '@/shared/config/env';
import { BaseTileLayer } from '@/shared/map/layers/BaseTileLayer';

type BaseMapProps = {
  center?: [number, number];
  zoom?: number;
  className?: string;
  children?: ReactNode;
  zoomControl?: boolean;
  scrollWheelZoom?: boolean;
};

/** Tehran default — smoke/demo only; business maps will pass plan/depot centers later. */
const DEFAULT_CENTER: [number, number] = [35.6892, 51.389];

/**
 * Base map shell. Feature layers (tasks, routes, zones, selection, editing)
 * should compose as children later — do not fold all markers into this file.
 */
export function BaseMap({
  center = DEFAULT_CENTER,
  zoom = 12,
  className = 'h-80 w-full',
  children,
  zoomControl = true,
  scrollWheelZoom = false,
}: BaseMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      zoomControl={zoomControl}
      scrollWheelZoom={scrollWheelZoom}
    >
      <BaseTileLayer url={env.mapTileUrl} attribution={env.mapAttribution} />
      {children}
    </MapContainer>
  );
}
