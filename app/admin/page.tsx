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

  /*
   * The gallery's overall completeness, computed once for the status panel.
   *
   * The module cards below already show per-category chips, but an operator
   * opening the panel wants the answer to two questions before anything else:
   * how many photographs exist in total, and how many categories are still
   * empty. Both are derived here rather than counted by hand in the markup, so
   * the numbers cannot disagree with the cards.
   */
  const totalPhotos = Object.values(counts).reduce((total, entry) => total + entry.total, 0);
  const emptyCategories = MODULES.flatMap((module) => {
    const byCategory: Partial<Record<string, number>> = counts[module.slug]?.byCategory ?? {};
    return PHOTO_CATEGORIES.filter((category) => (byCategory[category.slug] ?? 0) === 0).map(
      (category) => `${module.title} — ${category.label}`,
    );
  });
  const totalCategories = MODULES.length * PHOTO_CATEGORIES.length;
  const filledCategories = totalCategories - emptyCategories.length;

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

      {/*
        * The detailed status panel.
        *
        * It answers, in one place and without a click: is the photography done?
        * The two numbers are chosen deliberately — a total alone hides that six
        * photos sit in one category while three are empty, and a "3 of 4"
        * per-module figure alone hides how much work is left overall. The list of
        * empty categories is the actual to-do list, so it is printed rather than
        * merely counted.
        */}
      <section className="admin-card" aria-labelledby="status-heading">
        <h2 className="admin-card-title" id="status-heading">
          Status
        </h2>
        <p className="admin-card-desc">
          Where the photography stands right now. A category with no photos leaves
          a gap on the public page, so every empty one is listed by name.
        </p>

        <dl className="admin-totals">
          <div>
            <dt>Photos</dt>
            <dd>{totalPhotos}</dd>
          </div>
          <div>
            <dt>Categories filled</dt>
            <dd>
              {filledCategories} / {totalCategories}
            </dd>
          </div>
          <div>
            <dt>Still empty</dt>
            <dd>{emptyCategories.length}</dd>
          </div>
          <div>
            <dt>Site text</dt>
            <dd>{CONTENT_MODULES.length + PROGRAM_MODULES.length}</dd>
          </div>
        </dl>

        {emptyCategories.length > 0 ? (
          <details className="admin-status-details">
            <summary>
              {emptyCategories.length} categor
              {emptyCategories.length === 1 ? 'y has' : 'ies have'} no photos yet
            </summary>
            <ul className="admin-status-list">
              {emptyCategories.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </details>
        ) : (
          <p className="admin-notice admin-notice-ok" style={{ marginTop: 'var(--ds-space-4)' }}>
            Every module has photos in every category.
          </p>
        )}
      </section>

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
            const filled = PHOTO_CATEGORIES.filter(
              (category) => (byCategory[category.slug] ?? 0) > 0,
            ).length;
            return (
              <Link
                key={module.slug}
                href={`/admin/modules/${module.slug}`}
                className="admin-module-card"
              >
                <span className="admin-module-name">{module.title}</span>
                <span className="admin-module-meta">
                  {module.days} days · {module.level} · {moduleCounts?.total ?? 0} photo
                  {(moduleCounts?.total ?? 0) === 1 ? '' : 's'} in {filled} of{' '}
                  {PHOTO_CATEGORIES.length} categories
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
                        {count > 0 ? ` ${count}` : ' —'}
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
          image and the trainer portrait. Testimonial headshots are uploaded on
          each testimonial itself.
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
