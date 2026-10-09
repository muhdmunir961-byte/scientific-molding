import { requirePage } from '@/lib/admin/page-guard';

import TestimonialsManager from './TestimonialsManager';

export const dynamic = 'force-dynamic';

/**
 * Testimonials admin page — the server-guarded shell.
 *
 * The manager is a client component (it holds draft state per entry and the
 * publish toggle), so the session check runs here, before the shell is sent.
 * See `../content/page.tsx` for the full reasoning on the split.
 */
export default async function TestimonialsPage() {
  await requirePage();
  return <TestimonialsManager />;
}
