import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Printer,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';
import type {
  Employee,
  Language,
  WorkspaceChoice,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSettings,
} from '../../types/ems';
import { exportCSV } from '../../lib/accounting';
import { tr } from '../../lib/i18n';
import { useStaggerEntrance } from '../../hooks/useGsapAnimations';
import { AnimatedButton } from '../ui/AnimatedButton';

interface SettingsViewProps {
  settings: WorkspaceSettings;
  employees: Employee[];
  payments: unknown[];
  lang: Language;
  canWrite: boolean;
  role: WorkspaceRole;
  upgradeReady: boolean;
  choices: WorkspaceChoice[];
  currentOwner: string;
  members: WorkspaceMember[];
  membersLoading: boolean;
  onSaveSettings: (businessName: string, defaultFee: number) => Promise<void>;
  onSwitchWorkspace: (ownerId: string) => void;
  onGrantMember: (email: string, role: 'viewer' | 'editor') => Promise<void>;
  onRevokeMember: (memberId: string) => void;
  onBackupJSON: () => void;
  onRestoreBackup: (file: File) => Promise<void>;
  onRestoreDeletedWorker: (workerId: string) => void;
  onPrintStatement: (workerId: string) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  employees,
  payments,
  lang,
  canWrite,
  role,
  upgradeReady,
  choices,
  currentOwner,
  members,
  membersLoading,
  onSaveSettings,
  onSwitchWorkspace,
  onGrantMember,
  onRevokeMember,
  onBackupJSON,
  onRestoreBackup,
  onRestoreDeletedWorker,
  onPrintStatement,
  onNotify,
}) => {
  const [businessName, setBusinessName] = useState(settings.businessName || 'Nmat Al Nahdat');
  const [defaultFee, setDefaultFee] = useState(String(settings.defaultFee ?? 350));
  const [savingSettings, setSavingSettings] = useState(false);

  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'viewer' | 'editor'>('viewer');
  const [savingMember, setSavingMember] = useState(false);

  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  useStaggerEntrance(ref, '[data-set-card]', [lang]);

  useEffect(() => {
    setBusinessName(settings.businessName || 'Nmat Al Nahdat');
    setDefaultFee(String(settings.defaultFee ?? 350));
  }, [settings]);

  const deletedWorkers = employees.filter((e) => e.deletedAt);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await onSaveSettings(businessName, Number(defaultFee));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setSavingMember(true);
    try {
      await onGrantMember(memberEmail.trim(), memberRole);
      setMemberEmail('');
    } finally {
      setSavingMember(false);
    }
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) return;
    setRestoring(true);
    try {
      await onRestoreBackup(restoreFile);
      setRestoreFile(null);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div ref={ref} className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          {tr(lang, 'Settings & Access', 'সেটিংস ও অ্যাক্সেস', 'الإعدادات والصلاحيات')}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {tr(
            lang,
            'Manage business configuration, workspace permissions, backups, exports, and deleted workers.',
            'ব্যবসার তথ্য, ওয়ার্কস্পেস অনুমতি, ব্যাকআপ, এক্সপোর্ট এবং ডিলেট করা কর্মীদের পরিচালনা।',
            'إدارة إعدادات المؤسسة والصلاحيات والنسخ الاحتياطي واستعادة العمال المحذوفين.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Business Details */}
        <section data-set-card className="soft-card p-5 md:p-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] pb-3 border-b border-[var(--border-subtle)]">
            {tr(lang, 'Business Details', 'প্রতিষ্ঠানের তথ্য', 'بيانات المؤسسة')}
          </h2>

          <form onSubmit={handleSettingsSubmit} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="setBusinessName"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
              >
                {tr(lang, 'Business Name', 'প্রতিষ্ঠানের নাম', 'اسم المؤسسة')}
              </label>
              <input
                id="setBusinessName"
                type="text"
                required
                maxLength={150}
                disabled={!canWrite}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl soft-surface-secondary text-sm text-[var(--text-primary)] outline-none focus:border-[#4388FF] disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="setDefaultFee"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
              >
                {tr(
                  lang,
                  'Default Company Monthly Fee (SAR)',
                  'ডিফল্ট কোম্পানি মাসিক ফি (SAR)',
                  'الرسم الشهري الافتراضي للشركات (ريال)'
                )}
              </label>
              <input
                id="setDefaultFee"
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                required
                disabled={!canWrite}
                value={defaultFee}
                onChange={(e) => setDefaultFee(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl soft-surface-secondary text-sm font-mono-data text-[var(--text-primary)] outline-none focus:border-[#4388FF] disabled:opacity-60"
              />
            </div>

            {canWrite ? (
              <AnimatedButton type="submit" variant="teal" loading={savingSettings}>
                <Save className="w-4 h-4" />
                <span>{tr(lang, 'Save Settings', 'সেটিংস সেভ করুন', 'حفظ الإعدادات')}</span>
              </AnimatedButton>
            ) : (
              <p className="text-xs font-semibold text-[var(--text-secondary)]">
                Read-only viewer access
              </p>
            )}
          </form>
        </section>

        {/* Backup & Export */}
        <section data-set-card className="soft-card p-5 md:p-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] pb-3 border-b border-[var(--border-subtle)]">
            {tr(lang, 'Backup & Export', 'ব্যাকআপ ও এক্সপোর্ট', 'النسخ الاحتياطي والتصدير')}
          </h2>

          <p className="text-xs text-[var(--text-secondary)] mt-3">
            {tr(
              lang,
              'Download saved worker, company, and payment records. Private documents are stored separately in Supabase Storage.',
              'কর্মী, কোম্পানি এবং পেমেন্ট রেকর্ড ডাউনলোড করুন। ব্যক্তিগত ডকুমেন্ট আলাদাভাবে সংরক্ষিত থাকে।',
              'تنزيل سجلات العمال والشركات والمدفوعات. المستندات الخاصة محفوظة بشكل منفصل.'
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <AnimatedButton variant="primary" size="sm" onClick={onBackupJSON}>
              <Download className="w-3.5 h-3.5" />
              <span>{tr(lang, 'Backup JSON', 'ব্যাকআপ JSON', 'نسخة احتياطية JSON')}</span>
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              size="sm"
              onClick={() => {
                const ok = exportCSV(
                  'Workers',
                  employees as unknown as Record<string, unknown>[]
                );
                if (!ok) onNotify('No worker records to export.', true);
              }}
            >
              <span>{tr(lang, 'Export Workers CSV', 'কর্মী CSV', 'تصدير العمال CSV')}</span>
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              size="sm"
              onClick={() => {
                const ok = exportCSV(
                  'Payments',
                  payments as unknown as Record<string, unknown>[]
                );
                if (!ok) onNotify('No payment records to export.', true);
              }}
            >
              <span>{tr(lang, 'Export Payments CSV', 'পেমেন্ট CSV', 'تصدير الدفعات CSV')}</span>
            </AnimatedButton>
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">
              {tr(lang, 'Restore a Backup', 'ব্যাকআপ রিস্টোর করুন', 'استعادة نسخة احتياطية')}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {tr(
                lang,
                'Restoring replaces saved workspace lists. A backup of current records downloads automatically first.',
                'রিস্টোর করলে বর্তমান তালিকা পরিবর্তিত হবে। প্রথমে স্বয়ংক্রিয়ভাবে একটি ব্যাকআপ ডাউনলোড হবে।',
                'الاستعادة تستبدل القوائم الحالية. سيتم تنزيل نسخة من السجلات الحالية تلقائياً أولاً.'
              )}
            </p>
            {canWrite ? (
              <form onSubmit={handleRestoreSubmit} className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  type="file"
                  accept="application/json,.json"
                  required
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  aria-label="Choose backup JSON file"
                  className="text-xs text-[var(--text-secondary)] file:me-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--surface-secondary)] file:text-[var(--text-primary)] cursor-pointer flex-1"
                />
                <AnimatedButton type="submit" variant="danger" size="sm" loading={restoring}>
                  <Upload className="w-3.5 h-3.5" />
                  <span>{tr(lang, 'Restore Backup', 'রিস্টোর', 'استعادة')}</span>
                </AnimatedButton>
              </form>
            ) : (
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Only an owner or editor can restore backups.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Workspace & Team Access */}
      <section data-set-card className="soft-card p-5 md:p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <Shield className="w-4 h-4 text-[#153B40] dark:text-[#4388FF]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            {tr(lang, 'Workspace & Access Control', 'ওয়ার্কস্পেস ও অনুমতি', 'مساحة العمل والصلاحيات')}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div>
            <label
              htmlFor="workspaceSelector"
              className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
            >
              {tr(lang, 'Current Workspace', 'বর্তমান ওয়ার্কস্পেস', 'مساحة العمل الحالية')}
            </label>
            <select
              id="workspaceSelector"
              value={currentOwner}
              onChange={(e) => onSwitchWorkspace(e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl soft-surface-secondary text-sm font-semibold text-[var(--text-primary)] outline-none"
            >
              {choices.map((c) => (
                <option key={c.owner} value={c.owner}>
                  {c.title} · {c.role}
                </option>
              ))}
            </select>

            {!upgradeReady && (
              <div className="mt-3 p-3 rounded-xl bg-[#FFD84D]/20 text-xs text-[var(--text-primary)]">
                Private documents and shared team users require SETUP.sql in Supabase.
              </div>
            )}
          </div>

          <div>
            {role === 'owner' && upgradeReady ? (
              <form onSubmit={handleMemberSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="memberEmailInput"
                      className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                    >
                      Existing Supabase User Email
                    </label>
                    <input
                      id="memberEmailInput"
                      type="email"
                      required
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="staff@example.com"
                      className="w-full h-10 px-3 rounded-xl soft-surface-secondary text-xs text-[var(--text-primary)] outline-none focus:border-[#4388FF]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="memberRoleSelect"
                      className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                    >
                      Permission
                    </label>
                    <select
                      id="memberRoleSelect"
                      value={memberRole}
                      onChange={(e) =>
                        setMemberRole(e.target.value as 'viewer' | 'editor')
                      }
                      className="w-full h-10 px-3 rounded-xl soft-surface-secondary text-xs font-semibold text-[var(--text-primary)] outline-none"
                    >
                      <option value="viewer">Viewer — Read only</option>
                      <option value="editor">Editor — Can change records</option>
                    </select>
                  </div>
                </div>
                <AnimatedButton type="submit" variant="teal" size="sm" loading={savingMember}>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{tr(lang, 'Grant Access', 'অনুমতি দিন', 'منح الصلاحية')}</span>
                </AnimatedButton>
              </form>
            ) : (
              <p className="text-xs text-[var(--text-secondary)]">
                Only the workspace owner can grant or revoke team access.
              </p>
            )}

            {role === 'owner' && upgradeReady && (
              <div className="mt-4 space-y-2">
                {membersLoading ? (
                  <p className="text-xs text-[var(--text-secondary)]">Loading shared users…</p>
                ) : members.length === 0 ? (
                  <p className="text-xs text-[var(--text-secondary)]">No shared users yet.</p>
                ) : (
                  members.map((m) => (
                    <div
                      key={m.member_id}
                      className="p-2.5 rounded-xl soft-surface-secondary flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[var(--text-primary)]">
                          {m.member_email}
                        </span>
                        <span className="ms-2 text-[11px] uppercase font-bold text-[#4388FF]">
                          {m.role}
                        </span>
                      </div>
                      <AnimatedButton
                        variant="danger"
                        size="sm"
                        onClick={() => onRevokeMember(m.member_id)}
                      >
                        Revoke
                      </AnimatedButton>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Deleted Workers & Restore */}
      <section data-set-card className="soft-card p-5 md:p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <Trash2 className="w-4 h-4 text-[#F05A65]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            {tr(lang, 'Deleted Workers', 'ডিলেট করা কর্মী', 'العمال المحذوفون')}
          </h2>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-2">
          {tr(
            lang,
            'Deleted workers are removed from active lists, searches, and reminders. Monthly history, opening balances, and documents are preserved and can be restored here.',
            'ডিলেট করা কর্মী তালিকা ও রিমাইন্ডারে থাকেন না, তবে পুরোনো হিসাব ও ডকুমেন্ট সংরক্ষিত থাকে। এখান থেকে Restore করা যাবে।',
            'لا يظهر العمال المحذوفون في القوائم والتنبيهات مع الاحتفاظ بكامل السجلات والمستندات وإمكانية الاستعادة.'
          )}
        </p>

        <div className="mt-4 space-y-2">
          {deletedWorkers.map((w) => (
            <div
              key={w.id}
              className="p-3 rounded-2xl soft-surface-secondary flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-[var(--text-primary)]">{w.fullName}</div>
                <div className="font-mono-data text-[var(--text-secondary)]">
                  {w.iqamaNumber} · Deleted {w.deletedAt?.slice(0, 10)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => onPrintStatement(w.id)}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{tr(lang, 'Statement', 'হিসাব', 'كشف الحساب')}</span>
                </AnimatedButton>
                {canWrite && (
                  <AnimatedButton
                    variant="primary"
                    size="sm"
                    onClick={() => onRestoreDeletedWorker(w.id)}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'Restore', 'রিস্টোর', 'استعادة')}</span>
                  </AnimatedButton>
                )}
              </div>
            </div>
          ))}
          {deletedWorkers.length === 0 && (
            <p className="text-xs text-[var(--text-secondary)] py-3">
              {tr(lang, 'No deleted workers.', 'কোনো ডিলেট করা কর্মী নেই।', 'لا يوجد عمال محذوفون.')}
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
