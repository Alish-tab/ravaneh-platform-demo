import { Icon, ICONS } from '@/features/plans/components/icons';
import { Button } from '@/shared/ui';

type RemoveDriverConfirmProps = {
  routeLabel: string;
  driverName: string;
  isRemoving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Designer remove-driver confirmation panel.
 */
export function RemoveDriverConfirm({
  routeLabel,
  driverName,
  isRemoving,
  onConfirm,
  onCancel,
}: RemoveDriverConfirmProps) {
  return (
    <aside
      className="planning-inspector"
      aria-label="حذف تخصیص راننده"
      data-testid="remove-driver-confirm"
    >
      <div className="planning-inspector-header !items-start">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="planning-back-btn mb-1"
            disabled={isRemoving}
            onClick={onCancel}
          >
            <Icon d={ICONS.chevron_r} size={11} />
            {routeLabel}
          </button>
          <div className="text-[13px] font-bold text-[var(--text-primary)]">حذف تخصیص راننده</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-4">
        <div className="rounded-[var(--radius-sm)] border border-[rgba(196,68,68,0.2)] bg-[rgba(196,68,68,0.07)] px-3 py-2.5 text-[11.5px] leading-relaxed text-[var(--text-secondary)]">
          تخصیص راننده از این محدوده حذف می‌شود. می‌توانید بعداً راننده جدید تخصیص دهید.
        </div>

        <div className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2.5">
          <div className="mb-1 text-[10px] text-[var(--text-muted)]">محدوده</div>
          <div className="text-[13px] font-semibold text-[var(--text-primary)]">{routeLabel}</div>
        </div>

        <div className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
            <Icon d={ICONS.person} size={13} />
          </div>
          <div>
            <div className="mb-0.5 text-[10px] text-[var(--text-muted)]">راننده فعلی</div>
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">{driverName}</div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-1.5 border-t border-[var(--border-default)] px-3 py-2.5">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={isRemoving}
          data-testid="remove-driver-cancel"
          onClick={onCancel}
        >
          انصراف
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-[2]"
          disabled={isRemoving}
          data-testid="remove-driver-submit"
          onClick={onConfirm}
        >
          {isRemoving ? 'در حال حذف…' : 'تأیید حذف'}
        </Button>
      </div>
    </aside>
  );
}
