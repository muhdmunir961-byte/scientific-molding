'use client';

/**
 * Admin — content editor.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  A GENERIC EDITOR OVER A MODULE'S ACTUAL VALUE
 *
 *  The editor does not know what a "testimonial" or a "stat figure" is. It
 *  fetches a module export's current value — a string, an array of objects, a
 *  nested object — and renders inputs that match the shape it finds:
 *
 *    string   → text input (or textarea when long)
 *    number   → number input
 *    boolean  → checkbox
 *    array    → repeatable group, with add / remove / reorder
 *    object   → nested fieldset
 *
 *  Adding a field to a content module therefore makes it editable with no change
 *  to this file. Hand-writing a form per module was the alternative and it is
 *  how a field ends up rendering but never saving.
 *
 *  ── Why arrays are replaced, not merged, on save ────────────────────────
 *  The whole export is saved as one value. Element-wise merging would need a
 *  stable identity per element to pair a saved entry with its default, and these
 *  arrays carry titles rather than ids — pairing by index would silently
 *  re-pair content when an item is inserted.
 * ════════════════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useState } from 'react';

import { allModules } from '@/lib/admin/schema';

/*
 * The dropdown lists every module, in page order, with the programme bodies
 * grouped after the site chrome. `allModules()` is the single source so the
 * dropdown and the overview page cannot disagree about what exists.
 */
const MODULE_OPTIONS = allModules();

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface ExportPayload {
  name: string;
  label: string;
  description: string;
  locked: boolean;
  value: JsonValue | null;
  hasOverride: boolean;
}

interface ModulePayload {
  id: string;
  title: string;
  description: string;
  editable: boolean;
  exports: ExportPayload[];
}

/** Longest string that still reads as a single-line input. */
const TEXTAREA_THRESHOLD = 80;

/** Turn `camelCase` / `snake_case` into a readable label. */
function humanise(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

export default function ContentEditor() {
  const [moduleId, setModuleId] = useState<string>(MODULE_OPTIONS[0]?.id ?? 'hero');
  const [payload, setPayload] = useState<ModulePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setMeta(null);
    try {
      const response = await fetch(`/api/admin/content?module=${encodeURIComponent(id)}`);
      const body = (await response.json()) as { ok?: boolean; data?: ModulePayload; error?: string };
      if (body.ok && body.data) setPayload(body.data);
      else setMeta({ tone: 'error', text: body.error ?? 'Could not load this module.' });
    } catch {
      setMeta({ tone: 'error', text: 'Could not reach the server.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('module');
    const initial =
      fromUrl && MODULE_OPTIONS.some((m) => m.id === fromUrl) ? fromUrl : moduleId;
    setModuleId(initial);
    void load(initial);
    // Runs once; the module is then driven by the selector.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h1 className="admin-title">Content</h1>
      <p className="admin-lede">
        Edit the text on the page. Saving commits to the repository and the site
        redeploys automatically.
      </p>

      <div className="admin-field">
        <label className="admin-label" htmlFor="module-select">
          Section
        </label>
        <select
          id="module-select"
          className="admin-input"
          value={moduleId}
          onChange={(e) => {
            setModuleId(e.target.value);
            void load(e.target.value);
          }}
        >
          {MODULE_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      </div>

      {meta && (
        <div className={`admin-notice admin-notice-${meta.tone}`} role="status">
          {meta.text}
        </div>
      )}

      {loading || !payload ? (
        <p className="admin-muted">Loading…</p>
      ) : (
        <>
          <p className="admin-lede">{payload.description}</p>

          {payload.exports.map((item) => (
            <ExportEditor
              key={item.name}
              moduleId={payload.id}
              item={item}
              onSaved={(text) => setMeta({ tone: 'ok', text })}
              onError={(text) => setMeta({ tone: 'error', text })}
            />
          ))}
        </>
      )}
    </>
  );
}

/**
 * One editable export.
 *
 * Holds the draft value, renders it by shape, and saves the whole value back.
 * The draft is local state so a failed save does not lose the edit — the panel
 * reports what went wrong and leaves the operator's work on screen.
 */
function ExportEditor({
  moduleId,
  item,
  onSaved,
  onError,
}: {
  moduleId: string;
  item: ExportPayload;
  onSaved: (text: string) => void;
  onError: (text: string) => void;
}) {
  const [draft, setDraft] = useState<JsonValue>(item.value ?? '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: moduleId, export: item.name, value: draft }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
        data?: { message?: string };
      };
      if (!response.ok || !body.ok) {
        onError(body.error ?? 'Save failed.');
        return;
      }
      setDirty(false);
      onSaved(`${item.label}: ${body.data?.message ?? 'Saved.'}`);
    } catch {
      onError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-card">
      <h2 className="admin-card-title">
        {item.label}
        {item.hasOverride && <span className="admin-badge">edited</span>}
        {item.locked && <span className="admin-badge admin-badge-locked">read-only</span>}
      </h2>
      <p className="admin-card-desc">{item.description}</p>

      {item.locked ? (
        <pre className="admin-json-readonly">{JSON.stringify(item.value, null, 2)}</pre>
      ) : (
        <>
          <ValueEditor
            value={draft}
            onChange={(next) => {
              setDraft(next);
              setDirty(true);
            }}
          />

          <div className="admin-actions">
            <button
              type="button"
              className="admin-button"
              onClick={save}
              disabled={saving || !dirty}
            >
              {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
            </button>
            {dirty && (
              <button
                type="button"
                className="admin-button admin-button-secondary"
                onClick={() => {
                  setDraft(item.value ?? '');
                  setDirty(false);
                }}
                disabled={saving}
              >
                Discard
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Render inputs for whatever shape the value has.
 *
 * This recursion is the whole reason the editor scales: a value of any depth is
 * editable without a description of it existing anywhere. Hand-writing a form
 * per module was the alternative, and it is how a field ends up rendering but
 * never saving.
 */
function ValueEditor({
  value,
  onChange,
  depth = 0,
}: {
  value: JsonValue;
  onChange: (next: JsonValue) => void;
  depth?: number;
}) {
  if (typeof value === 'string') {
    const long = value.length > TEXTAREA_THRESHOLD || value.includes('\n');
    return long ? (
      <textarea
        className="admin-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={Math.min(8, Math.max(3, Math.ceil(value.length / 70)))}
      />
    ) : (
      <input
        className="admin-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (typeof value === 'number') {
    return (
      <input
        className="admin-input"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  }

  if (typeof value === 'boolean') {
    return (
      <label className="admin-checkbox">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="admin-muted">{value ? 'Yes' : 'No'}</span>
      </label>
    );
  }

  if (value === null) return <p className="admin-muted">(empty)</p>;

  if (Array.isArray(value)) {
    return (
      <div className="admin-array">
        {value.map((item, index) => (
          <div className="admin-array-item" key={index}>
            <div className="admin-array-head">
              <span className="admin-array-index">#{index + 1}</span>
              <div className="admin-array-tools">
                <button
                  type="button"
                  className="admin-icon-button"
                  aria-label={`Move item ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...value];
                    const moved = next.splice(index, 1)[0];
                    next.splice(index - 1, 0, moved as JsonValue);
                    onChange(next);
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="admin-icon-button"
                  aria-label={`Move item ${index + 1} down`}
                  disabled={index === value.length - 1}
                  onClick={() => {
                    const next = [...value];
                    const moved = next.splice(index, 1)[0];
                    next.splice(index + 1, 0, moved as JsonValue);
                    onChange(next);
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="admin-icon-button admin-icon-danger"
                  aria-label={`Remove item ${index + 1}`}
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                >
                  ✕
                </button>
              </div>
            </div>

            <ValueEditor
              value={item}
              depth={depth + 1}
              onChange={(next) => onChange(value.map((v, i) => (i === index ? next : v)))}
            />
          </div>
        ))}

        {value.length > 0 && (
          <button
            type="button"
            className="admin-button admin-button-secondary admin-button-small"
            onClick={() => onChange([...value, cloneShape(value[0])])}
          >
            + Add item
          </button>
        )}
      </div>
    );
  }

  // A plain object: one labelled field per key.
  return (
    <fieldset className="admin-object">
      {Object.entries(value).map(([key, child]) => (
        <div className="admin-object-field" key={key}>
          <label className="admin-label">{humanise(key)}</label>
          <ValueEditor
            value={child}
            depth={depth + 1}
            onChange={(next) => onChange({ ...value, [key]: next })}
          />
        </div>
      ))}
    </fieldset>
  );
}

/**
 * A blank value matching an existing item's shape.
 *
 * Copying the shape rather than guessing means "add item" produces something the
 * renderer and the content module can both consume — a hardcoded `''` would break
 * the moment an array holds objects, which most of them do.
 * @param {JsonValue|undefined} sample
 * @returns {JsonValue}
 */
function cloneShape(sample: JsonValue | undefined): JsonValue {
  if (sample === undefined) return '';
  if (typeof sample === 'string') return '';
  if (typeof sample === 'number') return 0;
  if (typeof sample === 'boolean') return false;
  if (sample === null) return '';
  if (Array.isArray(sample)) return [];
  const out: Record<string, JsonValue> = {};
  for (const [k, v] of Object.entries(sample)) out[k] = cloneShape(v);
  return out;
}
