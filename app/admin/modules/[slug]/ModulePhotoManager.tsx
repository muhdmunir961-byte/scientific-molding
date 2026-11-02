'use client';

/**
 * Per-module photo manager.
 *
 * Four category sections in the required order — Lecture, Practical, Discussion,
 * Presentation — each holding an ordered list of photos with upload, delete,
 * reorder and caption editing.
 *
 * ── Why reorder is buttons, not drag-and-drop ───────────────────────────
 * The brief allows either. Buttons are keyboard-operable for free, work on a
 * touch device without a drag threshold, and cannot mis-drop. Drag-and-drop
 * would need a library or a hand-rolled pointer implementation, a keyboard
 * fallback anyway, and would be the one interaction in the panel that behaves
 * differently on a phone — for an operator editing eleven photos at a desk. The
 * move controls are the honest choice at this size.
 *
 * ── Why each category saves independently ───────────────────────────────
 * Uploading and reordering post immediately rather than accumulating into one
 * Save button. A photo is already in R2 by the time the request returns, so a
 * form-level save would have to track uploaded-but-uncommitted objects and
 * reconcile them on failure. Saving per change means the panel state and the
 * repository agree after every action.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import type { GalleryImage, ModuleGallery } from '@/lib/gallery';
import { PHOTO_CATEGORIES, type TrainingModule } from '@/lib/modules';

import {
  deletePhoto,
  editPhoto,
  fetchGallery,
  reorderPhotos,
  uploadPhotos,
} from '../gallery-api';

import { CategorySection } from './CategorySection';

export default function ModulePhotoManager({ module }: { module: TrainingModule }) {
  const [gallery, setGallery] = useState<ModuleGallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchGallery(module.slug);
    if (result.ok && result.data) {
      setGallery(result.data.gallery);
    } else {
      setNotice({ tone: 'error', text: result.error ?? 'Could not load this gallery.' });
    }
    setLoading(false);
  }, [module.slug]);

  useEffect(() => {
    void load();
  }, [load]);

  /*
   * A per-category summary, computed from the same array the sections render.
   *
   * The Overview card shows counts, but an operator working on one module needs
   * to know what is MISSING from it — which category is still empty and which
   * photos have no description — without scrolling four sections to find out.
   */
  const summary = PHOTO_CATEGORIES.map((category) => {
    const images = gallery?.[category.slug] ?? [];
    return {
      ...category,
      count: images.length,
      described: images.filter((image) => image.alt.trim() !== '').length,
    };
  });
  const totalPhotos = summary.reduce((total, c) => total + c.count, 0);
  const emptyCategories = summary.filter((c) => c.count === 0).length;

  return (
    <>
      <p className="admin-breadcrumb">
        <Link href="/admin">Overview</Link> <span aria-hidden="true">/</span>{' '}
        <span>{module.title}</span>
      </p>

      <h1 className="admin-title">{module.title}</h1>
      <p className="admin-lede">
        {module.days} days · {module.level}. Add photos to each activity category.
        Uploads are saved and committed as you go.
      </p>

      {notice && (
        <div className={`admin-notice admin-notice-${notice.tone}`} role="status">
          {notice.text}
        </div>
      )}

      {/*
       * The gallery's own status, above the four sections.
       *
       * It reports the two things that decide whether the module's page is
       * finished: how many photos exist in total, and how many categories are
       * still empty. A bare total would hide the second — six photos in one
       * category is a module with three empty categories, not a complete one.
       */}
      {gallery && (
        <section className="admin-card gallery-summary" aria-label="Gallery status">
          <div className="admin-actions" style={{ justifyContent: 'space-between' }}>
            <div>
              <h2 className="admin-card-title">Gallery status</h2>
              <p className="admin-card-desc">
                {totalPhotos === 0
                  ? 'No photos in this module yet. Add them per category below.'
                  : `${totalPhotos} photo${totalPhotos === 1 ? '' : 's'} across ${
                      PHOTO_CATEGORIES.length - emptyCategories
                    } of ${PHOTO_CATEGORIES.length} categories.`}
                {emptyCategories > 0
                  ? ` ${emptyCategories} categor${emptyCategories === 1 ? 'y is' : 'ies are'} still empty.`
                  : ' Every category has photos.'}
              </p>
            </div>
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <ul className="gallery-summary-list">
            {summary.map((category) => (
              <li
                key={category.slug}
                className={`gallery-summary-item ${category.count === 0 ? 'is-empty' : 'is-filled'}`}
              >
                <span className="gallery-summary-label">{category.label}</span>
                <span className="gallery-summary-value">
                  {category.count === 0 ? 'empty' : `${category.count} photo${category.count === 1 ? '' : 's'}`}
                </span>
                {category.count > 0 && (
                  <span className="gallery-summary-detail">
                    {category.described === category.count
                      ? 'all described'
                      : `${category.described} of ${category.count} described`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {loading || !gallery ? (
        <p className="admin-muted">Loading photos…</p>
      ) : (
        PHOTO_CATEGORIES.map((category) => (
          <CategorySection
            key={category.slug}
            moduleSlug={module.slug}
            category={category.slug}
            label={category.label}
            images={gallery[category.slug] ?? []}
            onImages={(images) => setGallery({ ...gallery, [category.slug]: images })}
            onNotice={setNotice}
          />
        ))
      )}
    </>
  );
}
