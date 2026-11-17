import React, { useEffect, useState } from 'react';
import type {
  Company,
  Employee,
  EmploymentStatus,
  Language,
  WorkerType,
} from '../../types/ems';
import { todayRiyadh, workerFee, workerKind } from '../../lib/accounting';
import { tr } from '../../lib/i18n';
import { Modal } from '../ui/Modal';
import { AnimatedButton } from '../ui/AnimatedButton';

export interface WorkerFormSubmitPayload {
  workerType: WorkerType;
  fullName: string;
  arabicName: string;
  iqamaNumber: string;
  phone: string;
  idExpiryDate: string;
  profession: string;
  nationality: string;
  ownerName: string;
  ownerPhone: string;
  joiningDate: string;
  monthlyFee: string;
  companyId: string;
  employmentStatus: EmploymentStatus;
}

interface WorkerFormModalProps {
  open: boolean;
  editingWorker: Employee | null;
  defaultType: WorkerType;
  companies: Company[];
  defaultCompanyFee: number;
  lang: Language;
  onClose: () => void;
  onSave: (payload: WorkerFormSubmitPayload, workerId?: string) => Promise<void>;
}

const inputCls =
  'w-full h-10 px-3 rounded-xl soft-surface-secondary text-sm text-[var(--text-primary)] outline-none focus:border-[#4388FF] disabled:opacity-50';
const labelCls = 'block text-xs font-semibold text-[var(--text-secondary)] mb-1';

export const WorkerFormModal: React.FC<WorkerFormModalProps> = ({
  open,
  editingWorker,
  defaultType,
  companies,
  defaultCompanyFee,
  lang,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<WorkerFormSubmitPayload>({
    workerType: defaultType,
    fullName: '',
    arabicName: '',
    iqamaNumber: '',
    phone: '',
    idExpiryDate: '',
    profession: defaultType === 'domestic' ? 'Private Driver' : 'Worker',
    nationality: '',
    ownerName: '',
    ownerPhone: '',
    joiningDate: todayRiyadh(),
    monthlyFee: String(defaultType === 'domestic' ? 300 : defaultCompanyFee),
    companyId: companies[0]?.id || '',
    employmentStatus: 'Active',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingWorker) {
      const k = workerKind(editingWorker);
      setForm({
        workerType: k,
        fullName: editingWorker.fullName || '',
        arabicName: editingWorker.arabicName || '',
        iqamaNumber: editingWorker.iqamaNumber || '',
        phone: editingWorker.phone || '',
        idExpiryDate: editingWorker.idExpiryDate || '',
        profession: editingWorker.profession || '',
        nationality: editingWorker.nationality || '',
        ownerName: editingWorker.ownerName || '',
        ownerPhone: editingWorker.ownerPhone || '',
        joiningDate: editingWorker.joiningDate || todayRiyadh(),
        monthlyFee: String(workerFee(editingWorker, defaultCompanyFee)),
        companyId: editingWorker.companyId || companies[0]?.id || '',
        employmentStatus: editingWorker.employmentStatus || 'Active',
      });
    } else {
      setForm({
        workerType: defaultType,
        fullName: '',
        arabicName: '',
        iqamaNumber: '',
        phone: '',
        idExpiryDate: '',
        profession: defaultType === 'domestic' ? 'Private Driver' : 'Worker',
        nationality: '',
        ownerName: '',
        ownerPhone: '',
        joiningDate: todayRiyadh(),
        monthlyFee: String(defaultType === 'domestic' ? 300 : defaultCompanyFee),
        companyId: companies[0]?.id || '',
        employmentStatus: 'Active',
      });
    }
  }, [open, editingWorker, defaultType, companies, defaultCompanyFee]);

  const handleTypeChange = (nextType: WorkerType) => {
    setForm((prev) => ({
      ...prev,
      workerType: nextType,
      monthlyFee: String(nextType === 'domestic' ? 300 : defaultCompanyFee),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(form, editingWorker?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save worker.');
    } finally {
      setSaving(false);
    }
  };

  const isDomestic = form.workerType === 'domestic';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        editingWorker
          ? tr(lang, 'Edit Worker', 'কর্মী এডিট', 'تعديل بيانات العامل')
          : tr(lang, 'Add Worker', 'নতুন কর্মী যোগ', 'إضافة عامل جديد')
      }
      subtitle={
        editingWorker
          ? `${editingWorker.fullName} · ${editingWorker.employeeCode}`
          : tr(
              lang,
              'Employee code is generated automatically. Duplicate Iqama numbers are prevented.',
              'কর্মী কোড স্বয়ংক্রিয়ভাবে তৈরি হবে। একই ইকামা নম্বর দুবার যোগ করা যাবে না।',
              'يتم إنشاء كود العامل تلقائياً مع منع تكرار رقم الإقامة.'
            )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-[#F05A65]/12 border border-[#F05A65]/30 text-xs font-semibold text-[#C9323E] dark:text-[#FF8A93]"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="wf-type" className={labelCls}>
              {tr(lang, 'Worker Type', 'কর্মীর ধরন', 'نوع العامل')}
            </label>
            <select
              id="wf-type"
              value={form.workerType}
              onChange={(e) => handleTypeChange(e.target.value as WorkerType)}
              className={inputCls}
            >
              <option value="company">Company worker</option>
              <option value="domestic">Domestic worker</option>
            </select>
          </div>

          <div>
            <label htmlFor="wf-fullName" className={labelCls}>
              {tr(lang, 'Full Name *', 'পুরো নাম *', 'الاسم الكامل *')}
            </label>
            <input
              id="wf-fullName"
              type="text"
              required
              maxLength={150}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="wf-arabicName" className={labelCls}>
              {tr(lang, 'Arabic Name', 'আরবি নাম', 'الاسم بالعربية')}
            </label>
            <input
              id="wf-arabicName"
              type="text"
              maxLength={150}
              value={form.arabicName}
              onChange={(e) => setForm({ ...form, arabicName: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="wf-iqama" className={labelCls}>
              {tr(lang, 'Iqama / ID Number *', 'ইকামা / আইডি নম্বর *', 'رقم الإقامة / الهوية *')}
            </label>
            <input
              id="wf-iqama"
              type="text"
              required
              inputMode="numeric"
              maxLength={30}
              value={form.iqamaNumber}
              onChange={(e) => setForm({ ...form, iqamaNumber: e.target.value })}
              className={`${inputCls} font-mono-data`}
            />
          </div>

          <div>
            <label htmlFor="wf-phone" className={labelCls}>
              {tr(lang, 'Phone Number *', 'ফোন নম্বর *', 'رقم الهاتف *')}
            </label>
            <input
              id="wf-phone"
              type="tel"
              required
              maxLength={30}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`${inputCls} font-mono-data`}
            />
          </div>

          <div>
            <label htmlFor="wf-expiry" className={labelCls}>
              {tr(lang, 'Iqama Expiry Date *', 'ইকামার মেয়াদ *', 'تاريخ انتهاء الإقامة *')}
            </label>
            <input
              id="wf-expiry"
              type="date"
              required
              value={form.idExpiryDate}
              onChange={(e) => setForm({ ...form, idExpiryDate: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="wf-profession" className={labelCls}>
              {tr(lang, 'Profession *', 'পেশা *', 'المهنة *')}
            </label>
            <input
              id="wf-profession"
              type="text"
              required
              maxLength={100}
              value={form.profession}
              onChange={(e) => setForm({ ...form, profession: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="wf-nationality" className={labelCls}>
              {tr(lang, 'Nationality', 'জাতীয়তা', 'الجنسية')}
            </label>
            <input
              id="wf-nationality"
              type="text"
              maxLength={80}
              value={form.nationality}
              onChange={(e) => setForm({ ...form, nationality: e.target.value })}
              className={inputCls}
            />
          </div>

          {isDomestic ? (
            <div className="sm:col-span-2 p-4 rounded-2xl soft-surface-secondary space-y-3">
              <div className="text-xs font-bold text-[#4388FF]">
                {tr(
                  lang,
                  'Domestic worker owner / sponsor details',
                  'ডোমেস্টিক কর্মীর মালিক / স্পনসরের তথ্য',
                  'بيانات مالك / كفيل العمالة المنزلية'
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wf-ownerName" className={labelCls}>
                    {tr(lang, 'Owner / Sponsor Name *', 'মালিক / স্পনসরের নাম *', 'اسم المالك / الكفيل *')}
                  </label>
                  <input
                    id="wf-ownerName"
                    type="text"
                    required
                    maxLength={150}
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="wf-ownerPhone" className={labelCls}>
                    {tr(lang, 'Owner Phone (Optional)', 'মালিকের ফোন', 'هاتف المالك (اختياري)')}
                  </label>
                  <input
                    id="wf-ownerPhone"
                    type="tel"
                    maxLength={30}
                    value={form.ownerPhone}
                    onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                    className={`${inputCls} font-mono-data`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="sm:col-span-2">
              <label htmlFor="wf-company" className={labelCls}>
                {tr(lang, 'Linked Company *', 'কোম্পানি *', 'الشركة المرتبطة *')}
              </label>
              <select
                id="wf-company"
                required
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className={inputCls}
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="wf-joining" className={labelCls}>
              {tr(lang, 'Joining Date', 'যোগদানের তারিখ', 'تاريخ الانضمام')}
            </label>
            <input
              id="wf-joining"
              type="date"
              value={form.joiningDate}
              onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="wf-fee" className={labelCls}>
              {tr(lang, 'Monthly Fee (SAR) *', 'মাসিক ফি (SAR) *', 'الرسم الشهري (ريال) *')}
            </label>
            <input
              id="wf-fee"
              type="number"
              required
              min="0"
              max="1000000"
              step="0.01"
              value={form.monthlyFee}
              onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
              className={`${inputCls} font-mono-data`}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="wf-status" className={labelCls}>
              {tr(lang, 'Employment Status', 'চাকরির অবস্থা', 'الحالة الوظيفية')}
            </label>
            <select
              id="wf-status"
              value={form.employmentStatus}
              onChange={(e) =>
                setForm({ ...form, employmentStatus: e.target.value as EmploymentStatus })
              }
              className={inputCls}
            >
              <option value="Active">Active</option>
              <option value="Transfer Pending">Transfer Pending</option>
              <option value="Transferred">Transferred</option>
              <option value="Final Exit">Final Exit</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-subtle)]">
          <AnimatedButton type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {tr(lang, 'Cancel', 'বাতিল', 'إلغاء')}
          </AnimatedButton>
          <AnimatedButton type="submit" variant="teal" loading={saving}>
            {tr(lang, 'Save Worker', 'সংরক্ষণ করুন', 'حفظ العامل')}
          </AnimatedButton>
        </div>
      </form>
    </Modal>
  );
};
