import { toPersianDigits } from '@/shared/lib/format';
import { Button, InlineMessage, LtrData } from '@/shared/ui';

import type {
  A01DownstreamRisk,
  A01ImportedFile,
  A01ParseSummary,
  A01StructuralErrorKind,
} from '@/features/plans/a01-types';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { PlanStatusBadge } from '@/features/plans/components/PlanBadges';
import { A01_STRUCTURAL_ERROR_COPY } from '@/features/plans/presentation';

export function SelectedFilePanel({
  fileName,
  fileSize,
  onRemove,
  onUpload,
}: {
  fileName: string;
  fileSize: string;
  onRemove: () => void;
  onUpload: () => void;
}) {
  return (
    <div className="a01-card">
      <div className="a01-card-row border-b border-[var(--border-subtle)]">
        <div className="a01-file-icon success">
          <Icon d={ICONS.file_excel} size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <LtrData className="block truncate text-[12.5px] font-medium text-[var(--text-primary)]">
            {fileName}
          </LtrData>
          <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">XLSX · {fileSize}</div>
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
    <div className="a01-card p-5">
      <div className="mb-3.5 flex items-center gap-3">
        <div className="a01-file-icon accent">
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
      <div className="h-1 overflow-hidden rounded-sm bg-[var(--bg-surface)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-sm bg-[var(--accent)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
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
    <div className="a01-card a01-card-error">
      <div className="flex items-start gap-3 px-[18px] py-4">
        <span className="mt-0.5 shrink-0 text-[var(--error-text)]">
          <Icon d={ICONS.error_x} size={16} />
        </span>
        <div className="flex-1">
          <div className="mb-1 text-[13px] font-semibold text-[var(--error-text)]">
            بارگذاری فایل ناموفق بود
          </div>
          <div className="text-[12.5px] leading-7 text-[var(--text-secondary)]">
            اتصال در حین بارگذاری قطع شد. فایل به سرور نرسیده است. اتصال اینترنت را بررسی کنید و دوباره
            تلاش کنید.
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
    <div className="a01-card">
      <div className="flex items-center gap-3 p-5">
        <div className="a01-file-icon accent">
          <span className="a01-spin text-[var(--accent)]">
            <Icon d={ICONS.file} size={14} />
          </span>
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-medium text-[var(--text-primary)]">در حال پردازش فایل…</div>
          <div className="mt-0.5 text-xs leading-6 text-[var(--text-secondary)]">
            سرور در حال تجزیه و بررسی ساختار فایل است. می‌توانید صفحه را ترک کنید — نتیجه پردازش ذخیره
            خواهد شد.
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
    <div className="a01-card a01-card-error">
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
    <div className="a01-card overflow-hidden">
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
          { label: 'نیازمند بررسی در A02', value: reviewTotal, color: 'var(--warning-text)' },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="flex-1 px-1.5 py-1 text-center"
            style={{
              borderInlineEnd: index < 2 ? '1px solid var(--border-subtle)' : undefined,
            }}
          >
            <div className="text-base font-bold leading-none" style={{ color: stat.color }}>
              {toPersianDigits(stat.value)}
            </div>
            <div className="mt-0.5 whitespace-nowrap text-[10px] text-[var(--text-muted)]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 border-b border-[var(--border-subtle)] px-[18px] py-3">
        <div className="mb-1 text-[10.5px] font-semibold tracking-wide text-[var(--text-muted)]">
          یافته‌های قابل بررسی در A02
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
          {toPersianDigits(summary.importedCount)} ردیف وارد شده · {toPersianDigits(reviewTotal)} مورد
          نیازمند بررسی
        </div>
        <Button variant="primary" onClick={onContinueToReview}>
          بررسی موارد
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
    <div className="a01-card a01-card-success">
      <div className="flex items-start gap-3 px-[18px] py-4">
        <span className="mt-0.5 shrink-0 text-[var(--success-text)]">
          <Icon d={ICONS.check_circle} size={18} />
        </span>
        <div className="flex-1">
          <div className="mb-1 text-[13px] font-semibold text-[var(--success-text)]">
            فایل با موفقیت خوانده شد
          </div>
          <div className="text-[12.5px] leading-6 text-[var(--text-secondary)]">
            <span className="badge-count me-1">{toPersianDigits(importedFile.rowCount)} ردیف وارد شده</span>
            — موردی برای بررسی یافت نشد.
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[rgba(43,157,111,0.2)] px-[18px] py-2.5">
        <span className="text-[11.5px] text-[var(--text-muted)]">
          مرحله بعد: تأیید نهایی ردیف‌های وارد شده در بررسی داده.
        </span>
        <Button variant="primary" onClick={onContinue}>
          ادامه به بررسی داده
          <Icon d={ICONS.chevron_l} size={13} />
        </Button>
      </div>
    </div>
  );
}

export function CurrentFileSummary({
  importedFile,
  downstreamRisk,
  onReplace,
}: {
  importedFile: A01ImportedFile;
  downstreamRisk: A01DownstreamRisk;
  onReplace: () => void;
}) {
  return (
    <div className="a01-card">
      <div className="a01-card-row border-b border-[var(--border-subtle)]">
        <div className="a01-file-icon success">
          <Icon d={ICONS.file_excel} size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <LtrData className="block truncate text-[12.5px] font-medium text-[var(--text-primary)]">
            {importedFile.name}
          </LtrData>
          <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
            <span>بارگذاری: {importedFile.uploadedAt}</span>
            <span className="text-[var(--border-default)]">·</span>
            <span>{toPersianDigits(importedFile.rowCount)} ردیف خوانده شد</span>
          </div>
        </div>
        <PlanStatusBadge status="ready" />
      </div>
      <div className="flex items-center justify-between gap-2.5 px-4 py-2.5">
        {downstreamRisk === 'none' ? (
          <>
            <span className="text-xs text-[var(--text-muted)]">
              برای جایگزینی داده‌ها، فایل جدید بارگذاری کنید.
            </span>
            <Button variant="subtle" size="sm" onClick={onReplace}>
              <Icon d={ICONS.upload} size={12} />
              جایگزینی فایل
            </Button>
          </>
        ) : null}
        {downstreamRisk === 'planning' ? (
          <>
            <span className="text-xs text-[var(--warning-text)]">
              <Icon d={ICONS.alert} size={12} /> برنامه‌ریزی در جریان است — جایگزینی فایل محدود شده است.
            </span>
            <Button variant="subtle" size="sm" className="a01-warn-btn" onClick={onReplace}>
              جایگزینی با تأیید
            </Button>
          </>
        ) : null}
        {downstreamRisk === 'published' ? (
          <span className="text-xs text-[var(--text-muted)]">
            <Icon d={ICONS.info} size={12} /> برنامه منتشر شده — داده‌های عملیاتی قابل جایگزینی نیستند.
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ReplaceDatasetConfirm({
  downstreamRisk,
  onConfirm,
  onCancel,
}: {
  downstreamRisk: A01DownstreamRisk;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="a01-card a01-card-warning">
      <div className="px-[18px] py-4">
        <div className="mb-3 flex items-start gap-2.5">
          <span className="shrink-0 text-[var(--warning-text)]">
            <Icon d={ICONS.warning_tri} size={16} />
          </span>
          <div>
            <div className="mb-1 text-[13px] font-semibold text-[var(--warning-text)]">
              جایگزینی داده‌های ورودی
            </div>
            <div className="text-[12.5px] leading-7 text-[var(--text-secondary)]">
              جایگزینی فایل، موارد تحویل وارد شده قبلی و تصمیمات بررسی را پاک می‌کند.
              {downstreamRisk === 'planning'
                ? ' برنامه‌ریزی جاری نیز باید بازنشانی شود.'
                : null}
            </div>
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
              توجه: رفتار قطعی mutation پس از جایگزینی باید از Backend/OpenAPI بیاید — این Fixture فقط
              تعامل UI را شبیه‌سازی می‌کند.
            </p>
          </div>
        </div>
        {downstreamRisk === 'planning' ? (
          <InlineMessage tone="warning">
            مسیرها و تخصیص‌های جاری پس از جایگزینی داده باطل می‌شوند و باید دوباره برنامه‌ریزی شود.
          </InlineMessage>
        ) : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-[rgba(201,144,53,0.25)] px-[18px] py-2.5">
        <Button variant="subtle" onClick={onCancel}>
          انصراف
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          <Icon d={ICONS.upload} size={12} />
          بارگذاری فایل جدید
        </Button>
      </div>
    </div>
  );
}

export function ReplacementUploadFailedState({
  previousFile,
  onRetry,
  onSelectAnother,
}: {
  previousFile: A01ImportedFile;
  onRetry: () => void;
  onSelectAnother: () => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="a01-card a01-card-error">
        <div className="flex items-start gap-3 px-[18px] py-3.5">
          <span className="mt-0.5 shrink-0 text-[var(--error-text)]">
            <Icon d={ICONS.error_x} size={16} />
          </span>
          <div className="flex-1">
            <div className="mb-1 text-[13px] font-semibold text-[var(--error-text)]">
              بارگذاری فایل جدید ناموفق بود
            </div>
            <div className="text-[12.5px] leading-7 text-[var(--text-secondary)]">
              داده‌های فعلی برنامه بدون تغییر باقی ماندند. فایل جدید به سرور نرسیده است.
            </div>
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

      <div className="a01-card overflow-hidden border-[rgba(43,157,111,0.35)]">
        <div className="flex items-center gap-1.5 border-b border-[rgba(43,157,111,0.2)] bg-[rgba(43,157,111,0.07)] px-3.5 py-2">
          <span className="text-[var(--success-text)]">
            <Icon d={ICONS.check} size={12} />
          </span>
          <span className="text-[11px] font-semibold text-[var(--success-text)]">فایل فعال فعلی</span>
        </div>
        <div className="flex items-center gap-3 px-3.5 py-3">
          <div className="a01-file-icon success !h-[30px] !w-[30px]">
            <Icon d={ICONS.file_excel} size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <LtrData className="block truncate text-xs font-medium text-[var(--text-primary)]">
              {previousFile.name}
            </LtrData>
            <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              بارگذاری: {previousFile.uploadedAt} · {toPersianDigits(previousFile.rowCount)} ردیف
            </div>
          </div>
          <PlanStatusBadge status="ready" />
        </div>
      </div>
    </div>
  );
}

export function StaleDataBanner({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[var(--r-sm)] border border-[rgba(201,144,53,0.3)] bg-[var(--warning-muted)] px-3.5 py-2" role="status">
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
