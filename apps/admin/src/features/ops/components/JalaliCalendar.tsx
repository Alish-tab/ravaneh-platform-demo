import {
  jalaliDaysInMonth,
  jalaliFirstDayOfWeek,
  JALALI_MONTHS,
  JALALI_WEEK_DAYS,
  type JalaliDate,
} from '@/features/ops/lib/jalali';
import { toPersianDigits } from '@/shared/lib/format';

type Props = {
  viewYM: [number, number];
  onViewYMChange: (ym: [number, number]) => void;
  selected: JalaliDate | null;
  todayJ: JalaliDate;
  onSelect: (d: JalaliDate) => void;
};

export function JalaliCalendar({ viewYM, onViewYMChange, selected, todayJ, onSelect }: Props) {
  const [y, m] = viewYM;
  const daysInMonth = jalaliDaysInMonth(y, m);
  const firstDow = jalaliFirstDayOfWeek(y, m);

  const prevMonth = () =>
    onViewYMChange(m === 1 ? [y - 1, 12] : [y, m - 1]);
  const nextMonth = () =>
    onViewYMChange(m === 12 ? [y + 1, 1] : [y, m + 1]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d: number) =>
    selected !== null && selected[0] === y && selected[1] === m && selected[2] === d;
  const isToday = (d: number) =>
    todayJ[0] === y && todayJ[1] === m && todayJ[2] === d;

  return (
    <div
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
          onClick={nextMonth}
          aria-label="ماه بعد"
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
        <span
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {JALALI_MONTHS[m - 1]} {toPersianDigits(y)}
        </span>
        <button
          onClick={prevMonth}
          aria-label="ماه قبل"
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
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}
      >
        {cells.map((d, i) =>
          d === null ? (
            <div key={`e-${i}`} />
          ) : (
            <button
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
                outline:
                  isToday(d) && !isSelected(d)
                    ? '1px solid var(--accent)'
                    : 'none',
                transition: 'background 0.1s, color 0.1s',
              }}
            >
              {toPersianDigits(d)}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
