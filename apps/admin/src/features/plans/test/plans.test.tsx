import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { A01_DEMO_PLANS } from '@/features/plans/fixture/demo-plans';
import { normalizePlanViewModel } from '@/features/plans/normalize-plan';
import { createTestPort, renderApp } from '@/features/plans/test/render';

function excelFile(name: string) {
  return new File(['abc'], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

async function selectExcel(user: ReturnType<typeof userEvent.setup>, name: string) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, excelFile(name));
}

describe('Plans list', () => {
  it('renders populated list with Preparing / All views only', async () => {
    renderApp('/plans');
    expect(await screen.findByRole('heading', { name: 'برنامه‌ها' })).toBeInTheDocument();
    expect(await screen.findByText('برنامه تحویل — ۱ شهریور — ۱۲ تا ۱۵')).toBeInTheDocument();
    expect(screen.getByText('P-2407')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /در حال آماده‌سازی/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /همه برنامه‌ها/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'اجرا' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ورود داده' })).not.toBeInTheDocument();
    expect(screen.queryByText('مرحله جاری')).not.toBeInTheDocument();
  });

  it('shows empty state', async () => {
    const port = createTestPort([]);
    renderApp('/plans', port);
    expect(await screen.findByText('هنوز برنامه‌ای وجود ندارد')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /برنامه جدید/ }).length).toBeGreaterThan(0);
  });

  it('shows all-ready when Preparing has no items', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-READY',
        name: 'برنامه آماده',
        deliveryDate: '۱۴۰۳/۰۶/۰۱',
        lifecycle: 'published',
        isPreparing: false,
        needsAttention: null,
        suggestedSection: 'execution',
      },
    ]);
    renderApp('/plans', port);
    expect(await screen.findByText('همه برنامه‌ها آماده‌اند')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'مشاهده همه برنامه‌ها' }));
    expect(await screen.findByText('P-READY')).toBeInTheDocument();
  });

  it('filters by search and shows filtered empty', async () => {
    const user = userEvent.setup();
    renderApp('/plans');
    await screen.findByText('P-2407');

    await user.type(screen.getByLabelText('جستجوی برنامه‌ها'), 'ناموجود-xyz');
    expect(await screen.findByText('برنامه‌ای با این جستجو پیدا نشد')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'پاک کردن جستجو' }));
    expect(await screen.findByText('P-2407')).toBeInTheDocument();
  });

  it('searches plan name and id across the full dataset, not only the current page', async () => {
    const user = userEvent.setup();
    const seed = Array.from({ length: 18 }, (_, index) =>
      normalizePlanViewModel({
        id: `P-PG-${String(index + 1).padStart(2, '0')}`,
        name: index === 17 ? 'برنامه کمیاب صفحه دوم' : `برنامه صفحه‌بندی ${index + 1}`,
        deliveryDate: index < 10 ? '۱۴۰۳/۰۶/۰۱' : '۱۴۰۳/۰۵/۰۱',
        isPreparing: false,
        needsAttention: null,
        lifecycle: 'published',
        suggestedSection: 'execution',
      }),
    );
    const port = createTestPort(seed);
    renderApp('/plans', port);
    await screen.findByText('همه برنامه‌ها آماده‌اند');
    await user.click(screen.getByRole('tab', { name: /همه برنامه‌ها/ }));
    expect(await screen.findByText('P-PG-01')).toBeInTheDocument();
    expect(screen.queryByText('P-PG-18')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('جستجوی برنامه‌ها'), 'P-PG-18');
    expect(await screen.findByText('P-PG-18')).toBeInTheDocument();
    expect(screen.queryByText('P-PG-01')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('جستجوی برنامه‌ها'));
    await user.type(screen.getByLabelText('جستجوی برنامه‌ها'), 'کمیاب');
    expect(await screen.findByText('P-PG-18')).toBeInTheDocument();
  });

  it('resets pagination when view or search changes', async () => {
    const user = userEvent.setup();
    const seed = Array.from({ length: 18 }, (_, index) =>
      normalizePlanViewModel({
        id: `P-PG-${String(index + 1).padStart(2, '0')}`,
        name: `برنامه صفحه‌بندی ${index + 1}`,
        deliveryDate: index < 10 ? '۱۴۰۳/۰۶/۰۱' : '۱۴۰۳/۰۵/۰۱',
        isPreparing: false,
        needsAttention: null,
        lifecycle: 'published',
      }),
    );
    const port = createTestPort(seed);
    renderApp('/plans', port);
    await user.click(await screen.findByRole('tab', { name: /همه برنامه‌ها/ }));
    expect(await screen.findByLabelText('صفحه‌بندی برنامه‌ها')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'صفحه بعد' }));
    expect(await screen.findByText('P-PG-18')).toBeInTheDocument();

    await user.type(screen.getByLabelText('جستجوی برنامه‌ها'), 'P-PG-01');
    expect(await screen.findByText('P-PG-01')).toBeInTheDocument();
    expect(screen.queryByText('P-PG-18')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('صفحه‌بندی برنامه‌ها')).not.toBeInTheDocument();
  });

  it('renders date grouping, lifecycle, and needs attention independently of suggestedSection', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-NAV',
        name: 'برنامه ناوبری',
        deliveryDate: '۱۴۰۳/۰۶/۰۱',
        window: '۹ تا ۱۲',
        lifecycle: 'published',
        needsAttention: 'بدون دیتاست',
        isPreparing: true,
        suggestedSection: 'intake',
        currentStage: 'execution',
        hasWorkingVersion: true,
      },
    ]);
    renderApp('/plans', port);
    expect(await screen.findByText('امروز')).toBeInTheDocument();
    expect(screen.getByText(/۱ شهریور/)).toBeInTheDocument();
    expect(screen.getByText('منتشرشده')).toBeInTheDocument();
    expect(screen.getByText('بدون دیتاست')).toBeInTheDocument();
    expect(screen.getByText('نسخه کاری')).toBeInTheDocument();
    expect(screen.queryByText('مرحله جاری')).not.toBeInTheDocument();

    await user.click(screen.getByText('برنامه ناوبری'));
    expect(await screen.findByRole('heading', { name: 'داده‌های برنامه' })).toBeInTheDocument();
  });

  it('navigates a row by suggestedSection, not currentStage', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-EXEC',
        name: 'برنامه اجرا',
        deliveryDate: '۱۴۰۳/۰۶/۰۱',
        lifecycle: 'inProgress',
        isPreparing: false,
        needsAttention: null,
        suggestedSection: 'execution',
        currentStage: 'intake',
        a01Mode: 'execution-locked',
        importedFile: {
          name: 'ops.xlsx',
          uploadedAt: 'دیروز',
          rowCount: 10,
          parseOutcome: 'clean',
        },
      },
    ]);
    const { router } = renderApp('/plans', port);
    await user.click(await screen.findByRole('tab', { name: /همه برنامه‌ها/ }));
    await user.click(await screen.findByText('برنامه اجرا'));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/plans/P-EXEC/execution');
    });
  });

  it('shows loading state', async () => {
    const port = createTestPort(A01_DEMO_PLANS);
    port.setListMode('loading');
    renderApp('/plans', port);
    expect(await screen.findByLabelText('در حال بارگذاری')).toBeInTheDocument();
  });

  it('shows load error and retries', async () => {
    const user = userEvent.setup();
    const port = createTestPort(A01_DEMO_PLANS);
    port.setListMode('error');
    renderApp('/plans', port);

    expect(await screen.findByText('بارگذاری لیست برنامه‌ها ناموفق بود')).toBeInTheDocument();
    port.setListMode('ok');
    await user.click(screen.getByRole('button', { name: /تلاش مجدد/ }));
    expect(await screen.findByText('P-2407')).toBeInTheDocument();
  });

  it('edits plan metadata from the row menu', async () => {
    const user = userEvent.setup();
    renderApp('/plans');
    await screen.findByText('P-2407');
    await user.click(screen.getByLabelText('عملیات برنامه تحویل — ۱ شهریور — ۱۲ تا ۱۵'));
    await user.click(screen.getByRole('menuitem', { name: 'ویرایش مشخصات برنامه' }));
    const name = await screen.findByLabelText('نام برنامه');
    await user.clear(name);
    await user.type(name, 'نام ویرایش‌شده');
    await user.click(screen.getByRole('button', { name: 'ذخیره' }));
    expect(await screen.findByText('نام ویرایش‌شده')).toBeInTheDocument();
  });
});

describe('Create Plan', () => {
  it('validates required delivery date', async () => {
    const user = userEvent.setup();
    renderApp('/plans');
    await screen.findByText('P-2407');

    await user.click(screen.getByRole('button', { name: /^برنامه جدید$/ }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ایجاد برنامه' }));
    expect(await screen.findByText('تاریخ تحویل الزامی است')).toBeInTheDocument();
  });

  it('suggests editable name from date and window', async () => {
    const user = userEvent.setup();
    renderApp('/plans');
    await screen.findByText('P-2407');
    await user.click(screen.getByRole('button', { name: /^برنامه جدید$/ }));

    const date = await screen.findByLabelText(/تاریخ تحویل/);
    await user.clear(date);
    await user.type(date, '۱۴۰۳/۰۶/۱۰');
    await user.click(screen.getByRole('button', { name: '۹ تا ۱۲' }));

    const name = screen.getByLabelText('نام برنامه') as HTMLInputElement;
    await waitFor(() => {
      expect(name.value).toContain('شهریور');
      expect(name.value).toContain('۹ تا ۱۲');
    });

    await user.clear(name);
    await user.type(name, 'نام سفارشی من');
    expect(name.value).toBe('نام سفارشی من');
  });

  it('submits and navigates to intake', async () => {
    const user = userEvent.setup();
    const port = createTestPort([]);
    const { router } = renderApp('/plans', port);

    await screen.findByText('هنوز برنامه‌ای وجود ندارد');
    await user.click(screen.getAllByRole('button', { name: /برنامه جدید/ })[0]!);

    await user.type(screen.getByLabelText(/تاریخ تحویل/), '۱۴۰۳/۰۶/۱۰');
    await user.click(screen.getByRole('button', { name: 'ایجاد برنامه' }));

    expect(await screen.findByRole('heading', { name: 'داده‌های برنامه' })).toBeInTheDocument();
    expect(screen.getByText(/فایل اکسل داده‌های تحویل/)).toBeInTheDocument();
    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/\/plans\/P-\d+\/intake/);
    });
  });

  it('preserves values on create failure', async () => {
    const user = userEvent.setup();
    const port = createTestPort([]);
    port.setNextCreateFailure(true);
    renderApp('/plans', port);

    await screen.findByText('هنوز برنامه‌ای وجود ندارد');
    const createButtons = screen.getAllByRole('button', { name: /برنامه جدید/ });
    await user.click(createButtons[0]!);

    const date = await screen.findByLabelText(/تاریخ تحویل/);
    await user.type(date, '۱۴۰۳/۰۶/۱۱');
    const name = screen.getByLabelText('نام برنامه') as HTMLInputElement;
    await user.clear(name);
    await user.type(name, 'برنامه تست خطا');

    await user.click(screen.getByRole('button', { name: 'ایجاد برنامه' }));
    expect(await screen.findByText(/ایجاد برنامه با خطا مواجه شد/)).toBeInTheDocument();

    expect((screen.getByLabelText(/تاریخ تحویل/) as HTMLInputElement).value).toBe('۱۴۰۳/۰۶/۱۱');
    expect((screen.getByLabelText('نام برنامه') as HTMLInputElement).value).toBe('برنامه تست خطا');
  });
});

describe('Intake', () => {
  it('supports file selection and selected state', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-TEST',
        name: 'برنامه تست',
        deliveryDate: '۱۴۰۳/۰۶/۰۱',
        currentStage: 'intake',
        status: 'draft',
        lastChanged: 'الان',
      },
    ]);
    renderApp('/plans/P-TEST/intake', port);

    expect(await screen.findByRole('heading', { name: 'داده‌های برنامه' })).toBeInTheDocument();
    await selectExcel(user, 'orders.xlsx');

    expect(await screen.findByText('orders.xlsx')).toBeInTheDocument();
    expect(screen.getByText(/XLSX/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /بارگذاری و بررسی/ })).toBeInTheDocument();
  });

  it('shows upload failure for fail-upload fixture file', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-TEST',
        name: 'برنامه تست',
        deliveryDate: '۱۴۰۳/۰۶/۰۱',
        currentStage: 'intake',
        status: 'draft',
        lastChanged: 'الان',
      },
    ]);
    renderApp('/plans/P-TEST/intake', port);
    await screen.findByRole('heading', { name: 'داده‌های برنامه' });
    await selectExcel(user, 'fail-upload.xlsx');
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));

    expect(await screen.findByText('بارگذاری فایل ناموفق بود')).toBeInTheDocument();
  });

  it('shows structural failure for missing columns fixture file', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-TEST',
        name: 'برنامه تست',
        deliveryDate: '۱۴۰۳/۰۶/۰۱',
        currentStage: 'intake',
        status: 'draft',
        lastChanged: 'الان',
      },
    ]);
    renderApp('/plans/P-TEST/intake', port);
    await screen.findByRole('heading', { name: 'داده‌های برنامه' });
    await selectExcel(user, 'missing-col.xlsx');
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));
    expect(await screen.findByText('ستون‌های ضروری شناسایی نشدند')).toBeInTheDocument();
  });

  it('reaches parsed needs review and opens the plan review route', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-TEST',
        name: 'برنامه تست',
        deliveryDate: '۱۴۰۳/۰۶/۰۱',
        currentStage: 'intake',
        status: 'draft',
        lastChanged: 'الان',
      },
    ]);
    const { router } = renderApp('/plans/P-TEST/intake', port);
    await screen.findByRole('heading', { name: 'داده‌های برنامه' });
    await selectExcel(user, 'orders_review.xlsx');
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));

    expect(await screen.findByText(/برخی موارد نیاز به بررسی دارند/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^بررسی داده$/ }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/plans/P-TEST/review');
    });
  });

  it('reaches parsed clean for clean fixture filename', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-TEST',
        name: 'برنامه تست',
        deliveryDate: '۱۴۰۳/۰۶/۰۱',
        currentStage: 'intake',
        status: 'draft',
        lastChanged: 'الان',
      },
    ]);
    renderApp('/plans/P-TEST/intake', port);
    await screen.findByRole('heading', { name: 'داده‌های برنامه' });
    await selectExcel(user, 'orders_clean.xlsx');
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));

    expect(await screen.findByText('فایل با موفقیت خوانده شد')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^بررسی داده$/ })).toBeInTheDocument();
  });

  it('does not reject the same filename as a duplicate import', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-HAS',
        name: 'برنامه با فایل',
        deliveryDate: '۱۴۰۳/۰۵/۲۱',
        currentStage: 'intake',
        status: 'ready',
        lastChanged: 'دیروز',
        importedFile: {
          name: 'previous.xlsx',
          uploadedAt: 'دیروز',
          rowCount: 100,
          parseOutcome: 'clean',
        },
      },
    ]);
    renderApp('/plans/P-HAS/intake', port);
    expect(await screen.findByText('previous.xlsx')).toBeInTheDocument();
    expect(screen.getByText('دیتاست فعال')).toBeInTheDocument();
    await selectExcel(user, 'previous.xlsx');
    expect(await screen.findByRole('button', { name: /بارگذاری و بررسی/ })).toBeInTheDocument();
    expect(screen.queryByText(/قبلاً برای این برنامه بارگذاری شده/)).not.toBeInTheDocument();
  });

  it('shows dataset update diff and apply strategies', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-HAS',
        name: 'برنامه با فایل',
        deliveryDate: '۱۴۰۳/۰۵/۲۱',
        itemCount: 100,
        currentStage: 'intake',
        status: 'ready',
        lastChanged: 'دیروز',
        importedFile: {
          name: 'previous.xlsx',
          uploadedAt: 'دیروز',
          rowCount: 100,
          parseOutcome: 'clean',
        },
      },
    ]);
    renderApp('/plans/P-HAS/intake', port);
    await screen.findByText('previous.xlsx');
    await selectExcel(user, 'orders_v2.xlsx');
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));

    expect(await screen.findByText('سفارش جدید')).toBeInTheDocument();
    expect(screen.getByText('تغییرکرده')).toBeInTheDocument();
    expect(screen.getByText('بدون تغییر')).toBeInTheDocument();
    expect(screen.getByText('در فایل جدید نیستند')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'افزودن سفارش‌های جدید' }));
    await user.click(screen.getByRole('button', { name: 'اعمال تغییرات' }));
    expect(await screen.findByText('تغییرات با موفقیت اعمال شدند')).toBeInTheDocument();
    expect(screen.queryByText(/پاک می‌کند/)).not.toBeInTheDocument();
    expect(screen.queryByText(/A02/)).not.toBeInTheDocument();
  });

  it('requires confirmation for full replace and does not claim history is erased', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-HAS',
        name: 'برنامه با فایل',
        deliveryDate: '۱۴۰۳/۰۵/۲۱',
        itemCount: 100,
        importedFile: {
          name: 'previous.xlsx',
          uploadedAt: 'دیروز',
          rowCount: 100,
          parseOutcome: 'clean',
        },
      },
    ]);
    renderApp('/plans/P-HAS/intake', port);
    await screen.findByText('previous.xlsx');
    await selectExcel(user, 'orders_v2.xlsx');
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));
    await user.click(await screen.findByRole('radio', { name: 'جایگزینی کامل با فایل جدید' }));
    await user.click(screen.getByRole('button', { name: 'اعمال تغییرات' }));

    expect(await screen.findByText('تأیید جایگزینی کامل')).toBeInTheDocument();
    expect(screen.getByText(/تصمیمات بررسی و سوابق حفظ می‌شوند/)).toBeInTheDocument();
    expect(screen.queryByText(/پاک می‌کند/)).not.toBeInTheDocument();
    expect(screen.queryByText(/از صفر/)).not.toBeInTheDocument();
  });

  it('preserves the current dataset when apply fails', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-HAS',
        name: 'برنامه با فایل',
        deliveryDate: '۱۴۰۳/۰۵/۲۱',
        itemCount: 100,
        importedFile: {
          name: 'previous.xlsx',
          uploadedAt: 'دیروز',
          rowCount: 100,
          parseOutcome: 'clean',
        },
      },
    ]);
    port.setNextApplyFailure(true);
    renderApp('/plans/P-HAS/intake', port);
    await screen.findByText('previous.xlsx');
    await selectExcel(user, 'orders_v2.xlsx');
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));
    await user.click(await screen.findByRole('button', { name: 'اعمال تغییرات' }));

    expect(await screen.findByText('اعمال تغییرات ناموفق بود')).toBeInTheDocument();
    const after = await port.getPlan('P-HAS');
    expect(after?.itemCount).toBe(100);
    expect(after?.importedFile?.name).toBe('previous.xlsx');
    expect(screen.getByRole('button', { name: 'تلاش مجدد' })).toBeInTheDocument();
  });

  it('shows stale banner from fixture port and query flag', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-STALE',
        name: 'برنامه stale',
        deliveryDate: '۱۴۰۳/۰۶/۰۱',
        currentStage: 'intake',
        status: 'draft',
        lastChanged: 'الان',
      },
    ]);
    port.markStale('P-STALE');
    renderApp('/plans/P-STALE/intake?stale=1', port);

    expect(
      await screen.findByText(/این برنامه توسط کاربر دیگری تغییر کرده است/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /تازه‌سازی/ }));
    await waitFor(() => {
      expect(
        screen.queryByText(/این برنامه توسط کاربر دیگری تغییر کرده است/),
      ).not.toBeInTheDocument();
    });
  });

  it('keeps published snapshot intact when creating a working version', async () => {
    const user = userEvent.setup();
    const port = createTestPort([
      {
        id: 'P-PUB',
        name: 'برنامه منتشر',
        deliveryDate: '۱۴۰۳/۰۶/۰۱',
        itemCount: 100,
        lifecycle: 'published',
        a01Mode: 'published-readonly',
        canMutateDataset: false,
        importedFile: {
          name: 'published.xlsx',
          uploadedAt: 'دیروز',
          rowCount: 100,
          parseOutcome: 'clean',
        },
        publishedSnapshot: {
          itemCount: 100,
          importBatches: [
            {
              id: 'IB-PUB',
              filename: 'published.xlsx',
              uploadedAt: 'دیروز',
              rowCount: 100,
              result: 'clean',
            },
          ],
        },
      },
    ]);
    renderApp('/plans/P-PUB/intake', port);
    expect(await screen.findByText('داده‌ها منتشر شده‌اند — برای ویرایش نسخه کاری ایجاد کنید.')).toBeInTheDocument();
    expect(screen.queryByLabelText('انتخاب فایل اکسل')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ایجاد نسخه کاری/ }));
    expect(await screen.findByText('در حال ویرایش نسخه کاری')).toBeInTheDocument();
    expect(await screen.findByLabelText('انتخاب فایل اکسل')).toBeInTheDocument();

    await selectExcel(user, 'working.xlsx');
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));
    await user.click(await screen.findByRole('button', { name: 'اعمال تغییرات' }));
    expect(await screen.findByText('تغییرات با موفقیت اعمال شدند')).toBeInTheDocument();

    const after = await port.getPlan('P-PUB');
    expect(after?.publishedSnapshot?.itemCount).toBe(100);
    expect(after?.publishedSnapshot?.importBatches).toHaveLength(1);
    expect(after?.itemCount).not.toBe(100);
    expect(after?.importBatches.length).toBeGreaterThan(1);
  });

  it('locks excel mutation during execution and remains read-only when completed', async () => {
    const execPort = createTestPort([
      {
        id: 'P-RUN',
        name: 'برنامه در اجرا',
        deliveryDate: '۱۴۰۳/۰۶/۰۱',
        lifecycle: 'inProgress',
        a01Mode: 'execution-locked',
        canMutateDataset: false,
        importedFile: {
          name: 'live.xlsx',
          uploadedAt: 'دیروز',
          rowCount: 40,
          parseOutcome: 'clean',
        },
      },
    ]);
    renderApp('/plans/P-RUN/intake', execPort);
    expect(await screen.findByText(/بارگذاری دسته‌ای اکسل در حین اجرا/)).toBeInTheDocument();
    expect(screen.queryByLabelText('انتخاب فایل اکسل')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'داده‌های برنامه' })).toBeInTheDocument();
  });

  it('keeps completed plans historically readable', async () => {
    const port = createTestPort([
      {
        id: 'P-DONE',
        name: 'برنامه تکمیل',
        deliveryDate: '۱۴۰۳/۰۴/۳۱',
        lifecycle: 'completed',
        a01Mode: 'completed-readonly',
        canMutateDataset: false,
        importedFile: {
          name: 'history.xlsx',
          uploadedAt: 'هفته پیش',
          rowCount: 80,
          parseOutcome: 'clean',
        },
      },
    ]);
    renderApp('/plans/P-DONE/intake', port);
    expect(await screen.findByText('history.xlsx')).toBeInTheDocument();
    expect(screen.getByText(/مطالعه تاریخی/)).toBeInTheDocument();
    expect(screen.queryByLabelText('انتخاب فایل اکسل')).not.toBeInTheDocument();
  });

  it('keeps non-linear section navigation without a numbered stepper', async () => {
    const port = createTestPort([
      {
        id: 'P-TEST',
        name: 'برنامه تست',
        deliveryDate: '۱۴۰۳/۰۶/۰۱',
        currentStage: 'intake',
        status: 'draft',
        lastChanged: 'الان',
      },
    ]);
    renderApp('/plans/P-TEST/intake', port);
    const nav = await screen.findByRole('navigation', { name: 'بخش‌های برنامه' });
    expect(within(nav).getByRole('link', { name: 'داده‌های برنامه' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'بررسی داده' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'برنامه‌ریزی و تخصیص' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'اجرا و پیگیری' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { current: 'step' })).not.toBeInTheDocument();
    expect(screen.queryByText('مرحله ۱')).not.toBeInTheDocument();
  });
});
