import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils';

// Prioritize platform injected env vars or window.process mocks
const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseUrl !== '' &&
  supabaseUrl.startsWith('http')
);

let clientInstance: any = null;

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!);
  } catch (e) {
    console.error("Supabase Init Error:", e);
  }
}

// Resilient proxy ensures UI doesn't crash if keys are missing
export const supabase = clientInstance || {
  auth: { 
    getSession: async () => ({ data: { session: null }, error: null }), 
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { session: null }, error: { message: "Supabase not configured. Check Vercel environment variables." } }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null })
  },
  from: () => ({
    select: () => ({ 
      order: () => Promise.resolve({ data: [], error: null }),
      eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) })
    }),
    upsert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
    insert: () => Promise.resolve({ error: null }),
    delete: () => ({ eq: () => Promise.resolve({ data: [], error: null }) })
  })
} as any;

if (!clientInstance) {
  console.info("⚡ DistilleryEvents: Cloud sync disabled (keys missing). App in local demo mode.");
}