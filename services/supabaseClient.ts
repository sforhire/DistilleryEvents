
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils';

/**
 * Robust Supabase Configuration
 * Aggressively scrubs variables to prevent 'Failed to fetch' errors in Vercel/Vite.
 */

const fetchConfig = () => {
  // 1. Try Vite-specific build-time variables
  let viteUrl: string | undefined;
  let viteKey: string | undefined;
  
  try {
    // @ts-ignore
    viteUrl = import.meta.env?.VITE_SUPABASE_URL;
    // @ts-ignore
    viteKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
  } catch (e) {}

  // 2. Fallback to global/process lookup
  let url = viteUrl || getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
  let key = viteKey || getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

  /**
   * SCRUBBING LOGIC
   * Removes quotes, spaces, and trailing slashes that break fetch requests.
   */
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

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http')
);

export const MISSING_VARS_ERROR = "⚠️ Supabase Credentials Error: Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel/Local environment settings.";

let clientInstance: any = null;

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
      global: { headers: { 'x-application-name': 'distillery-events' } }
    });
    console.info("⚡ DistilleryEvents: Cloud Link Initialized.");
  } catch (e) {
    console.error("Supabase Initialization Failed:", e);
  }
}

export const configValues = {
  url: supabaseUrl,
  key: supabaseAnonKey
};

// Robust mock client to prevent hard crashes in local mode
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
      order: () => Promise.resolve({ data: [], error: { message: `Disconnected: Table "${table}" not reachable.` } }),
      eq: () => ({ 
        order: () => Promise.resolve({ data: [], error: null }),
        select: () => Promise.resolve({ data: [], error: null })
      })
    }),
    upsert: () => ({ select: () => Promise.resolve({ data: null, error: { message: MISSING_VARS_ERROR } }) }),
    insert: () => Promise.resolve({ data: null, error: { message: MISSING_VARS_ERROR } }),
    delete: () => ({ eq: () => Promise.resolve({ data: [], error: null }) })
  })
} as any;
