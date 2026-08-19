import { useState } from 'react';

import { shortAddress } from '@/features/planning/fixture/planning-fixture';
import type { PlanningArea, PlanningStop } from '@/features/planning/fixture/types';
import { routeOrderCount } from '@/features/planning/map/route-waypoints';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { Button } from '@/shared/ui';
import { toPersianDigits } from '@/shared/lib/format';

type UnassignedAreaPickerProps = {
  stop: PlanningStop;
  routes: PlanningArea[];
  isAssigning: boolean;
  onConfirm: (routeId: string) => void;
  onBack: () => void;
};

/**
 * Designer Mode F — «افزودن به محدوده»: pick a target delivery area, then confirm transfer.
 */
export function UnassignedAreaPicker({
  stop,
  routes,
  isAssigning,
  onConfirm,
  onBack,
}: UnassignedAreaPickerProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const primary = stop.tasks[0];

  const handleConfirm = () => {
    if (!selectedRouteId || isAssigning) return;
    onConfirm(selectedRouteId);
  };

  return (
    <aside className="planning-inspector" aria-label="افزودن به محدوده" data-testid="area-picker">
      <div className="planning-inspector-header !items-start">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="planning-back-btn mb-1"
            disabled={isAssigning}
            onClick={onBack}
          >
            <Icon d={ICONS.chevron_r} size={11} />
            بدون محدوده
          </button>
          <div className="text-[13px] font-bold text-[var(--text-primary)]">افزودن به محدوده</div>
        </div>
      </div>

      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--warning-text)]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11.5px] font-semibold text-[var(--text-primary)]">
              {primary ? shortAddress(primary.address) : stop.stopId}
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
              {toPersianDigits(stop.tasks.length)} سفارش
            </div>
          </div>
        </div>
      </div>

      <div className="planning-inspector-scroll">
        <div className="border-b border-[var(--border-subtle)] px-3 py-1">
          <span className="text-[9px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
            AREAS · {toPersianDigits(routes.length)}
          </span>
        </div>
        {routes.map((route) => {
          const selected = selectedRouteId === route.areaId;
          const taskCount = routeOrderCount(route);
          return (
            <button
              key={route.areaId}
              type="button"
              className="planning-route-row flex items-center gap-2"
              aria-selected={selected}
              data-testid={`area-picker-route-${route.areaId}`}
              disabled={isAssigning}
              onClick={() => setSelectedRouteId(route.areaId)}
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
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 gap-1.5 border-t border-[var(--border-default)] px-3 py-2.5">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={isAssigning}
          onClick={onBack}
        >
          انصراف
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-[2]"
          loading={isAssigning}
          disabled={!selectedRouteId || isAssigning}
          data-testid="confirm-area-assign"
          onClick={handleConfirm}
        >
          {isAssigning ? 'در حال انتقال…' : 'تأیید انتقال'}
        </Button>
      </div>
    </aside>
  );
}
