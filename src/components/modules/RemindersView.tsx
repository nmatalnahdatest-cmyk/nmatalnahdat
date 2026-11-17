import React, { useMemo, useRef, useState } from 'react';
import { MessageCircle, Search, User } from 'lucide-react';
import type { Employee, Language } from '../../types/ems';
import { computeReminders, norm } from '../../lib/accounting';
import { tr } from '../../lib/i18n';
import { useStaggerEntrance } from '../../hooks/useGsapAnimations';
import { AnimatedButton } from '../ui/AnimatedButton';
import { StatusLabel } from '../ui/StatusLabel';

interface RemindersViewProps {
  employees: Employee[];
  lang: Language;
  onOpenProfile: (id: string) => void;
  onOpenWhatsApp: (id: string) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  employees,
  lang,
  onOpenProfile,
  onOpenWhatsApp,
}) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'Iqama' | 'Visa return'>('');
  const [daysWindow, setDaysWindow] = useState<'60' | '30' | '7' | 'overdue'>('60');
  const listRef = useRef<HTMLDivElement>(null);

  const allReminders = useMemo(() => computeReminders(employees), [employees]);

  const filtered = useMemo(() => {
    const q = norm(query);
    return allReminders.filter((r) => {
      if (typeFilter && r.type !== typeFilter) return false;
      if (daysWindow === 'overdue' && r.days >= 0) return false;
      if (daysWindow !== 'overdue' && r.days > Number(daysWindow)) return false;
      if (q && ![r.e.fullName, r.e.iqamaNumber, r.e.phone].some((v) => norm(v).includes(q))) {
        return false;
      }
      return true;
    });
  }, [allReminders, typeFilter, daysWindow, query]);

  useStaggerEntrance(listRef, '[data-rem-row]', [typeFilter, daysWindow, lang]);

  const overdueCount = allReminders.filter((r) => r.days < 0).length;
  const d7 = allReminders.filter((r) => r.days >= 0 && r.days <= 7).length;
  const d30 = allReminders.filter((r) => r.days > 7 && r.days <= 30).length;
  const d60 = allReminders.filter((r) => r.days > 30).length;

  return (
    <div ref={listRef} className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          {tr(lang, 'Dates that matter.', 'গুরুত্বপূর্ণ তারিখ।', 'مواعيد مهمة.')}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {tr(
            lang,
            'In-app reminders update automatically from saved Iqama and Exit Re-entry Visa records.',
            'সংরক্ষিত ইকামা ও ভিসার তারিখ অনুযায়ী রিমাইন্ডার স্বয়ংক্রিয়ভাবে হালনাগাদ হয়।',
            'تتحدث التنبيهات تلقائياً من سجلات الإقامة وتأشيرات الخروج والعودة المحفوظة.'
          )}
        </p>
      </div>

      {/* Urgency Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="soft-card p-4 sm:p-5">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            {tr(lang, 'Overdue', 'মেয়াদ উত্তীর্ণ', 'متأخر')}
          </div>
          <div className="text-2xl font-bold tabular-nums text-[#D93845] dark:text-[#FF848D] mt-1.5">
            {overdueCount}
          </div>
        </div>
        <div className="soft-card p-4 sm:p-5">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            {tr(lang, 'Within 7 days', '৭ দিনের মধ্যে', 'خلال ٧ أيام')}
          </div>
          <div className="text-2xl font-bold tabular-nums text-[#B57B00] dark:text-[#FFE175] mt-1.5">
            {d7}
          </div>
        </div>
        <div className="soft-card p-4 sm:p-5">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            {tr(lang, '8–30 days', '৮–৩০ দিন', '٨–٣٠ يوماً')}
          </div>
          <div className="text-2xl font-bold tabular-nums text-[#4388FF] mt-1.5">
            {d30}
          </div>
        </div>
        <div className="soft-card p-4 sm:p-5">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            {tr(lang, '31–60 days', '৩১–৬০ দিন', '٣١–٦٠ يوماً')}
          </div>
          <div className="text-2xl font-bold tabular-nums text-[var(--text-primary)] mt-1.5">
            {d60}
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <section className="soft-card p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
          <div className="relative flex items-center w-full md:w-72">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute start-3 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr(lang, 'Search Iqama / name…', 'ইকামা বা নাম খুঁজুন…', 'ابحث بالإقامة أو الاسم…')}
              aria-label="Search reminders"
              className="w-full h-10 ps-9 pe-3 rounded-xl soft-surface-secondary text-xs text-[var(--text-primary)] outline-none focus:border-[#4388FF]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              aria-label="Filter reminder type"
              className="h-10 px-3 rounded-xl soft-surface-secondary text-xs font-semibold text-[var(--text-primary)] outline-none"
            >
              <option value="">{tr(lang, 'All reminders', 'সব রিমাইন্ডার', 'جميع التنبيهات')}</option>
              <option value="Iqama">{tr(lang, 'Iqama expiry', 'ইকামার মেয়াদ', 'انتهاء الإقامة')}</option>
              <option value="Visa return">{tr(lang, 'Visa return', 'ভিসা প্রত্যাবর্তন', 'عودة التأشيرة')}</option>
            </select>

            <div className="flex items-center p-1 rounded-xl soft-surface-secondary">
              {(
                [
                  ['60', tr(lang, '60 Days', '৬০ দিন', '٦٠ يوماً')],
                  ['30', tr(lang, '30 Days', '৩০ দিন', '٣٠ يوماً')],
                  ['7', tr(lang, '7 Days', '৭ দিন', '٧ أيام')],
                  ['overdue', tr(lang, 'Overdue', 'মেয়াদ পার', 'متأخر')],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDaysWindow(val)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    daysWindow === val
                      ? 'bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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
                  {tr(lang, 'Reminder', 'ধরন', 'التنبيه')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Date', 'তারিখ', 'التاريخ')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Urgency', 'সময় বাকি', 'الأولوية')}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {tr(lang, 'Actions', 'কাজ', 'إجراءات')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((r) => (
                <tr
                  key={`${r.e.id}-${r.type}-${r.date}`}
                  data-rem-row
                  className="hover:bg-[var(--surface-secondary)]/70 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="font-semibold text-[var(--text-primary)]">{r.e.fullName}</div>
                    <div className="text-[11px] font-mono-data text-[var(--text-secondary)]">
                      {r.e.iqamaNumber}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-[var(--text-primary)]">{r.type}</td>
                  <td className="py-3 px-3 font-mono-data text-[var(--text-primary)]">{r.date}</td>
                  <td className="py-3 px-3">
                    <StatusLabel
                      status={r.days < 0 ? 'Overdue' : r.days <= 7 ? 'Transfer Pending' : 'Issued'}
                      lang={lang}
                      subText={
                        r.days < 0
                          ? `${Math.abs(r.days)} ${tr(lang, 'days overdue', 'দিন পার হয়েছে', 'يوم تأخير')}`
                          : `${r.days} ${tr(lang, 'days left', 'দিন বাকি', 'يوم متبقي')}`
                      }
                    />
                  </td>
                  <td className="py-3 px-3 text-end">
                    <div className="inline-flex items-center gap-1.5">
                      <AnimatedButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenProfile(r.e.id)}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{tr(lang, 'Profile', 'প্রোফাইল', 'الملف')}</span>
                      </AnimatedButton>
                      <AnimatedButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenWhatsApp(r.e.id)}
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#00C985]" />
                        <span>{tr(lang, 'WhatsApp', 'হোয়াটসঅ্যাপ', 'واتساب')}</span>
                      </AnimatedButton>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-[var(--text-secondary)]">
                    {tr(lang, 'No matching reminders.', 'কোনো রিমাইন্ডার পাওয়া যায়নি।', 'لا توجد تنبيهات مطابقة.')}
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
