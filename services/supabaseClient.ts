
import { createClient } from '@supabase/supabase-js';

// Robust environment variable retrieval for browser/node/bundler environments
const getEnv = (key: string): string | undefined => {
  try {
    // Check global process (Node/Vercel)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    // Check global window (some builders)
    if (typeof window !== 'undefined' && (window as any).env && (window as any).env[key]) {
      return (window as any).env[key];
    }
  } catch (e) {
    console.warn(`Environment variable ${key} could not be read safely.`);
  }
  return undefined;
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Strict check: strings must exist and not be literal "undefined" from misconfigured builds
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined'
);

// We export the client. If not configured, we provide a dummy proxy 
// to prevent "cannot read property of null" errors while in Demo Mode.
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : {
      auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
      from: () => ({
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
        upsert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        insert: () => Promise.resolve({ error: null }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) })
      })
    } as any;

if (!isSupabaseConfigured) {
  console.info("⚡ DistilleryEvents: Database keys not found. Running in Local Demo Mode.");
}
