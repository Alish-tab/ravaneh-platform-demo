import { shortAddress } from '@/features/planning/fixture/planning-fixture';
import type { PlanningStop } from '@/features/planning/fixture/types';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { toPersianDigits } from '@/shared/lib/format';

type TransferScopePickerProps = {
  stop: PlanningStop;
  orderId: string;
  onChooseStop: () => void;
  onChooseOrder: () => void;
  onBack: () => void;
};

/**
 * Designer Mode G1 scope step — multi-order stop started from an order.
 */
export function TransferScopePicker({
  stop,
  orderId,
  onChooseStop,
  onChooseOrder,
  onBack,
}: TransferScopePickerProps) {
  const primary = stop.tasks[0];
  const taskCount = stop.tasks.length;

  return (
    <aside
      className="planning-inspector"
      aria-label="انتقال به محدوده دیگر"
      data-testid="transfer-scope-picker"
    >
      <div className="planning-inspector-header !items-start">
        <div className="min-w-0 flex-1">
          <button type="button" className="planning-back-btn mb-1" onClick={onBack}>
            <Icon d={ICONS.chevron_r} size={11} />
            نقطه تحویل
          </button>
          <div className="text-[13px] font-bold text-[var(--text-primary)]">
            انتقال به محدوده دیگر
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Icon d={ICONS.map_pin} size={11} stroke="var(--text-muted)" />
          <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-[var(--text-primary)]">
            {primary ? shortAddress(primary.address) : stop.stopId}
          </span>
          <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
            {toPersianDigits(taskCount)} سفارش
          </span>
        </div>
        <div
          className="mt-1 ps-[17px] text-[10px] text-[var(--accent-text)]"
          style={{ fontFamily: 'ui-monospace, monospace', direction: 'ltr' }}
        >
          #{orderId}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3.5">
        <div className="mb-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
          این نقطه شامل {toPersianDigits(taskCount)} سفارش مستقل است. کدام را انتقال می‌دهید؟
        </div>

        <button
          type="button"
          className="planning-transfer-scope-option"
          data-testid="transfer-scope-stop"
          onClick={onChooseStop}
        >
          <div className="mb-0.5 text-[12.5px] font-semibold text-[var(--text-primary)]">
            انتقال کل نقطه تحویل
          </div>
          <div className="text-[10.5px] leading-relaxed text-[var(--text-muted)]">
            همه {toPersianDigits(taskCount)} سفارش به محدوده جدید منتقل می‌شوند.
          </div>
        </button>

        <button
          type="button"
          className="planning-transfer-scope-option"
          data-testid="transfer-scope-order"
          onClick={onChooseOrder}
        >
          <div className="mb-0.5 text-[12.5px] font-semibold text-[var(--text-primary)]">
            انتقال فقط این سفارش
          </div>
          <div className="text-[10.5px] leading-relaxed text-[var(--text-muted)]">
            فقط این سفارش منتقل می‌شود. بقیه در همین نقطه باقی می‌مانند.
          </div>
        </button>
      </div>
    </aside>
  );
}
