import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const QUOTA_PROJECT = 'site-fernandoduro';
let cached;

export function token() {
  if (cached) return cached;
  try {
    cached = execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], {
      env: { ...process.env, CLOUDSDK_CONFIG: process.env.CLOUDSDK_CONFIG ?? join(homedir(), '.System/config/gcloud') },
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();
  } catch {
    throw new Error('No Google credentials. Run: gcloud auth application-default login --client-id-file=... (see README)');
  }
  return cached;
}

export async function call(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      'x-goog-user-project': QUOTA_PROJECT,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${method} ${url} → ${response.status}: ${data.error?.message ?? text.slice(0, 300)}`);
  }
  return data;
}
