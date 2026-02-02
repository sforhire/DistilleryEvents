import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils';

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Log status to browser console for easier debugging
console.log("Supabase Connectivity Check:", {
  urlDetected: !!supabaseUrl,
  keyDetected: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length || 0
});

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http')
);

let clientInstance: any = null;

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!);
    console.info("⚡ DistilleryEvents: Cloud Link Active.");
  } catch (e) {
    console.error("Supabase Init Error:", e);
  }
} else {
  console.warn("⚠️ DistilleryEvents: Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY.");
}

export const supabase = clientInstance || {
  auth: { 
    getSession: async () => ({ data: { session: null }, error: null }), 
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { session: null }, error: { message: "Environment keys missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set." } }),
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