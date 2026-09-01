import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env';

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables not set. Falling back to static data.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
