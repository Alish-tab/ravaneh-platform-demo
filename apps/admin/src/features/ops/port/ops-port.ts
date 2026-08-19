/**
 * A05 OperationsHomePort — aggregation interface.
 *
 * Aggregates data from Plans/A01, A02 Review, A03 Planning, and A04 Execution.
 * This is a Frontend fixture interface — NOT a Backend API contract.
 * Do NOT add this to shared/types/domain.ts.
 */

import type { PlansDataPort } from '@/features/plans/fixture/plans-fixture';
import type { ExecutionDataPort } from '@/features/execution/data/port';
import type {
  OpsDateSummary,
  OpsFollowupItem,
  OpsProgramRow,
  OpsSearchResult,
} from '@/features/ops/model/types';
import { UI_STATUS_LABEL, failureReasonLabel } from '@/features/execution/model/presentation';
import type { A01PlanViewModel } from '@/features/plans/a01-types';
import { toServiceDateSortKey } from '@/features/plans/plan-name';

/**
 * Derive window sort key from delivery window string.
 * e.g. "۹ تا ۱۲" → 900
 * Falls back to 9999 for deterministic ordering.
 */
function windowToSortKey(window: string | undefined): number {
  if (!window) return 9999;
  const latin = window.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const match = latin.match(/\d+/);
  if (!match) return 9999;
  return Number(match[0]) * 100;
}

function deriveExecStatus(plan: A01PlanViewModel, isPublished: boolean): import('@/features/ops/model/types').OpsExecStatus {
  if (!isPublished) return 'needs-prep';
  if (plan.lifecycle === 'completed') return 'completed';
  if (plan.lifecycle === 'inProgress') return 'active';
  return 'ready';
}

export type OpsHomePort = {
  subscribe: (listener: () => void) => () => void;
  getVersion: () => number;
  /**
   * Programs for a service date (Jalali sort key: "YYYY-MM-DD").
   * Returns plans whose serviceDateSortKey matches the provided key.
   */
  getProgramsForDate: (sortKey: string) => Promise<OpsProgramRow[]>;
  /** Summary metrics for a service date. */
  getSummaryForDate: (sortKey: string) => Promise<OpsDateSummary>;
  /** Count of today's preparation blockers (for urgent-today indicator). */
  getTodayBlockerCount: (todaySortKey: string) => Promise<number>;
  /** Global open follow-up backlog (cross-plan, not date-filtered). */
  getOpenFollowups: () => Promise<OpsFollowupItem[]>;
  /** Global cross-plan Order search by External Order ID. */
  searchOrder: (query: string) => Promise<OpsSearchResult[]>;
};

export function createOpsHomePort(
  plansPort: PlansDataPort,
  executionPort: ExecutionDataPort,
): OpsHomePort {
  let version = 0;
  const listeners = new Set<() => void>();

  const unsubPlans = plansPort.subscribe(() => {
    version += 1;
    listeners.forEach((l) => l());
  });
  const unsubExec = executionPort.subscribe(() => {
    version += 1;
    listeners.forEach((l) => l());
  });

  void unsubPlans;
  void unsubExec;

  async function getPlansForDateKey(sortKey: string): Promise<A01PlanViewModel[]> {
    const all = await plansPort.listPlans();
    return all.filter((p) => toServiceDateSortKey(p.deliveryDate) === sortKey);
  }

  async function buildProgramRow(plan: A01PlanViewModel): Promise<OpsProgramRow> {
    const published = plansPort.getPublishedPlanningState(plan.id);
    const isPublished = !!published;

    let total = 0;
    let delivered = 0;
    let pending = 0;
    let followup = 0;

    if (isPublished) {
      try {
        const snapshot = await executionPort.getSnapshot(plan.id);
        if (snapshot) {
          for (const order of snapshot.orders) {
            total++;
            if (order.uiStatus === 'delivered') delivered++;
            else if (order.uiStatus === 'followup') followup++;
            else pending++;
          }
        }
      } catch {
        // No snapshot yet — leave counts at zero.
      }
    }

    const progressPct =
      total > 0 ? Math.round(((delivered + followup) / total) * 100) : 0;

    const execStatus = deriveExecStatus(plan, isPublished);

    let primaryAction: import('@/features/ops/model/types').OpsPrimaryAction | null = null;
    if (plan.suggestedSection === 'review' && plan.needsAttention) {
      primaryAction = {
        label: 'بررسی داده‌ها',
        href: `/plans/${plan.id}/review`,
        isWarning: true,
      };
    } else if (
      plan.suggestedSection === 'planning' ||
      (!isPublished && plan.lifecycle !== 'draft')
    ) {
      primaryAction = {
        label: 'تکمیل برنامه‌ریزی',
        href: `/plans/${plan.id}/planning`,
        isWarning: !!plan.needsAttention,
      };
    } else if (plan.lifecycle === 'draft' && plan.suggestedSection === 'intake') {
      primaryAction = {
        label: 'ورود داده',
        href: `/plans/${plan.id}/intake`,
        isWarning: !!plan.needsAttention,
      };
    }

    return {
      planId: plan.id,
      name: plan.name,
      window: plan.window,
      windowSortKey: windowToSortKey(plan.window),
      execStatus,
      isPublished,
      total,
      delivered,
      pending,
      followup,
      progressPct,
      readinessNote: plan.needsAttention,
      primaryAction,
    };
  }

  async function getProgramsForDate(sortKey: string): Promise<OpsProgramRow[]> {
    const plans = await getPlansForDateKey(sortKey);
    const rows = await Promise.all(plans.map(buildProgramRow));
    return rows;
  }

  async function getSummaryForDate(sortKey: string): Promise<OpsDateSummary> {
    const rows = await getProgramsForDate(sortKey);
    const publishedRows = rows.filter((r) => r.isPublished);
    const isOperational = publishedRows.some(
      (r) => r.execStatus === 'active' || r.execStatus === 'completed',
    );

    return {
      planCount: rows.length,
      isOperational,
      totalOrders: publishedRows.reduce((s, r) => s + r.total, 0),
      delivered: publishedRows.reduce((s, r) => s + r.delivered, 0),
      pending: publishedRows.reduce((s, r) => s + r.pending, 0),
      followup: publishedRows.reduce((s, r) => s + r.followup, 0),
      readyCount: rows.filter((r) => r.isPublished).length,
      needsPrepCount: rows.filter((r) => !r.isPublished).length,
    };
  }

  async function getTodayBlockerCount(todaySortKey: string): Promise<number> {
    const plans = await getPlansForDateKey(todaySortKey);
    return plans.filter(
      (p) => !!p.needsAttention || !plansPort.getPlanningPublishReadiness(p.id).canPublish,
    ).length;
  }

  async function getOpenFollowups(): Promise<OpsFollowupItem[]> {
    const all = await plansPort.listPlans();
    const items: OpsFollowupItem[] = [];

    for (const plan of all) {
      try {
        const snapshot = await executionPort.getSnapshot(plan.id);
        if (!snapshot) continue;

        const followupOrders = snapshot.orders.filter((o) => o.uiStatus === 'followup');
        for (const order of followupOrders) {
          const area = snapshot.areas.find((a) => a.id === order.areaId);
          const latestNote = snapshot.notes
            .filter((n) => n.orderId === order.id)
            .at(-1);

          items.push({
            id: `${plan.id}:${order.id}`,
            orderId: order.id,
            customer: order.recipient,
            planId: plan.id,
            planName: plan.name,
            serviceDate: plan.deliveryDate,
            window: plan.window,
            driverName: area?.driverName,
            reason: failureReasonLabel(order.failureReasonCode),
            daysPast: 0, // Default — fixture metadata if available
            latestNote: latestNote?.note,
          });
        }
      } catch {
        continue;
      }
    }

    return items;
  }

  async function searchOrder(query: string): Promise<OpsSearchResult[]> {
    if (!query.trim()) return [];
    const all = await plansPort.listPlans();
    const results: OpsSearchResult[] = [];

    for (const plan of all) {
      try {
        const snapshot = await executionPort.getSnapshot(plan.id);
        if (!snapshot) continue;

        for (const order of snapshot.orders) {
          if (!order.id.includes(query.trim())) continue;
          const area = snapshot.areas.find((a) => a.id === order.areaId);
          results.push({
            orderId: order.id,
            customer: order.recipient,
            planId: plan.id,
            planName: plan.name,
            window: plan.window,
            areaName: area?.name,
            driverName: area?.driverName,
            uiStatus: order.uiStatus,
            statusLabel: UI_STATUS_LABEL[order.uiStatus],
            failureReason: order.failureReasonCode
              ? failureReasonLabel(order.failureReasonCode)
              : undefined,
          });
        }
      } catch {
        continue;
      }
    }

    return results;
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getVersion: () => version,
    getProgramsForDate,
    getSummaryForDate,
    getTodayBlockerCount,
    getOpenFollowups,
    searchOrder,
  };
}
