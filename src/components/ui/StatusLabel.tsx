import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Plane,
  Archive,
  MinusCircle,
} from 'lucide-react';
import type { Language } from '../../types/ems';
import { translateStatus } from '../../lib/i18n';

interface StatusLabelProps {
  status: string;
  lang: Language;
  subText?: string;
}

export const StatusLabel: React.FC<StatusLabelProps> = ({ status, lang, subText }) => {
  const s = status || 'None';
  let tone =
    'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)]';
  let Icon = MinusCircle;

  if (['Active', 'PAID', 'Returned'].includes(s)) {
    tone =
      'bg-[#00C985]/12 text-[#008C5C] dark:text-[#3EE5A8] border-[#00C985]/25';
    Icon = CheckCircle2;
  } else if (['Transfer Pending', 'PARTIAL', 'Issued', 'Outside KSA'].includes(s)) {
    tone =
      s === 'Outside KSA' || s === 'Issued'
        ? 'bg-[#4388FF]/12 text-[#2266DC] dark:text-[#8FB8FF] border-[#4388FF]/25'
        : 'bg-[#FFD84D]/22 text-[#8C6800] dark:text-[#FFE175] border-[#FFD84D]/40';
    Icon = s === 'Issued' || s === 'Outside KSA' ? Plane : Clock;
  } else if (['UNPAID', 'Overdue', 'Cancelled', 'Final Exit'].includes(s)) {
    tone =
      'bg-[#F05A65]/12 text-[#C9323E] dark:text-[#FF848D] border-[#F05A65]/25';
    Icon = s === 'Cancelled' ? XCircle : AlertTriangle;
  } else if (['Archived', 'Inactive', 'Transferred'].includes(s)) {
    tone =
      'bg-[#8957FF]/12 text-[#6435D6] dark:text-[#B99BFF] border-[#8957FF]/25';
    Icon = Archive;
  }

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border whitespace-nowrap ${tone}`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{translateStatus(lang, s)}</span>
      </span>
      {subText && (
        <span className="text-[11px] text-[var(--text-secondary)] ps-0.5">{subText}</span>
      )}
    </span>
  );
};
