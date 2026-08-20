import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { REVIEW_FIXTURE_FAILURE_VALUE } from '@/features/import-review/fixture/useReviewFixture';
import { isSameOrderDuplicate } from '@/features/import-review/review-model';
import { P2405_REVIEW_ITEMS } from '@/features/import-review/fixture/review-fixture';
import { A01_DEMO_PLANS } from '@/features/plans/fixture/demo-plans';
import { renderApp } from '@/features/plans/test/render';
import { createTestPort } from '@/features/plans/test/render';

describe('Review shell', () => {
  it('renders the plan-scoped review workspace', async () => {
    renderApp('/plans/P-2405/review');

    expect(await screen.findByText('برنامه تحویل — ۲۱ مرداد — ۹ تا ۱۲')).toBeInTheDocument();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /نیازمند اقدام/ })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'جستجوی موارد بررسی' })).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'گیرنده' })).toBeInTheDocument();
    expect(within(table).getByText('علی حسینی')).toBeInTheDocument();
    expect(screen.getByText('اطلاعات گیرنده')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تأیید و ادامه به برنامه‌ریزی' })).toBeDisabled();
  });

  it('does not show another plan\'s review rows', async () => {
    renderApp('/plans/P-2404/review');
    expect(await screen.findByText('مجموعه داده خالی است')).toBeInTheDocument();
    expect(screen.queryByText('علی حسینی')).not.toBeInTheDocument();
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
    expect(screen.getByRole('checkbox', { name: 'انتخاب D-1044' })).not.toBeChecked();
  });

  it('keeps an inspected row while another row is checkbox-selected', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');

    await user.click(screen.getByRole('checkbox', { name: 'انتخاب D-1046' }));
    expect(screen.getAllByText('علی حسینی')).toHaveLength(2);
    expect(screen.getByRole('checkbox', { name: 'انتخاب D-1046' })).toBeChecked();
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
    expect(screen.getAllByText('۷ مورد انتخاب شده')).toHaveLength(2);
    expect(screen.queryByRole('checkbox', { name: 'انتخاب D-1042' })).not.toBeInTheDocument();
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

  it('excludes and restores an individual item without deleting raw history', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');

    await user.click(screen.getByRole('button', { name: 'مستثنا کردن از برنامه' }));
    expect(screen.getByText(/سابقه واردات حفظ خواهد شد/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'مستثنا کن' }));
    await waitFor(() =>
      expect(within(screen.getByRole('table')).queryByText('علی حسینی')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('سفارش مستثنا شد.')).toBeInTheDocument();

    const summary = screen.getByLabelText('خلاصه بررسی');
    await user.click(within(summary).getByRole('button', { name: /مستثنا/ }));
    await user.click(screen.getByRole('button', { name: 'بازگرداندن به برنامه' }));
    await user.click(screen.getByRole('button', { name: 'بازگردان' }));
    await waitFor(() =>
      expect(within(screen.getByRole('table')).queryByText('علی حسینی')).not.toBeInTheDocument(),
    );

    await user.click(within(summary).getByRole('button', { name: /نیازمند اقدام/ }));
    expect(within(screen.getByRole('table')).getByText('علی حسینی')).toBeInTheDocument();
  });

  it('proposes a map location without replacing saved until save', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    expect(screen.getByRole('button', { name: 'موقعیت پیدا نشد (۱)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'اصلاح موقعیت' }));
    expect(screen.getByText('موقعیت عملیاتی ثبت نشده')).toBeInTheDocument();
    await user.click(screen.getByTestId('base-map-stub'));
    expect(screen.getByTestId('review-proposed-coords')).toHaveTextContent('35.7000, 51.4000');
    expect(screen.getByTestId('review-saved-coords')).toHaveTextContent('موقعیت عملیاتی ثبت نشده');

    await user.click(screen.getByRole('button', { name: 'ذخیره موقعیت' }));
    await waitFor(() =>
      expect(within(screen.getByRole('table')).queryByText('علی حسینی')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('موقعیت سفارش ذخیره شد.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'موقعیت پیدا نشد (۰)' })).toBeInTheDocument();
    const summary = screen.getByLabelText('خلاصه بررسی');
    await user.click(within(summary).getByRole('button', { name: /آماده/ }));
    expect(within(screen.getByRole('table')).getByText('علی حسینی')).toBeInTheDocument();
    expect(screen.getByText('اطلاعات گیرنده')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'مقادیر فایل اصلی' }));
    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByText(/اصلاح دستی/)).toBeInTheDocument();
  });

  it('keeps proposed location when save fails', async () => {
    const user = userEvent.setup();
    const { port } = renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    port.setNextReviewSaveFailure(true);

    await user.click(screen.getByRole('button', { name: 'اصلاح موقعیت' }));
    await user.click(screen.getByTestId('base-map-stub'));
    await user.click(screen.getByRole('button', { name: 'ذخیره موقعیت' }));

    expect(await screen.findByText('ذخیره تغییرات آزمایشی ناموفق بود. دوباره تلاش کنید.')).toBeInTheDocument();
    expect(screen.getByTestId('review-proposed-coords')).toHaveTextContent('35.7000, 51.4000');
    expect(screen.getByRole('button', { name: 'ذخیره موقعیت' })).toBeInTheDocument();
  });

  it('cancels location correction without changing saved location', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    await user.click(within(screen.getByRole('table')).getByText('لیلا احمدی'));
    await user.click(screen.getByRole('button', { name: 'اصلاح موقعیت' }));
    expect(screen.getByTestId('review-saved-coords')).toHaveTextContent('35.7638, 51.3500');
    await user.click(screen.getByTestId('base-map-stub'));
    await user.click(screen.getByRole('button', { name: 'انصراف' }));
    expect(screen.getAllByText('35.7638, 51.3500').length).toBeGreaterThan(0);
  });

  it('navigates to Planning without mutating lifecycle or currentStage', async () => {
    const user = userEvent.setup();
    const { router, port } = renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    const continueButton = screen.getByRole('button', { name: 'تأیید و ادامه به برنامه‌ریزی' });
    expect(continueButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'انتخاب همه موارد قابل مشاهده' }));
    await user.click(screen.getByRole('button', { name: 'مستثنا کردن موارد انتخاب‌شده' }));
    await user.click(screen.getByRole('button', { name: 'مستثنا کردن ۷ مورد' }));
    await waitFor(() => expect(continueButton).toBeEnabled());

    const before = await port.getPlan('P-2405');
    await user.click(continueButton);
    await waitFor(() => expect(router.state.location.pathname).toBe('/plans/P-2405/planning'));
    const plan = await port.getPlan('P-2405');
    expect(plan?.currentStage).toBe(before?.currentStage);
    expect(plan?.status).toBe(before?.status);
    expect(plan?.lifecycle).toBe(before?.lifecycle);
  });

  it('keeps Planning section navigable while the contextual CTA is blocked', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    expect(screen.getByRole('button', { name: 'تأیید و ادامه به برنامه‌ریزی' })).toBeDisabled();
    expect(screen.queryByRole('link', { current: 'step' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'برنامه‌ریزی و تخصیص' }));
    expect(await screen.findByRole('link', { name: 'برنامه‌ریزی و تخصیص', current: 'page' })).toBeInTheDocument();
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

  it('renders derived issue counts and supports multiple issue filters', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');

    expect(screen.getByRole('button', { name: 'مکان‌یابی مبهم (۱)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ناسازگاری آدرس و موقعیت (۱)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'شماره تماس (۲)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'چند مسئله (۱)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ناسازگاری آدرس و موقعیت (۱)' }));
    const table = screen.getByRole('table');
    expect(within(table).getByText('لیلا احمدی')).toBeInTheDocument();
    expect(within(table).queryByText('علی حسینی')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'موقعیت پیدا نشد (۱)' }));
    expect(within(table).getByText('لیلا احمدی')).toBeInTheDocument();
    expect(within(table).getByText('علی حسینی')).toBeInTheDocument();
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

  it('searches across order id, customer, phone, and address', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    const search = await screen.findByRole('searchbox', { name: 'جستجوی موارد بررسی' });
    await screen.findByRole('table');
    const table = screen.getByRole('table');

    await user.type(search, 'D-1046');
    expect(within(table).getByText('رضا احمدی')).toBeInTheDocument();
    await user.clear(search);

    await user.type(search, 'نگین');
    expect(within(table).getByText('نگین کریمی')).toBeInTheDocument();
    await user.clear(search);

    await user.type(search, '09126602277');
    expect(within(table).getByText('رضا احمدی')).toBeInTheDocument();
    await user.clear(search);

    await user.type(search, 'جردن');
    expect(within(table).getByText('لیلا احمدی')).toBeInTheDocument();
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

  it('treats same External Order ID as duplicates and never hardcodes D-1042', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');

    const d1048 = P2405_REVIEW_ITEMS.filter((item) => item.externalOrderId === 'D-1048');
    expect(d1048).toHaveLength(2);
    expect(d1048[0]!.reviewItemId).not.toBe(d1048[1]!.reviewItemId);
    expect(isSameOrderDuplicate(d1048[0]!, d1048[1]!)).toBe(true);

    const identicalDifferentIds = P2405_REVIEW_ITEMS.filter(
      (item) => item.reviewItemId === 'D-1042' || item.reviewItemId === 'D-1045',
    );
    expect(identicalDifferentIds).toHaveLength(2);
    expect(identicalDifferentIds[0]!.externalOrderId).not.toBe(identicalDifferentIds[1]!.externalOrderId);
    expect(isSameOrderDuplicate(identicalDifferentIds[0]!, identicalDifferentIds[1]!)).toBe(false);

    await user.click(screen.getByRole('button', { name: 'شماره سفارش تکراری (۲)' }));
    const table = screen.getByRole('table');
    expect(within(table).getAllByText('امیر زاهدی')).toHaveLength(2);
    expect(within(table).queryByText('صادق رضایی')).not.toBeInTheDocument();

    await user.click(within(table).getAllByText('امیر زاهدی')[0]!);
    await user.click(screen.getByRole('button', { name: 'بررسی شماره سفارش تکراری' }));
    expect(screen.queryByText('صادق رضایی')).not.toBeInTheDocument();
    expect(screen.getAllByText('D-1048').length).toBeGreaterThan(1);
  });

  it('treats same coordinates with different Order IDs as informational multi-order location', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    const summary = screen.getByLabelText('خلاصه بررسی');
    await user.click(within(summary).getByRole('button', { name: /آماده/ }));
    expect(within(screen.getByRole('table')).getByText('مریم صادقی')).toBeInTheDocument();
    expect(screen.getByText('چند سفارش در یک موقعیت')).toBeInTheDocument();
    await user.click(within(screen.getByRole('table')).getByText('مریم صادقی'));
    expect(screen.getByText('اطلاعاتی')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'بررسی شماره سفارش تکراری' })).not.toBeInTheDocument();
  });

  it('filters recent-update rows from A01 metadata without inventing impact rules', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    expect(screen.getByText(/مورد از آخرین به‌روزرسانی داده نیازمند بررسی‌اند/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'نمایش موارد' }));
    expect(screen.getByRole('button', { name: 'تغییرات اخیر ×' })).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('علی حسینی')).toBeInTheDocument();
    expect(within(table).getByText('نگین کریمی')).toBeInTheDocument();
    expect(within(table).queryByText('رضا احمدی')).not.toBeInTheDocument();
    expect(within(table).getByText('سفارش جدید از آخرین واردات')).toBeInTheDocument();

    await user.click(within(table).getByText('لیلا احمدی'));
    expect(screen.getByText('این تغییر نیازمند توجه برنامه‌ریزی است.')).toBeInTheDocument();
    await user.click(within(table).getByText('نگین کریمی'));
    expect(screen.queryByText('این تغییر نیازمند توجه برنامه‌ریزی است.')).not.toBeInTheDocument();
    expect(screen.getByText('فیلدهای تغییرکرده')).toBeInTheDocument();
  });

  it('edits current information without mutating raw values and keeps input on failure', async () => {
    const user = userEvent.setup();
    const { port } = renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    await user.click(screen.getByRole('button', { name: 'ویرایش اطلاعات' }));
    const name = screen.getByRole('textbox', { name: 'نام گیرنده' });
    await user.clear(name);
    await user.type(name, REVIEW_FIXTURE_FAILURE_VALUE);
    await user.click(screen.getByRole('button', { name: 'ذخیره اطلاعات' }));
    expect(await screen.findByText('ذخیره تغییرات آزمایشی ناموفق بود. دوباره تلاش کنید.')).toBeInTheDocument();
    expect(name).toHaveValue(REVIEW_FIXTURE_FAILURE_VALUE);

    await user.clear(name);
    await user.type(name, 'علی حسینی ویرایش‌شده');
    const phone = screen.getByRole('textbox', { name: 'شماره تماس' });
    await user.clear(phone);
    await user.type(phone, '0912-341-5678');
    await user.click(screen.getByRole('button', { name: 'ذخیره اطلاعات' }));
    await waitFor(() => expect(screen.getByText('اطلاعات سفارش ذخیره شد.')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'مقادیر فایل اصلی' }));
    expect(screen.getByText('نام فایل')).toBeInTheDocument();
    expect(screen.getByText('علی حسینی')).toBeInTheDocument();
    expect(
      (await port.listReviewItems('P-2405')).find((item) => item.reviewItemId === 'D-1044')?.phone,
    ).toBe('09123415678');
  });

  it('asks for discard confirmation when leaving a dirty edit form', async () => {
    const user = userEvent.setup();
    renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    await user.click(screen.getByRole('button', { name: 'ویرایش اطلاعات' }));
    await user.type(screen.getByRole('textbox', { name: 'نام گیرنده' }), 'x');
    await user.click(screen.getByRole('button', { name: 'بازگشت' }));
    expect(screen.getByText('تغییرات ذخیره نشده از بین می‌روند.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ادامه ویرایش' }));
    expect(screen.getByRole('textbox', { name: 'نام گیرنده' })).toBeInTheDocument();
  });

  it('supports mixed bulk eligibility and partial bulk failure', async () => {
    const user = userEvent.setup();
    const { port } = renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    const summary = screen.getByLabelText('خلاصه بررسی');
    await user.click(within(summary).getByRole('button', { name: /کل/ }));
    await user.click(screen.getByRole('checkbox', { name: 'انتخاب D-1042' }));
    await user.click(screen.getByRole('checkbox', { name: 'انتخاب D-1044' }));
    await user.click(screen.getByRole('checkbox', { name: 'انتخاب D-1055' }));
    expect(screen.getByText(/انتخاب ترکیبی است/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'بازگرداندن موارد مستثنا' })).toBeInTheDocument();

    port.setNextBulkPartialFailure(true);
    await user.click(screen.getByRole('button', { name: 'مستثنا کردن موارد انتخاب‌شده' }));
    await user.click(screen.getByRole('button', { name: /مستثنا کردن/ }));
    expect(await screen.findByText(/مورد مستثنا شد؛/)).toBeInTheDocument();
  });

  it('keeps Published review read-only and does not mutate the published snapshot from Working', async () => {
    const user = userEvent.setup();
    const published = {
      ...A01_DEMO_PLANS.find((plan) => plan.id === 'P-2405')!,
      a01Mode: 'published-readonly' as const,
      canMutateDataset: false,
      lifecycle: 'published' as const,
      publishedSnapshot: {
        itemCount: 187,
        importBatches: A01_DEMO_PLANS.find((plan) => plan.id === 'P-2405')!.importBatches,
      },
    };
    const { port } = renderApp('/plans/P-2405/review', createTestPort([published]));
    expect(await screen.findByText('نسخه منتشرشده · فقط مشاهده')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ویرایش اطلاعات' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ایجاد نسخه کاری' }));
    expect(await screen.findByText(/نسخه در حال ویرایش/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ویرایش اطلاعات' }));
    const name = screen.getByRole('textbox', { name: 'نام گیرنده' });
    await user.clear(name);
    await user.type(name, 'ویرایش نسخه کاری');
    await user.click(screen.getByRole('button', { name: 'ذخیره اطلاعات' }));
    await waitFor(() => expect(screen.getByText('اطلاعات سفارش ذخیره شد.')).toBeInTheDocument());

    const publishedItems = port.getPublishedReviewItems('P-2405');
    expect(publishedItems?.find((item) => item.reviewItemId === 'D-1044')?.name).toBe('علی حسینی');
  });

  it('keeps Completed review read-only', async () => {
    const completed = {
      ...A01_DEMO_PLANS.find((plan) => plan.id === 'P-2405')!,
      a01Mode: 'completed-readonly' as const,
      canMutateDataset: false,
      lifecycle: 'completed' as const,
    };
    renderApp('/plans/P-2405/review', createTestPort([completed]));
    expect(await screen.findByText(/فقط خواندنی/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ویرایش اطلاعات' })).not.toBeInTheDocument();
  });

  it('shows a dedicated conflict message and does not silently overwrite', async () => {
    const user = userEvent.setup();
    const { port } = renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    port.setNextReviewConflict(true);
    await user.click(screen.getByRole('button', { name: 'مستثنا کردن از برنامه' }));
    await user.click(screen.getByRole('button', { name: 'مستثنا کن' }));
    expect(
      await screen.findAllByText('این مورد در جای دیگری تغییر کرده است. اطلاعات جدید را دریافت کنید.'),
    ).not.toHaveLength(0);
    expect(within(screen.getByRole('table')).getByText('علی حسینی')).toBeInTheDocument();
  });

  it('shows stale state and refreshes on request', async () => {
    const { port } = renderApp('/plans/P-2405/review');
    await screen.findByText('اطلاعات گیرنده');
    port.markStale('P-2405', true);
    expect(await screen.findByText(/اطلاعات این صفحه قدیمی است/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'دریافت اطلاعات جدید' }));
    await waitFor(() =>
      expect(screen.queryByText(/اطلاعات این صفحه قدیمی است/)).not.toBeInTheDocument(),
    );
  });
});
