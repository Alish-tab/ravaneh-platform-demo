import type { PlanningDriver } from '@/features/planning/fixture/types';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { Button } from '@/shared/ui';

type DriverConfirmProps = {
  routeLabel: string;
  driver: PlanningDriver;
  currentDriverName: string | null;
  flow: 'assign' | 'change';
  isSaving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Designer Mode E2 — confirm assign or change driver.
 */
export function DriverConfirm({
  routeLabel,
  driver,
  currentDriverName,
  flow,
  isSaving,
  onConfirm,
  onCancel,
}: DriverConfirmProps) {
  const title = flow === 'change' ? 'تأیید تغییر راننده' : 'تأیید تخصیص';
  const confirmLabel = flow === 'change' ? 'تأیید تغییر' : 'تأیید تخصیص';

  return (
    <aside
      className="planning-inspector"
      aria-label={title}
      data-testid="driver-confirm"
      data-flow={flow}
    >
      <div className="planning-inspector-header !items-start">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="planning-back-btn mb-1"
            disabled={isSaving}
            onClick={onCancel}
          >
            <Icon d={ICONS.chevron_r} size={11} />
            انتخاب راننده
          </button>
          <div className="text-[13px] font-bold text-[var(--text-primary)]">{title}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-4">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2.5">
          <div className="mb-1 text-[10px] text-[var(--text-muted)]">محدوده</div>
          <div className="text-[13px] font-semibold text-[var(--text-primary)]">{routeLabel}</div>
        </div>

        {flow === 'change' && currentDriverName ? (
          <>
            <div className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2.5 opacity-55">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)]">
                <Icon d={ICONS.person} size={12} />
              </div>
              <div>
                <div className="mb-0.5 text-[10px] text-[var(--text-muted)]">راننده قبلی</div>
                <div className="text-[12.5px] text-[var(--text-secondary)] line-through">
                  {currentDriverName}
                </div>
              </div>
            </div>
            <div className="flex justify-center text-[var(--text-disabled)]">
              <Icon d={ICONS.chevron_d} size={16} />
            </div>
          </>
        ) : null}

        {flow === 'assign' ? (
          <div className="flex justify-center text-[var(--text-disabled)]">
            <Icon d={ICONS.chevron_d} size={16} />
          </div>
        ) : null}

        <div className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-panel)] px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
            <Icon d={ICONS.person} size={14} />
          </div>
          <div>
            <div className="mb-0.5 text-[10px] text-[var(--text-muted)]">
              {flow === 'change' ? 'راننده جدید' : 'راننده'}
            </div>
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">
              {driver.driverName}
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-1.5 border-t border-[var(--border-default)] px-3 py-2.5">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={isSaving}
          data-testid="driver-confirm-cancel"
          onClick={onCancel}
        >
          انصراف
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-[2]"
          disabled={isSaving}
          data-testid="driver-confirm-submit"
          onClick={onConfirm}
        >
          {isSaving ? 'در حال ذخیره…' : confirmLabel}
        </Button>
      </div>
    </aside>
  );
}
