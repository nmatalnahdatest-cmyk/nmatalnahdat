import React, { useRef } from 'react';
import { Building2, Edit3, Plus, Users } from 'lucide-react';
import type { Company, Employee, Language } from '../../types/ems';
import { workerKind } from '../../lib/accounting';
import { tr } from '../../lib/i18n';
import { useStaggerEntrance } from '../../hooks/useGsapAnimations';
import { AnimatedButton } from '../ui/AnimatedButton';

interface CompaniesViewProps {
  companies: Company[];
  employees: Employee[];
  lang: Language;
  canWrite: boolean;
  onAddCompany: () => void;
  onEditCompany: (id: string) => void;
  onViewCompanyWorkers: (companyName: string) => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  companies,
  employees,
  lang,
  canWrite,
  onAddCompany,
  onEditCompany,
  onViewCompanyWorkers,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  useStaggerEntrance(gridRef, '[data-company-card]', [companies.length, lang]);

  return (
    <div ref={gridRef} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {tr(lang, 'Companies', 'কোম্পানি', 'الشركات')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {tr(
              lang,
              'Manage sponsor companies, CR licenses, unified numbers, and linked workers.',
              'কোম্পানির লাইসেন্স, ইউনিফাইড নম্বর এবং সংশ্লিষ্ট কর্মীদের তালিকা।',
              'إدارة الشركات والسجلات التجارية والأرقام الموحدة والعمال المرتبطين بها.'
            )}
          </p>
        </div>

        {canWrite && (
          <AnimatedButton variant="teal" onClick={onAddCompany}>
            <Plus className="w-4 h-4" />
            <span>{tr(lang, 'Add Company', 'কোম্পানি যোগ করুন', 'إضافة شركة')}</span>
          </AnimatedButton>
        )}
      </div>

      {companies.length === 0 ? (
        <div className="soft-card p-12 text-center">
          <Building2 className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mt-3">
            {tr(
              lang,
              'No companies added yet.',
              'এখনো কোনো কোম্পানি যোগ করা হয়নি।',
              'لم تتم إضافة شركات بعد.'
            )}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {tr(
              lang,
              'Add a company before registering company-sponsored workers.',
              'কোম্পানির কর্মী যোগ করার আগে একটি কোম্পানি যুক্ত করুন।',
              'أضف شركة قبل إضافة عمال الشركات.'
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {companies.map((c) => {
            const linked = employees.filter(
              (e) => !e.deletedAt && e.companyId === c.id && workerKind(e) === 'company'
            );
            return (
              <div
                key={c.id}
                data-company-card
                className="soft-card soft-card-hover p-5 md:p-6 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#153B40]/10 dark:bg-[#4388FF]/15 text-[#153B40] dark:text-[#94C5FF] flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono-data font-bold text-[var(--text-secondary)]">
                      {linked.length} {tr(lang, 'workers', 'কর্মী', 'عامل')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--text-primary)] mt-4 truncate">
                    {c.companyName}
                  </h3>
                  {c.arabicCompanyName && (
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                      {c.arabicCompanyName}
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[var(--text-secondary)] block">CR / License</span>
                      <span className="font-mono-data font-semibold text-[var(--text-primary)]">
                        {c.companyLicenseNumber || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] block">Unified No.</span>
                      <span className="font-mono-data font-semibold text-[var(--text-primary)]">
                        {c.unifiedNumber || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] block">Establishment</span>
                      <span className="font-mono-data font-semibold text-[var(--text-primary)]">
                        {c.establishmentNumber || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] block">Contact / Phone</span>
                      <span className="font-semibold text-[var(--text-primary)] truncate block">
                        {c.contactPerson || c.phone || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-subtle)]">
                  <AnimatedButton
                    variant="secondary"
                    size="sm"
                    onClick={() => onViewCompanyWorkers(c.companyName)}
                    className="flex-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'View Workers', 'কর্মী দেখুন', 'عرض العمال')}</span>
                  </AnimatedButton>
                  {canWrite && (
                    <AnimatedButton
                      variant="secondary"
                      size="sm"
                      onClick={() => onEditCompany(c.id)}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{tr(lang, 'Edit', 'এডিট', 'تعديل')}</span>
                    </AnimatedButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
