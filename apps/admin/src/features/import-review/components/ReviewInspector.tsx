import { useEffect, useState } from 'react';

import { Icon, ICONS } from '@/features/plans/components/icons';
import { Button, Field, InlineMessage, Input, LtrData, Panel, StatusBadge } from '@/shared/ui';

import {
  REVIEW_ISSUE_PRESENTATION,
  REVIEW_ISSUE_SEVERITY,
  REVIEW_STATE_PRESENTATION,
} from '@/features/import-review/presentation';
import type { ReviewActionKind, ReviewTask, ReviewTaskUpdate } from '@/features/import-review/review-types';

type Mode = 'overview' | 'location' | 'edit' | 'duplicate' | 'exclude' | 'restore';
type Props = {
  task: ReviewTask | null;
  pendingKind?: ReviewActionKind;
  onResolveLocation: (id: string, coordinates: string) => Promise<boolean>;
  onEditInformation: (id: string, values: ReviewTaskUpdate) => Promise<boolean>;
  onResolveDuplicate: (id: string, decision: 'both_valid' | 'exclude_current') => Promise<boolean>;
  onExclude: (id: string) => Promise<boolean>;
  onRestore: (id: string) => Promise<boolean>;
};

export function ReviewInspector({
  task,
  pendingKind,
  onResolveLocation,
  onEditInformation,
  onResolveDuplicate,
  onExclude,
  onRestore,
}: Props) {
  const [mode, setMode] = useState<Mode>('overview');
  const [coordinates, setCoordinates] = useState('35.7219, 51.3347');
  const [originalValuesOpen, setOriginalValuesOpen] = useState(false);
  const [editValues, setEditValues] = useState<ReviewTaskUpdate>({
    name: '',
    phone: '',
    address: '',
  });
  useEffect(() => {
    setMode('overview');
    setOriginalValuesOpen(false);
  }, [task?.id]);

  if (!task)
    return (
      <aside className="review-inspector items-center justify-center gap-2.5 px-5 text-center text-xs leading-7 text-[var(--text-muted)]">
        <span className="text-[var(--text-disabled)]" aria-hidden><Icon d={ICONS.info} size={22} /></span>
        <span>برای مشاهده جزئیات و اقدامات، یک مورد را انتخاب کنید.</span>
      </aside>
    );

  const header = (title: string) => (
    <div className="review-inspector-header flex items-center gap-2 px-3.5 py-3">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label="بازگشت"
        disabled={Boolean(pendingKind)}
        onClick={() => setMode('overview')}
      >
        <Icon d={ICONS.chevron_r} size={13} />
      </Button>
      <strong className="text-[12.5px]">{title}</strong>
      <LtrData className="ms-auto text-[10.5px] text-[var(--text-muted)]">{task.id}</LtrData>
    </div>
  );

  if (mode === 'location')
    return (
      <aside className="review-inspector">
        {header('اصلاح موقعیت')}
        <div className="flex flex-col gap-3 overflow-y-auto p-3.5">
          <InlineMessage tone="warning">موقعیت نهایی صحیح را برای این مورد ثبت کنید.</InlineMessage>
          <Panel title="اطلاعات فعلی">
            <p className="m-0 text-xs text-[var(--text-secondary)]">{task.address}</p>
            <LtrData className="mt-1 block text-[10.5px] text-[var(--text-muted)]">
              {task.coordinates ?? 'بدون موقعیت'}
            </LtrData>
          </Panel>
          <Field label="مختصات نهایی" htmlFor="review-location-coordinates">
            <Input
              id="review-location-coordinates"
              dir="ltr"
              value={coordinates}
              onChange={(e) => setCoordinates(e.target.value)}
            />
          </Field>
          <Button
            disabled={!coordinates.trim()}
            loading={pendingKind === 'location'}
            onClick={async () => {
              if (await onResolveLocation(task.id, coordinates.trim())) setMode('overview');
            }}
          >
            ثبت موقعیت
          </Button>
        </div>
      </aside>
    );

  if (mode === 'edit') {
    const phoneValid = /^09\d{9}$/.test(editValues.phone.replace(/\D/g, ''));
    return (
      <aside className="review-inspector">
        {header('ویرایش اطلاعات')}
        <div className="flex flex-col gap-3 overflow-y-auto p-3.5">
          <Field label="نام گیرنده" htmlFor="review-recipient-name">
            <Input
              id="review-recipient-name"
              value={editValues.name}
              onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
            />
          </Field>
          <Field
            label="شماره تماس"
            htmlFor="review-recipient-phone"
            error={phoneValid ? undefined : 'شماره همراه باید ۱۱ رقم و با ۰۹ شروع شود.'}
          >
            <Input
              id="review-recipient-phone"
              dir="ltr"
              error={!phoneValid}
              value={editValues.phone}
              onChange={(e) => setEditValues((v) => ({ ...v, phone: e.target.value }))}
            />
          </Field>
          <Field label="آدرس تحویل" htmlFor="review-recipient-address">
            <Input
              id="review-recipient-address"
              value={editValues.address}
              onChange={(e) => setEditValues((v) => ({ ...v, address: e.target.value }))}
            />
          </Field>
          <Button
            disabled={!editValues.name.trim() || !editValues.address.trim() || !phoneValid}
            loading={pendingKind === 'information'}
            onClick={async () => {
              if (await onEditInformation(task.id, editValues)) setMode('overview');
            }}
          >
            ذخیره اطلاعات
          </Button>
        </div>
      </aside>
    );
  }

  if (mode === 'duplicate')
    return (
      <aside className="review-inspector">
        {header('بررسی شماره سفارش تکراری')}
        <div className="flex flex-col gap-3 overflow-y-auto p-3.5">
          <InlineMessage tone="warning">
            شماره سفارش این ردیف در همین واردات تکرار شده است.
          </InlineMessage>
          <Panel title="ردیف‌های مشابه">
            <div className="flex flex-col gap-2 text-xs">
              <div>
                <LtrData>{task.id}</LtrData> · {task.name}
              </div>
              <div>
                <LtrData>D-1042</LtrData> · صادق رضایی
              </div>
            </div>
          </Panel>
          <Button
            variant="secondary"
            loading={pendingKind === 'duplicate'}
            onClick={async () => {
              if (await onResolveDuplicate(task.id, 'both_valid')) setMode('overview');
            }}
          >
            هر دو ردیف معتبرند
          </Button>
          <Button
            variant="destructive"
            disabled={pendingKind === 'duplicate'}
            onClick={() => void onResolveDuplicate(task.id, 'exclude_current')}
          >
            مستثنا کردن این ردیف
          </Button>
        </div>
      </aside>
    );

  if (mode === 'exclude' || mode === 'restore') {
    const restoring = mode === 'restore';
    return (
      <aside className="review-inspector">
        {header(restoring ? 'بازگرداندن به برنامه' : 'مستثنا کردن از برنامه')}
        <div className="flex flex-col gap-3 p-3.5">
          <InlineMessage tone={restoring ? 'info' : 'warning'}>
            {restoring
              ? 'این مورد به وضعیت متناسب با مسائل فعلی بازمی‌گردد.'
              : 'این مورد از برنامه‌ریزی خارج می‌شود و سابقه واردات حفظ خواهد شد.'}
          </InlineMessage>
          <Button
            variant={restoring ? 'primary' : 'destructive'}
            loading={pendingKind === (restoring ? 'restore' : 'exclude')}
            onClick={async () => {
              const succeeded = restoring ? await onRestore(task.id) : await onExclude(task.id);
              if (succeeded) setMode('overview');
            }}
          >
            {restoring ? 'بازگردان' : 'مستثنا کن'}
          </Button>
          <Button variant="subtle" disabled={Boolean(pendingKind)} onClick={() => setMode('overview')}>
            انصراف
          </Button>
        </div>
      </aside>
    );
  }

  const state = REVIEW_STATE_PRESENTATION[task.state];
  const hasLocationIssue = task.issues.some(
    (issue) =>
      issue === 'loc_not_found' ||
      issue === 'loc_ambiguous' ||
      issue === 'loc_mismatch' ||
      issue === 'invalid_coords',
  );
  return (
    <aside className="review-inspector">
      <div className="review-inspector-header px-3.5 py-2.5">
        <div className="mb-1 flex items-start justify-between gap-2">
          <LtrData className="text-[13px] font-bold">{task.id}</LtrData>
          <StatusBadge tone={state.tone} label={state.label} />
        </div>
        <div className="text-xs text-[var(--text-secondary)]">توقف تحویل</div>
        {task.issues.length ? (
          <div className="mt-1.5 flex flex-wrap gap-[3px]">
            {task.issues.map((issue) => {
              const issuePresentation = REVIEW_ISSUE_PRESENTATION[issue];
              return <span key={issue} className={`badge ${issuePresentation.badgeClass}`}>{issuePresentation.label}</span>;
            })}
          </div>
        ) : null}
      </div>
      <div className="review-inspector-scroll">
        {task.issues.length ? (
          <section className="review-inspector-section">
            <h2 className="review-inspector-label">مسائل شناسایی‌شده</h2>
            <div className="flex flex-col gap-[5px]">
              {task.issues.map((issue) => {
                const severity = REVIEW_ISSUE_SEVERITY[issue];
                const issueIcon = severity.severity === 'blocking' ? ICONS.error_x : severity.severity === 'review' ? ICONS.alert : ICONS.info;
                return (
                  <div key={issue} className="flex items-center gap-1.5">
                    <span className={`review-issue-icon review-issue-icon--${severity.severity}`}><Icon d={issueIcon} size={12} /></span>
                    <span className="min-w-0 flex-1 text-xs">{REVIEW_ISSUE_PRESENTATION[issue].label}</span>
                    <StatusBadge tone={severity.tone} label={severity.label} />
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="review-inspector-section">
          <h2 className="review-inspector-label">اطلاعات گیرنده</h2>
          <dl className="m-0">
            <div className="review-inspector-kv"><dt>نام</dt><dd className="font-medium">{task.name}</dd></div>
            <div className="review-inspector-kv"><dt>تلفن</dt><dd className={task.issues.includes('phone') ? 'text-[var(--warning-text)]' : ''}><LtrData>{task.phone}</LtrData></dd></div>
            <div className="review-inspector-kv"><dt>آدرس تحویل</dt><dd>{task.address}</dd></div>
          </dl>
        </section>

        <section className="review-inspector-section">
          <h2 className="review-inspector-label">موقعیت نهایی</h2>
          {task.coordinates ? (
            <>
              <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-secondary)]"><span className="text-[var(--success-text)]"><Icon d={ICONS.map_pin} size={12} /></span><LtrData>{task.coordinates}</LtrData></div>
              {task.issues.includes('loc_mismatch') || task.issues.includes('loc_ambiguous') ? <div className="mt-1 flex items-center gap-1 text-[10.5px] text-[var(--error-text)]"><Icon d={ICONS.alert} size={10} />نیازمند تأیید موقعیت</div> : null}
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-[var(--error-text)]">
              <Icon d={task.issues.includes('invalid_coords') ? ICONS.error_x : ICONS.map_pin} size={12} />
              {task.issues.includes('invalid_coords') ? 'مختصات ورودی نامعتبر' : task.issues.includes('loc_ambiguous') ? 'نتیجه مکان‌یابی مبهم' : 'موقعیتی یافت نشد'}
            </div>
          )}
          {task.originalValues.latitude !== null || task.originalValues.longitude !== null ? <LtrData className="mt-1 block text-[10px] text-[var(--text-disabled)]">ورودی: {task.originalValues.latitude ?? '—'}, {task.originalValues.longitude ?? '—'}</LtrData> : null}
        </section>

        <section className="review-inspector-section">
          <h2 className="review-inspector-label">اقدامات</h2>
          <div className="flex flex-col gap-1">
          {hasLocationIssue ? (
            <Button variant="secondary" size="sm" className="review-inspector-action" onClick={() => setMode('location')}>
              <Icon d={ICONS.map_pin} size={12} /> اصلاح موقعیت
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            className="review-inspector-action"
            onClick={() => {
              setEditValues({
                name: task.name,
                phone: task.phone.replace(/\D/g, ''),
                address: task.address,
              });
              setMode('edit');
            }}
          >
            <Icon d={ICONS.edit} size={12} /> ویرایش اطلاعات
          </Button>
          {task.issues.includes('dup_order_id') ? (
            <Button variant="secondary" size="sm" className="review-inspector-action" onClick={() => setMode('duplicate')}>
              <Icon d={ICONS.copy} size={12} /> بررسی شماره سفارش تکراری
            </Button>
          ) : null}
          </div>
        </section>

        <section className="review-inspector-section">
          <Button variant="ghost" size="sm" className="review-original-values-toggle" aria-expanded={originalValuesOpen} onClick={() => setOriginalValuesOpen((open) => !open)}>
            <span className="review-inspector-label !mb-0">مقادیر فایل اصلی</span>
            <Icon d={originalValuesOpen ? ICONS.chevron_d : ICONS.chevron_r} size={11} />
          </Button>
          {originalValuesOpen ? (
            <dl className="review-original-values">
              <div className="review-inspector-kv"><dt>آدرس فایل</dt><dd>{task.originalValues.address}</dd></div>
              <div className="review-inspector-kv"><dt>Latitude</dt><dd><LtrData>{task.originalValues.latitude ?? '—'}</LtrData></dd></div>
              <div className="review-inspector-kv"><dt>Longitude</dt><dd><LtrData>{task.originalValues.longitude ?? '—'}</LtrData></dd></div>
              <div className="review-inspector-kv"><dt>شماره تلفن فایل</dt><dd><LtrData>{task.originalValues.phone}</LtrData></dd></div>
            </dl>
          ) : null}
        </section>

        <div className="px-3.5 py-2.5">
          {task.state === 'excluded' ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11.5px] leading-6 text-[var(--text-muted)]">این مورد از برنامه مستثنا شده است.</span>
              <Button variant="secondary" size="sm" className="review-inspector-action" onClick={() => setMode('restore')}><Icon d={ICONS.check} size={12} /> بازگرداندن به برنامه</Button>
            </div>
          ) : (
            <Button variant="destructive" size="sm" className="review-inspector-action" onClick={() => setMode('exclude')}><Icon d={ICONS.alert} size={12} /> مستثنا کردن از برنامه</Button>
          )}
        </div>
      </div>
    </aside>
  );
}
