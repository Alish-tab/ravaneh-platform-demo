import { type ReactNode } from 'react';

import { PlansDataContext } from '@/features/plans/fixture/plans-data-context';
import {
  defaultPlansFixture,
  type PlansDataPort,
} from '@/features/plans/fixture/plans-fixture';

type PlansFixtureProviderProps = {
  children: ReactNode;
  /** Inject a custom port in tests. Defaults to app fixture singleton. */
  port?: PlansDataPort;
};

export function PlansFixtureProvider({ children, port }: PlansFixtureProviderProps) {
  const value = port ?? defaultPlansFixture;
  return <PlansDataContext.Provider value={value}>{children}</PlansDataContext.Provider>;
}
