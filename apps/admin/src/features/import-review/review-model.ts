/**
 * Feature-local Review helpers. Presentation/fixture logic only — not Backend rules.
 */

import type { A01PlanViewModel } from '@/features/plans/a01-types';

import {
  isZeroCoordinate,
  type ReviewIssue,
  type ReviewItem,
  type ReviewLatLng,
  type ReviewLocationSource,
  type ReviewState,
  type ReviewTask,
} from '@/features/import-review/review-types';
import { REVIEW_ISSUE_SEVERITY } from '@/features/import-review/presentation';

export const REVIEW_FIXTURE_FAILURE_VALUE = 'fixture:error';
export const REVIEW_TEST_PROPOSED_LOCATION: ReviewLatLng = { lat: 35.7, lng: 51.4 };

const BLOCKING_LOCATION_ISSUES: ReviewIssue[] = [
  'loc_not_found',
  'loc_ambiguous',
  'loc_mismatch',
  'invalid_coords',
];

export function toReviewTask(item: ReviewItem): ReviewTask {
  return { ...item, id: item.reviewItemId };
}

export function formatLatLng(coords: ReviewLatLng, digits = 4): string {
  return `${coords.lat.toFixed(digits)}, ${coords.lng.toFixed(digits)}`;
}

export function formatResolvedLocation(item: ReviewItem): string | null {
  if (item.resolvedLat === null || item.resolvedLng === null) return null;
  return formatLatLng({ lat: item.resolvedLat, lng: item.resolvedLng });
}

export function rawSourceLocation(item: ReviewItem): ReviewLatLng | null {
  if (!item.rawLatitude.trim() || !item.rawLongitude.trim()) return null;
  if (isZeroCoordinate(item.rawLatitude, item.rawLongitude)) return null;
  const lat = Number.parseFloat(item.rawLatitude);
  const lng = Number.parseFloat(item.rawLongitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function savedLocation(item: ReviewItem): ReviewLatLng | null {
  if (item.resolvedLat === null || item.resolvedLng === null) return null;
  if (item.resolvedLat === 0 && item.resolvedLng === 0) return null;
  return { lat: item.resolvedLat, lng: item.resolvedLng };
}

export function stateFromIssues(issues: ReviewIssue[]): ReviewState {
  if (issues.some((issue) => REVIEW_ISSUE_SEVERITY[issue].severity === 'blocking')) return 'error';
  if (issues.some((issue) => REVIEW_ISSUE_SEVERITY[issue].severity === 'review')) return 'review';
  return 'ready';
}

export function hasLocationIssue(item: ReviewItem): boolean {
  return item.issues.some((issue) => BLOCKING_LOCATION_ISSUES.includes(issue));
}

export function duplicatePeers(items: ReviewItem[], item: ReviewItem): ReviewItem[] {
  return items.filter(
    (candidate) =>
      candidate.reviewItemId !== item.reviewItemId &&
      candidate.externalOrderId === item.externalOrderId &&
      candidate.state !== 'excluded',
  );
}

export function isSameOrderDuplicate(a: ReviewItem, b: ReviewItem): boolean {
  return a.reviewItemId !== b.reviewItemId && a.externalOrderId === b.externalOrderId;
}

export function normalizeSearchValue(value: string): string {
  return value.replace(/[\s-]/g, '').toLocaleLowerCase('fa');
}

export function matchesReviewSearch(item: ReviewItem, query: string): boolean {
  const normalized = normalizeSearchValue(query);
  if (!normalized) return true;
  return [
    item.reviewItemId,
    item.externalOrderId,
    item.name,
    item.phone,
    item.address,
    item.rawPhone,
    item.rawAddress,
    item.rawCustomerName,
  ].some((value) => normalizeSearchValue(value).includes(normalized));
}

export function locationSourceLabel(source: ReviewLocationSource | null): string {
  switch (source) {
    case 'source_coords':
      return 'مختصات مبدأ';
    case 'geocoded':
      return 'مکان‌یابی نشانی';
    case 'manual':
      return 'اصلاح دستی';
    default:
      return 'نامشخص';
  }
}

export function canMutateReview(plan: A01PlanViewModel | null | undefined): boolean {
  if (!plan) return false;
  if (!plan.canMutateDataset) return false;
  return plan.a01Mode === 'editable' || plan.a01Mode === 'working';
}

export function isPublishedReviewView(plan: A01PlanViewModel | null | undefined): boolean {
  return plan?.a01Mode === 'published-readonly';
}

export function isHistoricalReviewView(plan: A01PlanViewModel | null | undefined): boolean {
  return plan?.a01Mode === 'completed-readonly' || plan?.a01Mode === 'execution-locked';
}

export function stripLocationIssues(issues: ReviewIssue[]): ReviewIssue[] {
  return issues.filter((issue) => !BLOCKING_LOCATION_ISSUES.includes(issue));
}
