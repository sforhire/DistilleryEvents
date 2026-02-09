
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils';

/**
 * TOTAL COMPATIBILITY MODE
 * Specifically designed for restricted Iframe environments.
 */

// A virtual storage that exists only in RAM to avoid SecurityErrors
const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const fetchConfig = () => {
  let viteUrl: string | undefined;
  let viteKey: string | undefined;
  
  try {
    // @ts-ignore
    viteUrl = import.meta.env?.VITE_SUPABASE_URL;
    // @ts-ignore
    viteKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
  } catch (e) {}

  let url = viteUrl || getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
  let key = viteKey || getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

  const scrub = (val: any): string | undefined => {
    if (typeof val !== 'string') return undefined;
    const cleaned = val.trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');
    return cleaned === '' || cleaned === 'undefined' ? undefined : cleaned;
  };

  return { url: scrub(url), key: scrub(key) };
};

const { url: supabaseUrl, key: supabaseAnonKey } = fetchConfig();
const isValidUrl = supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.');

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && isValidUrl);
export const MISSING_VARS_ERROR = "⚠️ Connection Offline: Verify Supabase URL/Key in Vercel settings.";

let clientInstance: any = null;

if (isSupabaseConfigured) {
  try {
    // We use the most basic initialization possible to avoid CORS preflight "complex" requests.
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        storage: memoryStorage,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  } catch (e) {
    console.error("Supabase Init Error:", e);
  }
}

export const configValues = { url: supabaseUrl, key: supabaseAnonKey };

export const supabase = clientInstance || {
  auth: { 
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ error: { message: "System Unconfigured" } })
  },
  from: (table: string) => ({
    select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    insert: () => Promise.resolve({ error: { message: "System Unconfigured" } }),
    update: () => ({ eq: () => Promise.resolve({ error: { message: "System Unconfigured" } }) }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) })
  })
} as any;
