
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils';

/**
 * Robust Supabase Configuration
 * Optimized for Iframe/Embedded environments to avoid CORS preflight blocks.
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

// Validate URL format - common source of "Failed to fetch"
const isValidUrl = supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.');

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && isValidUrl);

export const MISSING_VARS_ERROR = !isValidUrl 
  ? "⚠️ Invalid URL Format: Supabase URL must start with 'https://' and end with '.supabase.co'"
  : "⚠️ Credentials Missing: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found.";

let clientInstance: any = null;

if (isSupabaseConfigured) {
  try {
    // NOTE: We do NOT send custom headers here, as they cause CORS preflight failures in embedded iframes.
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: true, autoRefreshToken: true }
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
