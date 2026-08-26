import { createClient } from '@supabase/supabase-js';

// Runtime config is injected by the container as window.__ENV__ (from .env.production
// via the landing entrypoint). Fall back to build-time import.meta.env for local dev.
const runtimeEnv = (typeof window !== 'undefined' && window.__ENV__) || {};
const supabaseUrl =
  runtimeEnv.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'http://localhost:54321';
const supabaseAnonKey =
  runtimeEnv.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'public-anon-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables not set. Falling back to static data.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
