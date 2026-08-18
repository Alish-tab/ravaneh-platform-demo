import { useState } from 'react';

import { toPersianDigits } from '@/shared/lib/format';
import { LtrData, StatusBadge } from '@/shared/ui';

import type { A01PlanViewModel, PlansListView } from '@/features/plans/a01-types';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { PlansPagination } from '@/features/plans/components/PlansPagination';
import { PLAN_LIFECYCLE_PRESENTATION } from '@/features/plans/presentation';
import type { PlanDateSection } from '@/features/plans/query-plans';

type PlansTableProps = {
  sections: PlanDateSection[];
  view: PlansListView;
  onOpenPlan: (plan: A01PlanViewModel) => void;
  onEditMeta: (plan: A01PlanViewModel) => void;
  onDeleteDraft: (plan: A01PlanViewModel) => void;
  page: number;
  pageCount: number;
  startItem: number;
  endItem: number;
  totalItems: number;
  onPage: (page: number) => void;
};

export function PlansTable({
  sections,
  view,
  onOpenPlan,
  onEditMeta,
  onDeleteDraft,
  page,
  pageCount,
  startItem,
  endItem,
  totalItems,
  onPage,
}: PlansTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [pastExpanded, setPastExpanded] = useState(false);

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--bg-elevated)]">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th className="ps-4">برنامه</th>
              <th>بازه تحویل</th>
              <th>سفارش‌ها</th>
              <th>وضعیت برنامه</th>
              <th>نیازمند اقدام</th>
              <th>آخرین تغییر</th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const isPast = section.kind === 'past';
              const collapsible = isPast && view === 'all';
              const collapsed = collapsible && !pastExpanded;
              return (
                <DateSectionRows
                  key={section.key}
                  section={section}
                  view={view}
                  collapsed={collapsed}
                  collapsible={collapsible}
                  onTogglePast={() => setPastExpanded((value) => !value)}
                  openMenuId={openMenuId}
                  onOpenMenu={setOpenMenuId}
                  onOpenPlan={onOpenPlan}
                  onEditMeta={onEditMeta}
                  onDeleteDraft={onDeleteDraft}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      <PlansPagination
        page={page}
        pageCount={pageCount}
        startItem={startItem}
        endItem={endItem}
        totalItems={totalItems}
        onPage={onPage}
      />
    </>
  );
}

function DateSectionRows({
  section,
  view,
  collapsed,
  collapsible,
  onTogglePast,
  openMenuId,
  onOpenMenu,
  onOpenPlan,
  onEditMeta,
  onDeleteDraft,
}: {
  section: PlanDateSection;
  view: PlansListView;
  collapsed: boolean;
  collapsible: boolean;
  onTogglePast: () => void;
  openMenuId: string | null;
  onOpenMenu: (id: string | null) => void;
  onOpenPlan: (plan: A01PlanViewModel) => void;
  onEditMeta: (plan: A01PlanViewModel) => void;
  onDeleteDraft: (plan: A01PlanViewModel) => void;
}) {
  return (
    <>
      <tr>
        <td colSpan={7} className="plans-date-divider">
          {collapsible ? (
            <button
              type="button"
              className="plans-date-divider-inner"
              aria-expanded={!collapsed}
              onClick={onTogglePast}
            >
              <DateDividerContent section={section} collapsible collapsed={collapsed} />
            </button>
          ) : (
            <div className="plans-date-divider-inner">
              <DateDividerContent section={section} />
            </div>
          )}
        </td>
      </tr>
      {collapsed
        ? null
        : section.plans.map((plan) => (
            <tr
              key={plan.id}
              className="row-normal cursor-pointer"
              onClick={() => onOpenPlan(plan)}
            >
              <td className="ps-4">
                <div className="text-[13px] leading-snug font-medium text-[var(--text-primary)]">
                  {plan.name}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <LtrData className="text-[10px] text-[var(--text-disabled)]">{plan.id}</LtrData>
                  {plan.hasWorkingVersion ? (
                    <>
                      <span className="text-[9px] text-[var(--border-subtle)]">·</span>
                      <span className="plans-working-chip">نسخه کاری</span>
                    </>
                  ) : null}
                </div>
              </td>
              <td>
                {plan.window ? (
                  <span className="text-[12.5px] font-medium text-[var(--text-secondary)]">
                    {plan.window}
                  </span>
                ) : (
                  <span className="text-xs text-[var(--text-disabled)]">—</span>
                )}
              </td>
              <td>
                {plan.itemCount !== undefined ? (
                  <span className="badge-count">{toPersianDigits(plan.itemCount)}</span>
                ) : (
                  <span className="text-xs text-[var(--text-disabled)]">—</span>
                )}
              </td>
              <td>
                <LifecycleBadge lifecycle={plan.lifecycle} />
              </td>
              <td>
                {plan.needsAttention ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={needsAttentionClass(plan.needsAttention)}>
                      {plan.needsAttention}
                    </span>
                    {view === 'preparing' && plan.attentionActionLabel ? (
                      <button
                        type="button"
                        className="plans-attention-cta"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenPlan(plan);
                        }}
                      >
                        {plan.attentionActionLabel}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-xs text-[var(--text-disabled)]">—</span>
                )}
              </td>
              <td className="text-[11.5px] text-[var(--text-muted)]">{plan.lastChanged}</td>
              <td className="relative overflow-visible">
                <div className="relative">
                  <button
                    type="button"
                    className="rounded-[var(--r-xs)] p-1 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                    aria-label={`عملیات ${plan.name}`}
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === plan.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenMenu(openMenuId === plan.id ? null : plan.id);
                    }}
                  >
                    <Icon d={ICONS.menu_dots} size={14} />
                  </button>
                  {openMenuId === plan.id ? (
                    <PlanRowActionsMenu
                      plan={plan}
                      onEditMeta={() => onEditMeta(plan)}
                      onDeleteDraft={() => onDeleteDraft(plan)}
                      onClose={() => onOpenMenu(null)}
                    />
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
    </>
  );
}

function DateDividerContent({
  section,
  collapsible,
  collapsed,
}: {
  section: PlanDateSection;
  collapsible?: boolean;
  collapsed?: boolean;
}) {
  return (
    <>
      {section.kind === 'today' || section.kind === 'tomorrow' ? (
        <span className={['plans-date-chip', section.kind].join(' ')}>
          {section.kind === 'today' ? 'امروز' : 'فردا'}
        </span>
      ) : null}
      <span
        className={['plans-date-label', section.kind === 'past' ? 'muted' : '']
          .filter(Boolean)
          .join(' ')}
      >
        {section.label}
      </span>
      <span className="plans-date-count">· {toPersianDigits(section.plans.length)} برنامه</span>
      {collapsible ? (
        <span className="text-[var(--text-disabled)]">
          <Icon d={collapsed ? ICONS.chevron_r : ICONS.chevron_d} size={11} />
        </span>
      ) : null}
      <span className="plans-date-rule" />
    </>
  );
}

function LifecycleBadge({ lifecycle }: { lifecycle: A01PlanViewModel['lifecycle'] }) {
  const cfg = PLAN_LIFECYCLE_PRESENTATION[lifecycle];
  return <StatusBadge tone={cfg.tone} label={cfg.compactLabel} pulse={cfg.pulse} />;
}

function needsAttentionClass(copy: string): string {
  if (copy.includes('خطا')) return 'text-xs text-[var(--error-text)]';
  if (copy.includes('پردازش')) return 'text-xs text-[var(--text-muted)]';
  if (
    copy.includes('راننده') ||
    copy.includes('نیازمند بررسی') ||
    copy.includes('تغییرات')
  ) {
    return 'text-xs text-[var(--warning-text)]';
  }
  return 'text-xs text-[var(--text-secondary)]';
}

function PlanRowActionsMenu({
  plan,
  onEditMeta,
  onDeleteDraft,
  onClose,
}: {
  plan: A01PlanViewModel;
  onEditMeta: () => void;
  onDeleteDraft: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="بستن منو" onClick={onClose} />
      <div
        role="menu"
        className="absolute end-0 top-full z-50 min-w-[180px] rounded-[var(--r-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-1 shadow-[var(--shadow-lg)]"
      >
        <button
          type="button"
          role="menuitem"
          className="menu-item"
          onClick={() => {
            onEditMeta();
            onClose();
          }}
        >
          <span className="menu-icon">
            <Icon d={ICONS.edit} size={13} />
          </span>
          ویرایش مشخصات برنامه
        </button>
        {plan.canDeleteDraft ? (
          <>
            <div className="divider mx-2 my-1" />
            <button
              type="button"
              role="menuitem"
              className="menu-item danger"
              onClick={() => {
                onDeleteDraft();
                onClose();
              }}
            >
              <span className="menu-icon">
                <Icon d={ICONS.trash} size={13} />
              </span>
              حذف پیش‌نویس
            </button>
          </>
        ) : null}
      </div>
    </>
  );
}
