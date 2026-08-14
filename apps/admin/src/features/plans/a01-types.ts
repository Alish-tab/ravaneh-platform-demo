/**
 * A01 UI / ViewModel types only.
 * NOT product domain contracts and NOT OpenAPI / shared/types/domain.
 * Replace with generated API types when Backend OpenAPI is available.
 */

/** Presentation stage keys from A01 design (workflow UI, not SQL enums). */
export type A01StageKey = 'intake' | 'review' | 'planning' | 'execution';

/**
 * Presentation status keys used by A01 fixture / list UI.
 * Deliberately NOT aligned 1:1 with SQL review-candidate `plans.status`
 * (draft/reviewing/ready/…). Do not promote these into shared domain.
 */
export type A01PresentationStatus =
  | 'draft'
  | 'uploading'
  | 'process'
  | 'intake_failed'
  | 'review'
  | 'ready'
  | 'planning_active'
  | 'active'
  | 'done';

export type A01DownstreamRisk = 'none' | 'planning' | 'published';

export type A01StructuralErrorKind =
  | 'unreadable'
  | 'empty'
  | 'missing-columns'
  | 'network'
  | 'duplicate-file';

/** Parsed summary shown in A01 only — issue resolution belongs to A02. */
export type A01ParseSummary = {
  totalRows: number;
  importedCount: number;
  locationReviewCount: number;
  duplicateOrderIdCount: number;
  otherReviewCount: number;
};

export type A01ImportedFile = {
  name: string;
  uploadedAt: string;
  rowCount: number;
  /** Optional fixture summary after parse; not an API contract. */
  parseSummary?: A01ParseSummary;
  parseOutcome?: 'clean' | 'needs_review';
};

export type A01PlanViewModel = {
  id: string;
  name: string;
  /** Presentation date string (e.g. Persian display). Not a Backend DATE serialization. */
  deliveryDate: string;
  window?: string;
  currentStage: A01StageKey;
  status: A01PresentationStatus;
  itemCount?: number;
  lastChanged: string;
  importedFile?: A01ImportedFile;
};

export type A01CreatePlanInput = {
  name: string;
  deliveryDate: string;
  window?: string;
};

export type A01ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; plans: A01PlanViewModel[] };
