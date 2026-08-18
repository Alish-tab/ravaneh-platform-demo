/**
 * A02 Review UI view-model types only.
 * NOT product domain contracts and NOT OpenAPI / shared/types/domain.
 */

export type ReviewIssue =
  | 'loc_not_found'
  | 'loc_ambiguous'
  | 'loc_mismatch'
  | 'invalid_coords'
  | 'phone'
  | 'dup_order_id'
  | 'multi_order_location';

export type ReviewIssueFilter = ReviewIssue | 'multiple';

export type ReviewState = 'ready' | 'review' | 'error' | 'excluded';
export type ReviewTab = 'all' | 'ready' | 'action' | 'excluded';
export type ReviewCounts = Record<ReviewTab, number>;

export type ReviewLocationSource = 'source_coords' | 'geocoded' | 'manual';

export type ReviewDataUpdateTag = 'new' | 'updated';
export type ReviewUpdatedField = 'phone' | 'name' | 'address' | 'coords';
export type ReviewDownstreamImpact = 'none' | 'planning';

export type ReviewOverlay = 'saving' | 'save-failed' | 'recently-resolved' | null;

export type ReviewLatLng = { lat: number; lng: number };

/**
 * Feature-local Review row.
 * `reviewItemId` is the unique UI/import-row identity.
 * `externalOrderId` is the business Order ID (string). Duplicates share it.
 */
export type ReviewItem = {
  reviewItemId: string;
  externalOrderId: string;
  importBatchId?: string;

  name: string;
  phone: string;
  address: string;

  rawCustomerName: string;
  rawPhone: string;
  rawAddress: string;
  rawLatitude: string;
  rawLongitude: string;

  resolvedLat: number | null;
  resolvedLng: number | null;
  locSource: ReviewLocationSource | null;

  issues: ReviewIssue[];
  state: ReviewState;
  overlay?: ReviewOverlay;

  dataUpdateTag?: ReviewDataUpdateTag;
  updatedFields?: ReviewUpdatedField[];
  downstreamImpact: ReviewDownstreamImpact;

  /** Fixture-local geocoding outcome. Not a network call and not a Backend enum. */
  geocodeOutcome?: 'clear' | 'ambiguous' | 'not_found' | 'mismatch' | 'skipped';
  duplicateDecision?: 'both_valid' | 'exclude_current';
};

/** @deprecated Use ReviewItem. Kept as alias during migration of local names. */
export type ReviewTask = ReviewItem & { id: string };

export type ReviewTaskUpdate = {
  name: string;
  phone: string;
  address: string;
};

export type ReviewActionKind =
  | 'location'
  | 'information'
  | 'duplicate'
  | 'exclude'
  | 'restore'
  | 'bulk-exclude'
  | 'bulk-restore';

export type ReviewMutationKind = 'information' | 'location' | 'exclude' | 'restore' | 'duplicate';

export type ReviewItemPatch = {
  name?: string;
  phone?: string;
  address?: string;
  resolvedLat?: number | null;
  resolvedLng?: number | null;
  locSource?: ReviewLocationSource | null;
  issues?: ReviewIssue[];
  state?: ReviewState;
  overlay?: ReviewOverlay;
  duplicateDecision?: ReviewItem['duplicateDecision'];
};

export type ReviewFeedback = {
  tone: 'success' | 'error' | 'warning';
  message: string;
} | null;

export type ReviewBulkResult = {
  succeededIds: string[];
  failedIds: string[];
};

export function isZeroCoordinate(lat: string, lng: string): boolean {
  const a = Number.parseFloat(lat);
  const b = Number.parseFloat(lng);
  return Number.isFinite(a) && Number.isFinite(b) && a === 0 && b === 0;
}
