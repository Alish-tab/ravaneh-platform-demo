import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { A01_DEMO_PLANS } from '@/features/plans/fixture/demo-plans';
import { createTestPort, renderApp } from '@/features/plans/test/render';

describe('A01 Plans list', () => {
  it('renders populated list', async () => {
    renderApp('/plans');
    expect(await screen.findByRole('heading', { name: 'برنامه‌ها' })).toBeInTheDocument();
    expect(await screen.findByText('برنامه تحویل — ۱ شهریور — ۱۲ تا ۱۵')).toBeInTheDocument();
    expect(screen.getByText('P-2407')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    const port = createTestPort([]);
    renderApp('/plans', port);
    expect(await screen.findByText('هنوز برنامه‌ای وجود ندارد')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /برنامه جدید/ }).length).toBeGreaterThan(0);
  });

  it('filters by search and shows filtered empty', async () => {
    const user = userEvent.setup();
    renderApp('/plans');
    await screen.findByText('P-2407');

    await user.type(screen.getByLabelText('جستجوی برنامه‌ها'), 'ناموجود-xyz');
    expect(await screen.findByText('برنامه‌ای با این فیلتر پیدا نشد')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'پاک کردن فیلترها' }));
    expect(await screen.findByText('P-2407')).toBeInTheDocument();
  });

  it('filters by stage', async () => {
    const user = userEvent.setup();
    renderApp('/plans');
    await screen.findByText('P-2407');

    await user.click(screen.getByRole('button', { name: 'اجرا' }));
    expect(await screen.findByText('P-2403')).toBeInTheDocument();
    expect(screen.queryByText('P-2407')).not.toBeInTheDocument();
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
});

describe('A01 Create Plan', () => {
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
    renderApp('/plans', port);

    await screen.findByText('هنوز برنامه‌ای وجود ندارد');
    await user.click(screen.getAllByRole('button', { name: /برنامه جدید/ })[0]!);

    await user.type(screen.getByLabelText(/تاریخ تحویل/), '۱۴۰۳/۰۶/۱۰');
    await user.click(screen.getByRole('button', { name: 'ایجاد برنامه' }));

    expect(await screen.findByRole('heading', { name: 'ورود داده' })).toBeInTheDocument();
    expect(screen.getByText(/فایل اکسل داده‌های تحویل/)).toBeInTheDocument();
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
    expect(
      await screen.findByText(/ایجاد برنامه با خطا مواجه شد/),
    ).toBeInTheDocument();

    expect((screen.getByLabelText(/تاریخ تحویل/) as HTMLInputElement).value).toBe('۱۴۰۳/۰۶/۱۱');
    expect((screen.getByLabelText('نام برنامه') as HTMLInputElement).value).toBe('برنامه تست خطا');
  });
});

describe('A01 Intake', () => {
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

    expect(await screen.findByRole('heading', { name: 'ورود داده' })).toBeInTheDocument();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['abc'], 'orders.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await user.upload(input, file);

    expect(await screen.findByText('orders.xlsx')).toBeInTheDocument();
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
    await screen.findByRole('heading', { name: 'ورود داده' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['abc'], 'fail-upload.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await user.upload(input, file);
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));

    expect(await screen.findByText('بارگذاری فایل ناموفق بود')).toBeInTheDocument();
  });

  it('shows structural failure for missing columns fixture file', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers({ shouldAdvanceTime: true });
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
    await screen.findByRole('heading', { name: 'ورود داده' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['abc'], 'missing-col.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await user.upload(input, file);
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));

    await waitFor(() => {
      expect(screen.getByText('در حال پردازش فایل…')).toBeInTheDocument();
    });
    await vi.advanceTimersByTimeAsync(2000);

    expect(await screen.findByText('ستون‌های ضروری شناسایی نشدند')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('reaches parsed needs review and hands off to imports', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers({ shouldAdvanceTime: true });
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
    await screen.findByRole('heading', { name: 'ورود داده' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['abc'], 'orders_review.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await user.upload(input, file);
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));
    await vi.advanceTimersByTimeAsync(3000);

    expect(
      await screen.findByText(/برخی موارد نیاز به بررسی دارند/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /بررسی موارد/ }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/imports');
    });
    vi.useRealTimers();
  });

  it('reaches parsed clean for clean fixture filename', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers({ shouldAdvanceTime: true });
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
    await screen.findByRole('heading', { name: 'ورود داده' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['abc'], 'orders_clean.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await user.upload(input, file);
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));
    await vi.advanceTimersByTimeAsync(3000);

    expect(await screen.findByText('فایل با موفقیت خوانده شد')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ادامه به بررسی داده/ })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows replacement confirmation and preserves previous file on failure', async () => {
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
    await user.click(screen.getByRole('button', { name: /جایگزینی فایل/ }));
    expect(await screen.findByText('جایگزینی داده‌های ورودی')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /بارگذاری فایل جدید/ }));
    expect(await screen.findByLabelText('انتخاب فایل اکسل')).toBeInTheDocument();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['abc'], 'fail-upload-new.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await user.upload(input, file);
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));

    expect(await screen.findByText('بارگذاری فایل جدید ناموفق بود')).toBeInTheDocument();
    expect(screen.getByText('فایل فعال فعلی')).toBeInTheDocument();
    expect(within(screen.getByText('فایل فعال فعلی').closest('.a01-card')!.parentElement!).getByText('previous.xlsx')).toBeInTheDocument();
  });

  it('shows stale banner from query flag and refreshes', async () => {
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
});
