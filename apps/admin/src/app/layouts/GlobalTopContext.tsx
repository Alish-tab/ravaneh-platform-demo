import { Link } from 'react-router-dom';

import { Icon, ICONS } from '@/features/plans/components/icons';

type GlobalTopContextProps = {
  title: string;
  breadcrumb?: string;
  breadcrumbTo?: string;
};

/**
 * Compact global workspace context bar (≈44px).
 * Branding lives in the sidebar; this is not the old product header.
 */
export function GlobalTopContext({
  title,
  breadcrumb,
  breadcrumbTo = '/plans',
}: GlobalTopContextProps) {
  return (
    <div className="admin-shell-top">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {breadcrumb ? (
          <>
            <Link
              to={breadcrumbTo}
              className="inline-flex items-center gap-1 rounded-[var(--r-xs)] px-1 py-0.5 text-[12.5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <Icon d={ICONS.chevron_r} size={12} />
              <span>{breadcrumb}</span>
            </Link>
            <span className="text-[11px] text-[var(--text-disabled)]">/</span>
          </>
        ) : null}
        <span className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
          {title}
        </span>
      </div>
    </div>
  );
}
