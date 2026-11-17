import React, { useEffect, useState } from 'react';
import type { Company, Language } from '../../types/ems';
import { tr } from '../../lib/i18n';
import { Modal } from '../ui/Modal';
import { AnimatedButton } from '../ui/AnimatedButton';

export interface CompanyFormPayload {
  companyName: string;
  arabicCompanyName: string;
  companyLicenseNumber: string;
  unifiedNumber: string;
  establishmentNumber: string;
  contactPerson: string;
  phone: string;
}

interface CompanyFormModalProps {
  open: boolean;
  editingCompany: Company | null;
  lang: Language;
  onClose: () => void;
  onSave: (payload: CompanyFormPayload, companyId?: string) => Promise<void>;
}

const inputCls =
  'w-full h-10 px-3 rounded-xl soft-surface-secondary text-sm text-[var(--text-primary)] outline-none focus:border-[#4388FF]';
const labelCls = 'block text-xs font-semibold text-[var(--text-secondary)] mb-1';

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  open,
  editingCompany,
  lang,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<CompanyFormPayload>({
    companyName: '',
    arabicCompanyName: '',
    companyLicenseNumber: '',
    unifiedNumber: '',
    establishmentNumber: '',
    contactPerson: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({
      companyName: editingCompany?.companyName || '',
      arabicCompanyName: editingCompany?.arabicCompanyName || '',
      companyLicenseNumber: editingCompany?.companyLicenseNumber || '',
      unifiedNumber: editingCompany?.unifiedNumber || '',
      establishmentNumber: editingCompany?.establishmentNumber || '',
      contactPerson: editingCompany?.contactPerson || '',
      phone: editingCompany?.phone || '',
    });
  }, [open, editingCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(form, editingCompany?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save company.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        editingCompany
          ? tr(lang, 'Edit Company', 'কোম্পানি এডিট', 'تعديل الشركة')
          : tr(lang, 'Add Company', 'কোম্পানি যোগ করুন', 'إضافة شركة')
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
            <label htmlFor="cf-name" className={labelCls}>
              Company Name *
            </label>
            <input
              id="cf-name"
              type="text"
              required
              maxLength={150}
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="cf-arName" className={labelCls}>
              Arabic Company Name
            </label>
            <input
              id="cf-arName"
              type="text"
              maxLength={150}
              value={form.arabicCompanyName}
              onChange={(e) => setForm({ ...form, arabicCompanyName: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="cf-cr" className={labelCls}>
              Company License / CR
            </label>
            <input
              id="cf-cr"
              type="text"
              maxLength={40}
              value={form.companyLicenseNumber}
              onChange={(e) => setForm({ ...form, companyLicenseNumber: e.target.value })}
              className={`${inputCls} font-mono-data`}
            />
          </div>
          <div>
            <label htmlFor="cf-unified" className={labelCls}>
              Unified Number
            </label>
            <input
              id="cf-unified"
              type="text"
              maxLength={40}
              value={form.unifiedNumber}
              onChange={(e) => setForm({ ...form, unifiedNumber: e.target.value })}
              className={`${inputCls} font-mono-data`}
            />
          </div>
          <div>
            <label htmlFor="cf-est" className={labelCls}>
              Establishment Number
            </label>
            <input
              id="cf-est"
              type="text"
              maxLength={40}
              value={form.establishmentNumber}
              onChange={(e) => setForm({ ...form, establishmentNumber: e.target.value })}
              className={`${inputCls} font-mono-data`}
            />
          </div>
          <div>
            <label htmlFor="cf-contact" className={labelCls}>
              Contact Person
            </label>
            <input
              id="cf-contact"
              type="text"
              maxLength={100}
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cf-phone" className={labelCls}>
              Phone
            </label>
            <input
              id="cf-phone"
              type="tel"
              maxLength={30}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`${inputCls} font-mono-data`}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-subtle)]">
          <AnimatedButton type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {tr(lang, 'Cancel', 'বাতিল', 'إلغاء')}
          </AnimatedButton>
          <AnimatedButton type="submit" variant="teal" loading={saving}>
            {tr(lang, 'Save Company', 'সংরক্ষণ করুন', 'حفظ الشركة')}
          </AnimatedButton>
        </div>
      </form>
    </Modal>
  );
};
