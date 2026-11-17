import type {
  AccountSummary,
  DomesticMonthlyRow,
  Employee,
  Language,
  MonthlyAccountGroup,
  Payment,
  ReminderItem,
  TimelineEvent,
  WorkerType,
} from '../types/ems';
import { DEFAULT_SETTINGS } from './supabase';

export function cents(x: unknown): number {
  return Math.round((Number(x) || 0) * 100);
}

export function sar(x: unknown): string {
  return (Number(x) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function money(c: number): string {
  return sar(c / 100);
}

export function norm(x: unknown): string {
  return String(x ?? '')
    .trim()
    .toLowerCase()
    .replace(/[٠-٩]/g, (c) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)))
    .replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 15) | 64;
  b[8] = (b[8] & 63) | 128;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function todayRiyadh(): string {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return ['year', 'month', 'day'].map((k) => p.find((x) => x.type === k)?.value || '').join('-');
}

export function monthNow(): string {
  return todayRiyadh().slice(0, 7);
}

export function workerKind(e?: Partial<Employee> | null): WorkerType {
  return e?.workerType === 'domestic' ? 'domestic' : 'company';
}

export function workerFee(e: Partial<Employee> | null | undefined, defaultCompanyFee: number): number {
  if (
    e?.monthlyFee !== '' &&
    e?.monthlyFee != null &&
    Number.isFinite(Number(e.monthlyFee))
  ) {
    return Number(e.monthlyFee);
  }
  return workerKind(e) === 'domestic'
    ? 300
    : Number(defaultCompanyFee ?? DEFAULT_SETTINGS.defaultFee);
}

export function dayDiff(date?: string | null, base: string = todayRiyadh()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null;
  const [y, m, d] = (date as string).split('-').map(Number);
  const v = new Date(Date.UTC(y, m - 1, d));
  if (v.getUTCMonth() !== m - 1 || v.getUTCDate() !== d) return null;
  return Math.round((v.getTime() - Date.parse(`${base}T00:00:00Z`)) / 86400000);
}

export function validMoney(value: unknown, min = 0, max = 10000000): number {
  const n = Number(value);
  if (
    !Number.isFinite(n) ||
    n < min ||
    n > max ||
    Math.abs(n * 100 - Math.round(n * 100)) > 0.00001
  ) {
    throw new Error('Enter a valid amount with at most 2 decimal places.');
  }
  return Math.round(n * 100) / 100;
}

export function computeAccount(e: Employee, payments: Payment[]): AccountSummary {
  const groups = new Map<
    string,
    {
      key: string;
      month: number;
      year: number;
      expected: number;
      paid: number;
      records: Payment[];
    }
  >();

  const records = payments.filter((p) => p.employeeId === e.id);
  for (const p of records) {
    const key = `${p.year}-${String(p.month).padStart(2, '0')}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        month: Number(p.month),
        year: Number(p.year),
        expected: 0,
        paid: 0,
        records: [],
      });
    }
    const g = groups.get(key)!;
    g.expected = Math.max(g.expected, cents(p.expectedAmount));
    g.paid += cents(p.paidAmount);
    g.records.push(p);
  }

  const months: MonthlyAccountGroup[] = [...groups.values()]
    .sort((a, b) => b.key.localeCompare(a.key))
    .map((g) => ({
      ...g,
      balance: Math.max(0, g.expected - g.paid),
      credit: Math.max(0, g.paid - g.expected),
    }));

  const o = e.openingBalance || {};
  const oe = cents(o.amount);
  const op = cents(o.paid);

  return {
    months,
    records,
    opening: o,
    expected: oe + months.reduce((n, g) => n + g.expected, 0),
    paid: op + months.reduce((n, g) => n + g.paid, 0),
    balance: Math.max(0, oe - op) + months.reduce((n, g) => n + g.balance, 0),
    credit: Math.max(0, op - oe) + months.reduce((n, g) => n + g.credit, 0),
  };
}

export function computeReminders(employees: Employee[]): ReminderItem[] {
  const rows: ReminderItem[] = [];
  for (const e of employees) {
    if (
      e.deletedAt ||
      e.archived ||
      ['Inactive', 'Transferred', 'Final Exit'].includes(e.employmentStatus)
    ) {
      continue;
    }
    const add = (type: 'Iqama' | 'Visa return', date?: string) => {
      const days = dayDiff(date);
      if (days !== null && days <= 60) {
        rows.push({ e, type, date: date!, days });
      }
    };
    add('Iqama', e.idExpiryDate);
    if (['Issued', 'Outside KSA'].includes(e.exitReentry?.status || '')) {
      add('Visa return', e.exitReentry?.returnBy);
    }
  }
  return rows.sort((a, b) => a.days - b.days);
}

export function computePaymentGroups(
  employees: Employee[],
  payments: Payment[],
  type: WorkerType | null = null,
  period = ''
) {
  const result: Array<{ e: Employee } & MonthlyAccountGroup> = [];
  for (const e of employees) {
    if (type && workerKind(e) !== type) continue;
    for (const g of computeAccount(e, payments).months) {
      if (!period || g.key === period) {
        result.push({ e, ...g });
      }
    }
  }
  return result.sort(
    (a, b) =>
      b.key.localeCompare(a.key) ||
      String(a.e.fullName).localeCompare(String(b.e.fullName))
  );
}

export function computeDomesticMonthly(
  employees: Employee[],
  payments: Payment[],
  defaultCompanyFee: number,
  period: string = monthNow()
): DomesticMonthlyRow[] {
  const result: DomesticMonthlyRow[] = [];
  const current = monthNow();
  for (const e of employees) {
    if (workerKind(e) !== 'domestic') continue;
    const g = computeAccount(e, payments).months.find((m) => m.key === period);
    const currentActive =
      period === current &&
      !e.deletedAt &&
      !e.archived &&
      e.employmentStatus === 'Active';
    if (!g && !currentActive) continue;
    const expected = g ? g.expected : cents(workerFee(e, defaultCompanyFee));
    const paid = g ? g.paid : 0;
    const balance = Math.max(0, expected - paid);
    const status = !balance ? 'PAID' : paid ? 'PARTIAL' : 'UNPAID';
    result.push({ e, period, expected, paid, balance, status, recorded: !!g });
  }
  return result.sort((a, b) => String(a.e.fullName).localeCompare(String(b.e.fullName)));
}

export function computeTimelineEvents(employees: Employee[], lang: Language): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const base = todayRiyadh();

  for (const e of employees) {
    if (e.deletedAt) continue;

    if (e.idExpiryDate && dayDiff(e.idExpiryDate, base) !== null) {
      const diff = dayDiff(e.idExpiryDate, base)!;
      const tone =
        diff < 0 ? 'red' : diff <= 30 ? 'yellow' : diff <= 60 ? 'blue' : 'green';
      const label =
        lang === 'ar'
          ? 'انتهاء الإقامة'
          : lang === 'bn'
          ? 'ইকামা মেয়াদ'
          : 'Iqama Expiry';
      events.push({
        id: `${e.id}-iqama-${e.idExpiryDate}`,
        employee: e,
        date: e.idExpiryDate,
        kind: 'iqama',
        label,
        tone,
        detailText:
          diff < 0
            ? `${Math.abs(diff)}d overdue`
            : diff === 0
            ? 'Expires today'
            : `${diff}d remaining`,
      });
    }

    const v = e.exitReentry;
    if (v && v.status && v.status !== 'None') {
      if (v.issueDate && dayDiff(v.issueDate, base) !== null) {
        events.push({
          id: `${e.id}-visa-issue-${v.issueDate}`,
          employee: e,
          date: v.issueDate,
          kind: 'visa-issue',
          label:
            lang === 'ar'
              ? 'إصدار تأشيرة'
              : lang === 'bn'
              ? 'ভিসা ইস্যু'
              : 'Visa Issued',
          tone: 'purple',
          detailText: v.number ? `Visa #${v.number}` : v.status,
        });
      }

      if (v.returnBy && dayDiff(v.returnBy, base) !== null) {
        const diff = dayDiff(v.returnBy, base)!;
        const isActiveVisa = ['Issued', 'Outside KSA'].includes(v.status);
        const tone =
          v.status === 'Returned'
            ? 'green'
            : isActiveVisa && diff < 0
            ? 'red'
            : isActiveVisa && diff <= 14
            ? 'yellow'
            : 'blue';
        events.push({
          id: `${e.id}-visa-return-${v.returnBy}`,
          employee: e,
          date: v.returnBy,
          kind: 'visa-return',
          label:
            lang === 'ar'
              ? 'عودة التأشيرة'
              : lang === 'bn'
              ? 'ভিসা প্রত্যাবর্তন'
              : 'Visa Return',
          tone,
          detailText:
            v.status === 'Returned'
              ? 'Returned'
              : diff < 0
              ? `${Math.abs(diff)}d overdue`
              : `${diff}d left`,
        });
      }
    }

    if (e.joiningDate && dayDiff(e.joiningDate, base) !== null) {
      events.push({
        id: `${e.id}-joining-${e.joiningDate}`,
        employee: e,
        date: e.joiningDate,
        kind: 'joining',
        label:
          lang === 'ar'
            ? 'تاريخ الانضمام'
            : lang === 'bn'
            ? 'যোগদানের তারিখ'
            : 'Joined',
        tone: 'green',
        detailText: e.profession || 'Worker Joined',
      });
    }
  }

  return events;
}

export function phoneNumber(raw?: string): string {
  let s = norm(raw).replace(/[\s()+-]/g, '');
  if (s.startsWith('00')) s = s.slice(2);
  if (/^05\d{8}$/.test(s)) s = '966' + s.slice(1);
  return /^[1-9]\d{7,14}$/.test(s) ? s : '';
}

export function makeWhatsAppDraft(
  e: Employee,
  payments: Payment[],
  topic: 'balance' | 'iqama' | 'visa',
  lang: Language,
  businessName: string
): string {
  const a = computeAccount(e, payments);
  const brand = businessName || DEFAULT_SETTINGS.businessName;
  const n = e.fullName || '';
  const iq = e.iqamaNumber || '';

  if (topic === 'balance') {
    if (lang === 'bn') {
      return `আসসালামু আলাইকুম ${n}, আপনার ইকামা ${iq}। আমাদের সংরক্ষিত হিসাবে মোট পাওনা ${money(
        a.expected
      )} SAR, জমা ${money(a.paid)} SAR এবং বাকি ${money(
        a.balance
      )} SAR। অনুগ্রহ করে হিসাব মিলিয়ে যোগাযোগ করুন। ধন্যবাদ।\n${brand}`;
    }
    if (lang === 'ar') {
      return `السلام عليكم ${n}، رقم الإقامة ${iq}. حسب سجلاتنا: إجمالي المستحقات ${money(
        a.expected
      )} ريال، المدفوع ${money(a.paid)} ريال، والمتبقي ${money(
        a.balance
      )} ريال. يرجى مراجعة الحساب والتواصل معنا. شكراً.\n${brand}`;
    }
    return `Hello ${n}, Iqama ${iq}. Our recorded account shows dues of ${money(
      a.expected
    )} SAR, payments of ${money(a.paid)} SAR and an outstanding balance of ${money(
      a.balance
    )} SAR. Please review and contact us. Thank you.\n${brand}`;
  }

  const date = topic === 'visa' ? e.exitReentry?.returnBy : e.idExpiryDate;
  if (!date) {
    if (lang === 'bn') return 'এই তারিখটি কর্মীর প্রোফাইলে দেওয়া নেই।';
    if (lang === 'ar') return 'هذا التاريخ غير مسجل في ملف العامل.';
    return 'This date is not recorded in the worker profile.';
  }

  if (lang === 'bn') {
    return `আসসালামু আলাইকুম ${n}, ইকামা ${iq}। ${
      topic === 'visa'
        ? 'আপনার এক্সিট রি-এন্ট্রি ভিসার ফেরার শেষ তারিখ'
        : 'আপনার ইকামার মেয়াদ শেষের তারিখ'
    } ${date}। অনুগ্রহ করে সময়মতো প্রয়োজনীয় ব্যবস্থা নিন।\n${brand}`;
  }
  if (lang === 'ar') {
    return `السلام عليكم ${n}، رقم الإقامة ${iq}. ${
      topic === 'visa' ? 'آخر موعد مسجل للعودة' : 'تاريخ انتهاء الإقامة'
    }: ${date}. يرجى اتخاذ الإجراءات اللازمة في الوقت المناسب.\n${brand}`;
  }
  return `Hello ${n}, Iqama ${iq}. Your recorded ${
    topic === 'visa' ? 'visa return deadline' : 'Iqama expiry date'
  } is ${date}. Please arrange the necessary action in time.\n${brand}`;
}

export function downloadFile(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCSV(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return false;
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cell = (v: unknown) => {
    let x = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '');
    if (/^[=+@\-]/.test(x)) x = "'" + x;
    return '"' + x.replace(/"/g, '""') + '"';
  };
  const csv =
    '\ufeff' +
    [
      cols.map(cell).join(','),
      ...rows.map((r) => cols.map((k) => cell(r[k])).join(',')),
    ].join('\r\n');
  downloadFile(`${name}_${todayRiyadh()}.csv`, csv, 'text/csv;charset=utf-8');
  return true;
}
