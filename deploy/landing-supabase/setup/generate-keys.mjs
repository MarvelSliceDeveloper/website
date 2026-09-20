import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(dir, '..', '.env');

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const rand = (n) => crypto.randomBytes(n).toString('base64');

function signJwt(payload, secret) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

let text = '';
try {
  text = fs.readFileSync(envPath, 'utf8');
} catch {
  console.error(`Missing ${envPath}. Copy .env.example first.`);
  process.exit(1);
}

const get = (key) => (text.match(new RegExp(`^${key}=(.*)$`, 'm')) || [])[1]?.trim() || '';
const set = (key, value) => {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  text = re.test(text) ? text.replace(re, line) : `${text.replace(/\s*$/, '')}\n${line}\n`;
};

const jwtSecret = get('JWT_SECRET') || rand(48);
const now = Math.floor(Date.now() / 1000);
const exp = now + 60 * 60 * 24 * 365 * 10;
const base = { iss: 'supabase', iat: now, exp };

set('JWT_SECRET', jwtSecret);
set('ANON_KEY', signJwt({ ...base, role: 'anon' }, jwtSecret));
set('SERVICE_ROLE_KEY', signJwt({ ...base, role: 'service_role' }, jwtSecret));
set('SECRET_KEY_BASE', rand(48));
set('REALTIME_DB_ENC_KEY', crypto.randomBytes(8).toString('hex')); // exactly 16 chars
set('VAULT_ENC_KEY', crypto.randomBytes(16).toString('hex'));       // exactly 32 chars
set('PG_META_CRYPTO_KEY', rand(24));
set('LOGFLARE_PUBLIC_ACCESS_TOKEN', rand(24));
set('LOGFLARE_PRIVATE_ACCESS_TOKEN', rand(24));
set('S3_PROTOCOL_ACCESS_KEY_ID', crypto.randomBytes(16).toString('hex'));
set('S3_PROTOCOL_ACCESS_KEY_SECRET', crypto.randomBytes(32).toString('hex'));

fs.writeFileSync(envPath, text);
console.log('Wrote secrets to .env');
console.log('ANON_KEY (use as VITE_SUPABASE_ANON_KEY):');
console.log(get('ANON_KEY'));
