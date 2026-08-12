import { useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { createAppRouter } from '@/app/router';

export function App() {
  const router = useMemo(() => createAppRouter(), []);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
