import { Icon, ICONS } from '@/features/plans/components/icons';
import { Button, LtrData } from '@/shared/ui';
import { shortAddress } from '@/features/planning/fixture/planning-fixture';
import type { PlanningLatLng } from '@/features/planning/fixture/update-stop-location';
import type { PlanningRoute, PlanningStop } from '@/features/planning/fixture/types';

type LocationCorrectionPanelProps = {
  stop: PlanningStop;
  route: PlanningRoute;
  proposedLocation: PlanningLatLng | null;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  onCollapse: () => void;
};

/**
 * Designer Mode G2 — location correction inspector.
 */
export function LocationCorrectionPanel({
  stop,
  route,
  proposedLocation,
  isSaving,
  onSave,
  onCancel,
  onCollapse,
}: LocationCorrectionPanelProps) {
  const hasProposed = proposedLocation !== null;
  const primary = stop.tasks[0];

  return (
    <aside
      className="planning-inspector"
      aria-label="اصلاح موقعیت"
      data-testid="location-correction-panel"
    >
      <div className="planning-inspector-header !items-start">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="planning-back-btn mb-0.5"
            disabled={isSaving}
            onClick={onCancel}
          >
            <Icon d={ICONS.chevron_r} size={11} />
            نقطه تحویل
          </button>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Icon d={ICONS.edit} size={11} stroke="var(--accent)" />
            <div className="text-[13px] font-bold text-[var(--text-primary)]">اصلاح موقعیت</div>
          </div>
        </div>
        <button
          type="button"
          className="planning-icon-btn"
          title="بستن پانل"
          disabled={isSaving}
          onClick={onCollapse}
        >
          <Icon d={ICONS.panel_end} size={14} />
        </button>
      </div>

      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2">
        <div className="truncate text-[11.5px] font-medium text-[var(--text-primary)]">
          {primary ? shortAddress(primary.address) : stop.stopId}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-sm"
            style={{ background: route.color, opacity: 0.85 }}
          />
          <span className="text-[10px] text-[var(--text-muted)]">{route.label}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mb-3 rounded-[var(--radius-sm)] border border-[rgba(61,123,212,0.18)] bg-[rgba(61,123,212,0.08)] px-2.5 py-2 text-[10.5px] leading-relaxed text-[var(--accent-text)]">
          روی نقشه کلیک کنید تا موقعیت پیشنهادی را انتخاب کنید.
        </div>

        <div className="mb-2">
          <div className="mb-1.5 text-[9.5px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
            SAVED
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-2">
            <div className="mb-0.5 text-[10.5px] text-[var(--text-muted)]">مختصات ذخیره‌شده</div>
            <LtrData className="text-[11.5px] text-[var(--text-secondary)]" data-testid="correction-saved-coords">
              {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
            </LtrData>
          </div>
        </div>

        <div className="my-1 flex justify-center text-[var(--text-disabled)]">
          <Icon d={ICONS.chevron_d} size={16} />
        </div>

        <div className="mt-1">
          <div
            className={[
              'mb-1.5 text-[9.5px] font-semibold tracking-wide uppercase',
              hasProposed ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]',
            ].join(' ')}
          >
            PROPOSED
          </div>
          <div
            className={[
              'rounded-[var(--radius-sm)] px-2.5 py-2',
              hasProposed
                ? 'border border-[rgba(61,123,212,0.3)] bg-[rgba(61,123,212,0.07)]'
                : 'border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)]',
            ].join(' ')}
            data-testid="correction-proposed-box"
          >
            {hasProposed && proposedLocation ? (
              <>
                <div className="mb-0.5 text-[10.5px] text-[var(--accent-text)]">موقعیت پیشنهادی</div>
                <LtrData
                  className="text-[11.5px] text-[var(--text-primary)]"
                  data-testid="correction-proposed-coords"
                >
                  {proposedLocation.lat.toFixed(5)}, {proposedLocation.lng.toFixed(5)}
                </LtrData>
              </>
            ) : (
              <div className="py-1 text-center text-[11px] text-[var(--text-disabled)]">
                موقعیت پیشنهادی انتخاب نشده
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-1.5 border-t border-[var(--border-default)] px-3 py-2.5">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={isSaving}
          data-testid="correction-cancel"
          onClick={onCancel}
        >
          انصراف
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-[2]"
          loading={isSaving}
          disabled={!hasProposed || isSaving}
          data-testid="correction-save"
          onClick={onSave}
        >
          {isSaving ? 'در حال ذخیره…' : 'ذخیره موقعیت'}
        </Button>
      </div>
    </aside>
  );
}
