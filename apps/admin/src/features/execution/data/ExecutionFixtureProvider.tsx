import { useMemo, type ReactNode } from 'react';

import { ExecutionDataContext } from '@/features/execution/data/execution-data-context';
import { createExecutionFixturePort } from '@/features/execution/data/fixture-port';
import type { ExecutionDataPort } from '@/features/execution/data/port';
import { usePlansDataPort } from '@/features/plans/fixture/usePlansFixture';

type ExecutionFixtureProviderProps = {
  children: ReactNode;
  port?: ExecutionDataPort;
};

export function ExecutionFixtureProvider({ children, port }: ExecutionFixtureProviderProps) {
  const plansPort = usePlansDataPort();
  const value = useMemo(() => {
    return port ?? createExecutionFixturePort({ plansPort });
  }, [plansPort, port]);
  return <ExecutionDataContext.Provider value={value}>{children}</ExecutionDataContext.Provider>;
}
