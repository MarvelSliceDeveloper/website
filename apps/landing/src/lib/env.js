// Central runtime env helper for Vite SPA + Node (dev-server.js).
// Reads from window.__ENV__ (injected via /config.js at container boot) first,
// falls back to import.meta.env (Vite), then process.env (Node / Docker), then fallback.
const runtimeEnv = (typeof window !== 'undefined' && window.__ENV__) || {};

export function getEnv(key, fallback = '') {
  if (runtimeEnv[key]) return runtimeEnv[key];
  // Vite build-time env (browser)
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {}
  // Node / Docker runtime env (dev-server.js, landing-api container)
  if (typeof globalThis.process !== 'undefined' && globalThis.process.env && globalThis.process.env[key]) {
    return globalThis.process.env[key];
  }
  return fallback;
}
