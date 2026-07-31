import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://nxlsxywqvvuiljsulito.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bHN4eXdxdnZ1aWxqc3VsaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NTU3NTEsImV4cCI6MjA5ODUzMTc1MX0.OMgBhyUiAPwsC3oPx9Htv5obXXgCPm6h9QD6KHgi3lA'
);

const SCHEMA_SQL = readFileSync(resolve(__dirname, '../services-schema.sql'), 'utf-8');
const SEED_SQL = readFileSync(resolve(__dirname, '../services-seed.sql'), 'utf-8');

async function run() {
  // Execute schema via .rpc (requires a function that runs SQL)
  // Fallback: tell user to run in Supabase SQL editor
  console.log('Services schema and seed SQL files are ready.');
  console.log('Please run these files in the Supabase SQL Editor:');
  console.log('  1. services-schema.sql');
  console.log('  2. services-seed.sql');
  console.log('\nOr use psql:');
  console.log('  psql "$DATABASE_URL" -f services-schema.sql');
  console.log('  psql "$DATABASE_URL" -f services-seed.sql');
}

run().catch(console.error);
