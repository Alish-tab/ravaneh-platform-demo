import { useContext, useSyncExternalStore } from 'react';

import { PlansDataContext } from '@/features/plans/fixture/plans-data-context';
import type { PlansDataPort } from '@/features/plans/fixture/plans-fixture';

export function usePlansDataPort(): PlansDataPort {
  const port = useContext(PlansDataContext);
  if (!port) {
    throw new Error('usePlansDataPort must be used within PlansFixtureProvider');
  }
  return port;
}

export function usePlansFixtureVersion(): number {
  const port = usePlansDataPort();
  return useSyncExternalStore(port.subscribe, port.getVersion, () => 0);
}
