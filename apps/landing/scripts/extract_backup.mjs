import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nxlsxywqvvuiljsulito.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bHN4eXdxdnZ1aWxqc3VsaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NTU3NTEsImV4cCI6MjA5ODUzMTc1MX0.OMgBhyUiAPwsC3oPx9Htv5obXXgCPm6h9QD6KHgi3lA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLES = [
  'site_settings',
  'nav_items',
  'nav_pages',
  'home_sections',
  'courses',
  'course_tabs',
  'course_tags',
  'tags',
  'highlights',
  'overview_faqs',
  'projects',
  'certifications',
  'alumni_companies',
  'faqs',
  'upcoming_classes',
  'service_categories',
  'services',
  'service_benefits',
  'service_steps',
  'service_gallery',
  'service_testimonials',
  'service_faqs',
  'service_statistics',
  'blog_categories',
  'blog_posts',
  'blog_post_tags',
  'job_openings',
  'career_page_content',
  'role_categories',
  'testimonials',
  'banking_testimonials',
  'admin_profiles'
];

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'object') {
    const jsonStr = JSON.stringify(val);
    return `'${jsonStr.replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('Starting data extraction...');
  let sqlOutput = `-- ============================================================================\n`;
  sqlOutput += `-- MARVEL SLICE SEED DATA EXPORT\n`;
  sqlOutput += `-- Generated At: ${new Date().toISOString()}\n`;
  sqlOutput += `-- Contains active public site content & admin profiles\n`;
  sqlOutput += `-- Excludes training tables, customer submissions, and private data\n`;
  sqlOutput += `-- ============================================================================\n\n`;

  sqlOutput += `-- Disable triggers & foreign key constraints during bulk seed import\n`;
  sqlOutput += `SET session_replication_role = 'replica';\n\n`;

  for (const tableName of TABLES) {
    try {
      console.log(`Fetching ${tableName}...`);
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) {
        console.warn(`Warning fetching ${tableName}:`, error.message);
        continue;
      }
      if (!data || data.length === 0) {
        console.log(`No rows in ${tableName}.`);
        continue;
      }

      // If table is self-referencing (e.g. nav_items), sort parent rows (parent_id IS NULL) first
      if (tableName === 'nav_items') {
        data.sort((a, b) => {
          if (!a.parent_id && b.parent_id) return -1;
          if (a.parent_id && !b.parent_id) return 1;
          return 0;
        });
      }

      sqlOutput += `-- ----------------------------------------------------------------------------\n`;
      sqlOutput += `-- Data for ${tableName} (${data.length} rows)\n`;
      sqlOutput += `-- ----------------------------------------------------------------------------\n`;

      const columns = Object.keys(data[0]);
      const colNamesStr = columns.map(c => `"${c}"`).join(', ');

      for (const row of data) {
        const valuesStr = columns.map(c => escapeSqlValue(row[c])).join(', ');
        sqlOutput += `INSERT INTO public."${tableName}" (${colNamesStr}) VALUES (${valuesStr}) ON CONFLICT DO NOTHING;\n`;
      }

      sqlOutput += `\n`;
    } catch (e) {
      console.error(`Error processing table ${tableName}:`, e);
    }
  }

  sqlOutput += `-- Re-enable triggers & foreign key constraints after seed import\n`;
  sqlOutput += `SET session_replication_role = 'origin';\n`;

  const backupDir = path.join(process.cwd(), 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const outputFile = path.join(backupDir, 'seed.sql');
  fs.writeFileSync(outputFile, sqlOutput, 'utf8');
  console.log(`Extraction complete! Seed SQL regenerated at: ${outputFile}`);
}

main();
