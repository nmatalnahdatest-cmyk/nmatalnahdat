import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import gsap from 'gsap';
import {
  DATA_KEYS,
  DEFAULT_SETTINGS,
  EMPTY_WORKSPACE_DATA,
  SUPABASE_CONFIG,
  supabase,
  type DataKeyName,
} from './lib/supabase';
import type {
  Company,
  DocumentType,
  Employee,
  Language,
  PageRoute,
  Payment,
  PrintPayload,
  ThemeMode,
  WorkspaceChoice,
  WorkspaceData,
  WorkspaceMember,
  WorkspaceRole,
  WorkerType,
} from './types/ems';
import {
  cents,
  computeAccount,
  computeReminders,
  dayDiff,
  downloadFile,
  monthNow,
  norm,
  todayRiyadh,
  uid,
  validMoney,
  workerFee,
  workerKind,
} from './lib/accounting';
import { tr } from './lib/i18n';
import { useGlobalButtonTactile, usePrefersReducedMotion } from './hooks/useGsapAnimations';

import { LoginView } from './components/auth/LoginView';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { WorkerSearchView } from './components/modules/WorkerSearchView';
import { RemindersView } from './components/modules/RemindersView';
import { WorkersDirectoryView } from './components/modules/WorkersDirectoryView';
import { CompaniesView } from './components/modules/CompaniesView';
import { VisasView } from './components/modules/VisasView';
import { PaymentsView } from './components/modules/PaymentsView';
import { PaymentHistoryView } from './components/modules/PaymentHistoryView';
import { WorkerProfileView } from './components/modules/WorkerProfileView';
import { SettingsView } from './components/modules/SettingsView';

import {
  WorkerFormModal,
  type WorkerFormSubmitPayload,
} from './components/modals/WorkerFormModal';
import {
  CompanyFormModal,
  type CompanyFormPayload,
} from './components/modals/CompanyFormModal';
import {
  VisaFormModal,
  type VisaFormPayload,
} from './components/modals/VisaFormModal';
import {
  PaymentFormModal,
  type PaymentFormPayload,
} from './components/modals/PaymentFormModal';
import {
  OpeningBalanceModal,
  type OpeningBalancePayload,
} from './components/modals/OpeningBalanceModal';
import {
  DocumentUploadModal,
  DocumentViewerModal,
} from './components/modals/DocumentUploadModal';
import { WhatsAppDraftModal } from './components/modals/WhatsAppDraftModal';
import { PrintArea } from './components/modals/PrintArea';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { Toast, type ToastState } from './components/ui/Toast';

interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
}

export default function App() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'login' | 'ready'>('loading');
  const [loginError, setLoginError] = useState('');
  const [user, setUser] = useState<User | null>(null);

  const [ownerId, setOwnerId] = useState<string>('');
  const [role, setRole] = useState<WorkspaceRole>('viewer');
  const [upgradeReady, setUpgradeReady] = useState(false);
  const [choices, setChoices] = useState<WorkspaceChoice[]>([]);
  const [data, setData] = useState<WorkspaceData>(EMPTY_WORKSPACE_DATA);
  const versionsRef = useRef<Partial<Record<DataKeyName, string>>>({});
  const ownerRef = useRef<string>('');
  const roleRef = useRef<WorkspaceRole>('viewer');
  const userRef = useRef<User | null>(null);
  const dataRef = useRef<WorkspaceData>(EMPTY_WORKSPACE_DATA);

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [page, setPage] = useState<PageRoute>('dashboard');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilterInit, setCompanyFilterInit] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('nmat_single_lang');
    return saved === 'bn' || saved === 'ar' ? saved : 'en';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('nmat_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  // Modals state
  const [workerModal, setWorkerModal] = useState<{
    open: boolean;
    worker: Employee | null;
    defaultType: WorkerType;
  }>({ open: false, worker: null, defaultType: 'company' });

  const [companyModal, setCompanyModal] = useState<{
    open: boolean;
    company: Company | null;
  }>({ open: false, company: null });

  const [visaModal, setVisaModal] = useState<Employee | null>(null);

  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    workerId?: string;
    period?: string;
    filterType?: WorkerType;
  }>({ open: false });

  const [openingModal, setOpeningModal] = useState<{
    open: boolean;
    worker: Employee | null;
    payMode: boolean;
  }>({ open: false, worker: null, payMode: false });

  const [docUploadWorker, setDocUploadWorker] = useState<Employee | null>(null);
  const [docViewerLink, setDocViewerLink] = useState<{ name: string; url: string } | null>(null);
  const [whatsAppWorker, setWhatsAppWorker] = useState<Employee | null>(null);
  const [printPayload, setPrintPayload] = useState<PrintPayload>(null);

  const [confirmState, setConfirmState] = useState<ConfirmConfig | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const workspaceBodyRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useGlobalButtonTactile();

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    ownerRef.current = ownerId;
  }, [ownerId]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Apply theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('nmat_theme', theme);
  }, [theme]);

  // Apply lang & RTL direction to <html>
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('nmat_single_lang', lang);
  }, [lang]);

  const notify = useCallback((message: string, isError = false) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({
      id: Date.now(),
      message,
      type: isError ? 'error' : 'success',
    });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4400);
  }, []);

  const canWrite = useMemo(
    () => authStatus === 'ready' && !!user && ['owner', 'editor'].includes(role),
    [authStatus, user, role]
  );

  const guardWrite = useCallback(() => {
    if (
      authStatus !== 'ready' ||
      !userRef.current ||
      !['owner', 'editor'].includes(roleRef.current)
    ) {
      throw new Error(
        tr(
          lang,
          'This workspace is read-only.',
          'এই অ্যাকাউন্টে পরিবর্তনের অনুমতি নেই।',
          'هذا الحساب للقراءة فقط.'
        )
      );
    }
  }, [authStatus, lang]);

  // Load workspace from existing Supabase `workspace_members` & `app_data`
  const loadWorkspace = useCallback(
    async (activeUser: User, preferredOwner: string | null = null) => {
      const uidVal = activeUser.id;
      const membership = await supabase
        .from('workspace_members')
        .select('workspace_owner_id,role')
        .eq('member_id', uidVal);

      if (
        membership.error &&
        !['42P01', 'PGRST205'].includes(membership.error.code || '')
      ) {
        throw new Error(`Could not read workspace access: ${membership.error.message}`);
      }

      const hasUpgrade = !membership.error;
      const workspaceChoices: WorkspaceChoice[] = [
        {
          owner: uidVal,
          role: 'owner',
          title: tr(lang, 'My workspace', 'আমার ওয়ার্কস্পেস', 'مساحتي'),
        },
        ...(membership.data || []).map((m) => ({
          owner: m.workspace_owner_id as string,
          role: m.role as WorkspaceRole,
          title: `Shared · ${String(m.workspace_owner_id).slice(0, 8)}`,
        })),
      ];

      const remembered =
        preferredOwner || localStorage.getItem(`nmat_v3_workspace_${uidVal}`);
      const choice =
        workspaceChoices.find((x) => x.owner === remembered) ||
        workspaceChoices.find((x) => x.owner !== uidVal) ||
        workspaceChoices[0];

      const { data: rows, error } = await supabase
        .from('app_data')
        .select('data_key,data_value,updated_at')
        .eq('user_id', choice.owner);

      if (error) throw new Error(`Could not load records: ${error.message}`);
      if (userRef.current && userRef.current.id !== uidVal) {
        throw new Error('Account changed during load.');
      }

      const values: WorkspaceData = {
        employees: [],
        companies: [],
        payments: [],
        settings: { ...DEFAULT_SETTINGS },
        logs: [],
      };
      const nextVersions: Partial<Record<DataKeyName, string>> = {};

      for (const row of rows || []) {
        const name = (Object.keys(DATA_KEYS) as DataKeyName[]).find(
          (k) => DATA_KEYS[k] === row.data_key
        );
        if (!name) continue;
        if (name === 'settings') {
          if (
            row.data_value &&
            typeof row.data_value === 'object' &&
            !Array.isArray(row.data_value)
          ) {
            values.settings = { ...DEFAULT_SETTINGS, ...row.data_value };
          }
        } else {
          if (!Array.isArray(row.data_value)) {
            throw new Error(
              `Saved ${name} has an unexpected format. No records were changed.`
            );
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (values as any)[name] = row.data_value;
        }
        nextVersions[name] = row.updated_at as string;
      }

      versionsRef.current = nextVersions;
      setUpgradeReady(hasUpgrade);
      setChoices(workspaceChoices);
      setOwnerId(choice.owner);
      ownerRef.current = choice.owner;
      setRole(choice.role);
      roleRef.current = choice.role;
      setData(values);
      dataRef.current = values;
      localStorage.setItem(`nmat_v3_workspace_${uidVal}`, choice.owner);
    },
    [lang]
  );

  const bootUser = useCallback(
    async (activeUser: User) => {
      setUser(activeUser);
      userRef.current = activeUser;
      setAuthStatus('loading');
      setLoginError('');
      try {
        await loadWorkspace(activeUser);
        setAuthStatus('ready');
      } catch (err) {
        setAuthStatus('login');
        setLoginError(
          err instanceof Error ? err.message : 'Could not load workspace.'
        );
      }
    },
    [loadWorkspace]
  );

  const clearSessionState = useCallback(() => {
    setUser(null);
    userRef.current = null;
    setOwnerId('');
    ownerRef.current = '';
    setRole('viewer');
    roleRef.current = 'viewer';
    setSelectedWorkerId(null);
    setPage('dashboard');
    versionsRef.current = {};
    setData(EMPTY_WORKSPACE_DATA);
    dataRef.current = EMPTY_WORKSPACE_DATA;
    setAuthStatus('login');
  }, []);

  // Auth Bootstrap
  useEffect(() => {
    let mounted = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          userRef.current = session.user;
        }
        return;
      }
      setTimeout(() => {
        if (!mounted) return;
        if (session?.user) {
          if (userRef.current?.id !== session.user.id) {
            bootUser(session.user);
          }
        } else {
          clearSessionState();
        }
      }, 0);
    });

    supabase.auth
      .getSession()
      .then(({ data: sessionData, error }) => {
        if (!mounted) return;
        if (error) {
          setLoginError(error.message);
          setAuthStatus('login');
          return;
        }
        if (sessionData.session?.user) {
          bootUser(sessionData.session.user);
        } else {
          setAuthStatus('login');
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setLoginError(err instanceof Error ? err.message : 'Auth check failed.');
        setAuthStatus('login');
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [bootUser, clearSessionState]);

  // Optimistic locking saveKey matching legacy app_data schema
  const saveKey = useCallback(
    async <K extends DataKeyName>(name: K, value: WorkspaceData[K]) => {
      guardWrite();
      const currentOwner = ownerRef.current;
      const oldVersion = versionsRef.current[name];
      const stamp = new Date(
        Math.max(Date.now(), oldVersion ? Date.parse(oldVersion) + 1 : 0)
      ).toISOString();

      let result;
      if (oldVersion) {
        result = await supabase
          .from('app_data')
          .update({ data_value: value, updated_at: stamp })
          .eq('user_id', currentOwner)
          .eq('data_key', DATA_KEYS[name])
          .eq('updated_at', oldVersion)
          .select('updated_at');
      } else {
        result = await supabase
          .from('app_data')
          .insert({
            user_id: currentOwner,
            data_key: DATA_KEYS[name],
            data_value: value,
            updated_at: stamp,
          })
          .select('updated_at');
      }

      if (result.error) {
        throw new Error(
          result.error.code === '23505'
            ? 'Another session created this record. Reload before saving again.'
            : result.error.message
        );
      }
      if (!result.data?.length) {
        throw new Error(
          'A newer version was saved by another session, or your access changed. Reload the page before editing again. Your changes were not saved.'
        );
      }
      if (ownerRef.current !== currentOwner) {
        throw new Error('Workspace changed during save. Please reload.');
      }

      const cloned = structuredClone(value);
      versionsRef.current[name] = result.data[0].updated_at as string;
      setData((prev) => {
        const next = { ...prev, [name]: cloned };
        dataRef.current = next;
        return next;
      });
    },
    [guardWrite]
  );

  const logActivity = useCallback(
    async (action: string, details: string) => {
      try {
        if (!['owner', 'editor'].includes(roleRef.current)) return;
        const logs = [
          { id: uid(), action, details, timestamp: new Date().toISOString() },
          ...dataRef.current.logs,
        ].slice(0, 1000);
        await saveKey('logs', logs);
      } catch {
        // Non-blocking activity log
      }
    },
    [saveKey]
  );

  // Load workspace members when visiting Settings as owner
  const loadMembers = useCallback(async () => {
    if (!upgradeReady || roleRef.current !== 'owner' || !ownerRef.current) return;
    setMembersLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from('workspace_members')
        .select('member_id,member_email,role')
        .eq('workspace_owner_id', ownerRef.current);
      if (error) throw error;
      setMembers((rows || []) as WorkspaceMember[]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to load members.', true);
    } finally {
      setMembersLoading(false);
    }
  }, [upgradeReady, notify]);

  useEffect(() => {
    if (page === 'settings' && authStatus === 'ready') {
      loadMembers();
    }
  }, [page, authStatus, loadMembers]);

  // Language switch subtle animation
  const handleChangeLang = (nextLang: Language) => {
    if (nextLang === lang) return;
    if (!reduced && workspaceBodyRef.current) {
      gsap.fromTo(
        workspaceBodyRef.current,
        { opacity: 0.72 },
        { opacity: 1, duration: 0.28, ease: 'power3.out' }
      );
    }
    setLang(nextLang);
  };

  const handleNavigate = (nextPage: PageRoute) => {
    if (nextPage !== 'company') setCompanyFilterInit('');
    setPage(nextPage);
    if (nextPage !== 'profile') setSelectedWorkerId(null);
  };

  const handleOpenProfile = (workerId: string) => {
    setSelectedWorkerId(workerId);
    setPage('profile');
  };

  const handleGlobalSearch = (q: string) => {
    setSearchQuery(q);
    const trimmedNorm = norm(q);
    const exact = data.employees.filter(
      (e) => !e.deletedAt && norm(e.iqamaNumber) === trimmedNorm
    );
    if (trimmedNorm && exact.length === 1) {
      handleOpenProfile(exact[0].id);
    } else {
      setPage('search');
    }
  };

  // Business Actions
  const handleSaveWorker = async (
    payload: WorkerFormSubmitPayload,
    editingId?: string
  ) => {
    guardWrite();
    const list = structuredClone(dataRef.current.employees);
    const old = editingId ? list.find((e) => e.id === editingId) : null;
    if (editingId && (!old || old.deletedAt)) {
      throw new Error('Restore the deleted worker before editing.');
    }

    const iq = norm(payload.iqamaNumber).replace(/\s/g, '');
    if (!iq) throw new Error('Iqama / ID is required.');
    if (
      list.some(
        (e) => e.id !== editingId && norm(e.iqamaNumber).replace(/\s/g, '') === iq
      )
    ) {
      throw new Error(
        'This Iqama / ID already exists. Check Deleted Workers in Settings and restore if needed.'
      );
    }
    if (dayDiff(payload.idExpiryDate) === null) {
      throw new Error('Choose a valid Iqama expiry date.');
    }

    const type: WorkerType =
      payload.workerType === 'domestic' ? 'domestic' : 'company';
    const company =
      type === 'company'
        ? dataRef.current.companies.find((c) => c.id === payload.companyId)
        : null;

    if (type === 'company' && !company) {
      throw new Error('Select a company. Add the company first if needed.');
    }
    if (type === 'domestic' && !payload.ownerName.trim()) {
      throw new Error('Enter the domestic worker’s owner / sponsor name.');
    }

    const e: Employee = {
      ...old,
      id: old?.id || uid(),
      employeeCode:
        old?.employeeCode || `W-${Date.now().toString().slice(-7)}`,
      workerType: type,
      ownerName:
        type === 'domestic'
          ? payload.ownerName.trim()
          : old?.ownerName || '',
      ownerPhone:
        type === 'domestic'
          ? payload.ownerPhone.trim()
          : old?.ownerPhone || '',
      fullName: payload.fullName.trim(),
      arabicName: payload.arabicName.trim(),
      iqamaNumber: iq,
      phone: payload.phone.trim(),
      idExpiryDate: payload.idExpiryDate,
      profession: payload.profession.trim(),
      nationality: payload.nationality.trim(),
      joiningDate: payload.joiningDate,
      monthlyFee: validMoney(payload.monthlyFee, 0, 1000000),
      employmentStatus: payload.employmentStatus,
      companyId: company?.id || '',
      companyName: company?.companyName || 'Domestic Worker',
      companyLicenseNumber: company?.companyLicenseNumber || '',
      unifiedNumber: company?.unifiedNumber || '',
      establishmentNumber: company?.establishmentNumber || '',
      archived: !!old?.archived,
      createdAt: old?.createdAt || new Date().toISOString(),
    };

    if (!e.fullName || !e.phone || !e.profession) {
      throw new Error('Name, phone and profession are required.');
    }

    if (old) list[list.findIndex((x) => x.id === editingId)] = e;
    else list.unshift(e);

    await saveKey('employees', list);
    notify(tr(lang, 'Worker saved successfully.', 'কর্মীর তথ্য সংরক্ষিত হয়েছে।', 'تم حفظ العامل بنجاح.'));
    logActivity('Save worker', e.id);
  };

  const handleSaveCompany = async (
    payload: CompanyFormPayload,
    editingId?: string
  ) => {
    guardWrite();
    const list = structuredClone(dataRef.current.companies);
    const old = editingId ? list.find((c) => c.id === editingId) : null;
    const c: Company = {
      ...old,
      ...payload,
      id: old?.id || uid(),
      companyName: payload.companyName.trim(),
    };
    if (!c.companyName) throw new Error('Company name is required.');
    if (old) list[list.findIndex((x) => x.id === editingId)] = c;
    else list.unshift(c);

    await saveKey('companies', list);
    notify(tr(lang, 'Company saved successfully.', 'কোম্পানি সংরক্ষিত হয়েছে।', 'تم حفظ الشركة بنجاح.'));
    logActivity('Save company', c.id);
  };

  const handleSaveVisa = async (payload: VisaFormPayload, workerId: string) => {
    guardWrite();
    const list = structuredClone(dataRef.current.employees);
    const e = list.find((x) => x.id === workerId);
    if (!e) throw new Error('Worker not found.');
    if (
      (payload.issueDate && dayDiff(payload.issueDate) === null) ||
      (payload.returnBy && dayDiff(payload.returnBy) === null)
    ) {
      throw new Error('Enter valid dates.');
    }
    if (
      payload.issueDate &&
      payload.returnBy &&
      payload.returnBy < payload.issueDate
    ) {
      throw new Error('Return date must follow issue date.');
    }
    if (
      ['Issued', 'Outside KSA'].includes(payload.status) &&
      !payload.returnBy
    ) {
      throw new Error('Enter the return-by date for an active visa.');
    }

    e.exitReentry = {
      ...e.exitReentry,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    await saveKey('employees', list);
    notify(tr(lang, 'Visa details saved.', 'ভিসার তথ্য সংরক্ষিত হয়েছে।', 'تم حفظ بيانات التأشيرة.'));
    logActivity('Save visa', workerId);
  };

  const handleSaveOpening = async (
    payload: OpeningBalancePayload,
    workerId: string,
    payMode: boolean
  ) => {
    guardWrite();
    const list = structuredClone(dataRef.current.employees);
    const e = list.find((x) => x.id === workerId);
    if (!e) throw new Error('Worker not found.');
    const o = { ...(e.openingBalance || {}) };
    const amount = validMoney(payload.amount, payMode ? 0.01 : 0);

    if (payMode) {
      const due = cents(o.amount) - cents(o.paid);
      if (cents(amount) > due) {
        throw new Error('Amount exceeds remaining old balance.');
      }
      o.paid = (cents(o.paid) + cents(amount)) / 100;
      o.payments = [
        ...(o.payments || []),
        {
          id: uid(),
          amount,
          date: todayRiyadh(),
          method: payload.method || 'Cash',
          reference: (payload.reference || '').trim(),
        },
      ];
    } else {
      if (cents(amount) < cents(o.paid)) {
        throw new Error(
          'Opening dues cannot be less than the amount already paid.'
        );
      }
      if (dayDiff(payload.date) === null) {
        throw new Error('Choose a valid balance date.');
      }
      o.amount = amount;
      o.date = payload.date;
      o.note = (payload.note || '').trim();
    }
    o.updatedAt = new Date().toISOString();
    e.openingBalance = o;

    await saveKey('employees', list);
    notify(tr(lang, 'Opening balance updated.', 'আগের বকেয়া আপডেট হয়েছে।', 'تم تحديث الرصيد الافتتاحي.'));
    logActivity(payMode ? 'Pay opening balance' : 'Set opening balance', workerId);
  };

  const handleRecordPayment = async (
    payload: PaymentFormPayload
  ): Promise<{ fullyPaid: boolean }> => {
    guardWrite();
    const e = dataRef.current.employees.find((x) => x.id === payload.employeeId);
    if (!e || e.deletedAt || e.archived) {
      throw new Error('Choose an available worker.');
    }
    if (
      !/^\d{4}-\d{2}$/.test(payload.period) ||
      Number(payload.period.slice(5)) < 1 ||
      Number(payload.period.slice(5)) > 12 ||
      Number(payload.period.slice(0, 4)) < 1900
    ) {
      throw new Error('Choose a valid period.');
    }

    const amount = validMoney(payload.paidAmount, 0.01, 1000000);
    const paidCents = cents(amount);
    const [year, month] = payload.period.split('-').map(Number);
    const acc = computeAccount(e, dataRef.current.payments);
    const g = acc.months.find((x) => x.key === payload.period);
    const expected = g
      ? g.expected
      : cents(workerFee(e, dataRef.current.settings.defaultFee));
    const due = g ? g.balance : expected;

    if (paidCents > due) {
      throw new Error('Payment exceeds the remaining balance for this month.');
    }

    const list = structuredClone(dataRef.current.payments);
    const entry = {
      amount,
      date: todayRiyadh(),
      method: payload.paymentMethod,
      reference: payload.referenceNumber.trim(),
    };

    let fullyPaid = false;

    if (g) {
      const target = list.find((p) => p.id === g.records[0].id);
      if (!target) throw new Error('Payment record not found.');
      if (!target.paymentEvents) {
        target.paymentEvents = cents(target.paidAmount)
          ? [
              {
                amount: Number(target.paidAmount),
                date: target.paymentDate,
                method: target.paymentMethod,
                reference: target.referenceNumber,
                legacy: true,
              },
            ]
          : [];
      }
      target.paymentEvents.push(entry);
      target.paidAmount = (cents(target.paidAmount) + paidCents) / 100;
      target.balance = Math.max(0, g.balance - paidCents) / 100;
      target.status = target.balance ? 'PARTIAL' : 'PAID';
      target.paymentDate = todayRiyadh();
      target.paymentMethod = payload.paymentMethod;
      target.referenceNumber = payload.referenceNumber.trim();
      target.workerType = target.workerType || workerKind(e);
      fullyPaid = target.balance === 0;
    } else {
      const rem = (expected - paidCents) / 100;
      fullyPaid = paidCents === expected;
      list.unshift({
        id: uid(),
        employeeId: e.id,
        employeeName: e.fullName,
        workerType: workerKind(e),
        companyId: e.companyId || '',
        companyName: e.companyName || '',
        month,
        year,
        expectedAmount: expected / 100,
        paidAmount: amount,
        balance: rem,
        status: fullyPaid ? 'PAID' : 'PARTIAL',
        paymentDate: todayRiyadh(),
        paymentMethod: payload.paymentMethod,
        referenceNumber: payload.referenceNumber.trim(),
        paymentEvents: [entry],
      });
    }

    await saveKey('payments', list);
    notify(tr(lang, 'Payment recorded successfully.', 'পেমেন্ট সফলভাবে জমা হয়েছে।', 'تم تسجيل الدفعة بنجاح.'));
    logActivity('Record payment', `${e.fullName} · ${payload.period}`);
    return { fullyPaid };
  };

  const handleGenerateDues = async (type?: WorkerType) => {
    try {
      guardWrite();
      const list = structuredClone(dataRef.current.payments);
      const [year, month] = monthNow().split('-').map(Number);
      let added = 0;

      for (const e of dataRef.current.employees) {
        if (
          e.deletedAt ||
          e.archived ||
          e.employmentStatus !== 'Active' ||
          (type && workerKind(e) !== type)
        ) {
          continue;
        }
        if (
          list.some(
            (p) =>
              p.employeeId === e.id &&
              Number(p.month) === month &&
              Number(p.year) === year
          )
        ) {
          continue;
        }
        const expected = workerFee(e, dataRef.current.settings.defaultFee);
        list.push({
          id: uid(),
          employeeId: e.id,
          employeeName: e.fullName,
          workerType: workerKind(e),
          companyId: e.companyId || '',
          companyName: e.companyName || '',
          month,
          year,
          expectedAmount: expected,
          paidAmount: 0,
          balance: expected,
          status: expected ? 'UNPAID' : 'PAID',
          paymentDate: '-',
          paymentMethod: '-',
          referenceNumber: '-',
          paymentEvents: [],
        });
        added++;
      }

      if (added) {
        await saveKey('payments', list);
        logActivity('Generate monthly dues', `${added} accounts`);
      }
      notify(
        `${added} monthly account${added === 1 ? '' : 's'} generated. No duplicate charges created.`
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to generate dues.', true);
    }
  };

  const handleArchiveWorker = (workerId: string) => {
    const e = data.employees.find((x) => x.id === workerId);
    if (!e) return;
    setConfirmState({
      title: e.archived
        ? tr(lang, 'Restore Worker', 'কর্মী ফিরিয়ে আনুন', 'استعادة العامل')
        : tr(lang, 'Archive Worker', 'কর্মী আর্কাইভ করুন', 'أرشفة العامل'),
      message: e.archived
        ? `Restore ${e.fullName} to active worker lists?`
        : `Archive ${e.fullName}? History and documents are retained; future monthly dues will not be generated.`,
      confirmLabel: e.archived ? 'Restore' : 'Archive',
      onConfirm: async () => {
        guardWrite();
        const list = structuredClone(dataRef.current.employees);
        const target = list.find((x) => x.id === workerId);
        if (!target) throw new Error('Worker not found.');
        target.archived = !target.archived;
        await saveKey('employees', list);
        notify(target.archived ? 'Worker archived.' : 'Worker restored.');
      },
    });
  };

  const handleDeleteWorker = (workerId: string) => {
    const e = data.employees.find((x) => x.id === workerId);
    if (!e || e.deletedAt) return;
    setConfirmState({
      title: tr(lang, 'Delete Worker', 'কর্মী ডিলেট', 'حذف العامل'),
      message: `Delete ${e.fullName} (${e.iqamaNumber})?\n\nThe worker will move to Settings & Access → Deleted Workers. Saved payments, opening balances, and documents will remain.`,
      confirmLabel: tr(lang, 'Delete', 'ডিলেট', 'حذف'),
      danger: true,
      onConfirm: async () => {
        guardWrite();
        const list = structuredClone(dataRef.current.employees);
        const target = list.find((x) => x.id === workerId);
        if (!target || target.deletedAt) throw new Error('Worker already deleted.');
        target.deletedAt = new Date().toISOString();
        await saveKey('employees', list);
        if (page === 'profile') {
          setPage(workerKind(target));
          setSelectedWorkerId(null);
        }
        notify('Worker deleted from active lists. History retained.');
      },
    });
  };

  const handleRestoreDeletedWorker = (workerId: string) => {
    const e = data.employees.find((x) => x.id === workerId);
    if (!e || !e.deletedAt) return;
    setConfirmState({
      title: tr(lang, 'Restore Deleted Worker', 'কর্মী রিস্টোর', 'استعادة العامل'),
      message: `Restore ${e.fullName}? Existing worker status and archived flag will be preserved.`,
      confirmLabel: 'Restore',
      onConfirm: async () => {
        guardWrite();
        const list = structuredClone(dataRef.current.employees);
        const target = list.find((x) => x.id === workerId);
        if (!target || !target.deletedAt) throw new Error('Deleted worker not found.');
        delete target.deletedAt;
        await saveKey('employees', list);
        notify('Worker restored.');
      },
    });
  };

  const handleUploadDocument = async (
    workerId: string,
    docType: DocumentType,
    file: File
  ) => {
    guardWrite();
    if (!upgradeReady) throw new Error('Run SETUP.sql to enable private documents.');
    const extensions: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    if (!file || !extensions[file.type] || file.size === 0 || file.size > 10485760) {
      throw new Error('Choose a PDF, JPG, PNG or WebP file up to 10 MB.');
    }

    const currentOwner = ownerRef.current;
    const docid = uid();
    const path = `${currentOwner}/${workerId}/${docid}.${extensions[file.type]}`;
    const { error } = await supabase.storage
      .from(SUPABASE_CONFIG.bucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;

    if (ownerRef.current !== currentOwner) {
      throw new Error('Workspace changed. Reload and try again.');
    }

    const list = structuredClone(dataRef.current.employees);
    const target = list.find((e) => e.id === workerId);
    if (!target) throw new Error('Worker no longer exists.');

    target.documents = [
      ...(target.documents || []),
      {
        id: docid,
        path,
        name: file.name,
        type: docType,
        mime: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        archived: false,
      },
    ];

    await saveKey('employees', list);
    notify('Document uploaded securely.');
  };

  const handleOpenDocument = async (workerId: string, docId: string) => {
    try {
      const e = data.employees.find((x) => x.id === workerId);
      const d = e?.documents?.find((x) => x.id === docId);
      if (!d) throw new Error('Document not found.');
      if (!d.path.startsWith(`${ownerRef.current}/`)) {
        throw new Error('This document belongs to a different workspace.');
      }
      const { data: signed, error } = await supabase.storage
        .from(SUPABASE_CONFIG.bucket)
        .createSignedUrl(d.path, 60);
      if (error) throw error;
      setDocViewerLink({ name: d.name, url: signed.signedUrl });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not open document.', true);
    }
  };

  const handleArchiveDocument = async (workerId: string, docId: string) => {
    try {
      guardWrite();
      const list = structuredClone(dataRef.current.employees);
      const d = list
        .find((e) => e.id === workerId)
        ?.documents?.find((x) => x.id === docId);
      if (!d) throw new Error('Document not found.');
      d.archived = !d.archived;
      await saveKey('employees', list);
      notify(
        d.archived
          ? 'Document archived. Original file retained.'
          : 'Document restored.'
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Action failed.', true);
    }
  };

  const handleSaveSettings = async (businessName: string, defaultFee: number) => {
    try {
      guardWrite();
      await saveKey('settings', {
        ...dataRef.current.settings,
        businessName: businessName.trim() || DEFAULT_SETTINGS.businessName,
        defaultFee: validMoney(defaultFee, 0, 1000000),
      });
      notify(tr(lang, 'Settings saved.', 'সেটিংস সেভ হয়েছে।', 'تم حفظ الإعدادات.'));
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save settings.', true);
    }
  };

  const handleBackupJSON = () => {
    downloadFile(
      `Nmat_Backup_${todayRiyadh()}.json`,
      JSON.stringify(
        {
          ...dataRef.current,
          exportedAt: new Date().toISOString(),
          formatVersion: 3,
        },
        null,
        2
      ),
      'application/json'
    );
    notify(tr(lang, 'Backup downloaded.', 'ব্যাকআপ ডাউনলোড হয়েছে।', 'تم تنزيل النسخة الاحتياطية.'));
  };

  const handleRestoreBackup = async (file: File) => {
    if (file.size > 30 * 1024 * 1024) {
      notify('Backup must be under 30 MB.', true);
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      const keys: Array<'employees' | 'companies' | 'payments' | 'settings'> = [
        'employees',
        'companies',
        'payments',
        'settings',
      ];
      for (const k of keys) {
        if (!(k in parsed)) throw new Error(`Backup is missing ${k}.`);
      }
      for (const k of ['employees', 'companies', 'payments'] as const) {
        if (
          !Array.isArray(parsed[k]) ||
          parsed[k].some(
            (r: unknown) =>
              !r || typeof r !== 'object' || typeof (r as { id?: unknown }).id !== 'string'
          )
        ) {
          throw new Error(`Invalid ${k} records.`);
        }
        if (
          new Set(parsed[k].map((r: { id: string }) => r.id)).size !== parsed[k].length
        ) {
          throw new Error(`Duplicate IDs in ${k}.`);
        }
      }
      if (
        !parsed.settings ||
        typeof parsed.settings !== 'object' ||
        Array.isArray(parsed.settings)
      ) {
        throw new Error('Invalid settings.');
      }

      setConfirmState({
        title: 'Restore Backup',
        message:
          'Restore this backup? It replaces the current workspace lists. A backup of current records will download first.',
        confirmLabel: 'Restore Now',
        danger: true,
        onConfirm: async () => {
          guardWrite();
          handleBackupJSON();
          const completed: string[] = [];
          try {
            for (const key of keys) {
              await saveKey(key, parsed[key]);
              completed.push(key);
            }
            if (Array.isArray(parsed.logs)) {
              await saveKey('logs', parsed.logs);
            }
            notify('Backup restored. Check document links belong to this workspace.');
          } catch (err) {
            throw new Error(
              `Restore stopped after ${completed.join(', ') || 'no lists'}. ${
                err instanceof Error ? err.message : ''
              }`
            );
          }
        },
      });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Invalid backup file.', true);
    }
  };

  const handleGrantMember = async (
    email: string,
    nextRole: 'viewer' | 'editor'
  ) => {
    setConfirmState({
      title: 'Grant Workspace Access',
      message: `Grant ${nextRole} access to ${email}? This user can read worker information, payments, and private documents.${
        nextRole === 'editor' ? ' They can also modify records.' : ''
      }`,
      confirmLabel: 'Save Access',
      onConfirm: async () => {
        guardWrite();
        if (roleRef.current !== 'owner' || !upgradeReady) {
          throw new Error('Only the workspace owner can manage users.');
        }
        const { error } = await supabase.rpc('set_workspace_member', {
          member_email_input: email,
          member_role: nextRole,
        });
        if (error) throw error;
        await loadMembers();
        notify('Workspace access updated.');
      },
    });
  };

  const handleRevokeMember = (memberId: string) => {
    setConfirmState({
      title: 'Revoke Access',
      message: 'Revoke this user’s access to your workspace?',
      confirmLabel: 'Revoke',
      danger: true,
      onConfirm: async () => {
        guardWrite();
        if (roleRef.current !== 'owner') {
          throw new Error('Only the owner can revoke access.');
        }
        const { error } = await supabase.rpc('remove_workspace_member', {
          member_uuid: memberId,
        });
        if (error) throw error;
        await loadMembers();
        notify('Workspace access revoked.');
      },
    });
  };

  const handleSwitchWorkspace = async (nextOwnerId: string) => {
    if (!userRef.current) return;
    setAuthStatus('loading');
    try {
      await loadWorkspace(userRef.current, nextOwnerId);
      setPage('dashboard');
      setSelectedWorkerId(null);
      setSearchQuery('');
      setAuthStatus('ready');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Switch failed.');
      setAuthStatus('login');
    }
  };

  const handleSignOut = () => {
    setConfirmState({
      title: tr(lang, 'Sign Out', 'সাইন আউট', 'تسجيل الخروج'),
      message: tr(
        lang,
        'Sign out of your workspace?',
        'আপনার ওয়ার্কস্পেস থেকে সাইন আউট করবেন?',
        'هل تريد تسجيل الخروج من مساحة العمل؟'
      ),
      confirmLabel: tr(lang, 'Sign Out', 'সাইন আউট', 'خروج'),
      danger: true,
      onConfirm: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        clearSessionState();
      },
    });
  };

  const triggerPrintStatement = (workerId: string) => {
    setPrintPayload({ type: 'statement', employeeId: workerId });
    setTimeout(() => window.print(), 80);
  };

  const triggerPrintReceipt = (paymentId: string) => {
    setPrintPayload({ type: 'receipt', paymentId });
    setTimeout(() => window.print(), 80);
  };

  const reminders = useMemo(
    () => computeReminders(data.employees),
    [data.employees]
  );

  const selectedWorker = useMemo(
    () => data.employees.find((e) => e.id === selectedWorkerId) || null,
    [data.employees, selectedWorkerId]
  );

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6">
        <div className="soft-card p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-full border-3 border-[#4388FF] border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {tr(
              lang,
              'Loading Nmat Al Nahdat workspace…',
              'Nmat Al Nahdat ওয়ার্কস্পেস লোড হচ্ছে…',
              'جاري تحميل مساحة عمل نمط النهضة…'
            )}
          </p>
        </div>
      </div>
    );
  }

  if (authStatus === 'login') {
    return (
      <LoginView
        lang={lang}
        onChangeLang={handleChangeLang}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        initialError={loginError}
        onSignIn={async (email, password) => {
          const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          if (authData.user) await bootUser(authData.user);
        }}
      />
    );
  }

  const businessName = data.settings.businessName || DEFAULT_SETTINGS.businessName;

  return (
    <>
      <div className="no-print min-h-screen w-full p-2.5 sm:p-4 lg:p-6 flex justify-center">
        {/* Large Rounded Centered Workspace Shell */}
        <div className="app-shell-container w-full max-w-[1460px] rounded-[24px] sm:rounded-[30px] p-3.5 sm:p-5 lg:p-6 flex gap-4 lg:gap-6 min-h-[calc(100vh-3rem)]">
          {/* Left Floating Sidebar Rail */}
          <Sidebar
            currentPage={page}
            onNavigate={handleNavigate}
            lang={lang}
            reminderCount={reminders.length}
            mobileOpen={mobileNavOpen}
            onCloseMobile={() => setMobileNavOpen(false)}
            businessName={businessName}
          />

          {/* Right Main Workspace */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            <TopNav
              currentPage={page}
              onNavigate={handleNavigate}
              onOpenMobileNav={() => setMobileNavOpen(true)}
              searchQuery={searchQuery}
              onGlobalSearch={handleGlobalSearch}
              onAddWorker={() =>
                setWorkerModal({
                  open: true,
                  worker: null,
                  defaultType: page === 'domestic' ? 'domestic' : 'company',
                })
              }
              canWrite={canWrite}
              lang={lang}
              onChangeLang={handleChangeLang}
              theme={theme}
              onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              reminders={reminders}
              onOpenWorkerProfile={handleOpenProfile}
              userEmail={user?.email || ''}
              role={role}
              choices={choices}
              currentOwner={ownerId}
              onSwitchWorkspace={handleSwitchWorkspace}
              onSignOut={handleSignOut}
              businessName={businessName}
            />

            <main ref={workspaceBodyRef} className="flex-1 min-w-0 pb-4">
              {page === 'dashboard' && (
                <DashboardView
                  data={data}
                  lang={lang}
                  canWrite={canWrite}
                  onNavigate={handleNavigate}
                  onOpenProfile={handleOpenProfile}
                  onAddWorker={(kind = 'company') =>
                    setWorkerModal({ open: true, worker: null, defaultType: kind })
                  }
                  onEditWorker={(id) => {
                    const w = data.employees.find((e) => e.id === id) || null;
                    if (w)
                      setWorkerModal({
                        open: true,
                        worker: w,
                        defaultType: workerKind(w),
                      });
                  }}
                  onEditVisa={(id) => {
                    const w = data.employees.find((e) => e.id === id) || null;
                    if (w) setVisaModal(w);
                  }}
                  onRecordPayment={(workerId, period) =>
                    setPaymentModal({ open: true, workerId, period })
                  }
                  onGenerateDues={handleGenerateDues}
                  onExportBackup={handleBackupJSON}
                  onQuickSearch={handleGlobalSearch}
                />
              )}

              {page === 'search' && (
                <WorkerSearchView
                  employees={data.employees}
                  payments={data.payments}
                  query={searchQuery}
                  onChangeQuery={setSearchQuery}
                  onOpenProfile={handleOpenProfile}
                  lang={lang}
                />
              )}

              {page === 'reminders' && (
                <RemindersView
                  employees={data.employees}
                  lang={lang}
                  onOpenProfile={handleOpenProfile}
                  onOpenWhatsApp={(id) => {
                    const w = data.employees.find((e) => e.id === id) || null;
                    if (w) setWhatsAppWorker(w);
                  }}
                />
              )}

              {(page === 'company' || page === 'domestic') && (
                <WorkersDirectoryView
                  key={`${page}-${companyFilterInit}`}
                  type={page}
                  employees={data.employees}
                  defaultCompanyFee={data.settings.defaultFee}
                  initialCompanyFilter={page === 'company' ? companyFilterInit : ''}
                  lang={lang}
                  canWrite={canWrite}
                  onAddWorker={(t) =>
                    setWorkerModal({ open: true, worker: null, defaultType: t })
                  }
                  onEditWorker={(id) => {
                    const w = data.employees.find((e) => e.id === id) || null;
                    if (w)
                      setWorkerModal({
                        open: true,
                        worker: w,
                        defaultType: workerKind(w),
                      });
                  }}
                  onEditVisa={(id) => {
                    const w = data.employees.find((e) => e.id === id) || null;
                    if (w) setVisaModal(w);
                  }}
                  onOpenProfile={handleOpenProfile}
                  onArchiveWorker={handleArchiveWorker}
                  onDeleteWorker={handleDeleteWorker}
                />
              )}

              {page === 'companies' && (
                <CompaniesView
                  companies={data.companies}
                  employees={data.employees}
                  lang={lang}
                  canWrite={canWrite}
                  onAddCompany={() =>
                    setCompanyModal({ open: true, company: null })
                  }
                  onEditCompany={(id) => {
                    const c = data.companies.find((x) => x.id === id) || null;
                    if (c) setCompanyModal({ open: true, company: c });
                  }}
                  onViewCompanyWorkers={(cName) => {
                    setCompanyFilterInit(cName);
                    setPage('company');
                  }}
                />
              )}

              {page === 'visas' && (
                <VisasView
                  employees={data.employees}
                  lang={lang}
                  canWrite={canWrite}
                  onOpenProfile={handleOpenProfile}
                  onEditVisa={(id) => {
                    const w = data.employees.find((e) => e.id === id) || null;
                    if (w) setVisaModal(w);
                  }}
                />
              )}

              {(page === 'company-payments' || page === 'domestic-payments') && (
                <PaymentsView
                  type={page === 'domestic-payments' ? 'domestic' : 'company'}
                  employees={data.employees}
                  payments={data.payments}
                  lang={lang}
                  canWrite={canWrite}
                  onGenerateDues={(t) => handleGenerateDues(t)}
                  onRecordPayment={(workerId, period, filterType) =>
                    setPaymentModal({ open: true, workerId, period, filterType })
                  }
                  onOpenProfile={handleOpenProfile}
                  onPrintReceipt={triggerPrintReceipt}
                />
              )}

              {page === 'history' && (
                <PaymentHistoryView
                  employees={data.employees}
                  payments={data.payments}
                  lang={lang}
                  onPrintReceipt={triggerPrintReceipt}
                  onOpenProfile={handleOpenProfile}
                  onNotify={notify}
                />
              )}

              {page === 'profile' && selectedWorker && (
                <WorkerProfileView
                  employee={selectedWorker}
                  payments={data.payments}
                  lang={lang}
                  canWrite={canWrite}
                  upgradeReady={upgradeReady}
                  onBack={() =>
                    handleNavigate(workerKind(selectedWorker))
                  }
                  onRecordPayment={(id) =>
                    setPaymentModal({ open: true, workerId: id })
                  }
                  onEditWorker={(id) => {
                    const w = data.employees.find((e) => e.id === id) || null;
                    if (w)
                      setWorkerModal({
                        open: true,
                        worker: w,
                        defaultType: workerKind(w),
                      });
                  }}
                  onEditVisa={(id) => {
                    const w = data.employees.find((e) => e.id === id) || null;
                    if (w) setVisaModal(w);
                  }}
                  onPrintStatement={triggerPrintStatement}
                  onPrintReceipt={triggerPrintReceipt}
                  onOpenWhatsApp={(id) => {
                    const w = data.employees.find((e) => e.id === id) || null;
                    if (w) setWhatsAppWorker(w);
                  }}
                  onArchiveWorker={handleArchiveWorker}
                  onDeleteWorker={handleDeleteWorker}
                  onEditOpening={(id, pay) => {
                    const w = data.employees.find((e) => e.id === id) || null;
                    if (w) setOpeningModal({ open: true, worker: w, payMode: pay });
                  }}
                  onUploadDocument={(id) => {
                    const w = data.employees.find((e) => e.id === id) || null;
                    if (w) setDocUploadWorker(w);
                  }}
                  onOpenDocument={handleOpenDocument}
                  onArchiveDocument={handleArchiveDocument}
                />
              )}

              {page === 'settings' && (
                <SettingsView
                  settings={data.settings}
                  employees={data.employees}
                  payments={data.payments}
                  lang={lang}
                  canWrite={canWrite}
                  role={role}
                  upgradeReady={upgradeReady}
                  choices={choices}
                  currentOwner={ownerId}
                  members={members}
                  membersLoading={membersLoading}
                  onSaveSettings={handleSaveSettings}
                  onSwitchWorkspace={handleSwitchWorkspace}
                  onGrantMember={handleGrantMember}
                  onRevokeMember={handleRevokeMember}
                  onBackupJSON={handleBackupJSON}
                  onRestoreBackup={handleRestoreBackup}
                  onRestoreDeletedWorker={handleRestoreDeletedWorker}
                  onPrintStatement={triggerPrintStatement}
                  onNotify={notify}
                />
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WorkerFormModal
        open={workerModal.open}
        editingWorker={workerModal.worker}
        defaultType={workerModal.defaultType}
        companies={data.companies}
        defaultCompanyFee={data.settings.defaultFee}
        lang={lang}
        onClose={() => setWorkerModal((p) => ({ ...p, open: false }))}
        onSave={handleSaveWorker}
      />

      <CompanyFormModal
        open={companyModal.open}
        editingCompany={companyModal.company}
        lang={lang}
        onClose={() => setCompanyModal((p) => ({ ...p, open: false }))}
        onSave={handleSaveCompany}
      />

      <VisaFormModal
        open={!!visaModal}
        worker={visaModal}
        lang={lang}
        onClose={() => setVisaModal(null)}
        onSave={handleSaveVisa}
      />

      <PaymentFormModal
        open={paymentModal.open}
        employees={data.employees}
        payments={data.payments}
        defaultCompanyFee={data.settings.defaultFee}
        initialWorkerId={paymentModal.workerId}
        initialPeriod={paymentModal.period}
        filterType={paymentModal.filterType}
        lang={lang}
        onClose={() => setPaymentModal({ open: false })}
        onSave={handleRecordPayment}
      />

      <OpeningBalanceModal
        open={openingModal.open}
        worker={openingModal.worker}
        payMode={openingModal.payMode}
        lang={lang}
        onClose={() => setOpeningModal((p) => ({ ...p, open: false }))}
        onSave={handleSaveOpening}
      />

      <DocumentUploadModal
        open={!!docUploadWorker}
        worker={docUploadWorker}
        lang={lang}
        onClose={() => setDocUploadWorker(null)}
        onUpload={handleUploadDocument}
      />

      <DocumentViewerModal
        docLink={docViewerLink}
        onClose={() => setDocViewerLink(null)}
      />

      <WhatsAppDraftModal
        open={!!whatsAppWorker}
        worker={whatsAppWorker}
        payments={data.payments}
        businessName={businessName}
        lang={lang}
        onClose={() => setWhatsAppWorker(null)}
        onNotify={notify}
      />

      {confirmState && (
        <ConfirmModal
          open={true}
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={tr(lang, 'Cancel', 'বাতিল', 'إلغاء')}
          danger={confirmState.danger}
          loading={confirmBusy}
          onClose={() => setConfirmState(null)}
          onConfirm={async () => {
            setConfirmBusy(true);
            try {
              await confirmState.onConfirm();
              setConfirmState(null);
            } catch (err) {
              notify(err instanceof Error ? err.message : 'Action failed.', true);
            } finally {
              setConfirmBusy(false);
            }
          }}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Print-only Statement / Receipt */}
      <PrintArea
        payload={printPayload}
        businessName={businessName}
        employees={data.employees}
        payments={data.payments}
      />
    </>
  );
}
