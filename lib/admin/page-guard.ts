/**
 * Page-level session guard.
 *
 * The API routes use `requireSession()` from `lib/admin/guard.ts`, which returns
 * a 401 response. A *page* cannot return a response — it must redirect — so this
 * is the same check with the other failure behaviour.
 *
 * Both live in the lib so the verification token logic has exactly one
 * implementation. A page that re-implemented the HMAC check would be a second
 * place for it to be subtly wrong.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { SESSION_COOKIE, verifySessionToken } from './auth';

/**
 * Whether the current request carries a valid admin session.
 * @returns {Promise<boolean>}
 */
export async function hasSession(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * Redirect to the login page unless a valid session is present.
 *
 * Call at the top of every protected page. `redirect()` throws, so nothing
 * after this line runs when the session is absent — the page body cannot leak.
 * @returns {Promise<void>}
 */
export async function requirePage(): Promise<void> {
  if (!(await hasSession())) {
    redirect('/admin/login');
  }
}
