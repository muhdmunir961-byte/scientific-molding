/**
 * POST /api/admin/auth — sign in.
 * DELETE   /api/admin/auth — sign out.
 *
 * ── Why logout is DELETE on the same path ───────────────────────────────
 * The resource being changed is the session itself, and DELETE is exactly the
 * verb for "remove the current one". It also means a stray GET or a link
 * prefetch can never sign anyone out, because neither maps to DELETE.
 *
 * ── Why a failed login does not say which part was wrong ────────────────
 * The response is the same for a wrong password and a missing password
 * configuration: "Sign-in failed." Distinguishing them would tell an attacker
 * whether the panel is configured, which is the first thing worth knowing and
 * costs nothing to withhold.
 *
 * A delay is applied on failure. It is not a substitute for rate limiting — it
 * makes an online guessing loop measurably slower, which is worth one line.
 */

import { NextResponse } from 'next/server';

import { checkPassword, clearedCookie, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/admin/auth';
import { isAuthConfigured } from '@/lib/admin/config';

export const runtime = 'nodejs';

/** Failed-attempt delay, in milliseconds. */
const FAILURE_DELAY_MS = 600;

/**
 * @param {Request} request
 * @returns {Promise<NextResponse>}
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'No admin password is configured. Set ADMIN_PASSWORD in the environment.',
      },
      { status: 503 },
    );
  }

  let password = '';
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    password = '';
  }

  if (!checkPassword(password)) {
    await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
    return NextResponse.json({ ok: false, error: 'Sign-in failed.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions());
  return response;
}

/**
 * @returns {Promise<NextResponse>}
 */
export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', clearedCookie());
  return response;
}
