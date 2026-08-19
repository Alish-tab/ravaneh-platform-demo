import { useMemo, type ReactNode } from 'react';

import { useExecutionDataPort } from '@/features/execution/data/useExecutionFixture';
import { OpsDataContext } from '@/features/ops/port/ops-data-context';
import { createOpsHomePort } from '@/features/ops/port/ops-port';
import type { OpsHomePort } from '@/features/ops/port/ops-port';
import { usePlansDataPort } from '@/features/plans/fixture/usePlansFixture';

type OpsDataProviderProps = {
  children: ReactNode;
  /** Test injection. */
  port?: OpsHomePort;
};

export function OpsDataProvider({ children, port }: OpsDataProviderProps) {
  const plansPort = usePlansDataPort();
  const executionPort = useExecutionDataPort();

  const value = useMemo(() => {
    return port ?? createOpsHomePort(plansPort, executionPort);
  }, [plansPort, executionPort, port]);

  return <OpsDataContext.Provider value={value}>{children}</OpsDataContext.Provider>;
}
