/**
 * A04 feature-local view types.
 * NOT OpenAPI / shared domain contracts. NOT Figma State Explorer fixture types.
 */

/** Presentation mapping of delivery results — not the Backend DeliveryStatus enum. */
export type ExecutionUiStatus = 'delivered' | 'pending' | 'followup';

/** Presentation area execution state — not a Backend enum. */
export type AreaExecState = 'not-started' | 'in-progress' | 'completed';

export type ExecutionPhase = 'not-started' | 'in-progress' | 'completed';

export type ExecutionAttempt = {
  id: string;
  /** Fixture-local outcome code — not a Backend DeliveryAttempt enum. */
  outcomeCode: string;
  atLabel: string;
};

export type ExecutionGpsVerificationMethod =
  | 'gps-verified'
  | 'manual-verification';

/**
 * Stop-level visit/arrival concept overlaying Published planning.
 * Arrival belongs to the Physical Stop visit, not to each Order attempt.
 */
export type ExecutionStopVisit = {
  /** Physical stop visit keyed by locationId. */
  locationId: string;
  arrivedAtLabel: string;
  verificationMethod: ExecutionGpsVerificationMethod;
  /**
   * Optional operational signals shown when available (presentation only).
   * This is not a fraud-proof rule.
   */
  distanceFromTarget?: number;
  gpsAccuracyM?: number;
  gpsReason?: string;
  driverNote?: string;
};

export type ExecutionOrder = {
  id: string;
  taskId: string;
  locationId: string;
  areaId: string;
  recipient: string;
  phone: string;
  uiStatus: ExecutionUiStatus;
  lastEventLabel: string;
  failureReasonCode?: string;
  driverNote?: string;
  attempts: ExecutionAttempt[];
};

export type ExecutionLocation = {
  id: string;
  areaId: string;
  address: string;
  lat: number;
  lng: number;
};

export type ExecutionArea = {
  id: string;
  name: string;
  color: string;
  driverName: string;
  /**
   * Presentation polygon only. Route/area membership is on location.areaId,
   * never inferred from point-in-polygon.
   */
  polygon: [number, number][];
};

export type ExecutionFollowupNote = {
  id: string;
  orderId: string;
  adminName: string;
  timestampLabel: string;
  note: string;
};

/**
 * Published-revision execution snapshot.
 * Working-revision edits must not replace this while execution is active.
 */
export type ExecutionSnapshot = {
  planId: string;
  publishedRevisionId: string;
  workingRevisionId: string;
  hasUnpublishedWorkingRevision: boolean;
  deliveryWindow: string;
  lastUpdatedLabel: string;
  phase: ExecutionPhase;
  areas: ExecutionArea[];
  locations: ExecutionLocation[];
  stopVisits: ExecutionStopVisit[];
  orders: ExecutionOrder[];
  notes: ExecutionFollowupNote[];
};

export type ExecutionSystemNoticeKind = 'none' | 'network-error' | 'server-error' | 'conflict' | 'recovered';

export type ExecutionLoadErrorKind = 'network' | 'server' | 'conflict' | 'unknown';

export class ExecutionLoadError extends Error {
  readonly kind: ExecutionLoadErrorKind;

  constructor(kind: ExecutionLoadErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = 'ExecutionLoadError';
  }
}

/** Panel navigation — UI state, not Backend enums. */
export type PanelView =
  | { kind: 'areas' }
  | { kind: 'area-detail'; areaId: string }
  | { kind: 'location-detail'; locationId: string }
  | { kind: 'order-detail'; orderId: string; backLocationId: string | null }
  | { kind: 'not-found'; query: string }
  | { kind: 'followup-list' }
  | { kind: 'followup-detail'; orderId: string };

export type AreaFilter = 'all' | 'pending' | 'delivered' | 'followup';

export type ExecutionSummaryCounts = {
  total: number;
  delivered: number;
  pending: number;
  followup: number;
};

export type AreaViewModel = ExecutionArea &
  ExecutionSummaryCounts & {
    execState: AreaExecState;
    completionPct: number;
  };
