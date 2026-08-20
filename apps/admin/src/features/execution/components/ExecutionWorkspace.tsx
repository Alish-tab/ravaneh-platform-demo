import { useEffect, useMemo, useRef, useState } from 'react';

import { ExecutionMap } from '@/features/execution/components/ExecutionMap';
import { OperationsPanel } from '@/features/execution/components/OperationsPanel';
import { deriveSummary } from '@/features/execution/model/derive';
import { PHASE_STRIP_LABEL, SYSTEM_NOTICE_COPY } from '@/features/execution/model/presentation';
import type {
  ExecutionFollowupNote,
  ExecutionLoadErrorKind,
  ExecutionOrder,
  ExecutionSnapshot,
  ExecutionSystemNoticeKind,
  PanelView,
} from '@/features/execution/model/types';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { toPersianDigits } from '@/shared/lib/format';
import { Button } from '@/shared/ui';

type ExecutionWorkspaceProps = {
  snapshot: ExecutionSnapshot | null;
  status: 'loading' | 'ready' | 'error';
  errorKind: ExecutionLoadErrorKind | null;
  isRefreshing: boolean;
  systemNotice: ExecutionSystemNoticeKind;
  onRetry: () => void;
  searchOrder: (query: string) => Promise<ExecutionOrder | null>;
  saveFollowupNote: (orderId: string, note: string) => Promise<ExecutionFollowupNote>;
  /** Deep-link from A05 global search: External Order ID to open on mount. */
  initialOrderId?: string;
};

function RecoveredBanner({ text }: { text: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 2800);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="execution-banner success" role="status">
      <Icon d={ICONS.check} size={12} />
      <span className="flex-1">{text}</span>
    </div>
  );
}

function selectedLocationId(view: PanelView): string | null {
  if (view.kind === 'location-detail') return view.locationId;
  if (view.kind === 'order-detail') return view.backLocationId;
  return null;
}

export function ExecutionWorkspace({
  snapshot,
  status,
  errorKind,
  isRefreshing,
  systemNotice,
  onRetry,
  searchOrder,
  saveFollowupNote,
  initialOrderId,
}: ExecutionWorkspaceProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [view, setView] = useState<PanelView>({ kind: 'areas' });
  const [revisionBannerOpen, setRevisionBannerOpen] = useState(true);

  // Deep-link: if opened from A05 search with ?orderId, search and open the order once ready.
  const deepLinkRef = useRef(initialOrderId);
  useEffect(() => {
    if (!deepLinkRef.current || status !== 'ready' || !snapshot) return;
    const id = deepLinkRef.current;
    deepLinkRef.current = undefined; // consume once
    void searchOrder(id).then((order) => {
      if (order) {
        const loc = snapshot.locations.find((l) => l.id === order.locationId);
        if (loc) setSelectedAreaId(loc.areaId);
        setView({ kind: 'order-detail', orderId: order.id, backLocationId: order.locationId });
      }
    });
  }, [status, snapshot, searchOrder]);

  const counts = useMemo(() => (snapshot ? deriveSummary(snapshot) : null), [snapshot]);
  const blocking = status === 'loading' || status === 'error' || (status === 'ready' && !snapshot);

  const goArea = (areaId: string | null) => {
    setSelectedAreaId(areaId);
    if (areaId) setView({ kind: 'area-detail', areaId });
    else if (view.kind === 'area-detail') setView({ kind: 'areas' });
  };

  const goLocation = (locationId: string) => {
    const loc = snapshot?.locations.find((item) => item.id === locationId);
    if (loc) setSelectedAreaId(loc.areaId);
    setView({ kind: 'location-detail', locationId });
  };

  const overlay = (() => {
    if (status === 'loading' && !snapshot) {
      return { title: 'در حال بارگذاری', body: 'داده‌های برنامه در حال دریافت است', tone: 'info' as const };
    }
    if (status === 'error' && !snapshot) {
      return {
        title: 'خطا در بارگذاری',
        body: 'اتصال به سرور برقرار نشد. لطفاً دوباره تلاش کنید.',
        tone: 'error' as const,
        retry: true,
      };
    }
    if (status === 'ready' && !snapshot) {
      return {
        title: 'برنامه‌ای منتشر نشده',
        body: 'برای این روز هیچ برنامه تحویل منتشرشده‌ای یافت نشد.',
        tone: 'muted' as const,
      };
    }
    return null;
  })();

  return (
    <div className="execution-body">
      <div className="execution-summary" aria-label="خلاصه اجرا">
        <div className="execution-summary-status">
          <span
            className={`execution-summary-dot ${snapshot?.phase ?? 'not-started'}`}
            aria-hidden
          />
          <span className="whitespace-nowrap text-[11.5px] text-[var(--text-secondary)]">
            {snapshot ? PHASE_STRIP_LABEL[snapshot.phase] : blocking ? '—' : PHASE_STRIP_LABEL['not-started']}
          </span>
          {snapshot?.deliveryWindow ? (
            <>
              <span className="text-[11px] text-[var(--border-default)]">·</span>
              <span className="whitespace-nowrap text-[11px] text-[var(--text-muted)]">
                پنجره تحویل {snapshot.deliveryWindow}
              </span>
            </>
          ) : null}
        </div>
        {counts && snapshot ? (
          <>
            {(
              [
                { label: 'سفارش', value: counts.total, color: 'var(--text-primary)' },
                { label: 'تحویل‌شده', value: counts.delivered, color: '#3da87a' },
                { label: 'در انتظار', value: counts.pending, color: 'var(--text-secondary)' },
                { label: 'نیازمند پیگیری', value: counts.followup, color: '#c99035' },
              ] as const
            ).map((stat) => (
              <div key={stat.label} className="execution-summary-stat">
                <span className="execution-summary-stat-value" style={{ color: stat.color }}>
                  {toPersianDigits(stat.value)}
                </span>
                <span className="execution-summary-stat-label">{stat.label}</span>
              </div>
            ))}
          </>
        ) : null}
        <div className="execution-summary-updated">
          {isRefreshing ? (
            <>
              <span className="execution-spin" aria-hidden />
              <span className="text-[var(--accent)]">در حال بروزرسانی…</span>
            </>
          ) : snapshot ? (
            <>
              <Icon d={ICONS.info} size={11} />
              <span>آخرین بروزرسانی {snapshot.lastUpdatedLabel}</span>
            </>
          ) : null}
        </div>
      </div>

      {systemNotice === 'recovered' ? (
        <RecoveredBanner text={SYSTEM_NOTICE_COPY.recovered} />
      ) : systemNotice !== 'none' ? (
        <div
          className={`execution-banner ${systemNotice === 'conflict' ? 'warning' : 'error'}`}
          role="alert"
        >
          <Icon d={ICONS.alert} size={12} />
          <span className="flex-1">{SYSTEM_NOTICE_COPY[systemNotice]}</span>
        </div>
      ) : null}

      {snapshot?.hasUnpublishedWorkingRevision && revisionBannerOpen ? (
        <div className="execution-banner warning" role="status">
          <Icon d={ICONS.info} size={12} />
          <span className="flex-1">
            تغییرات منتشرنشده‌ای برای این برنامه وجود دارد — اجرای جاری بر اساس نسخه منتشرشده ادامه می‌یابد.
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-label="بستن هشدار نسخه"
            onClick={() => setRevisionBannerOpen(false)}
          >
            <Icon d={ICONS.close} size={11} />
          </button>
        </div>
      ) : null}

      {snapshot?.phase === 'not-started' && !overlay ? (
        <div className="execution-banner info" role="status">
          <Icon d={ICONS.info} size={12} />
          <span>برنامه منتشر شده — هنوز هیچ تحویلی ثبت نشده است.</span>
        </div>
      ) : null}

      {snapshot?.phase === 'completed' && !overlay ? (
        <div className="execution-banner success" role="status">
          <Icon d={ICONS.check} size={12} />
          <span>اجرا تکمیل شد — همه محدوده‌ها به پایان رسیده‌اند.</span>
        </div>
      ) : null}

      <div className="execution-main">
        {snapshot ? (
          <ExecutionMap
            snapshot={snapshot}
            selectedAreaId={selectedAreaId}
            selectedLocationId={selectedLocationId(view)}
            panelCollapsed={!panelOpen}
            onSelectArea={(areaId) => goArea(areaId)}
            onSelectLocation={goLocation}
            onClearSelection={() => {
              setSelectedAreaId(null);
              if (view.kind === 'area-detail') setView({ kind: 'areas' });
            }}
          />
        ) : (
          <div className="shared-map-pane" data-testid="execution-map" data-selected-area-id="">
            <div className="execution-map-fallback">نقشه پس از بارگذاری داده در دسترس است.</div>
          </div>
        )}

        {snapshot && panelOpen ? (
          <OperationsPanel
            snapshot={snapshot}
            selectedAreaId={selectedAreaId}
            view={view}
            onViewChange={setView}
            onSelectArea={setSelectedAreaId}
            onClose={() => setPanelOpen(false)}
            searchOrder={searchOrder}
            saveFollowupNote={saveFollowupNote}
          />
        ) : null}

        {snapshot && !panelOpen ? (
          <button
            type="button"
            className="execution-panel-rail"
            aria-label="باز کردن پنل عملیات"
            title="باز کردن پنل عملیات"
            onClick={() => setPanelOpen(true)}
          >
            <Icon d={ICONS.panel_end} size={12} />
          </button>
        ) : null}

        {overlay ? (
          <div className="execution-overlay">
            <div className="execution-overlay-card">
              <div
                className="mb-2.5 text-[28px] leading-none"
                style={{
                  color:
                    overlay.tone === 'error' ? '#c44444' : overlay.tone === 'info' ? '#4f8ef7' : '#4a5e78',
                }}
              >
                {overlay.tone === 'error' ? '!' : overlay.tone === 'info' ? '…' : '—'}
              </div>
              <div className="execution-overlay-title">{overlay.title}</div>
              <div className="execution-overlay-body">{overlay.body}</div>
              {'retry' in overlay && overlay.retry ? (
                <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
                  تلاش مجدد
                </Button>
              ) : null}
              {errorKind === 'conflict' ? (
                <p className="mt-2 text-[11px] text-[var(--warning-text)]">تعارض نسخه — بارگذاری مجدد لازم است.</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
