import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isActiveReviewIssue } from '@/features/import-review/presentation';
import {
  canMutateReview,
  matchesReviewSearch,
  toReviewTask,
} from '@/features/import-review/review-model';
import type {
  ReviewActionKind,
  ReviewCounts,
  ReviewFeedback,
  ReviewIssueFilter,
  ReviewLatLng,
  ReviewTab,
  ReviewTask,
  ReviewTaskUpdate,
} from '@/features/import-review/review-types';
import type { A01PlanViewModel } from '@/features/plans/a01-types';
import { usePlansDataPort, usePlansFixtureVersion } from '@/features/plans/fixture/usePlansFixture';

export { REVIEW_FIXTURE_FAILURE_VALUE } from '@/features/import-review/review-model';

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === 'REVIEW_CONFLICT') {
    return 'این مورد در جای دیگری تغییر کرده است. اطلاعات جدید را دریافت کنید.';
  }
  if (error instanceof Error && error.message === 'REVIEW_READONLY') {
    return 'این نسخه فقط خواندنی است.';
  }
  return fallback;
}

export function useReviewFixture(plan: A01PlanViewModel | null) {
  const port = usePlansDataPort();
  const version = usePlansFixtureVersion();
  const planId = plan?.id;
  const initializedInspect = useRef(false);
  const loadedPlanId = useRef<string | null>(null);

  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<ReviewTab>('action');
  const [activeIssues, setActiveIssues] = useState<ReviewIssueFilter[]>([]);
  const [search, setSearch] = useState('');
  const [recentOnly, setRecentOnly] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    kind: ReviewActionKind;
    ids: string[];
  } | null>(null);
  const [feedback, setFeedback] = useState<ReviewFeedback>(null);
  const [recentlyResolvedIds, setRecentlyResolvedIds] = useState<string[]>([]);
  const [conflict, setConflict] = useState(false);

  const readOnly = !canMutateReview(plan);

  const reload = useCallback(async () => {
    if (!planId) {
      setTasks([]);
      setLoadStatus('loading');
      return;
    }
    try {
      const items = await port.listReviewItems(planId);
      const next = items.map(toReviewTask);
      loadedPlanId.current = planId;
      setTasks(next);
      setLoadStatus('ready');
      setInspectedId((current) => {
        if (!initializedInspect.current) {
          initializedInspect.current = true;
          return next[0]?.id ?? null;
        }
        if (current && next.some((task) => task.id === current)) return current;
        return current;
      });
    } catch {
      setLoadStatus('error');
    }
  }, [planId, port]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!planId) return;
      if (loadedPlanId.current !== planId) {
        initializedInspect.current = false;
      }
      try {
        const items = await port.listReviewItems(planId);
        if (cancelled) return;
        const next = items.map(toReviewTask);
        loadedPlanId.current = planId;
        setTasks(next);
        setLoadStatus('ready');
        setInspectedId((current) => {
          if (!initializedInspect.current) {
            initializedInspect.current = true;
            return next[0]?.id ?? null;
          }
          if (current && next.some((task) => task.id === current)) return current;
          return current;
        });
      } catch {
        if (!cancelled) setLoadStatus('error');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [planId, port, version]);

  const counts = useMemo<ReviewCounts>(
    () => ({
      all: tasks.length,
      ready: tasks.filter((task) => task.state === 'ready').length,
      action: tasks.filter((task) => task.state === 'review' || task.state === 'error').length,
      excluded: tasks.filter((task) => task.state === 'excluded').length,
    }),
    [tasks],
  );

  const issueCounts = useMemo<Record<ReviewIssueFilter, number>>(() => {
    const included = tasks.filter((task) => task.state !== 'excluded');
    const count = (issue: ReviewIssueFilter) =>
      included.filter((task) =>
        issue === 'multiple'
          ? task.issues.filter(isActiveReviewIssue).length >= 2
          : task.issues.includes(issue),
      ).length;
    return {
      loc_not_found: count('loc_not_found'),
      loc_ambiguous: count('loc_ambiguous'),
      loc_mismatch: count('loc_mismatch'),
      invalid_coords: count('invalid_coords'),
      phone: count('phone'),
      dup_order_id: count('dup_order_id'),
      multi_order_location: count('multi_order_location'),
      multiple: count('multiple'),
    };
  }, [tasks]);

  const recentCount = useMemo(
    () => tasks.filter((task) => Boolean(task.dataUpdateTag) && task.state !== 'excluded').length,
    [tasks],
  );

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (recentOnly && !task.dataUpdateTag) return false;
      if (activeTab === 'ready' && task.state !== 'ready') return false;
      if (activeTab === 'action' && task.state !== 'review' && task.state !== 'error') return false;
      if (activeTab === 'excluded' && task.state !== 'excluded') return false;
      if (activeIssues.length > 0) {
        const matchesIssue = activeIssues.some((issue) =>
          issue === 'multiple'
            ? task.issues.filter(isActiveReviewIssue).length >= 2
            : task.issues.includes(issue),
        );
        if (!matchesIssue) return false;
      }
      if (search.trim() && !matchesReviewSearch(task, search)) return false;
      return true;
    });
  }, [activeIssues, activeTab, recentOnly, search, tasks]);

  const inspectedTask = visibleTasks.find((task) => task.id === inspectedId) ?? null;
  const checkedTasks = checkedIds.flatMap((id) => {
    const task = tasks.find((candidate) => candidate.id === id);
    return task ? [task] : [];
  });
  const visibleIds = visibleTasks.map((task) => task.id);
  const allVisibleChecked =
    visibleIds.length > 0 && visibleIds.every((id) => checkedIds.includes(id));
  const someVisibleChecked = visibleIds.some((id) => checkedIds.includes(id));
  const canContinue = counts.action === 0;
  const hasActiveFilters = activeIssues.length > 0 || Boolean(search.trim()) || recentOnly;

  const toggleChecked = (id: string) => {
    setCheckedIds((current) =>
      current.includes(id) ? current.filter((candidate) => candidate !== id) : [...current, id],
    );
  };

  const toggleAllVisible = () => {
    setCheckedIds((current) => {
      if (allVisibleChecked) return current.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const toggleIssue = (issue: ReviewIssueFilter) => {
    setActiveIssues((current) =>
      current.includes(issue) ? current.filter((item) => item !== issue) : [...current, issue],
    );
  };

  const clearFilters = () => {
    setActiveIssues([]);
    setSearch('');
    setRecentOnly(false);
  };

  const markRecentlyResolved = (ids: string[]) => {
    setRecentlyResolvedIds((current) => Array.from(new Set([...current, ...ids])));
  };

  const runMutation = async (
    kind: ReviewActionKind,
    ids: string[],
    mutate: () => Promise<void>,
    successMessage: string,
    failureFallback: string,
  ) => {
    if (!planId || readOnly) return false;
    setFeedback(null);
    setConflict(false);
    setPendingAction({ kind, ids });
    try {
      await mutate();
      markRecentlyResolved(ids);
      setFeedback({ tone: 'success', message: successMessage });
      setPendingAction(null);
      return true;
    } catch (error) {
      const isConflict = error instanceof Error && error.message === 'REVIEW_CONFLICT';
      if (isConflict) setConflict(true);
      setFeedback({
        tone: isConflict ? 'warning' : 'error',
        message: errorMessage(error, failureFallback),
      });
      setPendingAction(null);
      return false;
    }
  };

  const exclude = async (ids: string[]) => {
    if (!planId || readOnly) return false;
    setFeedback(null);
    setConflict(false);
    setPendingAction({ kind: ids.length > 1 ? 'bulk-exclude' : 'exclude', ids });
    try {
      const result = await port.excludeReviewItems(planId, ids);
      setCheckedIds((current) => current.filter((id) => !result.succeededIds.includes(id)));
      markRecentlyResolved(result.succeededIds);
      if (result.failedIds.length && result.succeededIds.length) {
        setFeedback({
          tone: 'warning',
          message: `${result.succeededIds.length} مورد مستثنا شد؛ ${result.failedIds.length} مورد انجام نشد.`,
        });
      } else if (result.failedIds.length) {
        setFeedback({ tone: 'error', message: 'مستثنا کردن سفارش انجام نشد.' });
        setPendingAction(null);
        return false;
      } else {
        setFeedback({
          tone: 'success',
          message:
            ids.length > 1 ? `${result.succeededIds.length} سفارش مستثنا شدند.` : 'سفارش مستثنا شد.',
        });
      }
      setPendingAction(null);
      return result.failedIds.length === 0;
    } catch (error) {
      const isConflict = error instanceof Error && error.message === 'REVIEW_CONFLICT';
      if (isConflict) setConflict(true);
      setFeedback({
        tone: isConflict ? 'warning' : 'error',
        message: errorMessage(error, 'مستثنا کردن سفارش انجام نشد.'),
      });
      setPendingAction(null);
      return false;
    }
  };

  const restore = (id: string) =>
    runMutation(
      'restore',
      [id],
      async () => {
        await port.restoreReviewItems(planId!, [id]);
      },
      'سفارش به فهرست بررسی بازگردانده شد.',
      'بازگرداندن سفارش انجام نشد.',
    );

  const restoreMany = async (ids: string[]) => {
    if (!planId || readOnly) return false;
    setFeedback(null);
    setConflict(false);
    setPendingAction({ kind: 'bulk-restore', ids });
    try {
      const result = await port.restoreReviewItems(planId, ids);
      setCheckedIds((current) => current.filter((id) => !result.succeededIds.includes(id)));
      markRecentlyResolved(result.succeededIds);
      if (result.failedIds.length && result.succeededIds.length) {
        setFeedback({
          tone: 'warning',
          message: `${result.succeededIds.length} مورد بازگردانده شد؛ ${result.failedIds.length} مورد انجام نشد.`,
        });
      } else if (result.failedIds.length) {
        setFeedback({ tone: 'error', message: 'بازگرداندن گروهی انجام نشد.' });
        setPendingAction(null);
        return false;
      } else {
        setFeedback({
          tone: 'success',
          message: `${result.succeededIds.length} سفارش بازگردانده شد.`,
        });
      }
      setPendingAction(null);
      return result.failedIds.length === 0;
    } catch (error) {
      const isConflict = error instanceof Error && error.message === 'REVIEW_CONFLICT';
      if (isConflict) setConflict(true);
      setFeedback({
        tone: isConflict ? 'warning' : 'error',
        message: errorMessage(error, 'بازگرداندن گروهی انجام نشد.'),
      });
      setPendingAction(null);
      return false;
    }
  };

  const resolveLocation = (id: string, coords: ReviewLatLng) =>
    runMutation(
      'location',
      [id],
      async () => {
        await port.resolveReviewLocation(planId!, id, coords);
      },
      'موقعیت سفارش ذخیره شد.',
      'ذخیره تغییرات آزمایشی ناموفق بود. دوباره تلاش کنید.',
    );

  const editInformation = (id: string, values: ReviewTaskUpdate) =>
    runMutation(
      'information',
      [id],
      async () => {
        await port.updateReviewInformation(planId!, id, values);
      },
      'اطلاعات سفارش ذخیره شد.',
      'ذخیره تغییرات آزمایشی ناموفق بود. دوباره تلاش کنید.',
    );

  const resolveDuplicate = (id: string, decision: 'both_valid' | 'exclude_current') =>
    runMutation(
      'duplicate',
      [id],
      async () => {
        await port.resolveReviewDuplicate(planId!, id, decision);
      },
      decision === 'exclude_current' ? 'سفارش تکراری مستثنا شد.' : 'تصمیم سفارش تکراری ثبت شد.',
      'ثبت تصمیم تکراری انجام نشد.',
    );

  return {
    tasks,
    visibleTasks,
    inspectedTask,
    inspectedId,
    setInspectedId,
    checkedIds,
    checkedTasks,
    toggleChecked,
    toggleAllVisible,
    allVisibleChecked,
    someVisibleChecked,
    clearChecked: () => setCheckedIds([]),
    activeTab,
    setActiveTab,
    activeIssues,
    toggleIssue,
    setActiveIssues,
    search,
    setSearch,
    recentOnly,
    setRecentOnly,
    recentCount,
    counts,
    issueCounts,
    canContinue,
    hasActiveFilters,
    clearFilters,
    pendingAction,
    feedback,
    clearFeedback: () => setFeedback(null),
    exclude,
    restore,
    restoreMany,
    resolveLocation,
    editInformation,
    resolveDuplicate,
    loadStatus,
    reload,
    readOnly,
    recentlyResolvedIds,
    conflict,
  };
}
