import { useState } from 'react';
import { NavLink } from 'react-router-dom';

import { Icon, ICONS } from '@/features/plans/components/icons';
import { LtrIso } from '@/shared/ui';

const NAV_ITEMS = [
  { to: '/plans', label: 'برنامه‌ها', icon: ICONS.plans, end: false },
  { to: '/ops', label: 'عملیات جاری', icon: ICONS.ops, end: true },
  { to: '/drivers', label: 'رانندگان', icon: ICONS.person, end: true },
] as const;

type GlobalNavigationProps = {
  collapsed: boolean;
  onToggle: () => void;
};

/**
 * A01 product global navigation — vertical sidebar.
 * In RTL this sits on the inline-start (right) edge of the shell.
 */
export function GlobalNavigation({ collapsed, onToggle }: GlobalNavigationProps) {
  const [showAccount, setShowAccount] = useState(false);
  const width = collapsed ? 52 : 196;

  return (
    <aside
      className="admin-shell-nav"
      style={{ width, minWidth: width }}
    >
      <div className="admin-shell-nav-brand">
        <button
          type="button"
          className="admin-shell-mark"
          title={collapsed ? 'باز کردن منو' : 'بستن منو'}
          aria-label={collapsed ? 'باز کردن منو' : 'بستن منو'}
          onClick={onToggle}
        >
          ر
        </button>
        {!collapsed ? (
          <>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="whitespace-nowrap text-sm font-bold tracking-tight text-[var(--text-primary)]">
                روانه
              </div>
              <LtrIso className="whitespace-nowrap text-[10px] tracking-[0.04em] text-[var(--text-muted)]">
                RAVANEH
              </LtrIso>
            </div>
            <button
              type="button"
              className="rounded-[var(--r-xs)] p-[5px] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
              title="بستن منو"
              aria-label="بستن منو"
              onClick={onToggle}
            >
              <Icon d={ICONS.chevron_r} size={13} />
            </button>
          </>
        ) : null}
      </div>

      <nav className="admin-shell-nav-list" aria-label="ناوبری اصلی">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              [
                'shell-nav-item',
                isActive ? 'shell-nav-item--active' : '',
                collapsed ? 'shell-nav-item--collapsed' : '',
              ]
                .filter(Boolean)
                .join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    'inline-flex shrink-0',
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                  ].join(' ')}
                >
                  <Icon d={item.icon} size={15} />
                </span>
                {!collapsed ? <span>{item.label}</span> : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="admin-shell-account">
        {showAccount ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="بستن منوی حساب"
              onClick={() => setShowAccount(false)}
            />
            <div className="admin-shell-account-popover" role="menu">
              <div className="border-b border-[var(--border-subtle)] px-3 py-2 mb-1">
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">امین رضایی</div>
                <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">مدیر عملیات</div>
              </div>
              <button type="button" className="menu-item" role="menuitem">
                <span className="menu-icon">
                  <Icon d={ICONS.person} size={13} />
                </span>
                حساب کاربری
              </button>
              <button
                type="button"
                className="menu-item danger"
                role="menuitem"
                onClick={() => setShowAccount(false)}
              >
                <span className="menu-icon">
                  <Icon d={ICONS.logout} size={13} />
                </span>
                خروج
              </button>
            </div>
          </>
        ) : null}

        {collapsed ? (
          <button
            type="button"
            className={[
              'admin-shell-account-collapsed',
              showAccount ? 'active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            title="حساب کاربری"
            aria-label="حساب کاربری"
            aria-expanded={showAccount}
            onClick={() => setShowAccount((v) => !v)}
          >
            <Icon d={ICONS.person} size={15} />
          </button>
        ) : (
          <button
            type="button"
            className={[
              'admin-shell-account-btn',
              showAccount ? 'active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-expanded={showAccount}
            onClick={() => setShowAccount((v) => !v)}
          >
            <div
              className={[
                'admin-shell-avatar',
                showAccount ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
              ].join(' ')}
            >
              <Icon d={ICONS.person} size={13} />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden text-start">
              <div className="truncate text-xs font-semibold leading-tight text-[var(--text-primary)]">
                امین رضایی
              </div>
              <div className="whitespace-nowrap text-[11px] text-[var(--text-secondary)]">
                مدیر عملیات
              </div>
            </div>
            <span className="inline-flex shrink-0 text-[var(--text-muted)]">
              <Icon d={ICONS.chevron_d} size={11} />
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
