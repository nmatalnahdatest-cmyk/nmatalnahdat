import React, { useMemo, useRef } from 'react';
import { Search } from 'lucide-react';
import type { Employee, Language, Payment } from '../../types/ems';
import { computeAccount, money, norm, workerKind } from '../../lib/accounting';
import { tr, translateStatus } from '../../lib/i18n';
import { useStaggerEntrance } from '../../hooks/useGsapAnimations';
import { AnimatedButton } from '../ui/AnimatedButton';
import { Avatar } from '../ui/Avatar';

interface WorkerSearchViewProps {
  employees: Employee[];
  payments: Payment[];
  query: string;
  onChangeQuery: (q: string) => void;
  onOpenProfile: (id: string) => void;
  lang: Language;
}

export const WorkerSearchView: React.FC<WorkerSearchViewProps> = ({
  employees,
  payments,
  query,
  onChangeQuery,
  onOpenProfile,
  lang,
}) => {
  const resultsRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    return employees.filter(
      (e) =>
        !e.deletedAt &&
        [
          e.fullName,
          e.arabicName,
          e.iqamaNumber,
          e.phone,
          e.employeeCode,
          e.ownerName,
          e.ownerPhone,
          e.companyName,
        ].some((x) => norm(x).includes(q))
    );
  }, [employees, query]);

  useStaggerEntrance(resultsRef, '[data-search-card]', [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = norm(query);
    if (!q) return;
    const exact = matches.filter((m) => norm(m.iqamaNumber) === q);
    if (exact.length === 1) {
      onOpenProfile(exact[0].id);
    }
  };

  return (
    <div className="space-y-6">
      <section className="soft-card p-6 md:p-8">
        <span className="text-[11px] font-bold tracking-wider text-[#4388FF]">
          {tr(lang, 'PEOPLE & ACCOUNTS', 'কর্মী ও হিসাব', 'الأفراد والحسابات')}
        </span>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mt-1.5 tracking-tight">
          {tr(
            lang,
            'One worker. The whole picture.',
            'একজন কর্মী। সম্পূর্ণ তথ্য।',
            'عامل واحد. صورة كاملة.'
          )}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
          {tr(
            lang,
            'Search company and domestic workers—including archived profiles—by Iqama, English or Arabic name, phone, employee code, or sponsor.',
            'ইকামা, ইংরেজি বা আরবি নাম, ফোন, কর্মী কোড বা স্পনসর দিয়ে কোম্পানি ও ডোমেস্টিক কর্মীদের খুঁজুন।',
            'ابحث في عمال الشركات والعمالة المنزلية والملفات المؤرشفة برقم الإقامة أو الاسم أو الهاتف أو الكود أو الكفيل.'
          )}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-2.5 max-w-2xl">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute start-4 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => onChangeQuery(e.target.value)}
              placeholder={tr(
                lang,
                'Enter Iqama, name, Arabic name, code, or phone…',
                'ইকামা, নাম, কোড বা ফোন নম্বর লিখুন…',
                'أدخل رقم الإقامة أو الاسم أو الهاتف…'
              )}
              aria-label="Search workers"
              autoComplete="off"
              className="w-full h-12 ps-11 pe-4 rounded-2xl soft-surface-secondary text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#4388FF]"
            />
          </div>
          <AnimatedButton type="submit" variant="teal" size="lg" className="h-12 px-6">
            {tr(lang, 'Find Worker', 'খুঁজুন', 'بحث')}
          </AnimatedButton>
        </form>
      </section>

      <div ref={resultsRef}>
        {!norm(query) ? (
          <div className="soft-card p-12 text-center">
            <Search className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
            <p className="text-sm font-medium text-[var(--text-secondary)] mt-3">
              {tr(
                lang,
                'Enter an Iqama, name, phone, or sponsor to see matching worker profiles.',
                'কর্মীর তথ্য দেখতে ইকামা, নাম, ফোন বা স্পনসরের নাম লিখুন।',
                'أدخل رقم الإقامة أو الاسم أو الهاتف لعرض النتائج.'
              )}
            </p>
          </div>
        ) : matches.length === 0 ? (
          <div className="soft-card p-12 text-center">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {tr(lang, 'No matching workers found.', 'কোনো কর্মী পাওয়া যায়নি।', 'لا توجد نتائج مطابقة.')}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {tr(
                lang,
                'Check the Iqama number or try searching by first name or phone.',
                'ইকামা নম্বর যাচাই করুন অথবা নাম বা ফোন নম্বর দিয়ে চেষ্টা করুন।',
                'تحقق من الرقم أو جرّب البحث بالاسم أو الهاتف.'
              )}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-3 tabular-nums">
              {matches.length} {tr(lang, 'matching workers', 'জন কর্মী পাওয়া গেছে', 'نتيجة مطابقة')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {matches.map((emp) => {
                const acc = computeAccount(emp, payments);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    data-search-card
                    onClick={() => onOpenProfile(emp.id)}
                    className="soft-card soft-card-hover p-5 text-start w-full flex flex-col justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={emp.fullName} size="md" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                          {emp.fullName}
                        </h3>
                        {emp.arabicName && (
                          <p className="text-xs text-[var(--text-secondary)] truncate">
                            {emp.arabicName}
                          </p>
                        )}
                        <p className="text-xs text-[var(--text-secondary)] font-mono-data mt-1">
                          {emp.iqamaNumber} · {emp.phone}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-[var(--text-secondary)]">
                        {translateStatus(
                          lang,
                          workerKind(emp) === 'domestic' ? 'Domestic' : 'Company'
                        )}
                        {emp.archived ? ` · ${translateStatus(lang, 'Archived')}` : ''}
                      </span>
                      <span
                        className={`font-mono-data font-bold ${
                          acc.balance > 0
                            ? 'text-[#D93845] dark:text-[#FF848D]'
                            : 'text-[#009965] dark:text-[#3EE5A8]'
                        }`}
                      >
                        {money(acc.balance)} SAR
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
