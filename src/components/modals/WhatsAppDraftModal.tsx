import React, { useEffect, useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import type { Employee, Language, Payment } from '../../types/ems';
import { makeWhatsAppDraft, phoneNumber } from '../../lib/accounting';
import { tr } from '../../lib/i18n';
import { Modal } from '../ui/Modal';
import { AnimatedButton } from '../ui/AnimatedButton';

interface WhatsAppDraftModalProps {
  open: boolean;
  worker: Employee | null;
  payments: Payment[];
  businessName: string;
  lang: Language;
  onClose: () => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const WhatsAppDraftModal: React.FC<WhatsAppDraftModalProps> = ({
  open,
  worker,
  payments,
  businessName,
  lang,
  onClose,
  onNotify,
}) => {
  const [topic, setTopic] = useState<'balance' | 'iqama' | 'visa'>('balance');
  const [draftLang, setDraftLang] = useState<Language>(lang);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open || !worker) return;
    setTopic('balance');
    setDraftLang(lang);
    setMessage(makeWhatsAppDraft(worker, payments, 'balance', lang, businessName));
  }, [open, worker, payments, lang, businessName]);

  const handleParamChange = (
    nextTopic: 'balance' | 'iqama' | 'visa',
    nextLang: Language
  ) => {
    setTopic(nextTopic);
    setDraftLang(nextLang);
    if (worker) {
      setMessage(
        makeWhatsAppDraft(worker, payments, nextTopic, nextLang, businessName)
      );
    }
  };

  const validPhone = phoneNumber(worker?.phone);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      onNotify(tr(lang, 'Draft copied.', 'মেসেজ কপি হয়েছে।', 'تم نسخ المسودة.'));
    } catch {
      onNotify('Select the message text and copy it manually.', true);
    }
  };

  return (
    <Modal
      open={open && !!worker}
      onClose={onClose}
      title={tr(lang, 'WhatsApp Draft', 'হোয়াটসঅ্যাপ খসড়া', 'مسودة واتساب')}
      subtitle={worker ? `${worker.fullName} · ${worker.phone}` : undefined}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="wa-topic"
              className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
            >
              Message Topic
            </label>
            <select
              id="wa-topic"
              value={topic}
              onChange={(e) =>
                handleParamChange(
                  e.target.value as 'balance' | 'iqama' | 'visa',
                  draftLang
                )
              }
              className="w-full h-10 px-3 rounded-xl soft-surface-secondary text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="balance">Outstanding balance</option>
              <option value="iqama">Iqama expiry</option>
              <option value="visa">Visa return date</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="wa-lang"
              className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
            >
              Draft Language
            </label>
            <select
              id="wa-lang"
              value={draftLang}
              onChange={(e) =>
                handleParamChange(topic, e.target.value as Language)
              }
              className="w-full h-10 px-3 rounded-xl soft-surface-secondary text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="bn">বাংলা</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="wa-msg"
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
          >
            Review / Edit Message
          </label>
          <textarea
            id="wa-msg"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3.5 rounded-2xl soft-surface-secondary text-sm text-[var(--text-primary)] outline-none focus:border-[#4388FF]"
          />
        </div>

        {!validPhone && (
          <p className="text-xs font-semibold text-[#D93845] dark:text-[#FF848D]">
            Add a valid phone number with country code (or 05XXXXXXXX for KSA) to open WhatsApp directly. You can still copy the draft.
          </p>
        )}

        <p className="text-xs text-[var(--text-secondary)]">
          Opening WhatsApp shares the draft with WhatsApp so you can review and send it yourself.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <AnimatedButton variant="secondary" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
            <span>{tr(lang, 'Copy Draft', 'কপি করুন', 'نسخ')}</span>
          </AnimatedButton>
          {validPhone ? (
            <a
              href={`https://wa.me/${validPhone}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-2xl text-sm font-semibold bg-[#00C985] text-white hover:bg-[#00b577] transition-colors"
            >
              <span>Open WhatsApp</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <span className="inline-flex items-center justify-center h-10 px-4 rounded-2xl text-sm font-semibold bg-[var(--surface-secondary)] text-[var(--text-muted)] opacity-60 cursor-not-allowed">
              Open WhatsApp
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
};
