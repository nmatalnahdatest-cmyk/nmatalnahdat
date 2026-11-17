import React, { useMemo, useRef, useState } from 'react';
import { FilePlus2, Printer, Search, User, Wallet } from 'lucide-react';
import type { Employee, Language, Payment, WorkerType } from '../../types/ems';
import {
  computePaymentGroups,
  money,
  monthNow,
  norm,
} from '../../lib/accounting';
import { tr } from '../../lib/i18n';
import { useStaggerEntrance } from '../../hooks/useGsapAnimations';
import { AnimatedButton } from '../ui/AnimatedButton';
import { StatusLabel } from '../ui/StatusLabel';

interface PaymentsViewProps {
  type: WorkerType;
  employees: Employee[];
  payments: Payment[];
  lang: Language;
  canWrite: boolean;
  onGenerateDues: (type: WorkerType) => void;
  onRecordPayment: (workerId?: string, period?: string, type?: WorkerType) => void;
  onOpenProfile: (workerId: string) => void;
  onPrintReceipt: (paymentId: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  type,
  employees,
  payments,
  lang,
  canWrite,
  onGenerateDues,
  onRecordPayment,
  onOpenProfile,
  onPrintReceipt,
}) => {
  const [period, setPeriod] = useState(monthNow());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const groups = useMemo(
    () => computePaymentGroups(employees, payments, type, period),
    [employees, payments, type, period]
  );

  const filtered = useMemo(() => {
    const q = norm(query);
    return groups.filter((g) => {
      const st = g.balance ? (g.paid ? 'PARTIAL' : 'UNPAID') : 'PAID';
      if (statusFilter && st !== statusFilter) return false;
      if (!q) return true;
      return [
        g.e.fullName,
        g.e.iqamaNumber,
        g.e.phone,
        g.e.ownerName,
        g.e.companyName,
      ].some((x) => norm(x).includes(q));
    });
  }, [groups, statusFilter, query]);

  useStaggerEntrance(ref, '[data-pay-row]', [type, period, statusFilter, lang]);

  const totalExpected = filtered.reduce((s, g) => s + g.expected, 0);
  const totalPaid = filtered.reduce((s, g) => s + g.paid, 0);
  const totalBalance = filtered.reduce((s, g) => s + g.balance, 0);

  return (
    <div ref={ref} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {type === 'domestic'
              ? tr(lang, 'Domestic Payments', 'ডোমেস্টিক পেমেন্ট', 'دفعات العمالة المنزلية')
              : tr(lang, 'Company Payments', 'কোম্পানির পেমেন্ট', 'دفعات الشركات')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {type === 'domestic'
              ? tr(
                  lang,
                  'Monthly payment register for domestic workers (default 300 SAR, supports custom fees).',
                  'ডোমেস্টিক কর্মীদের মাসিক পেমেন্ট রেজিস্টার (ডিফল্ট ৩০০ SAR)।',
                  'سجل الدفعات الشهرية للعمالة المنزلية (الافتراضي ٣٠٠ ريال).'
                )
              : tr(
                  lang,
                  'Generate monthly dues, track partial payments, and print SAR receipts.',
                  'মাসিক পাওনা তৈরি করুন, আংশিক জমা রাখুন এবং রশিদ প্রিন্ট করুন।',
                  'إنشاء المستحقات الشهرية ومتابعة الدفعات الجزئية وطباعة الإيصالات.'
                )}
          </p>
        </div>

        {canWrite && (
          <div className="flex flex-wrap items-center gap-2">
            <AnimatedButton variant="secondary" onClick={() => onGenerateDues(type)}>
              <FilePlus2 className="w-4 h-4" />
              <span>{tr(lang, 'Generate Monthly Dues', 'মাসিক পাওনা তৈরি', 'إنشاء مستحقات الشهر')}</span>
            </AnimatedButton>
            <AnimatedButton
              variant="teal"
              onClick={() => onRecordPayment(undefined, period, type)}
            >
              <Wallet className="w-4 h-4" />
              <span>{tr(lang, 'Record Payment', 'পেমেন্ট জমা', 'تسجيل دفعة')}</span>
            </AnimatedButton>
          </div>
        )}
      </div>

      {/* Totals Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="soft-card p-4 sm:p-5">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            {tr(lang, 'Expected Amount', 'মোট পাওনা', 'المبلغ المتوقع')}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-data text-[var(--text-primary)] mt-1">
            {money(totalExpected)} <span className="text-xs font-normal text-[var(--text-secondary)]">SAR</span>
          </div>
        </div>
        <div className="soft-card p-4 sm:p-5">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            {tr(lang, 'Collected Amount', 'মোট জমা', 'المبلغ المدفوع')}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-data text-[#009965] dark:text-[#3EE5A8] mt-1">
            {money(totalPaid)} <span className="text-xs font-normal text-[var(--text-secondary)]">SAR</span>
          </div>
        </div>
        <div className="soft-card p-4 sm:p-5">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            {tr(lang, 'Remaining Balance', 'মোট বাকি', 'الرصيد المتبقي')}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-data text-[#D93845] dark:text-[#FF848D] mt-1">
            {money(totalBalance)} <span className="text-xs font-normal text-[var(--text-secondary)]">SAR</span>
          </div>
        </div>
      </div>

      {/* Filters & Register Table */}
      <section className="soft-card p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
          <div className="relative flex items-center w-full md:w-72">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute start-3 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr(lang, 'Search worker / Iqama / phone…', 'কর্মী, ইকামা বা ফোন…', 'ابحث بالعامل أو الإقامة…')}
              aria-label="Search monthly payments"
              className="w-full h-10 ps-9 pe-3 rounded-xl soft-surface-secondary text-xs text-[var(--text-primary)] outline-none focus:border-[#4388FF]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                aria-label="Filter payment month"
                className="h-10 px-3 rounded-xl soft-surface-secondary text-xs font-semibold text-[var(--text-primary)] outline-none"
              />
              {period && (
                <button
                  type="button"
                  onClick={() => setPeriod('')}
                  className="h-10 px-3 rounded-xl soft-surface-secondary text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {tr(lang, 'All Months', 'সব মাস', 'كل الأشهر')}
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter payment status"
              className="h-10 px-3 rounded-xl soft-surface-secondary text-xs font-semibold text-[var(--text-primary)] outline-none"
            >
              <option value="">{tr(lang, 'All statuses', 'সব অবস্থা', 'جميع الحالات')}</option>
              <option value="PAID">PAID</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="UNPAID">UNPAID</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto sleek-scroll mt-4">
          <table className="w-full text-start border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs">
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Worker', 'কর্মী', 'العامل')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Period', 'মাস', 'الفترة')}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {tr(lang, 'Expected (SAR)', 'পাওনা', 'المتوقع')}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {tr(lang, 'Paid (SAR)', 'জমা', 'المدفوع')}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {tr(lang, 'Balance (SAR)', 'বাকি', 'المتبقي')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Status', 'অবস্থা', 'الحالة')}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {tr(lang, 'Actions', 'কাজ', 'إجراءات')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((g) => {
                const status = g.balance ? (g.paid ? 'PARTIAL' : 'UNPAID') : 'PAID';
                const latestPaymentId = g.records[0]?.id;
                return (
                  <tr
                    key={`${g.e.id}-${g.key}`}
                    data-pay-row
                    className="hover:bg-[var(--surface-secondary)]/75 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[var(--text-primary)]">{g.e.fullName}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        <span className="font-mono-data">{g.e.iqamaNumber}</span>
                        {g.e.deletedAt ? ' · Deleted' : ''}
                        {type === 'domestic'
                          ? ` · ${tr(lang, 'Owner', 'স্পনসর', 'الكفيل')}: ${g.e.ownerName || 'Not entered'}`
                          : g.e.companyName
                          ? ` · ${g.e.companyName}`
                          : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono-data text-[var(--text-primary)]">{g.key}</td>
                    <td className="py-3 px-3 text-end font-mono-data">{money(g.expected)}</td>
                    <td className="py-3 px-3 text-end font-mono-data text-[#009965] dark:text-[#3EE5A8]">
                      {money(g.paid)}
                    </td>
                    <td className="py-3 px-3 text-end font-mono-data text-[#D93845] dark:text-[#FF848D]">
                      {money(g.balance)}
                    </td>
                    <td className="py-3 px-3">
                      <StatusLabel status={status} lang={lang} />
                    </td>
                    <td className="py-3 px-3 text-end">
                      <div className="inline-flex items-center gap-1.5">
                        {canWrite && g.balance > 0 && !g.e.archived && !g.e.deletedAt && (
                          <AnimatedButton
                            variant="primary"
                            size="sm"
                            onClick={() => onRecordPayment(g.e.id, g.key, type)}
                          >
                            {tr(lang, 'Pay', 'জমা', 'دفع')}
                          </AnimatedButton>
                        )}
                        {latestPaymentId && g.paid > 0 && (
                          <AnimatedButton
                            variant="secondary"
                            size="sm"
                            onClick={() => onPrintReceipt(latestPaymentId)}
                            title={tr(lang, 'Print Receipt', 'রশিদ প্রিন্ট', 'طباعة الإيصال')}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </AnimatedButton>
                        )}
                        <AnimatedButton
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenProfile(g.e.id)}
                          title={tr(lang, 'Profile', 'প্রোফাইল', 'الملف')}
                        >
                          <User className="w-3.5 h-3.5" />
                        </AnimatedButton>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-[var(--text-secondary)]">
                    {tr(
                      lang,
                      'No monthly records for this period. Choose another month or generate monthly dues.',
                      'এই মাসের কোনো রেকর্ড নেই। অন্য মাস দেখুন অথবা মাসিক পাওনা তৈরি করুন।',
                      'لا توجد سجلات شهرية لهذه الفترة. اختر شهراً آخر أو أنشئ مستحقات الشهر.'
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
