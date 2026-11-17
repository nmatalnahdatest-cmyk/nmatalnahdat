import React, { useEffect, useState } from 'react';
import type { Employee, Language } from '../../types/ems';
import { cents, money, todayRiyadh } from '../../lib/accounting';
import { tr } from '../../lib/i18n';
import { Modal } from '../ui/Modal';
import { AnimatedButton } from '../ui/AnimatedButton';

export interface OpeningBalancePayload {
  amount: string;
  date?: string;
  note?: string;
  method?: string;
  reference?: string;
}

interface OpeningBalanceModalProps {
  open: boolean;
  worker: Employee | null;
  payMode: boolean;
  lang: Language;
  onClose: () => void;
  onSave: (payload: OpeningBalancePayload, workerId: string, payMode: boolean) => Promise<void>;
}

const inputCls =
  'w-full h-10 px-3 rounded-xl soft-surface-secondary text-sm text-[var(--text-primary)] outline-none focus:border-[#4388FF]';
const labelCls = 'block text-xs font-semibold text-[var(--text-secondary)] mb-1';

export const OpeningBalanceModal: React.FC<OpeningBalanceModalProps> = ({
  open,
  worker,
  payMode,
  lang,
  onClose,
  onSave,
}) => {
  const [amount, setAmount] = useState('0');
  const [date, setDate] = useState(todayRiyadh());
  const [note, setNote] = useState('');
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const o = worker?.openingBalance || {};
  const remaining = Math.max(0, cents(o.amount) - cents(o.paid));

  useEffect(() => {
    if (!open || !worker) return;
    setError('');
    if (payMode) {
      setAmount(String(remaining / 100));
      setMethod('Cash');
      setReference('');
    } else {
      setAmount(String(Number(o.amount || 0)));
      setDate(o.date || todayRiyadh());
      setNote(o.note || '');
    }
  }, [open, worker, payMode, remaining, o.amount, o.date, o.note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    setError('');
    setSaving(true);
    try {
      await onSave(
        payMode ? { amount, method, reference } : { amount, date, note },
        worker.id,
        payMode
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open && !!worker}
      onClose={onClose}
      title={payMode ? 'Pay Old Balance' : 'Opening Balance'}
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

        <div className="p-3 rounded-xl bg-[#4388FF]/10 border border-[#4388FF]/25 text-xs text-[var(--text-primary)]">
          {payMode
            ? `Remaining old balance: ${money(remaining)} SAR. Enter only the amount received now.`
            : 'Only enter previous debt not already included in monthly records. Existing old-balance payments are preserved.'}
        </div>

        {payMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="ob-pay-amt" className={labelCls}>
                Amount Received (SAR) *
              </label>
              <input
                id="ob-pay-amt"
                type="number"
                required
                min="0.01"
                max={remaining / 100}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${inputCls} font-mono-data`}
              />
            </div>
            <div>
              <label htmlFor="ob-pay-method" className={labelCls}>
                Method
              </label>
              <select
                id="ob-pay-method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className={inputCls}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ob-pay-ref" className={labelCls}>
                Reference
              </label>
              <input
                id="ob-pay-ref"
                type="text"
                maxLength={100}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="ob-amt" className={labelCls}>
                Previous Dues (SAR) *
              </label>
              <input
                id="ob-amt"
                type="number"
                required
                min={Number(o.paid || 0)}
                max="10000000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${inputCls} font-mono-data`}
              />
            </div>
            <div>
              <label htmlFor="ob-date" className={labelCls}>
                Balance As Of *
              </label>
              <input
                id="ob-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ob-note" className={labelCls}>
                Note / Covered Period
              </label>
              <input
                id="ob-note"
                type="text"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-subtle)]">
          <AnimatedButton type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {tr(lang, 'Cancel', 'বাতিল', 'إلغاء')}
          </AnimatedButton>
          <AnimatedButton type="submit" variant="teal" loading={saving}>
            {payMode
              ? tr(lang, 'Record Payment', 'পেমেন্ট সেভ', 'تسجيل الدفعة')
              : tr(lang, 'Save Opening Balance', 'সংরক্ষণ করুন', 'حفظ الرصيد')}
          </AnimatedButton>
        </div>
      </form>
    </Modal>
  );
};
