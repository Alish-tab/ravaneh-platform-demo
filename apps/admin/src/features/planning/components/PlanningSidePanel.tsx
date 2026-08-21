import { useEffect, useMemo, useRef } from 'react';

import { AreaTransferPicker } from '@/features/planning/components/AreaTransferPicker';
import { DriverConfirm } from '@/features/planning/components/DriverConfirm';
import { DriverPicker } from '@/features/planning/components/DriverPicker';
import { LocationCorrectionPanel } from '@/features/planning/components/LocationCorrectionPanel';
import { RemoveDriverConfirm } from '@/features/planning/components/RemoveDriverConfirm';
import { TransferScopePicker } from '@/features/planning/components/TransferScopePicker';
import { UnassignedAreaPicker } from '@/features/planning/components/UnassignedAreaPicker';
import {
  countExcludedOrdersInStops,
  countOrdersInStops,
  countRemainingUnassignedOrders,
  countUnassignedOrders,
  isUnassignedStopFullyExcluded,
  type ExcludedOrderIdSet,
} from '@/features/planning/fixture/exclude-order';
import {
  countPlanOrders,
  countPlanStops,
  findStopInPlan,
  shortAddress,
} from '@/features/planning/fixture/planning-fixture';
import type {
  PlanningAreaFilter,
  PlanningDriver,
  PlanningPlanFixture,
  PlanningArea,
  PlanningStop,
  PlanningTransferFlow,
} from '@/features/planning/fixture/types';
import type { PlanningLatLng } from '@/features/planning/fixture/update-stop-location';
import { orderedRouteStops, routeOrderCount } from '@/features/planning/map/route-waypoints';
import { findRouteForArea } from '@/features/planning/planning-model';
import {
  formatDurationMin,
  PLANNING_ROUTE_STATE_COLOR,
  PLANNING_ROUTE_STATE_LABEL,
} from '@/features/planning/presentation';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { Button, LtrData } from '@/shared/ui';
import { toPersianDigits } from '@/shared/lib/format';
import { formatPhoneForDisplay } from '@/shared/lib/phone';

function PlanningSidebarIcon() {
  return <Icon d={ICONS.layers} size={13} />;
}

type PlanningSidePanelProps = {
  fixture: PlanningPlanFixture;
  selectedRouteId: string | null;
  selectedStopId: string | null;
  selectedOrderId: string | null;
  selectedUnassignedStopId: string | null;
  areaPickerStopId: string | null;
  transferFlow: PlanningTransferFlow | null;
  driverPickerRouteId: string | null;
  pendingDriver: PlanningDriver | null;
  removeDriverRouteId: string | null;
  justAssignedRouteId: string | null;
  correctionStopId: string | null;
  proposedLocation: PlanningLatLng | null;
  excludedOrderIds: ExcludedOrderIdSet;
  areaFilter: PlanningAreaFilter;
  isPending: boolean;
  onAreaFilterChange: (filter: PlanningAreaFilter) => void;
  onSelectRoute: (routeId: string) => void;
  onSelectStop: (stopId: string) => void;
  onSelectOrder: (orderId: string) => void;
  onOpenAreaPicker: (stopId: string) => void;
  onCloseAreaPicker: () => void;
  onConfirmAreaAssign: (routeId: string) => void;
  onExcludeUnassignedStop: (stopId: string) => void;
  onOpenTransferFromStop: (stopId: string) => void;
  onOpenTransferFromOrder: (stopId: string, orderId: string) => void;
  onSetTransferScope: (scope: 'stop' | 'order') => void;
  onBackFromTransferPick: () => void;
  onCloseTransferPicker: () => void;
  onConfirmAreaTransfer: (destinationId: string) => void;
  onOpenDriverPicker: (routeId: string) => void;
  onCloseDriverPicker: () => void;
  onSelectDriverCandidate: (driver: PlanningDriver) => void;
  onClearDriverCandidate: () => void;
  onConfirmDriverAssign: () => void;
  onOpenRemoveDriver: (routeId: string) => void;
  onCloseRemoveDriver: () => void;
  onConfirmRemoveDriver: () => void;
  onToggleDriverLock: (routeId: string) => void;
  onOpenLocationCorrection: (stopId: string) => void;
  onSaveLocationCorrection: () => void;
  onCancelLocationCorrection: () => void;
  onBackFromOrder: () => void;
  onBackFromStop: () => void;
  onBackFromRoute: () => void;
  onCollapse: () => void;
};

export function PlanningSidePanel({
  fixture,
  selectedRouteId,
  selectedStopId,
  selectedOrderId,
  selectedUnassignedStopId,
  areaPickerStopId,
  transferFlow,
  driverPickerRouteId,
  pendingDriver,
  removeDriverRouteId,
  justAssignedRouteId,
  correctionStopId,
  proposedLocation,
  excludedOrderIds,
  areaFilter,
  isPending,
  onAreaFilterChange,
  onSelectRoute,
  onSelectStop,
  onSelectOrder,
  onOpenAreaPicker,
  onCloseAreaPicker,
  onConfirmAreaAssign,
  onExcludeUnassignedStop,
  onOpenTransferFromStop,
  onOpenTransferFromOrder,
  onSetTransferScope,
  onBackFromTransferPick,
  onCloseTransferPicker,
  onConfirmAreaTransfer,
  onOpenDriverPicker,
  onCloseDriverPicker,
  onSelectDriverCandidate,
  onClearDriverCandidate,
  onConfirmDriverAssign,
  onOpenRemoveDriver,
  onCloseRemoveDriver,
  onConfirmRemoveDriver,
  onToggleDriverLock,
  onOpenLocationCorrection,
  onSaveLocationCorrection,
  onCancelLocationCorrection,
  onBackFromOrder,
  onBackFromStop,
  onBackFromRoute,
  onCollapse,
}: PlanningSidePanelProps) {
  if (correctionStopId) {
    const found = findStopInPlan(fixture, correctionStopId);
    if (found?.area) {
      return (
        <LocationCorrectionPanel
          stop={found.stop}
          route={found.area}
          proposedLocation={proposedLocation}
          isSaving={isPending}
          onSave={onSaveLocationCorrection}
          onCancel={onCancelLocationCorrection}
          onCollapse={onCollapse}
        />
      );
    }
  }

  if (transferFlow) {
    const found = findStopInPlan(fixture, transferFlow.stopId);
    if (found?.area) {
      if (transferFlow.step === 'scope' && transferFlow.orderId) {
        return (
          <TransferScopePicker
            stop={found.stop}
            orderId={transferFlow.orderId}
            onChooseStop={() => onSetTransferScope('stop')}
            onChooseOrder={() => onSetTransferScope('order')}
            onBack={onCloseTransferPicker}
          />
        );
      }

      if (transferFlow.step === 'pick' && transferFlow.scope) {
        const scopeLabel =
          transferFlow.scope === 'order' && transferFlow.orderId
            ? `انتقال فقط سفارش #${transferFlow.orderId}`
            : 'انتقال کل نقطه تحویل';
        return (
          <AreaTransferPicker
            stop={found.stop}
            routes={fixture.areas}
            currentRouteId={found.area.areaId}
            scopeLabel={scopeLabel}
            allowUnassigned={transferFlow.scope === 'stop'}
            isTransferring={isPending}
            onConfirm={onConfirmAreaTransfer}
            onBack={onBackFromTransferPick}
          />
        );
      }
    }
  }

  if (areaPickerStopId) {
    const stop =
      fixture.unassignedStops.find((item) => item.stopId === areaPickerStopId) ??
      findStopInPlan(fixture, areaPickerStopId)?.stop;
    if (stop) {
      return (
        <UnassignedAreaPicker
          stop={stop}
          routes={fixture.areas}
          isAssigning={isPending}
          onConfirm={onConfirmAreaAssign}
          onBack={onCloseAreaPicker}
        />
      );
    }
  }

  if (removeDriverRouteId) {
    const route = fixture.areas.find((item) => item.areaId === removeDriverRouteId);
    if (route?.driverName) {
      return (
        <RemoveDriverConfirm
          routeLabel={route.label}
          driverName={route.driverName}
          isRemoving={isPending}
          onConfirm={onConfirmRemoveDriver}
          onCancel={onCloseRemoveDriver}
        />
      );
    }
  }

  if (driverPickerRouteId && pendingDriver) {
    const route = fixture.areas.find((item) => item.areaId === driverPickerRouteId);
    if (route) {
      return (
        <DriverConfirm
          routeLabel={route.label}
          driver={pendingDriver}
          currentDriverName={route.driverName}
          flow={route.driverId ? 'change' : 'assign'}
          isSaving={isPending}
          onConfirm={onConfirmDriverAssign}
          onCancel={onClearDriverCandidate}
        />
      );
    }
  }

  if (driverPickerRouteId) {
    const route = fixture.areas.find((item) => item.areaId === driverPickerRouteId);
    if (route) {
      return (
        <DriverPicker
          route={route}
          routes={fixture.areas}
          onSelectDriver={onSelectDriverCandidate}
          onBack={onCloseDriverPicker}
        />
      );
    }
  }

  if (selectedOrderId && selectedStopId) {
    const found = findStopInPlan(fixture, selectedStopId);
    const task = found?.stop.tasks.find((item) => item.orderId === selectedOrderId);
    if (found?.area && task) {
      return (
        <OrderDetailPanel
          task={task}
          stop={found.stop}
          route={found.area}
          onStartAreaTransfer={() => onOpenTransferFromOrder(found.stop.stopId, task.orderId)}
          onStartLocationCorrection={() => onOpenLocationCorrection(found.stop.stopId)}
          onBack={onBackFromOrder}
          onClose={onCollapse}
        />
      );
    }
  }

  if (selectedStopId) {
    const found = findStopInPlan(fixture, selectedStopId);
    if (found?.area) {
      return (
        <StopDetailPanel
          stop={found.stop}
          route={found.area}
          selectedOrderId={selectedOrderId}
          onSelectOrder={onSelectOrder}
          onStartAreaTransfer={() => onOpenTransferFromStop(found.stop.stopId)}
          onStartLocationCorrection={() => onOpenLocationCorrection(found.stop.stopId)}
          onBack={onBackFromStop}
          onClose={onCollapse}
        />
      );
    }
  }

  if (selectedRouteId) {
    const route = fixture.areas.find((item) => item.areaId === selectedRouteId);
    if (route) {
      return (
        <RouteDetailPanel
          fixture={fixture}
          route={route}
          selectedStopId={selectedStopId}
          isPending={isPending}
          justAssigned={justAssignedRouteId === route.areaId}
          onSelectStop={onSelectStop}
          onStartDriverAssignment={() => onOpenDriverPicker(route.areaId)}
          onStartRemoveDriver={() => onOpenRemoveDriver(route.areaId)}
          onToggleLock={() => onToggleDriverLock(route.areaId)}
          onBack={onBackFromRoute}
          onClose={onCollapse}
        />
      );
    }
  }

  return (
    <RoutesListPanel
      fixture={fixture}
      selectedRouteId={selectedRouteId}
      selectedUnassignedStopId={selectedUnassignedStopId}
      excludedOrderIds={excludedOrderIds}
      areaFilter={areaFilter}
      onAreaFilterChange={onAreaFilterChange}
      onSelectRoute={onSelectRoute}
      onSelectStop={onSelectStop}
      onOpenAreaPicker={onOpenAreaPicker}
      onExcludeUnassignedStop={onExcludeUnassignedStop}
      onClose={onCollapse}
    />
  );
}

type RoutesListPanelProps = {
  fixture: PlanningPlanFixture;
  selectedRouteId: string | null;
  selectedUnassignedStopId: string | null;
  excludedOrderIds: ExcludedOrderIdSet;
  areaFilter: PlanningAreaFilter;
  onAreaFilterChange: (filter: PlanningAreaFilter) => void;
  onSelectRoute: (routeId: string) => void;
  onSelectStop: (stopId: string) => void;
  onOpenAreaPicker: (stopId: string) => void;
  onExcludeUnassignedStop: (stopId: string) => void;
  onClose: () => void;
};

function RoutesListPanel({
  fixture,
  selectedRouteId,
  selectedUnassignedStopId,
  excludedOrderIds,
  areaFilter,
  onAreaFilterChange,
  onSelectRoute,
  onSelectStop,
  onOpenAreaPicker,
  onExcludeUnassignedStop,
  onClose,
}: RoutesListPanelProps) {
  const assignedCount = fixture.areas.filter((route) => !!route.driverName).length;
  const unassignedDriverCount = fixture.areas.length - assignedCount;
  const unassignedOrdersTotal = countUnassignedOrders(fixture);
  const remainingUnassigned = countRemainingUnassignedOrders(fixture, excludedOrderIds);

  const displayedRoutes = fixture.areas.filter((route) => {
    if (areaFilter === 'assigned') return !!route.driverName;
    if (areaFilter === 'unassigned') return !route.driverName;
    return true;
  });

  return (
    <aside className="planning-inspector" aria-label="پانل محدوده‌ها">
      <div className="planning-inspector-header">
        <PlanningSidebarIcon />
        <span className="planning-inspector-title">محدوده‌ها</span>
        <span className="planning-inspector-count">{toPersianDigits(fixture.areas.length)}</span>
        <button type="button" className="planning-icon-btn" title="بستن پانل" onClick={onClose}>
          <Icon d={ICONS.panel_end} size={14} />
        </button>
      </div>

      <div className="planning-inspector-stats">
        {[
          {
            value: toPersianDigits(countPlanStops(fixture) - fixture.unassignedStops.length),
            label: 'نقطه',
          },
          {
            value: toPersianDigits(countPlanOrders(fixture) - unassignedOrdersTotal),
            label: 'سفارش',
          },
          { value: toPersianDigits(fixture.areas.length), label: 'محدوده' },
          ...(remainingUnassigned > 0
            ? [{ value: toPersianDigits(remainingUnassigned), label: 'بدون محدوده', warn: true }]
            : []),
        ].map((stat) => (
          <div key={stat.label} className="planning-inspector-stat">
            <div
              className={[
                'planning-inspector-stat-value',
                'warn' in stat && stat.warn ? 'planning-inspector-stat-value--warn' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {stat.value}
            </div>
            <div className="planning-inspector-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="planning-filter-tabs" role="tablist" aria-label="فیلتر محدوده‌ها">
        {(
          [
            ['all', 'همه', fixture.areas.length],
            ['assigned', 'تخصیص‌شده', assignedCount],
            ['unassigned', 'بدون راننده', unassignedDriverCount],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            className="planning-filter-tab"
            aria-selected={areaFilter === key}
            onClick={() => onAreaFilterChange(key)}
          >
            {label}
            <span className="planning-filter-tab-count">{toPersianDigits(count)}</span>
          </button>
        ))}
      </div>

      <div className="planning-inspector-scroll">
        {displayedRoutes.map((route) => {
          const taskCount = routeOrderCount(route);
          const selected = selectedRouteId === route.areaId;
          const stateLabel = PLANNING_ROUTE_STATE_LABEL[route.planState];
          const stateColor = PLANNING_ROUTE_STATE_COLOR[route.planState];
          return (
            <button
              key={route.areaId}
              type="button"
              className="planning-route-row"
              aria-selected={selected}
              data-testid={`route-row-${route.areaId}`}
              data-route-state={route.planState}
              onClick={() => onSelectRoute(route.areaId)}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span className="planning-route-color" style={{ background: route.color }} />
                <span className="min-w-0 flex-1 text-[12.5px] font-semibold text-[var(--text-primary)]">
                  {route.label}
                </span>
                <span className="planning-route-state" style={{ color: stateColor }}>
                  {stateLabel}
                </span>
                <Icon
                  d={ICONS.chevron_l}
                  size={11}
                  stroke={selected ? 'var(--accent)' : 'var(--text-disabled)'}
                />
              </div>
              <div className="ps-[15px] text-[10.5px] text-[var(--text-secondary)]">
                {toPersianDigits(route.stops.length)} نقطه · {toPersianDigits(taskCount)} سفارش
              </div>
              <div className="mt-1 flex items-center gap-1 ps-[15px]">
                <Icon
                  d={ICONS.person}
                  size={9}
                  stroke={route.driverName ? 'var(--text-secondary)' : 'var(--text-disabled)'}
                />
                <span
                  className="text-[10px]"
                  style={{
                    color: route.driverName ? 'var(--text-secondary)' : 'var(--text-disabled)',
                  }}
                >
                  {route.driverName ?? 'راننده تخصیص داده نشده'}
                </span>
                {route.driverAssignmentLocked ? (
                  <Icon d={ICONS.lock} size={9} stroke="var(--accent-text)" />
                ) : null}
              </div>
            </button>
          );
        })}

        {displayedRoutes.length === 0 ? (
          <div className="px-3 py-6 text-center text-[11.5px] text-[var(--text-disabled)]">
            موردی یافت نشد
          </div>
        ) : null}

        {areaFilter === 'all' && fixture.unassignedStops.length > 0 ? (
          <UnassignedQueue
            stops={fixture.unassignedStops}
            excludedOrderIds={excludedOrderIds}
            selectedStopId={selectedUnassignedStopId}
            onSelectStop={onSelectStop}
            onOpenAreaPicker={onOpenAreaPicker}
            onExcludeUnassignedStop={onExcludeUnassignedStop}
          />
        ) : null}
      </div>
    </aside>
  );
}

function UnassignedQueue({
  stops,
  excludedOrderIds,
  selectedStopId,
  onSelectStop,
  onOpenAreaPicker,
  onExcludeUnassignedStop,
}: {
  stops: PlanningStop[];
  excludedOrderIds: ExcludedOrderIdSet;
  selectedStopId: string | null;
  onSelectStop: (stopId: string) => void;
  onOpenAreaPicker: (stopId: string) => void;
  onExcludeUnassignedStop: (stopId: string) => void;
}) {
  const totalOrders = countOrdersInStops(stops);
  const resolvedOrders = countExcludedOrdersInStops(stops, excludedOrderIds);
  const remaining = totalOrders - resolvedOrders;
  const allResolved = remaining === 0 && totalOrders > 0;

  return (
    <div className="planning-unassigned-section" data-testid="unassigned-queue">
      <div
        className={[
          'planning-unassigned-header',
          allResolved ? 'planning-unassigned-header--resolved' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span
          className={[
            'planning-unassigned-dot',
            allResolved ? 'planning-unassigned-dot--resolved' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        <span
          className={[
            'flex-1 text-[9px] font-bold tracking-wide uppercase',
            allResolved ? 'text-[var(--success-text)]' : 'text-[var(--warning-text)]',
          ].join(' ')}
        >
          بدون محدوده
        </span>
        <span
          className={[
            'text-[10px] font-semibold',
            allResolved ? 'text-[var(--success-text)]' : 'text-[var(--warning-text)]',
          ].join(' ')}
          data-testid="unassigned-queue-remaining"
        >
          {allResolved
            ? '✓ همه تعیین‌تکلیف شدند'
            : `${toPersianDigits(remaining)} از ${toPersianDigits(totalOrders)}`}
        </span>
      </div>
      {!allResolved ? (
        <div className="planning-unassigned-note">انتشار تا تعیین‌تکلیف همه سفارش‌ها مسدود است</div>
      ) : null}
      {stops.map((stop) => {
        const primary = stop.tasks[0];
        const selected = selectedStopId === stop.stopId;
        const stopAllExcluded = isUnassignedStopFullyExcluded(stop, excludedOrderIds);
        return (
          <div
            key={stop.stopId}
            className={[
              'planning-unassigned-row',
              stopAllExcluded ? 'planning-unassigned-row--excluded' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-selected={selected}
            data-testid={`unassigned-row-${stop.stopId}`}
            data-excluded={stopAllExcluded ? 'true' : 'false'}
            role="button"
            tabIndex={stopAllExcluded ? -1 : 0}
            onClick={() => {
              if (!stopAllExcluded) onSelectStop(stop.stopId);
            }}
            onKeyDown={(event) => {
              if (stopAllExcluded) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectStop(stop.stopId);
              }
            }}
          >
            <div className="mb-1 flex items-center gap-1">
              <LtrData className="text-[9.5px] text-[var(--accent-text)]">
                #{primary?.orderId}
              </LtrData>
              {stop.tasks.length > 1 ? (
                <span className="text-[9px] text-[var(--text-muted)]">
                  +{toPersianDigits(stop.tasks.length - 1)} سفارش دیگر
                </span>
              ) : null}
            </div>
            <div className="truncate text-[11.5px] font-medium text-[var(--text-primary)]">
              {primary?.recipientName}
            </div>
            <div className="truncate text-[10.5px] text-[var(--text-muted)]">
              {primary ? shortAddress(primary.address) : null}
            </div>
            {!stopAllExcluded ? (
              <div
                className="mt-1.5 flex gap-1"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid={`exclude-unassigned-${stop.stopId}`}
                  onClick={() => onExcludeUnassignedStop(stop.stopId)}
                >
                  مستثنا کردن
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="planning-unassigned-assign-btn"
                  data-testid={`assign-unassigned-${stop.stopId}`}
                  onClick={() => onOpenAreaPicker(stop.stopId)}
                >
                  افزودن به محدوده
                </Button>
              </div>
            ) : (
              <div
                className="mt-1 flex items-center gap-1 text-[10.5px] text-[var(--success-text)]"
                data-testid={`unassigned-excluded-${stop.stopId}`}
              >
                <span aria-hidden>✓</span>
                <span>مستثنا شد</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RouteDetailPanel({
  fixture,
  route,
  selectedStopId,
  isPending,
  justAssigned,
  onSelectStop,
  onStartDriverAssignment,
  onStartRemoveDriver,
  onToggleLock,
  onBack,
  onClose,
}: {
  fixture: PlanningPlanFixture;
  route: PlanningArea;
  selectedStopId: string | null;
  isPending: boolean;
  justAssigned: boolean;
  onSelectStop: (stopId: string) => void;
  onStartDriverAssignment: () => void;
  onStartRemoveDriver: () => void;
  onToggleLock: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const totalTasks = routeOrderCount(route);
  const sortedStops = useMemo(() => orderedRouteStops(route, fixture), [fixture, route]);
  const planningRoute = findRouteForArea(fixture, route.areaId);
  const stopListRef = useRef<HTMLDivElement>(null);
  const stateLabel = PLANNING_ROUTE_STATE_LABEL[route.planState];
  const stateColor = PLANNING_ROUTE_STATE_COLOR[route.planState];

  useEffect(() => {
    if (!selectedStopId || !stopListRef.current) return;
    const el = stopListRef.current.querySelector(
      `[data-stop-id="${selectedStopId}"]`,
    ) as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedStopId]);

  return (
    <aside className="planning-inspector" aria-label={`جزئیات ${route.label}`}>
      <div className="planning-inspector-header !items-start">
        <div className="min-w-0 flex-1">
          <button type="button" className="planning-back-btn mb-1" onClick={onBack}>
            <Icon d={ICONS.chevron_r} size={11} />
            محدوده‌ها
          </button>
          <div className="flex items-center gap-1.5">
            <span
              className="planning-route-color !h-[9px] !w-[9px]"
              style={{ background: route.color }}
            />
            <div className="min-w-0 flex-1 text-[13px] font-bold text-[var(--text-primary)]">
              {route.label}
            </div>
            <span className="planning-route-state" style={{ color: stateColor }}>
              {stateLabel}
            </span>
          </div>
        </div>
        <button type="button" className="planning-icon-btn" title="بستن پانل" onClick={onClose}>
          <Icon d={ICONS.panel_end} size={14} />
        </button>
      </div>

      <div className="planning-inspector-stats !bg-[var(--bg-panel)] !py-2">
        <div className="planning-inspector-stat">
          <div className="planning-inspector-stat-value !text-base">
            {toPersianDigits(route.stops.length)}
          </div>
          <div className="planning-inspector-stat-label">نقطه</div>
        </div>
        <div className="planning-inspector-stat">
          <div className="planning-inspector-stat-value !text-base">
            {toPersianDigits(totalTasks)}
          </div>
          <div className="planning-inspector-stat-label">سفارش</div>
        </div>
        <div className="planning-inspector-stat">
          <div className="planning-inspector-stat-value !text-base">
            {toPersianDigits(planningRoute?.distanceKm ?? 0)}
          </div>
          <div className="planning-inspector-stat-label">کیلومتر</div>
        </div>
        <div className="planning-inspector-stat">
          <div className="planning-inspector-stat-value !text-[12px] !leading-tight">
            {formatDurationMin(planningRoute?.durationMin ?? 0)}
          </div>
          <div className="planning-inspector-stat-label">زمان</div>
        </div>
      </div>

      <div
        className="border-b border-[var(--border-default)] px-3 py-2.5"
        data-testid="route-driver-section"
      >
        <div className="mb-2 text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
          DRIVER
        </div>
        {isPending ? (
          <div className="flex items-center gap-2.5" data-testid="driver-op-pending">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)]">
              <span className="planning-generation-pill-spinner" aria-hidden />
            </div>
            <div className="text-[11.5px] text-[var(--text-muted)]">در حال ذخیره تخصیص…</div>
          </div>
        ) : route.driverName ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                <Icon d={ICONS.person} size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[12.5px] font-semibold text-[var(--text-primary)]"
                  data-testid="route-driver-name"
                >
                  {route.driverName}
                </div>
                <div className="mt-0.5 text-[10px] text-[var(--success-text)]">تخصیص داده شده</div>
              </div>
              <button
                type="button"
                className="planning-driver-change-btn"
                data-testid="change-driver"
                onClick={onStartDriverAssignment}
              >
                تغییر راننده
              </button>
            </div>
            <button
              type="button"
              className="planning-driver-remove-btn"
              data-testid="remove-driver"
              onClick={onStartRemoveDriver}
            >
              <Icon d={ICONS.trash} size={11} />
              حذف تخصیص راننده
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-disabled)]">
              <Icon d={ICONS.person} size={13} />
            </div>
            <div className="min-w-0 flex-1 text-[11.5px] text-[var(--text-disabled)]">
              راننده تخصیص داده نشده
            </div>
            <Button
              variant="primary"
              size="sm"
              data-testid="assign-driver"
              onClick={onStartDriverAssignment}
            >
              تخصیص راننده
            </Button>
          </div>
        )}

        {justAssigned ? (
          <div
            className="mt-2 flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[rgba(43,157,111,0.25)] bg-[rgba(43,157,111,0.1)] px-2 py-1.5"
            data-testid="driver-just-assigned"
          >
            <Icon d={ICONS.check} size={11} stroke="var(--success-text)" />
            <span className="text-[10.5px] text-[var(--success-text)]">
              راننده به محدوده تخصیص داده شد.
            </span>
          </div>
        ) : null}

        {route.driverName && !isPending ? (
          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              className={
                route.driverAssignmentLocked
                  ? 'planning-driver-lock-btn is-locked'
                  : 'planning-driver-lock-btn'
              }
              title={route.driverAssignmentLocked ? 'آزاد کردن قفل' : 'قفل کردن تخصیص'}
              data-testid="toggle-driver-lock"
              data-locked={route.driverAssignmentLocked ? 'true' : 'false'}
              onClick={onToggleLock}
            >
              <Icon d={route.driverAssignmentLocked ? ICONS.lock : ICONS.lock_open} size={11} />
            </button>
            <span
              className={
                route.driverAssignmentLocked
                  ? 'text-[10.5px] text-[var(--text-secondary)]'
                  : 'text-[10.5px] text-[var(--text-disabled)]'
              }
            >
              حفظ این تخصیص در بازسازی
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center border-b border-[var(--border-subtle)] px-3 py-1.5">
        <span className="text-[10.5px] font-semibold text-[var(--text-secondary)]">نقاط تحویل</span>
        <span className="ms-1 text-[10px] text-[var(--text-muted)]">
          ({toPersianDigits(sortedStops.length)})
        </span>
      </div>

      <div ref={stopListRef} className="planning-inspector-scroll" data-testid="route-stop-list">
        {sortedStops.map((stop, index) => {
          const selected = selectedStopId === stop.stopId;
          const primary = stop.tasks[0];
          return (
            <button
              key={stop.stopId}
              type="button"
              className="planning-stop-row flex items-stretch gap-0 !p-0"
              aria-selected={selected}
              data-stop-id={stop.stopId}
              data-stop-seq={stop.seq}
              data-testid={`stop-row-${stop.stopId}`}
              onClick={() => onSelectStop(stop.stopId)}
            >
              <div className="planning-stop-seq" aria-hidden>
                <span className="planning-stop-seq-num">{toPersianDigits(index + 1)}</span>
                <span
                  className="planning-stop-pip"
                  style={{ background: route.color, opacity: selected ? 1 : 0.6 }}
                />
              </div>
              <div className="min-w-0 flex-1 py-2.5 pe-3">
                <div className="truncate text-[12px] font-semibold text-[var(--text-primary)]">
                  {primary ? shortAddress(primary.address) : stop.stopId}
                </div>
                <div className="mt-0.5 truncate text-[10.5px] text-[var(--text-secondary)]">
                  {stop.tasks.length > 1 ? (
                    <span className="font-medium text-[var(--accent-text)]">
                      {toPersianDigits(stop.tasks.length)} سفارش
                    </span>
                  ) : (
                    primary?.recipientName
                  )}
                </div>
              </div>
              <div
                className="flex items-center pe-2.5"
                style={{ color: selected ? 'var(--accent)' : 'var(--text-disabled)' }}
              >
                <Icon d={ICONS.chevron_l} size={11} />
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function OrderDetailPanel({
  task,
  stop,
  route,
  onStartAreaTransfer,
  onStartLocationCorrection,
  onBack,
  onClose,
}: {
  task: PlanningStop['tasks'][number];
  stop: PlanningStop;
  route: PlanningArea;
  onStartAreaTransfer: () => void;
  onStartLocationCorrection: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <aside className="planning-inspector" aria-label="جزئیات سفارش" data-testid="order-detail">
      <div className="planning-inspector-header !items-start">
        <div className="min-w-0 flex-1">
          <button type="button" className="planning-back-btn mb-0.5" onClick={onBack}>
            <Icon d={ICONS.chevron_r} size={11} />
            نقطه تحویل
          </button>
          <div className="text-[10px] text-[var(--text-disabled)]">سفارش</div>
          <LtrData className="text-[13px] font-bold text-[var(--accent-text)]">
            #{task.orderId}
          </LtrData>
        </div>
        <button type="button" className="planning-icon-btn" title="بستن پانل" onClick={onClose}>
          <Icon d={ICONS.panel_end} size={14} />
        </button>
      </div>

      <div className="planning-inspector-scroll px-3 py-2.5">
        <div className="mb-3">
          <div className="mb-1 text-[10px] text-[var(--text-muted)]">گیرنده</div>
          <div className="text-[12.5px] text-[var(--text-primary)]">{task.recipientName}</div>
        </div>
        <div className="mb-3">
          <div className="mb-1 text-[10px] text-[var(--text-muted)]">تلفن</div>
          <LtrData className="text-[12.5px] text-[var(--text-primary)]" data-testid="order-phone">
            {formatPhoneForDisplay(task.phone)}
          </LtrData>
        </div>
        <div className="mb-3">
          <div className="mb-1 text-[10px] text-[var(--text-muted)]">آدرس</div>
          <div className="text-[12.5px] leading-relaxed text-[var(--text-primary)]">
            {task.address}
          </div>
        </div>
        <div className="border-t border-[var(--border-subtle)] pt-2.5">
          <div className="mb-2">
            <div className="mb-1 text-[10px] text-[var(--text-muted)]">محدوده</div>
            <div className="flex items-center gap-1.5">
              <span className="planning-route-color" style={{ background: route.color }} />
              <span className="text-[12px] text-[var(--text-primary)]">{route.label}</span>
            </div>
          </div>
          <div className="mb-3">
            <div className="mb-1 text-[10px] text-[var(--text-muted)]">نقطه تحویل</div>
            <div className="text-[12px] text-[var(--text-primary)]">
              {shortAddress(stop.tasks[0]?.address ?? stop.stopId)}
            </div>
          </div>
          <div className="flex gap-1.5 border-t border-[var(--border-subtle)] pt-2.5">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              data-testid="start-order-transfer"
              onClick={onStartAreaTransfer}
            >
              <span className="inline-flex items-center gap-1">
                <Icon d={ICONS.transfer} size={11} />
                انتقال محدوده
              </span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              data-testid="start-location-correction"
              onClick={onStartLocationCorrection}
            >
              <span className="inline-flex items-center gap-1">
                <Icon d={ICONS.edit} size={11} />
                اصلاح موقعیت
              </span>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function StopDetailPanel({
  stop,
  route,
  selectedOrderId,
  onSelectOrder,
  onStartAreaTransfer,
  onStartLocationCorrection,
  onBack,
  onClose,
}: {
  stop: PlanningStop;
  route: PlanningArea;
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  onStartAreaTransfer: () => void;
  onStartLocationCorrection: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const primary = stop.tasks[0];
  return (
    <aside className="planning-inspector" aria-label="جزئیات نقطه تحویل">
      <div className="planning-inspector-header !items-start">
        <div className="min-w-0 flex-1">
          <button type="button" className="planning-back-btn mb-0.5" onClick={onBack}>
            <Icon d={ICONS.chevron_r} size={11} />
            {route.label}
          </button>
          <div className="text-[10px] text-[var(--text-disabled)]">نقطه تحویل</div>
          <div className="truncate text-[13px] font-bold text-[var(--text-primary)]">
            {primary ? shortAddress(primary.address) : stop.stopId}
          </div>
        </div>
        <button type="button" className="planning-icon-btn" title="بستن پانل" onClick={onClose}>
          <Icon d={ICONS.panel_end} size={14} />
        </button>
      </div>

      <div className="border-b border-[var(--border-subtle)] px-3 py-2.5">
        <div className="mb-2.5 text-[11.5px] leading-relaxed text-[var(--text-secondary)]">
          {primary?.address}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <span className="w-[68px] shrink-0 text-[10.5px] text-[var(--text-muted)]">
              سفارش‌ها
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {toPersianDigits(stop.tasks.length)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-[68px] shrink-0 text-[10.5px] text-[var(--text-muted)]">محدوده</span>
            <span className="planning-route-color" style={{ background: route.color }} />
            <span className="text-[11px] text-[var(--text-secondary)]">{route.label}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-1.5 border-b border-[var(--border-subtle)] px-3 py-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          data-testid="start-area-transfer"
          onClick={onStartAreaTransfer}
        >
          <span className="inline-flex items-center gap-1">
            <Icon d={ICONS.transfer} size={11} />
            انتقال به محدوده دیگر
          </span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          data-testid="start-location-correction"
          onClick={onStartLocationCorrection}
        >
          <span className="inline-flex items-center gap-1">
            <Icon d={ICONS.edit} size={11} />
            اصلاح موقعیت
          </span>
        </Button>
      </div>

      <div className="border-b border-[var(--border-subtle)] px-3 py-1.5">
        <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
          سفارش‌های این توقف
        </span>
        <span className="ms-1.5 text-[10px] text-[var(--text-muted)]">
          ({toPersianDigits(stop.tasks.length)})
        </span>
      </div>

      <div className="planning-inspector-scroll" data-testid="stop-order-list">
        {stop.tasks.map((task) => {
          const selected = selectedOrderId === task.orderId;
          return (
            <button
              key={task.orderId}
              type="button"
              className="planning-order-row"
              aria-selected={selected}
              data-testid={`order-row-${task.orderId}`}
              onClick={() => onSelectOrder(task.orderId)}
            >
              <div className="mb-0.5">
                <LtrData className="text-[9.5px] text-[var(--accent-text)]">
                  #{task.orderId}
                </LtrData>
              </div>
              <div className="text-[12px] font-semibold text-[var(--text-primary)]">
                {task.recipientName}
              </div>
              <div className="mt-0.5 truncate text-[10.5px] text-[var(--text-muted)]">
                {task.address}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

type CollapsedPanelProps = {
  onExpand: () => void;
};

export function PlanningCollapsedPanel({ onExpand }: CollapsedPanelProps) {
  return (
    <button
      type="button"
      className="planning-inspector-collapsed"
      aria-label="باز کردن پانل"
      title="باز کردن پانل"
      onClick={onExpand}
    >
      <Icon d={ICONS.panel_end} size={14} />
    </button>
  );
}
