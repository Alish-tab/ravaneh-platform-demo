import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { JalaliCalendar } from '@/shared/ui/JalaliCalendar';
import { JALALI_MONTHS, type JalaliDate } from '@/shared/date/jalali';
import { toPersianDigits } from '@/shared/lib/format';

function CalendarHarness({ onSelect }: { onSelect: (date: JalaliDate) => void }) {
  const [viewYM, setViewYM] = useState<[number, number]>([1405, 5]);

  return (
    <JalaliCalendar
      viewYM={viewYM}
      onViewYMChange={setViewYM}
      selected={[1405, 5, 29]}
      todayJ={[1405, 5, 29]}
      onSelect={onSelect}
    />
  );
}

describe('JalaliCalendar', () => {
  it('switches month and year views without committing until a day is selected', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CalendarHarness onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'انتخاب ماه' }));
    const monthPicker = screen.getByLabelText('ماه‌های جلالی');
    expect(within(monthPicker).getAllByRole('button')).toHaveLength(12);
    await user.click(within(monthPicker).getByRole('button', { name: JALALI_MONTHS[6] }));
    expect(screen.getByRole('button', { name: 'انتخاب ماه' })).toHaveTextContent(JALALI_MONTHS[6]);
    expect(onSelect).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'انتخاب سال' }));
    const yearPicker = screen.getByLabelText('سال‌های جلالی');
    expect(within(yearPicker).getAllByRole('button')).toHaveLength(12);
    await user.click(within(yearPicker).getByRole('button', { name: toPersianDigits(1406) }));
    expect(screen.getByRole('button', { name: 'انتخاب سال' })).toHaveTextContent(
      toPersianDigits(1406),
    );
    expect(onSelect).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', {
        name: `${toPersianDigits(10)} ${JALALI_MONTHS[6]}`,
      }),
    );
    expect(onSelect).toHaveBeenCalledWith([1406, 7, 10]);
  });
});
