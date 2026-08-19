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
import { DriversDataProvider } from '@/features/drivers/port/DriversDataProvider';
import type { DriversDataPort } from '@/features/drivers/port/drivers-port';

type AppProvidersProps = {
  children: ReactNode;
  /** Test injection for A01 fixture port. */
  plansPort?: PlansDataPort;
  /** Test injection for A04 fixture port. */
  executionPort?: ExecutionDataPort;
  /** Test injection for A05 ops port. */
  opsPort?: OpsHomePort;
  /** Test injection for A06 drivers port. */
  driversPort?: DriversDataPort;
};

export function AppProviders({ children, plansPort, executionPort, opsPort, driversPort }: AppProvidersProps) {
  const [queryClient] = useState(() => createAppQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PlansFixtureProvider port={plansPort}>
        <ExecutionFixtureProvider port={executionPort}>
          <OpsDataProvider port={opsPort}>
            <DriversDataProvider port={driversPort}>
              {children}
              {import.meta.env.DEV && import.meta.env.MODE !== 'test' ? (
                <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
              ) : null}
            </DriversDataProvider>
          </OpsDataProvider>
        </ExecutionFixtureProvider>
      </PlansFixtureProvider>
    </QueryClientProvider>
  );
}
