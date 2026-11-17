import React, { useMemo, useRef, useState } from 'react';
import { Edit3, Search, User } from 'lucide-react';
import type { Employee, Language } from '../../types/ems';
import { dayDiff, norm, workerKind } from '../../lib/accounting';
import { tr, translateStatus } from '../../lib/i18n';
import { useStaggerEntrance } from '../../hooks/useGsapAnimations';
import { AnimatedButton } from '../ui/AnimatedButton';
import { StatusLabel } from '../ui/StatusLabel';

interface VisasViewProps {
  employees: Employee[];
  lang: Language;
  canWrite: boolean;
  onOpenProfile: (id: string) => void;
  onEditVisa: (id: string) => void;
}

export const VisasView: React.FC<VisasViewProps> = ({
  employees,
  lang,
  canWrite,
  onOpenProfile,
  onEditVisa,
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    const q = norm(query);
    return employees.filter((e) => {
      if (e.deletedAt || !e.exitReentry || !e.exitReentry.status || e.exitReentry.status === 'None') {
        return false;
      }
      if (statusFilter && e.exitReentry.status !== statusFilter) return false;
      if (!q) return true;
      return [e.fullName, e.iqamaNumber, e.phone, e.exitReentry.number].some((x) =>
        norm(x).includes(q)
      );
    });
  }, [employees, query, statusFilter]);

  useStaggerEntrance(ref, '[data-visa-row]', [statusFilter, lang]);

  return (
    <div ref={ref} className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          {tr(lang, 'Exit Re-entry Visas', 'এক্সিট রি-এন্ট্রি ভিসা', 'تأشيرات الخروج والعودة')}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {tr(
            lang,
            'Track issued visas, travel status, and return deadlines for company and domestic workers.',
            'কোম্পানি ও ডোমেস্টিক কর্মীদের ভিসা, যাত্রা ও ফেরার তারিখ অনুসরণ করুন।',
            'متابعة التأشيرات الصادرة وتواريخ العودة لعمال الشركات والعمالة المنزلية.'
          )}
        </p>
      </div>

      <section className="soft-card p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
          <div className="relative flex items-center w-full md:w-80">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute start-3 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr(
                lang,
                'Search Iqama, name, phone, visa no…',
                'ইকামা, নাম, ফোন বা ভিসা নম্বর…',
                'ابحث بالإقامة أو الاسم أو رقم التأشيرة…'
              )}
              aria-label="Search exit re-entry visas"
              className="w-full h-10 ps-9 pe-3 rounded-xl soft-surface-secondary text-xs text-[var(--text-primary)] outline-none focus:border-[#4388FF]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter visa status"
            className="h-10 px-3 rounded-xl soft-surface-secondary text-xs font-semibold text-[var(--text-primary)] outline-none"
          >
            <option value="">{tr(lang, 'All visas', 'সব ভিসা', 'جميع التأشيرات')}</option>
            <option value="Issued">Issued</option>
            <option value="Outside KSA">Outside KSA</option>
            <option value="Returned">Returned</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto sleek-scroll mt-4">
          <table className="w-full text-start border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs">
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Worker', 'কর্মী', 'العامل')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Phone', 'ফোন', 'الهاتف')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Visa Number', 'ভিসা নম্বর', 'رقم التأشيرة')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Issued', 'ইস্যুর তারিখ', 'تاريخ الإصدار')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Return By', 'ফেরার শেষ তারিখ', 'تاريخ العودة')}
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
              {rows.map((emp) => {
                const v = emp.exitReentry!;
                const n = dayDiff(v.returnBy);
                const overdue =
                  ['Issued', 'Outside KSA'].includes(v.status || '') &&
                  n !== null &&
                  n < 0;
                return (
                  <tr
                    key={emp.id}
                    data-visa-row
                    className="hover:bg-[var(--surface-secondary)]/75 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[var(--text-primary)]">{emp.fullName}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        <span className="font-mono-data">{emp.iqamaNumber}</span> ·{' '}
                        {translateStatus(lang, workerKind(emp) === 'domestic' ? 'Domestic' : 'Company')}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono-data text-[var(--text-primary)]">
                      {emp.phone}
                    </td>
                    <td className="py-3 px-3 font-mono-data text-[var(--text-primary)]">
                      {v.number || '—'}
                    </td>
                    <td className="py-3 px-3 font-mono-data text-[var(--text-secondary)]">
                      {v.issueDate || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <div
                        className={`font-mono-data ${
                          overdue
                            ? 'text-[#D93845] dark:text-[#FF848D] font-bold'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {v.returnBy || '—'}
                      </div>
                      {overdue && (
                        <div className="text-[11px] font-semibold text-[#D93845] dark:text-[#FF848D]">
                          {tr(lang, 'Overdue', 'মেয়াদ উত্তীর্ণ', 'متأخر')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <StatusLabel status={v.status || 'None'} lang={lang} />
                    </td>
                    <td className="py-3 px-3 text-end">
                      <div className="inline-flex items-center gap-1.5">
                        <AnimatedButton
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenProfile(emp.id)}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>{tr(lang, 'Profile', 'প্রোফাইল', 'الملف')}</span>
                        </AnimatedButton>
                        {canWrite && (
                          <AnimatedButton
                            variant="secondary"
                            size="sm"
                            onClick={() => onEditVisa(emp.id)}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{tr(lang, 'Edit', 'এডিট', 'تعديل')}</span>
                          </AnimatedButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!rows.length && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-[var(--text-secondary)]">
                    {tr(
                      lang,
                      'No matching visas. Open a worker profile to add Exit Re-entry Visa details.',
                      'কোনো ভিসার তথ্য পাওয়া যায়নি। কর্মীর প্রোফাইল থেকে ভিসা যোগ করুন।',
                      'لا توجد تأشيرات مطابقة. افتح ملف العامل لإضافة بيانات التأشيرة.'
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
