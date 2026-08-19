import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

import { createAppQueryClient } from '@/app/providers/query-client';
import { ExecutionFixtureProvider } from '@/features/execution/data/ExecutionFixtureProvider';
import type { ExecutionDataPort } from '@/features/execution/data/port';
import { OpsDataProvider } from '@/features/ops/port/OpsDataProvider';
import type { OpsHomePort } from '@/features/ops/port/ops-port';
import { PlansFixtureProvider } from '@/features/plans/fixture/PlansFixtureProvider';
import type { PlansDataPort } from '@/features/plans/fixture/plans-fixture';

type AppProvidersProps = {
  children: ReactNode;
  /** Test injection for A01 fixture port. */
  plansPort?: PlansDataPort;
  /** Test injection for A04 fixture port. */
  executionPort?: ExecutionDataPort;
  /** Test injection for A05 ops port. */
  opsPort?: OpsHomePort;
};

export function AppProviders({ children, plansPort, executionPort, opsPort }: AppProvidersProps) {
  const [queryClient] = useState(() => createAppQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PlansFixtureProvider port={plansPort}>
        <ExecutionFixtureProvider port={executionPort}>
          <OpsDataProvider port={opsPort}>
            {children}
            {import.meta.env.DEV && import.meta.env.MODE !== 'test' ? (
              <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
            ) : null}
          </OpsDataProvider>
        </ExecutionFixtureProvider>
      </PlansFixtureProvider>
    </QueryClientProvider>
  );
}
