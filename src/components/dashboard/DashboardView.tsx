import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarClock,
  CreditCard,
  Download,
  FilePlus2,
  Home,
  Plane,
  Plus,
  Search,
  Users,
  Wallet,
} from 'lucide-react';
import type {
  Language,
  PageRoute,
  WorkspaceData,
} from '../../types/ems';
import {
  cents,
  computeDomesticMonthly,
  computePaymentGroups,
  computeReminders,
  money,
  monthNow,
  workerKind,
} from '../../lib/accounting';
import { tr } from '../../lib/i18n';
import { useCountUp, useStaggerEntrance } from '../../hooks/useGsapAnimations';
import { AnimatedButton } from '../ui/AnimatedButton';
import { Avatar } from '../ui/Avatar';
import { StatusLabel } from '../ui/StatusLabel';
import { WorkerVisaTimeline } from './WorkerVisaTimeline';
import { DashboardCharts } from './DashboardCharts';

interface DashboardViewProps {
  data: WorkspaceData;
  lang: Language;
  canWrite: boolean;
  onNavigate: (page: PageRoute) => void;
  onOpenProfile: (workerId: string) => void;
  onAddWorker: (kind?: 'company' | 'domestic') => void;
  onEditWorker: (workerId: string) => void;
  onEditVisa: (workerId: string) => void;
  onRecordPayment: (workerId?: string, period?: string) => void;
  onGenerateDues: (kind?: 'company' | 'domestic') => void;
  onExportBackup: () => void;
  onQuickSearch: (q: string) => void;
}

interface StatCardProps {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  subLabel?: string;
  accentClass?: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  decimals = 0,
  suffix,
  subLabel,
  accentClass = 'text-[var(--text-primary)]',
  icon: Icon,
  onClick,
}) => {
  const animatedValue = useCountUp(value, decimals);
  return (
    <button
      type="button"
      onClick={onClick}
      data-dash-card
      className={`soft-card soft-card-hover p-4 sm:p-5 text-start w-full flex flex-col justify-between gap-3 ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        <span className="text-xs font-semibold text-[var(--text-secondary)] truncate">
          {label}
        </span>
        <span className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
          <Icon className="w-4 h-4" />
        </span>
      </div>

      <div>
        <div className={`text-xl sm:text-2xl font-bold tabular-nums tracking-tight ${accentClass}`}>
          {animatedValue}
          {suffix && (
            <span className="text-xs font-semibold text-[var(--text-secondary)] ms-1">
              {suffix}
            </span>
          )}
        </div>
        {subLabel && (
          <p className="text-[11px] text-[var(--text-secondary)] mt-1 truncate">{subLabel}</p>
        )}
      </div>
    </button>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  lang,
  canWrite,
  onNavigate,
  onOpenProfile,
  onAddWorker,
  onEditWorker,
  onEditVisa,
  onRecordPayment,
  onGenerateDues,
  onExportBackup,
  onQuickSearch,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [domesticMonth, setDomesticMonth] = useState(monthNow());
  const [domesticStatus, setDomesticStatus] = useState('');
  const [commandQuery, setCommandQuery] = useState('');

  useStaggerEntrance(containerRef, '[data-dash-card]', [lang]);

  const liveWorkers = useMemo(
    () => data.employees.filter((e) => !e.deletedAt),
    [data.employees]
  );

  const activeWorkers = useMemo(
    () => liveWorkers.filter((e) => !e.archived && e.employmentStatus === 'Active'),
    [liveWorkers]
  );

  const companyWorkersCount = useMemo(
    () => activeWorkers.filter((e) => workerKind(e) === 'company').length,
    [activeWorkers]
  );

  const domesticWorkersCount = useMemo(
    () => activeWorkers.filter((e) => workerKind(e) === 'domestic').length,
    [activeWorkers]
  );

  const currentMonth = monthNow();
  const currentMonthGroups = useMemo(
    () => computePaymentGroups(data.employees, data.payments, null, currentMonth),
    [data.employees, data.payments, currentMonth]
  );

  const monthlyExpectedCents = useMemo(
    () => currentMonthGroups.reduce((s, g) => s + g.expected, 0),
    [currentMonthGroups]
  );

  const monthlyCollectedCents = useMemo(
    () => currentMonthGroups.reduce((s, g) => s + g.paid, 0),
    [currentMonthGroups]
  );

  // Total outstanding balance across all saved monthly accounts + opening balances
  const totalOutstandingCents = useMemo(() => {
    const allGroups = computePaymentGroups(data.employees, data.payments, null, '');
    const monthlyDue = allGroups.reduce((s, g) => s + g.balance, 0);
    const openingDue = data.employees.reduce((s, e) => {
      const o = e.openingBalance || {};
      return s + Math.max(0, cents(o.amount) - cents(o.paid));
    }, 0);
    return monthlyDue + openingDue;
  }, [data.employees, data.payments]);

  const reminders = useMemo(
    () => computeReminders(data.employees),
    [data.employees]
  );

  const iqamaUpcomingCount = useMemo(
    () => reminders.filter((r) => r.type === 'Iqama').length,
    [reminders]
  );

  const visaUpcomingCount = useMemo(
    () => reminders.filter((r) => r.type === 'Visa return').length,
    [reminders]
  );

  const recentWorkers = useMemo(() => {
    return [...liveWorkers]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5);
  }, [liveWorkers]);

  const domesticAll = useMemo(
    () =>
      computeDomesticMonthly(
        data.employees,
        data.payments,
        data.settings.defaultFee,
        domesticMonth
      ),
    [data.employees, data.payments, data.settings.defaultFee, domesticMonth]
  );

  const domesticFiltered = useMemo(
    () => domesticAll.filter((r) => !domesticStatus || r.status === domesticStatus),
    [domesticAll, domesticStatus]
  );

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandQuery.trim()) return;
    onQuickSearch(commandQuery.trim());
  };

  const liveTotalCount = Math.max(1, activeWorkers.length);
  const companyPct = Math.round((companyWorkersCount / liveTotalCount) * 100);
  const domesticPct = Math.round((domesticWorkersCount / liveTotalCount) * 100);
  const collectionPct =
    monthlyExpectedCents > 0
      ? Math.min(100, Math.round((monthlyCollectedCents / monthlyExpectedCents) * 100))
      : 0;
  const pendingPct = Math.max(0, 100 - collectionPct);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header Row with Oversized Thin Numbers & Segmented Proportion Bar (Matches Screenshot) */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2">
        <div className="space-y-4 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-4xl font-semibold text-[var(--text-primary)] tracking-tight">
                {tr(
                  lang,
                  'Operations Overview',
                  'কার্যক্রম ওভারভিউ',
                  'نظرة عامة على العمليات'
                )}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {tr(
                  lang,
                  'Live Saudi Arabia workforce, visa deadlines, and SAR financial accounts.',
                  'সৌদি আরবের কর্মী, ভিসার মেয়াদ এবং SAR আর্থিক হিসাবের লাইভ তথ্য।',
                  'إدارة العمال ومواعيد التأشيرات والحسابات المالية بالريال السعودي.'
                )}
              </p>
            </div>

            {canWrite && (
              <div className="flex flex-wrap items-center gap-2">
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => onGenerateDues()}
                  className="rounded-2xl h-10 px-4"
                >
                  <FilePlus2 className="w-4 h-4" />
                  <span>{tr(lang, 'Generate Monthly Dues', 'মাসিক পাওনা তৈরি', 'إنشاء مستحقات الشهر')}</span>
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  onClick={() => onRecordPayment()}
                  className="rounded-2xl h-10 px-4"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{tr(lang, 'Record Payment', 'পেমেন্ট জমা', 'تسجيل دفعة')}</span>
                </AnimatedButton>
              </div>
            )}
          </div>

          {/* Segmented Pill Bar inspired by screenshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl">
            <div>
              <div className="text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                {tr(lang, 'Company', 'কোম্পানি', 'شركات')}
              </div>
              <div className="h-9 px-3.5 rounded-full bg-[#232325] text-[#FAF9F5] dark:bg-[#F8D568] dark:text-[#1D1D1F] text-xs font-semibold tabular-nums flex items-center">
                {companyPct}%
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                {tr(lang, 'Domestic', 'ডোমেস্টিক', 'منزلية')}
              </div>
              <div className="h-9 px-3.5 rounded-full bg-[#F8D568] text-[#1D1D1F] text-xs font-semibold tabular-nums flex items-center">
                {domesticPct}%
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                {tr(lang, 'Collected', 'আদায়', 'المحصل')}
              </div>
              <div className="h-9 px-3.5 rounded-full hatched-surface border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold tabular-nums flex items-center">
                {collectionPct}%
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                {tr(lang, 'Pending', 'বাকি', 'المتبقي')}
              </div>
              <div className="h-9 px-3.5 rounded-full border border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-semibold tabular-nums flex items-center">
                {pendingPct}%
              </div>
            </div>
          </div>
        </div>

        {/* Clean Large Light Numerals Strip (Matches 91 / 104 / 185 in screenshot) */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-9 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('company')}
            className="text-start cursor-pointer group"
          >
            <div className="flex items-baseline gap-1.5">
              <Users className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[#232325] dark:group-hover:text-[#F8D568] transition-colors" />
              <span className="text-4xl md:text-5xl font-light tabular-nums tracking-tight text-[var(--text-primary)]">
                {activeWorkers.length}
              </span>
            </div>
            <div className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">
              {tr(lang, 'Active Workers', 'সক্রিয় কর্মী', 'العمال النشطون')}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('companies')}
            className="text-start cursor-pointer group"
          >
            <div className="flex items-baseline gap-1.5">
              <Building2 className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[#232325] dark:group-hover:text-[#F8D568] transition-colors" />
              <span className="text-4xl md:text-5xl font-light tabular-nums tracking-tight text-[var(--text-primary)]">
                {data.companies.length}
              </span>
            </div>
            <div className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">
              {tr(lang, 'Companies', 'কোম্পানি', 'الشركات')}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('reminders')}
            className="text-start cursor-pointer group"
          >
            <div className="flex items-baseline gap-1.5">
              <Bell className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[#232325] dark:group-hover:text-[#F8D568] transition-colors" />
              <span className="text-4xl md:text-5xl font-light tabular-nums tracking-tight text-[var(--text-primary)]">
                {reminders.length}
              </span>
            </div>
            <div className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">
              {tr(lang, 'Reminders', 'রিমাইন্ডার', 'التنبيهات')}
            </div>
          </button>
        </div>
      </div>

      {/* 8 Animated KPI Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={tr(lang, 'Active Workers', 'সক্রিয় কর্মী', 'العمال النشطون')}
          value={activeWorkers.length}
          subLabel={`${liveWorkers.length} ${tr(lang, 'total recorded', 'মোট সংরক্ষিত', 'إجمالي المسجلين')}`}
          icon={Users}
          onClick={() => onNavigate('company')}
        />
        <StatCard
          label={tr(lang, 'Company Workers', 'কোম্পানির কর্মী', 'عمال الشركات')}
          value={companyWorkersCount}
          subLabel={`${data.companies.length} ${tr(lang, 'companies', 'টি কোম্পানি', 'شركة')}`}
          icon={Building2}
          onClick={() => onNavigate('company')}
        />
        <StatCard
          label={tr(lang, 'Domestic Workers', 'ডোমেস্টিক কর্মী', 'العمالة المنزلية')}
          value={domesticWorkersCount}
          subLabel={tr(lang, '300 SAR default', '৩০০ SAR ডিফল্ট', '٣٠٠ ريال افتراضياً')}
          icon={Home}
          onClick={() => onNavigate('domestic')}
        />
        <StatCard
          label={tr(lang, 'Monthly Expected', 'চলতি মাসের পাওনা', 'المستحق هذا الشهر')}
          value={monthlyExpectedCents / 100}
          decimals={2}
          suffix="SAR"
          subLabel={currentMonth}
          icon={CalendarClock}
          onClick={() => onNavigate('company-payments')}
        />
        <StatCard
          label={tr(lang, 'Monthly Collected', 'চলতি মাসে জমা', 'المحصل هذا الشهر')}
          value={monthlyCollectedCents / 100}
          decimals={2}
          suffix="SAR"
          accentClass="text-[#009965] dark:text-[#2CE6A3]"
          subLabel={currentMonth}
          icon={Wallet}
          onClick={() => onNavigate('history')}
        />
        <StatCard
          label={tr(lang, 'Outstanding Balance', 'মোট বকেয়া', 'إجمالي الرصيد المتبقي')}
          value={totalOutstandingCents / 100}
          decimals={2}
          suffix="SAR"
          accentClass="text-[#D93845] dark:text-[#FF7882]"
          subLabel={tr(lang, 'Including opening balances', 'আগের বকেয়াসহ', 'شاملاً الرصيد الافتتاحي')}
          icon={CreditCard}
          onClick={() => onNavigate('company-payments')}
        />
        <StatCard
          label={tr(lang, 'Upcoming Iqama Expiries', 'আসন্ন ইকামা মেয়াদ', 'انتهاء الإقامة القادم')}
          value={iqamaUpcomingCount}
          accentClass={iqamaUpcomingCount > 0 ? 'text-[#B57B00] dark:text-[#FFE175]' : 'text-[var(--text-primary)]'}
          subLabel={tr(lang, 'Within 60 days + overdue', '৬০ দিনের মধ্যে', 'خلال ٦٠ يوماً + المتأخر')}
          icon={Bell}
          onClick={() => onNavigate('reminders')}
        />
        <StatCard
          label={tr(lang, 'Upcoming Visa Returns', 'ভিসা প্রত্যাবর্তন', 'عودة التأشيرات القادمة')}
          value={visaUpcomingCount}
          accentClass={visaUpcomingCount > 0 ? 'text-[#4388FF]' : 'text-[var(--text-primary)]'}
          subLabel={tr(lang, 'Issued / Outside KSA', 'ইস্যু / সৌদির বাইরে', 'صادرة / خارج المملكة')}
          icon={Plane}
          onClick={() => onNavigate('visas')}
        />
      </div>

      {/* Primary Centerpiece: Worker & Visa Timeline */}
      <div data-dash-card>
        <WorkerVisaTimeline
          employees={data.employees}
          lang={lang}
          canWrite={canWrite}
          onOpenProfile={onOpenProfile}
          onEditVisa={onEditVisa}
          onEditWorker={onEditWorker}
        />
      </div>

      {/* Lower 3-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Upcoming Events */}
        <section data-dash-card className="soft-card p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {tr(lang, 'Upcoming Events', 'আসন্ন সময়সূচী', 'المواعيد القادمة')}
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('reminders')}
                className="text-xs font-semibold text-[#4388FF] hover:underline cursor-pointer"
              >
                {tr(lang, 'View all', 'সব দেখুন', 'عرض الكل')}
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {reminders.slice(0, 5).map((r) => {
                const isOverdue = r.days < 0;
                const isSoon = r.days >= 0 && r.days <= 14;
                return (
                  <button
                    key={`${r.e.id}-${r.type}-${r.date}`}
                    type="button"
                    onClick={() => onOpenProfile(r.e.id)}
                    className="w-full p-3 rounded-2xl soft-surface-secondary hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-between gap-3 text-start cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {r.e.fullName}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {r.type} · <span className="font-mono-data">{r.date}</span>
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold tabular-nums shrink-0 ${
                        isOverdue
                          ? 'bg-[#F05A65]/15 text-[#D93845] dark:text-[#FF858E]'
                          : isSoon
                          ? 'bg-[#FFD84D]/28 text-[#856200] dark:text-[#FFE580]'
                          : 'bg-[#4388FF]/14 text-[#2366DB] dark:text-[#94C5FF]'
                      }`}
                    >
                      {isOverdue
                        ? `${Math.abs(r.days)}d ${tr(lang, 'late', 'বাকি পার', 'متأخر')}`
                        : `${r.days}d`}
                    </span>
                  </button>
                );
              })}

              {!reminders.length && (
                <div className="py-10 text-center">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">
                    {tr(
                      lang,
                      'No Iqama or Visa dates due within 60 days.',
                      '৬০ দিনের মধ্যে কোনো ইকামা বা ভিসার মেয়াদ নেই।',
                      'لا توجد مواعيد إقامة أو تأشيرات خلال ٦٠ يوماً.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Card 2: Worker Overview (Recently Added) */}
        <section data-dash-card className="soft-card p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {tr(lang, 'Worker Overview', 'কর্মী সারসংক্ষেপ', 'نظرة على العمال')}
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('company')}
                className="text-xs font-semibold text-[#4388FF] hover:underline cursor-pointer"
              >
                {tr(lang, 'Directory', 'তালিকা', 'السجل')}
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {recentWorkers.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => onOpenProfile(emp.id)}
                  className="w-full p-2.5 rounded-2xl soft-surface-secondary hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-between gap-2.5 text-start cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={emp.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {emp.fullName}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate">
                        {workerKind(emp) === 'domestic'
                          ? tr(lang, 'Domestic', 'ডোমেস্টিক', 'منزلية')
                          : emp.companyName || tr(lang, 'Company', 'কোম্পানি', 'شركة')}{' '}
                        · <span className="font-mono-data">{emp.iqamaNumber}</span>
                      </p>
                    </div>
                  </div>
                  <StatusLabel
                    status={emp.archived ? 'Archived' : emp.employmentStatus}
                    lang={lang}
                  />
                </button>
              ))}

              {!recentWorkers.length && (
                <div className="py-10 text-center">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">
                    {tr(
                      lang,
                      'No workers saved yet. Add a worker to get started.',
                      'এখনো কোনো কর্মী যোগ করা হয়নি।',
                      'لا يوجد عمال مسجلون بعد.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Card 3: Quick Actions & Command */}
        <section data-dash-card className="soft-card p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="pb-3.5 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {tr(lang, 'Quick Actions', 'দ্রুত কাজ', 'إجراءات سريعة')}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {tr(
                  lang,
                  'Jump to common daily office operations.',
                  'দৈনন্দিন কাজের দ্রুত শর্টকাট।',
                  'انتقل مباشرة إلى المهام اليومية الشائعة.'
                )}
              </p>
            </div>

            {/* Quick Search / Command Field */}
            <form onSubmit={handleCommandSubmit} className="mt-3.5 relative flex items-center">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute start-3 pointer-events-none" />
              <input
                type="search"
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder={tr(
                  lang,
                  'Find by Iqama, name, or phone…',
                  'ইকামা, নাম বা ফোন দিয়ে খুঁজুন…',
                  'ابحث بالإقامة أو الاسم أو الهاتف…'
                )}
                className="w-full h-10 ps-9 pe-20 rounded-2xl soft-surface-secondary text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#4388FF]"
              />
              <button
                type="submit"
                className="absolute end-1.5 px-3 py-1 rounded-xl bg-[#153B40] dark:bg-[#4388FF] text-white text-[11px] font-semibold cursor-pointer"
              >
                {tr(lang, 'Go', 'খুঁজুন', 'بحث')}
              </button>
            </form>

            <div className="grid grid-cols-2 gap-2.5 mt-3.5">
              {canWrite && (
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => onAddWorker('company')}
                  className="justify-start h-10 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5 text-[#4388FF]" />
                  <span>{tr(lang, 'Add Worker', 'কর্মী যোগ', 'إضافة عامل')}</span>
                </AnimatedButton>
              )}
              {canWrite && (
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => onRecordPayment()}
                  className="justify-start h-10 rounded-xl"
                >
                  <Wallet className="w-3.5 h-3.5 text-[#00C985]" />
                  <span>{tr(lang, 'Record Payment', 'জমা নিন', 'تسجيل دفعة')}</span>
                </AnimatedButton>
              )}
              <AnimatedButton
                variant="secondary"
                size="sm"
                onClick={() => onNavigate('search')}
                className="justify-start h-10 rounded-xl"
              >
                <Search className="w-3.5 h-3.5 text-[#8957FF]" />
                <span>{tr(lang, 'Search Worker', 'সার্চ কর্মী', 'بحث عن عامل')}</span>
              </AnimatedButton>
              {canWrite && (
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => onGenerateDues()}
                  className="justify-start h-10 rounded-xl"
                >
                  <FilePlus2 className="w-3.5 h-3.5 text-[#153B40] dark:text-[#94C5FF]" />
                  <span>{tr(lang, 'Generate Dues', 'পাওনা তৈরি', 'إنشاء مستحقات')}</span>
                </AnimatedButton>
              )}
              <AnimatedButton
                variant="secondary"
                size="sm"
                onClick={onExportBackup}
                className="justify-start h-10 rounded-xl"
              >
                <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>{tr(lang, 'Export Backup', 'ব্যাকআপ', 'تصدير نسخة')}</span>
              </AnimatedButton>
              <AnimatedButton
                variant="secondary"
                size="sm"
                onClick={() => onNavigate('reminders')}
                className="justify-start h-10 rounded-xl"
              >
                <Bell className="w-3.5 h-3.5 text-[#F05A65]" />
                <span>{tr(lang, 'View Reminders', 'রিমাইন্ডার', 'التنبيهات')}</span>
              </AnimatedButton>
            </div>
          </div>
        </section>
      </div>

      {/* Charts */}
      <div data-dash-card>
        <DashboardCharts
          employees={data.employees}
          payments={data.payments}
          lang={lang}
          onOpenHistory={() => onNavigate('history')}
        />
      </div>

      {/* Domestic Monthly Payments Overview (Preserving Legacy Domestic Dashboard) */}
      <section data-dash-card className="soft-card p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <span className="text-[11px] font-bold tracking-wide text-[#00A86B]">
              {tr(lang, 'DOMESTIC ACCOUNTS', 'ডোমেস্টিক হিসাব', 'حسابات العمالة المنزلية')}
            </span>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
              {tr(
                lang,
                'Domestic Monthly Payments',
                'ডোমেস্টিক কর্মীর মাসিক হিসাব',
                'الدفعات الشهرية للعمالة المنزلية'
              )}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              value={domesticMonth}
              onChange={(e) => setDomesticMonth(e.target.value || monthNow())}
              aria-label="Domestic overview month"
              className="h-9 px-3 rounded-xl soft-surface-secondary text-xs font-semibold text-[var(--text-primary)] outline-none"
            />
            <select
              value={domesticStatus}
              onChange={(e) => setDomesticStatus(e.target.value)}
              aria-label="Filter domestic payment status"
              className="h-9 px-3 rounded-xl soft-surface-secondary text-xs font-semibold text-[var(--text-primary)] outline-none"
            >
              <option value="">{tr(lang, 'All statuses', 'সব অবস্থা', 'جميع الحالات')}</option>
              <option value="PAID">PAID</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="UNPAID">UNPAID</option>
            </select>
            {canWrite && domesticMonth === monthNow() && (
              <AnimatedButton
                variant="secondary"
                size="sm"
                onClick={() => onGenerateDues('domestic')}
              >
                {tr(lang, 'Generate Domestic Dues', 'ডোমেস্টিক পাওনা তৈরি', 'إنشاء مستحقات العمالة المنزلية')}
              </AnimatedButton>
            )}
            <AnimatedButton
              variant="teal"
              size="sm"
              onClick={() => onNavigate('domestic-payments')}
            >
              <span>{tr(lang, 'Full Register', 'পূর্ণ তালিকা', 'السجل الكامل')}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </AnimatedButton>
          </div>
        </div>

        <div className="overflow-x-auto sleek-scroll mt-4">
          <table className="w-full text-start border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs">
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Worker / Iqama', 'কর্মী / ইকামা', 'العامل / الإقامة')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Owner / Sponsor', 'মালিক / স্পনসর', 'المالك / الكفيل')}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {tr(lang, 'Expected', 'পাওনা', 'المتوقع')}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {tr(lang, 'Paid', 'জমা', 'المدفوع')}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {tr(lang, 'Balance', 'বকেয়া', 'المتبقي')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Status', 'অবস্থা', 'الحالة')}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {tr(lang, 'Action', 'কাজ', 'إجراء')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {domesticFiltered.slice(0, 8).map((r) => (
                <tr
                  key={r.e.id}
                  className="hover:bg-[var(--surface-secondary)]/70 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="font-semibold text-[var(--text-primary)]">{r.e.fullName}</div>
                    <div className="text-[11px] font-mono-data text-[var(--text-secondary)]">
                      {r.e.iqamaNumber}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-[var(--text-primary)]">
                      {r.e.ownerName || tr(lang, 'Not entered', 'দেওয়া নেই', 'غير مسجل')}
                    </div>
                    <div className="text-[11px] font-mono-data text-[var(--text-secondary)]">
                      {r.e.ownerPhone || ''}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-end font-mono-data">{money(r.expected)}</td>
                  <td className="py-3 px-3 text-end font-mono-data text-[#009965] dark:text-[#3EE5A8]">
                    {money(r.paid)}
                  </td>
                  <td className="py-3 px-3 text-end font-mono-data text-[#D93845] dark:text-[#FF848D]">
                    {money(r.balance)}
                  </td>
                  <td className="py-3 px-3">
                    <StatusLabel
                      status={r.status}
                      lang={lang}
                      subText={!r.recorded ? tr(lang, 'Not generated', 'তৈরি হয়নি', 'لم يُنشأ') : undefined}
                    />
                  </td>
                  <td className="py-3 px-3 text-end">
                    <div className="inline-flex items-center gap-1.5">
                      {canWrite && r.balance > 0 && !r.e.archived && !r.e.deletedAt && (
                        <AnimatedButton
                          variant="primary"
                          size="sm"
                          onClick={() => onRecordPayment(r.e.id, domesticMonth)}
                        >
                          {tr(lang, 'Pay', 'জমা', 'دفع')}
                        </AnimatedButton>
                      )}
                      {!r.e.deletedAt && (
                        <AnimatedButton
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenProfile(r.e.id)}
                        >
                          {tr(lang, 'Profile', 'প্রোফাইল', 'الملف')}
                        </AnimatedButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!domesticFiltered.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[var(--text-secondary)]">
                    {tr(
                      lang,
                      'No domestic accounts for this month and filter.',
                      'এই মাসে কোনো ডোমেস্টিক হিসাব পাওয়া যায়নি।',
                      'لا توجد حسابات عمالة منزلية لهذا الشهر.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
