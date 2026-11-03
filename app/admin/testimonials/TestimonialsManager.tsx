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
import {
  DEFAULT_TESTIMONIALS_SETTINGS,
  makeImage,
  type Testimonial,
  type TestimonialImage,
  type TestimonialsSettings,
} from '@/lib/testimonials';

import CropEditor from './CropEditor';
import SectionSettings from './SectionSettings';
import PhotoLightbox from '../PhotoLightbox';
import PhotoUploader from '../PhotoUploader';
import {
  addTestimonial,
  bulkUploadScreenshots,
  deleteTestimonial,
  editTestimonial,
  fetchTestimonials,
  reorderTestimonials,
  saveTestimonialsSettings,
  uploadTestimonialPhoto,
} from './testimonials-api';

/**
 * Guarantee an entry has an `images` array.
 *
 * The panel indexes `entry.images` in the render and in every handler. A response
 * from an older build — or a browser replaying a cached one — has no such key,
 * and `undefined.length` took the whole page down with a client-side error. This
 * is the one place that decides what a missing array means.
 * @param {Testimonial} entry
 * @returns {Testimonial}
 */
function normaliseEntry(entry: Testimonial): Testimonial {
  return Array.isArray(entry.images) ? entry : { ...entry, images: [] };
}

export default function TestimonialsManager() {
  const [entries, setEntries] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [settings, setSettings] = useState<TestimonialsSettings>(DEFAULT_TESTIMONIALS_SETTINGS);
  const [settingsSaved, setSettingsSaved] = useState(false);
  /** Which subset of the list is shown — see `Overview`. */
  const [filter, setFilter] = useState<Filter>('all');
  /** The one entry whose editor is open, by id. Only ever one. */
  const [openId, setOpenId] = useState<string | null>(null);
  /** The full-size viewer: the entry's images and which one is open. */
  const [zoom, setZoom] = useState<{ context: string; images: TestimonialImage[]; index: number } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchTestimonials();
    if (result.ok && result.data) {
      /*
       * Normalise on arrival, not at every use site.
       *
       * The API upgrades entries before sending them, but this panel is also
       * reachable from a browser holding an older response, and a single entry
       * without an `images` array used to crash the whole page — `entry.images
       * .length` on undefined. One normalisation here means no call site has to
       * defend against it.
       */
      setEntries(result.data.testimonials.map(normaliseEntry));
      setSettings(result.data.settings ?? DEFAULT_TESTIMONIALS_SETTINGS);
      setSettingsSaved(result.data.settingsSaved === true);
    } else {
      setNotice({ tone: 'error', text: result.error ?? 'Could not load testimonials.' });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const publishedCount = entries.filter((e) => e.published).length;
  const imageCount = entries.reduce((total, entry) => total + entry.images.length, 0);
  /* An entry with nothing on it at all — a draft that was never filled in. */
  const isEmpty = (e: Testimonial) =>
    e.images.length === 0 &&
    e.quote.trim() === '' &&
    e.name.trim() === '' &&
    e.photo.trim() === '';

  /*
   * Live entries whose permission was never recorded — see the notice below.
   * Every entry that predates the gate reads as `consentOnFile: false`, so this
   * is the list the operator has to work through once.
   */
  const publishedWithoutConsent = entries.filter((e) => e.published && !e.consentOnFile).length;

  const totals = {
    entries: entries.length,
    published: publishedCount,
    hidden: entries.length - publishedCount,
    /*
     * Only LIVE entries count here.
     *
     * A hidden draft with no recorded permission is not an exposure — the gate
     * will not let it be published until one is recorded. What is an exposure is
     * an entry that is already on the site without it, and that is the number
     * the operator needs to act on. Counting all 36 drafts here would bury the
     * five that matter.
     */
    noPermission: publishedWithoutConsent,
    images: imageCount,
    empty: entries.filter(isEmpty).length,
  };

  /*
   * The visible subset. A filter never mutates the list — `move` and `remove`
   * work on `entries`, and the row's own index is its position in the FILTERED
   * view, so a move is translated back to the real index before it is applied.
   */
  const visible = entries.filter((entry) => {
    switch (filter) {
      case 'published':
        return entry.published;
      case 'hidden':
        return !entry.published;
      case 'no-permission':
        /*
         * Live-only, matching the overview's count. A hidden entry without
         * permission is not actionable — the gate already blocks it — so showing
         * those here would make the list disagree with the number that opened it.
         */
        return entry.published && !entry.consentOnFile;
      case 'images':
        return entry.images.length > 0;
      case 'empty':
        return isEmpty(entry);
      default:
        return true;
    }
  });

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
    setEntries(result.data.testimonials.map(normaliseEntry));

    /*
     * The removal now also deletes the photographs. If any of them survived, the
     * operator has to know: a person who withdrew their testimonial is still
     * reachable at that URL, and "Removed." would tell them it was dealt with.
     */
    const stranded = result.data.filesNotRemoved ?? [];
    setNotice({
      tone: stranded.length > 0 ? 'error' : 'ok',
      text:
        stranded.length > 0
          ? `Entry removed, but ${stranded.length} image file(s) are still in storage: ${stranded.join(', ')}`
          : result.data.message ?? 'Removed.',
    });
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
    setEntries(result.data.testimonials.map(normaliseEntry));
    setNotice({ tone: 'ok', text: 'Added. It stays hidden until you switch it on.' });
  }

  /**
   * Add many entries at once, one per screenshot.
   *
   * Everything created here is unpublished, so a bulk upload cannot put a real
   * person's screenshot on the live site before the operator has looked at it.
   *
   * Returns the envelope `PhotoUploader` needs so it can mark each file: the
   * route reports failures per file name, and the uploader matches on that.
   */
  async function bulkAdd(files: File[]) {
    setBusy(true);
    setNotice(null);

    const result = await bulkUploadScreenshots(files);
    setBusy(false);

    if (!result.ok || !result.data) {
      return { ok: false, error: result.error ?? 'Could not add those screenshots.' };
    }

    setEntries(result.data.testimonials.map(normaliseEntry));
    setNotice({
      tone: result.data.errors.length > 0 ? 'error' : 'ok',
      text: result.data.message ?? `${result.data.created} added.`,
    });

    return { ok: true, errors: result.data.errors };
  }

  async function save(entry: Testimonial, fields: Partial<Testimonial>) {
    const result = await editTestimonial({ ...entry, ...fields });

    if (!result.ok || !result.data) {
      setNotice({ tone: 'error', text: result.error ?? 'Could not save that change.' });
      return;
    }
    setEntries(result.data.testimonials.map(normaliseEntry));
    setNotice({ tone: 'ok', text: 'Saved.' });
  }

  /** Persist the whole settings form in one request. */
  async function saveSettings(next: TestimonialsSettings) {
    setBusy(true);
    setNotice(null);

    const result = await saveTestimonialsSettings(next);
    setBusy(false);

    if (!result.ok || !result.data) {
      setNotice({ tone: 'error', text: result.error ?? 'Could not save the settings.' });
      return;
    }

    setSettings(result.data.settings);
    setSettingsSaved(true);
    setNotice({ tone: 'ok', text: result.data.message ?? 'Settings saved.' });
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

    setEntries(saved.data.testimonials.map(normaliseEntry));
    setNotice({ tone: 'ok', text: uploaded.data.message || 'Photo uploaded and saved.' });
  }

  /**
   * Upload one or more screenshots and append them to the entry.
   *
   * ── Why append and never replace ────────────────────────────────────────
   * An entry can carry any number of captures, and a second upload is almost
   * always "here is the rest of the thread" rather than "replace what I sent".
   * Replacing would silently drop images the operator had already captioned and
   * cropped.
   *
   * Each file is appended only after it stores successfully, so one bad file in
   * a batch of five does not lose the other four. The whole list is written once
   * at the end.
   */
  async function uploadScreenshots(
    entry: Testimonial,
    files: File[],
  ): Promise<{ ok: boolean; error?: string; errors?: string[] }> {
    setBusy(true);
    setNotice(null);

    const added: TestimonialImage[] = [];
    const failures: string[] = [];

    for (const file of files) {
      const uploaded = await uploadTestimonialPhoto(file, 'screenshot');
      if (!uploaded.ok || !uploaded.data) {
        failures.push(`${file.name}: ${uploaded.error ?? 'upload failed'}`);
        continue;
      }
      added.push(makeImage({ src: uploaded.data.path }));
    }

    if (added.length === 0) {
      setBusy(false);
      setNotice({ tone: 'error', text: failures.join(' ') || 'Nothing was uploaded.' });
      return { ok: false, error: failures.join(' ') || 'Nothing was uploaded.', errors: failures };
    }

    const saved = await editTestimonial({
      ...entry,
      images: [...entry.images, ...added],
    });
    setBusy(false);

    if (!saved.ok || !saved.data) {
      const detail = `${added.length} uploaded but the entry was not saved: ${saved.error ?? 'unknown error'}.`;
      setNotice({ tone: 'error', text: detail });
      /*
       * The bytes are in storage but the entry was not written, so every file in
       * this batch is reported as failed. Marking them done would tell the
       * operator the screenshots are on the entry when they are not.
       */
      return {
        ok: false,
        error: detail,
        errors: files.map((file) => `${file.name}: not saved to the entry`),
      };
    }

    setEntries(saved.data.testimonials.map(normaliseEntry));
    setNotice({
      tone: failures.length > 0 ? 'error' : 'ok',
      text:
        failures.length > 0
          ? `${added.length} added, ${failures.length} failed. ${failures.join(' ')}`
          : `${added.length} image${added.length === 1 ? '' : 's'} added.`,
    });

    return { ok: true, errors: failures };
  }

  /** Replace the whole image list for one entry — used by remove and reorder. */
  async function saveImages(entry: Testimonial, images: TestimonialImage[]) {
    const result = await editTestimonial({ ...entry, images });
    if (!result.ok || !result.data) {
      setNotice({ tone: 'error', text: result.error ?? 'Could not save the images.' });
      return;
    }
    setEntries(result.data.testimonials.map(normaliseEntry));
  }

  return (
    <>
      <h1 className="admin-title">Testimonials</h1>
      <p className="admin-lede">
        {entries.length} entries, {publishedCount} published. Only published entries
        appear on the site, and the section is hidden entirely when none are. There
        is no limit on how many you publish — the landing page re-flows to fit.
      </p>

      <div className="admin-notice admin-notice-warn">
        A published testimonial is a claim in a named person&rsquo;s mouth. Publishing
        is blocked until you record that permission on the entry. Only publish a
        quote the person actually gave, and a company name only with that
        company&rsquo;s written permission.
      </div>

      {/*
        * Live entries with no recorded permission.
        *
        * The publish gate stops this happening again, but it cannot retroactively
        * vouch for what is already on the site — every entry published before the
        * gate existed was published on the strength of a conversation nobody
        * recorded. Surfacing the count here is the only way the operator finds
        * out; an unconfirmed testimonial that is already live is exactly the
        * exposure the gate was added to prevent.
        */}
      {publishedWithoutConsent > 0 && (
        <div className="admin-notice admin-notice-error" role="alert">
          <strong>
            {publishedWithoutConsent} published{' '}
            {publishedWithoutConsent === 1 ? 'testimonial has' : 'testimonials have'} no
            recorded permission.
          </strong>{' '}
          {publishedWithoutConsent === 1 ? 'It is' : 'They are'} live on the site now.
          Confirm each one below, or unpublish it — a quote attributed to someone who
          never agreed to it is a defamation exposure, and their photograph is
          personal data under PDPA 2010.
        </div>
      )}

      {notice && (
        <div className={`admin-notice admin-notice-${notice.tone}`} role="status">
          {notice.text}
        </div>
      )}

      <Overview totals={totals} filter={filter} onFilter={setFilter} />

      <div className="admin-actions" style={{ marginBottom: 'var(--ds-space-4)' }}>
        <button type="button" className="admin-button" onClick={add} disabled={busy || loading}>
          Add an empty entry
        </button>
        <button
          type="button"
          className="admin-button admin-button-secondary"
          onClick={() => setOpenId(null)}
          disabled={openId === null}
        >
          Close open editor
        </button>
      </div>

      {/*
        * One uploader for the whole list. Each file becomes its own unpublished
        * entry, and the per-file list underneath says exactly which ones landed —
        * the old single button reported "9 added, 1 failed" with no way to tell
        * which file was which.
        */}
      <div className="admin-card" style={{ marginBottom: 'var(--ds-space-6)' }}>
        <h2 className="admin-card-title">Upload screenshots</h2>
        <p className="admin-card-desc">
          Each screenshot becomes its own entry, hidden until you publish it. Drop a
          folder, pick any number of files, or paste a screenshot straight from the
          clipboard.
        </p>
        <PhotoUploader
          onUpload={bulkAdd}
          disabled={busy || loading}
          label="Add screenshots as new entries"
          compact
        />
      </div>

      {loading ? (
        <p className="admin-muted">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="admin-muted">No testimonials yet.</p>
      ) : visible.length === 0 ? (
        <p className="admin-muted">
          Nothing matches that filter.{' '}
          <button type="button" className="admin-link-button" onClick={() => setFilter('all')}>
            Show all {entries.length}
          </button>
        </p>
      ) : (
        <div className="testimonial-summary-list">
          {visible.map((entry) => {
            /*
             * The row's position in the FILTERED view, translated back to the
             * real index so a move reorders the actual list. Without this a move
             * while a filter is applied would swap the wrong two entries.
             */
            const realIndex = entries.findIndex((e) => e.id === entry.id);
            const open = openId === entry.id;

            return (
              <div key={entry.id}>
                <TestimonialSummary
                  entry={entry}
                  index={realIndex}
                  total={entries.length}
                  busy={busy}
                  open={open}
                  onToggleOpen={() => setOpenId(open ? null : entry.id)}
                  onMove={move}
                  onRemove={remove}
                  onTogglePublished={(target) =>
                    save(target, { published: !target.published })
                  }
                />

                {open && (
                  <TestimonialRow
                    entry={entry}
                    index={realIndex}
                    total={entries.length}
                    busy={busy}
                    onMove={move}
                    onRemove={remove}
                    onSave={save}
                    onUploadPhoto={uploadPhoto}
                    onUploadScreenshots={uploadScreenshots}
                    onSaveImages={saveImages}
                    onZoom={(imageIndex) =>
                      setZoom({
                        context: entry.name || `Entry ${realIndex + 1}`,
                        images: entry.images,
                        index: imageIndex,
                      })
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/*
        * The section settings stay on the page, below the list.
        *
        * They change how the row BEHAVES (layout, autoplay, arrows, card width),
        * not what it contains, so they are not part of the overview and not part
        * of any single entry. Below the list keeps them available without pushing
        * the list itself off the first screen.
        */}
      <div style={{ marginTop: 'var(--ds-space-8)' }}>
        <SectionSettings
          settings={settings}
          saved={settingsSaved}
          busy={busy}
          onSave={saveSettings}
          totals={{
            entries: entries.length,
            published: publishedCount,
            images: imageCount,
            bytes: 0,
          }}
        />
      </div>

      <PhotoLightbox
        context={zoom?.context}
        index={zoom?.index ?? null}
        onIndex={(next) => {
          /*
           * `null` means "closed". Keeping the last index and merely hiding the
           * overlay would reopen it on the next click, so the state is cleared.
           */
          if (next === null) {
            setZoom(null);
            return;
          }
          setZoom((current) => (current ? { ...current, index: next } : current));
        }}
        items={(zoom?.images ?? []).map((image, imageIndex) => ({
          key: image.id,
          src: image.src,
          caption: image.caption,
          alt: image.caption || `Screenshot ${imageIndex + 1}`,
        }))}
      />
    </>
  );
}

/**
 * The overview — the one plot that answers "what do I have?".
 *
 * ── Why this is not the SectionSettings inventory ───────────────────────
 * That inventory was buried inside the settings form, which is where you go to
 * change how the row behaves, not to find out what is in it. Counting also lived
 * three screens down. So the numbers sit at the top of the page, next to the
 * filters, and each count is also a filter — the number and the way to see the
 * things behind it are the same control.
 */
function Overview({
  totals,
  filter,
  onFilter,
}: {
  totals: {
    entries: number;
    published: number;
    hidden: number;
    noPermission: number;
    images: number;
    empty: number;
  };
  filter: Filter;
  onFilter: (next: Filter) => void;
}) {
  const cards: { key: Filter; label: string; value: number; tone?: string }[] = [
    { key: 'all', label: 'Total', value: totals.entries },
    { key: 'published', label: 'Live', value: totals.published },
    { key: 'hidden', label: 'Hidden', value: totals.hidden },
    { key: 'no-permission', label: 'Live, no permission', value: totals.noPermission, tone: 'warn' },
    { key: 'images', label: 'Images', value: totals.images },
    { key: 'empty', label: 'Empty', value: totals.empty },
  ];

  return (
    <section className="admin-card" aria-labelledby="testimonial-overview">
      <h2 id="testimonial-overview" className="admin-card-title">
        Overview
      </h2>
      <p className="admin-card-desc">
        Every testimonial in the file, published or not. Click a number to show just
        those.
      </p>

      <dl className="admin-totals">
        {cards.map((card) => (
          /*
           * The whole card is the button, not just the label.
           *
           * The number is the biggest thing in the card and therefore the
           * obvious target, so making only the small caption clickable means the
           * most-likely click does nothing. One button wrapping both keeps the
           * definition list intact and gives the card a single focus stop.
           */
          <div
            key={card.key}
            className={`admin-total-card${filter === card.key ? ' is-active' : ''}${
              card.tone === 'warn' && card.value > 0 ? ' is-warn' : ''
            }`}
          >
            <dt>
              <button
                type="button"
                className="admin-total-button"
                onClick={() => onFilter(card.key)}
                aria-pressed={filter === card.key}
                aria-label={`Show ${card.label.toLowerCase()} (${card.value})`}
              >
                <span className="admin-total-label">{card.label}</span>
                <span className="admin-total-value">{card.value}</span>
              </button>
            </dt>
          </div>
        ))}
      </dl>

      {filter !== 'all' && (
        <p className="admin-hint">
          Showing {filter === 'no-permission' ? 'entries with no recorded permission' : filter} —
          {' '}
          <button type="button" className="admin-link-button" onClick={() => onFilter('all')}>
            show all {totals.entries}
          </button>
        </p>
      )}
    </section>
  );
}

/** Which subset of the list is shown. */
type Filter = 'all' | 'published' | 'hidden' | 'no-permission' | 'images' | 'empty';

/**
 * One testimonial, as a single line — the default view.
 *
 * ── Why the editor is behind a disclosure ───────────────────────────────
 * Every entry used to render its whole form: five text fields, a file picker, a
 * photo preview, a path field, a screenshot uploader with a crop editor per
 * image, a module select and three checkboxes. Twenty-four entries made the page
 * roughly forty screens tall, so answering "how many testimonials do I have and
 * which one is live" — the question an operator actually arrives with — meant
 * scrolling all of it.
 *
 * So the list is a scannable index: state, who said it, a preview of the quote,
 * how many images, and the two actions worth having on the row (publish and
 * delete). The editor is one click away and only one is ever open.
 *
 * ── Why publish and delete stay on the row ──────────────────────────────
 * They are the two actions an operator performs in bulk — turning things on and
 * removing them — and burying either inside a disclosure would mean opening a
 * form to do the one thing the list exists for.
 */
function TestimonialSummary({
  entry,
  index,
  total,
  busy,
  open,
  onToggleOpen,
  onMove,
  onRemove,
  onTogglePublished,
}: {
  entry: Testimonial;
  index: number;
  total: number;
  busy: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onMove: (index: number, delta: number) => void;
  onRemove: (id: string) => void;
  onTogglePublished: (entry: Testimonial) => void;
}) {
  /*
   * What identifies the card at a glance. A screenshot-only entry has no name,
   * so the fallback names the position — otherwise a list of forty blank rows
   * is impossible to tell apart.
   */
  const title = entry.name.trim() !== '' ? entry.name : `Entry ${index + 1}`;
  const subtitle = [entry.role, entry.company].filter((v) => v.trim() !== '').join(' · ');
  const quote = entry.quote.replace(/\s+/g, ' ').trim();
  const images = entry.images.length;

  return (
    <li className={`testimonial-summary${open ? ' is-open' : ''}`}>
      <div className="testimonial-summary-row">
        <button
          type="button"
          className="testimonial-summary-main"
          onClick={onToggleOpen}
          aria-expanded={open}
          aria-label={`${open ? 'Close' : 'Open'} ${title}`}
        >
          <span
            className={`testimonial-summary-dot ${entry.published ? 'is-live' : 'is-hidden'}`}
            aria-hidden="true"
          />
          <span className="testimonial-summary-text">
            <span className="testimonial-summary-title">
              {title}
              {!entry.consentOnFile && (
                <span className="admin-badge admin-badge-locked">No permission</span>
              )}
            </span>
            <span className="testimonial-summary-meta">
              {subtitle || (quote ? '' : 'No name, quote or screenshot yet')}
              {subtitle && quote ? ' · ' : ''}
              {quote.length > 90 ? `${quote.slice(0, 90)}…` : quote}
            </span>
          </span>
          <span className="testimonial-summary-tags">
            {images > 0 && (
              <span className="admin-badge admin-badge-locked">
                {images} {images === 1 ? 'image' : 'images'}
              </span>
            )}
            <span className="admin-badge admin-badge-locked">
              {entry.published ? 'Live' : 'Hidden'}
            </span>
          </span>
        </button>

        <div className="testimonial-summary-actions">
          <button
            type="button"
            className="admin-icon-button"
            aria-label={`Move ${title} up`}
            disabled={busy || index === 0}
            onClick={() => onMove(index, -1)}
          >
            ↑
          </button>
          <button
            type="button"
            className="admin-icon-button"
            aria-label={`Move ${title} down`}
            disabled={busy || index === total - 1}
            onClick={() => onMove(index, 1)}
          >
            ↓
          </button>
          <button
            type="button"
            className="admin-button admin-button-secondary admin-button-small"
            disabled={busy}
            onClick={() => onTogglePublished(entry)}
          >
            {entry.published ? 'Unpublish' : 'Publish'}
          </button>
          <button
            type="button"
            className="admin-icon-button admin-icon-danger"
            aria-label={`Delete ${title}`}
            disabled={busy}
            onClick={() => onRemove(entry.id)}
          >
            ✕
          </button>
        </div>
      </div>
    </li>
  );
}

/**
 * One testimonial, as a full editor.
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
  onUploadScreenshots,
  onSaveImages,
  onZoom,
}: {
  entry: Testimonial;
  index: number;
  total: number;
  busy: boolean;
  onMove: (index: number, delta: number) => void;
  onRemove: (id: string) => void;
  onSave: (entry: Testimonial, fields: Partial<Testimonial>) => void;
  onUploadPhoto: (entry: Testimonial, file: File) => void;
  onUploadScreenshots: (
    entry: Testimonial,
    files: File[],
  ) => Promise<{ ok: boolean; error?: string; errors?: string[] }>;
  onSaveImages: (entry: Testimonial, images: TestimonialImage[]) => void;
  onZoom: (imageIndex: number) => void;
}) {
  const [name, setName] = useState(entry.name);
  const [role, setRole] = useState(entry.role);
  const [company, setCompany] = useState(entry.company);
  const [quote, setQuote] = useState(entry.quote);
  const [photo, setPhoto] = useState(entry.photo);

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


  return (
    <div className="testimonial-editor">
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

        {/* ── Feedback screenshots ────────────────────────────────────── */}
        <p className="admin-label">
          Feedback screenshots ({entry.images.length})
        </p>
        <p className="admin-hint">
          Screenshot asal daripada WhatsApp, email atau platform lain. Tiada had
          bilangan — pilih banyak fail sekali gus. Setiap satu ada caption dan
          crop sendiri.
        </p>
        <PhotoUploader
          onUpload={(files) => onUploadScreenshots(entry, files)}
          disabled={busy}
          label="Add screenshots to this entry"
          compact
        />

        {entry.images.length > 0 && (
          <ul className="admin-image-list">
            {entry.images.map((image, imageIndex) => (
              <ImageRow
                key={image.id}
                image={image}
                index={imageIndex}
                total={entry.images.length}
                busy={busy}
                onSave={(next) =>
                  onSaveImages(
                    entry,
                    entry.images.map((item) => (item.id === image.id ? next : item)),
                  )
                }
                onRemove={() =>
                  onSaveImages(
                    entry,
                    entry.images.filter((item) => item.id !== image.id),
                  )
                }
                onZoom={() => onZoom(imageIndex)}
                onMove={(delta) => {
                  const target = imageIndex + delta;
                  if (target < 0 || target >= entry.images.length) return;
                  const next = [...entry.images];
                  const [moved] = next.splice(imageIndex, 1);
                  if (!moved) return;
                  next.splice(target, 0, moved);
                  void onSaveImages(entry, next);
                }}
              />
            ))}
          </ul>
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
            checked={entry.consentOnFile}
            disabled={busy}
            onChange={(e) => onSave(entry, { consentOnFile: e.target.checked })}
          />
          <span className="admin-muted">
            <strong>Permission on file</strong> — this person has agreed, in
            writing or by message, to this quote, this photo and this company
            name appearing on the site.
          </span>
        </label>

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

        {/*
          * Stated next to the toggle, not only in the notice at the top of the
          * page: this is the one field that can stop a save, and an operator who
          * meets the refusal here needs to know why without scrolling back.
          */}
        {!entry.consentOnFile && (
          <p className="admin-hint">
            Publishing is blocked until permission is recorded. Without it, a
            quote in a named person&rsquo;s mouth is a defamation exposure, the
            photo is personal data under PDPA 2010, and the quote is a
            representation under the Consumer Protection Act 1999.
          </p>
        )}
    </div>
  );
}

/**
 * One image inside a testimonial: preview, caption, frame shape and crop.
 *
 * ── Why the crop editor is collapsed behind a toggle ────────────────────
 * An entry can hold ten images. Ten always-open drag editors make the page
 * several screens long and push the fields that matter (name, quote, publish)
 * far apart. The preview shows what will appear; the editor is opened only for
 * the image that needs adjusting.
 */
function ImageRow({
  image,
  index,
  total,
  busy,
  onSave,
  onRemove,
  onMove,
  onZoom,
}: {
  image: TestimonialImage;
  index: number;
  total: number;
  busy: boolean;
  onSave: (next: TestimonialImage) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
  onZoom: () => void;
}) {
  const [caption, setCaption] = useState(image.caption);
  const [editing, setEditing] = useState(false);

  /* Follow the stored value after a save or a reload. */
  useEffect(() => {
    setCaption(image.caption);
  }, [image.caption]);

  return (
    <li className="admin-image-row">
      <div className="admin-image-row-head">
        <span className="admin-image-row-index">{index + 1}</span>

        <button
          type="button"
          className="admin-icon-button"
          aria-label={`Move image ${index + 1} earlier`}
          disabled={busy || index === 0}
          onClick={() => onMove(-1)}
        >
          ↑
        </button>
        <button
          type="button"
          className="admin-icon-button"
          aria-label={`Move image ${index + 1} later`}
          disabled={busy || index === total - 1}
          onClick={() => onMove(1)}
        >
          ↓
        </button>

        <button
          type="button"
          className="admin-icon-button admin-icon-danger"
          aria-label={`Remove image ${index + 1}`}
          disabled={busy}
          onClick={onRemove}
        >
          ✕
        </button>
      </div>

      {/* A clickable preview: checking a screenshot is the point of this row, so
          the thumbnail opens the full-size viewer rather than being decoration. */}
      <button
        type="button"
        className="admin-image-row-zoom"
        onClick={onZoom}
        aria-label={`View screenshot ${index + 1} full size`}
        title="Click to view full size"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="admin-image-row-thumb" src={image.src} alt={`Image ${index + 1}`} />
      </button>

      <div className="admin-image-row-fields">
        <label className="admin-label" htmlFor={`cap-${image.id}`}>
          Caption (optional)
        </label>
        <input
          id={`cap-${image.id}`}
          className="admin-input"
          type="text"
          value={caption}
          disabled={busy}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => caption !== image.caption && onSave({ ...image, caption })}
        />

        <label className="admin-label" htmlFor={`asp-${image.id}`}>
          Frame
        </label>
        <select
          id={`asp-${image.id}`}
          className="admin-input"
          value={image.crop === null ? image.aspect : 'cropped'}
          disabled={busy}
          onChange={(e) => {
            const value = e.target.value;
            /*
             * Choosing a preset clears a hand-drawn crop. Keeping both would mean
             * the crop silently wins and the preset appears not to work.
             */
            if (value === 'cropped') {
              setEditing(true);
              return;
            }
            onSave({ ...image, aspect: value as TestimonialImage['aspect'], crop: null });
          }}
        >
          <option value="auto">Auto — the image&apos;s own shape</option>
          <option value="portrait">Portrait (4:5)</option>
          <option value="square">Square (1:1)</option>
          <option value="landscape">Landscape (16:9)</option>
          {image.crop !== null && <option value="cropped">Hand-drawn crop</option>}
        </select>

        <button
          type="button"
          className="admin-button admin-button-secondary"
          disabled={busy}
          style={{ marginTop: 'var(--ds-space-3)' }}
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? 'Close crop editor' : image.crop ? 'Edit crop' : 'Crop by hand'}
        </button>

        {editing && (
          <>
            <CropEditor
              src={image.src}
              crop={image.crop}
              /* Not disabled while saving — see the note in CategorySection. */
              onChange={() => {
                /* Visual state is local; only the commit persists. */
              }}
              onCommit={(next) => onSave({ ...image, crop: next })}
            />
            {image.crop !== null && (
              <button
                type="button"
                className="admin-button admin-button-secondary"
                disabled={busy}
                onClick={() => onSave({ ...image, crop: null })}
              >
                Clear crop
              </button>
            )}
          </>
        )}
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
