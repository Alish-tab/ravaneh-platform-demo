/**
 * Fixture-local Programs query: search → view filter → sort → grouped pagination.
 * Not a Backend query contract. Page size 15 is the Product baseline.
 */
import type { A01PlanViewModel, PlansQueryInput, PlansQueryResult } from '@/features/plans/a01-types';
import { addJalaliDay } from '@/features/plans/plan-name';
import { A01_DELIVERY_WINDOWS } from '@/features/plans/presentation';
import { toPersianDigits } from '@/shared/lib/format';

export const PROGRAMS_PAGE_SIZE = 15;

export type DateGroupKind = 'today' | 'tomorrow' | 'future' | 'past';

export type PlanDateSection = {
  key: string;
  kind: DateGroupKind;
  label: string;
  plans: A01PlanViewModel[];
};

const WINDOW_ORDER = new Map(A01_DELIVERY_WINDOWS.map((window, index) => [window, index]));

export function matchesPlanSearch(plan: A01PlanViewModel, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return plan.name.toLowerCase().includes(q) || plan.id.toLowerCase().includes(q);
}

export function sortPlansByServiceDate(plans: A01PlanViewModel[], direction: 'asc' | 'desc'): A01PlanViewModel[] {
  return [...plans].sort((a, b) => {
    const dateDiff =
      direction === 'asc'
        ? a.serviceDateSortKey.localeCompare(b.serviceDateSortKey)
        : b.serviceDateSortKey.localeCompare(a.serviceDateSortKey);
    if (dateDiff !== 0) return dateDiff;
    const windowA = WINDOW_ORDER.get((a.window ?? '') as (typeof A01_DELIVERY_WINDOWS)[number]) ?? 99;
    const windowB = WINDOW_ORDER.get((b.window ?? '') as (typeof A01_DELIVERY_WINDOWS)[number]) ?? 99;
    return windowA - windowB;
  });
}

function groupKind(sortKey: string, referenceDate: string): DateGroupKind {
  if (sortKey === referenceDate) return 'today';
  if (sortKey === addJalaliDay(referenceDate, 1)) return 'tomorrow';
  if (sortKey > referenceDate) return 'future';
  return 'past';
}

function formatJalaliLabel(sortKey: string): string {
  const [, month, day] = sortKey.split('-');
  const months = [
    '',
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ];
  const monthIndex = Number.parseInt(month ?? '', 10);
  const dayNum = Number.parseInt(day ?? '', 10);
  return `${toPersianDigits(dayNum)} ${months[monthIndex] ?? ''}`.trim();
}

export function buildDateSections(
  plans: A01PlanViewModel[],
  referenceDate: string,
): PlanDateSection[] {
  const buckets = new Map<string, PlanDateSection>();
  const order: DateGroupKind[] = ['today', 'tomorrow', 'future', 'past'];

  for (const kind of order) {
    const kindPlans = sortPlansByServiceDate(
      plans.filter((plan) => groupKind(plan.serviceDateSortKey, referenceDate) === kind),
      kind === 'past' ? 'desc' : 'asc',
    );
    if (kind === 'future') {
      const byDate = new Map<string, A01PlanViewModel[]>();
      for (const plan of kindPlans) {
        const list = byDate.get(plan.serviceDateSortKey) ?? [];
        list.push(plan);
        byDate.set(plan.serviceDateSortKey, list);
      }
      for (const [key, datePlans] of byDate) {
        buckets.set(`future-${key}`, {
          key: `future-${key}`,
          kind: 'future',
          label: formatJalaliLabel(key),
          plans: datePlans,
        });
      }
      continue;
    }
    if (!kindPlans.length) continue;
    const sample = kindPlans[0]!;
    const dateLabel = formatJalaliLabel(sample.serviceDateSortKey);
    const label = kind === 'past' ? 'گذشته' : dateLabel;
    buckets.set(kind, { key: kind, kind, label, plans: kindPlans });
  }

  return [...buckets.values()];
}

export function paginateSections(
  sections: PlanDateSection[],
  page: number,
  pageSize: number,
): {
  pageSections: PlanDateSection[];
  pageCount: number;
  page: number;
  itemsOnPage: number;
  totalItems: number;
  itemsBefore: number;
} {
  const pages: PlanDateSection[][] = [];
  let current: PlanDateSection[] = [];
  let count = 0;
  for (const section of sections) {
    if (count > 0 && count + section.plans.length > pageSize) {
      pages.push(current);
      current = [];
      count = 0;
    }
    current.push(section);
    count += section.plans.length;
  }
  if (current.length) pages.push(current);
  const pageCount = Math.max(1, pages.length);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const pageSections = pages[safePage - 1] ?? [];
  return {
    pageSections,
    pageCount,
    page: safePage,
    itemsOnPage: pageSections.reduce((sum, section) => sum + section.plans.length, 0),
    totalItems: sections.reduce((sum, section) => sum + section.plans.length, 0),
    itemsBefore: pages.slice(0, safePage - 1).reduce(
      (sum, pageSections) => sum + pageSections.reduce((inner, section) => inner + section.plans.length, 0),
      0,
    ),
  };
}

/**
 * Grouped pagination keeps each date section on one page.
 * A page may therefore contain slightly more or fewer than `pageSize`
 * when a group would otherwise split. Product baseline remains 15.
 */
export function queryGroupedPlans(
  plans: A01PlanViewModel[],
  input: PlansQueryInput,
  referenceDate: string,
): PlansQueryResult & {
  pageSections: PlanDateSection[];
  sections: PlanDateSection[];
  startItem: number;
  endItem: number;
} {
  const preparing = plans.filter((plan) => plan.isPreparing);
  const scoped = input.view === 'preparing' ? preparing : plans;
  const searched = scoped.filter((plan) => matchesPlanSearch(plan, input.search ?? ''));
  const pageSize = input.pageSize || PROGRAMS_PAGE_SIZE;
  const sections = buildDateSections(searched, referenceDate);
  const paged = paginateSections(sections, input.page, pageSize);
  return {
    items: paged.pageSections.flatMap((section) => section.plans),
    total: searched.length,
    preparingCount: preparing.length,
    allCount: plans.length,
    page: paged.page,
    pageSize,
    pageCount: paged.pageCount,
    pageSections: paged.pageSections,
    sections,
    startItem: searched.length === 0 ? 0 : paged.itemsBefore + 1,
    endItem: paged.itemsBefore + paged.itemsOnPage,
  };
}

export function queryPlansFromList(
  plans: A01PlanViewModel[],
  input: PlansQueryInput,
): PlansQueryResult {
  const preparing = plans.filter((plan) => plan.isPreparing);
  const scoped = input.view === 'preparing' ? preparing : plans;
  const searched = scoped.filter((plan) => matchesPlanSearch(plan, input.search ?? ''));
  const pageSize = input.pageSize || PROGRAMS_PAGE_SIZE;
  const sorted = sortPlansByServiceDate(searched, 'asc');
  const start = (Math.max(1, input.page) - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);
  const total = searched.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const page = Math.min(Math.max(1, input.page), pageCount);
  return {
    items,
    total,
    preparingCount: preparing.length,
    allCount: plans.length,
    page,
    pageSize,
    pageCount,
  };
}
