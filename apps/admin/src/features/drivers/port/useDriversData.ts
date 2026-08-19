import { useContext, useSyncExternalStore } from 'react';
import { DriversDataContext } from '@/features/drivers/port/drivers-data-context';
import type { DriversDataPort } from '@/features/drivers/port/drivers-port';

export function useDriversPort(): DriversDataPort {
  const port = useContext(DriversDataContext);
  if (!port) throw new Error('DriversDataContext not provided');
  return port;
}

export function useDriversVersion(): number {
  const port = useDriversPort();
  return useSyncExternalStore(port.subscribe, port.getVersion);
}
