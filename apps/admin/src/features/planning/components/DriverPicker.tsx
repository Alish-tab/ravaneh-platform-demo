import { useMemo, useState } from 'react';

import {
  buildDriverAreaMap,
  PLANNING_DRIVERS,
} from '@/features/planning/fixture/drivers';
import type { PlanningArea, PlanningDriver } from '@/features/planning/fixture/types';
import { Icon, ICONS } from '@/features/plans/components/icons';

type DriverPickerProps = {
  route: PlanningArea;
  routes: PlanningArea[];
  onSelectDriver: (driver: PlanningDriver) => void;
  onBack: () => void;
  /** Driver IDs that should not be offered for new assignment (e.g. operationally inactive). */
  unavailableDriverIds?: ReadonlySet<string>;
};

/**
 * Designer Mode E1 — search and pick a driver for the selected area.
 */
export function DriverPicker({ route, routes, onSelectDriver, onBack, unavailableDriverIds }: DriverPickerProps) {
  const [query, setQuery] = useState('');
  const driverAreaMap = useMemo(
    () => buildDriverAreaMap(routes, route.areaId),
    [route.areaId, routes],
  );

  const filtered = PLANNING_DRIVERS.filter(
    (driver) =>
      (query === '' || driver.driverName.includes(query)) &&
      !unavailableDriverIds?.has(driver.driverId),
  );

  return (
    <aside className="planning-inspector" aria-label="انتخاب راننده" data-testid="driver-picker">
      <div className="planning-inspector-header !items-start">
        <div className="min-w-0 flex-1">
          <button type="button" className="planning-back-btn mb-1" onClick={onBack}>
            <Icon d={ICONS.chevron_r} size={11} />
            {route.label}
          </button>
          <div className="text-[13px] font-bold text-[var(--text-primary)]">انتخاب راننده</div>
        </div>
      </div>

      <div className="border-b border-[var(--border-subtle)] px-3 py-2">
        <div className="relative">
          <input
            type="search"
            value={query}
            data-testid="driver-search"
            placeholder="جستجوی نام راننده…"
            className="planning-driver-search"
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <Icon d={ICONS.search} size={12} />
          </span>
        </div>
      </div>

      <div className="planning-inspector-scroll">
        {filtered.map((driver) => {
          const isCurrent = driver.driverId === route.driverId;
          const conflictArea = !isCurrent ? driverAreaMap[driver.driverId] : undefined;
          const planConflict = Boolean(driver.hasPlanConflict);
          const isDisabled = isCurrent || !!conflictArea || planConflict;

          return (
            <button
              key={driver.driverId}
              type="button"
              disabled={isDisabled}
              data-testid={`driver-option-${driver.driverId}`}
              data-driver-status={
                isCurrent
                  ? 'current'
                  : planConflict
                    ? 'plan-conflict'
                    : conflictArea
                      ? 'assigned'
                      : 'available'
              }
              className="planning-driver-option"
              onClick={() => {
                if (!isDisabled) onSelectDriver(driver);
              }}
            >
              <div
                className={[
                  'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border',
                  isCurrent
                    ? 'border-[rgba(61,123,212,0.35)] bg-[rgba(61,123,212,0.12)] text-[var(--accent-text)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)]',
                ].join(' ')}
              >
                <Icon d={ICONS.person} size={12} />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <div className="text-[12px] font-medium text-[var(--text-primary)]">
                  {driver.driverName}
                </div>
                <div
                  className={[
                    'mt-0.5 text-[10px]',
                    isCurrent
                      ? 'text-[var(--accent-text)]'
                      : planConflict || conflictArea
                        ? 'text-[var(--warning-text)]'
                        : 'text-[var(--success-text)]',
                  ].join(' ')}
                >
                  {isCurrent
                    ? 'راننده فعلی این محدوده'
                    : planConflict
                      ? driver.conflictReason ?? 'تداخل با برنامه دیگر — ابتدا از آن برنامه بردارید'
                      : conflictArea
                        ? `تخصیص‌یافته به ${conflictArea} — ابتدا بردارید`
                        : 'آماده تخصیص'}
                </div>
              </div>
              {!isDisabled ? (
                <Icon d={ICONS.chevron_l} size={11} stroke="var(--text-disabled)" />
              ) : null}
              {isCurrent ? (
                <span className="planning-driver-current-badge">فعلی</span>
              ) : null}
            </button>
          );
        })}
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-[11.5px] text-[var(--text-disabled)]">
            راننده‌ای یافت نشد
          </div>
        ) : null}
      </div>
    </aside>
  );
}
