/** Driver master data model. Assignments are NOT embedded here — they are projected. */
export type DriverAppAccessStatus = 'none' | 'active' | 'blocked';
export type DriverOperationalStatus = 'active' | 'inactive';

export type DriverRecord = {
  driverId: string;
  name: string;
  phone: string;
  operationalStatus: DriverOperationalStatus;
  appAccessStatus: DriverAppAccessStatus;
  /** Optimistic concurrency token. */
  version: number;
};

/** A single today-assignment projection entry. */
export type DriverTodayAssignment = {
  planId: string;
  planName: string;
  areaId: string;
  areaLabel: string;
  deliveryWindow: string;
  /** Whether the plan has a published revision that is currently executing. */
  isPublished: boolean;
};

export type DriverMutationState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'failure'; message: string }
  | { kind: 'conflict'; message: string };
