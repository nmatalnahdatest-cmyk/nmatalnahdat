import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { CheckCircle2 } from 'lucide-react';
import type {
  Employee,
  Language,
  Payment,
  PaymentMethod,
  WorkerType,
} from '../../types/ems';
import {
  cents,
  computeAccount,
  money,
  monthNow,
  workerFee,
  workerKind,
} from '../../lib/accounting';
import { tr } from '../../lib/i18n';
import { usePrefersReducedMotion } from '../../hooks/useGsapAnimations';
import { Modal } from '../ui/Modal';
import { AnimatedButton } from '../ui/AnimatedButton';

export interface PaymentFormPayload {
  employeeId: string;
  period: string;
  paidAmount: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
}

interface PaymentFormModalProps {
  open: boolean;
  employees: Employee[];
  payments: Payment[];
  defaultCompanyFee: number;
  initialWorkerId?: string;
  initialPeriod?: string;
  filterType?: WorkerType;
  lang: Language;
  onClose: () => void;
  onSave: (payload: PaymentFormPayload) => Promise<{ fullyPaid: boolean }>;
}

const inputCls =
  'w-full h-10 px-3 rounded-xl soft-surface-secondary text-sm text-[var(--text-primary)] outline-none focus:border-[#4388FF]';
const labelCls = 'block text-xs font-semibold text-[var(--text-secondary)] mb-1';

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  open,
  employees,
  payments,
  defaultCompanyFee,
  initialWorkerId,
  initialPeriod,
  filterType,
  lang,
  onClose,
  onSave,
}) => {
  const eligible = useMemo(
    () =>
      employees.filter(
        (x) =>
          !x.deletedAt &&
          !x.archived &&
          (!filterType || workerKind(x) === filterType)
      ),
    [employees, filterType]
  );

  const [employeeId, setEmployeeId] = useState('');
  const [period, setPeriod] = useState(initialPeriod || monthNow());
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [paidStamp, setPaidStamp] = useState(false);

  const stampRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    setError('');
    setPaidStamp(false);
    const selected =
      eligible.find((x) => x.id === initialWorkerId) || eligible[0];
    setEmployeeId(selected?.id || '');
    setPeriod(initialPeriod || monthNow());
    setPaymentMethod('Cash');
    setReferenceNumber('');
  }, [open, initialWorkerId, initialPeriod, eligible]);

  const selectedWorker = useMemo(
    () => eligible.find((x) => x.id === employeeId) || null,
    [eligible, employeeId]
  );

  const dueInfo = useMemo(() => {
    if (!selectedWorker || !period) return { expected: 0, remaining: 0 };
    const acc = computeAccount(selectedWorker, payments);
    const g = acc.months.find((m) => m.key === period);
    const expected = g
      ? g.expected
      : cents(workerFee(selectedWorker, defaultCompanyFee));
    const remaining = g ? g.balance : expected;
    return { expected, remaining };
  }, [selectedWorker, period, payments, defaultCompanyFee]);

  useEffect(() => {
    if (!open) return;
    setPaidAmount(String(dueInfo.remaining / 100));
  }, [open, employeeId, period, dueInfo.remaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await onSave({
        employeeId,
        period,
        paidAmount,
        paymentMethod,
        referenceNumber,
      });

      if (res.fullyPaid) {
        setPaidStamp(true);
        if (!reduced && stampRef.current) {
          gsap.fromTo(
            stampRef.current,
            { scale: 1.5, opacity: 0, rotation: -12 },
            { scale: 1, opacity: 1, rotation: -6, duration: 0.35, ease: 'power3.out' }
          );
        }
        setTimeout(() => {
          setPaidStamp(false);
          onClose();
        }, 720);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record payment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tr(lang, 'Record Monthly Payment', 'মাসিক পেমেন্ট জমা', 'تسجيل دفعة شهرية')}
    >
      {eligible.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          Add an active non-archived worker first before recording payments.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 relative">
          {paidStamp && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--surface-primary)]/90 rounded-2xl">
              <div
                ref={stampRef}
                className="px-6 py-3 rounded-2xl border-4 border-[#00C985] text-[#009965] dark:text-[#3EE5A8] font-black text-2xl tracking-widest flex items-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="w-7 h-7" />
                <span>PAID</span>
              </div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] mt-3">
                {tr(lang, 'Saved to Supabase', 'সফলভাবে সংরক্ষিত', 'تم الحفظ في قاعدة البيانات')}
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-[#F05A65]/12 border border-[#F05A65]/30 text-xs font-semibold text-[#C9323E] dark:text-[#FF8A93]"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="pf-worker" className={labelCls}>
              Worker / Iqama *
            </label>
            <select
              id="pf-worker"
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className={inputCls}
            >
              {eligible.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.fullName} · {x.iqamaNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="pf-period" className={labelCls}>
                Period *
              </label>
              <input
                id="pf-period"
                type="month"
                required
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="p-3 rounded-xl bg-[#4388FF]/10 border border-[#4388FF]/25 flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                Expected / Remaining
              </span>
              <span className="text-xs font-mono-data font-bold text-[var(--text-primary)] mt-0.5">
                {money(dueInfo.expected)} SAR · Due {money(dueInfo.remaining)} SAR
              </span>
            </div>

            <div>
              <label htmlFor="pf-amount" className={labelCls}>
                Amount Received Now (SAR) *
              </label>
              <input
                id="pf-amount"
                type="number"
                required
                min="0.01"
                max={Math.max(0.01, dueInfo.remaining / 100)}
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className={`${inputCls} font-mono-data`}
              />
            </div>

            <div>
              <label htmlFor="pf-method" className={labelCls}>
                Payment Method
              </label>
              <select
                id="pf-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className={inputCls}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="pf-ref" className={labelCls}>
                Reference Number
              </label>
              <input
                id="pf-ref"
                type="text"
                maxLength={100}
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-subtle)]">
            <AnimatedButton type="button" variant="secondary" onClick={onClose} disabled={saving}>
              {tr(lang, 'Cancel', 'বাতিল', 'إلغاء')}
            </AnimatedButton>
            <AnimatedButton type="submit" variant="teal" loading={saving}>
              {tr(lang, 'Record Payment', 'পেমেন্ট সেভ করুন', 'حفظ الدفعة')}
            </AnimatedButton>
          </div>
        </form>
      )}
    </Modal>
  );
};
