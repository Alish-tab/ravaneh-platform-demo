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

export type ReviewTask = {
  id: string;
  name: string;
  phone: string;
  address: string;
  originalValues: {
    address: string;
    latitude: string | null;
    longitude: string | null;
    phone: string;
  };
  coordinates: string | null;
  issues: ReviewIssue[];
  state: ReviewState;
};

export type ReviewTaskUpdate = Pick<ReviewTask, 'name' | 'phone' | 'address'>;

export type ReviewActionKind =
  | 'location'
  | 'information'
  | 'duplicate'
  | 'exclude'
  | 'restore'
  | 'bulk-exclude';

export type ReviewFeedback = {
  tone: 'success' | 'error';
  message: string;
} | null;
