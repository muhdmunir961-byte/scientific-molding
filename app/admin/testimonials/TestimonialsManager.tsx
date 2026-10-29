'use client';

/**
 * Testimonials manager.
 *
 * Add, edit, reorder, publish and delete. Each card saves on blur (edit) or
 * immediately (toggle, move, delete), for the reasons recorded in
 * `CategorySection.tsx`: a value is already stored by the time the request
 * returns, and accumulating changes behind one Save button means reconciling
 * partial failures for no gain.
 *
 * ── Why the publish toggle is separate from the other fields ────────────
 * Everything else changes what a quote SAYS. This changes whether it may be
 * ATTRIBUTED at all, so it is a distinct, deliberate action rather than one more
 * field to save. The warning above it exists because the consequence — a claim in
 * a named person's mouth — is not obvious from the word "published".
 */

import { useCallback, useEffect, useState } from 'react';

import { MODULES } from '@/lib/modules';
import type { Testimonial, TestimonialCrop } from '@/lib/testimonials';

import CropEditor from './CropEditor';
import {
  addTestimonial,
  bulkUploadScreenshots,
  deleteTestimonial,
  editTestimonial,
  fetchTestimonials,
  reorderTestimonials,
  uploadTestimonialPhoto,
} from './testimonials-api';

export default function TestimonialsManager() {
  const [entries, setEntries] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchTestimonials();
    if (result.ok && result.data) {
      setEntries(result.data.testimonials);
    } else {
      setNotice({ tone: 'error', text: result.error ?? 'Could not load testimonials.' });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const publishedCount = entries.filter((e) => e.published).length;

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= entries.length) return;

    const next = [...entries];
    const moved = next.splice(index, 1)[0];
    if (!moved) return;
    next.splice(target, 0, moved);
    setEntries(next);

    setBusy(true);
    const result = await reorderTestimonials(next.map((e) => e.id));
    setBusy(false);

    if (!result.ok) {
      setNotice({ tone: 'error', text: result.error ?? 'Could not save the new order.' });
      return;
    }
    setNotice({ tone: 'ok', text: 'Order saved.' });
  }

  async function remove(id: string) {
    setBusy(true);
    const result = await deleteTestimonial(id);
    setBusy(false);

    if (!result.ok || !result.data) {
      setNotice({ tone: 'error', text: result.error ?? 'Could not remove that entry.' });
      return;
    }
    setEntries(result.data.testimonials);
    setNotice({ tone: 'ok', text: 'Removed.' });
  }

  async function add() {
    setBusy(true);
    /*
     * A genuinely blank entry.
     *
     * It used to be seeded with "New testimonial" and a placeholder quote, which
     * the operator then had to delete before typing the real thing — and which
     * would be published verbatim if they forgot. Every field is optional now,
     * so there is nothing to seed.
     */
    const result = await addTestimonial({});
    setBusy(false);

    if (!result.ok || !result.data) {
      setNotice({ tone: 'error', text: result.error ?? 'Could not add an entry.' });
      return;
    }
    setEntries(result.data.testimonials);
    setNotice({ tone: 'ok', text: 'Added. It stays hidden until you switch it on.' });
  }

  /**
   * Add many entries at once, one per screenshot.
   *
   * Everything created here is unpublished, so a bulk upload cannot put a real
   * person's screenshot on the live site before the operator has looked at it.
   */
  async function bulkAdd(files: File[]) {
    setBusy(true);
    setNotice(null);

    const result = await bulkUploadScreenshots(files);
    setBusy(false);

    if (!result.ok || !result.data) {
      setNotice({ tone: 'error', text: result.error ?? 'Could not add those screenshots.' });
      return;
    }

    setEntries(result.data.testimonials);
    setNotice({
      tone: result.data.errors.length > 0 ? 'error' : 'ok',
      text: result.data.message ?? `${result.data.created} added.`,
    });
  }

  async function save(entry: Testimonial, fields: Partial<Testimonial>) {
    const result = await editTestimonial({ ...entry, ...fields });

    if (!result.ok || !result.data) {
      setNotice({ tone: 'error', text: result.error ?? 'Could not save that change.' });
      return;
    }
    setEntries(result.data.testimonials);
    setNotice({ tone: 'ok', text: 'Saved.' });
  }

  async function uploadPhoto(entry: Testimonial, file: File) {
    setBusy(true);
    setNotice(null);

    const uploaded = await uploadTestimonialPhoto(file);
    if (!uploaded.ok || !uploaded.data) {
      setBusy(false);
      setNotice({ tone: 'error', text: uploaded.error ?? 'Photo upload failed.' });
      return;
    }

    /*
     * The path is written into the entry as a second step, not folded into the
     * upload. If the save fails the bytes still exist, so the message names the
     * path and says what is left to do rather than reporting a bare failure.
     */
    const saved = await editTestimonial({ ...entry, photo: uploaded.data.path });
    setBusy(false);

    if (!saved.ok || !saved.data) {
      setNotice({
        tone: 'error',
        text: `Photo uploaded to ${uploaded.data.path} but the entry was not saved: ${saved.error ?? 'unknown error'}. Paste the path into the Photo path field and save.`,
      });
      return;
    }

    setEntries(saved.data.testimonials);
    setNotice({ tone: 'ok', text: uploaded.data.message || 'Photo uploaded and saved.' });
  }

  /**
   * Upload a feedback screenshot and store it on the entry.
   *
   * A new screenshot resets the crop: the old fractions describe the previous
   * image, and carrying them over would show an arbitrary corner of the new one.
   */
  async function uploadScreenshot(entry: Testimonial, file: File) {
    setBusy(true);
    setNotice(null);

    const uploaded = await uploadTestimonialPhoto(file, 'screenshot');
    if (!uploaded.ok || !uploaded.data) {
      setBusy(false);
      setNotice({ tone: 'error', text: uploaded.error ?? 'Screenshot upload failed.' });
      return;
    }

    const saved = await editTestimonial({
      ...entry,
      screenshot: uploaded.data.path,
      crop: null,
    });
    setBusy(false);

    if (!saved.ok || !saved.data) {
      setNotice({
        tone: 'error',
        text: `Screenshot uploaded to ${uploaded.data.path} but the entry was not saved: ${saved.error ?? 'unknown error'}.`,
      });
      return;
    }

    setEntries(saved.data.testimonials);
    setNotice({ tone: 'ok', text: 'Screenshot uploaded. Set the crop below if needed.' });
  }

  return (
    <>
      <h1 className="admin-title">Testimonials</h1>
      <p className="admin-lede">
        {entries.length} entries, {publishedCount} published. Only published entries
        appear on the site, and the section is hidden entirely when none are.
      </p>

      <div className="admin-notice admin-notice-warn">
        A published testimonial is a claim in a named person&rsquo;s mouth. Only
        publish a quote the person actually gave, and a company name only with that
        company&rsquo;s written permission.
      </div>

      {notice && (
        <div className={`admin-notice admin-notice-${notice.tone}`} role="status">
          {notice.text}
        </div>
      )}

      <div className="admin-actions" style={{ marginBottom: 'var(--ds-space-6)' }}>
        <button type="button" className="admin-button" onClick={add} disabled={busy || loading}>
          Add a testimonial
        </button>

        {/*
          * A labelled file input styled as a button. A bare `<input type=file>`
          * next to the button above reads as a second, unrelated control; this
          * makes clear that both add entries, one at a time or in bulk.
          */}
        <label className={`admin-button admin-button-secondary ${busy || loading ? 'is-disabled' : ''}`}>
          Upload screenshots
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={busy || loading}
            onChange={(event) => {
              const files = Array.from(event.currentTarget.files ?? []);
              if (files.length > 0) void bulkAdd(files);
              event.currentTarget.value = '';
            }}
          />
        </label>
      </div>

      {loading ? (
        <p className="admin-muted">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="admin-muted">No testimonials yet.</p>
      ) : (
        <ul className="gallery-list">
          {entries.map((entry, index) => (
            <TestimonialRow
              key={entry.id}
              entry={entry}
              index={index}
              total={entries.length}
              busy={busy}
              onMove={move}
              onRemove={remove}
              onSave={save}
              onUploadPhoto={uploadPhoto}
              onUploadScreenshot={uploadScreenshot}
            />
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * One testimonial.
 *
 * Every text field holds its own draft and posts on blur, and only when the value
 * actually changed — so clicking through the list produces no commits. The
 * publish toggle posts immediately, because it is a state change rather than a
 * value being typed.
 */
function TestimonialRow({
  entry,
  index,
  total,
  busy,
  onMove,
  onRemove,
  onSave,
  onUploadPhoto,
  onUploadScreenshot,
}: {
  entry: Testimonial;
  index: number;
  total: number;
  busy: boolean;
  onMove: (index: number, delta: number) => void;
  onRemove: (id: string) => void;
  onSave: (entry: Testimonial, fields: Partial<Testimonial>) => void;
  onUploadPhoto: (entry: Testimonial, file: File) => void;
  onUploadScreenshot: (entry: Testimonial, file: File) => void;
}) {
  const [name, setName] = useState(entry.name);
  const [role, setRole] = useState(entry.role);
  const [company, setCompany] = useState(entry.company);
  const [quote, setQuote] = useState(entry.quote);
  const [photo, setPhoto] = useState(entry.photo);
  const [screenshot, setScreenshot] = useState(entry.screenshot);
  const [caption, setCaption] = useState(entry.caption);
  const [crop, setCrop] = useState<TestimonialCrop | null>(entry.crop);

  /*
   * Follow the saved entry when it changes underneath us.
   *
   * The draft fields exist so typing does not fire a request per keystroke. The
   * photo is different: it is written by an upload, not by typing, so the draft
   * would otherwise keep the pre-upload path and the next blur on "Photo path"
   * would save that stale value back — silently undoing the upload.
   */
  useEffect(() => {
    setPhoto(entry.photo);
  }, [entry.photo]);

  useEffect(() => {
    setScreenshot(entry.screenshot);
    setCaption(entry.caption);
    setCrop(entry.crop);
  }, [entry.screenshot, entry.caption, entry.crop]);

  return (
    <li className={`gallery-item ${entry.published ? '' : 'testimonial-unpublished'}`}>
      <div className="gallery-fields">
        <div className="gallery-category-head">
          <span className="admin-array-index">
            {entry.published ? 'Published' : 'Hidden'}
          </span>
          <div className="gallery-tools">
            <button
              type="button"
              className="admin-icon-button"
              aria-label={`Move entry ${index + 1} up`}
              disabled={busy || index === 0}
              onClick={() => onMove(index, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              className="admin-icon-button"
              aria-label={`Move entry ${index + 1} down`}
              disabled={busy || index === total - 1}
              onClick={() => onMove(index, 1)}
            >
              ↓
            </button>
            <button
              type="button"
              className="admin-icon-button admin-icon-danger"
              aria-label={`Remove entry ${index + 1}`}
              disabled={busy}
              onClick={() => onRemove(entry.id)}
            >
              ✕
            </button>
          </div>
        </div>

        <TextField
          label="Name (optional)"
          value={name}
          onChange={setName}
          onSave={() => name !== entry.name && onSave(entry, { name })}
        />
        <TextField
          label="Job title (optional)"
          value={role}
          onChange={setRole}
          onSave={() => role !== entry.role && onSave(entry, { role })}
        />
        <TextField
          label="Company (optional)"
          value={company}
          onChange={setCompany}
          onSave={() => company !== entry.company && onSave(entry, { company })}
        />

        <label className="admin-label" htmlFor={`quote-${entry.id}`}>
          What they said (optional)
        </label>
        <textarea
          id={`quote-${entry.id}`}
          className="admin-textarea"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          onBlur={() => quote !== entry.quote && onSave(entry, { quote })}
        />

        <label className="admin-label" htmlFor={`photo-upload-${entry.id}`}>
          Photo (optional)
        </label>
        <p className="admin-hint">
          Pilih gambar dari komputer. Square headshot, sekurang-kurangnya 240×240.
          Kosongkan untuk guna huruf awal nama.
        </p>
        <input
          id={`photo-upload-${entry.id}`}
          className="admin-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={busy}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) onUploadPhoto(entry, file);
            // Cleared so picking the same file again still fires a change.
            event.currentTarget.value = '';
          }}
        />
        {photo && (
          <div className="admin-photo-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={`Current photo for ${name || 'this testimonial'}`} />
            <button
              type="button"
              className="admin-button admin-button-secondary"
              disabled={busy}
              onClick={() => {
                setPhoto('');
                onSave(entry, { photo: '' });
              }}
            >
              Remove photo
            </button>
          </div>
        )}

        <TextField
          label="Photo path (optional)"
          value={photo}
          onChange={setPhoto}
          hint="Diisi automatik selepas upload. Boleh juga tampal URL atau path sendiri."
          onSave={() => photo !== entry.photo && onSave(entry, { photo })}
        />

        {/* ── Feedback screenshot ─────────────────────────────────────── */}
        <label className="admin-label" htmlFor={`shot-upload-${entry.id}`}>
          Feedback screenshot (optional)
        </label>
        <p className="admin-hint">
          Screenshot asal daripada WhatsApp, email atau platform lain. Dipaparkan
          pada nisbah asal — tidak dipaksa jadi segi empat sama.
        </p>
        <input
          id={`shot-upload-${entry.id}`}
          className="admin-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={busy}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) onUploadScreenshot(entry, file);
            event.currentTarget.value = '';
          }}
        />

        {screenshot && (
          <>
            <TextField
              label="Caption (optional)"
              value={caption}
              onChange={setCaption}
              hint="Printed under the screenshot — e.g. 'WhatsApp feedback, March 2026'."
              onSave={() => caption !== entry.caption && onSave(entry, { caption })}
            />

            <CropEditor
              src={screenshot}
              crop={crop}
              disabled={busy}
              onChange={(next) => {
                setCrop(next);
                onSave(entry, { crop: next });
              }}
            />

            <div className="admin-photo-preview">
              <button
                type="button"
                className="admin-button admin-button-secondary"
                disabled={busy}
                onClick={() => {
                  setScreenshot('');
                  setCrop(null);
                  onSave(entry, { screenshot: '', crop: null });
                }}
              >
                Remove screenshot
              </button>
            </div>
          </>
        )}

        <label className="admin-label" htmlFor={`module-${entry.id}`}>
          Module (optional)
        </label>
        <select
          id={`module-${entry.id}`}
          className="admin-input"
          value={entry.moduleSlug ?? ''}
          onChange={(e) => onSave(entry, { moduleSlug: e.target.value || null })}
        >
          <option value="">Not linked to a module</option>
          {MODULES.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.title}
            </option>
          ))}
        </select>

        <label className="admin-checkbox" style={{ marginTop: 'var(--ds-space-4)' }}>
          <input
            type="checkbox"
            checked={entry.published}
            disabled={busy}
            onChange={(e) => onSave(entry, { published: e.target.checked })}
          />
          <span className="admin-muted">
            {entry.published ? 'Shown on the site' : 'Hidden from the site'}
          </span>
        </label>
      </div>
    </li>
  );
}

/** A labelled text field that saves on blur, via the caller's comparison. */
function TextField({
  label,
  value,
  onChange,
  onSave,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  onSave: () => void;
  hint?: string;
}) {
  const id = `tf-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <>
      <label className="admin-label" htmlFor={id}>
        {label}
      </label>
      {hint && <p className="admin-hint">{hint}</p>}
      <input
        id={id}
        className="admin-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSave}
      />
    </>
  );
}
