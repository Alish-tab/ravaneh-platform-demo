import { createContext } from 'react';

import type { OpsHomePort } from '@/features/ops/port/ops-port';

export const OpsDataContext = createContext<OpsHomePort | null>(null);
