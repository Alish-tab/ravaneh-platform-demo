import { useState } from 'react';

import {
  deriveAreas,
  filterAreas,
  followupOrders,
  locationOrders,
  locationsForArea,
} from '@/features/execution/model/derive';
import {
  AREA_EXEC_STATE_LABEL,
  UI_STATUS_LABEL,
  failureReasonLabel,
} from '@/features/execution/model/presentation';
import type {
  AreaFilter,
  ExecutionFollowupNote,
  ExecutionOrder,
  ExecutionSnapshot,
  ExecutionUiStatus,
  PanelView,
} from '@/features/execution/model/types';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { toPersianDigits } from '@/shared/lib/format';
import { formatPhoneForDisplay, normalizePhone } from '@/shared/lib/phone';
import { LtrData } from '@/shared/ui';

type OperationsPanelProps = {
  snapshot: ExecutionSnapshot;
  selectedAreaId: string | null;
  view: PanelView;
  onViewChange: (view: PanelView) => void;
  onSelectArea: (areaId: string | null) => void;
  onClose: () => void;
  searchOrder: (query: string) => Promise<ExecutionOrder | null>;
  saveFollowupNote: (orderId: string, note: string) => Promise<ExecutionFollowupNote>;
  onPhoneCopyResult: (result: 'success' | 'error') => void;
};

function StatusPill({ status }: { status: ExecutionUiStatus }) {
  return <span className={`execution-pill ${status}`}>{UI_STATUS_LABEL[status]}</span>;
}

function CopyPhoneButton({
  phone,
  onCopyResult,
}: {
  phone: string;
  onCopyResult: (result: 'success' | 'error') => void;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(normalizePhone(phone));
      onCopyResult('success');
    } catch {
      onCopyResult('error');
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <LtrData className="text-[12.5px] font-semibold">{formatPhoneForDisplay(phone)}</LtrData>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label="کپی شماره تلفن"
        onClick={() => void copy()}
      >
        <Icon d={ICONS.copy} size={11} />
      </button>
    </span>
  );
}

function FollowupDetailView({
  order,
  areaName,
  areaColor,
  driverName,
  notes,
  onSave,
  onPhoneCopyResult,
}: {
  order: ExecutionOrder;
  areaName: string;
  areaColor: string | undefined;
  driverName: string;
  notes: ExecutionFollowupNote[];
  onSave: (note: string) => Promise<ExecutionFollowupNote>;
  onPhoneCopyResult: (result: 'success' | 'error') => void;
}) {
  const [noteText, setNoteText] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'failed' | 'saved'>('idle');
  const orderNotes = [...notes].reverse();

  const handleSave = async () => {
    if (!noteText.trim() || saveState === 'saving') return;
    setSaveState('saving');
    try {
      await onSave(noteText.trim());
      setNoteText('');
      setShowForm(false);
      setSaveState('saved');
    } catch {
      setSaveState('failed');
    }
  };

  return (
    <div>
      <div className="border-b border-[var(--border-subtle)] px-3 pt-2.5 pb-3">
        <div className="mb-0.5 text-[10px] text-[var(--text-muted)]">سفارش</div>
        <div className="mb-2.5 text-[18px] font-bold">
          <LtrData>#{order.id}</LtrData>
        </div>
        <div className="execution-kv">
          <span className="execution-kv-key">گیرنده</span>
          <span className="execution-kv-val font-medium">{order.recipient}</span>
        </div>
        <div className="execution-kv">
          <span className="execution-kv-key">تلفن</span>
          <span className="execution-kv-val">
            <CopyPhoneButton phone={order.phone} onCopyResult={onPhoneCopyResult} />
          </span>
        </div>
        <div className="execution-kv">
          <span className="execution-kv-key">محدوده</span>
          <span className="execution-kv-val" style={{ color: areaColor }}>
            {areaName}
          </span>
        </div>
        <div className="execution-kv">
          <span className="execution-kv-key">راننده</span>
          <span className="execution-kv-val">{driverName}</span>
        </div>
        <div className="execution-kv">
          <span className="execution-kv-key">وضعیت</span>
          <span className="execution-kv-val">
            <StatusPill status={order.uiStatus} />
          </span>
        </div>
        <div className="execution-kv">
          <span className="execution-kv-key">علت عدم تحویل</span>
          <span className="execution-kv-val text-[#c99035]">
            {failureReasonLabel(order.failureReasonCode)}
          </span>
        </div>
        {order.driverNote ? (
          <div className="execution-kv">
            <span className="execution-kv-key">یادداشت راننده</span>
            <span className="execution-kv-val text-[var(--text-secondary)] italic">
              {order.driverNote}
            </span>
          </div>
        ) : null}
        <div className="execution-kv">
          <span className="execution-kv-key">زمان رویداد</span>
          <span className="execution-kv-val">
            <LtrData>{order.lastEventLabel}</LtrData>
          </span>
        </div>
      </div>

      <div className="border-b border-[var(--border-subtle)] px-2.5 py-2">
        {!showForm ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="flex h-[30px] flex-1 items-center justify-center gap-1 rounded-[var(--r-sm)] border border-[rgba(79,142,247,0.25)] bg-[rgba(79,142,247,0.08)] text-xs font-medium text-[var(--accent)]"
              onClick={() => {
                setShowForm(true);
                setSaveState('idle');
              }}
            >
              <Icon d={ICONS.edit} size={12} />
              ثبت پیگیری
            </button>
            {saveState === 'saved' ? (
              <span className="flex shrink-0 items-center gap-0.5 text-[10.5px] text-[#3da87a]">
                <Icon d={ICONS.check} size={10} /> ثبت شد
              </span>
            ) : null}
          </div>
        ) : (
          <form
            className="execution-note-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <label
              className="mb-1 block text-[10.5px] font-medium text-[var(--text-muted)]"
              htmlFor="followup-note"
            >
              یادداشت پیگیری
            </label>
            <textarea
              id="followup-note"
              value={noteText}
              rows={3}
              placeholder="یادداشت عملیاتی…"
              className={saveState === 'failed' ? 'failed' : ''}
              onChange={(event) => {
                setNoteText(event.target.value);
                if (saveState === 'failed') setSaveState('idle');
              }}
            />
            {saveState === 'failed' ? (
              <div
                className="mt-1 flex items-center gap-1 text-[10.5px] text-[#c44444]"
                role="alert"
              >
                <Icon d={ICONS.error_x} size={10} />
                خطا در ثبت. یادداشت حفظ شده است.
              </div>
            ) : null}
            <div className="mt-1.5 flex gap-1.5">
              <button
                type="submit"
                className="btn btn-primary btn-sm flex-1"
                disabled={saveState === 'saving' || !noteText.trim()}
              >
                {saveState === 'saving' ? <span className="execution-spin" aria-hidden /> : null}
                {saveState === 'failed' ? 'تلاش مجدد' : 'ثبت'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={saveState === 'saving'}
                onClick={() => {
                  setShowForm(false);
                  setSaveState('idle');
                }}
              >
                انصراف
              </button>
            </div>
          </form>
        )}
      </div>

      <div>
        <div className="flex items-center gap-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5">
          <span className="text-[10.5px] font-semibold text-[var(--text-muted)]">سابقه پیگیری</span>
          {orderNotes.length > 0 ? (
            <span className="text-[10px] text-[var(--text-disabled)]">
              {toPersianDigits(orderNotes.length)}
            </span>
          ) : null}
        </div>
        {orderNotes.length === 0 ? (
          <div className="px-3 py-3.5 text-center text-[11.5px] text-[var(--text-disabled)]">
            هنوز یادداشتی ثبت نشده
          </div>
        ) : (
          orderNotes.map((note) => (
            <div
              key={note.id}
              className="border-b border-[var(--border-subtle)] px-2.5 py-1.5 last:border-b-0"
            >
              <div className="mb-0.5 flex items-baseline gap-1">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  {note.adminName}
                </span>
                <LtrData className="ms-auto text-[10px] text-[var(--text-disabled)]">
                  {note.timestampLabel}
                </LtrData>
              </div>
              <div className="text-[11.5px] leading-relaxed text-[var(--text-primary)]">
                {note.note}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function OperationsPanel({
  snapshot,
  selectedAreaId,
  view,
  onViewChange,
  onSelectArea,
  onClose,
  searchOrder,
  saveFollowupNote,
  onPhoneCopyResult,
}: OperationsPanelProps) {
  const [filter, setFilter] = useState<AreaFilter>('all');
  const [searchVal, setSearchVal] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const areas = deriveAreas(snapshot);
  const followups = followupOrders(snapshot);
  const panelTab =
    view.kind === 'followup-list' || view.kind === 'followup-detail' ? 'followup' : 'areas';
  const showBack = view.kind !== 'areas' && view.kind !== 'followup-list';

  const backLabel = (() => {
    if (view.kind === 'area-detail') return 'محدوده‌ها';
    if (view.kind === 'location-detail') {
      const loc = snapshot.locations.find((item) => item.id === view.locationId);
      return areas.find((area) => area.id === loc?.areaId)?.name ?? 'محدوده';
    }
    if (view.kind === 'order-detail') {
      if (!view.backLocationId) return 'محدوده‌ها';
      return (
        snapshot.locations.find((item) => item.id === view.backLocationId)?.address ?? 'نقطه تحویل'
      );
    }
    if (view.kind === 'not-found') return 'محدوده‌ها';
    if (view.kind === 'followup-detail') return 'نیازمند پیگیری';
    return '';
  })();

  const handleBack = () => {
    if (view.kind === 'area-detail') {
      onSelectArea(null);
      onViewChange({ kind: 'areas' });
      return;
    }
    if (view.kind === 'location-detail') {
      const loc = snapshot.locations.find((item) => item.id === view.locationId);
      if (loc) {
        onSelectArea(loc.areaId);
        onViewChange({ kind: 'area-detail', areaId: loc.areaId });
      }
      return;
    }
    if (view.kind === 'order-detail') {
      if (view.backLocationId) {
        onViewChange({ kind: 'location-detail', locationId: view.backLocationId });
      } else {
        onSelectArea(null);
        onViewChange({ kind: 'areas' });
      }
      return;
    }
    if (view.kind === 'not-found') {
      onViewChange({ kind: 'areas' });
      return;
    }
    if (view.kind === 'followup-detail') {
      onViewChange({ kind: 'followup-list' });
    }
  };

  const switchTab = (tab: 'areas' | 'followup') => {
    if (tab === 'areas') {
      onSelectArea(null);
      onViewChange({ kind: 'areas' });
    } else {
      onViewChange({ kind: 'followup-list' });
    }
  };

  const handleSearch = async () => {
    const query = searchVal.trim();
    if (!query || isSearching) return;
    setIsSearching(true);
    try {
      const found = await searchOrder(query);
      if (found) {
        onSelectArea(found.areaId);
        onViewChange({ kind: 'order-detail', orderId: found.id, backLocationId: null });
      } else {
        onViewChange({ kind: 'not-found', query });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchVal('');
    if (view.kind === 'not-found') {
      onViewChange({ kind: 'areas' });
    }
  };

  const goArea = (areaId: string) => {
    onSelectArea(areaId);
    onViewChange({ kind: 'area-detail', areaId });
  };

  const renderOrderFields = (item: ExecutionOrder, showTitle = true) => {
    const area = areas.find((candidate) => candidate.id === item.areaId);
    const loc = snapshot.locations.find((candidate) => candidate.id === item.locationId);
    return (
      <div className="px-3 py-3">
        {showTitle ? (
          <div className="mb-0.5 text-[10px] text-[var(--text-muted)]">سفارش</div>
        ) : null}
        <div className="mb-3 text-[18px] font-bold">
          <LtrData>#{item.id}</LtrData>
        </div>
        <div>
          <div className="execution-kv">
            <span className="execution-kv-key">گیرنده</span>
            <span className="execution-kv-val">{item.recipient}</span>
          </div>
          <div className="execution-kv">
            <span className="execution-kv-key">تلفن</span>
            <span className="execution-kv-val">
              <CopyPhoneButton phone={item.phone} onCopyResult={onPhoneCopyResult} />
            </span>
          </div>
          <div className="execution-kv">
            <span className="execution-kv-key">آدرس</span>
            <span className="execution-kv-val">{loc?.address ?? '—'}</span>
          </div>
          <div className="execution-kv">
            <span className="execution-kv-key">محدوده</span>
            <span className="execution-kv-val" style={{ color: area?.color }}>
              {area?.name}
            </span>
          </div>
          <div className="execution-kv">
            <span className="execution-kv-key">راننده</span>
            <span className="execution-kv-val">{area?.driverName}</span>
          </div>
          <div className="execution-kv">
            <span className="execution-kv-key">وضعیت</span>
            <span className="execution-kv-val">
              <StatusPill status={item.uiStatus} />
            </span>
          </div>
          <div className="execution-kv">
            <span className="execution-kv-key">آخرین رویداد</span>
            <span className="execution-kv-val">
              <LtrData>{item.lastEventLabel}</LtrData>
            </span>
          </div>
        </div>
        {item.uiStatus === 'followup' ? (
          <div className="execution-followup-box">
            <div className="mb-1.5 text-[10.5px] font-semibold text-[#c99035]">جزئیات پیگیری</div>
            <div className="text-[11.5px] leading-relaxed text-[var(--text-secondary)]">
              <span className="ms-1 text-[var(--text-muted)]">علت:</span>
              {failureReasonLabel(item.failureReasonCode)}
            </div>
            {item.driverNote ? (
              <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-secondary)]">
                <span className="ms-1 text-[var(--text-muted)]">یادداشت راننده:</span>
                {item.driverNote}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  const renderAreas = () => {
    const visible = filterAreas(areas, filter);
    return (
      <div>
        <div className="execution-filters">
          {(
            [
              ['all', 'همه'],
              ['pending', 'در انتظار'],
              ['delivered', 'تحویل‌شده'],
              ['followup', 'نیازمند پیگیری'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="execution-filter"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {visible.map((area) => (
          <button
            key={area.id}
            type="button"
            className={['execution-area-row', selectedAreaId === area.id ? 'selected' : '']
              .filter(Boolean)
              .join(' ')}
            style={{ ['--area-color' as string]: area.color }}
            onClick={() => goArea(area.id)}
          >
            <div className="mb-0.5 flex items-center gap-1.5">
              <span
                className="inline-block size-[7px] shrink-0 rounded-full"
                style={{ background: area.color }}
                aria-hidden
              />
              <span className="flex-1 text-[12.5px] font-semibold text-[var(--text-primary)]">
                {area.name}
              </span>
              <span className={`execution-pill ${area.execState}`}>
                {AREA_EXEC_STATE_LABEL[area.execState]}
              </span>
            </div>
            <div className="mb-1 ps-[13px] text-[11.5px] text-[var(--text-secondary)]">
              {area.driverName}
            </div>
            <div className="ps-[13px] text-[11px] leading-relaxed text-[var(--text-muted)]">
              <span>{toPersianDigits(area.total)} سفارش</span>
              <span className="mx-1.5 text-[var(--border-default)]">·</span>
              <span className="text-[#3da87a]">{toPersianDigits(area.delivered)} تحویل</span>
              {area.followup > 0 ? (
                <>
                  <span className="mx-1.5 text-[var(--border-default)]">·</span>
                  <span className="text-[#c99035]">{toPersianDigits(area.followup)} پیگیری</span>
                </>
              ) : null}
            </div>
            <div className="mt-1.5 ps-[13px]">
              <div className="execution-progress">
                <span style={{ width: `${area.completionPct}%` }} />
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderAreaDetail = (areaId: string) => {
    const area = areas.find((item) => item.id === areaId);
    if (!area) return null;
    const locs = locationsForArea(snapshot, areaId);
    return (
      <div>
        <div className="border-b border-[var(--border-subtle)] px-3 py-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: area.color }}
              aria-hidden
            />
            <span className="flex-1 text-sm font-bold">{area.name}</span>
            <span className={`execution-pill ${area.execState}`}>
              {AREA_EXEC_STATE_LABEL[area.execState]}
            </span>
          </div>
          <div className="mb-2.5 flex items-center gap-1.5 ps-[15px] text-[11.5px] text-[var(--text-secondary)]">
            <Icon d={ICONS.person} size={11} />
            <span>{area.driverName}</span>
          </div>
          <div className="mb-2.5 grid grid-cols-2 gap-y-1.5 ps-[15px]">
            {[
              { label: 'کل سفارشات', value: area.total, color: 'var(--text-primary)' },
              { label: 'تحویل‌شده', value: area.delivered, color: '#3da87a' },
              { label: 'نیازمند پیگیری', value: area.followup, color: '#c99035' },
              { label: 'در انتظار', value: area.pending, color: 'var(--text-secondary)' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-[15px] leading-tight font-bold" style={{ color: stat.color }}>
                  {toPersianDigits(stat.value)}
                </div>
                <div className="text-[10.5px] text-[var(--text-muted)]">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="ps-[15px]">
            <div className="execution-progress">
              <span style={{ width: `${area.completionPct}%` }} />
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
              {toPersianDigits(area.completionPct)}٪ تکمیل
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5">
          <span className="flex-1 text-[10.5px] text-[var(--text-muted)]">نقاط تحویل</span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {toPersianDigits(locs.length)}
          </span>
        </div>
        {locs.map((loc) => {
          const orders = locationOrders(snapshot, loc.id);
          const delivered = orders.filter((item) => item.uiStatus === 'delivered').length;
          const followup = orders.filter((item) => item.uiStatus === 'followup').length;
          return (
            <button
              key={loc.id}
              type="button"
              className="execution-loc-row"
              onClick={() => onViewChange({ kind: 'location-detail', locationId: loc.id })}
            >
              <div className="mb-0.5 flex items-center gap-1.5">
                <span className="flex-1 truncate text-xs text-[var(--text-primary)]">
                  {loc.address}
                </span>
                <Icon d={ICONS.chevron_l} size={11} />
              </div>
              <div className="flex gap-1.5 text-[10.5px] text-[var(--text-muted)]">
                <span>{toPersianDigits(orders.length)} سفارش</span>
                {delivered > 0 ? (
                  <>
                    <span className="text-[var(--border-default)]">·</span>
                    <span className="text-[#3da87a]">{toPersianDigits(delivered)} تحویل</span>
                  </>
                ) : null}
                {followup > 0 ? (
                  <>
                    <span className="text-[var(--border-default)]">·</span>
                    <span className="text-[#c99035]">{toPersianDigits(followup)} پیگیری</span>
                  </>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderLocation = (locationId: string) => {
    const loc = snapshot.locations.find((item) => item.id === locationId);
    if (!loc) return null;
    const area = areas.find((item) => item.id === loc.areaId);
    const orders = locationOrders(snapshot, locationId);
    return (
      <div data-testid="execution-location-detail" data-order-count={String(orders.length)}>
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5">
          <div className="mb-1 text-[12.5px] leading-snug font-semibold">{loc.address}</div>
          <div className="flex flex-wrap gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <span style={{ color: area?.color }}>{area?.name}</span>
            <span className="text-[var(--border-default)]">·</span>
            <span>{area?.driverName}</span>
            <span className="text-[var(--border-default)]">·</span>
            <span>{toPersianDigits(orders.length)} سفارش</span>
          </div>
        </div>
        {orders.length === 1
          ? renderOrderFields(orders[0]!, false)
          : orders.map((item) => (
              <button
                key={item.id}
                type="button"
                className="execution-order-row flex items-center gap-2"
                onClick={() =>
                  onViewChange({
                    kind: 'order-detail',
                    orderId: item.id,
                    backLocationId: locationId,
                  })
                }
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 text-xs">
                    <LtrData>#{item.id}</LtrData>
                  </div>
                  <div className="truncate text-[11.5px] text-[var(--text-secondary)]">
                    {item.recipient}
                  </div>
                </div>
                <StatusPill status={item.uiStatus} />
                <Icon d={ICONS.chevron_l} size={11} />
              </button>
            ))}
      </div>
    );
  };

  const renderFollowupList = () => (
    <div>
      {followups.map((item) => {
        const area = areas.find((candidate) => candidate.id === item.areaId);
        const noteCount = snapshot.notes.filter((note) => note.orderId === item.id).length;
        return (
          <button
            key={item.id}
            type="button"
            className="execution-followup-row"
            onClick={() => onViewChange({ kind: 'followup-detail', orderId: item.id })}
          >
            <div className="mb-0.5 flex items-center gap-1.5">
              <LtrData className="text-[10.5px] text-[var(--text-muted)]">#{item.id}</LtrData>
              <LtrData className="ms-auto shrink-0 text-[10px] text-[var(--text-muted)]">
                {item.lastEventLabel}
              </LtrData>
            </div>
            <div className="mb-0.5 flex items-center gap-1">
              <span className="text-xs font-medium">{item.recipient}</span>
              <span className="text-[10px] text-[var(--border-default)]">·</span>
              <LtrData className="text-[11px] text-[var(--text-secondary)]">
                {formatPhoneForDisplay(item.phone)}
              </LtrData>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10.5px]" style={{ color: area?.color }}>
                {area?.name}
              </span>
              <span className="text-[10px] text-[var(--border-default)]">·</span>
              <span className="text-[10.5px] text-[var(--text-muted)]">{area?.driverName}</span>
              <span className="text-[10px] text-[var(--border-default)]">·</span>
              <span className="text-[10.5px] text-[#c99035]">
                {failureReasonLabel(item.failureReasonCode)}
              </span>
              {noteCount > 0 ? (
                <span className="ms-auto rounded-[var(--r-xs)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1 text-[9.5px] text-[var(--text-muted)]">
                  {toPersianDigits(noteCount)}
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );

  const orderForDetail =
    view.kind === 'order-detail'
      ? snapshot.orders.find((item) => item.id === view.orderId)
      : undefined;

  const followupOrder =
    view.kind === 'followup-detail'
      ? snapshot.orders.find((item) => item.id === view.orderId)
      : undefined;
  const followupArea = followupOrder
    ? areas.find((item) => item.id === followupOrder.areaId)
    : undefined;

  return (
    <aside className="execution-panel" data-testid="execution-panel" aria-label="پنل عملیات">
      <div className="execution-panel-chrome">
        <div className="execution-panel-search-row">
          <div className="execution-search-wrap">
            <span className="search-icon">
              <Icon d={ICONS.search} size={11} />
            </span>
            <input
              className="execution-search-input"
              value={searchVal}
              dir="ltr"
              aria-label="جستجوی شماره سفارش"
              placeholder="جستجوی شماره سفارش…"
              onChange={(event) => setSearchVal(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleSearch();
              }}
            />
            {isSearching ? (
              <span className="execution-search-pending" aria-label="در حال جستجو">
                <span className="execution-spin" />
              </span>
            ) : null}
            {searchVal && !isSearching ? (
              <button
                type="button"
                className="execution-search-clear"
                aria-label="پاک کردن جستجو"
                onClick={clearSearch}
              >
                <Icon d={ICONS.close} size={10} />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-label="بستن پنل عملیات"
            onClick={onClose}
          >
            <Icon d={ICONS.panel_end} size={14} />
          </button>
        </div>

        <div className="execution-panel-tabs" role="tablist" aria-label="نماهای عملیات">
          <button
            type="button"
            role="tab"
            aria-selected={panelTab === 'areas'}
            className="execution-panel-tab"
            onClick={() => switchTab('areas')}
          >
            محدوده‌ها
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={panelTab === 'followup'}
            className="execution-panel-tab"
            onClick={() => switchTab('followup')}
          >
            نیازمند پیگیری
            <span className="execution-panel-tab-count">{toPersianDigits(followups.length)}</span>
          </button>
        </div>

        {showBack ? (
          <div className="execution-panel-back">
            <button type="button" className="execution-panel-back-btn" onClick={handleBack}>
              <Icon d={ICONS.chevron_r} size={11} />
              <span>{backLabel}</span>
            </button>
          </div>
        ) : null}
      </div>

      <div className="execution-panel-body">
        {view.kind === 'areas' ? renderAreas() : null}
        {view.kind === 'area-detail' ? renderAreaDetail(view.areaId) : null}
        {view.kind === 'location-detail' ? renderLocation(view.locationId) : null}
        {view.kind === 'order-detail' && orderForDetail ? renderOrderFields(orderForDetail) : null}
        {view.kind === 'followup-list' ? renderFollowupList() : null}
        {view.kind === 'followup-detail' && followupOrder ? (
          <FollowupDetailView
            key={followupOrder.id}
            order={followupOrder}
            areaName={followupArea?.name ?? ''}
            areaColor={followupArea?.color}
            driverName={followupArea?.driverName ?? ''}
            notes={snapshot.notes.filter((note) => note.orderId === followupOrder.id)}
            onSave={(note) => saveFollowupNote(followupOrder.id, note)}
            onPhoneCopyResult={onPhoneCopyResult}
          />
        ) : null}
        {view.kind === 'not-found' ? (
          <div className="execution-empty">
            <div className="mb-2.5 text-[var(--text-disabled)]">
              <Icon d={ICONS.search} size={22} />
            </div>
            <div>این شماره سفارش در این برنامه پیدا نشد.</div>
            <div className="mt-1.5">
              <LtrData className="text-[11px] text-[var(--text-muted)]">«{view.query}»</LtrData>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
