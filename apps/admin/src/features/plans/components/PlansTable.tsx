import { useState } from 'react';

import { toPersianDigits } from '@/shared/lib/format';
import { LtrData } from '@/shared/ui';

import type { A01PlanViewModel } from '@/features/plans/a01-types';
import { PlanStatusBadge, StagePill } from '@/features/plans/components/PlanBadges';
import { Icon, ICONS } from '@/features/plans/components/icons';

type PlansTableProps = {
  plans: A01PlanViewModel[];
  onOpenPlan: (plan: A01PlanViewModel) => void;
  onEditMeta: (plan: A01PlanViewModel) => void;
  onDeleteDraft: (plan: A01PlanViewModel) => void;
};

export function PlansTable({ plans, onOpenPlan, onEditMeta, onDeleteDraft }: PlansTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-elevated)]">
      <table className="data-table w-full">
        <thead>
          <tr>
            <th className="ps-4">نام برنامه</th>
            <th>تاریخ تحویل</th>
            <th>موارد تحویل</th>
            <th>مرحله جاری</th>
            <th>وضعیت</th>
            <th>آخرین تغییر</th>
            <th style={{ width: 40 }} />
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr
              key={plan.id}
              className="row-normal cursor-pointer"
              onClick={() => onOpenPlan(plan)}
            >
              <td className="ps-4">
                <div className="text-[13px] font-medium text-[var(--text-primary)]">{plan.name}</div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <LtrData className="text-[10px] text-[var(--text-muted)]">{plan.id}</LtrData>
                  {plan.window ? (
                    <>
                      <span className="text-[10px] text-[var(--border-default)]">·</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{plan.window}</span>
                    </>
                  ) : null}
                </div>
              </td>
              <td>
                <LtrData className="text-xs text-[var(--text-secondary)]">{plan.deliveryDate}</LtrData>
              </td>
              <td>
                {plan.itemCount !== undefined ? (
                  <span className="badge-count">{toPersianDigits(plan.itemCount)}</span>
                ) : (
                  <span className="text-xs text-[var(--text-disabled)]">—</span>
                )}
              </td>
              <td>
                <StagePill stage={plan.currentStage} />
              </td>
              <td>
                <PlanStatusBadge status={plan.status} />
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
                      setOpenMenuId((prev) => (prev === plan.id ? null : plan.id));
                    }}
                  >
                    <Icon d={ICONS.menu_dots} size={14} />
                  </button>
                  {openMenuId === plan.id ? (
                    <PlanRowActionsMenu
                      plan={plan}
                      onOpen={() => onOpenPlan(plan)}
                      onEditMeta={() => onEditMeta(plan)}
                      onDeleteDraft={() => onDeleteDraft(plan)}
                      onClose={() => setOpenMenuId(null)}
                    />
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlanRowActionsMenu({
  plan,
  onOpen,
  onEditMeta,
  onDeleteDraft,
  onClose,
}: {
  plan: A01PlanViewModel;
  onOpen: () => void;
  onEditMeta: () => void;
  onDeleteDraft: () => void;
  onClose: () => void;
}) {
  const isDraft = plan.status === 'draft' && !plan.importedFile;

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="بستن منو" onClick={onClose} />
      <div
        role="menu"
        className="absolute end-0 top-full z-50 min-w-[170px] rounded-[var(--r-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-1 shadow-[var(--shadow-lg)]"
      >
        <button
          type="button"
          role="menuitem"
          className="menu-item"
          onClick={() => {
            onOpen();
            onClose();
          }}
        >
          <span className="menu-icon">
            <Icon d={ICONS.plans} size={13} />
          </span>
          باز کردن
        </button>
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
          ویرایش مشخصات
        </button>
        {isDraft ? (
          <>
            <div className="divider my-1 mx-2" />
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
