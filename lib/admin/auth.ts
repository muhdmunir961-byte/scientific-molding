/**
 * Admin authentication — password login and a signed session cookie.
 *
 * ── Why a signed cookie and not a JWT library ───────────────────────────
 * The session needs exactly two properties: it cannot be forged, and it
 * expires. A JWT brings a dependency, an alg-confusion footgun and a payload
 * nobody reads. An HMAC over `expiry` with a server-side secret gives the two
 * properties required, using `node:crypto`, which is already present. The
 * project rule is no new dependencies without a reason that survives being
 * written down; this one does not.
 *
 * ── Why the password comparison is constant-time ────────────────────────
 * `===` on strings short-circuits at the first differing byte, so its runtime
 * leaks how many leading characters were correct. `timingSafeEqual` on
 * equal-length buffers removes the signal.
 *
 * ── Why the cookie is not `Secure` in development ───────────────────────
 * `Secure` cookies are not stored over plain HTTP, so setting it unconditionally
 * makes the panel unusable on `http://localhost`. It is derived from
 * `NODE_ENV`; production always gets it.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { ADMIN_ENV, isAuthConfigured } from './config';

/** Cookie name. Prefixed so it cannot collide with an app cookie. */
export const SESSION_COOKIE = 'smts_admin';

/** Session lifetime: 8 hours — one working day, then re-login. */
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/**
 * The secret used to sign sessions.
 *
 * Falls back to the password when no dedicated secret is set, so a single
 * `ADMIN_PASSWORD` is enough to get running. Setting `ADMIN_SESSION_SECRET`
 * separately is better: rotating the password then does not invalidate the
 * signing key, and vice versa.
 * @returns {string}
 */
function signingSecret(): string {
  return (
    (process.env[ADMIN_ENV.sessionSecret] ?? '').trim() ||
    (process.env[ADMIN_ENV.password] ?? '').trim()
  );
}

/**
 * Constant-time comparison of two strings.
 *
 * Both sides are hashed first so the buffers are always equal length —
 * `timingSafeEqual` throws on a length mismatch, and comparing raw values of
 * different lengths would itself leak the expected length.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHmac('sha256', 'cmp').update(a).digest();
  const hb = createHmac('sha256', 'cmp').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Check a submitted password against `ADMIN_PASSWORD`.
 *
 * Returns false when no password is configured, in every environment. An unset
 * password must never mean "no password required" — that would turn a missing
 * Coolify variable into a public admin panel.
 * @param {string} submitted
 * @returns {boolean}
 */
export function checkPassword(submitted: string): boolean {
  if (!isAuthConfigured()) return false;
  const expected = (process.env[ADMIN_ENV.password] ?? '').trim();
  return safeEqual(submitted, expected);
}

/**
 * Mint a session token: `<expiry>.<hmac>`.
 * @returns {string}
 */
export function createSessionToken(): string {
  const expiry = String(Date.now() + SESSION_TTL_MS);
  const sig = createHmac('sha256', signingSecret()).update(expiry).digest('hex');
  return `${expiry}.${sig}`;
}

/**
 * Verify a session token's signature and expiry.
 * @param {string|undefined} token
 * @returns {boolean}
 */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const dot = token.indexOf('.');
  if (dot <= 0) return false;

  const expiry = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(expiry) || !/^[0-9a-f]{64}$/.test(sig)) return false;

  const expected = createHmac('sha256', signingSecret()).update(expiry).digest('hex');
  if (!safeEqual(sig, expected)) return false;

  return Number(expiry) > Date.now();
}

/**
 * Cookie options for the session.
 * @returns {object}
 */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  };
}

/**
 * A value for the `Set-Cookie` header that clears the session.
 * @returns {string}
 */
export function clearedCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

/** Random hex string, for CSRF tokens or filenames. */
export function randomToken(bytes = 16): string {
  return randomBytes(bytes).toString('hex');
}
