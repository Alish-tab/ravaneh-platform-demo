import type { PlanningGenerationPhase } from '@/features/planning/generation';
import { isGenerationBusy } from '@/features/planning/generation';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { Button } from '@/shared/ui';
import { toPersianDigits } from '@/shared/lib/format';

type GenerationPanelProps = {
  phase: PlanningGenerationPhase;
  targetAreaCount: number;
  onStartGeneration: () => void;
  onCollapse: () => void;
};

/**
 * Side panel for pre-generation / in-progress / failed distribution area creation.
 */
export function GenerationPanel({
  phase,
  targetAreaCount,
  onStartGeneration,
  onCollapse,
}: GenerationPanelProps) {
  const busy = isGenerationBusy(phase);

  return (
    <aside className="planning-inspector" aria-label="ساخت محدوده‌ها" data-testid="generation-panel">
      <div className="planning-inspector-header">
        <Icon d={ICONS.layers} size={13} />
        <span className="planning-inspector-title">محدوده‌ها</span>
        <button type="button" className="planning-icon-btn" title="بستن پانل" onClick={onCollapse}>
          <Icon d={ICONS.panel_end} size={14} />
        </button>
      </div>

      {phase === 'ready' ? (
        <div
          className="flex flex-1 flex-col items-center justify-center px-[18px] py-7 text-center"
          data-testid="generation-ready"
        >
          <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)]">
            <Icon d={ICONS.layers} size={17} />
          </div>
          <div className="mb-2 text-[12.5px] leading-relaxed font-semibold text-[var(--text-primary)]">
            هنوز محدوده‌ای ساخته نشده است.
          </div>
          <div className="text-[11.5px] leading-relaxed text-[var(--text-muted)]">
            پس از ساخت محدوده‌ها، تقسیم سفارش‌ها در این بخش نمایش داده می‌شود.
          </div>
        </div>
      ) : null}

      {busy ? (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-6"
          data-testid="generation-progress"
        >
          <div className="planning-generation-spinner" aria-hidden />
          <div className="text-center">
            <div className="mb-1.5 text-[12.5px] font-semibold text-[var(--text-primary)]">
              {phase === 'submitting' ? 'در حال ارسال درخواست…' : 'در حال پردازش…'}
            </div>
            {phase === 'generating' ? (
              <div className="text-[11.5px] leading-relaxed text-[var(--text-secondary)]">
                در حال تقسیم سفارش‌ها و ساخت {toPersianDigits(targetAreaCount)} محدوده توزیع…
              </div>
            ) : null}
          </div>
          {phase === 'generating' ? (
            <div className="h-[3px] w-full max-w-[160px] overflow-hidden rounded-sm bg-[var(--bg-surface)]">
              <div className="planning-generation-progress-bar h-full rounded-sm bg-[var(--accent)]" />
            </div>
          ) : null}
        </div>
      ) : null}

      {phase === 'failed' ? (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-6"
          data-testid="generation-failed"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(196,68,68,0.12)]">
            <Icon d={ICONS.close} size={18} stroke="var(--error-text)" />
          </div>
          <div className="text-center">
            <div className="mb-1 text-[13px] font-semibold text-[var(--error-text)]">
              خطا در بهینه‌سازی
            </div>
            <div className="text-[11.5px] text-[var(--text-muted)]">
              سرور پاسخ نداد. دوباره امتحان کنید.
            </div>
          </div>
          <Button variant="primary" size="sm" data-testid="generation-retry" onClick={onStartGeneration}>
            تلاش مجدد
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
