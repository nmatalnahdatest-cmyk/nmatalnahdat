import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { AnimatedButton } from './AnimatedButton';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) => {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-3.5">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            danger
              ? 'bg-[#F05A65]/15 text-[#F05A65]'
              : 'bg-[#4388FF]/15 text-[#4388FF]'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
          {message}
        </p>
      </div>
      <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[var(--border-subtle)]">
        <AnimatedButton variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </AnimatedButton>
        <AnimatedButton
          variant={danger ? 'danger' : 'teal'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </AnimatedButton>
      </div>
    </Modal>
  );
};
