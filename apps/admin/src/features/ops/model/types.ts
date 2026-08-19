/**
 * A05 Operations Home — feature-local view-model types.
 *
 * These are read-model projections derived from existing A01–A04 data.
 * NOT OpenAPI contracts. NOT shared domain types.
 * Replace with generated API types when Backend OpenAPI is available.
 */

/** A05 execution status projected from lifecycle + published state. */
export type OpsExecStatus = 'active' | 'ready' | 'completed' | 'needs-prep';

/** Projected program row for the Programs tab. */
export type OpsProgramRow = {
  planId: string;
  name: string;
  /** Delivery window display string (e.g. "۹ تا ۱۲"). */
  window: string | undefined;
  /** Sortable window key for ordering (hour-based). */
  windowSortKey: number;
  execStatus: OpsExecStatus;
  /** Whether this plan has a published execution snapshot. */
  isPublished: boolean;
  /** Counts from Published execution only. */
  total: number;
  delivered: number;
  pending: number;
  followup: number;
  /** Execution progress: (delivered + followup) / total, 0–100. */
  progressPct: number;
  /** Primary pre-execution issue copy (from existing needsAttention). */
  readinessNote: string | null;
  /** Earliest needed action destination. */
  primaryAction: OpsPrimaryAction | null;
};

/** Navigation destination for a Program's contextual action. */
export type OpsPrimaryAction = {
  label: string;
  /** Relative path: '/plans/:planId/review' | '/plans/:planId/planning' | '/plans/:planId/execution' */
  href: string;
  isWarning: boolean;
};

/** Compact summary for a selected date. */
export type OpsDateSummary = {
  planCount: number;
  isOperational: boolean;
  /** Operational totals (only for published plans). */
  totalOrders: number;
  delivered: number;
  pending: number;
  followup: number;
  /** Preparation counts (all plans). */
  readyCount: number;
  needsPrepCount: number;
};

/** A05 global open follow-up item (cross-plan projection). */
export type OpsFollowupItem = {
  /** Composite key: planId + orderId. */
  id: string;
  orderId: string;
  customer: string;
  planId: string;
  planName: string;
  serviceDate: string;
  window: string | undefined;
  driverName: string | undefined;
  /** Failure reason label (Persian). */
  reason: string;
  /** Days since this follow-up was opened (0 = today). */
  daysPast: number;
  /** Latest note preview — may be absent. */
  latestNote: string | undefined;
};

/** A05 global search result. */
export type OpsSearchResult = {
  orderId: string;
  customer: string;
  planId: string;
  planName: string;
  window: string | undefined;
  areaName: string | undefined;
  driverName: string | undefined;
  uiStatus: 'delivered' | 'pending' | 'followup';
  statusLabel: string;
  failureReason: string | undefined;
};

/** Readiness count for Today's urgent indicator. */
export type OpsTodayBlockerCount = {
  count: number;
};
