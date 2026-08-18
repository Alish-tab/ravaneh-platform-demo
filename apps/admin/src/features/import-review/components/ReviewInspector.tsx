import { useMemo, useState } from 'react';

import { Icon, ICONS } from '@/features/plans/components/icons';
import { Button, Field, InlineMessage, Input, LtrData, Panel, StatusBadge } from '@/shared/ui';

import { ReviewLocationEditor } from '@/features/import-review/components/ReviewLocationEditor';
import {
  REVIEW_ISSUE_PRESENTATION,
  REVIEW_ISSUE_SEVERITY,
  REVIEW_STATE_PRESENTATION,
} from '@/features/import-review/presentation';
import {
  duplicatePeers,
  formatResolvedLocation,
  hasLocationIssue,
  locationSourceLabel,
  rawSourceLocation,
  savedLocation,
} from '@/features/import-review/review-model';
import type {
  ReviewActionKind,
  ReviewLatLng,
  ReviewTask,
  ReviewTaskUpdate,
} from '@/features/import-review/review-types';

type Mode = 'overview' | 'location' | 'edit' | 'duplicate' | 'exclude' | 'restore' | 'discard';
type Props = {
  task: ReviewTask | null;
  allTasks: ReviewTask[];
  pendingKind?: ReviewActionKind;
  saveFailed?: boolean;
  readOnly?: boolean;
  onResolveLocation: (id: string, coords: ReviewLatLng) => Promise<boolean>;
  onEditInformation: (id: string, values: ReviewTaskUpdate) => Promise<boolean>;
  onResolveDuplicate: (id: string, decision: 'both_valid' | 'exclude_current') => Promise<boolean>;
  onExclude: (id: string) => Promise<boolean>;
  onRestore: (id: string) => Promise<boolean>;
};

const UPDATED_FIELD_LABEL: Record<string, string> = {
  phone: 'تلفن',
  name: 'نام',
  address: 'آدرس',
  coords: 'موقعیت',
};

export function ReviewInspector({
  task,
  allTasks,
  pendingKind,
  saveFailed = false,
  readOnly = false,
  onResolveLocation,
  onEditInformation,
  onResolveDuplicate,
  onExclude,
  onRestore,
}: Props) {
  const [mode, setMode] = useState<Mode>('overview');
  const [proposed, setProposed] = useState<ReviewLatLng | null>(null);
  const [originalValuesOpen, setOriginalValuesOpen] = useState(false);
  const [editValues, setEditValues] = useState<ReviewTaskUpdate>({
    name: '',
    phone: '',
    address: '',
  });
  const [editDirty, setEditDirty] = useState(false);

  const peers = useMemo(
    () => (task ? duplicatePeers(allTasks, task) : []),
    [allTasks, task],
  );

  if (!task)
    return (
      <aside className="review-inspector items-center justify-center gap-2.5 px-5 text-center text-xs leading-7 text-[var(--text-muted)]">
        <span className="text-[var(--text-disabled)]" aria-hidden>
          <Icon d={ICONS.info} size={22} />
        </span>
        <span>برای مشاهده جزئیات و اقدامات، یک مورد را انتخاب کنید.</span>
      </aside>
    );

  const goBack = () => {
    if (mode === 'edit' && editDirty) {
      setMode('discard');
      return;
    }
    setMode('overview');
    setProposed(null);
  };

  const header = (title: string) => (
    <div className="review-inspector-header flex items-center gap-2 px-3.5 py-3">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label="بازگشت"
        disabled={Boolean(pendingKind)}
        onClick={goBack}
      >
        <Icon d={ICONS.chevron_r} size={13} />
      </Button>
      <strong className="text-[12.5px]">{title}</strong>
      <LtrData className="ms-auto text-[10.5px] text-[var(--text-muted)]">
        {task.externalOrderId}
      </LtrData>
    </div>
  );

  if (mode === 'discard') {
    return (
      <aside className="review-inspector">
        {header('انصراف از ویرایش')}
        <div className="flex flex-col gap-3 p-3.5">
          <InlineMessage tone="warning">تغییرات ذخیره نشده از بین می‌روند.</InlineMessage>
          <Button
            variant="destructive"
            onClick={() => {
              setEditDirty(false);
              setMode('overview');
            }}
          >
            دور ریختن تغییرات
          </Button>
          <Button variant="subtle" onClick={() => setMode('edit')}>
            ادامه ویرایش
          </Button>
        </div>
      </aside>
    );
  }

  if (mode === 'location') {
    const saved = savedLocation(task);
    return (
      <aside className="review-inspector">
        {header('اصلاح موقعیت')}
        <div className="flex flex-col gap-3 overflow-y-auto p-3.5">
          <InlineMessage tone="warning">
            روی نقشه کلیک کنید تا موقعیت پیشنهادی انتخاب شود. تا ذخیره، موقعیت فعلی تغییر نمی‌کند.
          </InlineMessage>
          <Panel title="مبدأ خام">
            <p className="m-0 text-xs text-[var(--text-secondary)]">{task.rawAddress}</p>
            <LtrData className="mt-1 block text-[10.5px] text-[var(--text-muted)]">
              {task.rawLatitude || '—'}, {task.rawLongitude || '—'}
            </LtrData>
          </Panel>
          <ReviewLocationEditor
            saved={saved}
            proposed={proposed}
            onPropose={setProposed}
            readOnly={readOnly}
          />
          {saveFailed ? (
            <InlineMessage tone="error">ذخیره ناموفق بود. موقعیت پیشنهادی حفظ شده است.</InlineMessage>
          ) : null}
          <Button
            disabled={!proposed || readOnly}
            loading={pendingKind === 'location'}
            onClick={async () => {
              if (!proposed) return;
              if (await onResolveLocation(task.id, proposed)) {
                setProposed(null);
                setMode('overview');
              }
            }}
          >
            ذخیره موقعیت
          </Button>
          <Button
            variant="subtle"
            disabled={Boolean(pendingKind)}
            onClick={() => {
              setProposed(null);
              setMode('overview');
            }}
          >
            انصراف
          </Button>
        </div>
      </aside>
    );
  }

  if (mode === 'edit') {
    const phoneValid = /^09\d{9}$/.test(editValues.phone.replace(/\D/g, ''));
    return (
      <aside className="review-inspector">
        {header('ویرایش اطلاعات')}
        <div className="flex flex-col gap-3 overflow-y-auto p-3.5">
          <InlineMessage tone="info">مقادیر خام واردات تغییر نمی‌کنند.</InlineMessage>
          <Field label="نام گیرنده" htmlFor="review-recipient-name">
            <Input
              id="review-recipient-name"
              value={editValues.name}
              disabled={readOnly}
              onChange={(e) => {
                setEditDirty(true);
                setEditValues((v) => ({ ...v, name: e.target.value }));
              }}
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
              disabled={readOnly}
              value={editValues.phone}
              onChange={(e) => {
                setEditDirty(true);
                setEditValues((v) => ({ ...v, phone: e.target.value }));
              }}
            />
          </Field>
          <Field label="آدرس تحویل" htmlFor="review-recipient-address">
            <Input
              id="review-recipient-address"
              value={editValues.address}
              disabled={readOnly}
              onChange={(e) => {
                setEditDirty(true);
                setEditValues((v) => ({ ...v, address: e.target.value }));
              }}
            />
          </Field>
          {saveFailed ? (
            <InlineMessage tone="error">ذخیره ناموفق بود. مقادیر واردشده حفظ شده‌اند.</InlineMessage>
          ) : null}
          <Button
            disabled={!editValues.name.trim() || !editValues.address.trim() || !phoneValid || readOnly}
            loading={pendingKind === 'information'}
            onClick={async () => {
              if (await onEditInformation(task.id, editValues)) {
                setEditDirty(false);
                setMode('overview');
              }
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
            شماره سفارش این ردیف در همین واردات تکرار شده است. ردیف‌ها فقط وقتی تکراری‌اند که شناسه سفارش
            یکسان باشد.
          </InlineMessage>
          <Panel title="ردیف‌های با همان شماره سفارش">
            <div className="flex flex-col gap-2 text-xs">
              <div>
                <LtrData>{task.externalOrderId}</LtrData> · {task.name}
              </div>
              {peers.map((peer) => (
                <div key={peer.reviewItemId}>
                  <LtrData>{peer.externalOrderId}</LtrData> · {peer.name}
                  <div className="mt-0.5 text-[10.5px] text-[var(--text-muted)]">{peer.address}</div>
                </div>
              ))}
            </div>
          </Panel>
          {readOnly ? null : (
            <>
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
            </>
          )}
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
  const resolved = formatResolvedLocation(task);
  const rawCoords = rawSourceLocation(task);
  const currentAddressDiffers = task.address !== task.rawAddress;

  return (
    <aside className="review-inspector">
      <div className="review-inspector-header px-3.5 py-2.5">
        <div className="mb-1 flex items-start justify-between gap-2">
          <LtrData className="text-[13px] font-bold">{task.externalOrderId}</LtrData>
          <StatusBadge tone={state.tone} label={state.label} />
        </div>
        <div className="text-xs text-[var(--text-secondary)]">توقف تحویل</div>
        {task.issues.length ? (
          <div className="mt-1.5 flex flex-wrap gap-[3px]">
            {task.issues.map((issue) => {
              const issuePresentation = REVIEW_ISSUE_PRESENTATION[issue];
              return (
                <span key={issue} className={`badge ${issuePresentation.badgeClass}`}>
                  {issuePresentation.label}
                </span>
              );
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
                const issueIcon =
                  severity.severity === 'blocking'
                    ? ICONS.error_x
                    : severity.severity === 'review'
                      ? ICONS.alert
                      : ICONS.info;
                return (
                  <div key={issue} className="flex items-center gap-1.5">
                    <span className={`review-issue-icon review-issue-icon--${severity.severity}`}>
                      <Icon d={issueIcon} size={12} />
                    </span>
                    <span className="min-w-0 flex-1 text-xs">
                      {REVIEW_ISSUE_PRESENTATION[issue].label}
                    </span>
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
            <div className="review-inspector-kv">
              <dt>نام</dt>
              <dd className="font-medium">{task.name}</dd>
            </div>
            <div className="review-inspector-kv">
              <dt>تلفن</dt>
              <dd className={task.issues.includes('phone') ? 'text-[var(--warning-text)]' : ''}>
                <LtrData>{task.phone}</LtrData>
              </dd>
            </div>
            <div className="review-inspector-kv">
              <dt>آدرس تحویل</dt>
              <dd>{task.address}</dd>
            </div>
            {currentAddressDiffers ? (
              <div className="review-inspector-kv">
                <dt>آدرس فعلی</dt>
                <dd>{task.address}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="review-inspector-section">
          <h2 className="review-inspector-label">موقعیت عملیاتی</h2>
          {resolved ? (
            <>
              <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-secondary)]">
                <span className="text-[var(--success-text)]">
                  <Icon d={ICONS.map_pin} size={12} />
                </span>
                <LtrData>{resolved}</LtrData>
              </div>
              <div className="mt-1 text-[10.5px] text-[var(--text-muted)]">
                منبع: {locationSourceLabel(task.locSource)}
              </div>
              {task.issues.includes('loc_mismatch') || task.issues.includes('loc_ambiguous') ? (
                <div className="mt-1 flex items-center gap-1 text-[10.5px] text-[var(--error-text)]">
                  <Icon d={ICONS.alert} size={10} />
                  نیازمند تأیید موقعیت
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-[var(--error-text)]">
              <Icon d={task.issues.includes('invalid_coords') ? ICONS.error_x : ICONS.map_pin} size={12} />
              {task.issues.includes('invalid_coords')
                ? 'مختصات ورودی نامعتبر'
                : task.issues.includes('loc_ambiguous')
                  ? 'نتیجه مکان‌یابی مبهم'
                  : 'موقعیتی یافت نشد'}
            </div>
          )}
          <LtrData className="mt-1 block text-[10px] text-[var(--text-disabled)]">
            مبدأ خام: {task.rawLatitude || '—'}, {task.rawLongitude || '—'}
            {rawCoords ? '' : ' · موقعیت عملیاتی نیست'}
          </LtrData>
        </section>

        {task.downstreamImpact === 'planning' ? (
          <section className="review-inspector-section">
            <InlineMessage tone="warning">این تغییر نیازمند توجه برنامه‌ریزی است.</InlineMessage>
          </section>
        ) : null}

        {task.updatedFields?.length ? (
          <section className="review-inspector-section">
            <h2 className="review-inspector-label">فیلدهای تغییرکرده</h2>
            <div className="text-[11.5px] text-[var(--text-secondary)]">
              {task.updatedFields.map((field) => UPDATED_FIELD_LABEL[field] ?? field).join('، ')}
            </div>
          </section>
        ) : null}

        {readOnly ? (
          <section className="review-inspector-section">
            <InlineMessage tone="info">این نسخه فقط مشاهده است.</InlineMessage>
          </section>
        ) : (
          <section className="review-inspector-section">
            <h2 className="review-inspector-label">اقدامات</h2>
            <div className="flex flex-col gap-1">
              {hasLocationIssue(task) ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="review-inspector-action"
                  onClick={() => setMode('location')}
                >
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
                  setEditDirty(false);
                  setMode('edit');
                }}
              >
                <Icon d={ICONS.edit} size={12} /> ویرایش اطلاعات
              </Button>
              {task.issues.includes('dup_order_id') ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="review-inspector-action"
                  onClick={() => setMode('duplicate')}
                >
                  <Icon d={ICONS.copy} size={12} /> بررسی شماره سفارش تکراری
                </Button>
              ) : null}
            </div>
          </section>
        )}

        <section className="review-inspector-section">
          <Button
            variant="ghost"
            size="sm"
            className="review-original-values-toggle"
            aria-expanded={originalValuesOpen}
            onClick={() => setOriginalValuesOpen((open) => !open)}
          >
            <span className="review-inspector-label !mb-0">مقادیر فایل اصلی</span>
            <Icon d={originalValuesOpen ? ICONS.chevron_d : ICONS.chevron_r} size={11} />
          </Button>
          {originalValuesOpen ? (
            <dl className="review-original-values">
              <div className="review-inspector-kv">
                <dt>نام فایل</dt>
                <dd>{task.rawCustomerName}</dd>
              </div>
              <div className="review-inspector-kv">
                <dt>آدرس فایل</dt>
                <dd>{task.rawAddress}</dd>
              </div>
              <div className="review-inspector-kv">
                <dt>Latitude</dt>
                <dd>
                  <LtrData>{task.rawLatitude || '—'}</LtrData>
                </dd>
              </div>
              <div className="review-inspector-kv">
                <dt>Longitude</dt>
                <dd>
                  <LtrData>{task.rawLongitude || '—'}</LtrData>
                </dd>
              </div>
              <div className="review-inspector-kv">
                <dt>شماره تلفن فایل</dt>
                <dd>
                  <LtrData>{task.rawPhone}</LtrData>
                </dd>
              </div>
            </dl>
          ) : null}
        </section>

        {readOnly ? null : (
          <div className="px-3.5 py-2.5">
            {task.state === 'excluded' ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11.5px] leading-6 text-[var(--text-muted)]">
                  این مورد از برنامه مستثنا شده است.
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="review-inspector-action"
                  onClick={() => setMode('restore')}
                >
                  <Icon d={ICONS.check} size={12} /> بازگرداندن به برنامه
                </Button>
              </div>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                className="review-inspector-action"
                onClick={() => setMode('exclude')}
              >
                <Icon d={ICONS.alert} size={12} /> مستثنا کردن از برنامه
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
