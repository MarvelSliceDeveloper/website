/**
 * Chat tables setup script.
 * Run: node scripts/setup-chat.js
 *
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 * or in the environment.
 *
 * If this script fails, run supabase/migrations/chat_tables.sql
 * manually in your Supabase Dashboard SQL Editor.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  try {
    const env = readFileSync(envPath, 'utf-8');
    for (const line of env.split('\n')) {
      const [k, ...v] = line.split('=');
      if (k.trim() === 'VITE_SUPABASE_URL') supabaseUrl = v.join('=').trim();
      if (k.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = v.join('=').trim();
    }
  } catch {}
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  console.error('Set them in .env or export them in your environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function tableExists(name) {
  const { error } = await supabase.from(name).select('id').limit(1);
  return !error;
}

async function main() {
  console.log('Checking chat tables...');

  const convExists = await tableExists('conversations');
  const msgExists = await tableExists('messages');

  if (convExists && msgExists) {
    console.log('✓ conversations and messages tables already exist.');
    return;
  }

  console.log('× Tables not found.');
  console.log('');
  console.log('Please run the following SQL in your Supabase Dashboard SQL Editor:');
  console.log('');
  console.log(readFileSync(resolve(__dirname, '..', 'supabase', 'migrations', 'chat_tables.sql'), 'utf-8'));
  console.log('');
  console.log('Then re-run this script to verify.');
}

main().catch(console.error);
