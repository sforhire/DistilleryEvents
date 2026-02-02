
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils';

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
    console.info("⚡ DistilleryEvents: Cloud Link Active.");
  } catch (e) {
    console.error("Supabase Init Error:", e);
  }
} else {
  console.warn("⚠️ DistilleryEvents: Supabase Keys missing. Inquiries will not be saved.");
}

export const supabase = clientInstance || {
  auth: { 
    getSession: async () => ({ data: { session: null }, error: null }), 
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { session: null }, error: { message: "Cloud sync keys missing. Check environment variables." } }),
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
