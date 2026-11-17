import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Plane,
  Search,
  UserCheck,
  X,
} from 'lucide-react';
import type { Employee, Language, TimelineEvent } from '../../types/ems';
import {
  computeTimelineEvents,
  todayRiyadh,
  workerKind,
  norm,
} from '../../lib/accounting';
import { getMonthNames, tr, translateStatus } from '../../lib/i18n';
import { usePrefersReducedMotion } from '../../hooks/useGsapAnimations';
import { Avatar } from '../ui/Avatar';
import { AnimatedButton } from '../ui/AnimatedButton';

interface WorkerVisaTimelineProps {
  employees: Employee[];
  lang: Language;
  canWrite: boolean;
  onOpenProfile: (workerId: string) => void;
  onEditVisa: (workerId: string) => void;
  onEditWorker: (workerId: string) => void;
}

type ViewMode = 'month' | 'week' | 'day';
type EventFilter = 'all' | 'iqama' | 'visa-return' | 'visa-issue' | 'joining';

const TONE_CLASSES: Record<TimelineEvent['tone'], string> = {
  green:
    'bg-[#00C985]/16 text-[#008558] dark:text-[#4AE8B0] border-[#00C985]/35 hover:shadow-[0_4px_14px_-2px_rgba(0,201,133,0.4)]',
  blue:
    'bg-[#4388FF]/16 text-[#1E5ED6] dark:text-[#8FB8FF] border-[#4388FF]/35 hover:shadow-[0_4px_14px_-2px_rgba(67,136,255,0.4)]',
  yellow:
    'bg-[#FFD84D]/28 text-[#856200] dark:text-[#FFE580] border-[#FFD84D]/55 hover:shadow-[0_4px_14px_-2px_rgba(255,216,77,0.45)]',
  red:
    'bg-[#F05A65]/16 text-[#C42D39] dark:text-[#FF858E] border-[#F05A65]/40 hover:shadow-[0_4px_14px_-2px_rgba(240,90,101,0.42)]',
  purple:
    'bg-[#8957FF]/16 text-[#6030D4] dark:text-[#B99BFF] border-[#8957FF]/35 hover:shadow-[0_4px_14px_-2px_rgba(137,87,255,0.4)]',
};

function addDays(isoDate: string, delta: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

function getMonthDays(yearMonth: string): string[] {
  const [y, m] = yearMonth.split('-').map(Number);
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: total }, (_, idx) => {
    const day = String(idx + 1).padStart(2, '0');
    return `${yearMonth}-${day}`;
  });
}

function shiftMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
}

export const WorkerVisaTimeline: React.FC<WorkerVisaTimelineProps> = ({
  employees,
  lang,
  canWrite,
  onOpenProfile,
  onEditVisa,
  onEditWorker,
}) => {
  const today = todayRiyadh();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [anchorDate, setAnchorDate] = useState<string>(today);
  const [workerQuery, setWorkerQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const monthNames = useMemo(() => getMonthNames(lang), [lang]);

  const currentMonthKey = anchorDate.slice(0, 7);

  const visibleDates = useMemo(() => {
    if (viewMode === 'day') return [anchorDate];
    if (viewMode === 'week') {
      const [y, m, d] = anchorDate.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      const dow = dt.getUTCDay();
      const start = addDays(anchorDate, -dow);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    return getMonthDays(currentMonthKey);
  }, [viewMode, anchorDate, currentMonthKey]);

  const allEvents = useMemo(
    () => computeTimelineEvents(employees, lang),
    [employees, lang]
  );

  const filteredWorkers = useMemo(() => {
    const q = norm(workerQuery);
    const live = employees.filter((e) => !e.deletedAt);
    const matches = live.filter((e) => {
      if (!q) return true;
      return [e.fullName, e.arabicName, e.iqamaNumber, e.companyName, e.ownerName].some(
        (x) => norm(x).includes(q)
      );
    });

    // Prioritize workers who have events in the visible date range
    const dateSet = new Set(visibleDates);
    return matches.sort((a, b) => {
      const aHas = allEvents.some(
        (ev) =>
          ev.employee.id === a.id &&
          dateSet.has(ev.date) &&
          (eventFilter === 'all' || ev.kind === eventFilter)
      );
      const bHas = allEvents.some(
        (ev) =>
          ev.employee.id === b.id &&
          dateSet.has(ev.date) &&
          (eventFilter === 'all' || ev.kind === eventFilter)
      );
      if (aHas !== bHas) return aHas ? -1 : 1;
      return a.fullName.localeCompare(b.fullName);
    });
  }, [employees, workerQuery, visibleDates, allEvents, eventFilter]);

  const eventsByWorkerAndDate = useMemo(() => {
    const dateSet = new Set(visibleDates);
    const map = new Map<string, TimelineEvent[]>();
    for (const ev of allEvents) {
      if (!dateSet.has(ev.date)) continue;
      if (eventFilter !== 'all' && ev.kind !== eventFilter) continue;
      const key = `${ev.employee.id}__${ev.date}`;
      const list = map.get(key) || [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [allEvents, visibleDates, eventFilter]);

  // GSAP smooth animation on month/view change
  useLayoutEffect(() => {
    if (reduced || !gridRef.current) return;
    const ctx = gsap.context(() => {
      const chips = gridRef.current?.querySelectorAll('[data-timeline-chip]');
      if (chips && chips.length) {
        gsap.fromTo(
          chips,
          { opacity: 0, scale: 0.9, y: 4 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.28,
            stagger: 0.018,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          }
        );
      }
    }, gridRef);
    return () => ctx.revert();
  }, [currentMonthKey, viewMode, eventFilter, reduced]);

  const handleNavigate = (dir: -1 | 1) => {
    if (viewMode === 'month') {
      setAnchorDate(`${shiftMonth(currentMonthKey, dir)}-01`);
    } else if (viewMode === 'week') {
      setAnchorDate(addDays(anchorDate, dir * 7));
    } else {
      setAnchorDate(addDays(anchorDate, dir));
    }
  };

  const monthIdx = Number(currentMonthKey.slice(5, 7)) - 1;
  const headerTitle = `${monthNames[monthIdx] || ''} ${currentMonthKey.slice(0, 4)}`;

  const visibleEventCount = useMemo(() => {
    let count = 0;
    for (const list of eventsByWorkerAndDate.values()) count += list.length;
    return count;
  }, [eventsByWorkerAndDate]);

  return (
    <section
      aria-label={tr(lang, 'Worker & Visa Timeline', 'কর্মী ও ভিসা টাইমলাইন', 'الجدول الزمني للعمال والتأشيرات')}
      className="soft-card p-5 md:p-6 relative"
    >
      {/* Timeline Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg md:text-xl font-bold text-[var(--text-primary)] tracking-tight">
              {tr(lang, 'Worker & Visa Timeline', 'কর্মী ও ভিসা টাইমলাইন', 'الجدول الزمني للعمال والتأشيرات')}
            </h2>
            <span className="text-xs font-semibold text-[var(--text-secondary)] tabular-nums">
              {visibleEventCount}{' '}
              {tr(lang, 'events in view', 'টি ইভেন্ট', 'أحداث ظاهرة')}
            </span>
          </div>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-0.5">
            {tr(
              lang,
              'Iqama expiries, visa issue dates, return deadlines, and joining dates from saved records.',
              'সংরক্ষিত তথ্য অনুযায়ী ইকামার মেয়াদ, ভিসা ইস্যু, ফেরার শেষ তারিখ ও যোগদানের তারিখ।',
              'مواعيد انتهاء الإقامة وإصدار التأشيرة والعودة وتاريخ الانضمام من السجلات المحفوظة.'
            )}
          </p>
        </div>

        {/* Navigation & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Prev / Month Label / Next / Today */}
          <div className="flex items-center gap-1 p-1 rounded-2xl soft-surface-secondary">
            <button
              type="button"
              onClick={() => handleNavigate(-1)}
              aria-label="Previous period"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-primary)] cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <input
              type="month"
              value={currentMonthKey}
              onChange={(e) => {
                if (e.target.value) setAnchorDate(`${e.target.value}-01`);
              }}
              aria-label="Select month"
              className="bg-transparent text-xs sm:text-sm font-bold text-[var(--text-primary)] px-2 py-1 outline-none cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleNavigate(1)}
              aria-label="Next period"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-primary)] cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>

          <AnimatedButton
            variant="secondary"
            size="sm"
            onClick={() => setAnchorDate(today)}
            className="rounded-xl h-10 px-3"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{tr(lang, 'Today', 'আজ', 'اليوم')}</span>
          </AnimatedButton>

          {/* Day / Week / Month Switch */}
          <div className="flex items-center p-1 rounded-2xl soft-surface-secondary">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize cursor-pointer transition-colors ${
                  viewMode === mode
                    ? 'bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {mode === 'day'
                  ? tr(lang, 'Day', 'দিন', 'يوم')
                  : mode === 'week'
                  ? tr(lang, 'Week', 'সপ্তাহ', 'أسبوع')
                  : tr(lang, 'Month', 'মাস', 'شهر')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter & Legend Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Worker */}
          <div className="relative flex items-center w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute start-3 pointer-events-none" />
            <input
              type="search"
              value={workerQuery}
              onChange={(e) => setWorkerQuery(e.target.value)}
              placeholder={tr(lang, 'Filter workers…', 'কর্মী খুঁজুন…', 'تصفية العمال…')}
              aria-label="Filter timeline workers"
              className="w-full h-9 ps-8 pe-3 rounded-xl soft-surface-secondary text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#4388FF]"
            />
          </div>

          {/* Event Type Filter */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl soft-surface-secondary">
            {(
              [
                ['all', tr(lang, 'All Events', 'সব', 'الكل')],
                ['iqama', tr(lang, 'Iqama Expiry', 'ইকামা', 'الإقامة')],
                ['visa-return', tr(lang, 'Visa Return', 'ভিসা ফেরা', 'عودة التأشيرة')],
                ['visa-issue', tr(lang, 'Visa Issued', 'ভিসা ইস্যু', 'إصدار تأشيرة')],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setEventFilter(val)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                  eventFilter === val
                    ? 'bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C985]" />
            {tr(lang, 'Valid', 'বৈধ', 'ساري')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4388FF]" />
            {tr(lang, 'Upcoming', 'আসন্ন', 'قادم')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFD84D]" />
            {tr(lang, 'Due Soon', 'শীঘ্রই', 'قريب الانتهاء')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F05A65]" />
            {tr(lang, 'Expired / Overdue', 'মেয়াদ উত্তীর্ণ', 'منتهي / متأخر')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8957FF]" />
            {tr(lang, 'Recorded', 'সংরক্ষিত', 'مسجل')}
          </span>
        </div>
      </div>

      {/* Horizontal Timeline Matrix */}
      <div
        ref={gridRef}
        className="mt-1 rounded-2xl border border-[var(--border-subtle)] overflow-x-auto sleek-scroll bg-[var(--surface-secondary)]/55"
      >
        <div className="min-w-max">
          {/* Date Header Row */}
          <div className="flex border-b border-[var(--border-subtle)] bg-[var(--surface-secondary)] sticky top-0 z-10">
            <div className="w-56 sm:w-64 shrink-0 px-4 py-3 font-bold text-xs text-[var(--text-secondary)] sticky start-0 bg-[var(--surface-secondary)] z-20 border-e border-[var(--border-subtle)] flex items-center justify-between">
              <span>{headerTitle}</span>
              <span className="tabular-nums">{filteredWorkers.length}</span>
            </div>

            <div className="flex flex-1">
              {visibleDates.map((iso) => {
                const isToday = iso === today;
                const dayNum = iso.slice(8, 10);
                const dt = new Date(`${iso}T00:00:00Z`);
                const wk = new Intl.DateTimeFormat(
                  lang === 'ar' ? 'ar-SA' : lang === 'bn' ? 'bn-BD' : 'en-US',
                  { weekday: 'short', timeZone: 'UTC' }
                ).format(dt);

                const colWidth =
                  viewMode === 'day'
                    ? 'min-w-[260px] flex-1'
                    : viewMode === 'week'
                    ? 'min-w-[130px] flex-1'
                    : 'w-14 shrink-0';

                return (
                  <div
                    key={iso}
                    className={`${colWidth} py-2.5 px-1 text-center border-e border-[var(--border-subtle)]/60 relative ${
                      isToday ? 'bg-[#4388FF]/10' : ''
                    }`}
                  >
                    <div className="text-[10px] font-medium text-[var(--text-muted)]">
                      {wk}
                    </div>
                    <div
                      className={`text-xs font-bold tabular-nums mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        isToday
                          ? 'bg-[#4388FF] text-white shadow-sm'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {dayNum}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Employee Rows */}
          {filteredWorkers.slice(0, 25).map((emp) => {
            const kind = workerKind(emp);
            return (
              <div
                key={emp.id}
                className="flex border-b border-[var(--border-subtle)]/60 last:border-b-0 hover:bg-[var(--surface-primary)]/70 transition-colors"
              >
                {/* Sticky Worker Identity Column */}
                <button
                  type="button"
                  onClick={() => onOpenProfile(emp.id)}
                  className="w-56 sm:w-64 shrink-0 px-3.5 py-2.5 sticky start-0 bg-[var(--surface-primary)] z-10 border-e border-[var(--border-subtle)] flex items-center gap-2.5 text-start hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                >
                  <Avatar name={emp.fullName} size="xs" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {emp.fullName}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate flex items-center gap-1">
                      <span>{translateStatus(lang, kind === 'domestic' ? 'Domestic' : 'Company')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-data">{emp.iqamaNumber}</span>
                    </div>
                  </div>
                </button>

                {/* Date Cells */}
                <div className="flex flex-1">
                  {visibleDates.map((iso) => {
                    const isToday = iso === today;
                    const cellEvents = eventsByWorkerAndDate.get(`${emp.id}__${iso}`) || [];
                    const colWidth =
                      viewMode === 'day'
                        ? 'min-w-[260px] flex-1'
                        : viewMode === 'week'
                        ? 'min-w-[130px] flex-1'
                        : 'w-14 shrink-0';

                    return (
                      <div
                        key={iso}
                        className={`${colWidth} p-1 border-e border-[var(--border-subtle)]/40 flex flex-col items-center justify-center gap-1 relative min-h-[52px] ${
                          isToday ? 'bg-[#4388FF]/6' : ''
                        }`}
                      >
                        {isToday && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-0 start-1/2 w-[1.5px] bg-[#4388FF]/35 pointer-events-none"
                          />
                        )}
                        {cellEvents.map((ev) => {
                          const Icon =
                            ev.kind === 'iqama'
                              ? CreditCard
                              : ev.kind === 'joining'
                              ? UserCheck
                              : Plane;
                          return (
                            <button
                              key={ev.id}
                              type="button"
                              data-timeline-chip
                              onClick={() => setSelectedEvent(ev)}
                              onMouseEnter={(e) => {
                                if (!reduced) {
                                  gsap.to(e.currentTarget, {
                                    scale: 1.06,
                                    y: -1,
                                    duration: 0.16,
                                    ease: 'power3.out',
                                  });
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!reduced) {
                                  gsap.to(e.currentTarget, {
                                    scale: 1,
                                    y: 0,
                                    duration: 0.18,
                                    ease: 'power3.out',
                                  });
                                }
                              }}
                              title={`${ev.label}: ${ev.detailText}`}
                              className={`relative z-10 w-full rounded-xl border px-1.5 py-1 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-shadow ${TONE_CLASSES[ev.tone]}`}
                            >
                              <Icon className="w-3 h-3 shrink-0" />
                              {viewMode !== 'month' && (
                                <span className="truncate">{ev.label}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!filteredWorkers.length && (
            <div className="py-12 px-6 text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {tr(
                  lang,
                  'No workers match your timeline filter.',
                  'টাইমলাইন ফিল্টারের সাথে কোনো কর্মী মেলেনি।',
                  'لا يوجد عمال مطابقون لتصفية الجدول.'
                )}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {tr(
                  lang,
                  'Add workers or adjust your search query to inspect Iqama and Visa milestones.',
                  'ইকামা ও ভিসার তারিখ দেখতে কর্মী যোগ করুন বা সার্চ পরিবর্তন করুন।',
                  'أضف عمالاً أو عدّل البحث لعرض مواعيد الإقامة والتأشيرات.'
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {filteredWorkers.length > 25 && (
        <p className="text-xs text-[var(--text-secondary)] mt-2.5">
          {tr(
            lang,
            `Showing top 25 of ${filteredWorkers.length} workers (events in selected range prioritized). Filter by name or Iqama to focus.`,
            `${filteredWorkers.length} জন কর্মীর মধ্যে ২৫ জন দেখানো হচ্ছে। নির্দিষ্ট কর্মী দেখতে সার্চ করুন।`,
            `عرض ٢٥ من أصل ${filteredWorkers.length} عامل. استخدم البحث للتركيز على عامل محدد.`
          )}
        </p>
      )}

      {/* Interactive Event Details Popover Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[1px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEvent(null);
          }}
        >
          <div className="w-full max-w-md soft-float-popover rounded-3xl p-5 relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={selectedEvent.employee.fullName} size="md" />
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
                    {selectedEvent.employee.fullName}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-mono-data">
                    Iqama {selectedEvent.employee.iqamaNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event details"
                className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 p-3.5 rounded-2xl soft-surface-secondary flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  {selectedEvent.label}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono-data">
                  {selectedEvent.date} · {selectedEvent.detailText}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                  TONE_CLASSES[selectedEvent.tone]
                }`}
              >
                {selectedEvent.kind === 'iqama'
                  ? 'Iqama'
                  : selectedEvent.kind === 'joining'
                  ? 'Joined'
                  : 'Visa'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 mt-5">
              {canWrite &&
                (selectedEvent.kind === 'visa-issue' ||
                  selectedEvent.kind === 'visa-return') && (
                  <AnimatedButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const id = selectedEvent.employee.id;
                      setSelectedEvent(null);
                      onEditVisa(id);
                    }}
                  >
                    {tr(lang, 'Update Visa', 'ভিসা আপডেট', 'تعديل التأشيرة')}
                  </AnimatedButton>
                )}
              {canWrite && selectedEvent.kind === 'iqama' && (
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const id = selectedEvent.employee.id;
                    setSelectedEvent(null);
                    onEditWorker(id);
                  }}
                >
                  {tr(lang, 'Edit Worker', 'কর্মী এডিট', 'تعديل العامل')}
                </AnimatedButton>
              )}
              <AnimatedButton
                variant="teal"
                size="sm"
                onClick={() => {
                  const id = selectedEvent.employee.id;
                  setSelectedEvent(null);
                  onOpenProfile(id);
                }}
              >
                <span>{tr(lang, 'Open Profile', 'প্রোফাইল দেখুন', 'فتح الملف')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
