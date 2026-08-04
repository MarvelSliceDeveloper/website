const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://nxlsxywqvvuiljsulito.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bHN4eXdxdnZ1aWxqc3VsaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NTU3NTEsImV4cCI6MjA5ODUzMTc1MX0.OMgBhyUiAPwsC3oPx9Htv5obXXgCPm6h9QD6KHgi3lA';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const backupDir = path.join(__dirname, 'backup_courses_db');

async function restore() {
  const files = ['courses.json', 'course_tabs.json', 'course_tags.json'];
  for (const file of files) {
    const table = file.replace('.json', '');
    const raw = JSON.parse(fs.readFileSync(path.join(backupDir, file), 'utf8'));
    if (!raw.length) { console.log(`${table}: 0 rows, skipped`); continue; }
    let ok = 0, fail = 0;
    for (const row of raw) {
      const { id, created_at, ...rest } = row;
      const { error } = await sb.from(table).insert(rest);
      if (error) { console.error(`  FAIL [${table}] ${rest.title||rest.course_id||'?'}: ${error.message}`); fail++; }
      else ok++;
    }
    console.log(`${table}: ${ok} restored, ${fail} failed`);
  }
}

restore().catch(console.error);
