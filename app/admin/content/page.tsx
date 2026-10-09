import { requirePage } from '@/lib/admin/page-guard';

import ContentEditor from './ContentEditor';

export const dynamic = 'force-dynamic';

/**
 * Content editor route — the server-guarded shell.
 *
 * ── Why the guard lives in a server wrapper, not the form ───────────────
 * The editor must be a client component: it holds draft values and per-field
 * error state, none of which a server component can do. A client component
 * cannot read `cookies()` or call `redirect()`, so it cannot enforce the
 * session itself.
 *
 * Splitting the route into a server page that guards and a client component
 * that edits means the guard runs before any of the form reaches the browser. A
 * signed-out visitor gets a redirect and never the markup. Relying on the API
 * to return 401 would leave the page shell visible with only the data missing —
 * a worse experience, and it would not protect the URL.
 */
export default async function ContentPage() {
  await requirePage();
  return <ContentEditor />;
}
