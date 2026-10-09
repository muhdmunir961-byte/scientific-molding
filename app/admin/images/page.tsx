import { requirePage } from '@/lib/admin/page-guard';

import ImagesManager from './ImagesManager';

export const dynamic = 'force-dynamic';

/**
 * Image manager route — the server-guarded shell.
 *
 * The manager is a client component (upload state, file input refs) and cannot
 * read `cookies()`, so the session check is done here, before the shell is sent.
 * See `../content/page.tsx` for the full reasoning.
 */
export default async function ImagesPage() {
  await requirePage();
  return <ImagesManager />;
}
