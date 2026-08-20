/**
 * Plan-scoped Review fixture data.
 * Tied to the A01 Plan/Dataset spine — not a global REVIEW_TASKS universe.
 */

import type { A01PlanViewModel } from '@/features/plans/a01-types';
import { normalizePhone } from '@/shared/lib/phone';
import { toReviewTask } from '@/features/import-review/review-model';
import type {
  ReviewItem,
  ReviewLocationSource,
  ReviewIssue,
  ReviewState,
  ReviewDataUpdateTag,
  ReviewUpdatedField,
  ReviewDownstreamImpact,
  ReviewTask,
} from '@/features/import-review/review-types';

type ReviewItemSeed = {
  reviewItemId: string;
  externalOrderId?: string;
  importBatchId?: string;
  name: string;
  phone: string;
  address: string;
  rawCustomerName?: string;
  rawPhone: string;
  rawAddress: string;
  rawLatitude: string;
  rawLongitude: string;
  resolvedLat?: number | null;
  resolvedLng?: number | null;
  locSource?: ReviewLocationSource | null;
  issues: ReviewIssue[];
  state: ReviewState;
  dataUpdateTag?: ReviewDataUpdateTag;
  updatedFields?: ReviewUpdatedField[];
  downstreamImpact?: ReviewDownstreamImpact;
  geocodeOutcome?: ReviewItem['geocodeOutcome'];
};

function item(seed: ReviewItemSeed): ReviewItem {
  const resolvedExplicit = seed.resolvedLat !== undefined || seed.resolvedLng !== undefined;
  const resolvedLat = resolvedExplicit ? (seed.resolvedLat ?? null) : null;
  const resolvedLng = resolvedExplicit ? (seed.resolvedLng ?? null) : null;
  return {
    reviewItemId: seed.reviewItemId,
    externalOrderId: seed.externalOrderId ?? seed.reviewItemId,
    importBatchId: seed.importBatchId ?? 'IB-P-2405-latest',
    name: seed.name,
    phone: normalizePhone(seed.phone),
    address: seed.address,
    rawCustomerName: seed.rawCustomerName ?? seed.name,
    rawPhone: seed.rawPhone,
    rawAddress: seed.rawAddress,
    rawLatitude: seed.rawLatitude,
    rawLongitude: seed.rawLongitude,
    resolvedLat,
    resolvedLng,
    locSource:
      seed.locSource ?? (resolvedLat !== null && resolvedLng !== null ? 'source_coords' : null),
    issues: seed.issues,
    state: seed.state,
    overlay: null,
    dataUpdateTag: seed.dataUpdateTag,
    updatedFields: seed.updatedFields,
    downstreamImpact: seed.downstreamImpact ?? 'none',
    geocodeOutcome: seed.geocodeOutcome,
  };
}

/** Primary Review dataset for P-2405. Duplicate pair shares External Order ID D-1048. */
export const P2405_REVIEW_ITEMS: ReviewItem[] = [
  item({
    reviewItemId: 'D-1044',
    name: 'علی حسینی',
    phone: '09127773421',
    address: 'آزادی، پلاک ۲۱۴',
    rawPhone: '09127773421',
    rawAddress: 'خ آزادی پلاک 214',
    rawLatitude: '0',
    rawLongitude: '0',
    resolvedLat: null,
    resolvedLng: null,
    locSource: null,
    issues: ['loc_not_found'],
    state: 'review',
    dataUpdateTag: 'new',
    geocodeOutcome: 'not_found',
    downstreamImpact: 'planning',
  }),
  item({
    reviewItemId: 'D-1046',
    name: 'رضا احمدی',
    phone: '09126602277',
    address: 'انقلاب، پلاک ۶۷',
    rawPhone: '09126602277',
    rawAddress: 'خ انقلاب پلاک 67',
    rawLatitude: '0.0000',
    rawLongitude: '0.0000',
    resolvedLat: null,
    resolvedLng: null,
    locSource: null,
    issues: ['invalid_coords'],
    state: 'error',
    geocodeOutcome: 'not_found',
    downstreamImpact: 'planning',
  }),
  item({
    reviewItemId: 'D-1047',
    name: 'نگین کریمی',
    phone: '021881234',
    address: 'سعدآباد، پلاک ۵',
    rawPhone: '02188001234',
    rawAddress: 'خ سعدآباد پلاک 5',
    rawLatitude: '35.8056',
    rawLongitude: '51.4139',
    resolvedLat: 35.8056,
    resolvedLng: 51.4139,
    locSource: 'source_coords',
    issues: ['phone'],
    state: 'review',
    dataUpdateTag: 'updated',
    updatedFields: ['phone'],
    geocodeOutcome: 'clear',
  }),
  item({
    reviewItemId: 'D-1048',
    externalOrderId: 'D-1048',
    name: 'امیر زاهدی',
    phone: '09354009988',
    address: 'شریعتی، پلاک ۱۲۹',
    rawPhone: '09354009988',
    rawAddress: 'خ شریعتی پلاک 129',
    rawLatitude: '35.7355',
    rawLongitude: '51.4250',
    resolvedLat: 35.7355,
    resolvedLng: 51.425,
    locSource: 'source_coords',
    issues: ['dup_order_id'],
    state: 'review',
    geocodeOutcome: 'clear',
  }),
  item({
    reviewItemId: 'D-1048-b',
    externalOrderId: 'D-1048',
    name: 'امیر زاهدی',
    phone: '09354009988',
    address: 'شریعتی، پلاک ۱۲۹ — ردیف دوم واردات',
    rawCustomerName: 'امیر زاهدی',
    rawPhone: '09354009988',
    rawAddress: 'خ شریعتی پلاک 129 ردیف دوم',
    rawLatitude: '35.7355',
    rawLongitude: '51.4250',
    resolvedLat: 35.7355,
    resolvedLng: 51.425,
    locSource: 'source_coords',
    issues: ['dup_order_id'],
    state: 'review',
    geocodeOutcome: 'clear',
  }),
  item({
    reviewItemId: 'D-1053',
    name: 'لیلا احمدی',
    phone: '09357714488',
    address: 'جردن، پلاک ۲',
    rawPhone: '09357714488',
    rawAddress: 'خ جردن پلاک 2',
    rawLatitude: '35.7638',
    rawLongitude: '51.3500',
    resolvedLat: 35.7638,
    resolvedLng: 51.35,
    locSource: 'source_coords',
    issues: ['loc_mismatch'],
    state: 'review',
    dataUpdateTag: 'updated',
    updatedFields: ['address', 'coords'],
    geocodeOutcome: 'mismatch',
    downstreamImpact: 'planning',
  }),
  item({
    reviewItemId: 'D-1056',
    name: 'کامران نوری',
    phone: '021223344',
    address: 'نواب، پلاک ۱۱',
    rawPhone: '09122345678',
    rawAddress: 'خ نواب پلاک 11',
    rawLatitude: '',
    rawLongitude: '',
    resolvedLat: null,
    resolvedLng: null,
    locSource: null,
    issues: ['loc_ambiguous', 'phone'],
    state: 'review',
    geocodeOutcome: 'ambiguous',
    downstreamImpact: 'planning',
  }),
  item({
    reviewItemId: 'D-1042',
    name: 'صادق رضایی',
    phone: '09123415678',
    address: 'ولیعصر، پلاک ۸۷',
    rawPhone: '09123415678',
    rawAddress: 'خ ولیعصر پلاک 87',
    rawLatitude: '35.7219',
    rawLongitude: '51.3347',
    resolvedLat: 35.7219,
    resolvedLng: 51.3347,
    locSource: 'source_coords',
    issues: [],
    state: 'ready',
    geocodeOutcome: 'clear',
  }),
  item({
    reviewItemId: 'D-1045',
    name: 'مریم صادقی',
    phone: '09352108843',
    address: 'کشاورز، پلاک ۳۳',
    rawPhone: '09352108843',
    rawAddress: 'بلوار کشاورز پلاک 33',
    rawLatitude: '35.7219',
    rawLongitude: '51.3347',
    resolvedLat: 35.7219,
    resolvedLng: 51.3347,
    locSource: 'source_coords',
    issues: ['multi_order_location'],
    state: 'ready',
    geocodeOutcome: 'clear',
  }),
  item({
    reviewItemId: 'D-1055',
    name: 'پریسا موسوی',
    phone: '09126007722',
    address: 'دماوند، پلاک ۳۸',
    rawPhone: '09126007722',
    rawAddress: 'خ دماوند پلاک 38',
    rawLatitude: '35.7501',
    rawLongitude: '51.5100',
    resolvedLat: 35.7501,
    resolvedLng: 51.51,
    locSource: 'source_coords',
    issues: [],
    state: 'excluded',
    geocodeOutcome: 'clear',
  }),
];

export type ReviewPlanStore = {
  working: ReviewItem[];
  published: ReviewItem[] | null;
};

function readOnlySample(planId: string): ReviewItem[] {
  return [
    item({
      reviewItemId: `${planId}-R1`,
      externalOrderId: `${planId}-ORD-1`,
      importBatchId: `IB-${planId}`,
      name: 'نمونه برنامه دیگر',
      phone: '09120000000',
      address: 'آدرس برنامه دیگر',
      rawPhone: '09120000000',
      rawAddress: 'آدرس برنامه دیگر',
      rawLatitude: '35.7000',
      rawLongitude: '51.4000',
      resolvedLat: 35.7,
      resolvedLng: 51.4,
      locSource: 'source_coords',
      issues: [],
      state: 'ready',
    }),
  ];
}

export function createReviewStoreForPlan(
  plan: Pick<A01PlanViewModel, 'id' | 'itemCount' | 'a01Mode' | 'publishedSnapshot'>,
): ReviewPlanStore {
  if (plan.itemCount === 0) {
    return { working: [], published: null };
  }
  if (plan.id === 'P-2405') {
    const working = structuredClone(P2405_REVIEW_ITEMS);
    const shouldFreeze =
      plan.a01Mode === 'published-readonly' ||
      plan.a01Mode === 'execution-locked' ||
      plan.a01Mode === 'completed-readonly' ||
      Boolean(plan.publishedSnapshot);
    return {
      working,
      published: shouldFreeze ? structuredClone(working) : null,
    };
  }
  if (
    plan.a01Mode === 'published-readonly' ||
    plan.a01Mode === 'execution-locked' ||
    plan.a01Mode === 'completed-readonly'
  ) {
    const items = readOnlySample(plan.id);
    return { working: structuredClone(items), published: structuredClone(items) };
  }
  return { working: [], published: null };
}

export function seedReviewStores(
  plans: Array<Pick<A01PlanViewModel, 'id' | 'itemCount' | 'a01Mode' | 'publishedSnapshot'>>,
): Map<string, ReviewPlanStore> {
  const stores = new Map<string, ReviewPlanStore>();
  for (const plan of plans) {
    stores.set(plan.id, createReviewStoreForPlan(plan));
  }
  return stores;
}

export function cloneReviewStore(store: ReviewPlanStore): ReviewPlanStore {
  return {
    working: structuredClone(store.working),
    published: store.published ? structuredClone(store.published) : null,
  };
}

/** @deprecated Compatibility alias — prefer plan-scoped stores. */
export function createReviewFixtureTasks(): ReviewTask[] {
  return structuredClone(P2405_REVIEW_ITEMS).map(toReviewTask);
}
