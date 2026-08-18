import { useContext, useSyncExternalStore } from 'react';

import { ExecutionDataContext } from '@/features/execution/data/execution-data-context';
import type { ExecutionDataPort } from '@/features/execution/data/port';

export function useExecutionDataPort(): ExecutionDataPort {
  const port = useContext(ExecutionDataContext);
  if (!port) {
    throw new Error('useExecutionDataPort must be used within ExecutionFixtureProvider');
  }
  return port;
}

export function useExecutionFixtureVersion(): number {
  const port = useExecutionDataPort();
  return useSyncExternalStore(port.subscribe, port.getVersion, () => 0);
}
