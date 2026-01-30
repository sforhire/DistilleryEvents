
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils';

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Verify configuration values are actual strings and not literal "undefined" strings
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined' &&
  supabaseUrl.startsWith('http')
);

// Resilient client initialization
let clientInstance: any = null;

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!);
  } catch (e) {
    console.error("DistilleryEvents: Failed to initialize Supabase client", e);
    clientInstance = null;
  }
}

// Exported client with proxy fallbacks for Demo Mode
export const supabase = clientInstance || {
  auth: { 
    getSession: async () => ({ data: { session: null }, error: null }), 
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { session: null }, error: { message: "Sync Disabled: Running in Local Demo Mode." } })
  },
  from: () => ({
    select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    upsert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
    insert: () => Promise.resolve({ error: null }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) })
  })
} as any;

if (!clientInstance) {
  console.info("⚡ DistilleryEvents: Pipeline Sync inactive. Running in Local Demo Mode.");
}
