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
