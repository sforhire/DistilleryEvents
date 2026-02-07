
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils';

/**
 * Robust Supabase Configuration
 * Cleans environment variables to prevent common 'Failed to fetch' errors.
 */

const fetchConfig = () => {
  // 1. Check for Vite-specific build-time variables
  let viteUrl: string | undefined;
  let viteKey: string | undefined;
  
  try {
    // @ts-ignore
    viteUrl = import.meta.env?.VITE_SUPABASE_URL;
    // @ts-ignore
    viteKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
  } catch (e) {}

  // 2. Fallback to utility (checks process.env, globals, window.env)
  let url = viteUrl || getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
  let key = viteKey || getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

  /**
   * AGGRESSIVE CLEANING
   * Removes hidden newlines, trailing spaces, quotes, and trailing slashes.
   */
  const clean = (val: any) => {
    if (typeof val !== 'string') return undefined;
    return val
      .trim()                           // Remove spaces/newlines
      .replace(/^["']|["']$/g, '')      // Remove surrounding quotes
      .replace(/\/$/, '');              // Remove trailing slash
  };

  url = clean(url);
  key = clean(key);

  return { url, key };
};

const { url: supabaseUrl, key: supabaseAnonKey } = fetchConfig();

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http')
);

export const MISSING_VARS_ERROR = "⚠️ Credentials Missing: Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Settings.";

let clientInstance: any = null;

if (isSupabaseConfigured) {
  try {
    // Initialize the real client
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: true },
      global: { headers: { 'x-application-name': 'distillery-events' } }
    });
    console.info("⚡ DistilleryEvents: Cloud Link Active.");
  } catch (e) {
    console.error("Supabase Initialization Failed:", e);
  }
}

export const configValues = {
  url: supabaseUrl,
  key: supabaseAnonKey
};

// Robust mock client for local-first fallback
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
      order: () => Promise.resolve({ data: [], error: { message: "System running in limited local mode." } }),
      eq: () => ({ 
        order: () => Promise.resolve({ data: [], error: null }),
        select: () => Promise.resolve({ data: [], error: null })
      })
    }),
    upsert: () => ({ select: () => Promise.resolve({ data: null, error: { message: "Cloud connection not established." } }) }),
    insert: () => Promise.resolve({ data: null, error: { message: "Cloud connection not established." } }),
    delete: () => ({ eq: () => Promise.resolve({ data: [], error: null }) })
  })
} as any;
