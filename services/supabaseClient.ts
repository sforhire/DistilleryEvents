
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils';

/**
 * Total Storage Isolation for Iframe Resilience
 * This prevents the 'SecurityError' / 'Failed to fetch' caused by 
 * browsers blocking storage access in embedded contexts.
 */
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

  return { 
    url: scrub(url), 
    key: scrub(key) 
  };
};

const { url: supabaseUrl, key: supabaseAnonKey } = fetchConfig();
const isValidUrl = supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.');

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && isValidUrl);
export const MISSING_VARS_ERROR = !isValidUrl 
  ? "⚠️ Connection Link Invalid: URL must be https://[ref].supabase.co"
  : "⚠️ Credentials Missing: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not detected.";

let clientInstance: any = null;

if (isSupabaseConfigured) {
  try {
    /**
     * IFRAME-SAFE INITIALIZATION:
     * 1. persistSession: false (No storage)
     * 2. storage: memoryStorage (Hard-coded no-op storage to prevent SecurityErrors)
     */
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { 
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: memoryStorage
      },
      global: {
        headers: {} // Keep it clean to avoid CORS preflight issues
      }
    });
    console.info("⚡ DistilleryEvents: Stateless Cloud Link Established.");
  } catch (e) {
    console.error("Supabase Initialization Failed:", e);
  }
}

export const configValues = {
  url: supabaseUrl,
  key: supabaseAnonKey
};

export const supabase = clientInstance || {
  auth: { 
    getSession: async () => ({ data: { session: null }, error: null }), 
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { session: null }, error: { message: MISSING_VARS_ERROR } }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null })
  },
  from: (table: string) => ({
    select: () => ({ 
      order: () => Promise.resolve({ data: [], error: { message: MISSING_VARS_ERROR } }),
      eq: () => ({ 
        order: () => Promise.resolve({ data: [], error: null }),
        select: () => Promise.resolve({ data: [], error: null })
      })
    }),
    upsert: () => Promise.resolve({ data: null, error: { message: MISSING_VARS_ERROR } }),
    insert: () => Promise.resolve({ data: null, error: { message: MISSING_VARS_ERROR } }),
    update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: MISSING_VARS_ERROR } }) }),
    delete: () => ({ eq: () => Promise.resolve({ data: [], error: null }) })
  })
} as any;
