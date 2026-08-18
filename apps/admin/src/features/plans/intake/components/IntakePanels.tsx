import { toPersianDigits } from '@/shared/lib/format';
import { Button, InlineMessage, LtrData } from '@/shared/ui';

import type {
  A01ImportedFile,
  A01ParseSummary,
  A01StructuralErrorKind,
  DatasetDiffViewModel,
  MergeStrategy,
  PlanA01Mode,
} from '@/features/plans/a01-types';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { PlanStatusBadge } from '@/features/plans/components/PlanBadges';
import { A01_STRUCTURAL_ERROR_COPY, MERGE_STRATEGY_COPY } from '@/features/plans/presentation';

export function SelectedFilePanel({
  fileName,
  fileSize,
  fileType,
  onRemove,
  onUpload,
}: {
  fileName: string;
  fileSize: string;
  fileType: string;
  onRemove: () => void;
  onUpload: () => void;
}) {
  return (
    <div className="intake-card">
      <div className="intake-card-row border-b border-[var(--border-subtle)]">
        <div className="intake-file-icon success">
          <Icon d={ICONS.file_excel} size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <LtrData className="block truncate text-[12.5px] font-medium text-[var(--text-primary)]">
            {fileName}
          </LtrData>
          <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            {fileType} · {fileSize}
          </div>
        </div>
        <button
          type="button"
          className="rounded-[var(--r-xs)] p-1 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
          aria-label="حذف فایل انتخاب‌شده"
          onClick={onRemove}
        >
          <Icon d={ICONS.close} size={13} />
        </button>
      </div>
      <div className="flex items-center justify-between gap-2.5 px-4 py-3">
        <span className="text-xs text-[var(--text-muted)]">
          <Icon d={ICONS.info} size={11} /> قبل از بارگذاری مطمئن شوید فایل درست است.
        </span>
        <div className="flex gap-2">
          <Button variant="subtle" size="sm" onClick={onRemove}>
            انتخاب فایل دیگر
          </Button>
          <Button variant="primary" size="sm" onClick={onUpload}>
            <Icon d={ICONS.upload} size={12} />
            بارگذاری و بررسی
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UploadProgressState({ progress }: { progress: number }) {
  const pct = Math.min(100, Math.round(progress));
  return (
    <div className="intake-card p-5">
      <div className="mb-3.5 flex items-center gap-3">
        <div className="intake-file-icon accent">
          <Icon d={ICONS.upload} size={14} />
        </div>
        <div>
          <div className="text-[13px] font-medium text-[var(--text-primary)]">بارگذاری فایل…</div>
          <div className="mt-0.5 text-[11.5px] text-[var(--text-secondary)]">
            {toPersianDigits(pct)}٪ کامل شده
          </div>
        </div>
        <LtrData className="ms-auto text-xs text-[var(--text-secondary)]">{pct}%</LtrData>
      </div>
      <div
        className="h-1 overflow-hidden rounded-sm bg-[var(--bg-surface)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-sm bg-[var(--accent)] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function UploadFailedState({
  fileName,
  onRetry,
  onSelectAnother,
}: {
  fileName: string;
  onRetry: () => void;
  onSelectAnother: () => void;
}) {
  return (
    <div className="intake-card intake-card-error">
      <div className="flex items-start gap-3 px-[18px] py-4">
        <span className="mt-0.5 shrink-0 text-[var(--error-text)]">
          <Icon d={ICONS.error_x} size={16} />
        </span>
        <div className="flex-1">
          <div className="mb-1 text-[13px] font-semibold text-[var(--error-text)]">
            بارگذاری فایل ناموفق بود
          </div>
          <div className="text-[12.5px] leading-7 text-[var(--text-secondary)]">
            اتصال در حین بارگذاری قطع شد. فایل به سرور نرسیده است. اتصال اینترنت را بررسی کنید و
            دوباره تلاش کنید.
          </div>
          <LtrData className="mt-1.5 text-[11px] text-[var(--text-muted)]">{fileName}</LtrData>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-[rgba(196,68,68,0.2)] px-[18px] py-2.5">
        <Button variant="subtle" size="sm" onClick={onSelectAnother}>
          انتخاب فایل دیگر
        </Button>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <Icon d={ICONS.refresh} size={12} />
          تلاش مجدد
        </Button>
      </div>
    </div>
  );
}

export function ProcessingState() {
  return (
    <div className="intake-card">
      <div className="flex items-center gap-3 p-5">
        <div className="intake-file-icon accent">
          <span className="intake-spin text-[var(--accent)]">
            <Icon d={ICONS.file} size={14} />
          </span>
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-medium text-[var(--text-primary)]">
            در حال پردازش فایل…
          </div>
          <div className="mt-0.5 text-xs leading-6 text-[var(--text-secondary)]">
            سرور در حال تجزیه و بررسی ساختار فایل است. می‌توانید صفحه را ترک کنید — نتیجه پردازش
            ذخیره خواهد شد.
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--border-subtle)] px-5 py-2.5">
        <PlanStatusBadge status="process" />
      </div>
    </div>
  );
}

export function StructuralErrorState({
  errorType,
  onRetry,
}: {
  errorType: A01StructuralErrorKind;
  onRetry: () => void;
}) {
  const err = A01_STRUCTURAL_ERROR_COPY[errorType] ?? A01_STRUCTURAL_ERROR_COPY.unreadable!;
  return (
    <div className="intake-card intake-card-error">
      <div className="flex items-start gap-3 px-[18px] py-4">
        <span className="mt-0.5 shrink-0 text-[var(--error-text)]">
          <Icon d={ICONS.error_x} size={16} />
        </span>
        <div className="flex-1">
          <div className="mb-1 text-[13px] font-semibold text-[var(--error-text)]">{err.title}</div>
          <div className="text-[12.5px] leading-7 text-[var(--text-secondary)]">{err.body}</div>
        </div>
      </div>
      <div className="flex justify-end border-t border-[rgba(196,68,68,0.2)] px-[18px] py-2.5">
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <Icon d={ICONS.upload} size={12} />
          بارگذاری فایل جدید
        </Button>
      </div>
    </div>
  );
}

export function ImportResultSummary({
  importedFile,
  summary,
  onContinueToReview,
}: {
  importedFile: A01ImportedFile;
  summary: A01ParseSummary;
  onContinueToReview: () => void;
}) {
  const reviewTotal =
    summary.locationReviewCount + summary.duplicateOrderIdCount + summary.otherReviewCount;

  return (
    <div className="intake-card overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-[18px] py-3.5">
        <span className="shrink-0 text-[var(--success-text)]">
          <Icon d={ICONS.check_circle} size={16} />
        </span>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-[var(--text-primary)]">
            فایل با موفقیت خوانده شد — برخی موارد نیاز به بررسی دارند
          </div>
          <div className="mt-0.5 text-[11.5px] text-[var(--text-secondary)]">
            <LtrData className="text-[10px] text-[var(--text-muted)]">{importedFile.name}</LtrData>
            <span className="mx-1.5 text-[var(--border-default)]">·</span>
            {importedFile.uploadedAt}
          </div>
        </div>
      </div>

      <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-[18px] py-2.5">
        {[
          { label: 'مجموع خوانده شد', value: summary.totalRows, color: 'var(--text-secondary)' },
          { label: 'ردیف وارد شده', value: summary.importedCount, color: 'var(--success-text)' },
          { label: 'نیازمند بررسی داده', value: reviewTotal, color: 'var(--warning-text)' },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="flex-1 px-1.5 py-1 text-center"
            style={{
              borderInlineEnd: index < 2 ? '1px solid var(--border-subtle)' : undefined,
            }}
          >
            <div className="text-base leading-none font-bold" style={{ color: stat.color }}>
              {toPersianDigits(stat.value)}
            </div>
            <div className="mt-0.5 text-[10px] whitespace-nowrap text-[var(--text-muted)]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 border-b border-[var(--border-subtle)] px-[18px] py-3">
        <div className="mb-1 text-[10.5px] font-semibold tracking-wide text-[var(--text-muted)]">
          یافته‌های قابل بررسی در بررسی داده
        </div>
        {[
          {
            icon: ICONS.map_pin,
            label: 'موارد نیازمند بررسی موقعیت',
            count: summary.locationReviewCount,
            color: 'var(--warning-text)',
          },
          {
            icon: ICONS.copy,
            label: 'شماره سفارش تکراری',
            count: summary.duplicateOrderIdCount,
            color: 'var(--warning-text)',
          },
          {
            icon: ICONS.info,
            label: 'سایر مشکلات قابل بررسی',
            count: summary.otherReviewCount,
            color: 'var(--info-text)',
          },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-2 py-0.5">
            <span className="shrink-0" style={{ color: row.color }}>
              <Icon d={row.icon} size={12} />
            </span>
            <span className="flex-1 text-[12.5px] text-[var(--text-secondary)]">{row.label}</span>
            <span className="badge-count">{toPersianDigits(row.count)} مورد</span>
          </div>
        ))}
      </div>

      <div className="border-b border-[var(--border-subtle)] px-[18px] py-2.5">
        <InlineMessage tone="info">
          همه ردیف‌های وارد شده حفظ شده‌اند — هیچ ردیفی به‌طور خودکار حذف یا ادغام نمی‌شود.
        </InlineMessage>
      </div>

      <div className="flex items-center justify-between px-[18px] py-3">
        <div className="text-xs text-[var(--text-muted)]">
          {toPersianDigits(summary.importedCount)} ردیف وارد شده · {toPersianDigits(reviewTotal)}{' '}
          مورد نیازمند بررسی
        </div>
        <Button variant="primary" onClick={onContinueToReview}>
          بررسی داده
          <Icon d={ICONS.chevron_l} size={13} />
        </Button>
      </div>
    </div>
  );
}

export function ImportCleanState({
  importedFile,
  onContinue,
}: {
  importedFile: A01ImportedFile;
  onContinue: () => void;
}) {
  return (
    <div className="intake-card intake-card-success">
      <div className="flex items-start gap-3 px-[18px] py-4">
        <span className="mt-0.5 shrink-0 text-[var(--success-text)]">
          <Icon d={ICONS.check_circle} size={18} />
        </span>
        <div className="flex-1">
          <div className="mb-1 text-[13px] font-semibold text-[var(--success-text)]">
            فایل با موفقیت خوانده شد
          </div>
          <div className="text-[12.5px] leading-6 text-[var(--text-secondary)]">
            <span className="badge-count me-1">
              {toPersianDigits(importedFile.rowCount)} ردیف وارد شده
            </span>
            — موردی برای بررسی یافت نشد.
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[rgba(43,157,111,0.2)] px-[18px] py-2.5">
        <span className="text-[11.5px] text-[var(--text-muted)]">
          مرحله بعد: تأیید نهایی ردیف‌های وارد شده در بررسی داده.
        </span>
        <Button variant="primary" onClick={onContinue}>
          بررسی داده
          <Icon d={ICONS.chevron_l} size={13} />
        </Button>
      </div>
    </div>
  );
}

export function DatasetActivePanel({
  importedFile,
  a01Mode,
  onUploadNew,
  onCreateWorkingVersion,
}: {
  importedFile: A01ImportedFile;
  a01Mode: PlanA01Mode;
  onUploadNew: () => void;
  onCreateWorkingVersion?: () => void;
}) {
  return (
    <div className="intake-card">
      <div className="flex items-center gap-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3.5 py-2">
        <span className="text-[10.5px] font-semibold text-[var(--text-muted)]">دیتاست فعال</span>
      </div>
      <div className="intake-card-row">
        <div className="intake-file-icon success !h-[34px] !w-[34px]">
          <Icon d={ICONS.file_excel} size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <LtrData className="block truncate text-[12.5px] font-medium text-[var(--text-primary)]">
            {importedFile.name}
          </LtrData>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span>بارگذاری: {importedFile.uploadedAt}</span>
            <span className="text-[var(--border-default)]">·</span>
            <span>{toPersianDigits(importedFile.rowCount)} سفارش</span>
            <PlanStatusBadge status="ready" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2.5 border-t border-[var(--border-subtle)] px-4 py-2.5">
        {a01Mode === 'published-readonly' ? (
          <>
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Icon d={ICONS.check_circle} size={12} /> داده‌ها منتشر شده‌اند — برای ویرایش نسخه کاری
              ایجاد کنید.
            </span>
            {onCreateWorkingVersion ? (
              <Button variant="subtle" size="sm" onClick={onCreateWorkingVersion}>
                <Icon d={ICONS.edit} size={12} />
                ایجاد نسخه کاری
              </Button>
            ) : null}
          </>
        ) : null}
        {a01Mode === 'execution-locked' ? (
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <Icon d={ICONS.info} size={12} /> برنامه در حال اجراست — به‌روزرسانی اکسل غیرفعال است.
          </span>
        ) : null}
        {a01Mode === 'completed-readonly' ? (
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <Icon d={ICONS.check_circle} size={12} /> برنامه تکمیل شده — داده‌های تاریخی.
          </span>
        ) : null}
        {a01Mode === 'editable' || a01Mode === 'working' ? (
          <>
            <span className="text-xs text-[var(--text-muted)]">
              برای به‌روزرسانی داده‌ها، فایل اکسل جدید بارگذاری کنید.
            </span>
            <Button variant="subtle" size="sm" onClick={onUploadNew}>
              <Icon d={ICONS.upload} size={12} />
              بارگذاری فایل جدید
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function DiffReadyPanel({
  fileName,
  diff,
  strategy,
  confirmReplace,
  onStrategyChange,
  onApply,
  onShowReplaceConfirm,
  onCancelReplace,
  onBack,
}: {
  fileName: string;
  diff: DatasetDiffViewModel;
  strategy: MergeStrategy | null;
  confirmReplace: boolean;
  onStrategyChange: (strategy: MergeStrategy) => void;
  onApply: (strategy: MergeStrategy) => void;
  onShowReplaceConfirm: () => void;
  onCancelReplace: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="intake-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-2.5">
          <span className="text-[var(--info-text)]">
            <Icon d={ICONS.file_excel} size={14} />
          </span>
          <div>
            <LtrData className="block text-[13px] font-semibold text-[var(--text-primary)]">
              {fileName}
            </LtrData>
            <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              مقایسه با دیتاست فعلی بر اساس شناسه سفارش
            </div>
          </div>
        </div>
        <div className="flex bg-[var(--bg-panel)]">
          {[
            { label: 'سفارش جدید', value: diff.newCount, color: 'var(--success-text)' },
            { label: 'تغییرکرده', value: diff.changedCount, color: 'var(--info-text)' },
            { label: 'بدون تغییر', value: diff.unchangedCount, color: 'var(--text-secondary)' },
            { label: 'در فایل جدید نیستند', value: diff.missingCount, color: 'var(--warning-text)' },
          ].map((item, index, arr) => (
            <div
              key={item.label}
              className="flex-1 px-1 py-2.5 text-center"
              style={{
                borderInlineEnd:
                  index < arr.length - 1 ? '1px solid var(--border-subtle)' : undefined,
              }}
            >
              <div className="text-lg leading-none font-bold" style={{ color: item.color }}>
                {toPersianDigits(item.value)}
              </div>
              <div className="mt-1 text-[10px] leading-snug text-[var(--text-muted)]">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="intake-card overflow-hidden">
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-4 py-2">
          <span className="text-[11.5px] font-semibold text-[var(--text-secondary)]">
            نحوه اعمال تغییرات را انتخاب کنید
          </span>
        </div>
        <div className="flex flex-col gap-1.5 p-2" role="radiogroup" aria-label="راهبرد به‌روزرسانی">
          {(Object.keys(MERGE_STRATEGY_COPY) as MergeStrategy[]).map((key) => {
            const opt = MERGE_STRATEGY_COPY[key];
            const selected = strategy === key;
            return (
              <label
                key={key}
                className={[
                  'intake-strategy',
                  selected ? 'selected' : '',
                  selected && opt.destructive ? 'destructive' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <input
                  type="radio"
                  name="merge-strategy"
                  checked={selected}
                  onChange={() => onStrategyChange(key)}
                  aria-label={opt.title}
                  className="mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={[
                        'text-[13px] font-semibold',
                        selected && opt.destructive
                          ? 'text-[var(--error-text)]'
                          : selected
                            ? 'text-[var(--accent-text)]'
                            : 'text-[var(--text-primary)]',
                      ].join(' ')}
                    >
                      {opt.title}
                    </span>
                    {opt.recommended ? (
                      <span className="intake-chip-success">پیشنهاد</span>
                    ) : null}
                    {opt.destructive ? <span className="intake-chip-danger">مخرب</span> : null}
                  </div>
                  <div className="text-xs leading-6 text-[var(--text-secondary)]">{opt.body}</div>
                </div>
              </label>
            );
          })}
        </div>

        {strategy === 'full-replace' && confirmReplace ? (
          <div className="mx-2 mb-2 rounded-[var(--r-sm)] border border-[rgba(196,68,68,0.4)] bg-[var(--error-muted)] px-3.5 py-3">
            <div className="mb-2.5 flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--error-text)]">
                <Icon d={ICONS.warning_tri} size={14} />
              </span>
              <div>
                <div className="mb-0.5 text-[12.5px] font-semibold text-[var(--error-text)]">
                  تأیید جایگزینی کامل
                </div>
                <div className="text-xs leading-6 text-[var(--text-secondary)]">
                  {toPersianDigits(diff.missingCount)} سفارشی که در فایل جدید نیستند از نسخه کاری
                  فعلی حذف می‌شوند. سفارش‌های بدون تغییر، تصمیمات بررسی و سوابق حفظ می‌شوند.
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="subtle" size="sm" onClick={onCancelReplace}>
                انصراف
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onApply('full-replace')}>
                جایگزینی کامل
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-2.5">
            <Button variant="subtle" size="sm" onClick={onBack}>
              <Icon d={ICONS.chevron_r} size={12} />
              بازگشت
            </Button>
            <Button
              variant={strategy === 'full-replace' ? 'destructive' : 'primary'}
              size="sm"
              disabled={!strategy}
              onClick={() => {
                if (!strategy) return;
                if (strategy === 'full-replace') onShowReplaceConfirm();
                else onApply(strategy);
              }}
            >
              اعمال تغییرات
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ApplyingState() {
  return (
    <div className="intake-card">
      <div className="flex items-center gap-3 p-5">
        <div className="intake-file-icon accent">
          <span className="intake-spin text-[var(--accent)]">
            <Icon d={ICONS.refresh} size={14} />
          </span>
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-medium text-[var(--text-primary)]">
            در حال اعمال تغییرات…
          </div>
          <div className="mt-0.5 text-xs leading-6 text-[var(--text-secondary)]">
            تغییرات دیتاست در حال اعمال است. لطفاً صبر کنید.
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--border-subtle)] px-5 py-2.5">
        <PlanStatusBadge status="process" />
      </div>
    </div>
  );
}

export function ApplyFailedState({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <div className="intake-card intake-card-error">
      <div className="flex items-start gap-3 px-[18px] py-4">
        <span className="mt-0.5 shrink-0 text-[var(--error-text)]">
          <Icon d={ICONS.error_x} size={16} />
        </span>
        <div className="flex-1">
          <div className="mb-1 text-[13px] font-semibold text-[var(--error-text)]">
            اعمال تغییرات ناموفق بود
          </div>
          <div className="text-[12.5px] leading-7 text-[var(--text-secondary)]">
            خطایی در اعمال تغییرات رخ داد. دیتاست فعلی تغییر نکرده است. دوباره تلاش کنید یا به صفحه
            قبل بازگردید.
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-[rgba(196,68,68,0.2)] px-[18px] py-2.5">
        <Button variant="subtle" size="sm" onClick={onBack}>
          بازگشت
        </Button>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <Icon d={ICONS.refresh} size={12} />
          تلاش مجدد
        </Button>
      </div>
    </div>
  );
}

export function ApplySuccessState({
  strategy,
  onContinue,
}: {
  strategy: MergeStrategy;
  onContinue: () => void;
}) {
  return (
    <div className="intake-card intake-card-success">
      <div className="flex items-start gap-3 px-[18px] py-4">
        <span className="mt-0.5 shrink-0 text-[var(--success-text)]">
          <Icon d={ICONS.check_circle} size={18} />
        </span>
        <div className="flex-1">
          <div className="mb-1 text-[13px] font-semibold text-[var(--success-text)]">
            تغییرات با موفقیت اعمال شدند
          </div>
          <div className="text-[12.5px] leading-6 text-[var(--text-secondary)]">
            دیتاست بر اساس روش «{MERGE_STRATEGY_COPY[strategy].title}» به‌روز شد. برای تأیید نهایی
            ردیف‌های وارد شده به بررسی داده بروید.
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[rgba(43,157,111,0.2)] px-[18px] py-2.5">
        <span className="text-[11.5px] text-[var(--text-muted)]">مرحله بعد: بررسی داده.</span>
        <Button variant="primary" onClick={onContinue}>
          بررسی داده
          <Icon d={ICONS.chevron_l} size={13} />
        </Button>
      </div>
    </div>
  );
}

export function WorkingVersionBanner({ onGoToPlanning }: { onGoToPlanning: () => void }) {
  return (
    <div className="intake-banner intake-banner-warning">
      <span className="shrink-0 text-[var(--warning-text)]">
        <Icon d={ICONS.edit} size={14} />
      </span>
      <div className="flex-1">
        <div className="text-[12.5px] font-semibold text-[var(--warning-text)]">
          در حال ویرایش نسخه کاری
        </div>
        <div className="text-xs text-[var(--text-secondary)]">
          این تغییرات هنوز برای رانندگان و نسخه منتشرشده قابل مشاهده نیستند.
        </div>
      </div>
      <Button variant="primary" size="sm" onClick={onGoToPlanning}>
        رفتن به برنامه‌ریزی
      </Button>
    </div>
  );
}

export function ExecutionLockedBanner() {
  return (
    <div className="intake-banner">
      <span className="mt-0.5 shrink-0 text-[var(--text-muted)]">
        <Icon d={ICONS.info} size={15} />
      </span>
      <div>
        <div className="mb-1 text-[13px] font-semibold text-[var(--text-primary)]">
          بارگذاری دسته‌ای اکسل در حین اجرا در دسترس نیست
        </div>
        <div className="text-[12.5px] leading-6 text-[var(--text-secondary)]">
          برای حفظ یکپارچگی داده‌های عملیاتی جاری، به‌روزرسانی دیتاست از طریق اکسل تا پایان اجرا
          غیرفعال است.
        </div>
      </div>
    </div>
  );
}

export function CompletedReadonlyBanner() {
  return (
    <div className="intake-banner intake-banner-success">
      <span className="shrink-0 text-[var(--success-text)]">
        <Icon d={ICONS.check_circle} size={14} />
      </span>
      <span className="text-[12.5px] text-[var(--text-secondary)]">
        این برنامه تکمیل شده است. داده‌ها برای مطالعه تاریخی نگه‌داری می‌شوند و قابل ویرایش نیستند.
      </span>
    </div>
  );
}

export function StaleDataBanner({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-[var(--r-sm)] border border-[rgba(201,144,53,0.3)] bg-[var(--warning-muted)] px-3.5 py-2"
      role="status"
    >
      <span className="shrink-0 text-[var(--warning-text)]">
        <Icon d={ICONS.alert} size={13} />
      </span>
      <span className="flex-1 text-[12.5px] text-[var(--warning-text)]">
        این برنامه توسط کاربر دیگری تغییر کرده است. اطلاعات را تازه‌سازی کنید.
      </span>
      <Button variant="subtle" size="sm" onClick={onRefresh}>
        <Icon d={ICONS.refresh} size={12} />
        تازه‌سازی
      </Button>
    </div>
  );
}

export function A01ModeChip({ mode }: { mode: PlanA01Mode }) {
  if (mode === 'editable') return null;
  const labels: Record<PlanA01Mode, string> = {
    editable: '',
    'published-readonly': 'منتشرشده',
    working: 'نسخه کاری',
    'execution-locked': 'در حال اجرا',
    'completed-readonly': 'تکمیل‌شده',
  };
  return <span className={`intake-mode-chip ${mode}`}>{labels[mode]}</span>;
}
