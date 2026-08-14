import { createContext } from 'react';

import type { PlansDataPort } from '@/features/plans/fixture/plans-fixture';

export const PlansDataContext = createContext<PlansDataPort | null>(null);
