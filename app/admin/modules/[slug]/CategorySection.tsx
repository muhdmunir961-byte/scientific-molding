'use client';

/**
 * One photo category: its photos, and the controls for them.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THIS IS A THUMBNAIL GRID AND NOT A LIST OF ROWS
 *
 *  The first revision gave every photo a full row: a 96px preview, two text
 *  fields, a frame select and a crop editor. At 11 photos that is several screens
 *  of form, and the one thing an operator actually does most often — LOOK at
 *  what they uploaded — was a 96px square cropped to `object-fit: cover`.
 *
 *  So the list is now a grid of thumbnails. Each one opens full size on click,
 *  and its caption/frame/crop fields live behind a toggle that is closed by
 *  default. The common case (check the photos, add more, reorder) needs no form
 *  at all; the rare case (write a caption) is one click away.
 *
 *  ── Why the caption still saves on blur ─────────────────────────────────
 *  A save per keystroke would commit to git on every character. On blur is the
 *  point at which the operator has finished thinking about that field, and an
 *  untouched field never posts, so clicking through a gallery produces no commits.
 * ════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState } from 'react';

import type { GalleryImage } from '@/lib/gallery';
import type { PhotoCategory } from '@/lib/modules';
import type { ImageAspect, ImageCrop } from '@/lib/image-crop';

import { deletePhoto, editPhoto, reorderPhotos, uploadPhotos } from '../gallery-api';
import CropEditor from '../../testimonials/CropEditor';
import PhotoLightbox from '../../PhotoLightbox';
import PhotoUploader from '../../PhotoUploader';

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
  const [lightbox, setLightbox] = useState<number | null>(null);
  /** Which photo has its detail panel open. One at a time keeps the grid short. */
  const [openKey, setOpenKey] = useState<string | null>(null);

  /**
   * Upload one batch.
   *
   * Returns the envelope `PhotoUploader` needs so it can mark each file. The
   * caller's `onImages` is fed the merged list the server returns, which is the
   * authoritative order.
   */
  async function upload(files: File[]) {
    setBusy(true);
    const result = await uploadPhotos(moduleSlug, category, files);
    setBusy(false);

    if (!result.ok || !result.data) {
      return { ok: false, error: result.error ?? 'Upload failed.' };
    }

    onImages(result.data.images);

    /*
     * A partial upload is reported as a partial upload. The uploader already
     * shows the per-file failures beside each name, so this banner is only the
     * summary — it must not claim everything worked.
     */
    onNotice({
      tone: result.data.errors.length > 0 ? 'error' : 'ok',
      text:
        result.data.errors.length > 0
          ? `${result.data.uploaded} added, ${result.data.errors.length} failed. ${result.data.errors.join(' ')}`
          : `${result.data.uploaded} photo${result.data.uploaded === 1 ? '' : 's'} uploaded.`,
    });

    return { ok: true, errors: result.data.errors };
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
    if (openKey === key) setOpenKey(null);

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

  async function saveCaption(
    key: string,
    fields: { caption?: string; alt?: string; crop?: ImageCrop | null; aspect?: ImageAspect },
  ) {
    setBusy(true);
    const result = await editPhoto(moduleSlug, category, key, fields);
    setBusy(false);

    if (!result.ok || !result.data) {
      onNotice({ tone: 'error', text: result.error ?? 'Could not save that field.' });
      return;
    }
    onImages(result.data.images);
    onNotice({ tone: 'ok', text: 'Saved.' });
  }

  const described = images.filter((image) => image.alt.trim() !== '').length;

  return (
    <section className="admin-card gallery-category">
      <header className="gallery-category-head">
        <div>
          <h2 className="admin-card-title">{label}</h2>
          {/*
           * The status line answers "is this category finished" at a glance:
           * how many photos, and how many of them have a description. An
           * undescribed photo is not an error, but it is the thing that makes a
           * gallery inaccessible, so the count is shown rather than hidden.
           */}
          <p className="gallery-category-status">
            {images.length === 0 ? (
              <span className="admin-muted">No photos yet.</span>
            ) : (
              <>
                <span className="gallery-status-pill">
                  {images.length} photo{images.length === 1 ? '' : 's'}
                </span>
                <span
                  className={`gallery-status-pill ${
                    described === images.length ? 'is-complete' : 'is-partial'
                  }`}
                >
                  {described} of {images.length} described
                </span>
              </>
            )}
          </p>
        </div>
      </header>

      <PhotoUploader
        onUpload={upload}
        disabled={busy}
        label={images.length > 0 ? 'Add more photos' : 'Add photos'}
        hint={`Drops into ${label}. Click any thumbnail to check it full size.`}
      />

      {images.length > 0 && (
        <ul className="photo-grid">
          {images.map((image, index) => (
            <PhotoTile
              key={image.key}
              image={image}
              index={index}
              total={images.length}
              busy={busy}
              open={openKey === image.key}
              onToggle={() => setOpenKey(openKey === image.key ? null : image.key)}
              onZoom={() => setLightbox(index)}
              onMove={move}
              onRemove={remove}
              onSaveCaption={saveCaption}
            />
          ))}
        </ul>
      )}

      <PhotoLightbox
        context={label}
        index={lightbox}
        onIndex={setLightbox}
        items={images.map((image) => ({
          key: image.key,
          src: image.url,
          caption: image.caption,
          alt: image.alt || `${label} photo ${image.order + 1}`,
        }))}
      />
    </section>
  );
}

/**
 * One photo in the grid: a thumbnail you can open, and a detail panel.
 *
 * ── Why the thumbnail is a button ───────────────────────────────────────
 * Clicking the picture is the whole point of the grid, so it has to be a real
 * control: a `<div onClick>` cannot be reached with the keyboard and announces
 * nothing to a screen reader. The label names the action and the position.
 *
 * ── Why the fields are collapsed ────────────────────────────────────────
 * Caption, description, frame and crop are all edits, not checks. Eleven
 * always-open forms is what made this page several screens long. One panel at a
 * time keeps the grid scannable, and the thumbnail already shows the frame the
 * site will use.
 */
function PhotoTile({
  image,
  index,
  total,
  busy,
  open,
  onToggle,
  onZoom,
  onMove,
  onRemove,
  onSaveCaption,
}: {
  image: GalleryImage;
  index: number;
  total: number;
  busy: boolean;
  open: boolean;
  onToggle: () => void;
  onZoom: () => void;
  onMove: (index: number, delta: number) => void;
  onRemove: (key: string) => void;
  onSaveCaption: (
    key: string,
    fields: { caption?: string; alt?: string; crop?: ImageCrop | null; aspect?: ImageAspect },
  ) => void;
}) {
  const [caption, setCaption] = useState(image.caption);
  const [alt, setAlt] = useState(image.alt);
  const [editingCrop, setEditingCrop] = useState(false);

  /* Follow the stored value after a save or a reload. */
  useEffect(() => {
    setCaption(image.caption);
    setAlt(image.alt);
  }, [image.caption, image.alt]);

  return (
    <li className={`photo-tile${open ? ' is-open' : ''}`}>
      <div className="photo-tile-frame">
        <button
          type="button"
          className="photo-tile-open"
          onClick={onZoom}
          aria-label={`View photo ${index + 1} of ${total} full size`}
          title="Click to view full size"
        >
          {/* A plain <img>: the original bytes, at the shape the operator chose. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.alt || `${image.caption || 'Photo'} ${index + 1}`} />
        </button>

        <span className="photo-tile-index">{index + 1}</span>

        {/*
         * A photo with no description is flagged on the thumbnail rather than
         * only in the status line above, so it is obvious WHICH one needs one.
         */}
        {image.alt.trim() === '' && (
          <span className="photo-tile-flag" title="No description for screen readers">
            no alt
          </span>
        )}
      </div>

      <p className="photo-tile-caption">
        {image.caption || <span className="admin-muted">No caption</span>}
      </p>

      <div className="photo-tile-tools">
        <button
          type="button"
          className="admin-icon-button"
          aria-label={`Move photo ${index + 1} earlier`}
          disabled={busy || index === 0}
          onClick={() => onMove(index, -1)}
        >
          ↑
        </button>
        <button
          type="button"
          className="admin-icon-button"
          aria-label={`Move photo ${index + 1} later`}
          disabled={busy || index === total - 1}
          onClick={() => onMove(index, 1)}
        >
          ↓
        </button>
        <button
          type="button"
          className="admin-button admin-button-secondary admin-button-small photo-tile-edit"
          aria-expanded={open}
          onClick={onToggle}
        >
          {open ? 'Close' : 'Caption & frame'}
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

      {open && (
        <div className="photo-tile-detail">
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

          <label className="admin-label" htmlFor={`asp-${image.key}`}>
            Frame
          </label>
          <select
            id={`asp-${image.key}`}
            className="admin-input"
            value={image.crop ? 'cropped' : (image.aspect ?? 'auto')}
            disabled={busy}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'cropped') {
                setEditingCrop(true);
                return;
              }
              onSaveCaption(image.key, { aspect: value as ImageAspect, crop: null });
            }}
          >
            <option value="auto">Auto — the photo&apos;s own shape</option>
            <option value="portrait">Portrait (4:5)</option>
            <option value="square">Square (1:1)</option>
            <option value="landscape">Landscape (16:9)</option>
            {image.crop ? <option value="cropped">Hand-drawn crop</option> : null}
          </select>

          <div className="admin-actions photo-tile-detail-actions">
            <button
              type="button"
              className="admin-button admin-button-secondary admin-button-small"
              disabled={busy}
              onClick={() => setEditingCrop((v) => !v)}
            >
              {editingCrop ? 'Close crop editor' : image.crop ? 'Edit crop' : 'Crop by hand'}
            </button>
            <a
              className="admin-button admin-button-secondary admin-button-small"
              href={image.url}
              target="_blank"
              rel="noreferrer"
            >
              Open original
            </a>
          </div>

          {editingCrop && (
            <>
              <CropEditor
                src={image.url}
                crop={image.crop ?? null}
                /*
                 * Not disabled while saving.
                 *
                 * The save sets `busy`, and disabling the editor on `busy` locked
                 * it mid-drag: the box moved once, the request started, and the
                 * pointer was ignored for the rest of the gesture. The crop then
                 * saved whatever the first pixel of movement produced.
                 */
                onChange={() => {
                  /* The visual state is local; only the commit persists. */
                }}
                onCommit={(next) => onSaveCaption(image.key, { crop: next })}
              />
              {image.crop ? (
                <button
                  type="button"
                  className="admin-button admin-button-secondary admin-button-small"
                  disabled={busy}
                  onClick={() => onSaveCaption(image.key, { crop: null })}
                >
                  Clear crop
                </button>
              ) : null}
            </>
          )}

          <p className="admin-image-path">
            Position {index + 1} of {total} · uploaded{' '}
            {image.uploadedAt ? new Date(image.uploadedAt).toLocaleString() : 'unknown'}
          </p>
          <p className="admin-image-path">{image.url}</p>
        </div>
      )}
    </li>
  );
}

