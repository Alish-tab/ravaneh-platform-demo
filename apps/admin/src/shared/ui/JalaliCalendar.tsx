import { useState } from 'react';

import {
  jalaliDaysInMonth,
  jalaliFirstDayOfWeek,
  JALALI_MONTHS,
  JALALI_WEEK_DAYS,
  type JalaliDate,
} from '@/shared/date/jalali';
import { toPersianDigits } from '@/shared/lib/format';

type Props = {
  viewYM: [number, number];
  onViewYMChange: (ym: [number, number]) => void;
  selected: JalaliDate | null;
  todayJ: JalaliDate;
  onSelect: (d: JalaliDate) => void;
};

export function JalaliCalendar({ viewYM, onViewYMChange, selected, todayJ, onSelect }: Props) {
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('day');
  const [yearRangeStart, setYearRangeStart] = useState(() => viewYM[0] - 5);
  const [y, m] = viewYM;
  const daysInMonth = jalaliDaysInMonth(y, m);
  const firstDow = jalaliFirstDayOfWeek(y, m);

  const prevMonth = () => onViewYMChange(m === 1 ? [y - 1, 12] : [y, m - 1]);
  const nextMonth = () => onViewYMChange(m === 12 ? [y + 1, 1] : [y, m + 1]);
  const previous = () => {
    if (viewMode === 'year') {
      setYearRangeStart((start) => start - 12);
      return;
    }
    prevMonth();
  };
  const next = () => {
    if (viewMode === 'year') {
      setYearRangeStart((start) => start + 12);
      return;
    }
    nextMonth();
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d: number) =>
    selected !== null && selected[0] === y && selected[1] === m && selected[2] === d;
  const isToday = (d: number) => todayJ[0] === y && todayJ[1] === m && todayJ[2] === d;

  return (
    <div
      role="group"
      aria-label="تقویم جلالی"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-lg)',
        padding: 12,
        width: 244,
        userSelect: 'none',
      }}
    >
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <button
          type="button"
          onClick={next}
          aria-label={viewMode === 'year' ? 'دوره سال بعد' : 'ماه بعد'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '4px 6px',
            borderRadius: 'var(--r-xs)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ›
        </button>
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          <button
            type="button"
            aria-label="انتخاب ماه"
            aria-expanded={viewMode === 'month'}
            onClick={() => setViewMode(viewMode === 'month' ? 'day' : 'month')}
            style={{
              background: 'none',
              border: 'none',
              borderRadius: 'var(--r-xs)',
              color: 'inherit',
              cursor: 'pointer',
              font: 'inherit',
              padding: '3px 4px',
            }}
          >
            {JALALI_MONTHS[m - 1]}
          </button>
          <button
            type="button"
            aria-label="انتخاب سال"
            aria-expanded={viewMode === 'year'}
            onClick={() => {
              setYearRangeStart(y - 5);
              setViewMode(viewMode === 'year' ? 'day' : 'year');
            }}
            style={{
              background: 'none',
              border: 'none',
              borderRadius: 'var(--r-xs)',
              color: 'inherit',
              cursor: 'pointer',
              font: 'inherit',
              padding: '3px 4px',
            }}
          >
            {toPersianDigits(y)}
          </button>
        </div>
        <button
          type="button"
          onClick={previous}
          aria-label={viewMode === 'year' ? 'دوره سال قبل' : 'ماه قبل'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '4px 6px',
            borderRadius: 'var(--r-xs)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ‹
        </button>
      </div>

      {viewMode === 'month' ? (
        <div
          aria-label="ماه‌های جلالی"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}
        >
          {JALALI_MONTHS.map((month, index) => (
            <button
              key={month}
              type="button"
              aria-pressed={m === index + 1}
              onClick={() => {
                onViewYMChange([y, index + 1]);
                setViewMode('day');
              }}
              style={{
                background: m === index + 1 ? 'var(--bg-surface)' : 'none',
                border: 'none',
                borderRadius: 'var(--r-xs)',
                color: m === index + 1 ? 'var(--accent-text)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'Vazirmatn, system-ui, sans-serif',
                fontSize: 11,
                padding: '7px 2px',
              }}
            >
              {month}
            </button>
          ))}
        </div>
      ) : viewMode === 'year' ? (
        <div
          aria-label="سال‌های جلالی"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}
        >
          {Array.from({ length: 12 }, (_, index) => yearRangeStart + index).map((year) => (
            <button
              key={year}
              type="button"
              aria-pressed={y === year}
              onClick={() => {
                onViewYMChange([year, m]);
                setViewMode('day');
              }}
              style={{
                background: y === year ? 'var(--bg-surface)' : 'none',
                border: 'none',
                borderRadius: 'var(--r-xs)',
                color: y === year ? 'var(--accent-text)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'Vazirmatn, system-ui, sans-serif',
                fontSize: 11,
                padding: '7px 2px',
              }}
            >
              {toPersianDigits(year)}
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Week day headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2,
              marginBottom: 4,
            }}
          >
            {JALALI_WEEK_DAYS.map((wd) => (
              <div
                key={wd}
                style={{
                  textAlign: 'center',
                  fontSize: 10.5,
                  color: 'var(--text-disabled)',
                  padding: '2px 0',
                  fontWeight: 600,
                }}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((d, i) =>
              d === null ? (
                <div key={`e-${i}`} />
              ) : (
                <button
                  type="button"
                  key={d}
                  onClick={() => onSelect([y, m, d])}
                  aria-label={`${toPersianDigits(d)} ${JALALI_MONTHS[m - 1]}`}
                  aria-pressed={isSelected(d)}
                  style={{
                    padding: '5px 0',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 'var(--r-xs)',
                    fontSize: 12,
                    fontFamily: 'Vazirmatn, system-ui, sans-serif',
                    textAlign: 'center',
                    background: isSelected(d)
                      ? 'var(--accent)'
                      : isToday(d)
                        ? 'var(--bg-surface)'
                        : 'none',
                    color: isSelected(d)
                      ? 'white'
                      : isToday(d)
                        ? 'var(--accent-text)'
                        : 'var(--text-secondary)',
                    fontWeight: isSelected(d) || isToday(d) ? 600 : 400,
                    outline: isToday(d) && !isSelected(d) ? '1px solid var(--accent)' : 'none',
                    transition: 'background 0.1s, color 0.1s',
                  }}
                >
                  {toPersianDigits(d)}
                </button>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
