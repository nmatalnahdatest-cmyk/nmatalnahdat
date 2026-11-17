import React, { useMemo, useRef, useState } from 'react';
import { Download, Printer, Search } from 'lucide-react';
import type { Employee, Language, Payment } from '../../types/ems';
import { cents, exportCSV, norm, sar } from '../../lib/accounting';
import { tr } from '../../lib/i18n';
import { useStaggerEntrance } from '../../hooks/useGsapAnimations';
import { AnimatedButton } from '../ui/AnimatedButton';

interface PaymentHistoryViewProps {
  employees: Employee[];
  payments: Payment[];
  lang: Language;
  onPrintReceipt: (paymentId: string) => void;
  onOpenProfile: (workerId: string) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const PaymentHistoryView: React.FC<PaymentHistoryViewProps> = ({
  employees,
  payments,
  lang,
  onPrintReceipt,
  onOpenProfile,
  onNotify,
}) => {
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const workerMap = useMemo(() => {
    const m = new Map<string, Employee>();
    for (const e of employees) m.set(e.id, e);
    return m;
  }, [employees]);

  const rows = useMemo(() => {
    const q = norm(query);
    return payments
      .filter((p) => cents(p.paidAmount) > 0)
      .filter((p) => {
        if (!q) return true;
        const w = workerMap.get(p.employeeId);
        return [
          p.employeeName,
          w?.iqamaNumber,
          p.referenceNumber,
          p.paymentMethod,
          `${p.year}-${String(p.month).padStart(2, '0')}`,
          p.paymentDate,
        ].some((v) => norm(v).includes(q));
      })
      .sort((a, b) => String(b.paymentDate).localeCompare(String(a.paymentDate)));
  }, [payments, query, workerMap]);

  useStaggerEntrance(ref, '[data-hist-row]', [lang]);

  const handleExport = () => {
    const ok = exportCSV(
      'Payments',
      payments as unknown as Record<string, unknown>[]
    );
    if (!ok) onNotify(tr(lang, 'No records to export.', 'রপ্তানি করার মতো কোনো রেকর্ড নেই।', 'لا توجد سجلات للتصدير.'), true);
    else onNotify(tr(lang, 'Payments CSV exported.', 'পেমেন্ট CSV ডাউনলোড হয়েছে।', 'تم تصدير سجل الدفعات.'));
  };

  return (
    <div ref={ref} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {tr(lang, 'Payment History', 'পেমেন্ট ইতিহাস', 'سجل المدفوعات')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {tr(
              lang,
              'Complete transaction records, payment methods, reference numbers, and printable receipts.',
              'সম্পূর্ণ লেনদেনের ইতিহাস, পেমেন্ট পদ্ধতি, রেফারেন্স নম্বর এবং রশিদ প্রিন্ট।',
              'سجل المعاملات الكامل وطرق الدفع وأرقام المرجع وطباعة الإيصالات.'
            )}
          </p>
        </div>

        <AnimatedButton variant="secondary" onClick={handleExport}>
          <Download className="w-4 h-4" />
          <span>{tr(lang, 'Export CSV', 'CSV ডাউনলোড', 'تصدير CSV')}</span>
        </AnimatedButton>
      </div>

      <section className="soft-card p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
          <div className="relative flex items-center w-full md:w-80">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute start-3 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr(
                lang,
                'Search worker, Iqama, reference, month…',
                'কর্মী, ইকামা, রেফারেন্স বা মাস…',
                'ابحث بالعامل أو الإقامة أو المرجع…'
              )}
              aria-label="Search payment history"
              className="w-full h-10 ps-9 pe-3 rounded-xl soft-surface-secondary text-xs text-[var(--text-primary)] outline-none focus:border-[#4388FF]"
            />
          </div>
          <span className="text-xs font-mono-data text-[var(--text-secondary)]">
            {rows.length} {tr(lang, 'records', 'টি রেকর্ড', 'سجل')}
          </span>
        </div>

        <div className="overflow-x-auto sleek-scroll mt-4">
          <table className="w-full text-start border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs">
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Worker', 'কর্মী', 'العامل')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Month / Year', 'মাস / বছর', 'الشهر / السنة')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Payment Date', 'জমার তারিখ', 'تاريخ الدفع')}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {tr(lang, 'Paid (SAR)', 'জমা (SAR)', 'المدفوع (ريال)')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Method / Reference', 'পদ্ধতি / রেফারেন্স', 'الطريقة / المرجع')}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {tr(lang, 'Receipt', 'রশিদ', 'الإيصال')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {rows.map((p) => {
                const w = workerMap.get(p.employeeId);
                return (
                  <tr
                    key={p.id}
                    data-hist-row
                    className="hover:bg-[var(--surface-secondary)]/75 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => w && onOpenProfile(w.id)}
                        className="text-start font-semibold text-[var(--text-primary)] hover:text-[#4388FF] cursor-pointer"
                      >
                        {p.employeeName}
                      </button>
                      <div className="text-[11px] font-mono-data text-[var(--text-secondary)]">
                        {w?.iqamaNumber || tr(lang, 'Worker unavailable', 'তথ্য নেই', 'العامل غير متاح')}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono-data">
                      {String(p.month).padStart(2, '0')}/{p.year}
                    </td>
                    <td className="py-3 px-3 font-mono-data text-[var(--text-secondary)]">
                      {p.paymentDate}
                    </td>
                    <td className="py-3 px-3 text-end font-mono-data font-bold text-[#009965] dark:text-[#3EE5A8]">
                      {sar(p.paidAmount)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-[var(--text-primary)]">{p.paymentMethod}</div>
                      <div className="text-[11px] font-mono-data text-[var(--text-secondary)]">
                        {p.referenceNumber || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-end">
                      <AnimatedButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onPrintReceipt(p.id)}
                        aria-label="Print receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </AnimatedButton>
                    </td>
                  </tr>
                );
              })}

              {!rows.length && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-[var(--text-secondary)]">
                    {tr(lang, 'No payment transactions saved yet.', 'এখনো কোনো পেমেন্ট রেকর্ড নেই।', 'لا توجد مدفوعات مسجلة بعد.')}
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
