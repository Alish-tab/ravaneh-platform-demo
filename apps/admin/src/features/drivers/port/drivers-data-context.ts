import { createContext } from 'react';
import type { DriversDataPort } from '@/features/drivers/port/drivers-port';

export const DriversDataContext = createContext<DriversDataPort | null>(null);
