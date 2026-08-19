import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect } from 'vitest';
import { renderDrivers } from './render';

afterEach(() => cleanup());

describe('A06 Drivers — page structure', () => {
  it('renders page heading', async () => {
    await renderDrivers();
    expect(screen.getByRole('heading', { name: 'رانندگان' })).toBeInTheDocument();
  });

  it('shows active/inactive count in subtitle', async () => {
    await renderDrivers();
    const subtitle = document.querySelector('.drv-page-subtitle');
    expect(subtitle?.textContent).toMatch(/راننده فعال/);
    expect(subtitle?.textContent).toMatch(/غیرفعال/);
  });

  it('renders "افزودن راننده" button', async () => {
    await renderDrivers();
    expect(screen.getByRole('button', { name: 'افزودن راننده' })).toBeInTheDocument();
  });

  it('renders search input with accessible label', async () => {
    await renderDrivers();
    expect(screen.getByRole('textbox', { name: 'جستجو در رانندگان' })).toBeInTheDocument();
  });

  it('renders status filter group', async () => {
    await renderDrivers();
    expect(screen.getByRole('group', { name: 'فیلتر وضعیت' })).toBeInTheDocument();
  });

  it('renders table with expected columns', async () => {
    await renderDrivers();
    expect(screen.getByText('راننده')).toBeInTheDocument();
    expect(screen.getByText('شماره تلفن')).toBeInTheDocument();
    expect(screen.getByText('وضعیت')).toBeInTheDocument();
    expect(screen.getByText('دسترسی اپ')).toBeInTheDocument();
    expect(screen.getByText('تخصیص امروز')).toBeInTheDocument();
  });

  it('shows PLANNING_DRIVERS identities in table (not SAMPLE_DRIVERS)', async () => {
    await renderDrivers();
    expect(screen.getByText('محمد قاسمی')).toBeInTheDocument();
    expect(screen.getByText('کاوه میرزایی')).toBeInTheDocument();
  });

  it('shows count label in table footer', async () => {
    await renderDrivers();
    const footer = document.querySelector('.drv-count-label');
    expect(footer?.textContent).toMatch(/راننده/);
  });
});

describe('A06 Drivers — filter and search', () => {
  it('filters to active drivers', async () => {
    await renderDrivers();
    const user = userEvent.setup();
    // Click the segmented control button for "فعال"
    const segBtns = document.querySelectorAll('.drv-seg-opt');
    await user.click(segBtns[1]!); // فعال is index 1
    const activeBadges = screen.getAllByText('فعال');
    expect(activeBadges.length).toBeGreaterThan(0);
  });

  it('filters to inactive drivers', async () => {
    await renderDrivers();
    const user = userEvent.setup();
    const segBtns = document.querySelectorAll('.drv-seg-opt');
    await user.click(segBtns[2]!); // غیرفعال is index 2
    const rows = document.querySelectorAll('.drv-row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('searches by driver name', async () => {
    await renderDrivers();
    const user = userEvent.setup();
    const searchInput = screen.getByRole('textbox', { name: 'جستجو در رانندگان' });
    await user.type(searchInput, 'محمد قاسمی');
    await waitFor(() => {
      expect(screen.getByText('محمد قاسمی')).toBeInTheDocument();
    });
    const rows = document.querySelectorAll('.drv-row');
    expect(rows.length).toBe(1);
  });

  it('searches by driver ID', async () => {
    await renderDrivers();
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'جستجو در رانندگان' }), 'D-001');
    const rows = document.querySelectorAll('.drv-row');
    expect(rows.length).toBe(1);
  });

  it('shows no-result message for unmatched search', async () => {
    await renderDrivers();
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'جستجو در رانندگان' }), 'XXXXXXXX');
    await waitFor(() => {
      expect(screen.getByText(/یافت نشد/)).toBeInTheDocument();
    });
  });

  it('combines search + status filter', async () => {
    await renderDrivers();
    const user = userEvent.setup();
    const segBtns = document.querySelectorAll('.drv-seg-opt');
    await user.click(segBtns[1]!); // فعال
    await user.type(screen.getByRole('textbox', { name: 'جستجو در رانندگان' }), 'D-');
    const rows = document.querySelectorAll('.drv-row');
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('A06 Drivers — detail drawer', () => {
  it('opens drawer on row click', async () => {
    await renderDrivers();
    const user = userEvent.setup();
    await user.click(document.querySelectorAll('.drv-row')[0]!);
    expect(document.querySelector('.drv-drawer')).toBeInTheDocument();
  });

  it('shows correct driver master data in drawer', async () => {
    const { driversPort } = await renderDrivers();
    const user = userEvent.setup();
    const driver = driversPort.listDrivers()[0]!;
    const row = document.querySelectorAll('.drv-row')[0]!;
    await user.click(row);
    const drawer = document.querySelector('.drv-drawer')!;
    expect(drawer).toBeInTheDocument();
    expect(drawer.textContent).toContain(driver.name);
    expect(drawer.textContent).toContain(driver.driverId);
  });

  it('closes drawer with close button', async () => {
    await renderDrivers();
    const user = userEvent.setup();
    await user.click(document.querySelectorAll('.drv-row')[0]!);
    expect(document.querySelector('.drv-drawer')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'بستن کشو' }));
    expect(document.querySelector('.drv-drawer')).not.toBeInTheDocument();
  });

  it('row menu click does not open the row drawer accidentally', async () => {
    await renderDrivers();
    const menuBtn = document.querySelectorAll('.drv-menu-trigger')[1]!;
    fireEvent.click(menuBtn);
    const menu = document.querySelector('.drv-menu');
    expect(menu).toBeInTheDocument();
    // Drawer should not be open from menu click (menu uses stopPropagation)
    expect(document.querySelector('.drv-drawer')).not.toBeInTheDocument();
  });

  it('drawer shows today\'s assignments section', async () => {
    await renderDrivers();
    const user = userEvent.setup();
    await user.click(document.querySelectorAll('.drv-row')[0]!);
    const drawer = document.querySelector('.drv-drawer')!;
    expect(drawer.textContent).toContain('تخصیص‌های امروز');
  });

  it('shows app access section in drawer', async () => {
    await renderDrivers();
    const user = userEvent.setup();
    await user.click(document.querySelectorAll('.drv-row')[0]!);
    const drawer = document.querySelector('.drv-drawer')!;
    expect(drawer.textContent).toContain('دسترسی اپ راننده');
  });
});

describe('A06 Drivers — Add Driver', () => {
  it('opens add dialog on button click', async () => {
    await renderDrivers();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'افزودن راننده' }));
    expect(screen.getByRole('dialog', { name: 'افزودن راننده' })).toBeInTheDocument();
  });

  it('disables submit when name is empty', async () => {
    await renderDrivers();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'افزودن راننده' }));
    // Dialog is open — find button inside dialog
    const dialogBtn = screen.getAllByRole('button', { name: 'افزودن راننده' }).find(
      (btn) => btn.closest('.drv-dialog'),
    );
    expect(dialogBtn).toBeDefined();
    expect(dialogBtn).toBeDisabled();
  });

  it('adds driver to directory on submit', async () => {
    const { driversPort } = await renderDrivers();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'افزودن راننده' }));
    await user.type(screen.getByPlaceholderText('مثال: علی احمدی'), 'راننده جدید');
    await user.type(screen.getByPlaceholderText('09xxxxxxxxx'), '09120000001');
    const before = driversPort.listDrivers().length;
    await user.click(
      screen.getAllByRole('button', { name: 'افزودن راننده' }).find((b) => b.closest('.drv-dialog'))!,
    );
    await waitFor(() => {
      expect(driversPort.listDrivers().length).toBe(before + 1);
    });
  });

  it('phone is stored as string (not number)', async () => {
    const { driversPort } = await renderDrivers();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'افزودن راننده' }));
    await user.type(screen.getByPlaceholderText('مثال: علی احمدی'), 'تست');
    await user.type(screen.getByPlaceholderText('09xxxxxxxxx'), '09121234567');
    await user.click(
      screen.getAllByRole('button', { name: 'افزودن راننده' }).find((b) => b.closest('.drv-dialog'))!,
    );
    await waitFor(() => {
      const newDriver = driversPort.listDrivers().find((d) => d.name === 'تست');
      expect(newDriver).toBeDefined();
      expect(typeof newDriver!.phone).toBe('string');
      expect(newDriver!.phone.startsWith('0')).toBe(true);
    });
  });

  it('new driver has no App Access by default', async () => {
    const { driversPort } = await renderDrivers();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'افزودن راننده' }));
    await user.type(screen.getByPlaceholderText('مثال: علی احمدی'), 'بدون دسترسی');
    await user.click(
      screen.getAllByRole('button', { name: 'افزودن راننده' }).find((b) => b.closest('.drv-dialog'))!,
    );
    await waitFor(() => {
      const d = driversPort.listDrivers().find((dr) => dr.name === 'بدون دسترسی');
      expect(d?.appAccessStatus).toBe('none');
    });
  });

  it('shows info message about app access in add dialog', async () => {
    await renderDrivers();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'افزودن راننده' }));
    expect(screen.getByText(/دسترسی اپ راننده را می‌توان پس از ثبت/)).toBeInTheDocument();
  });
});

describe('A06 Drivers — Edit Driver', () => {
  it('edit does not change driverId', async () => {
    const { driversPort } = await renderDrivers();
    const user = userEvent.setup();
    const driver = driversPort.listDrivers()[0]!;
    const originalId = driver.driverId;

    // Open menu
    const menuBtn = document.querySelectorAll('.drv-menu-trigger')[0]!;
    await user.click(menuBtn);
    await user.click(screen.getByRole('menuitem', { name: 'ویرایش مشخصات' }));

    const nameInput = screen.getByDisplayValue(driver.name);
    await user.clear(nameInput);
    await user.type(nameInput, 'نام جدید');
    await user.click(screen.getByRole('button', { name: 'ذخیره تغییرات' }));

    await waitFor(() => {
      const updated = driversPort.getDriver(originalId);
      expect(updated?.driverId).toBe(originalId);
      expect(updated?.name).toBe('نام جدید');
    });
  });

  it('edit does not change operational status or app access', async () => {
    const { driversPort } = await renderDrivers();
    const driver = driversPort.listDrivers()[0]!;
    const user = userEvent.setup();

    const menuBtn = document.querySelectorAll('.drv-menu-trigger')[0]!;
    await user.click(menuBtn);
    await user.click(screen.getByRole('menuitem', { name: 'ویرایش مشخصات' }));
    await user.click(screen.getByRole('button', { name: 'ذخیره تغییرات' }));

    await waitFor(() => {
      const updated = driversPort.getDriver(driver.driverId);
      expect(updated?.operationalStatus).toBe(driver.operationalStatus);
      expect(updated?.appAccessStatus).toBe(driver.appAccessStatus);
    });
  });
});

describe('A06 Drivers — no hard delete', () => {
  it('has no delete button in row menu', async () => {
    await renderDrivers();
    const menuBtn = document.querySelectorAll('.drv-menu-trigger')[0]!;
    fireEvent.click(menuBtn);
    expect(screen.queryByRole('menuitem', { name: /حذف/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /delete/i })).not.toBeInTheDocument();
  });
});
