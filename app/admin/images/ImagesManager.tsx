'use client';

/**
 * Admin — image manager.
 *
 * ── Why this is a client component ──────────────────────────────────────
 * It holds per-slot upload state (idle / uploading / done / error) and file
 * input refs. A server component can do neither.
 *
 * ── Why upload and save are two separate steps ──────────────────────────
 * Uploading puts the bytes in storage and returns a path. Saving writes that
 * path into the content module and commits it. They are separate because an
 * upload can fail (network, size, type) without invalidating the rest of the
 * form, and because committing on every file selection would produce one commit
 * per image instead of one per deliberate save.
 */

import { useEffect, useRef, useState } from 'react';

import { IMAGE_SLOTS, type ImageSlotName } from '@/lib/admin/image-slots';

type Status = 'idle' | 'uploading' | 'saved' | 'error';

/** The keys the images group stores, in panel order. */
const SLOTS = Object.keys(IMAGE_SLOTS) as ImageSlotName[];

export default function ImagesManager() {
  const [paths, setPaths] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ tone: 'ok' | 'error'; text: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load the current paths from the images content group.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/admin/content?group=images');
        const body = (await response.json()) as {
          ok?: boolean;
          data?: { values?: Record<string, string> };
        };
        if (!cancelled && body.ok && body.data?.values) {
          setPaths(body.data.values);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function upload(slot: ImageSlotName, file: File) {
    setStatus((s) => ({ ...s, [slot]: 'uploading' }));
    setMessages((m) => ({ ...m, [slot]: '' }));

    const form = new FormData();
    form.set('slot', slot);
    form.set('file', file);

    try {
      const response = await fetch('/api/admin/images', { method: 'POST', body: form });
      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
        data?: { path?: string; key?: string; message?: string };
      };

      if (!response.ok || !body.ok || !body.data?.path) {
        setStatus((s) => ({ ...s, [slot]: 'error' }));
        setMessages((m) => ({ ...m, [slot]: body.error ?? 'Upload failed.' }));
        return;
      }

      const key = body.data.key;
      const nextPath = body.data.path;
      if (key) setPaths((p) => ({ ...p, [key]: nextPath }));
      setStatus((s) => ({ ...s, [slot]: 'saved' }));
      setMessages((m) => ({ ...m, [slot]: body.data?.message ?? 'Uploaded.' }));
    } catch {
      setStatus((s) => ({ ...s, [slot]: 'error' }));
      setMessages((m) => ({ ...m, [slot]: 'Could not reach the server.' }));
    }
  }

  async function saveAll() {
    setSaving(true);
    setBanner(null);
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: 'images', values: paths }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
        data?: { message?: string };
      };
      if (!response.ok || !body.ok) {
        setBanner({ tone: 'error', text: body.error ?? 'Save failed.' });
      } else {
        setBanner({ tone: 'ok', text: body.data?.message ?? 'Saved.' });
      }
    } catch {
      setBanner({ tone: 'error', text: 'Could not reach the server.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1 className="admin-title">Images</h1>
      <p className="admin-lede">
        Upload a file for any position, then save to publish the new paths. Each
        frame shows a brand gradient until a file exists, so the page never
        renders a broken image.
      </p>

      {banner && (
        <div
          className={`admin-notice admin-notice-${banner.tone === 'ok' ? 'ok' : 'error'}`}
          role="status"
        >
          {banner.text}
        </div>
      )}

      {loading ? (
        <p className="admin-muted">Loading current images…</p>
      ) : (
        <>
          <div className="admin-image-grid">
            {SLOTS.map((slot) => {
              const spec = IMAGE_SLOTS[slot];
              const path = paths[spec.key] ?? '';
              const state = status[slot] ?? 'idle';
              const message = messages[slot] ?? '';

              return (
                <section className="admin-card" key={slot}>
                  <h2 className="admin-card-title">{spec.label}</h2>
                  <p className="admin-card-desc">
                    {spec.width}×{spec.height} recommended
                  </p>

                  <div className="admin-image-preview">
                    {path ? (
                      // A plain <img>: operator uploads at unknown dimensions on
                      // an internal page, so the optimiser has nothing to work
                      // from and would need a loader configured for the R2 host.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={path} alt={`${spec.label} preview`} />
                    ) : (
                      <div className="admin-image-empty">No image yet</div>
                    )}
                  </div>

                  <p className="admin-image-path">{path || 'not set'}</p>

                  <div className="admin-actions">
                    <input
                      ref={(el) => {
                        refs.current[slot] = el;
                      }}
                      className="admin-omit"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void upload(slot, file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      className="admin-button admin-button-secondary"
                      disabled={state === 'uploading'}
                      onClick={() => refs.current[slot]?.click()}
                    >
                      {state === 'uploading'
                        ? 'Uploading…'
                        : path
                          ? 'Replace image'
                          : 'Upload image'}
                    </button>
                  </div>

                  {message && (
                    <p
                      className={state === 'error' ? 'admin-error' : 'admin-muted'}
                      role={state === 'error' ? 'alert' : undefined}
                    >
                      {message}
                    </p>
                  )}
                </section>
              );
            })}
          </div>

          <div className="admin-actions" style={{ marginTop: 'var(--ds-space-8)' }}>
            <button
              type="button"
              className="admin-button"
              onClick={saveAll}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save image paths'}
            </button>
          </div>
        </>
      )}
    </>
  );
}
