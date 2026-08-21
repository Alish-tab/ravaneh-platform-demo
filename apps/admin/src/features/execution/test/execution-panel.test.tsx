import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderExecution } from '@/features/execution/test/render';
import { ICONS } from '@/features/plans/components/icons';

afterEach(() => {
  vi.useRealTimers();
});

describe('A04 operations panel', () => {
  it('renders areas tab, filters, and area detail', async () => {
    const user = userEvent.setup();
    await renderExecution();
    await screen.findByRole('button', { name: /محدوده ۱/ });

    expect(screen.getByRole('tab', { name: 'محدوده‌ها' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('button', { name: 'در انتظار' }));
    expect(screen.getByRole('button', { name: /محدوده ۱/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /محدوده ۱/ }));
    expect(screen.getByText('کل سفارشات')).toBeInTheDocument();
    expect(screen.getByText('نقاط تحویل')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /میرداماد، کوچه نهم، واحد ۳/ })).toBeInTheDocument();
  });

  it('opens follow-up tab and follow-up detail', async () => {
    const user = userEvent.setup();
    await renderExecution();
    await screen.findByRole('tab', { name: /نیازمند پیگیری/ });
    await user.click(screen.getByRole('tab', { name: /نیازمند پیگیری/ }));
    expect(await screen.findByText('محمد رضایی')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /محمد رضایی/ }));
    expect(await screen.findByRole('button', { name: 'ثبت پیگیری' })).toBeInTheDocument();
    expect(screen.getByText('آدرس ناقص')).toBeInTheDocument();
  });

  it('collapses to a narrow rail and reopens', async () => {
    const user = userEvent.setup();
    await renderExecution();
    await screen.findByTestId('execution-panel');
    const map = screen.getByTestId('execution-map');
    const close = screen.getByRole('button', { name: 'بستن پنل عملیات' });
    expect(close.querySelector('path')).toHaveAttribute('d', ICONS.panel_end);
    await user.click(close);
    expect(screen.queryByTestId('execution-panel')).not.toBeInTheDocument();
    const reopen = screen.getByRole('button', { name: 'باز کردن پنل عملیات' });
    expect(reopen.querySelector('path')).toHaveAttribute('d', ICONS.panel_end);
    expect(reopen).toHaveClass('execution-panel-rail');
    expect(getComputedStyle(reopen).alignItems).toBe('flex-start');
    expect(screen.getByTestId('execution-map')).toBe(map);
    await user.click(reopen);
    expect(screen.getByTestId('execution-panel')).toBeInTheDocument();
    expect(screen.getByTestId('execution-map')).toBe(map);
  });

  it('opens a multi-order location and a single-order location', async () => {
    const user = userEvent.setup();
    await renderExecution();
    await screen.findByRole('button', { name: /محدوده ۱/ });
    await user.click(screen.getByRole('button', { name: /محدوده ۱/ }));
    await user.click(screen.getByRole('button', { name: /میرداماد، کوچه نهم، واحد ۳/ }));

    const multi = screen.getByTestId('execution-location-detail');
    expect(multi).toHaveAttribute('data-order-count', '2');
    expect(screen.getByText('سارا موسوی')).toBeInTheDocument();
    expect(screen.getByText('رضا نجفی')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /سارا موسوی/ }));
    expect(screen.getByText('گیرنده')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /میرداماد، کوچه نهم، واحد ۳/ }));
    expect(screen.getByTestId('execution-location-detail')).toBeInTheDocument();
  });

  it('shows a single-order location without a nested order list', async () => {
    const user = userEvent.setup();
    await renderExecution();
    await screen.findByRole('button', { name: /محدوده ۲/ });
    await user.click(screen.getByRole('button', { name: /محدوده ۲/ }));
    await user.click(screen.getByRole('button', { name: /شریعتی/ }));
    const detail = screen.getByTestId('execution-location-detail');
    expect(detail).toHaveAttribute('data-order-count', '1');
    expect(within(detail).getByText('شیرین جعفری')).toBeInTheDocument();
    expect(within(detail).getByText('گیرنده')).toBeInTheDocument();
  });

  it('supports back navigation through area → location → order', async () => {
    const user = userEvent.setup();
    await renderExecution();
    await screen.findByRole('button', { name: /محدوده ۱/ });
    await user.click(screen.getByRole('button', { name: /محدوده ۱/ }));
    await user.click(screen.getByRole('button', { name: /میرداماد، کوچه نهم، واحد ۳/ }));
    await user.click(screen.getByRole('button', { name: /رضا نجفی/ }));
    expect(screen.getAllByText('تحویل‌شده').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /میرداماد، کوچه نهم، واحد ۳/ }));
    expect(screen.getByTestId('execution-location-detail')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'محدوده ۱' }));
    expect(screen.getByText('نقاط تحویل')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'محدوده‌ها' }));
    expect(screen.getByRole('tab', { name: 'محدوده‌ها' })).toHaveAttribute('aria-selected', 'true');
  });

  it('syncs map area selection to the panel', async () => {
    const user = userEvent.setup();
    await renderExecution();
    await screen.findByTestId('execution-map');
    await user.click(screen.getByRole('button', { name: 'map-select-A-01' }));
    expect(screen.getByText('نقاط تحویل')).toBeInTheDocument();
    expect(screen.getByTestId('execution-map')).toHaveAttribute('data-selected-area-id', 'A-01');
  });

  it('opens location detail from the map', async () => {
    const user = userEvent.setup();
    await renderExecution();
    await screen.findByTestId('execution-map');
    await user.click(screen.getByRole('button', { name: 'map-select-S-102' }));
    const detail = await screen.findByTestId('execution-location-detail');
    expect(detail).toHaveAttribute('data-order-count', '2');
    expect(screen.getByTestId('execution-map')).toHaveAttribute('data-selected-area-id', 'A-01');
  });
});

describe('A04 order search', () => {
  it('shows searching then a found pending order', async () => {
    const user = userEvent.setup();
    const { port } = await renderExecution('/plans/P-2404/execution', {
      portSetup: (port) => port.holdNextSearch(),
    });
    await screen.findByRole('button', { name: /محدوده ۱/ });

    const input = screen.getByRole('textbox', { name: 'جستجوی شماره سفارش' });
    await user.type(input, '10123456');
    await user.keyboard('{Enter}');
    expect(await screen.findByLabelText('در حال جستجو')).toBeInTheDocument();
    port.releaseHeldSearch();
    const panel = screen.getByTestId('execution-panel');
    expect(await screen.findByText('علی احمدی')).toBeInTheDocument();
    expect(within(panel).getByText('در انتظار')).toBeInTheDocument();
  });

  it('opens found delivered and follow-up orders', async () => {
    const user = userEvent.setup();
    await renderExecution();
    await screen.findByRole('button', { name: /محدوده ۱/ });
    const input = screen.getByRole('textbox', { name: 'جستجوی شماره سفارش' });

    await user.clear(input);
    await user.type(input, '10123458');
    await user.keyboard('{Enter}');
    expect(await screen.findByText('رضا نجفی')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('execution-panel')).getByText('تحویل‌شده'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'پاک کردن جستجو' }));
    await user.type(input, '10123891');
    await user.keyboard('{Enter}');
    expect(await screen.findByText('محمد رضایی')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('execution-panel')).getAllByText('نیازمند پیگیری').length,
    ).toBeGreaterThan(0);
  });

  it('shows not-found and can clear search', async () => {
    const user = userEvent.setup();
    await renderExecution();
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
    const { port } = await renderExecution('/plans/P-2404/execution');
    await screen.findByRole('tab', { name: /نیازمند پیگیری/ });
    await user.click(screen.getByRole('tab', { name: /نیازمند پیگیری/ }));
    await user.click(await screen.findByRole('button', { name: /محمد رضایی/ }));

    expect(
      within(screen.getByTestId('execution-panel')).getByText('امین رضایی'),
    ).toBeInTheDocument();
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

  it('copies the raw phone and replaces success feedback on repeated copy', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    await renderExecution();
    await screen.findByRole('tab', { name: /نیازمند پیگیری/ });
    await user.click(screen.getByRole('tab', { name: /نیازمند پیگیری/ }));
    await user.click(await screen.findByRole('button', { name: /محمد رضایی/ }));

    expect(screen.getByText('0912-444-0404')).toBeInTheDocument();
    const copyButton = screen.getByRole('button', { name: 'کپی شماره تلفن' });
    vi.useFakeTimers();
    fireEvent.click(copyButton);
    await act(async () => undefined);
    expect(writeText).toHaveBeenCalledWith('09124440404');
    expect(screen.getByText('شماره تلفن کپی شد')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(copyButton);
    await act(async () => undefined);
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText('شماره تلفن کپی شد')).toHaveLength(1);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('شماره تلفن کپی شد')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText('شماره تلفن کپی شد')).not.toBeInTheDocument();
  });

  it('shows error feedback without false success on clipboard failure', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    await renderExecution();
    await screen.findByRole('tab', { name: /نیازمند پیگیری/ });
    await user.click(screen.getByRole('tab', { name: /نیازمند پیگیری/ }));
    await user.click(await screen.findByRole('button', { name: /محمد رضایی/ }));
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'کپی شماره تلفن' }));
    await act(async () => undefined);
    expect(writeText).toHaveBeenCalledWith('09124440404');
    expect(screen.getByText('کپی شماره تلفن ناموفق بود')).toBeInTheDocument();
    expect(screen.queryByText('شماره تلفن کپی شد')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByText('کپی شماره تلفن ناموفق بود')).not.toBeInTheDocument();
    expect(screen.getByText('محمد رضایی')).toBeInTheDocument();
  });

  it('cleans up a pending copy-toast timer on unmount', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const view = await renderExecution();
    await screen.findByRole('tab', { name: /نیازمند پیگیری/ });
    await user.click(screen.getByRole('tab', { name: /نیازمند پیگیری/ }));
    await user.click(await screen.findByRole('button', { name: /محمد رضایی/ }));

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'کپی شماره تلفن' }));
    await act(async () => undefined);
    expect(vi.getTimerCount()).toBe(1);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
