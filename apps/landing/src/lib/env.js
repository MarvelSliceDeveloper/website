// Central runtime env helper for Vite SPA.
// Reads from window.__ENV__ (injected via /config.js at container boot) first,
// falls back to Vite build-time import.meta.env for local dev / webuzo npm run build.
const runtimeEnv = (typeof window !== 'undefined' && window.__ENV__) || {};

export function getEnv(key, fallback = '') {
  return runtimeEnv[key] || import.meta.env[key] || fallback;
}
