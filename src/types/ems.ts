export type Language = 'en' | 'bn' | 'ar';
export type ThemeMode = 'light' | 'dark';
export type WorkerType = 'company' | 'domestic';
export type EmploymentStatus =
  | 'Active'
  | 'Transfer Pending'
  | 'Transferred'
  | 'Final Exit'
  | 'Inactive';

export type VisaStatus = 'None' | 'Issued' | 'Outside KSA' | 'Returned' | 'Cancelled';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Card';
export type DocumentType = 'Iqama' | 'Passport' | 'Visa' | 'Other';
export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export type PageRoute =
  | 'dashboard'
  | 'search'
  | 'reminders'
  | 'company'
  | 'domestic'
  | 'companies'
  | 'visas'
  | 'company-payments'
  | 'domestic-payments'
  | 'history'
  | 'settings'
  | 'profile';

export interface ExitReentry {
  status?: VisaStatus;
  number?: string;
  issueDate?: string;
  returnBy?: string;
  note?: string;
  updatedAt?: string;
}

export interface OpeningPayment {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
}

export interface OpeningBalance {
  amount?: number;
  paid?: number;
  date?: string;
  note?: string;
  updatedAt?: string;
  payments?: OpeningPayment[];
}

export interface WorkerDocument {
  id: string;
  path: string;
  name: string;
  type: DocumentType | string;
  mime: string;
  size: number;
  uploadedAt: string;
  archived?: boolean;
}

export interface Employee {
  id: string;
  employeeCode: string;
  workerType: WorkerType;
  fullName: string;
  arabicName?: string;
  iqamaNumber: string;
  phone: string;
  idExpiryDate: string;
  profession: string;
  nationality?: string;
  joiningDate?: string;
  monthlyFee: number | string;
  employmentStatus: EmploymentStatus;
  companyId?: string;
  companyName?: string;
  companyLicenseNumber?: string;
  unifiedNumber?: string;
  establishmentNumber?: string;
  qiwaStatus?: string;
  ownerName?: string;
  ownerPhone?: string;
  archived?: boolean;
  deletedAt?: string;
  createdAt?: string;
  exitReentry?: ExitReentry;
  openingBalance?: OpeningBalance;
  documents?: WorkerDocument[];
}

export interface Company {
  id: string;
  companyName: string;
  arabicCompanyName?: string;
  companyLicenseNumber?: string;
  unifiedNumber?: string;
  establishmentNumber?: string;
  contactPerson?: string;
  phone?: string;
}

export interface PaymentEvent {
  amount: number;
  date: string;
  method: string;
  reference: string;
  legacy?: boolean;
}

export interface Payment {
  id: string;
  employeeId: string;
  employeeName: string;
  workerType?: WorkerType;
  companyId?: string;
  companyName?: string;
  month: number;
  year: number;
  expectedAmount: number;
  paidAmount: number;
  balance: number;
  status: PaymentStatus;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  paymentEvents?: PaymentEvent[];
}

export interface WorkspaceSettings {
  businessName: string;
  defaultFee: number;
  currency: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface WorkspaceData {
  employees: Employee[];
  companies: Company[];
  payments: Payment[];
  settings: WorkspaceSettings;
  logs: ActivityLog[];
}

export interface WorkspaceChoice {
  owner: string;
  role: WorkspaceRole;
  title: string;
}

export interface WorkspaceMember {
  member_id: string;
  member_email: string;
  role: WorkspaceRole;
}

export interface MonthlyAccountGroup {
  key: string;
  month: number;
  year: number;
  expected: number; // in cents
  paid: number; // in cents
  balance: number; // in cents
  credit: number; // in cents
  records: Payment[];
}

export interface AccountSummary {
  months: MonthlyAccountGroup[];
  records: Payment[];
  opening: OpeningBalance;
  expected: number; // cents
  paid: number; // cents
  balance: number; // cents
  credit: number; // cents
}

export interface ReminderItem {
  e: Employee;
  type: 'Iqama' | 'Visa return';
  date: string;
  days: number;
}

export interface DomesticMonthlyRow {
  e: Employee;
  period: string;
  expected: number; // cents
  paid: number; // cents
  balance: number; // cents
  status: PaymentStatus;
  recorded: boolean;
}

export interface TimelineEvent {
  id: string;
  employee: Employee;
  date: string;
  kind: 'iqama' | 'visa-return' | 'visa-issue' | 'joining';
  label: string;
  tone: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
  detailText: string;
}

export type PrintPayload =
  | { type: 'statement'; employeeId: string }
  | { type: 'receipt'; paymentId: string }
  | null;
