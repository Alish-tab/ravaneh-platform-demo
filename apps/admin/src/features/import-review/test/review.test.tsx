import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/features/plans/test/render';
import { createTestPort } from '@/features/plans/test/render';
import { A01_DEMO_PLANS } from '@/features/plans/fixture/demo-plans';
import { REVIEW_FIXTURE_FAILURE_VALUE } from '@/features/import-review/fixture/useReviewFixture';

describe('Review shell', () => {
  it('renders the plan-scoped review workspace', async () => {
    renderApp('/plans/P-2405/review');

    expect(await screen.findAllByText('برنامه تحویل — ۲۱ مرداد — ۹ تا ۱۲')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /نیازمند اقدام/ })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'جستجوی موارد بررسی' })).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'گیرنده' })).toBeInTheDocument();
    expect(within(table).getByText('علی حسینی')).toBeInTheDocument();
    expect(screen.getByText('اطلاعات گیرنده')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تأیید و ادامه به برنامه‌ریزی' })).toBeDisabled();
  });

  it('keeps row inspection independent from checkbox selection', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');

    await user.click(screen.getByRole('checkbox', { name: 'انتخاب D-1046' }));
    expect(screen.getByRole('checkbox', { name: 'انتخاب D-1046' })).toBeChecked();
    expect(screen.getAllByText('علی حسینی')).toHaveLength(2);

    await user.click(within(screen.getByRole('table')).getByText('رضا احمدی'));
    expect(screen.getByRole('checkbox', { name: 'انتخاب D-1046' })).toBeChecked();
    expect(screen.getAllByText('رضا احمدی')).toHaveLength(2);
  });

  it('expands and collapses the original imported values', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');

    const disclosure = screen.getByRole('button', { name: 'مقادیر فایل اصلی' });
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('خ آزادی پلاک 214')).not.toBeInTheDocument();

    await user.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('خ آزادی پلاک 214')).toBeInTheDocument();
    expect(screen.getByText('Latitude')).toBeInTheDocument();
    expect(screen.getByText('Longitude')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByText('09127773421')).toBeInTheDocument();

    await user.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('خ آزادی پلاک 214')).not.toBeInTheDocument();
  });

  it('supports multi-selection and select-all over currently visible rows', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');

    await user.click(screen.getByRole('checkbox', { name: 'انتخاب D-1044' }));
    await user.click(screen.getByRole('checkbox', { name: 'انتخاب D-1046' }));
    expect(screen.getAllByText('۲ مورد انتخاب شده')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'پاک کردن انتخاب' }));
    await user.click(screen.getByRole('checkbox', { name: 'انتخاب همه موارد قابل مشاهده' }));
    expect(screen.getAllByText('۶ مورد انتخاب شده')).toHaveLength(2);
  });

  it('preserves hidden selection while search and filters change', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');

    await user.click(screen.getByRole('checkbox', { name: 'انتخاب D-1044' }));
    await user.type(screen.getByRole('searchbox', { name: 'جستجوی موارد بررسی' }), 'رضا');
    expect(screen.queryByRole('checkbox', { name: 'انتخاب D-1044' })).not.toBeInTheDocument();
    expect(screen.getByText('۱ مورد انتخاب شده')).toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: 'جستجوی موارد بررسی' }));
    expect(screen.getByRole('checkbox', { name: 'انتخاب D-1044' })).toBeChecked();
  });

  it('excludes and restores an individual item', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');

    await user.click(screen.getByRole('button', { name: 'مستثنا کردن از برنامه' }));
    await user.click(screen.getByRole('button', { name: 'مستثنا کن' }));
    await waitFor(() => expect(within(screen.getByRole('table')).queryByText('علی حسینی')).not.toBeInTheDocument());
    expect(screen.getByText('سفارش مستثنا شد.')).toBeInTheDocument();

    const summary = screen.getByLabelText('خلاصه بررسی');
    await user.click(within(summary).getByRole('button', { name: /مستثنا/ }));
    await user.click(screen.getByRole('button', { name: 'بازگرداندن به برنامه' }));
    await user.click(screen.getByRole('button', { name: 'بازگردان' }));
    await waitFor(() => expect(within(screen.getByRole('table')).queryByText('علی حسینی')).not.toBeInTheDocument());

    await user.click(within(summary).getByRole('button', { name: /نیازمند اقدام/ }));
    expect(within(screen.getByRole('table')).getByText('علی حسینی')).toBeInTheDocument();
  });

  it('resolves a location issue and derives the new ready state', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    expect(screen.getByRole('button', { name: 'موقعیت پیدا نشد (۱)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'اصلاح موقعیت' }));
    const input = screen.getByRole('textbox', { name: 'مختصات نهایی' });
    await user.clear(input);
    await user.type(input, '35.7000, 51.4000');
    await user.click(screen.getByRole('button', { name: 'ثبت موقعیت' }));

    await waitFor(() => expect(within(screen.getByRole('table')).queryByText('علی حسینی')).not.toBeInTheDocument());
    expect(screen.getByText('موقعیت سفارش ذخیره شد.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'موقعیت پیدا نشد (۰)' })).toBeInTheDocument();
    const summary = screen.getByLabelText('خلاصه بررسی');
    await user.click(within(summary).getByRole('button', { name: /آماده/ }));
    expect(within(screen.getByRole('table')).getByText('علی حسینی')).toBeInTheDocument();
  });

  it('blocks continuation until actions are resolved, then updates the plan and navigates', async () => {
    const user = userEvent.setup();
    const { router, port } = renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    const continueButton = screen.getByRole('button', { name: 'تأیید و ادامه به برنامه‌ریزی' });
    expect(continueButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'انتخاب همه موارد قابل مشاهده' }));
    await user.click(screen.getByRole('button', { name: 'مستثنا کردن موارد انتخاب‌شده' }));
    await user.click(screen.getByRole('button', { name: 'مستثنا کردن ۶ مورد' }));
    await waitFor(() => expect(continueButton).toBeEnabled());

    await user.click(continueButton);
    await waitFor(() => expect(router.state.location.pathname).toBe('/planning'));
    const plan = await port.getPlan('P-2405');
    expect(plan).toMatchObject({ currentStage: 'planning', status: 'planning_active' });
  });

  it('shows and clears a filtered-empty state', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    const search = await screen.findByRole('searchbox', { name: 'جستجوی موارد بررسی' });
    await user.type(search, 'موردی که وجود ندارد');
    expect(screen.getByText('موردی با جستجو یا فیلتر فعلی پیدا نشد.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'پاک کردن فیلترها' }));
    expect(search).toHaveValue('');
  });

  it('renders derived issue counts and filters by an issue chip', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');

    expect(screen.getByRole('button', { name: 'مکان‌یابی مبهم (۱)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ناسازگاری آدرس–موقعیت (۱)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'شماره تماس (۲)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'چند مسئله (۱)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ناسازگاری آدرس–موقعیت (۱)' }));
    const table = screen.getByRole('table');
    expect(within(table).getByText('لیلا احمدی')).toBeInTheDocument();
    expect(within(table).queryByText('علی حسینی')).not.toBeInTheDocument();
  });

  it('filters records containing multiple active issues', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    await user.click(screen.getByRole('button', { name: 'چند مسئله (۱)' }));

    const table = screen.getByRole('table');
    expect(within(table).getByText('کامران نوری')).toBeInTheDocument();
    expect(within(table).queryByText('نگین کریمی')).not.toBeInTheDocument();
  });

  it('renders a genuine empty Review with completed progress', async () => {
    const emptyPlan = { ...A01_DEMO_PLANS.find((plan) => plan.id === 'P-2405')!, itemCount: 0 };
    renderApp('/plans/P-2405/review', createTestPort([emptyPlan]));
    expect(await screen.findByText('مجموعه داده خالی است')).toBeInTheDocument();
    expect(screen.getByText('هیچ سطری از فایل واردشده برای بررسی وجود ندارد.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تأیید و ادامه به برنامه‌ریزی' })).toBeEnabled();
  });

  it('supports keyboard row inspection without changing selection', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    const row = await screen.findByRole('row', { name: /D-1046 رضا احمدی/ });
    row.focus();
    await user.keyboard('{Enter}');
    expect(screen.getAllByText('رضا احمدی')).toHaveLength(2);
    expect(screen.getByRole('checkbox', { name: 'انتخاب D-1046' })).not.toBeChecked();

    await user.keyboard('{Enter}');
    expect(screen.getByText('برای مشاهده جزئیات و اقدامات، یک مورد را انتخاب کنید.')).toBeInTheDocument();
  });

  it('presents local saving and fixture-error feedback without closing the action', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    await user.click(screen.getByRole('button', { name: 'اصلاح موقعیت' }));
    const input = screen.getByRole('textbox', { name: 'مختصات نهایی' });
    await user.clear(input);
    await user.type(input, REVIEW_FIXTURE_FAILURE_VALUE);
    await user.click(screen.getByRole('button', { name: 'ثبت موقعیت' }));

    expect(screen.getByRole('button', { name: 'ثبت موقعیت' })).toBeDisabled();
    expect(await screen.findByText('ذخیره تغییرات آزمایشی ناموفق بود. دوباره تلاش کنید.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'مختصات نهایی' })).toBeInTheDocument();
  });
});
