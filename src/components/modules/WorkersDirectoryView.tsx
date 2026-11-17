import React, { useMemo, useRef, useState } from 'react';
import {
  Archive,
  Edit3,
  Plane,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import type { Employee, Language, WorkerType } from '../../types/ems';
import { dayDiff, norm, sar, workerFee, workerKind } from '../../lib/accounting';
import { tr } from '../../lib/i18n';
import { useStaggerEntrance } from '../../hooks/useGsapAnimations';
import { AnimatedButton } from '../ui/AnimatedButton';
import { Avatar } from '../ui/Avatar';
import { StatusLabel } from '../ui/StatusLabel';

interface WorkersDirectoryViewProps {
  type: WorkerType;
  employees: Employee[];
  defaultCompanyFee: number;
  initialCompanyFilter?: string;
  lang: Language;
  canWrite: boolean;
  onAddWorker: (type: WorkerType) => void;
  onEditWorker: (id: string) => void;
  onEditVisa: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onArchiveWorker: (id: string) => void;
  onDeleteWorker: (id: string) => void;
}

export const WorkersDirectoryView: React.FC<WorkersDirectoryViewProps> = ({
  type,
  employees,
  defaultCompanyFee,
  initialCompanyFilter = '',
  lang,
  canWrite,
  onAddWorker,
  onEditWorker,
  onEditVisa,
  onOpenProfile,
  onArchiveWorker,
  onDeleteWorker,
}) => {
  const [query, setQuery] = useState(initialCompanyFilter);
  const [statusFilter, setStatusFilter] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = norm(query);
    return employees.filter((e) => {
      if (e.deletedAt || workerKind(e) !== type) return false;
      if (statusFilter) {
        if (statusFilter === 'Archived') {
          if (!e.archived) return false;
        } else {
          if (e.archived || e.employmentStatus !== statusFilter) return false;
        }
      }
      if (!q) return true;
      return [
        e.fullName,
        e.arabicName,
        e.iqamaNumber,
        e.phone,
        e.companyName,
        e.profession,
        e.ownerName,
        e.ownerPhone,
        e.employeeCode,
      ].some((x) => norm(x).includes(q));
    });
  }, [employees, type, statusFilter, query]);

  useStaggerEntrance(tableRef, '[data-worker-row]', [type, statusFilter, lang]);

  return (
    <div ref={tableRef} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {type === 'domestic'
              ? tr(lang, 'Domestic Workers', 'ডোমেস্টিক কর্মী', 'العمالة المنزلية')
              : tr(lang, 'Company Workers', 'কোম্পানির কর্মী', 'عمال الشركات')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {type === 'domestic'
              ? tr(
                  lang,
                  'Separate domestic records with owner / sponsor details. Default monthly fee: 300 SAR.',
                  'স্পনসরের তথ্যসহ আলাদা ডোমেস্টিক কর্মীর তালিকা। ডিফল্ট মাসিক ফি ৩০০ SAR।',
                  'سجلات مستقلة للعمالة المنزلية مع بيانات الكفيل. الرسم الافتراضي ٣٠٠ ريال شهرياً.'
                )
              : tr(
                  lang,
                  'Manage company-sponsored employees, Iqama expiries, and monthly service fees.',
                  'কোম্পানির কর্মী, ইকামার মেয়াদ ও মাসিক সার্ভিস ফি পরিচালনা করুন।',
                  'إدارة عمال الشركات وتواريخ انتهاء الإقامة والرسوم الشهرية.'
                )}
          </p>
        </div>

        {canWrite && (
          <AnimatedButton variant="teal" onClick={() => onAddWorker(type)}>
            <Plus className="w-4 h-4" />
            <span>
              {type === 'domestic'
                ? tr(lang, 'Add Domestic Worker', 'ডোমেস্টিক কর্মী যোগ', 'إضافة عامل منزلي')
                : tr(lang, 'Add Company Worker', 'কর্মী যোগ করুন', 'إضافة عامل شركة')}
            </span>
          </AnimatedButton>
        )}
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
                'Search Iqama, name, phone, company…',
                'ইকামা, নাম, ফোন বা কোম্পানি…',
                'ابحث بالإقامة أو الاسم أو الهاتف…'
              )}
              aria-label="Search worker directory"
              className="w-full h-10 ps-9 pe-3 rounded-xl soft-surface-secondary text-xs text-[var(--text-primary)] outline-none focus:border-[#4388FF]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by employment status"
              className="h-10 px-3 rounded-xl soft-surface-secondary text-xs font-semibold text-[var(--text-primary)] outline-none"
            >
              <option value="">{tr(lang, 'All statuses', 'সব অবস্থা', 'جميع الحالات')}</option>
              <option value="Active">Active</option>
              <option value="Transfer Pending">Transfer Pending</option>
              <option value="Transferred">Transferred</option>
              <option value="Final Exit">Final Exit</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </select>
            <span className="text-xs font-mono-data text-[var(--text-secondary)] px-2">
              {filtered.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto sleek-scroll mt-4">
          <table className="w-full text-start border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs">
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Worker / Profession', 'কর্মী / পেশা', 'العامل / المهنة')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Iqama / Phone', 'ইকামা / ফোন', 'الإقامة / الهاتف')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {type === 'company'
                    ? tr(lang, 'Company', 'কোম্পানি', 'الشركة')
                    : tr(lang, 'Owner / Sponsor', 'মালিক / স্পনসর', 'المالك / الكفيل')}
                </th>
                <th className="py-2.5 px-3 text-start font-semibold">
                  {tr(lang, 'Iqama Expiry', 'ইকামার মেয়াদ', 'انتهاء الإقامة')}
                </th>
                <th className="py-2.5 px-3 text-end font-semibold">
                  {tr(lang, 'Monthly Fee', 'মাসিক ফি', 'الرسم الشهري')}
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
              {filtered.map((emp) => {
                const diff = dayDiff(emp.idExpiryDate);
                const expiryTone =
                  diff === null
                    ? 'text-[var(--text-secondary)]'
                    : diff < 0
                    ? 'text-[#D93845] dark:text-[#FF848D] font-bold'
                    : diff <= 30
                    ? 'text-[#B57B00] dark:text-[#FFE175] font-semibold'
                    : 'text-[var(--text-primary)]';

                return (
                  <tr
                    key={emp.id}
                    data-worker-row
                    className="hover:bg-[var(--surface-secondary)]/75 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => onOpenProfile(emp.id)}
                        className="flex items-center gap-2.5 text-start cursor-pointer group"
                      >
                        <Avatar name={emp.fullName} size="xs" />
                        <div>
                          <div className="font-semibold text-[var(--text-primary)] group-hover:text-[#4388FF] transition-colors">
                            {emp.fullName}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)]">
                            {emp.profession || '—'}
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono-data text-[var(--text-primary)]">
                        {emp.iqamaNumber}
                      </div>
                      <div className="text-[11px] font-mono-data text-[var(--text-secondary)]">
                        {emp.phone}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {type === 'company' ? (
                        <span className="text-[var(--text-primary)]">
                          {emp.companyName || '—'}
                        </span>
                      ) : (
                        <div>
                          <div className="text-[var(--text-primary)]">
                            {emp.ownerName || tr(lang, 'Not entered', 'দেওয়া নেই', 'غير مسجل')}
                          </div>
                          <div className="text-[11px] font-mono-data text-[var(--text-secondary)]">
                            {emp.ownerPhone || ''}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className={`font-mono-data ${expiryTone}`}>
                        {emp.idExpiryDate || '—'}
                      </div>
                      {diff !== null && diff <= 60 && (
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {diff < 0
                            ? `${Math.abs(diff)}d overdue`
                            : `${diff}d left`}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-end font-mono-data font-semibold text-[var(--text-primary)]">
                      {sar(workerFee(emp, defaultCompanyFee))} SAR
                    </td>
                    <td className="py-3 px-3">
                      <StatusLabel
                        status={emp.archived ? 'Archived' : emp.employmentStatus}
                        lang={lang}
                      />
                    </td>
                    <td className="py-3 px-3 text-end">
                      <div className="inline-flex items-center gap-1">
                        <AnimatedButton
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenProfile(emp.id)}
                          title={tr(lang, 'Open Profile', 'প্রোফাইল', 'الملف')}
                        >
                          <User className="w-3.5 h-3.5" />
                        </AnimatedButton>
                        {canWrite && (
                          <>
                            <AnimatedButton
                              variant="secondary"
                              size="sm"
                              onClick={() => onEditWorker(emp.id)}
                              title={tr(lang, 'Edit Worker', 'এডিট', 'تعديل')}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </AnimatedButton>
                            <AnimatedButton
                              variant="secondary"
                              size="sm"
                              onClick={() => onEditVisa(emp.id)}
                              title={tr(lang, 'Exit Re-entry Visa', 'ভিসা', 'التأشيرة')}
                            >
                              <Plane className="w-3.5 h-3.5" />
                            </AnimatedButton>
                            <AnimatedButton
                              variant="secondary"
                              size="sm"
                              onClick={() => onArchiveWorker(emp.id)}
                              title={emp.archived ? 'Restore' : 'Archive'}
                            >
                              {emp.archived ? (
                                <RotateCcw className="w-3.5 h-3.5" />
                              ) : (
                                <Archive className="w-3.5 h-3.5" />
                              )}
                            </AnimatedButton>
                            <AnimatedButton
                              variant="danger"
                              size="sm"
                              onClick={() => onDeleteWorker(emp.id)}
                              title={tr(lang, 'Delete Worker', 'ডিলেট', 'حذف')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </AnimatedButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--text-secondary)]">
                    {tr(lang, 'No workers match the current filter.', 'কোনো কর্মী পাওয়া যায়নি।', 'لا يوجد عمال مطابقون.')}
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
