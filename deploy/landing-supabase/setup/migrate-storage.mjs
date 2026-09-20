// Uploads backed-up bucket files into the self-hosted Storage API.
// Usage:
//   SUPABASE_URL=http://127.0.0.1:8000 SUPABASE_SERVICE_ROLE_KEY=... \
//   SOURCE_DIR=/path/to/backup node setup/migrate-storage.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || 'http://127.0.0.1:8000';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const root = process.env.SOURCE_DIR;

if (!key || !root) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY and SOURCE_DIR');
  process.exit(1);
}

const BUCKETS = ['hero-images', 'course-thumbnails', 'certificates', 'company-logos', 'nav-icons', 'pages'];
const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.pdf': 'application/pdf',
};

const supabase = createClient(url, key, { auth: { persistSession: false } });

function* walk(dir, base = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) yield* walk(full, rel);
    else yield { full, rel };
  }
}

for (const bucket of BUCKETS) {
  const dir = path.join(root, bucket);
  if (!fs.existsSync(dir)) {
    console.log(`skip ${bucket} (no backup dir)`);
    continue;
  }
  for (const { full, rel } of walk(dir)) {
    const body = fs.readFileSync(full);
    const contentType = MIME[path.extname(rel).toLowerCase()] || 'application/octet-stream';
    const { error } = await supabase.storage.from(bucket).upload(rel, body, { contentType, upsert: true });
    if (error) console.error(`FAIL ${bucket}/${rel}: ${error.message}`);
    else console.log(`OK   ${bucket}/${rel}`);
  }
}
console.log('Storage import complete.');
