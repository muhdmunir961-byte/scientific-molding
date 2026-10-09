'use client';

/**
 * Admin — content editor.
 *
 * One form, driven entirely by `lib/admin/schema.ts`. Adding an editable field
 * is one entry in the schema and nothing here changes, which is the point of
 * the declarative approach.
 *
 * ── Why the group is chosen from a list rather than routed ──────────────
 * A query parameter (`/admin/content?group=hero`) keeps this a single client
 * component and a single API endpoint. A dynamic route segment per group would
 * mean four near-identical pages.
 */

import { useCallback, useEffect, useState } from 'react';

import { CONTENT_GROUPS } from '@/lib/admin/schema';

interface FieldSpec {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'number';
  hint?: string;
  maxLength?: number;
  warnLength?: number;
}

interface GroupPayload {
  id: string;
  title: string;
  description: string;
  fields: FieldSpec[];
  values: Record<string, string>;
}

export default function ContentEditor() {
  const [groupId, setGroupId] = useState<string>(CONTENT_GROUPS[0]?.id ?? 'hero');
  const [group, setGroup] = useState<GroupPayload | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ tone: 'ok' | 'error'; text: string } | null>(
    null,
  );

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setBanner(null);
    setErrors({});
    try {
      const response = await fetch(`/api/admin/content?group=${encodeURIComponent(id)}`);
      const body = (await response.json()) as { ok?: boolean; data?: GroupPayload };
      if (body.ok && body.data) {
        setGroup(body.data);
        setValues(body.data.values);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Read the initial group from the URL so a link into a specific group works.
    const fromUrl = new URLSearchParams(window.location.search).get('group');
    const initial = fromUrl && CONTENT_GROUPS.some((g) => g.id === fromUrl) ? fromUrl : groupId;
    setGroupId(initial);
    void load(initial);
    // Intentionally runs once: the group is then driven by the selector.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectGroup(id: string) {
    setGroupId(id);
    void load(id);
  }

  async function save() {
    if (!group) return;
    setSaving(true);
    setBanner(null);
    setErrors({});

    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: group.id, values }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
        errors?: Record<string, string>;
        data?: { message?: string };
      };

      if (!response.ok || !body.ok) {
        if (body.errors) setErrors(body.errors);
        setBanner({ tone: 'error', text: body.error ?? 'Save failed.' });
        return;
      }

      setBanner({ tone: 'ok', text: body.data?.message ?? 'Saved.' });
    } catch {
      setBanner({ tone: 'error', text: 'Could not reach the server.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1 className="admin-title">Content</h1>
      <p className="admin-lede">
        Choose a group, edit the fields, then save. Saving commits the change to
        the repository and the site redeploys automatically.
      </p>

      <div className="admin-field">
        <label className="admin-label" htmlFor="group-select">
          Content group
        </label>
        <select
          id="group-select"
          className="admin-input"
          value={groupId}
          onChange={(e) => selectGroup(e.target.value)}
        >
          {CONTENT_GROUPS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>

      {banner && (
        <div
          className={`admin-notice admin-notice-${banner.tone === 'ok' ? 'ok' : 'error'}`}
          role="status"
        >
          {banner.text}
        </div>
      )}

      {loading || !group ? (
        <p className="admin-muted">Loading…</p>
      ) : (
        <section className="admin-card">
          <h2 className="admin-card-title">{group.title}</h2>
          <p className="admin-card-desc">{group.description}</p>

          {group.fields.map((field) => {
            const error = errors[field.key];
            const value = values[field.key] ?? '';

            return (
              <div className="admin-field" key={field.key}>
                <label className="admin-label" htmlFor={`field-${field.key}`}>
                  {field.label}
                </label>

                {field.hint && <p className="admin-hint">{field.hint}</p>}

                {field.type === 'textarea' ? (
                  <textarea
                    id={`field-${field.key}`}
                    className="admin-textarea"
                    value={value}
                    aria-invalid={error ? 'true' : 'false'}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    id={`field-${field.key}`}
                    className="admin-input"
                    type="text"
                    value={value}
                    aria-invalid={error ? 'true' : 'false'}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                  />
                )}

                {field.maxLength && (
                  <p className="admin-hint">
                    {value.length} / {field.maxLength} characters
                    {field.warnLength && value.length > field.warnLength
                      ? ' — getting long; check how it wraps on the page'
                      : ''}
                  </p>
                )}

                {error && <p className="admin-error">{error}</p>}
              </div>
            );
          })}

          <div className="admin-actions">
            <button
              type="button"
              className="admin-button"
              onClick={save}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
