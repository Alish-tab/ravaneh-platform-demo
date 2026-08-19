import { useEffect, useRef, useState } from 'react';

import { lookupDispatchOrder } from '@/features/planning/fixture/dispatch-lookup';
import type { PlanningDispatchResult, PlanningPlanFixture } from '@/features/planning/fixture/types';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { Button, LtrData } from '@/shared/ui';

type DispatchPrepPanelProps = {
  fixture: PlanningPlanFixture;
  excludedOrderIds: ReadonlySet<string>;
  onHighlight: (orderId: string | null, stopId: string | null, areaId: string | null) => void;
  onExit: () => void;
};

export function DispatchPrepPanel({
  fixture,
  excludedOrderIds,
  onHighlight,
  onExit,
}: DispatchPrepPanelProps) {
  const [inputVal, setInputVal] = useState('');
  const [result, setResult] = useState<PlanningDispatchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = inputVal.trim();
    if (!value) return;
    const next = lookupDispatchOrder(fixture, value, excludedOrderIds);
    setResult(next);
    if (next.kind === 'found') {
      onHighlight(next.orderId, next.stopId, next.areaId);
    } else if (next.kind === 'unassigned') {
      onHighlight(next.orderId, next.stopId, null);
    } else {
      onHighlight(null, null, null);
    }
    setInputVal('');
    inputRef.current?.focus();
  };

  return (
    <aside className="planning-inspector" aria-label="تفکیک پاکت‌ها" data-testid="dispatch-prep-panel">
      <div className="planning-inspector-header">
        <Icon d={ICONS.target} size={13} />
        <span className="planning-inspector-title">تفکیک پاکت‌ها</span>
        <button type="button" className="planning-icon-btn" title="بازگشت به برنامه‌ریزی" onClick={onExit}>
          <Icon d={ICONS.close} size={13} />
        </button>
      </div>

      <form className="border-b border-[var(--border-subtle)] px-3 py-2.5" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          value={inputVal}
          data-testid="dispatch-lookup-input"
          className="planning-dispatch-input"
          placeholder="شماره سفارش را اسکن یا وارد کنید"
          autoComplete="off"
          onChange={(event) => setInputVal(event.target.value)}
        />
        <div className="mt-1.5 text-[10.5px] text-[var(--text-disabled)]">
          Enter برای جستجو — اسکنر بارکد پشتیبانی می‌شود
        </div>
      </form>

      <div className="planning-inspector-scroll px-3 py-3" data-testid="dispatch-lookup-result">
        {!result ? (
          <div className="mt-4 text-center text-[12px] leading-relaxed text-[var(--text-disabled)]">
            پاکت را اسکن کنید یا شماره سفارش را وارد کنید
          </div>
        ) : null}

        {result?.kind === 'found' ? (
          <div className="planning-dispatch-card" data-testid="dispatch-found">
            <div className="border-b border-[var(--border-subtle)] px-3 py-2">
              <LtrData className="text-[13px] font-bold text-[var(--text-primary)]">#{result.orderId}</LtrData>
            </div>
            <div className="px-3 pt-2.5">
              <div className="text-[10.5px] text-[var(--text-disabled)]">محدوده</div>
              <div className="text-[15px] font-bold text-[var(--text-primary)]">{result.areaLabel}</div>
            </div>
            <div className="px-3 pt-2">
              <div className="text-[10.5px] text-[var(--text-disabled)]">راننده</div>
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                {result.driverName ?? 'راننده تخصیص داده نشده'}
              </div>
            </div>
            <div className="px-3 py-2.5">
              <div className="text-[10.5px] text-[var(--text-disabled)]">آدرس</div>
              <div className="text-[11.5px] leading-relaxed text-[var(--text-secondary)]">{result.address}</div>
            </div>
          </div>
        ) : null}

        {result?.kind === 'unassigned' ? (
          <div className="planning-dispatch-alert planning-dispatch-alert--warn" data-testid="dispatch-unassigned">
            <LtrData className="mb-1 text-[11.5px] text-[var(--warning-text)]">#{result.orderId}</LtrData>
            <div className="text-[12.5px] leading-relaxed text-[var(--warning-text)]">
              این سفارش هنوز به محدوده‌ای تخصیص داده نشده است.
            </div>
          </div>
        ) : null}

        {result?.kind === 'excluded' ? (
          <div className="planning-dispatch-alert" data-testid="dispatch-excluded">
            <LtrData className="mb-1 text-[11.5px] text-[var(--text-secondary)]">#{result.orderId}</LtrData>
            <div className="text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
              این سفارش از برنامه مستثنا شده است.
            </div>
          </div>
        ) : null}

        {result?.kind === 'notfound' && result.orderId ? (
          <div className="planning-dispatch-alert planning-dispatch-alert--error" data-testid="dispatch-notfound">
            <LtrData className="mb-1 text-[11.5px] text-[var(--error-text)]">#{result.orderId}</LtrData>
            <div className="text-[12.5px] leading-relaxed text-[var(--error-text)]">
              این شماره سفارش در این برنامه پیدا نشد.
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[var(--border-subtle)] px-3 py-2.5">
        <Button variant="secondary" size="sm" className="w-full" data-testid="dispatch-exit" onClick={onExit}>
          بازگشت به برنامه‌ریزی
        </Button>
      </div>
    </aside>
  );
}
