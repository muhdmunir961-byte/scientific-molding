/**
 * POST /api/admin/deploy — ask Coolify to rebuild the site.
 *
 * ── Why this is a guarded POST and not a link ───────────────────────────
 * It has a side effect, so a GET would let a prefetch or a crawler trigger a
 * deploy. POST plus the session guard means only a signed-in operator can, and
 * only deliberately.
 *
 * ── Why the route does not wait for the build ───────────────────────────
 * Coolify returns as soon as the deploy is queued; the build runs for minutes
 * afterwards. Blocking this request on that would time out. So the route reports
 * whether the deploy was *accepted*, and the UI says so in those words rather
 * than claiming the site is updated.
 */

import { NextResponse } from 'next/server';

import { triggerDeploy } from '@/lib/admin/deploy';
import { requireSession } from '@/lib/admin/guard';

export const runtime = 'nodejs';

/**
 * @returns {Promise<NextResponse>}
 */
export async function POST(): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  const result = await triggerDeploy();

  return NextResponse.json(
    {
      ok: result.ok,
      error: result.ok ? undefined : result.detail,
      data: result.ok ? { detail: result.detail } : undefined,
    },
    { status: result.ok ? 200 : 502 },
  );
}
