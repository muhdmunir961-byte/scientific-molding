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
import type { Testimonial } from '@/lib/testimonials';

import {
  addTestimonial,
  deleteTestimonial,
  editTestimonial,
  fetchTestimonials,
  reorderTestimonials,
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
    const result = await addTestimonial({
      name: 'New testimonial',
      quote: 'Replace this with the quote the person actually gave.',
    });
    setBusy(false);

    if (!result.ok || !result.data) {
      setNotice({ tone: 'error', text: result.error ?? 'Could not add an entry.' });
      return;
    }
    setEntries(result.data.testimonials);
    setNotice({ tone: 'ok', text: 'Added. It stays hidden until you switch it on.' });
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
}: {
  entry: Testimonial;
  index: number;
  total: number;
  busy: boolean;
  onMove: (index: number, delta: number) => void;
  onRemove: (id: string) => void;
  onSave: (entry: Testimonial, fields: Partial<Testimonial>) => void;
}) {
  const [name, setName] = useState(entry.name);
  const [role, setRole] = useState(entry.role);
  const [company, setCompany] = useState(entry.company);
  const [quote, setQuote] = useState(entry.quote);
  const [photo, setPhoto] = useState(entry.photo);

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
          label="Name"
          value={name}
          onChange={setName}
          onSave={() => name !== entry.name && onSave(entry, { name })}
        />
        <TextField
          label="Job title"
          value={role}
          onChange={setRole}
          onSave={() => role !== entry.role && onSave(entry, { role })}
        />
        <TextField
          label="Company"
          value={company}
          onChange={setCompany}
          onSave={() => company !== entry.company && onSave(entry, { company })}
        />

        <label className="admin-label" htmlFor={`quote-${entry.id}`}>
          What they said
        </label>
        <textarea
          id={`quote-${entry.id}`}
          className="admin-textarea"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          onBlur={() => quote !== entry.quote && onSave(entry, { quote })}
        />

        <TextField
          label="Photo path"
          value={photo}
          onChange={setPhoto}
          hint="Upload on the Images page using a Testimonial slot, then paste the path here."
          onSave={() => photo !== entry.photo && onSave(entry, { photo })}
        />

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
