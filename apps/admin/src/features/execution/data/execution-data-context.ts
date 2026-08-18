import { createContext } from 'react';

import type { ExecutionDataPort } from '@/features/execution/data/port';

export const ExecutionDataContext = createContext<ExecutionDataPort | null>(null);
