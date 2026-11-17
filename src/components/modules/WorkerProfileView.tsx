import React, { useRef } from 'react';
import {
  Archive,
  ArrowLeft,
  Edit3,
  ExternalLink,
  FileText,
  MessageCircle,
  Plane,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
  Upload,
  Wallet,
} from 'lucide-react';
import type { Employee, Language, Payment } from '../../types/ems';
import {
  cents,
  computeAccount,
  money,
  sar,
  workerKind,
} from '../../lib/accounting';
import { tr, translateStatus } from '../../lib/i18n';
import { useStaggerEntrance } from '../../hooks/useGsapAnimations';
import { AnimatedButton } from '../ui/AnimatedButton';
import { Avatar } from '../ui/Avatar';
import { StatusLabel } from '../ui/StatusLabel';

interface WorkerProfileViewProps {
  employee: Employee;
  payments: Payment[];
  lang: Language;
  canWrite: boolean;
  upgradeReady: boolean;
  onBack: () => void;
  onRecordPayment: (workerId: string) => void;
  onEditWorker: (workerId: string) => void;
  onEditVisa: (workerId: string) => void;
  onPrintStatement: (workerId: string) => void;
  onPrintReceipt: (paymentId: string) => void;
  onOpenWhatsApp: (workerId: string) => void;
  onArchiveWorker: (workerId: string) => void;
  onDeleteWorker: (workerId: string) => void;
  onEditOpening: (workerId: string, pay: boolean) => void;
  onUploadDocument: (workerId: string) => void;
  onOpenDocument: (workerId: string, docId: string) => void;
  onArchiveDocument: (workerId: string, docId: string) => void;
}

export const WorkerProfileView: React.FC<WorkerProfileViewProps> = ({
  employee: e,
  payments,
  lang,
  canWrite,
  upgradeReady,
  onBack,
  onRecordPayment,
  onEditWorker,
  onEditVisa,
  onPrintStatement,
  onPrintReceipt,
  onOpenWhatsApp,
  onArchiveWorker,
  onDeleteWorker,
  onEditOpening,
  onUploadDocument,
  onOpenDocument,
  onArchiveDocument,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useStaggerEntrance(ref, '[data-prof-sec]', [e.id, lang]);

  const a = computeAccount(e, payments);
  const v = e.exitReentry || {};
  const o = e.openingBalance || {};
  const docs = e.documents || [];
  const kind = workerKind(e);
  const openingRemaining = Math.max(0, cents(o.amount) - cents(o.paid));

  const detailRow = (label: string, val?: string | number | null) => (
    <div className="py-2 border-b border-[var(--border-subtle)]/70 last:border-b-0 flex items-center justify-between gap-4 text-xs">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-semibold text-[var(--text-primary)] text-end font-mono-data">
        {val || '—'}
      </span>
    </div>
  );

  return (
    <div ref={ref} className="space-y-6">
      <div className="flex items-center gap-2">
        <AnimatedButton variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{tr(lang, 'Back', 'ফিরে যান', 'رجوع')}</span>
        </AnimatedButton>
      </div>

      {/* Hero Profile Header */}
      <section data-prof-sec className="soft-card p-6 md:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <Avatar name={e.fullName} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                  {e.fullName}
                </h1>
                <StatusLabel
                  status={e.archived ? 'Archived' : e.employmentStatus}
                  lang={lang}
                />
              </div>
              {e.arabicName && (
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{e.arabicName}</p>
              )}
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {translateStatus(lang, kind === 'domestic' ? 'Domestic' : 'Company')} ·{' '}
                {e.profession || '—'} · <span className="font-mono-data">Iqama {e.iqamaNumber}</span> ·{' '}
                <span className="font-mono-data">{e.employeeCode}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canWrite && !e.archived && (
              <AnimatedButton variant="teal" size="sm" onClick={() => onRecordPayment(e.id)}>
                <Wallet className="w-3.5 h-3.5" />
                <span>{tr(lang, 'Record Payment', 'পেমেন্ট জমা', 'تسجيل دفعة')}</span>
              </AnimatedButton>
            )}
            {canWrite && (
              <>
                <AnimatedButton variant="secondary" size="sm" onClick={() => onEditWorker(e.id)}>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{tr(lang, 'Edit Profile', 'প্রোফাইল এডিট', 'تعديل الملف')}</span>
                </AnimatedButton>
                <AnimatedButton variant="secondary" size="sm" onClick={() => onEditVisa(e.id)}>
                  <Plane className="w-3.5 h-3.5" />
                  <span>{tr(lang, 'Update Visa', 'ভিসা আপডেট', 'تعديل التأشيرة')}</span>
                </AnimatedButton>
              </>
            )}
            <AnimatedButton variant="secondary" size="sm" onClick={() => onPrintStatement(e.id)}>
              <Printer className="w-3.5 h-3.5" />
              <span>{tr(lang, 'Print Statement', 'হিসাব প্রিন্ট', 'طباعة كشف الحساب')}</span>
            </AnimatedButton>
            <AnimatedButton variant="secondary" size="sm" onClick={() => onOpenWhatsApp(e.id)}>
              <MessageCircle className="w-3.5 h-3.5 text-[#00C985]" />
              <span>{tr(lang, 'WhatsApp Draft', 'হোয়াটসঅ্যাপ', 'واتساب')}</span>
            </AnimatedButton>
          </div>
        </div>
      </section>

      {/* Account Totals Strip */}
      <div data-prof-sec className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="soft-card p-4 sm:p-5">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            {tr(lang, 'Total Recorded Dues', 'মোট সংরক্ষিত পাওনা', 'المستحقات المسجلة')}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-data mt-1">
            {money(a.expected)} <span className="text-xs font-normal text-[var(--text-secondary)]">SAR</span>
          </div>
        </div>
        <div className="soft-card p-4 sm:p-5">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            {tr(lang, 'Total Paid', 'মোট জমা', 'إجمالي المدفوع')}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-data text-[#009965] dark:text-[#3EE5A8] mt-1">
            {money(a.paid)} <span className="text-xs font-normal text-[var(--text-secondary)]">SAR</span>
          </div>
        </div>
        <div className="soft-card p-4 sm:p-5">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            {tr(lang, 'Outstanding Balance', 'মোট বকেয়া', 'الرصيد المتبقي')}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-data text-[#D93845] dark:text-[#FF848D] mt-1">
            {money(a.balance)} <span className="text-xs font-normal text-[var(--text-secondary)]">SAR</span>
          </div>
        </div>
        <div className="soft-card p-4 sm:p-5">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            {tr(lang, 'Recorded Months', 'সংরক্ষিত মাস', 'الأشهر المسجلة')}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-data mt-1">
            {a.months.length}
          </div>
        </div>
      </div>

      {a.credit > 0 && (
        <div
          data-prof-sec
          className="soft-card p-4 border-[#4388FF]/30 bg-[#4388FF]/8 text-xs font-medium text-[var(--text-primary)]"
        >
          Extra paid: <span className="font-mono-data font-bold">{money(a.credit)} SAR</span>. This is shown separately and is not automatically applied to another month.
        </div>
      )}

      {/* Sections 01 & 02 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section data-prof-sec className="soft-card p-5 md:p-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] pb-3 border-b border-[var(--border-subtle)]">
            01. {tr(lang, 'Worker Information', 'কর্মীর তথ্য', 'بيانات العامل')}
          </h2>
          <div className="mt-2">
            {detailRow('Iqama / ID', e.iqamaNumber)}
            {detailRow('Phone', e.phone)}
            {detailRow('Profession', e.profession)}
            {detailRow(
              'Company',
              kind === 'domestic' ? 'Domestic Worker' : e.companyName
            )}
            {kind === 'domestic' && (
              <>
                {detailRow('Owner / Sponsor', e.ownerName)}
                {detailRow('Owner Phone', e.ownerPhone)}
              </>
            )}
            {detailRow('Nationality', e.nationality)}
            {detailRow('Joining Date', e.joiningDate)}
            {detailRow('Iqama Expiry', e.idExpiryDate)}
            {detailRow('Employee Code', e.employeeCode)}
            {detailRow('Unified Number', e.unifiedNumber)}
            {detailRow('Establishment Number', e.establishmentNumber)}
            {detailRow('Company License', e.companyLicenseNumber)}
          </div>

          {canWrite && (
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-[var(--border-subtle)]">
              <AnimatedButton
                variant="secondary"
                size="sm"
                onClick={() => onArchiveWorker(e.id)}
              >
                {e.archived ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'Restore Worker', 'কর্মী ফিরিয়ে আনুন', 'استعادة العامل')}</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'Archive Worker', 'আর্কাইভ করুন', 'أرشفة العامل')}</span>
                  </>
                )}
              </AnimatedButton>
              <AnimatedButton
                variant="danger"
                size="sm"
                onClick={() => onDeleteWorker(e.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{tr(lang, 'Delete Worker', 'কর্মী ডিলেট', 'حذف العامل')}</span>
              </AnimatedButton>
            </div>
          )}
        </section>

        <section data-prof-sec className="soft-card p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                02. {tr(lang, 'Exit Re-entry Visa', 'এক্সিট রি-এন্ট্রি ভিসা', 'تأشيرة الخروج والعودة')}
              </h2>
              <StatusLabel status={v.status || 'None'} lang={lang} />
            </div>

            <div className="mt-2">
              {detailRow('Visa Number', v.number)}
              {detailRow('Issue Date', v.issueDate)}
              {detailRow('Return By', v.returnBy)}
              {detailRow('Notes', v.note)}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">
              {tr(lang, 'How this account works', 'হিসাব কীভাবে হয়', 'كيفية حساب الرصيد')}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              {tr(
                lang,
                'Only saved monthly dues and the opening balance are included. Missing months are not estimated. Legacy rows for the same month share one expected monthly fee; paid amounts are added together.',
                'শুধু সংরক্ষিত মাসিক হিসাব ও Opening Balance যোগ হয়। অনুপস্থিত মাসের বকেয়া অনুমান করা হয় না।',
                'يشمل الحساب المستحقات الشهرية المسجلة والرصيد الافتتاحي فقط. لا يتم تقدير الأشهر المفقودة.'
              )}
            </p>
          </div>
        </section>
      </div>

      {/* Section 03: Monthly Account History */}
      <section data-prof-sec className="soft-card p-5 md:p-6">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            03. {tr(lang, 'Monthly Account History', 'মাসভিত্তিক পুরোনো হিসাব', 'الحساب الشهري')}
          </h2>
          <span className="text-xs text-[var(--text-secondary)]">SAR</span>
        </div>

        <div className="overflow-x-auto sleek-scroll mt-3">
          <table className="w-full text-start border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs">
                <th className="py-2 px-3 text-start font-semibold">Period</th>
                <th className="py-2 px-3 text-end font-semibold">Expected</th>
                <th className="py-2 px-3 text-end font-semibold">Paid</th>
                <th className="py-2 px-3 text-end font-semibold">Balance</th>
                <th className="py-2 px-3 text-start font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {cents(o.amount) > 0 && (
                <tr>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold">Opening balance</div>
                    <div className="text-[11px] font-mono-data text-[var(--text-secondary)]">
                      {o.date}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-end font-mono-data">{sar(o.amount)}</td>
                  <td className="py-2.5 px-3 text-end font-mono-data text-[#009965] dark:text-[#3EE5A8]">
                    {sar(o.paid)}
                  </td>
                  <td className="py-2.5 px-3 text-end font-mono-data text-[#D93845] dark:text-[#FF848D]">
                    {money(openingRemaining)}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-[var(--text-secondary)]">
                    Previous dues
                  </td>
                </tr>
              )}
              {a.months.map((g) => (
                <tr key={g.key}>
                  <td className="py-2.5 px-3 font-mono-data font-semibold">{g.key}</td>
                  <td className="py-2.5 px-3 text-end font-mono-data">{money(g.expected)}</td>
                  <td className="py-2.5 px-3 text-end font-mono-data text-[#009965] dark:text-[#3EE5A8]">
                    {money(g.paid)}
                  </td>
                  <td className="py-2.5 px-3 text-end font-mono-data text-[#D93845] dark:text-[#FF848D]">
                    {money(g.balance)}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusLabel
                      status={g.balance ? (g.paid ? 'PARTIAL' : 'UNPAID') : 'PAID'}
                      lang={lang}
                      subText={g.credit ? `Extra ${money(g.credit)}` : undefined}
                    />
                  </td>
                </tr>
              ))}
              {cents(o.amount) === 0 && a.months.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[var(--text-secondary)]">
                    {tr(lang, 'No saved account records.', 'কোনো হিসাব পাওয়া যায়নি।', 'لا توجد سجلات حساب محفوظة.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sections 04 & 05 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section data-prof-sec className="soft-card p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              04. {tr(lang, 'Opening Balance', 'আগের বকেয়া', 'الرصيد الافتتاحي')}
            </h2>
            {canWrite && (
              <div className="flex items-center gap-1.5">
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => onEditOpening(e.id, false)}
                >
                  {tr(lang, 'Set Old Balance', 'আগের বকেয়া সেট', 'تعيين الرصيد')}
                </AnimatedButton>
                {openingRemaining > 0 && (
                  <AnimatedButton
                    variant="primary"
                    size="sm"
                    onClick={() => onEditOpening(e.id, true)}
                  >
                    {tr(lang, 'Pay Old Balance', 'বকেয়া জমা', 'سداد الرصيد')}
                  </AnimatedButton>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
            <div className="p-3 rounded-2xl soft-surface-secondary">
              <div className="text-[var(--text-secondary)]">Previous dues</div>
              <div className="font-mono-data font-bold text-sm mt-1">{sar(o.amount)} SAR</div>
            </div>
            <div className="p-3 rounded-2xl soft-surface-secondary">
              <div className="text-[var(--text-secondary)]">Paid / Remaining</div>
              <div className="font-mono-data font-bold text-sm mt-1">
                {sar(o.paid)} / {money(openingRemaining)}
              </div>
            </div>
            <div className="p-3 rounded-2xl soft-surface-secondary">
              <div className="text-[var(--text-secondary)]">As of</div>
              <div className="font-mono-data font-bold text-sm mt-1">{o.date || '—'}</div>
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] mt-3">
            {o.note || 'Only enter debt not already included in monthly records.'}
          </p>

          {o.payments && o.payments.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] space-y-2">
              <div className="text-xs font-bold text-[var(--text-primary)]">
                Old-balance payments ({o.payments.length})
              </div>
              {o.payments.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl soft-surface-secondary"
                >
                  <span className="text-[var(--text-secondary)]">
                    <span className="font-mono-data">{op.date}</span> · {op.method}{' '}
                    {op.reference ? `· ${op.reference}` : ''}
                  </span>
                  <span className="font-mono-data font-bold text-[#009965] dark:text-[#3EE5A8]">
                    {sar(op.amount)} SAR
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section data-prof-sec className="soft-card p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              05. {tr(lang, 'Private Documents', 'ব্যক্তিগত ডকুমেন্ট', 'المستندات الخاصة')}
            </h2>
            {canWrite && upgradeReady && (
              <AnimatedButton
                variant="teal"
                size="sm"
                onClick={() => onUploadDocument(e.id)}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{tr(lang, 'Upload Document', 'আপলোড করুন', 'رفع مستند')}</span>
              </AnimatedButton>
            )}
          </div>

          <p className="text-xs text-[var(--text-secondary)] mt-3">
            PDF, JPG, PNG or WebP · 10 MB max. Stored privately in Supabase Storage.
          </p>

          {!upgradeReady && (
            <div className="mt-3 p-3 rounded-xl bg-[#FFD84D]/20 text-xs font-medium text-[var(--text-primary)]">
              Run SETUP.sql once in Supabase to enable private documents and team access.
            </div>
          )}

          <div className="mt-4 space-y-2">
            {docs.map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-2xl soft-surface-secondary flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-[#4388FF] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {d.type}
                      {d.archived ? ' · Archived' : ''}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">
                      {d.name} · {d.uploadedAt?.slice(0, 10)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <AnimatedButton
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenDocument(e.id, d.id)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'Open', 'খুলুন', 'فتح')}</span>
                  </AnimatedButton>
                  {canWrite && (
                    <AnimatedButton
                      variant="secondary"
                      size="sm"
                      onClick={() => onArchiveDocument(e.id, d.id)}
                    >
                      {d.archived ? 'Restore' : 'Archive'}
                    </AnimatedButton>
                  )}
                </div>
              </div>
            ))}
            {docs.length === 0 && (
              <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
                {tr(lang, 'No documents uploaded.', 'কোনো ডকুমেন্ট আপলোড করা হয়নি।', 'لم يتم رفع مستندات.')}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Section 06: Saved Payment Records */}
      <section data-prof-sec className="soft-card p-5 md:p-6">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            06. {tr(lang, 'Saved Payment Records', 'জমার পুরোনো রেকর্ড', 'سجلات الدفعات')}
          </h2>
          {canWrite && !e.archived && (
            <AnimatedButton variant="secondary" size="sm" onClick={() => onRecordPayment(e.id)}>
              <Plus className="w-3.5 h-3.5" />
              <span>{tr(lang, 'Add Payment', 'পেমেন্ট যোগ', 'إضافة دفعة')}</span>
            </AnimatedButton>
          )}
        </div>

        <div className="overflow-x-auto sleek-scroll mt-3">
          <table className="w-full text-start border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs">
                <th className="py-2 px-3 text-start font-semibold">Period</th>
                <th className="py-2 px-3 text-start font-semibold">Date</th>
                <th className="py-2 px-3 text-end font-semibold">Paid (SAR)</th>
                <th className="py-2 px-3 text-start font-semibold">Method / Reference</th>
                <th className="py-2 px-3 text-end font-semibold">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {a.records.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 px-3 font-mono-data">
                    {String(p.month).padStart(2, '0')}/{p.year}
                  </td>
                  <td className="py-2.5 px-3 font-mono-data text-[var(--text-secondary)]">
                    {p.paymentDate}
                  </td>
                  <td className="py-2.5 px-3 text-end font-mono-data font-bold text-[#009965] dark:text-[#3EE5A8]">
                    {sar(p.paidAmount)}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-[var(--text-primary)]">{p.paymentMethod}</div>
                    <div className="text-[11px] font-mono-data text-[var(--text-secondary)]">
                      {p.referenceNumber || '—'}
                    </div>
                    {p.paymentEvents && p.paymentEvents.length > 0 && (
                      <div className="mt-1 space-y-0.5 text-[11px] text-[var(--text-secondary)]">
                        {p.paymentEvents.map((ev, idx) => (
                          <div key={idx} className="font-mono-data">
                            {ev.date} · {sar(ev.amount)} SAR · {ev.method}{' '}
                            {ev.reference ? `· ${ev.reference}` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-end">
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
              ))}
              {a.records.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[var(--text-secondary)]">
                    {tr(lang, 'No payment records found.', 'কোনো জমার রেকর্ড নেই।', 'لا توجد سجلات دفعات.')}
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
