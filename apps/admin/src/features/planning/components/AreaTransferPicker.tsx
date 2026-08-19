import { useState } from 'react';

import { shortAddress } from '@/features/planning/fixture/planning-fixture';
import type { PlanningArea, PlanningStop } from '@/features/planning/fixture/types';
import { routeOrderCount } from '@/features/planning/map/route-waypoints';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { Button } from '@/shared/ui';
import { toPersianDigits } from '@/shared/lib/format';

/** Sentinel destination for returning a whole stop to the unassigned queue. */
export const TRANSFER_UNASSIGNED = '__unassigned__';

type AreaTransferPickerProps = {
  stop: PlanningStop;
  routes: PlanningArea[];
  currentRouteId: string;
  scopeLabel: string;
  /** Whole-stop transfers may return to unassigned; order transfers may not. */
  allowUnassigned?: boolean;
  isTransferring: boolean;
  onConfirm: (destinationRouteId: string) => void;
  onBack: () => void;
};

/**
 * Designer Mode G1 destination picker — «انتقال به محدوده دیگر».
 * Current route is excluded. «بدون محدوده» is only offered for whole-stop transfers
 * (prior Planning reverse-of-assignment; not in A03 destination list).
 */
export function AreaTransferPicker({
  stop,
  routes,
  currentRouteId,
  scopeLabel,
  allowUnassigned = true,
  isTransferring,
  onConfirm,
  onBack,
}: AreaTransferPickerProps) {
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
  const primary = stop.tasks[0];
  const available = routes.filter((route) => route.areaId !== currentRouteId);
  const destinationCount = available.length + (allowUnassigned ? 1 : 0);

  const handleConfirm = () => {
    if (!selectedDestinationId || isTransferring) return;
    onConfirm(selectedDestinationId);
  };

  return (
    <aside
      className="planning-inspector"
      aria-label="انتقال به محدوده دیگر"
      data-testid="area-transfer-picker"
    >
      <div className="planning-inspector-header !items-start">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="planning-back-btn mb-1"
            disabled={isTransferring}
            onClick={onBack}
          >
            <Icon d={ICONS.chevron_r} size={11} />
            انتقال
          </button>
          <div className="text-[13px] font-bold text-[var(--text-primary)]">
            انتقال به محدوده دیگر
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11.5px] font-semibold text-[var(--text-primary)]">
              {primary ? shortAddress(primary.address) : stop.stopId}
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">{scopeLabel}</div>
          </div>
        </div>
      </div>

      <div className="planning-inspector-scroll">
        <div className="border-b border-[var(--border-subtle)] px-3 py-1">
          <span className="text-[9px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
            DESTINATION · {toPersianDigits(destinationCount)}
          </span>
        </div>

        {available.map((route) => {
          const selected = selectedDestinationId === route.areaId;
          const taskCount = routeOrderCount(route);
          return (
            <button
              key={route.areaId}
              type="button"
              className="planning-route-row flex items-center gap-2"
              aria-selected={selected}
              data-testid={`transfer-dest-route-${route.areaId}`}
              disabled={isTransferring}
              onClick={() => setSelectedDestinationId(route.areaId)}
            >
              <span
                className="planning-area-picker-radio"
                data-checked={selected ? 'true' : 'false'}
                aria-hidden
              />
              <span className="planning-route-color" style={{ background: route.color }} />
              <span className="min-w-0 flex-1 text-start">
                <span
                  className="block text-[12.5px] text-[var(--text-primary)]"
                  style={{ fontWeight: selected ? 600 : 400 }}
                >
                  {route.label}
                </span>
                <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">
                  {toPersianDigits(route.stops.length)} نقطه · {toPersianDigits(taskCount)} سفارش
                  {route.driverName ? ` · ${route.driverName}` : null}
                </span>
              </span>
            </button>
          );
        })}

        {allowUnassigned ? (
          <button
            type="button"
            className="planning-route-row flex items-center gap-2"
            aria-selected={selectedDestinationId === TRANSFER_UNASSIGNED}
            data-testid="transfer-dest-unassigned"
            disabled={isTransferring}
            onClick={() => setSelectedDestinationId(TRANSFER_UNASSIGNED)}
          >
            <span
              className="planning-area-picker-radio"
              data-checked={selectedDestinationId === TRANSFER_UNASSIGNED ? 'true' : 'false'}
              aria-hidden
            />
            <span className="planning-route-color !bg-[var(--warning-text)] opacity-80" />
            <span className="min-w-0 flex-1 text-start">
              <span
                className="block text-[12.5px] text-[var(--text-primary)]"
                style={{
                  fontWeight: selectedDestinationId === TRANSFER_UNASSIGNED ? 600 : 400,
                }}
              >
                بدون محدوده
              </span>
              <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">
                بازگشت به صف تخصیص‌نشده
              </span>
            </span>
          </button>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-1.5 border-t border-[var(--border-default)] px-3 py-2.5">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={isTransferring}
          onClick={onBack}
        >
          انصراف
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-[2]"
          loading={isTransferring}
          disabled={!selectedDestinationId || isTransferring}
          data-testid="confirm-area-transfer"
          onClick={handleConfirm}
        >
          {isTransferring ? 'در حال انتقال…' : 'تأیید انتقال'}
        </Button>
      </div>
    </aside>
  );
}
