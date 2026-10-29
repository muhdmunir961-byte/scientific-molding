'use client';

/**
 * Section settings — how the row behaves, as opposed to what it says.
 *
 * ── Why this is a separate form from the entries ────────────────────────
 * Entries save on blur, one field at a time, because they are independent
 * records. These settings are one configuration: changing the card width and
 * the autoplay delay together is a single intent, and saving them separately
 * would leave the page in a half-applied state between the two requests.
 *
 * So this form has one Save button and sends all of it, which is also why the
 * route replaces rather than merges.
 */

import { useEffect, useState } from 'react';

import {
  DEFAULT_TESTIMONIALS_SETTINGS,
  SETTINGS_LIMITS,
  type TestimonialsSettings,
} from '@/lib/testimonials';

export default function SectionSettings({
  settings,
  saved,
  busy,
  onSave,
}: {
  settings: TestimonialsSettings;
  saved: boolean;
  busy: boolean;
  onSave: (next: TestimonialsSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);

  /* Follow the stored value when it changes underneath us (a save, a reload). */
  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  function set<K extends keyof TestimonialsSettings>(key: K, value: TestimonialsSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="admin-card" aria-labelledby="section-settings-heading">
      <h2 id="section-settings-heading" className="admin-card-title">
        How the row behaves
      </h2>
      <p className="admin-card-desc">
        These change the section on the live site. Entries above are unaffected.
        {!saved && ' This file has no saved settings yet — these are the defaults.'}
      </p>

      <div className="settings-grid">
        <label className="settings-field">
          <span className="admin-label">Layout</span>
          <select
            className="admin-input"
            value={draft.layout}
            disabled={busy}
            onChange={(e) => set('layout', e.target.value === 'grid' ? 'grid' : 'slider')}
          >
            <option value="slider">Slider — scrolls sideways</option>
            <option value="grid">Grid — wraps into rows</option>
          </select>
        </label>

        <label className="settings-field">
          <span className="admin-label">
            Card width: {draft.cardWidth}px
          </span>
          <input
            className="admin-input"
            type="range"
            min={SETTINGS_LIMITS.cardWidth.min}
            max={SETTINGS_LIMITS.cardWidth.max}
            step={10}
            value={draft.cardWidth}
            disabled={busy}
            onChange={(e) => set('cardWidth', Number(e.target.value))}
          />
        </label>

        <label className="settings-field">
          <span className="admin-label">
            Autoplay delay: {draft.autoplaySeconds}s
          </span>
          <input
            className="admin-input"
            type="range"
            min={SETTINGS_LIMITS.autoplaySeconds.min}
            max={SETTINGS_LIMITS.autoplaySeconds.max}
            step={1}
            value={draft.autoplaySeconds}
            disabled={busy || !draft.autoplay}
            onChange={(e) => set('autoplaySeconds', Number(e.target.value))}
          />
        </label>

        <label className="settings-field">
          <span className="admin-label">Default image frame</span>
          <select
            className="admin-input"
            value={draft.imageAspect}
            disabled={busy}
            onChange={(e) => set('imageAspect', e.target.value as TestimonialsSettings['imageAspect'])}
          >
            <option value="auto">Auto — each image&apos;s own shape</option>
            <option value="portrait">Portrait (4:5)</option>
            <option value="square">Square (1:1)</option>
            <option value="landscape">Landscape (16:9)</option>
          </select>
          <p className="admin-hint">
            Used only for images without a hand-drawn crop.
          </p>
        </label>
      </div>

      <div className="settings-toggles">
        <Toggle
          label="Scroll on its own"
          hint="Pauses when the visitor hovers, focuses or prefers reduced motion."
          checked={draft.autoplay}
          disabled={busy}
          onChange={(v) => set('autoplay', v)}
        />
        <Toggle
          label="Show arrows"
          hint="Previous and next buttons under the row."
          checked={draft.arrows}
          disabled={busy || draft.layout === 'grid'}
          onChange={(v) => set('arrows', v)}
        />
        <Toggle
          label="Show position dots"
          hint="One dot per card, clickable."
          checked={draft.dots}
          disabled={busy || draft.layout === 'grid'}
          onChange={(v) => set('dots', v)}
        />
        <Toggle
          label="Click to enlarge"
          hint="A screenshot opens full size in an overlay."
          checked={draft.lightbox}
          disabled={busy}
          onChange={(v) => set('lightbox', v)}
        />
      </div>

      <div className="admin-actions">
        <button
          type="button"
          className="admin-button"
          disabled={busy || !dirty}
          onClick={() => onSave(draft)}
        >
          {busy ? 'Saving…' : 'Save settings'}
        </button>
        <button
          type="button"
          className="admin-button admin-button-secondary"
          disabled={busy || !dirty}
          onClick={() => setDraft(settings)}
        >
          Discard changes
        </button>
        <button
          type="button"
          className="admin-button admin-button-secondary"
          disabled={busy}
          onClick={() => setDraft(DEFAULT_TESTIMONIALS_SETTINGS)}
        >
          Reset to defaults
        </button>
      </div>
    </section>
  );
}

/** A labelled checkbox with an explanation underneath. */
function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="settings-toggle">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
    </label>
  );
}