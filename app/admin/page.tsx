import Link from 'next/link';

import { deploymentWarnings, isAuthConfigured, isGitConfigured, isR2Configured } from '@/lib/admin/config';
import { requirePage } from '@/lib/admin/page-guard';
import { CONTENT_GROUPS } from '@/lib/admin/schema';

export const dynamic = 'force-dynamic';

/**
 * Admin overview.
 *
 * Shows what is editable and, importantly, which storage capabilities are
 * degraded. A save that persists locally but never reaches production is the
 * single failure mode a non-technical operator cannot diagnose, so it is stated
 * here rather than discovered later.
 */
export default async function AdminPage() {
  await requirePage();

  const warnings = deploymentWarnings();

  return (
    <>
      <h1 className="admin-title">Overview</h1>
      <p className="admin-lede">
        Edit the page content and upload images. Changes to text are committed to
        the repository and the site redeploys automatically.
      </p>

      {warnings.length > 0 && (
        <div className="admin-notice admin-notice-warn" role="status">
          <strong>Storage notice</strong>
          <ul>
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="admin-card">
        <h2 className="admin-card-title">Capabilities</h2>
        <p className="admin-card-desc">
          Each service is optional. The panel degrades rather than refusing to
          start, so it is usable before every account exists.
        </p>

        <ul className="admin-muted">
          <li>
            Admin password: <strong>{isAuthConfigured() ? 'set' : 'not set'}</strong>
          </li>
          <li>
            Image storage (R2):{' '}
            <strong>{isR2Configured() ? 'R2' : 'local filesystem fallback'}</strong>
          </li>
          <li>
            Content commits (GitHub):{' '}
            <strong>{isGitConfigured() ? 'enabled' : 'local fallback'}</strong>
          </li>
        </ul>
      </section>

      <section className="admin-card">
        <h2 className="admin-card-title">What you can edit</h2>
        <p className="admin-card-desc">
          These groups are safe to change. The five programme bodies are not
          listed because they are verbatim copies of the customer PDFs.
        </p>

        <ul>
          {CONTENT_GROUPS.map((group) => (
            <li key={group.id}>
              <Link href={`/admin/content?group=${group.id}`}>{group.title}</Link>{' '}
              — {group.description}
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-card">
        <h2 className="admin-card-title">Images</h2>
        <p className="admin-card-desc">
          Six image positions on the page. Each renders a brand gradient until a
          file is uploaded, so the site never shows a broken frame.
        </p>
        <Link className="admin-button" href="/admin/images">
          Go to images
        </Link>
      </section>
    </>
  );
}
