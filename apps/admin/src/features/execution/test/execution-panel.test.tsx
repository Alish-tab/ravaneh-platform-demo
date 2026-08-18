import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { createExecutionTestPort } from '@/features/execution/data/fixture-port';
import { renderExecution } from '@/features/execution/test/render';

describe('A04 operations panel', () => {
  it('renders areas tab, filters, and area detail', async () => {
    const user = userEvent.setup();
    renderExecution();
    await screen.findByRole('button', { name: /محدوده ۱/ });

    expect(screen.getByRole('tab', { name: 'محدوده‌ها' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('button', { name: 'در انتظار' }));
    expect(screen.getByRole('button', { name: /محدوده ۱/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /محدوده ۱/ }));
    expect(screen.getByText('کل سفارشات')).toBeInTheDocument();
    expect(screen.getByText('نقاط تحویل')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /بلوار ولیعصر/ })).toBeInTheDocument();
  });

  it('opens follow-up tab and follow-up detail', async () => {
    const user = userEvent.setup();
    renderExecution();
    await screen.findByRole('tab', { name: /نیازمند پیگیری/ });
    await user.click(screen.getByRole('tab', { name: /نیازمند پیگیری/ }));
    expect(await screen.findByText('سارا احمدی')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /سارا احمدی/ }));
    expect(await screen.findByRole('button', { name: 'ثبت پیگیری' })).toBeInTheDocument();
    expect(screen.getByText('درب بسته')).toBeInTheDocument();
  });

  it('collapses to a narrow rail and reopens', async () => {
    const user = userEvent.setup();
    renderExecution();
    await screen.findByTestId('execution-panel');
    await user.click(screen.getByRole('button', { name: 'بستن پنل عملیات' }));
    expect(screen.queryByTestId('execution-panel')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'باز کردن پنل عملیات' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'باز کردن پنل عملیات' }));
    expect(screen.getByTestId('execution-panel')).toBeInTheDocument();
  });

  it('opens a multi-order location and a single-order location', async () => {
    const user = userEvent.setup();
    renderExecution();
    await screen.findByRole('button', { name: /محدوده ۱/ });
    await user.click(screen.getByRole('button', { name: /محدوده ۱/ }));
    await user.click(screen.getByRole('button', { name: /میدان انقلاب/ }));

    const multi = screen.getByTestId('execution-location-detail');
    expect(multi).toHaveAttribute('data-order-count', '3');
    expect(screen.getByText('علی رضایی')).toBeInTheDocument();
    expect(screen.getByText('نگین محمدی')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /علی رضایی/ }));
    expect(screen.getByText('گیرنده')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /میدان انقلاب/ }));
    expect(screen.getByTestId('execution-location-detail')).toBeInTheDocument();
  });

  it('shows a single-order location without a nested order list', async () => {
    const user = userEvent.setup();
    renderExecution();
    await screen.findByRole('button', { name: /محدوده ۱/ });
    await user.click(screen.getByRole('button', { name: /محدوده ۱/ }));
    await user.click(screen.getByRole('button', { name: /شریعتی/ }));
    const detail = screen.getByTestId('execution-location-detail');
    expect(detail).toHaveAttribute('data-order-count', '1');
    expect(within(detail).getByText('سارا احمدی')).toBeInTheDocument();
    expect(within(detail).getByText('گیرنده')).toBeInTheDocument();
  });

  it('supports back navigation through area → location → order', async () => {
    const user = userEvent.setup();
    renderExecution();
    await screen.findByRole('button', { name: /محدوده ۱/ });
    await user.click(screen.getByRole('button', { name: /محدوده ۱/ }));
    await user.click(screen.getByRole('button', { name: /میدان انقلاب/ }));
    await user.click(screen.getByRole('button', { name: /نگین محمدی/ }));
    expect(screen.getByText('علت:')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /میدان انقلاب/ }));
    expect(screen.getByTestId('execution-location-detail')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'محدوده ۱' }));
    expect(screen.getByText('نقاط تحویل')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'محدوده‌ها' }));
    expect(screen.getByRole('tab', { name: 'محدوده‌ها' })).toHaveAttribute('aria-selected', 'true');
  });

  it('syncs map area selection to the panel', async () => {
    const user = userEvent.setup();
    renderExecution();
    await screen.findByTestId('execution-map');
    await user.click(screen.getByRole('button', { name: 'map-select-area-1' }));
    expect(screen.getByText('نقاط تحویل')).toBeInTheDocument();
    expect(screen.getByTestId('execution-map')).toHaveAttribute('data-selected-area-id', 'area-1');
  });

  it('opens location detail from the map', async () => {
    const user = userEvent.setup();
    renderExecution();
    await screen.findByTestId('execution-map');
    await user.click(screen.getByRole('button', { name: 'map-select-loc-001' }));
    const detail = await screen.findByTestId('execution-location-detail');
    expect(detail).toHaveAttribute('data-order-count', '2');
    expect(screen.getByTestId('execution-map')).toHaveAttribute('data-selected-area-id', 'area-1');
  });
});

describe('A04 order search', () => {
  it('shows searching then a found pending order', async () => {
    const user = userEvent.setup();
    const port = createExecutionTestPort();
    port.holdNextSearch();
    renderExecution('/plans/P-2403/execution', port);
    await screen.findByRole('button', { name: /محدوده ۱/ });

    const input = screen.getByRole('textbox', { name: 'جستجوی شماره سفارش' });
    await user.type(input, '10102004');
    await user.keyboard('{Enter}');
    expect(await screen.findByLabelText('در حال جستجو')).toBeInTheDocument();
    port.releaseHeldSearch();
    const panel = screen.getByTestId('execution-panel');
    expect(await screen.findByText('علی رضایی')).toBeInTheDocument();
    expect(within(panel).getByText('در انتظار')).toBeInTheDocument();
  });

  it('opens found delivered and follow-up orders', async () => {
    const user = userEvent.setup();
    renderExecution();
    await screen.findByRole('button', { name: /محدوده ۱/ });
    const input = screen.getByRole('textbox', { name: 'جستجوی شماره سفارش' });

    await user.clear(input);
    await user.type(input, '10102002');
    await user.keyboard('{Enter}');
    expect(await screen.findByText('رضا نجفی')).toBeInTheDocument();
    expect(within(screen.getByTestId('execution-panel')).getByText('تحویل‌شده')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'پاک کردن جستجو' }));
    await user.type(input, '10102003');
    await user.keyboard('{Enter}');
    expect(await screen.findByText('سارا احمدی')).toBeInTheDocument();
    expect(within(screen.getByTestId('execution-panel')).getAllByText('نیازمند پیگیری').length).toBeGreaterThan(0);
  });

  it('shows not-found and can clear search', async () => {
    const user = userEvent.setup();
    renderExecution();
    await screen.findByRole('button', { name: /محدوده ۱/ });
    const input = screen.getByRole('textbox', { name: 'جستجوی شماره سفارش' });
    await user.type(input, '99999999');
    await user.keyboard('{Enter}');
    expect(await screen.findByText('این شماره سفارش در این برنامه پیدا نشد.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'پاک کردن جستجو' }));
    expect(screen.queryByText('این شماره سفارش در این برنامه پیدا نشد.')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'محدوده‌ها' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('A04 follow-up notes', () => {
  it('disables empty submit, preserves note on failure, retries, and shows history', async () => {
    const user = userEvent.setup();
    const port = createExecutionTestPort();
    renderExecution('/plans/P-2403/execution', port);
    await screen.findByRole('tab', { name: /نیازمند پیگیری/ });
    await user.click(screen.getByRole('tab', { name: /نیازمند پیگیری/ }));
    await user.click(await screen.findByRole('button', { name: /سارا احمدی/ }));

    expect(within(screen.getByTestId('execution-panel')).getByText('امین رضایی')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ثبت پیگیری' }));
    const textarea = screen.getByLabelText('یادداشت پیگیری');
    expect(screen.getByRole('button', { name: 'ثبت' })).toBeDisabled();

    await user.type(textarea, 'پیگیری تست');
    port.setNextSaveFailure(true);
    await user.click(screen.getByRole('button', { name: 'ثبت' }));
    expect(await screen.findByText('خطا در ثبت. یادداشت حفظ شده است.')).toBeInTheDocument();
    expect(textarea).toHaveValue('پیگیری تست');

    await user.click(screen.getByRole('button', { name: 'تلاش مجدد' }));
    await waitFor(() => {
      expect(screen.getByText('ثبت شد')).toBeInTheDocument();
    });
    expect(await screen.findByText('پیگیری تست')).toBeInTheDocument();
    expect(screen.queryByLabelText('یادداشت پیگیری')).not.toBeInTheDocument();
  });

  it('copies phone numbers without breaking the detail on clipboard failure', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    renderExecution();
    await screen.findByRole('tab', { name: /نیازمند پیگیری/ });
    await user.click(screen.getByRole('tab', { name: /نیازمند پیگیری/ }));
    await user.click(await screen.findByRole('button', { name: /سارا احمدی/ }));
    await user.click(screen.getByRole('button', { name: 'کپی شماره تلفن' }));
    expect(await screen.findByText('کپی نشد')).toBeInTheDocument();
    expect(screen.getByText('سارا احمدی')).toBeInTheDocument();
  });
});
