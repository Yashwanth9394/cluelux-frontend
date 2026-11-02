import { track } from '../lib/analytics';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DIRECT_API_URL = API_BASE_URL.includes('cloudfront.net')
  ? 'https://qp5p347l9l.execute-api.us-east-1.amazonaws.com/prod'
  : API_BASE_URL;

/**
 * Error codes used across the app:
 *   400 bad input · 401 sign-in failed · 404 not found · 500 render/app error · 503 API unreachable
 */
export type ErrorSource =
  | 'google-signin'
  | 'frontend'
  | 'daily'
  | 'archive'
  | 'sync'
  | 'stats';

// Reports a client-side error so it lands on the ops dashboard (CloudWatch),
// and also to PostHog for session context. Fire-and-forget; never throws.
export function logError(source: ErrorSource, code: number, message?: string): void {
  try {
    track('client_error', { source, code, message });
  } catch {
    // ignore
  }
  try {
    fetch(`${DIRECT_API_URL}/log-error?source=${encodeURIComponent(source)}&code=${code}`, {
      method: 'POST',
      cache: 'no-store',
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}
