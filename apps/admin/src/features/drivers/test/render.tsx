import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '@/app/providers/AppProviders';
import { DriversPage } from '@/features/drivers/pages/DriversPage';
import { createDriversFixturePort, type DriversDataPort } from '@/features/drivers/port/drivers-port';
import { createPlansFixturePort, type PlansDataPort } from '@/features/plans/fixture/plans-fixture';

export type DriversTestContext = {
  driversPort: DriversDataPort;
  plansPort: PlansDataPort;
};

export async function renderDrivers(
  initialEntry = '/drivers',
  opts?: { portSetup?: (ctx: DriversTestContext) => void | Promise<void> },
): Promise<DriversTestContext> {
  const plansPort = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
  const driversPort = createDriversFixturePort(0);

  const ctx: DriversTestContext = { driversPort, plansPort };
  if (opts?.portSetup) await opts.portSetup(ctx);

  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppProviders plansPort={plansPort} driversPort={driversPort}>
        <DriversPage />
      </AppProviders>
    </MemoryRouter>,
  );

  return ctx;
}
