import { NavLink, Outlet } from 'react-router-dom';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
};

const navItems: NavItem[] = [
  { to: '/', label: 'خانه', end: true },
  { to: '/plans', label: 'پلن‌ها' },
  { to: '/imports', label: 'ایمپورت' },
  { to: '/planning', label: 'برنامه‌ریزی' },
  { to: '/drivers', label: 'راننده‌ها' },
  { to: '/map', label: 'نقشه (Smoke)' },
];

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">روانه</p>
            <p className="text-xs text-[var(--text-muted)]">پنل ادمین</p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="ناوبری اصلی">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'rounded-[var(--r-sm)] px-3 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-[var(--accent-dim)] text-[var(--accent-text)]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-0 py-2">
        <Outlet />
      </main>
    </div>
  );
}
