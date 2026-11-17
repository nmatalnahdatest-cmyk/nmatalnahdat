import React, { useEffect, useState } from 'react';
import type { Employee, Language, VisaStatus } from '../../types/ems';
import { tr } from '../../lib/i18n';
import { Modal } from '../ui/Modal';
import { AnimatedButton } from '../ui/AnimatedButton';

export interface VisaFormPayload {
  status: VisaStatus;
  number: string;
  issueDate: string;
  returnBy: string;
  note: string;
}

interface VisaFormModalProps {
  open: boolean;
  worker: Employee | null;
  lang: Language;
  onClose: () => void;
  onSave: (payload: VisaFormPayload, workerId: string) => Promise<void>;
}

const inputCls =
  'w-full h-10 px-3 rounded-xl soft-surface-secondary text-sm text-[var(--text-primary)] outline-none focus:border-[#4388FF]';
const labelCls = 'block text-xs font-semibold text-[var(--text-secondary)] mb-1';

export const VisaFormModal: React.FC<VisaFormModalProps> = ({
  open,
  worker,
  lang,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<VisaFormPayload>({
    status: 'None',
    number: '',
    issueDate: '',
    returnBy: '',
    note: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !worker) return;
    setError('');
    const v = worker.exitReentry || {};
    setForm({
      status: v.status || 'None',
      number: v.number || '',
      issueDate: v.issueDate || '',
      returnBy: v.returnBy || '',
      note: v.note || '',
    });
  }, [open, worker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    setError('');
    setSaving(true);
    try {
      await onSave(form, worker.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save visa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open && !!worker}
      onClose={onClose}
      title={tr(lang, 'Exit Re-entry Visa', 'এক্সিট রি-এন্ট্রি ভিসা', 'تأشيرة الخروج والعودة')}
      subtitle={worker ? `${worker.fullName} · ${worker.iqamaNumber}` : undefined}
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
            <label htmlFor="vf-status" className={labelCls}>
              Visa Status
            </label>
            <select
              id="vf-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as VisaStatus })}
              className={inputCls}
            >
              <option value="None">None</option>
              <option value="Issued">Issued</option>
              <option value="Outside KSA">Outside KSA</option>
              <option value="Returned">Returned</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label htmlFor="vf-number" className={labelCls}>
              Visa Number
            </label>
            <input
              id="vf-number"
              type="text"
              maxLength={60}
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              className={`${inputCls} font-mono-data`}
            />
          </div>
          <div>
            <label htmlFor="vf-issue" className={labelCls}>
              Issue Date
            </label>
            <input
              id="vf-issue"
              type="date"
              value={form.issueDate}
              onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="vf-return" className={labelCls}>
              Return By
            </label>
            <input
              id="vf-return"
              type="date"
              value={form.returnBy}
              onChange={(e) => setForm({ ...form, returnBy: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="vf-note" className={labelCls}>
              Notes
            </label>
            <input
              id="vf-note"
              type="text"
              maxLength={500}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-subtle)]">
          <AnimatedButton type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {tr(lang, 'Cancel', 'বাতিল', 'إلغاء')}
          </AnimatedButton>
          <AnimatedButton type="submit" variant="teal" loading={saving}>
            {tr(lang, 'Save Visa', 'সংরক্ষণ করুন', 'حفظ التأشيرة')}
          </AnimatedButton>
        </div>
      </form>
    </Modal>
  );
};
