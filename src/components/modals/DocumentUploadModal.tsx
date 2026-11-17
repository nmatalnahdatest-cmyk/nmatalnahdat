import React, { useEffect, useState } from 'react';
import { ExternalLink, Upload } from 'lucide-react';
import type { DocumentType, Employee, Language } from '../../types/ems';
import { tr } from '../../lib/i18n';
import { Modal } from '../ui/Modal';
import { AnimatedButton } from '../ui/AnimatedButton';

interface DocumentUploadModalProps {
  open: boolean;
  worker: Employee | null;
  lang: Language;
  onClose: () => void;
  onUpload: (workerId: string, docType: DocumentType, file: File) => Promise<void>;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  open,
  worker,
  lang,
  onClose,
  onUpload,
}) => {
  const [docType, setDocType] = useState<DocumentType>('Iqama');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setDocType('Iqama');
    setFile(null);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || !file) return;
    setError('');
    setUploading(true);
    try {
      await onUpload(worker.id, docType, file);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open && !!worker}
      onClose={onClose}
      title={tr(lang, 'Upload Private Document', 'ডকুমেন্ট আপলোড করুন', 'رفع مستند خاص')}
      subtitle={worker ? `${worker.fullName} · ${worker.iqamaNumber}` : undefined}
      maxWidth="max-w-lg"
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

        <div>
          <label
            htmlFor="doc-type"
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
          >
            Document Type
          </label>
          <select
            id="doc-type"
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType)}
            className="w-full h-10 px-3 rounded-xl soft-surface-secondary text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="Iqama">Iqama</option>
            <option value="Passport">Passport</option>
            <option value="Visa">Visa</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="doc-file"
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
          >
            Choose File · Maximum 10 MB (PDF, JPG, PNG, WebP)
          </label>
          <input
            id="doc-file"
            type="file"
            required
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-[var(--text-secondary)] file:me-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--surface-secondary)] file:text-[var(--text-primary)] cursor-pointer"
          />
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          Stored privately in your workspace bucket. Archiving retains the original file.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-subtle)]">
          <AnimatedButton type="button" variant="secondary" onClick={onClose} disabled={uploading}>
            {tr(lang, 'Cancel', 'বাতিল', 'إلغاء')}
          </AnimatedButton>
          <AnimatedButton type="submit" variant="teal" loading={uploading}>
            <Upload className="w-4 h-4" />
            <span>{tr(lang, 'Upload Document', 'আপলোড', 'رفع')}</span>
          </AnimatedButton>
        </div>
      </form>
    </Modal>
  );
};

interface DocumentViewerModalProps {
  docLink: { name: string; url: string } | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  docLink,
  onClose,
}) => {
  return (
    <Modal
      open={!!docLink}
      onClose={onClose}
      title="Private Document"
      subtitle={docLink?.name}
      maxWidth="max-w-md"
    >
      <p className="text-xs text-[var(--text-secondary)]">
        This secure signed link expires in 60 seconds.
      </p>
      <div className="flex items-center justify-end gap-2.5 mt-5 pt-4 border-t border-[var(--border-subtle)]">
        <AnimatedButton variant="secondary" onClick={onClose}>
          Close
        </AnimatedButton>
        {docLink && (
          <a
            href={docLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-2xl text-sm font-semibold bg-[#153B40] text-white hover:bg-[#1b4b52] transition-colors"
          >
            <span>Open Document</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </Modal>
  );
};
