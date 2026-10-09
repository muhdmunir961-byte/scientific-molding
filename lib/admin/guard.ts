/**
 * Server-side guard for admin API routes.
 *
 * Every admin route calls `requireSession()` before doing anything. Returning
 * `null` on success rather than throwing keeps the call sites flat:
 *
 *     const denied = requireSession();
 *     if (denied) return denied;
 *
 * ── Why the check is here and not in middleware ─────────────────────────
 * Next.js middleware runs on the edge runtime, where `node:crypto` is not
 * available — and the session check is an HMAC verification. Reimplementing it
 * with WebCrypto to satisfy middleware would duplicate the security-critical
 * code into a second implementation, which is how the two drift. Keeping the
 * check in each route means one implementation, exercised by the same tests as
 * everything else.
 *
 * The cost is that a new admin route must remember to call it, which is why
 * `scripts/check-admin.mjs` asserts that every file under `app/api/admin`
 * contains the call.
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { SESSION_COOKIE, verifySessionToken } from './auth';

/**
 * Verify the request carries a valid admin session.
 * @returns {Promise<NextResponse|null>} a 401 response to return, or null when allowed
 */
export async function requireSession(): Promise<NextResponse | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (!verifySessionToken(token)) {
    return NextResponse.json(
      { ok: false, error: 'Not signed in.' },
      { status: 401 },
    );
  }

  return null;
}

/**
 * Standard JSON error response.
 * @param {string} error
 * @param {number} status
 * @returns {NextResponse}
 */
export function fail(error: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error }, { status });
}
