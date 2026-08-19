import { useMemo, type ReactNode } from 'react';
import { DriversDataContext } from '@/features/drivers/port/drivers-data-context';
import { createDriversFixturePort, type DriversDataPort } from '@/features/drivers/port/drivers-port';

type Props = {
  children: ReactNode;
  port?: DriversDataPort;
};

export function DriversDataProvider({ children, port }: Props) {
  const value = useMemo(() => port ?? createDriversFixturePort(), [port]);
  return (
    <DriversDataContext.Provider value={value}>
      {children}
    </DriversDataContext.Provider>
  );
}
