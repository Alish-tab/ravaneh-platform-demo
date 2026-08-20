/**
 * A05 — Operations Home / عملیات جاری
 *
 * Cross-plan operations control tower. Aggregates Plans, Execution, and Follow-up data
 * from existing A01–A04 product spines. This is a read-oriented aggregation view.
 *
 * Product rules:
 * - Two internal tabs: برنامه‌ها / پیگیری‌ها (not global navigation)
 * - Global Order search is cross-plan and independent of date or tab selection
 * - Follow-up backlog is global and NOT filtered by Programs date
 * - "Today" comes from real current date, never hardcoded
 * - No mutation of Plan data, No Follow-up editing, No Review/Planning actions
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { JalaliCalendar } from '@/shared/ui/JalaliCalendar';
import {
  addDaysToJalali,
  dateToJalali,
  jalaliDayLabel,
  jalaliShortLabel,
  jalaliSortKey,
  relativeDayLabel,
  type JalaliDate,
} from '@/shared/date/jalali';
import type {
  OpsDateSummary,
  OpsFollowupItem,
  OpsProgramRow,
  OpsSearchResult,
} from '@/features/ops/model/types';
import { OpsDataProvider } from '@/features/ops/port/OpsDataProvider';
import { useOpsPort, useOpsVersion } from '@/features/ops/port/useOpsData';
import { toPersianDigits } from '@/shared/lib/format';

// ─── Exec status helpers ──────────────────────────────────────────────────────
function execStatusLabel(s: OpsProgramRow['execStatus']): string {
  return (
    {
      active: 'در حال اجرا',
      ready: 'آماده اجرا',
      completed: 'تکمیل‌شده',
      'needs-prep': 'نیازمند آماده‌سازی',
    }[s] ?? s
  );
}

function execStatusStyle(s: OpsProgramRow['execStatus']): {
  bg: string;
  color: string;
  dot: string;
  pulse: boolean;
} {
  switch (s) {
    case 'active':
      return {
        bg: 'rgba(61,123,212,0.15)',
        color: 'var(--info-text)',
        dot: '#3d7bd4',
        pulse: true,
      };
    case 'ready':
      return {
        bg: 'var(--success-muted)',
        color: 'var(--success-text)',
        dot: '#2b9d6f',
        pulse: false,
      };
    case 'completed':
      return {
        bg: 'rgba(74,94,120,0.18)',
        color: 'var(--text-secondary)',
        dot: '#4a5e78',
        pulse: false,
      };
    case 'needs-prep':
      return {
        bg: 'rgba(74,94,120,0.12)',
        color: 'var(--text-muted)',
        dot: '#324055',
        pulse: false,
      };
  }
}

function uiStatusStyle(s: OpsSearchResult['uiStatus']): { bg: string; color: string } {
  switch (s) {
    case 'followup':
      return { bg: 'var(--warning-muted)', color: 'var(--warning-text)' };
    case 'delivered':
      return { bg: 'var(--success-muted)', color: 'var(--success-text)' };
    case 'pending':
      return { bg: 'rgba(74,94,120,0.15)', color: 'var(--text-secondary)' };
  }
}

function agePillStyle(daysPast: number): { bg: string; color: string; border: string } {
  if (daysPast === 0)
    return {
      bg: 'var(--warning-muted)',
      color: 'var(--warning-text)',
      border: '1px solid rgba(201,144,53,0.22)',
    };
  if (daysPast >= 4)
    return {
      bg: 'rgba(196,68,68,0.1)',
      color: 'var(--error-text)',
      border: '1px solid rgba(196,68,68,0.22)',
    };
  return {
    bg: 'rgba(74,94,120,0.15)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-subtle)',
  };
}

// ─── Operational sort ─────────────────────────────────────────────────────────
function sortPrograms(rows: OpsProgramRow[], isFuture: boolean): OpsProgramRow[] {
  if (isFuture) {
    return [...rows].sort((a, b) => a.windowSortKey - b.windowSortKey);
  }
  const order: OpsProgramRow['execStatus'][] = ['active', 'ready', 'completed', 'needs-prep'];
  return [...rows].sort((a, b) => {
    const od = order.indexOf(a.execStatus) - order.indexOf(b.execStatus);
    if (od !== 0) return od;
    return a.windowSortKey - b.windowSortKey;
  });
}

// ─── Inner page (consumes OpsHomePort via context) ────────────────────────────
function OpsPageInner() {
  const port = useOpsPort();
  const navigate = useNavigate();
  useOpsVersion(); // Re-render when underlying data changes.

  // ── Today derived from real current date ──────────────────────────────────
  const todayJ = dateToJalali(new Date());
  const tomorrowJ = addDaysToJalali(todayJ, 1);

  type DateTab = 'today' | 'tomorrow' | 'custom';
  type MainTab = 'programs' | 'followups';

  const [mainTab, setMainTab] = useState<MainTab>('programs');
  const [dateTab, setDateTab] = useState<DateTab>('today');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calViewYM, setCalViewYM] = useState<[number, number]>([todayJ[0], todayJ[1]]);
  const [customDate, setCustomDate] = useState<JalaliDate | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // ── Data states ───────────────────────────────────────────────────────────
  const [programs, setPrograms] = useState<OpsProgramRow[]>([]);
  const [summary, setSummary] = useState<OpsDateSummary | null>(null);
  const [followups, setFollowups] = useState<OpsFollowupItem[]>([]);
  const [todayBlockerCount, setTodayBlockerCount] = useState(0);
  const [searchResults, setSearchResults] = useState<OpsSearchResult[]>([]);

  type LoadState = 'idle' | 'loading' | 'error' | 'ready';
  const [programsState, setProgramsState] = useState<LoadState>('idle');
  const [followupsState, setFollowupsState] = useState<LoadState>('idle');
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  // ── Selected date as Jalali sort key ─────────────────────────────────────
  const selectedJ: JalaliDate =
    dateTab === 'today' ? todayJ : dateTab === 'tomorrow' ? tomorrowJ : (customDate ?? todayJ);
  const selectedSortKey = jalaliSortKey(selectedJ);
  const todaySortKey = jalaliSortKey(todayJ);
  const isFuture = selectedSortKey > todaySortKey;

  // ── Load programs when date changes ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await Promise.resolve(); // yield to React before mutating state
      if (cancelled) return;
      setProgramsState('loading');
      try {
        const [rows, sum] = await Promise.all([
          port.getProgramsForDate(selectedSortKey),
          port.getSummaryForDate(selectedSortKey),
        ]);
        if (!cancelled) {
          setPrograms(rows);
          setSummary(sum);
          setProgramsState('ready');
        }
      } catch {
        if (!cancelled) setProgramsState('error');
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [port, selectedSortKey]);

  // ── Load today's blocker count ────────────────────────────────────────────
  useEffect(() => {
    port.getTodayBlockerCount(todaySortKey).then(setTodayBlockerCount).catch(() => {
      setTodayBlockerCount(0);
    });
  }, [port, todaySortKey]);

  // ── Load global follow-ups (independent of date) ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      if (cancelled) return;
      setFollowupsState('loading');
      try {
        const items = await port.getOpenFollowups();
        if (!cancelled) {
          setFollowups(items);
          setFollowupsState('ready');
        }
      } catch {
        if (!cancelled) setFollowupsState('error');
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [port]);

  // ── Search (debounced, cross-plan) ────────────────────────────────────────
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = searchQuery.trim();
    if (!q) {
      searchTimer.current = setTimeout(() => {
        setSearchResults([]);
        setSearchState('idle');
      }, 0);
      return;
    }
    searchTimer.current = setTimeout(() => {
      setSearchState('loading');
      port
        .searchOrder(q)
        .then((results) => {
          setSearchResults(results);
          setSearchState('ready');
        })
        .catch(() => setSearchState('error'));
    }, 250);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [port, searchQuery]);

  // ── Date helpers ──────────────────────────────────────────────────────────
  const dateLabel = jalaliDayLabel(selectedJ, toPersianDigits);
  const sectionShort = jalaliShortLabel(selectedJ, toPersianDigits);

  const handleCustomSelect = (d: JalaliDate) => {
    setCustomDate(d);
    setCalendarOpen(false);
    setDateTab('custom');
  };

  const handleDateTabClick = (t: DateTab) => {
    if (t === 'custom') {
      setCalendarOpen((v) => !v);
    } else {
      setDateTab(t);
      setCalendarOpen(false);
    }
  };

  // setCalendarOpen is a stable setter from useState — safe without deps.
  const closeCalendar = useCallback(() => setCalendarOpen(false), [setCalendarOpen]);

  // ── Search open state ─────────────────────────────────────────────────────
  const showSearchDropdown = searchQuery.length >= 2 && searchFocused;

  // ── Follow-up counts ──────────────────────────────────────────────────────
  const fuToday = followups.filter((f) => f.daysPast === 0).length;
  const fuYesterday = followups.filter((f) => f.daysPast === 1).length;
  const fuOlder = followups.filter((f) => f.daysPast >= 2).length;

  // ── Programs ──────────────────────────────────────────────────────────────
  const sorted = sortPrograms(programs, isFuture);
  const readinessPlanCount = programs.filter(
    (r) => r.readinessNote || !r.isPublished,
  ).length;

  return (
    <div
      style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-base)' }}
      onClick={closeCalendar}
      role="presentation"
      data-testid="ops-page"
    >
      <div
        style={{ maxWidth: 1100, margin: '0 auto', padding: '22px 28px 48px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Page header ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 18 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            عملیات جاری
          </h1>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            1. GLOBAL ORDER SEARCH — independent of date and tab
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{ position: 'relative', marginBottom: 18 }}>
          <div
            role="search"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--bg-elevated)',
              border: `1px solid ${searchFocused ? 'var(--border-focus)' : 'var(--border-default)'}`,
              borderRadius: 'var(--r-md)',
              padding: '8px 14px',
              boxShadow: searchFocused ? '0 0 0 2px var(--accent-dim)' : 'none',
              transition: 'border-color 0.12s, box-shadow 0.12s',
            }}
          >
            <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: 14 }}>⌕</span>
            <input
              aria-label="جستجوی شماره سفارش در همه برنامه‌ها"
              aria-autocomplete="list"
              aria-expanded={showSearchDropdown}
              aria-controls={showSearchDropdown ? 'ops-search-results' : undefined}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
              placeholder="جستجوی شماره سفارش در همه برنامه‌ها…"
              data-testid="ops-search-input"
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontFamily: 'Vazirmatn, system-ui, sans-serif',
                direction: 'ltr',
                textAlign: 'right',
              }}
            />
            {searchQuery && (
              <button
                aria-label="پاک کردن جستجو"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {showSearchDropdown && (
            <div
              id="ops-search-results"
              role="listbox"
              aria-label="نتایج جستجو"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                insetInlineStart: 0,
                insetInlineEnd: 0,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--r-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                overflow: 'hidden',
              }}
              data-testid="ops-search-dropdown"
            >
              {searchState === 'loading' && (
                <div
                  style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 8 }}
                  data-testid="ops-search-loading"
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      border: '1.5px solid var(--accent)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'ops-spin 0.7s linear infinite',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>در حال جستجو…</span>
                </div>
              )}

              {searchState === 'error' && (
                <div
                  style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--error-text)' }}
                  data-testid="ops-search-error"
                >
                  خطا در جستجو
                </div>
              )}

              {searchState === 'ready' && searchResults.length === 0 && (
                <div
                  style={{
                    padding: '12px 14px',
                    fontSize: 12.5,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                  }}
                  data-testid="ops-search-no-result"
                >
                  سفارشی با این مشخصات یافت نشد
                </div>
              )}

              {searchState === 'ready' && searchResults.length === 1 && searchResults[0] && (
                <SearchResultSingle
                  result={searchResults[0]}
                  onOpen={(r) => {
                    navigate(`/plans/${r.planId}/execution?orderId=${encodeURIComponent(r.orderId)}`);
                  }}
                />
              )}

              {searchState === 'ready' && searchResults.length > 1 && (
                <SearchResultMultiple
                  results={searchResults}
                  onOpen={(r) => {
                    navigate(`/plans/${r.planId}/execution?orderId=${encodeURIComponent(r.orderId)}`);
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. INTERNAL TABS — برنامه‌ها / پیگیری‌ها
        ══════════════════════════════════════════════════════════════════ */}
        <div
          role="tablist"
          aria-label="بخش‌های عملیات جاری"
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-default)',
            marginBottom: 18,
          }}
        >
          {(
            [
              { key: 'programs' as MainTab, label: 'برنامه‌ها', badge: null },
              { key: 'followups' as MainTab, label: 'پیگیری‌ها', badge: followups.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={mainTab === tab.key}
              aria-controls={`ops-tab-panel-${tab.key}`}
              id={`ops-tab-${tab.key}`}
              onClick={() => setMainTab(tab.key)}
              data-testid={`ops-tab-${tab.key}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'Vazirmatn, system-ui, sans-serif',
                fontSize: 13,
                fontWeight: mainTab === tab.key ? 600 : 400,
                color:
                  mainTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom:
                  mainTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 0.12s, border-color 0.12s',
              }}
            >
              {tab.label}
              {tab.badge !== null && tab.badge > 0 && (
                <span
                  aria-label={`${toPersianDigits(tab.badge)} مورد`}
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    minWidth: 18,
                    height: 18,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                    borderRadius: 9,
                    background:
                      mainTab === tab.key ? 'var(--accent-dim)' : 'var(--bg-surface)',
                    color:
                      mainTab === tab.key ? 'var(--accent-text)' : 'var(--text-muted)',
                    border:
                      mainTab === tab.key
                        ? '1px solid rgba(61,123,212,0.25)'
                        : '1px solid var(--border-subtle)',
                    transition: 'background 0.12s, color 0.12s',
                  }}
                >
                  {toPersianDigits(tab.badge)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. PROGRAMS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {mainTab === 'programs' && (
          <div
            role="tabpanel"
            id="ops-tab-panel-programs"
            aria-labelledby="ops-tab-programs"
            data-testid="ops-programs-tab"
          >
            {/* Date switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div style={{ position: 'relative' }}>
                <div
                  role="group"
                  aria-label="انتخاب تاریخ"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--r-sm)',
                    padding: 2,
                  }}
                >
                  {(
                    [
                      { key: 'today' as DateTab, label: 'امروز' },
                      { key: 'tomorrow' as DateTab, label: 'فردا' },
                      {
                        key: 'custom' as DateTab,
                        label: customDate
                          ? jalaliShortLabel(customDate, toPersianDigits)
                          : 'انتخاب تاریخ',
                      },
                    ] as const
                  ).map((t) => {
                    const isActive =
                      dateTab === t.key && (t.key !== 'custom' || customDate !== null);
                    const isCalBtn = t.key === 'custom';
                    return (
                      <button
                        key={t.key}
                        aria-pressed={isActive}
                        aria-label={t.label}
                        onClick={() => handleDateTabClick(t.key)}
                        data-testid={`ops-date-${t.key}`}
                        style={{
                          padding: '4px 11px',
                          fontSize: 12.5,
                          fontWeight: isActive ? 600 : 400,
                          color:
                            isActive
                              ? 'var(--text-primary)'
                              : calendarOpen && isCalBtn
                                ? 'var(--accent-text)'
                                : 'var(--text-muted)',
                          background:
                            isActive
                              ? 'var(--bg-elevated)'
                              : calendarOpen && isCalBtn
                                ? 'var(--accent-dim)'
                                : 'transparent',
                          border: 'none',
                          borderRadius: 'calc(var(--r-sm) - 1px)',
                          cursor: 'pointer',
                          fontFamily: 'Vazirmatn, system-ui, sans-serif',
                          transition: 'background 0.1s, color 0.1s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                {calendarOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      insetInlineStart: 0,
                      zIndex: 60,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <JalaliCalendar
                      viewYM={calViewYM}
                      onViewYMChange={setCalViewYM}
                      selected={customDate}
                      todayJ={todayJ}
                      onSelect={handleCustomSelect}
                    />
                  </div>
                )}
              </div>

              {dateLabel && (
                <span
                  style={{ fontSize: 12, color: 'var(--text-muted)' }}
                  data-testid="ops-date-label"
                >
                  {dateLabel}
                </span>
              )}

              {/* Urgent-today indicator: shown when browsing future and today has blockers */}
              {isFuture && todayBlockerCount > 0 && (
                <button
                  onClick={() => {
                    setDateTab('today');
                    setCalendarOpen(false);
                  }}
                  aria-label={`${toPersianDigits(todayBlockerCount)} اقدام فوری برای امروز`}
                  data-testid="ops-urgent-today"
                  style={{
                    marginInlineStart: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'rgba(196,68,68,0.08)',
                    border: '1px solid rgba(196,68,68,0.22)',
                    color: 'var(--error-text)',
                    fontSize: 11.5,
                    padding: '3px 10px',
                    borderRadius: 'var(--r-sm)',
                    cursor: 'pointer',
                    fontFamily: 'Vazirmatn, system-ui, sans-serif',
                    transition: 'background 0.1s',
                  }}
                >
                  ⚠ {toPersianDigits(todayBlockerCount)} اقدام فوری امروز
                </button>
              )}
            </div>

            {/* Programs content */}
            {programsState === 'loading' && (
              <div
                style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-muted)' }}
                data-testid="ops-programs-loading"
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 18,
                    height: 18,
                    border: '2px solid var(--accent)',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'ops-spin 0.7s linear infinite',
                  }}
                />
              </div>
            )}

            {programsState === 'error' && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--r-sm)',
                  background: 'rgba(196,68,68,0.08)',
                  border: '1px solid rgba(196,68,68,0.22)',
                  color: 'var(--error-text)',
                  fontSize: 12.5,
                }}
                data-testid="ops-programs-error"
              >
                خطا در بارگذاری برنامه‌ها
              </div>
            )}

            {programsState === 'ready' && (
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--r-md)',
                  overflow: 'hidden',
                  marginBottom: 14,
                }}
              >
                {/* Readiness warning strip */}
                {readinessPlanCount > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 14px',
                      background: 'rgba(201,144,53,0.06)',
                      borderBottom: '1px solid rgba(201,144,53,0.18)',
                    }}
                    data-testid="ops-readiness-banner"
                  >
                    <span
                      style={{
                        color: 'var(--warning-text)',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      ⚠
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--warning-text)' }}>
                      {toPersianDigits(readinessPlanCount)} برنامه در این تاریخ قبل از اجرا نیازمند
                      اقدام‌اند.
                    </span>
                  </div>
                )}

                {/* Compact summary row */}
                {summary && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                    data-testid="ops-summary-row"
                  >
                    {(
                      isFuture
                        ? [
                            { label: 'برنامه‌ها', value: toPersianDigits(summary.planCount) },
                            {
                              label: 'سفارش‌ها',
                              value: toPersianDigits(summary.totalOrders),
                            },
                            {
                              label: 'آماده اجرا',
                              value: toPersianDigits(summary.readyCount),
                              color: 'var(--success-text)',
                            },
                            {
                              label: 'نیازمند آماده‌سازی',
                              value: toPersianDigits(summary.needsPrepCount),
                              color:
                                summary.needsPrepCount > 0
                                  ? 'var(--warning-text)'
                                  : 'var(--text-secondary)',
                            },
                          ]
                        : [
                            { label: 'برنامه‌ها', value: toPersianDigits(summary.planCount) },
                            {
                              label: 'سفارش‌های اجرایی',
                              value: toPersianDigits(summary.totalOrders),
                            },
                            {
                              label: 'تحویل‌شده',
                              value: toPersianDigits(summary.delivered),
                              color:
                                summary.delivered > 0
                                  ? 'var(--success-text)'
                                  : 'var(--text-secondary)',
                            },
                            {
                              label: 'در انتظار',
                              value: toPersianDigits(summary.pending),
                              color: 'var(--text-secondary)',
                            },
                            {
                              label: 'نیازمند پیگیری',
                              value: toPersianDigits(summary.followup),
                              color:
                                summary.followup > 0
                                  ? 'var(--warning-text)'
                                  : 'var(--text-secondary)',
                            },
                          ]
                    ).map((m, i, arr) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          padding: '9px 14px',
                          borderInlineEnd:
                            i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--text-disabled)',
                            letterSpacing: '0.01em',
                          }}
                        >
                          {m.label}
                        </span>
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            lineHeight: 1.1,
                            color: (m as { color?: string }).color ?? 'var(--text-primary)',
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Plans table header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      flex: 1,
                    }}
                  >
                    برنامه‌های {sectionShort}
                  </span>
                  <span
                    className="badge-count"
                    aria-label={`${toPersianDigits(sorted.length)} برنامه`}
                  >
                    {toPersianDigits(sorted.length)}
                  </span>
                </div>

                {sorted.length === 0 ? (
                  <div
                    style={{
                      padding: '32px 14px',
                      textAlign: 'center',
                      fontSize: 12.5,
                      color: 'var(--text-muted)',
                    }}
                    data-testid="ops-programs-empty"
                  >
                    برای این تاریخ برنامه‌ای وجود ندارد.
                  </div>
                ) : (
                  <table
                    className="data-table"
                    style={{ width: '100%' }}
                    aria-label={`برنامه‌های ${sectionShort}`}
                  >
                    <thead>
                      <tr>
                        <th>نام برنامه</th>
                        <th>پنجره تحویل</th>
                        <th>وضعیت اجرا</th>
                        <th style={{ textAlign: 'center' }}>کل</th>
                        <th style={{ textAlign: 'center' }}>تحویل</th>
                        <th style={{ textAlign: 'center' }}>در انتظار</th>
                        <th style={{ textAlign: 'center' }}>پیگیری</th>
                        <th style={{ minWidth: 110 }}>پیشرفت اجرا</th>
                        <th style={{ width: 150 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((plan) => (
                        <ProgramRow
                          key={plan.planId}
                          plan={plan}
                          onNavigate={(href) => navigate(href)}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            4. FOLLOW-UPS TAB — global backlog, NOT date-filtered
        ══════════════════════════════════════════════════════════════════ */}
        {mainTab === 'followups' && (
          <div
            role="tabpanel"
            id="ops-tab-panel-followups"
            aria-labelledby="ops-tab-followups"
            data-testid="ops-followups-tab"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}
              >
                پیگیری‌های باز
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {toPersianDigits(followups.length)} مورد
                {fuToday > 0 && (
                  <>
                    {' · '}
                    <span style={{ color: 'var(--warning-text)' }}>
                      {toPersianDigits(fuToday)} امروز
                    </span>
                  </>
                )}
                {fuYesterday > 0 && <> · {toPersianDigits(fuYesterday)} از دیروز</>}
                {fuOlder > 0 && <> · {toPersianDigits(fuOlder)} قدیمی‌تر</>}
              </span>
            </div>

            {followupsState === 'loading' && (
              <div
                style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-muted)' }}
                data-testid="ops-followups-loading"
              >
                در حال بارگذاری…
              </div>
            )}

            {followupsState === 'error' && (
              <div
                style={{
                  padding: '12px 14px',
                  color: 'var(--error-text)',
                  fontSize: 12.5,
                }}
                data-testid="ops-followups-error"
              >
                خطا در بارگذاری پیگیری‌ها
              </div>
            )}

            {followupsState === 'ready' && (
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--r-md)',
                  overflow: 'hidden',
                }}
              >
                {followups.length === 0 ? (
                  <div
                    style={{
                      padding: '32px 14px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: 12.5,
                    }}
                    data-testid="ops-followups-empty"
                  >
                    هیچ پیگیری باز در صف نیست
                  </div>
                ) : (
                  <table
                    className="data-table"
                    style={{ width: '100%' }}
                    aria-label="پیگیری‌های باز"
                  >
                    <thead>
                      <tr>
                        <th>سفارش</th>
                        <th>مشتری</th>
                        <th>علت پیگیری</th>
                        <th>برنامه</th>
                        <th>تاریخ تحویل</th>
                        <th>راننده</th>
                        <th>باز از</th>
                        <th style={{ width: 60 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {followups.map((fu) => (
                        <FollowupRow
                          key={fu.id}
                          item={fu}
                          todayJ={todayJ}
                          onView={() =>
                            navigate(
                              `/plans/${fu.planId}/execution?orderId=${encodeURIComponent(fu.orderId)}`,
                            )
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes ops-spin { to { transform: rotate(360deg); } }
        @keyframes ops-pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

// ─── ProgramRow component ─────────────────────────────────────────────────────
function ProgramRow({
  plan,
  onNavigate,
}: {
  plan: OpsProgramRow;
  onNavigate: (href: string) => void;
}) {
  const sc = execStatusStyle(plan.execStatus);
  const actionHref =
    plan.primaryAction?.href ?? `/plans/${plan.planId}/execution`;

  const handleRowClick = () => {
    if (!plan.primaryAction && plan.isPublished) {
      onNavigate(`/plans/${plan.planId}/execution`);
    }
  };

  return (
    <tr
      className="row-normal"
      style={{ cursor: 'pointer', opacity: !plan.isPublished ? 0.78 : 1 }}
      onClick={handleRowClick}
      data-testid={`ops-program-row-${plan.planId}`}
    >
      <td>
        <div>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{plan.name}</span>
          {plan.readinessNote && (
            <div
              style={{
                marginTop: 3,
                fontSize: 10.5,
                color: 'var(--warning-text)',
              }}
            >
              {plan.readinessNote}
            </div>
          )}
        </div>
      </td>
      <td>
        <span
          className="ltr-data"
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {plan.window ?? '—'}
        </span>
      </td>
      <td>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            padding: '2px 7px',
            borderRadius: 'var(--r-xs)',
            background: sc.bg,
            color: sc.color,
            border: `1px solid ${sc.dot}33`,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: sc.dot,
              flexShrink: 0,
              animation: sc.pulse ? 'ops-pulse-dot 1.4s ease-in-out infinite' : 'none',
            }}
          />
          {execStatusLabel(plan.execStatus)}
        </span>
      </td>
      <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12.5 }}>
        {plan.isPublished ? toPersianDigits(plan.total) : '—'}
      </td>
      <td style={{ textAlign: 'center', fontSize: 12.5 }}>
        {plan.isPublished ? (
          <span
            style={{ color: plan.delivered > 0 ? 'var(--success-text)' : 'var(--text-disabled)' }}
          >
            {toPersianDigits(plan.delivered)}
          </span>
        ) : (
          <span style={{ color: 'var(--text-disabled)' }}>—</span>
        )}
      </td>
      <td style={{ textAlign: 'center', fontSize: 12.5 }}>
        {plan.isPublished ? (
          <span style={{ color: 'var(--text-secondary)' }}>
            {toPersianDigits(plan.pending)}
          </span>
        ) : (
          <span style={{ color: 'var(--text-disabled)' }}>—</span>
        )}
      </td>
      <td style={{ textAlign: 'center', fontSize: 12.5 }}>
        {plan.isPublished ? (
          <span
            style={{
              color: plan.followup > 0 ? 'var(--warning-text)' : 'var(--text-disabled)',
            }}
          >
            {plan.followup > 0 ? toPersianDigits(plan.followup) : '—'}
          </span>
        ) : (
          <span style={{ color: 'var(--text-disabled)' }}>—</span>
        )}
      </td>
      <td>
        {plan.isPublished ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                flex: 1,
                height: 4,
                background: 'var(--bg-surface)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 2,
                  width: `${plan.progressPct}%`,
                  background:
                    plan.progressPct === 100 ? 'var(--success)' : 'var(--accent)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 10.5,
                color: 'var(--text-muted)',
                minWidth: 26,
                textAlign: 'start',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {toPersianDigits(plan.progressPct)}٪
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>—</span>
        )}
      </td>
      <td>
        {plan.primaryAction ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(plan.primaryAction!.href);
            }}
            style={{
              background: plan.primaryAction.isWarning ? 'rgba(201,144,53,0.10)' : 'none',
              border: `1px solid ${plan.primaryAction.isWarning ? 'rgba(201,144,53,0.28)' : 'var(--border-default)'}`,
              color: plan.primaryAction.isWarning ? 'var(--warning-text)' : 'var(--text-muted)',
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 'var(--r-xs)',
              cursor: 'pointer',
              fontFamily: 'Vazirmatn, system-ui, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {plan.primaryAction.label}
          </button>
        ) : plan.isPublished ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(actionHref);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 11,
              fontFamily: 'Vazirmatn, system-ui, sans-serif',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            مشاهده اجرا ‹
          </button>
        ) : null}
      </td>
    </tr>
  );
}

// ─── FollowupRow component ────────────────────────────────────────────────────
function FollowupRow({
  item,
  todayJ,
  onView,
}: {
  item: OpsFollowupItem;
  todayJ: JalaliDate;
  onView: () => void;
}) {
  const ageLabel = relativeDayLabel(item.daysPast, todayJ, toPersianDigits);
  const pill = agePillStyle(item.daysPast);

  return (
    <tr
      className="row-normal"
      style={{ cursor: 'pointer' }}
      onClick={onView}
      data-testid={`ops-followup-row-${item.id}`}
    >
      <td>
        <span
          className="ltr-mono"
          style={{ fontSize: 11.5, color: 'var(--text-primary)', fontWeight: 600 }}
        >
          {item.orderId}
        </span>
      </td>
      <td style={{ fontSize: 12.5 }}>{item.customer}</td>
      <td>
        <div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.reason}</span>
          {item.latestNote && (
            <div
              style={{
                fontSize: 10.5,
                color: 'var(--text-disabled)',
                marginTop: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 260,
              }}
            >
              آخرین یادداشت: {item.latestNote}
            </div>
          )}
        </div>
      </td>
      <td>
        <span
          style={{
            fontSize: 11.5,
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 160,
            display: 'block',
          }}
        >
          {item.planId}
        </span>
      </td>
      <td>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.serviceDate}</span>
      </td>
      <td>
        {item.driverName ? (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.driverName}</span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>—</span>
        )}
      </td>
      <td>
        <span
          style={{
            fontSize: 10.5,
            padding: '1px 6px',
            borderRadius: 'var(--r-xs)',
            background: pill.bg,
            color: pill.color,
            border: pill.border,
            whiteSpace: 'nowrap',
          }}
          data-testid={`ops-followup-age-${item.id}`}
        >
          {ageLabel}
        </span>
      </td>
      <td>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          aria-label={`مشاهده سفارش ${item.orderId} در اجرا`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 11,
            fontFamily: 'Vazirmatn, system-ui, sans-serif',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          مشاهده ‹
        </button>
      </td>
    </tr>
  );
}

// ─── Search result sub-components ────────────────────────────────────────────
function SearchResultSingle({
  result,
  onOpen,
}: {
  result: OpsSearchResult;
  onOpen: (r: OpsSearchResult) => void;
}) {
  const ss = uiStatusStyle(result.uiStatus);
  return (
    <div
      role="option"
      style={{ padding: '10px 14px', cursor: 'pointer', transition: 'background 0.1s' }}
      onClick={() => onOpen(result)}
      data-testid="ops-search-result-single"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
          >
            <span
              className="ltr-mono"
              style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700 }}
            >
              {result.orderId}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>
              {result.customer}
            </span>
            <span
              style={{
                fontSize: 10.5,
                padding: '1px 6px',
                borderRadius: 'var(--r-xs)',
                background: ss.bg,
                color: ss.color,
              }}
            >
              {result.statusLabel}
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 3,
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <span>{result.planName}</span>
            {result.areaName && (
              <>
                <span style={{ color: 'var(--border-default)' }}>·</span>
                <span>{result.areaName}</span>
              </>
            )}
            {result.driverName && (
              <>
                <span style={{ color: 'var(--border-default)' }}>·</span>
                <span>{result.driverName}</span>
              </>
            )}
            {result.failureReason && (
              <>
                <span style={{ color: 'var(--border-default)' }}>·</span>
                <span style={{ color: 'var(--warning-text)' }}>{result.failureReason}</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen(result);
          }}
          style={{
            flexShrink: 0,
            background: 'var(--accent-dim)',
            border: '1px solid rgba(61,123,212,0.3)',
            color: 'var(--accent-text)',
            fontSize: 11,
            padding: '3px 9px',
            borderRadius: 'var(--r-xs)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontFamily: 'Vazirmatn, system-ui, sans-serif',
          }}
        >
          باز کردن در اجرا و پیگیری
        </button>
      </div>
    </div>
  );
}

function SearchResultMultiple({
  results,
  onOpen,
}: {
  results: OpsSearchResult[];
  onOpen: (r: OpsSearchResult) => void;
}) {
  return (
    <>
      <div
        style={{
          padding: '6px 14px 4px',
          fontSize: 10.5,
          color: 'var(--text-disabled)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
        data-testid="ops-search-result-count"
      >
        {toPersianDigits(results.length)} نتیجه
      </div>
      {results.map((r, i) => {
        const ss = uiStatusStyle(r.uiStatus);
        return (
          <div
            key={`${r.planId}:${r.orderId}`}
            role="option"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px',
              borderBottom:
                i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onClick={() => onOpen(r)}
            data-testid={`ops-search-result-${r.orderId}`}
          >
            <div style={{ minWidth: 108, flexShrink: 0 }}>
              <div
                className="ltr-mono"
                style={{ fontSize: 11.5, color: 'var(--text-primary)', fontWeight: 600 }}
              >
                {r.orderId}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                {r.customer}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.planName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {r.areaName && <span>{r.areaName}</span>}
                {r.areaName && r.driverName && (
                  <span style={{ color: 'var(--border-default)', margin: '0 5px' }}>·</span>
                )}
                {r.driverName && <span>{r.driverName}</span>}
              </div>
            </div>
            <span
              style={{
                fontSize: 10.5,
                padding: '1px 6px',
                borderRadius: 'var(--r-xs)',
                flexShrink: 0,
                background: ss.bg,
                color: ss.color,
                whiteSpace: 'nowrap',
              }}
            >
              {r.statusLabel}
            </span>
          </div>
        );
      })}
    </>
  );
}

// ─── Public export — wraps with OpsDataProvider ───────────────────────────────
export function OpsPage() {
  return (
    <OpsDataProvider>
      <OpsPageInner />
    </OpsDataProvider>
  );
}
