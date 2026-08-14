import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

import { createAppQueryClient } from '@/app/providers/query-client';
import { PlansFixtureProvider } from '@/features/plans/fixture/PlansFixtureProvider';
import type { PlansDataPort } from '@/features/plans/fixture/plans-fixture';

type AppProvidersProps = {
  children: ReactNode;
  /** Test injection for A01 fixture port. */
  plansPort?: PlansDataPort;
};

export function AppProviders({ children, plansPort }: AppProvidersProps) {
  const [queryClient] = useState(() => createAppQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PlansFixtureProvider port={plansPort}>
        {children}
        {import.meta.env.DEV ? (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        ) : null}
      </PlansFixtureProvider>
    </QueryClientProvider>
  );
}
