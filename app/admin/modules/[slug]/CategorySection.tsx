'use client';

/**
 * One photo category: its photos, and the controls for them.
 *
 * ── Why the caption field saves on blur, not per keystroke ──────────────
 * A save per keystroke would commit to git on every character. On blur is the
 * point at which the operator has finished thinking about that field, and it is
 * what the `dirty` flag below tracks — an untouched field never posts, so
 * clicking through a gallery produces no commits at all.
 */

import { useRef, useState } from 'react';

import type { GalleryImage } from '@/lib/gallery';
import type { PhotoCategory } from '@/lib/modules';

import { deletePhoto, editPhoto, reorderPhotos, uploadPhotos } from '../gallery-api';

export interface CategorySectionProps {
  moduleSlug: string;
  category: PhotoCategory;
  label: string;
  images: GalleryImage[];
  onImages: (images: GalleryImage[]) => void;
  onNotice: (notice: { tone: 'ok' | 'error'; text: string }) => void;
}

export function CategorySection({
  moduleSlug,
  category,
  label,
  images,
  onImages,
  onNotice,
}: CategorySectionProps) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function onPick(files: FileList | null) {
    if (!files || files.length === 0) return;

    setBusy(true);
    const result = await uploadPhotos(moduleSlug, category, Array.from(files));

    if (!result.ok || !result.data) {
      onNotice({ tone: 'error', text: result.error ?? 'Upload failed.' });
    } else {
      onImages(result.data.images);
      /*
       * A partial upload reports the per-file failures and says so in the
       * message, rather than claiming everything worked.
       */
      onNotice({
        tone: result.data.errors.length > 0 ? 'error' : 'ok',
        text:
          result.data.errors.length > 0
            ? result.data.errors.join(' ')
            : `${result.data.uploaded} photo${result.data.uploaded === 1 ? '' : 's'} uploaded.`,
      });
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  /**
   * Move one photo by one position, then persist the whole order.
   *
   * The local list is updated first so the move is instant, and the server
   * response replaces it — if the save fails the notice says so and a reload
   * restores the true order.
   */
  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;

    const next = [...images];
    const moved = next.splice(index, 1)[0];
    if (!moved) return;
    next.splice(target, 0, moved);
    onImages(next);

    setBusy(true);
    const result = await reorderPhotos(moduleSlug, category, next.map((i) => i.key));
    setBusy(false);

    if (!result.ok) {
      onNotice({ tone: 'error', text: result.error ?? 'Could not save the new order.' });
      return;
    }
    onNotice({ tone: 'ok', text: 'Order saved.' });
  }

  async function remove(key: string) {
    setBusy(true);
    const result = await deletePhoto(moduleSlug, category, key);
    setBusy(false);

    if (!result.ok || !result.data) {
      onNotice({ tone: 'error', text: result.error ?? 'Could not remove that photo.' });
      return;
    }

    onImages(result.data.images);
    /*
     * Whether the R2 object was removed is surfaced. It does not fail the
     * action — the site is already correct once the manifest is written — but an
     * orphaned object costs storage and an operator who knows can clean it up.
     */
    onNotice(
      result.data.objectDeleted
        ? { tone: 'ok', text: 'Photo removed.' }
        : {
            tone: 'ok',
            text: 'Photo removed from the page. The stored file was left in place and can be deleted from the bucket if you want it gone.',
          },
    );
  }

  async function saveCaption(key: string, fields: { caption?: string; alt?: string }) {
    const result = await editPhoto(moduleSlug, category, key, fields);
    if (!result.ok || !result.data) {
      onNotice({ tone: 'error', text: result.error ?? 'Could not save that field.' });
      return;
    }
    onImages(result.data.images);
    onNotice({ tone: 'ok', text: 'Saved.' });
  }

  return (
    <section className="admin-card gallery-category">
      <header className="gallery-category-head">
        <h2 className="admin-card-title">{label}</h2>
        <span className="admin-muted">
          {images.length === 0
            ? 'No photos yet'
            : `${images.length} photo${images.length === 1 ? '' : 's'}`}
        </span>
      </header>

      <input
        ref={inputRef}
        className="admin-omit"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        onChange={(e) => void onPick(e.target.files)}
      />

      <div className="admin-actions">
        <button
          type="button"
          className="admin-button admin-button-secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Working…' : images.length > 0 ? 'Add more photos' : 'Add photos'}
        </button>
      </div>

      {images.length > 0 && (
        <ul className="gallery-list">
          {images.map((image, index) => (
            <PhotoRow
              key={image.key}
              image={image}
              index={index}
              total={images.length}
              busy={busy}
              onMove={move}
              onRemove={remove}
              onSaveCaption={saveCaption}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * One photo row: preview, caption/alt fields, and the move/remove controls.
 *
 * Separate from `CategorySection` so the list markup does not nest four levels
 * deep, and because the caption fields hold their own draft state — a single
 * component owning eleven draft pairs would re-render all of them on any
 * keystroke.
 */
function PhotoRow({
  image,
  index,
  total,
  busy,
  onMove,
  onRemove,
  onSaveCaption,
}: {
  image: GalleryImage;
  index: number;
  total: number;
  busy: boolean;
  onMove: (index: number, delta: number) => void;
  onRemove: (key: string) => void;
  onSaveCaption: (key: string, fields: { caption?: string; alt?: string }) => void;
}) {
  const [caption, setCaption] = useState(image.caption);
  const [alt, setAlt] = useState(image.alt);

  return (
    <li className="gallery-item">
      <div className="gallery-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt="" />
      </div>

      <div className="gallery-fields">
        <label className="admin-label" htmlFor={`cap-${image.key}`}>
          Caption
        </label>
        <input
          id={`cap-${image.key}`}
          className="admin-input"
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => {
            // Only post when it actually changed — clicking through a gallery
            // must not produce a commit per field.
            if (caption !== image.caption) onSaveCaption(image.key, { caption });
          }}
        />

        <label className="admin-label" htmlFor={`alt-${image.key}`}>
          Description for screen readers
        </label>
        <input
          id={`alt-${image.key}`}
          className="admin-input"
          type="text"
          value={alt}
          placeholder="e.g. Engineers reviewing a mould setup"
          onChange={(e) => setAlt(e.target.value)}
          onBlur={() => {
            if (alt !== image.alt) onSaveCaption(image.key, { alt });
          }}
        />

        <p className="admin-image-path">Position {index + 1}</p>
      </div>

      <div className="gallery-tools">
        <button
          type="button"
          className="admin-icon-button"
          aria-label={`Move photo ${index + 1} up`}
          disabled={busy || index === 0}
          onClick={() => onMove(index, -1)}
        >
          ↑
        </button>
        <button
          type="button"
          className="admin-icon-button"
          aria-label={`Move photo ${index + 1} down`}
          disabled={busy || index === total - 1}
          onClick={() => onMove(index, 1)}
        >
          ↓
        </button>
        <button
          type="button"
          className="admin-icon-button admin-icon-danger"
          aria-label={`Remove photo ${index + 1}`}
          disabled={busy}
          onClick={() => onRemove(image.key)}
        >
          ✕
        </button>
      </div>
    </li>
  );
}
