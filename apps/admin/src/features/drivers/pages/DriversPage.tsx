import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Input, InlineMessage, LtrIso, StatusBadge, Toggle } from '@/shared/ui';
import { useDriversPort, useDriversVersion } from '@/features/drivers/port/useDriversData';
import { usePlansDataPort } from '@/features/plans/fixture/usePlansFixture';
import { dateToJalali, jalaliSortKey } from '@/features/ops/lib/jalali';
import type { DriverRecord, DriverTodayAssignment, DriverMutationState, DriverAppAccessStatus } from '@/features/drivers/model/types';
import '@/features/drivers/drivers.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toPersian(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d);
}

function getTodaySortKey(): string {
  const now = new Date();
  return jalaliSortKey(dateToJalali(now));
}

// ─── Status badges ───────────────────────────────────────────────────────────

function DriverStatusBadge({ active }: { active: boolean }) {
  return (
    <StatusBadge tone={active ? 'success' : 'neutral'} label={active ? 'فعال' : 'غیرفعال'} />
  );
}

function AppAccessBadge({ status }: { status: DriverAppAccessStatus }) {
  if (status === 'active') return <StatusBadge tone="success" label="فعال" />;
  if (status === 'blocked') return <StatusBadge tone="error" label="مسدود" />;
  return <StatusBadge tone="neutral" label="دسترسی ایجاد نشده" />;
}

// ─── Assignment chip (table) ──────────────────────────────────────────────────

function AssignmentChip({ assignment }: { assignment: DriverTodayAssignment }) {
  return (
    <span className="drv-assignment-chip">
      <span className="drv-chip-window">{assignment.deliveryWindow}</span>
      <span className="drv-chip-sep">·</span>
      <span>{assignment.areaLabel}</span>
    </span>
  );
}

// ─── Add Driver dialog ────────────────────────────────────────────────────────

type AddDriverDialogProps = {
  onClose: () => void;
  onAdded: (driver: DriverRecord) => void;
};

function AddDriverDialog({ onClose, onAdded }: AddDriverDialogProps) {
  const port = useDriversPort();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [mutation, setMutation] = useState<DriverMutationState>({ kind: 'idle' });

  async function handleSubmit() {
    if (!name.trim()) return;
    setMutation({ kind: 'submitting' });
    try {
      const rec = await port.createDriver({
        name,
        phone,
        initialStatus: isActive ? 'active' : 'inactive',
      });
      setMutation({ kind: 'success' });
      onAdded(rec);
      onClose();
    } catch {
      setMutation({ kind: 'failure', message: 'خطا در ثبت راننده. لطفاً دوباره تلاش کنید.' });
    }
  }

  return (
    <div className="drv-dialog-backdrop" onClick={onClose} role="presentation">
      <div className="drv-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal aria-label="افزودن راننده">
        <div className="drv-dialog-header">
          <div className="drv-dialog-title">افزودن راننده</div>
          <button className="drv-icon-btn" onClick={onClose} aria-label="بستن">✕</button>
        </div>
        <div className="drv-dialog-body">
          <Field label="نام و نام خانوادگی">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: علی احمدی"
            />
          </Field>
          <Field label="شماره تلفن">
            <LtrIso>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxxx"
              />
            </LtrIso>
          </Field>
          <div className="drv-toggle-row">
            <Toggle checked={isActive} onChange={setIsActive} label="راننده از همان ابتدا فعال باشد" />
          </div>
          <InlineMessage tone="info">
            دسترسی اپ راننده را می‌توان پس از ثبت، از پروفایل راننده ایجاد کرد.
          </InlineMessage>
          {mutation.kind === 'failure' && (
            <InlineMessage tone="error">{mutation.message}</InlineMessage>
          )}
        </div>
        <div className="drv-dialog-footer">
          <Button variant="ghost" onClick={onClose}>انصراف</Button>
          <Button
            variant="primary"
            onClick={() => void handleSubmit()}
            disabled={!name.trim() || mutation.kind === 'submitting'}
          >
            {mutation.kind === 'submitting' ? 'در حال ثبت…' : 'افزودن راننده'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Driver dialog ───────────────────────────────────────────────────────

type EditDriverDialogProps = {
  driver: DriverRecord;
  onClose: () => void;
};

function EditDriverDialog({ driver, onClose }: EditDriverDialogProps) {
  const port = useDriversPort();
  const [name, setName] = useState(driver.name);
  const [phone, setPhone] = useState(driver.phone);
  const [mutation, setMutation] = useState<DriverMutationState>({ kind: 'idle' });

  async function handleSave() {
    setMutation({ kind: 'submitting' });
    try {
      await port.updateDriver(driver.driverId, { name, phone }, driver.version);
      setMutation({ kind: 'success' });
      onClose();
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'DRIVER_CONFLICT') {
        setMutation({ kind: 'conflict', message: 'اطلاعات تغییر کرده. لطفاً صفحه را بارگذاری کنید.' });
      } else {
        setMutation({ kind: 'failure', message: 'خطا در ذخیره. لطفاً دوباره تلاش کنید.' });
      }
    }
  }

  return (
    <div className="drv-dialog-backdrop" onClick={onClose} role="presentation">
      <div className="drv-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal aria-label="ویرایش مشخصات">
        <div className="drv-dialog-header">
          <div>
            <div className="drv-dialog-title">ویرایش مشخصات</div>
            <LtrIso><span className="drv-id-label">{driver.driverId}</span></LtrIso>
          </div>
          <button className="drv-icon-btn" onClick={onClose} aria-label="بستن">✕</button>
        </div>
        <div className="drv-dialog-body">
          <Field label="نام و نام خانوادگی">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="شماره تلفن">
            <LtrIso>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </LtrIso>
          </Field>
          {mutation.kind === 'failure' && (
            <InlineMessage tone="error">{mutation.message}</InlineMessage>
          )}
          {mutation.kind === 'conflict' && (
            <InlineMessage tone="warning">{mutation.message}</InlineMessage>
          )}
        </div>
        <div className="drv-dialog-footer">
          <Button variant="ghost" onClick={onClose}>انصراف</Button>
          <Button
            variant="primary"
            onClick={() => void handleSave()}
            disabled={mutation.kind === 'submitting'}
          >
            {mutation.kind === 'submitting' ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Deactivate warning dialog ────────────────────────────────────────────────

type DeactivateDialogProps = {
  driver: DriverRecord;
  hasAssignments: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onViewPlan: () => void;
};

function DeactivateDialog({ driver, hasAssignments, onClose, onConfirm, onViewPlan }: DeactivateDialogProps) {
  return (
    <div className="drv-dialog-backdrop" onClick={onClose} role="presentation">
      <div className="drv-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal aria-label="غیرفعال کردن راننده">
        <div className="drv-dialog-header">
          <div>
            <div className="drv-dialog-title">غیرفعال کردن راننده</div>
            <div className="drv-dialog-subtitle">{driver.name}</div>
          </div>
        </div>
        <div className="drv-dialog-body">
          {hasAssignments && (
            <InlineMessage tone="warning">
              این راننده هنوز در برنامه‌های فعال یا آینده تخصیص دارد.
            </InlineMessage>
          )}
          <p className="drv-dialog-text">
            غیرفعال کردن راننده تخصیص‌های موجود را به‌طور خودکار حذف نمی‌کند.
            لطفاً ابتدا تخصیص‌ها را در برنامه مربوط بررسی و ویرایش کنید.
          </p>
        </div>
        <div className="drv-dialog-footer drv-dialog-footer--spread">
          {hasAssignments && (
            <Button variant="ghost" onClick={onViewPlan}>مشاهده تخصیص‌ها</Button>
          )}
          <div className="drv-dialog-footer-actions">
            <Button variant="ghost" onClick={onClose}>انصراف</Button>
            <Button variant="destructive" onClick={onConfirm}>غیرفعال کردن</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App Access dialogs ───────────────────────────────────────────────────────

type AppAccessDialogType = 'create' | 'create-success' | 'reset' | 'block' | 'reactivate';

type AppAccessDialogProps = {
  type: AppAccessDialogType;
  driver: DriverRecord;
  onClose: () => void;
  onAction: (type: AppAccessDialogType, driver: DriverRecord) => Promise<void>;
};

function AppAccessDialog({ type, driver, onClose, onAction }: AppAccessDialogProps) {
  const [mutation, setMutation] = useState<DriverMutationState>({ kind: 'idle' });

  async function handleConfirm() {
    setMutation({ kind: 'submitting' });
    try {
      await onAction(type, driver);
      setMutation({ kind: 'success' });
    } catch {
      setMutation({ kind: 'failure', message: 'خطا در انجام عملیات. دوباره تلاش کنید.' });
    }
  }

  const titles: Record<AppAccessDialogType, string> = {
    'create': 'ایجاد دسترسی اپ',
    'create-success': 'دسترسی اپ ایجاد شد',
    'reset': 'بازنشانی دسترسی اپ',
    'block': 'مسدود کردن دسترسی اپ',
    'reactivate': 'فعال‌سازی مجدد دسترسی اپ',
  };

  return (
    <div className="drv-dialog-backdrop" onClick={onClose} role="presentation">
      <div className="drv-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal aria-label={titles[type]}>
        <div className="drv-dialog-header">
          <div>
            <div className="drv-dialog-title">{titles[type]}</div>
            <div className="drv-dialog-subtitle">{driver.name}</div>
          </div>
          <button className="drv-icon-btn" onClick={onClose} aria-label="بستن">✕</button>
        </div>
        <div className="drv-dialog-body">
          {type === 'create' && (
            <>
              <p className="drv-dialog-text">
                با تأیید این عملیات، یک حساب دسترسی برای این راننده در اپ ایجاد می‌شود.
              </p>
              <InlineMessage tone="info">
                روش فعال‌سازی توسط تیم فنی تعیین می‌شود. هیچ اطلاعات حساسی در این مرحله نمایش داده نمی‌شود.
              </InlineMessage>
            </>
          )}
          {type === 'create-success' && (
            <>
              <div className="drv-success-banner">
                دسترسی اپ با موفقیت ایجاد شد. فرآیند فعال‌سازی توسط سیستم انجام خواهد شد.
              </div>
              <p className="drv-dialog-text">
                راننده می‌تواند پس از فعال‌سازی وارد اپ شود.
              </p>
            </>
          )}
          {type === 'reset' && (
            <>
              <InlineMessage tone="warning">
                دسترسی فعلی راننده قطع و یک فرآیند فعال‌سازی جدید آغاز می‌شود.
              </InlineMessage>
              <p className="drv-dialog-text">
                پس از بازنشانی، راننده باید مجدداً وارد اپ شود. هیچ داده عملیاتی حذف نخواهد شد.
              </p>
            </>
          )}
          {type === 'block' && (
            <>
              <p className="drv-dialog-text">
                راننده دیگر نخواهد توانست وارد اپ شود. وضعیت عملیاتی راننده تغییری نمی‌کند.
              </p>
              <InlineMessage tone="info">
                مسدود کردن دسترسی اپ با «غیرفعال کردن راننده» متفاوت است.
              </InlineMessage>
            </>
          )}
          {type === 'reactivate' && (
            <p className="drv-dialog-text">
              دسترسی راننده به اپ مجدداً فعال می‌شود.
            </p>
          )}
          {mutation.kind === 'failure' && (
            <InlineMessage tone="error">{mutation.message}</InlineMessage>
          )}
        </div>
        <div className="drv-dialog-footer">
          {type === 'create-success' ? (
            <Button variant="primary" onClick={onClose}>تأیید</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose}>انصراف</Button>
              <Button
                variant={type === 'block' ? 'destructive' : 'primary'}
                onClick={() => void handleConfirm()}
                disabled={mutation.kind === 'submitting'}
              >
                {mutation.kind === 'submitting' ? 'در حال انجام…' : (
                  type === 'create' ? 'ایجاد دسترسی' :
                  type === 'reset' ? 'بازنشانی دسترسی' :
                  type === 'block' ? 'مسدود کردن' :
                  'فعال‌سازی مجدد'
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── App Access section (drawer) ──────────────────────────────────────────────

type AppAccessSectionProps = {
  driver: DriverRecord;
  onAction: (type: AppAccessDialogType, driver: DriverRecord) => void;
};

function AppAccessSection({ driver, onAction }: AppAccessSectionProps) {
  const { appAccessStatus } = driver;
  return (
    <div className="drv-section">
      <div className="drv-section-header-row">
        <div className="drv-section-label">دسترسی اپ راننده</div>
        <AppAccessBadge status={appAccessStatus} />
      </div>
      {appAccessStatus === 'none' && (
        <Button variant="secondary" size="sm" onClick={() => onAction('create', driver)}>
          ایجاد دسترسی اپ
        </Button>
      )}
      {appAccessStatus === 'active' && (
        <div className="drv-action-row">
          <Button variant="secondary" size="sm" onClick={() => onAction('reset', driver)}>
            بازنشانی دسترسی
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onAction('block', driver)}>
            مسدود کردن
          </Button>
        </div>
      )}
      {appAccessStatus === 'blocked' && (
        <Button variant="secondary" size="sm" onClick={() => onAction('reactivate', driver)}>
          فعال‌سازی مجدد
        </Button>
      )}
    </div>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

type DetailDrawerProps = {
  driver: DriverRecord;
  onClose: () => void;
  onAppAccessAction: (type: AppAccessDialogType, driver: DriverRecord) => void;
};

function DetailDrawer({ driver, onClose, onAppAccessAction }: DetailDrawerProps) {
  const plansPort = usePlansDataPort();
  const [assignments, setAssignments] = useState<DriverTodayAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const driversPort = useDriversPort();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      setAssignmentsLoading(true);
      const result = await driversPort.getTodayAssignments(driver.driverId, getTodaySortKey(), plansPort);
      if (!cancelled) {
        setAssignments(result);
        setAssignmentsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [driver.driverId, driversPort, plansPort]);

  return (
    <>
      <div className="drv-drawer-backdrop" onClick={onClose} role="presentation" />
      <div className="drv-drawer" role="complementary" aria-label={`جزئیات ${driver.name}`}>
        <div className="drv-drawer-header">
          <div className="drv-drawer-header-info">
            <div className="drv-drawer-name">{driver.name}</div>
            <div className="drv-drawer-meta">
              <LtrIso><span className="drv-id-label">{driver.driverId}</span></LtrIso>
              <span className="drv-meta-sep">·</span>
              <span className={driver.operationalStatus === 'active' ? 'drv-status-active' : 'drv-status-inactive'}>
                {driver.operationalStatus === 'active' ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
          </div>
          <button className="drv-icon-btn" onClick={onClose} aria-label="بستن کشو">✕</button>
        </div>
        <div className="drv-drawer-body">
          <div className="drv-section">
            <div className="drv-section-label">مشخصات</div>
            <div className="drv-kv-row">
              <span className="drv-kv-key">نام</span>
              <span className="drv-kv-val">{driver.name}</span>
            </div>
            <div className="drv-kv-row">
              <span className="drv-kv-key">شماره تلفن</span>
              <LtrIso><span className="drv-kv-val">{driver.phone}</span></LtrIso>
            </div>
            <div className="drv-kv-row">
              <span className="drv-kv-key">شناسه</span>
              <LtrIso><span className="drv-kv-val drv-id-label">{driver.driverId}</span></LtrIso>
            </div>
            <div className="drv-kv-row">
              <span className="drv-kv-key">وضعیت عملیاتی</span>
              <span className={`drv-kv-val ${driver.operationalStatus === 'active' ? 'drv-status-active' : 'drv-status-inactive'}`}>
                {driver.operationalStatus === 'active' ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
          </div>

          <div className="drv-divider" />
          <AppAccessSection driver={driver} onAction={onAppAccessAction} />

          <div className="drv-divider" />
          <div className="drv-section">
            <div className="drv-section-label">تخصیص‌های امروز</div>
            {assignmentsLoading && (
              <div className="drv-muted-text">در حال بارگذاری…</div>
            )}
            {!assignmentsLoading && assignments.length === 0 && (
              <div className="drv-muted-text">بدون تخصیص برای امروز</div>
            )}
            {!assignmentsLoading && assignments.length > 0 && (
              <div className="drv-assignments-list">
                {assignments.map((a, i) => (
                  <div key={i} className="drv-assignment-card">
                    <div className="drv-assignment-card-top">
                      <span className="drv-chip-window">{a.deliveryWindow}</span>
                      <span className="drv-chip-sep">·</span>
                      <span>{a.areaLabel}</span>
                    </div>
                    <div className="drv-assignment-card-plan">{a.planName}</div>
                    <button
                      className="drv-view-plan-btn"
                      onClick={() => {
                        const path = a.isPublished
                          ? `/plans/${a.planId}/execution`
                          : `/plans/${a.planId}/planning`;
                        navigate(path);
                        onClose();
                      }}
                    >
                      مشاهده برنامه ›
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Row context menu ─────────────────────────────────────────────────────────

type RowMenuProps = {
  driver: DriverRecord;
  onEdit: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onAppAccess: (type: AppAccessDialogType) => void;
};

function RowMenu({ driver, onEdit, onActivate, onDeactivate, onAppAccess }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="drv-menu-wrap" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        className={`drv-menu-trigger ${open ? 'drv-menu-trigger--open' : ''}`}
        aria-label="منوی راننده"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>
      {open && (
        <>
          <div className="drv-menu-backdrop" onClick={() => setOpen(false)} role="presentation" />
          <div className="drv-menu" role="menu">
            <button role="menuitem" className="drv-menu-item" onClick={() => { setOpen(false); onEdit(); }}>
              ویرایش مشخصات
            </button>
            <div className="drv-menu-sep" />
            {driver.operationalStatus === 'active' ? (
              <button role="menuitem" className="drv-menu-item drv-menu-item--danger" onClick={() => { setOpen(false); onDeactivate(); }}>
                غیرفعال کردن راننده
              </button>
            ) : (
              <button role="menuitem" className="drv-menu-item" onClick={() => { setOpen(false); onActivate(); }}>
                فعال کردن راننده
              </button>
            )}
            <div className="drv-menu-sep" />
            {driver.appAccessStatus === 'none' && (
              <button role="menuitem" className="drv-menu-item" onClick={() => { setOpen(false); onAppAccess('create'); }}>
                ایجاد دسترسی اپ
              </button>
            )}
            {driver.appAccessStatus === 'active' && (<>
              <button role="menuitem" className="drv-menu-item" onClick={() => { setOpen(false); onAppAccess('reset'); }}>
                بازنشانی دسترسی اپ
              </button>
              <button role="menuitem" className="drv-menu-item drv-menu-item--danger" onClick={() => { setOpen(false); onAppAccess('block'); }}>
                مسدود کردن دسترسی اپ
              </button>
            </>)}
            {driver.appAccessStatus === 'blocked' && (
              <button role="menuitem" className="drv-menu-item" onClick={() => { setOpen(false); onAppAccess('reactivate'); }}>
                فعال‌سازی مجدد دسترسی
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function DriversPageInner() {
  const port = useDriversPort();
  const plansPort = usePlansDataPort();
  useDriversVersion(); // re-render on changes

  const allDrivers = port.listDrivers();

  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [query, setQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<DriverRecord | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverRecord | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<DriverRecord | null>(null);
  const [deactivateHasAssignments, setDeactivateHasAssignments] = useState(false);
  const [appAccessModal, setAppAccessModal] = useState<{ type: AppAccessDialogType; driver: DriverRecord } | null>(null);
  const [driverTableAssignments, setDriverTableAssignments] = useState<Record<string, DriverTodayAssignment[]>>({});

  // Load today's assignments for table display
  const todaySortKey = getTodaySortKey();
  useEffect(() => {
    const loaded: Record<string, DriverTodayAssignment[]> = {};
    let cancelled = false;
    async function load() {
      for (const driver of allDrivers) {
        const result = await port.getTodayAssignments(driver.driverId, todaySortKey, plansPort);
        if (cancelled) return;
        loaded[driver.driverId] = result;
      }
      if (!cancelled) setDriverTableAssignments({ ...loaded });
    }
    void load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [port, plansPort, todaySortKey, allDrivers.length]);

  const filtered = allDrivers.filter((d) => {
    if (filterTab === 'active' && d.operationalStatus !== 'active') return false;
    if (filterTab === 'inactive' && d.operationalStatus !== 'inactive') return false;
    const q = query.trim();
    if (!q) return true;
    return (
      d.name.includes(q) ||
      d.phone.includes(q) ||
      d.driverId.toLowerCase().includes(q.toLowerCase())
    );
  });

  const activeCount = allDrivers.filter((d) => d.operationalStatus === 'active').length;
  const inactiveCount = allDrivers.length - activeCount;

  const handleDeactivate = useCallback(async (driver: DriverRecord) => {
    const hasAssignments = await port.hasFutureAssignments(driver.driverId, todaySortKey, plansPort);
    setDeactivateHasAssignments(hasAssignments);
    setDeactivateTarget(driver);
  }, [port, plansPort, todaySortKey]);

  const handleAppAccessAction = useCallback(async (type: AppAccessDialogType, driver: DriverRecord) => {
    if (type === 'create') {
      await port.setAppAccess(driver.driverId, 'active');
      // Show success dialog
      const updated = port.getDriver(driver.driverId) ?? { ...driver, appAccessStatus: 'active' as const, version: driver.version + 1 };
      setAppAccessModal({ type: 'create-success', driver: updated });
    } else if (type === 'reset') {
      await port.setAppAccess(driver.driverId, 'active');
    } else if (type === 'block') {
      await port.setAppAccess(driver.driverId, 'blocked');
    } else if (type === 'reactivate') {
      await port.setAppAccess(driver.driverId, 'active');
    }
  }, [port]);


  return (
    <div className="drv-page">
      {/* Main scroll area */}
      <div className="drv-main">
        {/* Header */}
        <div className="drv-page-header">
          <div className="drv-page-header-text">
            <h1 className="drv-page-title">رانندگان</h1>
            <div className="drv-page-subtitle">
              {toPersian(activeCount)} راننده فعال · {toPersian(inactiveCount)} غیرفعال
            </div>
          </div>
          <Button variant="primary" onClick={() => setShowAddDialog(true)}>
            افزودن راننده
          </Button>
        </div>

        {/* Table card */}
        <div className="drv-table-card">
          {/* Toolbar */}
          <div className="drv-toolbar">
            <div className="drv-search-wrap">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی نام، شماره تلفن یا شناسه"
                aria-label="جستجو در رانندگان"
              />
            </div>
            <div className="drv-seg-control" role="group" aria-label="فیلتر وضعیت">
              {(['all', 'active', 'inactive'] as const).map((k) => (
                <button
                  key={k}
                  className={`drv-seg-opt ${filterTab === k ? 'drv-seg-opt--active' : ''}`}
                  aria-pressed={filterTab === k}
                  onClick={() => setFilterTab(k)}
                >
                  {k === 'all' ? 'همه' : k === 'active' ? 'فعال' : 'غیرفعال'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <table className="drv-table" role="table">
            <thead>
              <tr>
                <th>راننده</th>
                <th>شماره تلفن</th>
                <th>وضعیت</th>
                <th>دسترسی اپ</th>
                <th>تخصیص امروز</th>
                <th aria-label="عملیات" style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="drv-empty-cell">
                    {query.trim() ? 'راننده‌ای با این مشخصات یافت نشد' : 'راننده‌ای در این بخش وجود ندارد'}
                  </td>
                </tr>
              )}
              {filtered.map((driver) => {
                const isSelected = selectedDriver?.driverId === driver.driverId;
                const todayAssignments = driverTableAssignments[driver.driverId] ?? [];
                const shown = todayAssignments.slice(0, 2);
                const extra = todayAssignments.length - shown.length;
                return (
                  <tr
                    key={driver.driverId}
                    className={`drv-row ${isSelected ? 'drv-row--selected' : ''}`}
                    onClick={() => setSelectedDriver((prev) => (prev?.driverId === driver.driverId ? null : driver))}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedDriver((prev) => (prev?.driverId === driver.driverId ? null : driver));
                      }
                    }}
                    aria-selected={isSelected}
                  >
                    <td>
                      <div className="drv-driver-name">{driver.name}</div>
                      <LtrIso><div className="drv-driver-id">{driver.driverId}</div></LtrIso>
                    </td>
                    <td><LtrIso>{driver.phone}</LtrIso></td>
                    <td><DriverStatusBadge active={driver.operationalStatus === 'active'} /></td>
                    <td><AppAccessBadge status={driver.appAccessStatus} /></td>
                    <td>
                      {shown.length === 0 ? (
                        <span className="drv-no-assignment">بدون تخصیص</span>
                      ) : (
                        <div className="drv-chips-row">
                          {shown.map((a, i) => <AssignmentChip key={i} assignment={a} />)}
                          {extra > 0 && (
                            <span className="drv-chip-extra">+{toPersian(extra)} مورد</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <RowMenu
                        driver={driver}
                        onEdit={() => setEditingDriver(port.getDriver(driver.driverId) ?? driver)}
                        onActivate={() => void port.activateDriver(driver.driverId)}
                        onDeactivate={() => void handleDeactivate(driver)}
                        onAppAccess={(type) => setAppAccessModal({ type, driver: port.getDriver(driver.driverId) ?? driver })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer */}
          <div className="drv-table-footer">
            <span className="drv-count-label">{toPersian(filtered.length)} راننده</span>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selectedDriver && (
        <DetailDrawer
          driver={port.getDriver(selectedDriver.driverId) ?? selectedDriver}
          onClose={() => setSelectedDriver(null)}
          onAppAccessAction={(type, driver) => setAppAccessModal({ type, driver })}
        />
      )}

      {/* Dialogs */}
      {showAddDialog && (
        <AddDriverDialog
          onClose={() => setShowAddDialog(false)}
          onAdded={() => setShowAddDialog(false)}
        />
      )}
      {editingDriver && (
        <EditDriverDialog
          driver={editingDriver}
          onClose={() => setEditingDriver(null)}
        />
      )}
      {deactivateTarget && (
        <DeactivateDialog
          driver={deactivateTarget}
          hasAssignments={deactivateHasAssignments}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={() => {
            void port.deactivateDriver(deactivateTarget.driverId);
            if (selectedDriver?.driverId === deactivateTarget.driverId) {
              setSelectedDriver(null);
            }
            setDeactivateTarget(null);
          }}
          onViewPlan={() => setDeactivateTarget(null)}
        />
      )}
      {appAccessModal && (
        <AppAccessDialog
          type={appAccessModal.type}
          driver={appAccessModal.driver}
          onClose={() => setAppAccessModal(null)}
          onAction={handleAppAccessAction}
        />
      )}
    </div>
  );
}

export function DriversPage() {
  return <DriversPageInner />;
}
