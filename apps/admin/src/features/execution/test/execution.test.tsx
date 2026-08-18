import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { createExecutionTestPort } from '@/features/execution/data/fixture-port';
import { renderExecution } from '@/features/execution/test/render';

describe('A04 execution workspace', () => {
  it('is plan-scoped at /plans/:planId/execution with Stage 4 active', async () => {
    const { router } = renderExecution();
    await screen.findByRole('button', { name: /محدوده ۱/ });
    expect(router.state.location.pathname).toBe('/plans/P-2403/execution');
    expect(screen.getByRole('link', { current: 'page', name: 'اجرا و پیگیری' })).toBeInTheDocument();
    expect(screen.queryByText('A04 — STATE EXPLORER')).not.toBeInTheDocument();
    expect(screen.queryByText('MAP REFERENCE · A04')).not.toBeInTheDocument();
  });

  it('shows loading without flashing order counts', async () => {
    const port = createExecutionTestPort();
    port.setWorkspacePreset('loading');
    renderExecution('/plans/P-2403/execution', port);
    expect(await screen.findByText('در حال بارگذاری')).toBeInTheDocument();
    expect(screen.queryByText('سفارش')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /محدوده ۱/ })).not.toBeInTheDocument();
  });

  it('shows load error with retry', async () => {
    const user = userEvent.setup();
    const port = createExecutionTestPort();
    port.setWorkspacePreset('load-error');
    renderExecution('/plans/P-2403/execution', port);
    expect(await screen.findByText('خطا در بارگذاری')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تلاش مجدد' })).toBeInTheDocument();
    port.setWorkspacePreset('live');
    await user.click(screen.getByRole('button', { name: 'تلاش مجدد' }));
    expect(await screen.findByRole('button', { name: /محدوده ۱/ })).toBeInTheDocument();
  });

  it('shows no published plan', async () => {
    const port = createExecutionTestPort();
    port.setWorkspacePreset('no-plan');
    renderExecution('/plans/P-2404/execution', port);
    expect(await screen.findByText('برنامه‌ای منتشر نشده')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /محدوده ۱/ })).not.toBeInTheDocument();
  });

  it('shows not-started distinctly from no published plan', async () => {
    const port = createExecutionTestPort();
    port.setWorkspacePreset('not-started');
    renderExecution('/plans/P-2403/execution', port);
    expect((await screen.findAllByText('شروع نشده')).length).toBeGreaterThan(0);
    expect(screen.getByText('برنامه منتشر شده — هنوز هیچ تحویلی ثبت نشده است.')).toBeInTheDocument();
    expect(screen.queryByText('برنامه‌ای منتشر نشده')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /محدوده ۱/ })).toBeInTheDocument();
  });

  it('shows live in-progress execution with derived counts', async () => {
    renderExecution();
    await screen.findByRole('button', { name: /محدوده ۱/ });
    const summary = screen.getByLabelText('خلاصه اجرا');
    expect(within(summary).getByText('در حال اجرا')).toBeInTheDocument();
    expect(summary).toHaveTextContent('سفارش');
    expect(summary).toHaveTextContent('تحویل‌شده');
    expect(summary).toHaveTextContent('در انتظار');
    expect(summary).toHaveTextContent('نیازمند پیگیری');
  });

  it('shows completed execution from domain state', async () => {
    const port = createExecutionTestPort();
    port.setWorkspacePreset('completed');
    renderExecution('/plans/P-2403/execution', port);
    expect((await screen.findAllByText('تکمیل شده')).length).toBeGreaterThan(0);
    expect(screen.getByText(/اجرا تکمیل شد/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /محدوده ۱/ })).toBeInTheDocument();
  });

  it('keeps visible data during background refresh', async () => {
    const port = createExecutionTestPort();
    port.setWorkspacePreset('bg-refresh');
    renderExecution('/plans/P-2403/execution', port);
    expect(await screen.findByRole('button', { name: /محدوده ۱/ })).toBeInTheDocument();
    expect(screen.getByText('در حال بروزرسانی…')).toBeInTheDocument();
    expect(screen.queryByText('در حال بارگذاری')).not.toBeInTheDocument();
  });

  it('shows unpublished working revision banner without replacing published data', async () => {
    const port = createExecutionTestPort();
    port.setWorkspacePreset('new-revision');
    renderExecution('/plans/P-2403/execution', port);
    expect(
      await screen.findByText(/تغییرات منتشرنشده‌ای برای این برنامه وجود دارد/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /محدوده ۱/ })).toBeInTheDocument();
    expect(screen.getByText('حسین موسوی')).toBeInTheDocument();
  });
});

describe('A04 system notices', () => {
  it('shows network, server, conflict, and recovered banners over existing data', async () => {
    const port = createExecutionTestPort();
    renderExecution('/plans/P-2403/execution', port);
    await screen.findByRole('button', { name: /محدوده ۱/ });

    port.setSystemNotice('network-error');
    expect(await screen.findByText(/خطای شبکه/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /محدوده ۱/ })).toBeInTheDocument();

    port.setSystemNotice('server-error');
    expect(await screen.findByText(/خطای سرور/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /محدوده ۱/ })).toBeInTheDocument();

    port.setSystemNotice('conflict');
    expect(await screen.findByText(/تعارض نسخه/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /محدوده ۱/ })).toBeInTheDocument();

    port.setSystemNotice('recovered');
    expect(await screen.findByText(/اتصال برقرار شد/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /محدوده ۱/ })).toBeInTheDocument();
  });
});

describe('A04 map/panel selection contract', () => {
  it('keeps selected area in map props when opening area detail from the panel', async () => {
    const user = userEvent.setup();
    renderExecution();
    await screen.findByTestId('execution-map');
    await user.click(screen.getByRole('button', { name: /محدوده ۱/ }));
    expect(screen.getByText('نقاط تحویل')).toBeInTheDocument();
    expect(screen.getByTestId('execution-map')).toHaveAttribute('data-selected-area-id', 'area-1');
  });
});
