/**
 * A01 / Programs UI view-model types only.
 * NOT product domain contracts and NOT OpenAPI / shared/types/domain.
 * Replace with generated API types when Backend OpenAPI is available.
 */

/** Plan workspace section keys — routing, not lifecycle. */
export type A01StageKey = 'intake' | 'review' | 'planning' | 'execution';

/**
 * Feature-local Plan lifecycle. Independent from active section / URL / currentStage.
 * Not a Backend enum.
 */
export type PlanLifecycle =
  | 'draft'
  | 'readyToPublish'
  | 'published'
  | 'inProgress'
  | 'completed';

export type PlanA01Mode =
  | 'editable'
  | 'published-readonly'
  | 'working'
  | 'execution-locked'
  | 'completed-readonly';

export type PlansListView = 'preparing' | 'all';

export type MergeStrategy = 'add-only' | 'update-preserve' | 'full-replace';

/**
 * @deprecated TEMPORARY mixed presentation status for A02/A03 fixture compatibility.
 * Programs and PlanContextHeader must not treat this as Product lifecycle.
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
  | 'invalid-type';

/** Parsed summary shown during Intake only — issue resolution belongs to Review. */
export type A01ParseSummary = {
  totalRows: number;
  importedCount: number;
  locationReviewCount: number;
  duplicateOrderIdCount: number;
  otherReviewCount: number;
};

/**
 * @deprecated TEMPORARY derived compatibility for A02/A03 consumers.
 * Source of truth for A01 is `importBatches`.
 */
export type A01ImportedFile = {
  name: string;
  uploadedAt: string;
  rowCount: number;
  parseSummary?: A01ParseSummary;
  parseOutcome?: 'clean' | 'needs_review';
};

/** Independent import batch — filename is not identity. Fixture-local, not Backend schema. */
export type ImportBatchViewModel = {
  id: string;
  filename: string;
  uploadedAt: string;
  rowCount: number;
  result: 'clean' | 'needs_review' | 'structural_failed' | 'processing';
  parseSummary?: A01ParseSummary;
};

export type DatasetDiffViewModel = {
  newCount: number;
  changedCount: number;
  unchangedCount: number;
  missingCount: number;
};

export type A01PlanViewModel = {
  id: string;
  name: string;
  /** Presentation date string (Persian display). Not a Backend DATE serialization. */
  deliveryDate: string;
  window?: string;
  /** Jalali sortable key `YYYY-MM-DD`. Fixture-local sort value, not Backend DATE. */
  serviceDateSortKey: string;
  lastChanged: string;
  itemCount?: number;

  lifecycle: PlanLifecycle;
  /** Explicit Programs "Needs Attention" copy. Null when none. */
  needsAttention: string | null;
  /** Optional preparing-view CTA. Explicit fixture copy, not derived in UI. */
  attentionActionLabel?: string | null;
  isPreparing: boolean;
  /** Explicit row-navigation destination. Not derived from currentStage in UI. */
  suggestedSection: A01StageKey;

  canEditMetadata: boolean;
  canDeleteDraft: boolean;
  canMutateDataset: boolean;
  hasWorkingVersion: boolean;
  a01Mode: PlanA01Mode;

  importBatches: ImportBatchViewModel[];
  publishedSnapshot?: {
    itemCount?: number;
    importBatches: ImportBatchViewModel[];
  };

  /**
   * @deprecated TEMPORARY A02/A03 compatibility. Not Product truth for Programs/A01.
   */
  currentStage: A01StageKey;
  /**
   * @deprecated TEMPORARY mixed presentation status for A02/A03.
   */
  status: A01PresentationStatus;
  /**
   * @deprecated Derived from the latest successful import batch for A02/A03.
   */
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

export type PlansQueryInput = {
  search?: string;
  view: PlansListView;
  page: number;
  pageSize: number;
};

export type PlansQueryResult = {
  items: A01PlanViewModel[];
  total: number;
  preparingCount: number;
  allCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
};
