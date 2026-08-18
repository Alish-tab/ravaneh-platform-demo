import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

import { createAppQueryClient } from '@/app/providers/query-client';
import { ExecutionFixtureProvider } from '@/features/execution/data/ExecutionFixtureProvider';
import type { ExecutionDataPort } from '@/features/execution/data/port';
import { PlansFixtureProvider } from '@/features/plans/fixture/PlansFixtureProvider';
import type { PlansDataPort } from '@/features/plans/fixture/plans-fixture';

type AppProvidersProps = {
  children: ReactNode;
  /** Test injection for A01 fixture port. */
  plansPort?: PlansDataPort;
  /** Test injection for A04 fixture port. */
  executionPort?: ExecutionDataPort;
};

export function AppProviders({ children, plansPort, executionPort }: AppProvidersProps) {
  const [queryClient] = useState(() => createAppQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PlansFixtureProvider port={plansPort}>
        <ExecutionFixtureProvider port={executionPort}>
          {children}
          {import.meta.env.DEV ? (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          ) : null}
        </ExecutionFixtureProvider>
      </PlansFixtureProvider>
    </QueryClientProvider>
  );
}
