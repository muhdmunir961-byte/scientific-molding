import Link from 'next/link';

import {
  deploymentWarnings,
  isAuthConfigured,
  isCoolifyConfigured,
  isGitConfigured,
  isR2Configured,
} from '@/lib/admin/config';
import { requirePage } from '@/lib/admin/page-guard';
import { MODULES as CONTENT_MODULES, PDF_EDIT_WARNING, PROGRAM_MODULES } from '@/lib/admin/schema';
import { allGalleryCounts } from '@/lib/gallery';
import { MODULES, PHOTO_CATEGORIES, TOTAL_DAYS } from '@/lib/modules';

export const dynamic = 'force-dynamic';

/**
 * Admin overview.
 *
 * The photo panel is the primary content here: seven module cards, each linking
 * to that module's gallery and showing how many photos it has per category. The
 * brief asks for completeness at a glance, which is why each card carries four
 * chips rather than one total — "3 of 4 categories have photos" tells an operator
 * what to do next; "five photos" does not.
 */
export default async function AdminPage() {
  await requirePage();

  const warnings = deploymentWarnings();
  const counts = allGalleryCounts();

  return (
    <>
      <h1 className="admin-title">Overview</h1>
      <p className="admin-lede">
        {MODULES.length} training modules, {TOTAL_DAYS} days in total. Open a module
        to add its photos, or edit the page text below.
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
        <h2 className="admin-card-title">Module photos</h2>
        <p className="admin-card-desc">
          Each module has four activity categories: Lecture, Practical, Discussion
          and Presentation. A filled chip means that category has photos.
        </p>

        <div className="admin-module-grid">
          {MODULES.map((module) => {
            const moduleCounts = counts[module.slug];
            const byCategory: Partial<Record<string, number>> = moduleCounts?.byCategory ?? {};
            return (
              <Link
                key={module.slug}
                href={`/admin/modules/${module.slug}`}
                className="admin-module-card"
              >
                <span className="admin-module-name">{module.title}</span>
                <span className="admin-module-meta">
                  {module.days} days · {module.level}
                </span>

                <span className="admin-module-cats">
                  {PHOTO_CATEGORIES.map((category) => {
                    const count = byCategory[category.slug] ?? 0;
                    return (
                      <span
                        key={category.slug}
                        className={`admin-cat-chip ${
                          count > 0 ? 'admin-cat-chip-has' : 'admin-cat-chip-empty'
                        }`}
                      >
                        {category.label}
                        {count > 0 ? ` ${count}` : ''}
                      </span>
                    );
                  })}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

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
          <li>
            Deploy trigger (Coolify):{' '}
            <strong>{isCoolifyConfigured() ? 'enabled' : 'not set'}</strong>
          </li>
        </ul>
      </section>

      <section className="admin-card">
        <h2 className="admin-card-title">Other images</h2>
        <p className="admin-card-desc">
          The fixed positions that are not part of a module: the logo, the hero
          image, the trainer portrait and the testimonial headshots.
        </p>
        <Link className="admin-button admin-button-secondary" href="/admin/images">
          Manage other images
        </Link>
      </section>

      <section className="admin-card">
        <h2 className="admin-card-title">Testimonials</h2>
        <p className="admin-card-desc">
          Add, reorder and publish participant quotes. They ship hidden, and the
          section is hidden on the site until at least one is published.
        </p>
        <Link className="admin-button admin-button-secondary" href="/admin/testimonials">
          Manage testimonials
        </Link>
      </section>

      <section className="admin-card">
        <h2 className="admin-card-title">Site text</h2>
        <p className="admin-card-desc">{CONTENT_MODULES.length} sections.</p>

        <ul className="admin-link-list">
          {CONTENT_MODULES.map((module) => (
            <li key={module.id}>
              <Link href={`/admin/content?module=${module.id}`}>
                <strong>{module.title}</strong>
              </Link>
              <span className="admin-muted"> — {module.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-card">
        <h2 className="admin-card-title">Programme text</h2>
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
