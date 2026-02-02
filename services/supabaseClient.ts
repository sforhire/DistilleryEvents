
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils';

// Step 2: Use Vite env vars strictly
// We check for VITE_ prefixed versions first as per Vercel/Vite standards
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Step 3: Diagnostic logging on startup
console.log("--- SUPABASE CONFIG DIAGNOSTIC ---");
console.log(`VITE_SUPABASE_URL present: ${!!supabaseUrl} ${supabaseUrl ? `(${supabaseUrl.substring(0, 20)}...)` : '(MISSING)'}`);
console.log(`VITE_SUPABASE_ANON_KEY present: ${!!supabaseAnonKey} ${supabaseAnonKey ? `(${supabaseAnonKey.substring(0, 6)}...)` : '(MISSING)'}`);
console.log("----------------------------------");

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http')
);

// Step 4: Loud failure message
const MISSING_VARS_ERROR = "Missing Vercel env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Add them in Vercel Project Settings → Environment Variables for Production, then redeploy.";

let clientInstance: any = null;

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!);
    console.info("⚡ DistilleryEvents: Cloud Link Active.");
  } catch (e) {
    console.error("Supabase Init Error:", e);
  }
} else {
  console.error(`⚠️ DistilleryEvents: ${MISSING_VARS_ERROR}`);
}

// Export raw values for the Diagnostic UI
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
