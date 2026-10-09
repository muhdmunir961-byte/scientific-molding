import Link from 'next/link';

import {
  deploymentWarnings,
  isAuthConfigured,
  isGitConfigured,
  isR2Configured,
} from '@/lib/admin/config';
import { requirePage } from '@/lib/admin/page-guard';
import { MODULES, PDF_EDIT_WARNING, PROGRAM_MODULES } from '@/lib/admin/schema';

export const dynamic = 'force-dynamic';

/**
 * Admin overview.
 *
 * Reports what is editable and, importantly, which storage capabilities are
 * degraded. A save that persists locally but never reaches production is the one
 * failure a non-technical operator cannot diagnose, so it is stated here rather
 * than discovered later.
 */
export default async function AdminPage() {
  await requirePage();

  const warnings = deploymentWarnings();

  return (
    <>
      <h1 className="admin-title">Overview</h1>
      <p className="admin-lede">
        Edit the text and images on the page. Saving commits to the repository and
        the site redeploys automatically.
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
        <h2 className="admin-card-title">Site content</h2>
        <p className="admin-card-desc">
          {MODULES.length} sections, including the announcement banner. Choose one
          to edit its text.
        </p>

        <ul className="admin-link-list">
          {MODULES.map((module) => (
            <li key={module.id}>
              <Link href={`/admin/content?module=${module.id}`}>
                <strong>{module.title}</strong>
              </Link>
              <span className="admin-muted"> — {module.description}</span>
            </li>
          ))}
        </ul>

        <p className="admin-actions" style={{ marginTop: 'var(--ds-space-6)' }}>
          <Link className="admin-button" href="/admin/images">
            Manage images
          </Link>
        </p>
      </section>

      <section className="admin-card">
        <h2 className="admin-card-title">Programme content</h2>
        <p className="admin-card-desc">{PDF_EDIT_WARNING}</p>

        <ul className="admin-link-list">
          {PROGRAM_MODULES.map((module) => (
            <li key={module.id}>
              <Link href={`/admin/content?module=${module.id}`}>
                <strong>{module.title}</strong>
              </Link>
              <span className="admin-muted"> — {module.description}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
