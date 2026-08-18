import { type ReactNode } from 'react';

import { ExecutionDataContext } from '@/features/execution/data/execution-data-context';
import { defaultExecutionFixture } from '@/features/execution/data/fixture-port';
import type { ExecutionDataPort } from '@/features/execution/data/port';

type ExecutionFixtureProviderProps = {
  children: ReactNode;
  port?: ExecutionDataPort;
};

export function ExecutionFixtureProvider({ children, port }: ExecutionFixtureProviderProps) {
  const value = port ?? defaultExecutionFixture;
  return <ExecutionDataContext.Provider value={value}>{children}</ExecutionDataContext.Provider>;
}
