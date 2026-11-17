import { createClient } from '@supabase/supabase-js';
import type { WorkspaceData, WorkspaceSettings } from '../types/ems';

export const SUPABASE_CONFIG = {
  url: 'https://nwwxnscugselsofebrwd.supabase.co',
  key: 'sb_publishable_A0YrcJSZHj0dqdc7Y3MHZA_noSSB5a6',
  bucket: 'worker-documents',
} as const;

export const DATA_KEYS = {
  employees: 'saudi_ems_employees',
  companies: 'saudi_ems_companies',
  payments: 'saudi_ems_payments',
  settings: 'saudi_ems_settings',
  logs: 'saudi_ems_logs',
} as const;

export type DataKeyName = keyof typeof DATA_KEYS;

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  businessName: 'Nmat Al Nahdat',
  defaultFee: 350,
  currency: 'SAR',
};

export const EMPTY_WORKSPACE_DATA: WorkspaceData = {
  employees: [],
  companies: [],
  payments: [],
  settings: { ...DEFAULT_SETTINGS },
  logs: [],
};

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
