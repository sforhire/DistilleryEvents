import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils';

/**
 * Robust Supabase Configuration
 * Checks multiple possible locations for environment variables to ensure compatibility
 * across Vercel, Vite, and other ESM-based browser environments.
 */

const fetchConfig = () => {
  // 1. Check for Vite-specific build-time variables
  let viteUrl: string | undefined;
  let viteKey: string | undefined;
  
  try {
    // @ts-ignore - Only available in Vite builds
    viteUrl = import.meta.env?.VITE_SUPABASE_URL;
    // @ts-ignore - Only available in Vite builds
    viteKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
  } catch (e) {}

  // 2. Fallback to our robust utility which checks process.env and globals
  const url = viteUrl || getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
  const key = viteKey || getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

  return { url, key };
};

const { url: supabaseUrl, key: supabaseAnonKey } = fetchConfig();

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http')
);

export const MISSING_VARS_ERROR = "⚠️ Supabase Credentials Missing: Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.";

let clientInstance: any = null;

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!);
    console.info("⚡ DistilleryEvents: Cloud Link Active.");
  } catch (e) {
    console.error("Supabase Initialization Failed:", e);
  }
} else {
  // We log this as a warning so the UI can still render with the ErrorBoundary if needed
  console.warn(MISSING_VARS_ERROR);
}

export const configValues = {
  url: supabaseUrl,
  key: supabaseAnonKey
};

// Fallback "Mock" client to prevent hard crashes when variables are missing
export const supabase = clientInstance || {
  auth: { 
    getSession: async () => ({ data: { session: null }, error: null }), 
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { session: null }, error: { message: MISSING_VARS_ERROR } }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null })
  },
  from: () => ({
    select: () => ({ 
      order: () => Promise.resolve({ data: [], error: null }),
      eq: () => ({ 
        order: () => Promise.resolve({ data: [], error: null }),
        select: () => Promise.resolve({ data: [], error: null })
      })
    }),
    upsert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
    insert: () => Promise.resolve({ error: null }),
    delete: () => ({ eq: () => Promise.resolve({ data: [], error: null }) })
  })
} as any;
