import { useEffect, useMemo, useState } from 'react';

import { createReviewFixtureTasks } from '@/features/import-review/fixture/review-fixture';
import { isActiveReviewIssue } from '@/features/import-review/presentation';
import type {
  ReviewCounts,
  ReviewActionKind,
  ReviewFeedback,
  ReviewIssue,
  ReviewIssueFilter,
  ReviewState,
  ReviewTab,
  ReviewTask,
  ReviewTaskUpdate,
} from '@/features/import-review/review-types';

const FIXTURE_ACTION_DELAY_MS = 180;
export const REVIEW_FIXTURE_FAILURE_VALUE = 'fixture:error';

function stateFromIssues(issues: ReviewIssue[]): ReviewState {
  if (issues.includes('invalid_coords')) return 'error';
  if (issues.some((issue) => issue !== 'multi_order_location')) return 'review';
  return 'ready';
}

export function useReviewFixture({ empty = false }: { empty?: boolean } = {}) {
  const [tasks, setTasks] = useState<ReviewTask[]>(createReviewFixtureTasks);
  const [inspectedId, setInspectedId] = useState<string | null>('D-1044');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<ReviewTab>('action');
  const [activeIssue, setActiveIssue] = useState<ReviewIssueFilter | null>(null);
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    kind: ReviewActionKind;
    ids: string[];
  } | null>(null);
  const [feedback, setFeedback] = useState<ReviewFeedback>(null);

  useEffect(() => {
    if (!empty) return;
    setTasks([]);
    setInspectedId(null);
    setCheckedIds([]);
  }, [empty]);

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
    const count = (issue: ReviewIssue) =>
      included.filter((task) => task.issues.includes(issue)).length;
    return {
      loc_not_found: count('loc_not_found'),
      loc_ambiguous: count('loc_ambiguous'),
      loc_mismatch: count('loc_mismatch'),
      invalid_coords: count('invalid_coords'),
      phone: count('phone'),
      dup_order_id: count('dup_order_id'),
      multi_order_location: count('multi_order_location'),
      multiple: included.filter((task) => task.issues.filter(isActiveReviewIssue).length >= 2)
        .length,
    };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fa');
    return tasks.filter((task) => {
      if (activeTab === 'ready' && task.state !== 'ready') return false;
      if (activeTab === 'action' && task.state !== 'review' && task.state !== 'error') return false;
      if (activeTab === 'excluded' && task.state !== 'excluded') return false;
      if (activeIssue === 'multiple' && task.issues.filter(isActiveReviewIssue).length < 2)
        return false;
      if (activeIssue && activeIssue !== 'multiple' && !task.issues.includes(activeIssue))
        return false;
      if (
        query &&
        ![task.id, task.name, task.phone, task.address].some((value) =>
          value.toLocaleLowerCase('fa').includes(query),
        )
      )
        return false;
      return true;
    });
  }, [activeIssue, activeTab, search, tasks]);

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

  const updateTask = (id: string, update: (task: ReviewTask) => ReviewTask) => {
    setTasks((current) => current.map((task) => (task.id === id ? update(task) : task)));
  };

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

  const runAction = async (
    kind: ReviewActionKind,
    ids: string[],
    mutate: () => void,
    successMessage: string,
    shouldFail = false,
  ) => {
    setFeedback(null);
    setPendingAction({ kind, ids });
    await new Promise((resolve) => window.setTimeout(resolve, FIXTURE_ACTION_DELAY_MS));
    if (shouldFail) {
      setFeedback({ tone: 'error', message: 'ذخیره تغییرات آزمایشی ناموفق بود. دوباره تلاش کنید.' });
      setPendingAction(null);
      return false;
    }
    mutate();
    setFeedback({ tone: 'success', message: successMessage });
    setPendingAction(null);
    return true;
  };

  const applyExclude = (ids: string[]) => {
    const target = new Set(ids);
    setTasks((current) =>
      current.map((task) => (target.has(task.id) ? { ...task, state: 'excluded' } : task)),
    );
    setCheckedIds((current) => current.filter((id) => !target.has(id)));
  };

  const exclude = (ids: string[]) =>
    runAction(
      ids.length > 1 ? 'bulk-exclude' : 'exclude',
      ids,
      () => applyExclude(ids),
      ids.length > 1 ? `${ids.length} سفارش مستثنا شدند.` : 'سفارش مستثنا شد.',
    );

  const restore = (id: string) =>
    runAction(
      'restore',
      [id],
      () => updateTask(id, (task) => ({ ...task, state: stateFromIssues(task.issues) })),
      'سفارش به فهرست بررسی بازگردانده شد.',
    );

  const resolveLocation = (id: string, coordinates: string) =>
    runAction(
      'location',
      [id],
      () =>
        updateTask(id, (task) => {
          const issues = task.issues.filter(
            (issue) =>
              issue !== 'loc_not_found' &&
              issue !== 'loc_ambiguous' &&
              issue !== 'loc_mismatch' &&
              issue !== 'invalid_coords',
          );
          return { ...task, coordinates, issues, state: stateFromIssues(issues) };
        }),
      'موقعیت سفارش ذخیره شد.',
      coordinates.trim() === REVIEW_FIXTURE_FAILURE_VALUE,
    );

  const editInformation = (id: string, values: ReviewTaskUpdate) =>
    runAction(
      'information',
      [id],
      () =>
        updateTask(id, (task) => {
          const phoneValid = /^09\d{9}$/.test(values.phone.replace(/\D/g, ''));
          const issues = phoneValid ? task.issues.filter((issue) => issue !== 'phone') : task.issues;
          return { ...task, ...values, issues, state: stateFromIssues(issues) };
        }),
      'اطلاعات سفارش ذخیره شد.',
      values.name.trim() === REVIEW_FIXTURE_FAILURE_VALUE,
    );

  const resolveDuplicate = (id: string, decision: 'both_valid' | 'exclude_current') =>
    runAction('duplicate', [id], () => {
    if (decision === 'exclude_current') {
      applyExclude([id]);
      return;
    }
    updateTask(id, (task) => {
      const issues = task.issues.filter((issue) => issue !== 'dup_order_id');
      return { ...task, issues, state: stateFromIssues(issues) };
    });
    }, decision === 'exclude_current' ? 'سفارش تکراری مستثنا شد.' : 'تصمیم سفارش تکراری ثبت شد.');

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
    activeIssue,
    setActiveIssue,
    search,
    setSearch,
    counts,
    issueCounts,
    canContinue,
    pendingAction,
    feedback,
    clearFeedback: () => setFeedback(null),
    exclude,
    restore,
    resolveLocation,
    editInformation,
    resolveDuplicate,
  };
}
