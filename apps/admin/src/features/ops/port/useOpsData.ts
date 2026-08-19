import { useContext, useSyncExternalStore } from 'react';

import { OpsDataContext } from '@/features/ops/port/ops-data-context';
import type { OpsHomePort } from '@/features/ops/port/ops-port';

export function useOpsPort(): OpsHomePort {
  const port = useContext(OpsDataContext);
  if (!port) {
    throw new Error('useOpsPort must be used within OpsDataProvider');
  }
  return port;
}

export function useOpsVersion(): number {
  const port = useOpsPort();
  return useSyncExternalStore(port.subscribe, port.getVersion, () => 0);
}
