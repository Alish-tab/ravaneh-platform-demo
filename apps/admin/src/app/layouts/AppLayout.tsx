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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold tracking-tight">روانه</p>
            <p className="text-xs text-slate-500">پنل ادمین — پایه اولیه</p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="ناوبری اصلی">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
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
