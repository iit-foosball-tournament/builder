#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Vite's DEBUG=vite:env would print the resolved keys; disable it before import.
delete process.env.DEBUG;
const { loadEnv } = await import('vite');
// Match `vite build` (production mode), including Vite's process.env precedence.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = loadEnv('production', projectRoot, 'VITE_');
const fail = (message) => {
  console.error(`Cloud config preflight failed: ${message}`);
  process.exit(1);
};

const url = env.VITE_SUPABASE_URL?.trim();
let parsedUrl;
try {
  parsedUrl = new URL(url);
} catch {
  fail('VITE_SUPABASE_URL must be a valid HTTPS URL.');
}
if (parsedUrl.protocol !== 'https:' || !parsedUrl.hostname || parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
  fail('VITE_SUPABASE_URL must be a valid HTTPS endpoint without credentials or query parameters.');
}

// A second configured key must not silently ship in the Vite bundle, even if
// the application would choose the first one.
const keyNames = ['VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY'];
if (Object.keys(env).some((name) => /^VITE_.*(?:SECRET|SERVICE_ROLE|PRIVATE_KEY)/i.test(name) && env[name])) {
  fail('Remove secret/service-role variables from the VITE_ browser environment.');
}
const configured = keyNames.filter((name) => env[name]?.trim());
if (configured.length === 0) fail('Set a Supabase publishable key or legacy anon key.');

function isAnonJwt(key) {
  const parts = key.split('.');
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload !== null && typeof payload === 'object' && !Array.isArray(payload) && payload.role === 'anon';
  } catch {
    return false;
  }
}

for (const name of configured) {
  const key = env[name].trim();
  if (!(key.startsWith('sb_publishable_') && /^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) && !isAnonJwt(key)) {
    fail(`${name} must be a publishable key or a legacy JWT with role anon (never a secret/service key).`);
  }
}
console.log('Cloud config preflight passed.');
