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

import { IMAGE_SLOTS, slotsByGroup, type ImageSlotName } from '@/lib/admin/image-slots';
import { MODULES, PHOTO_CATEGORIES, type PhotoCategory } from '@/lib/modules';
import type { GalleryFile } from '@/lib/gallery';

type Status = 'idle' | 'uploading' | 'saved' | 'error';

function previewUrl(path: string, version: number): string {
  if (!path || !version) return path;
  return `${path}${path.includes('?') ? '&' : '?'}adminPreview=${version}`;
}

/** The slots, already grouped by where they appear on the page. */
const SLOT_GROUPS = slotsByGroup();

export default function ImagesManager() {
  const [paths, setPaths] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ tone: 'ok' | 'error'; text: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [previewVersions, setPreviewVersions] = useState<Record<string, number>>({});
  const [galleries, setGalleries] = useState<GalleryFile>({});
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const totalModulePhotos = Object.values(galleries).reduce(
    (total, gallery) => total + PHOTO_CATEGORIES.reduce(
      (subtotal, category) => subtotal + (gallery?.[category.slug as PhotoCategory]?.length ?? 0),
      0,
    ),
    0,
  );

  // Load the current paths from the images manifest.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        /*
         * `module=images`, not `group=images`.
         *
         * The parameter was renamed from `group` to `module` when the schema
         * stopped describing fields and started describing modules, and this
         * call site kept the old name. The API saw no `module`, returned the
         * module LIST, and the page read `undefined` from it — which is what
         * produced the "Unknown module \"\"" error on screen.
         */
        const response = await fetch(`/api/admin/images?manifest=1&t=${Date.now()}`, {
          cache: 'no-store',
        });
        const body = (await response.json()) as {
          ok?: boolean;
          error?: string;
          data?: { values?: Record<string, string>; galleries?: GalleryFile };
        };

        if (cancelled) return;

        if (!response.ok || !body.ok) {
          setBanner({
            tone: 'error',
            text: body.error ?? 'Could not load the current images.',
          });
          return;
        }

        setPaths(body.data?.values ?? {});
        setGalleries(body.data?.galleries ?? {});
      } catch {
        if (!cancelled) {
          setBanner({ tone: 'error', text: 'Could not reach the server.' });
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
      if (key) {
        setPaths((p) => ({ ...p, [key]: nextPath }));
        setPreviewVersions((v) => ({ ...v, [key]: Date.now() }));
      }
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
        Upload a file for any position. Uploads are stored first; click Save image
        paths to commit the manifest to GitHub so the next Coolify deploy keeps
        them. Existing uploads are loaded from the current manifest on every visit.
      </p>

      {!loading && (
        <div className="admin-image-summary" aria-label="Image inventory summary">
          <div className="admin-image-summary-item">
            <strong>{Object.keys(IMAGE_SLOTS).length}</strong>
            <span>site image slots</span>
          </div>
          <div className="admin-image-summary-item">
            <strong>{totalModulePhotos}</strong>
            <span>module gallery photos</span>
          </div>
          <div className="admin-image-summary-item">
            <strong>{MODULES.length}</strong>
            <span>modules checked</span>
          </div>
        </div>
      )}

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
          {SLOT_GROUPS.map(({ group, slots }) => (
            <section className="admin-image-group" key={group}>
              <h2 className="admin-image-group-title">{group}</h2>

              <div className="admin-image-grid">
                {slots.map((slot) => (
                  <SlotCard
                    key={slot}
                    slot={slot}
                    path={previewUrl(
                      paths[IMAGE_SLOTS[slot].key] ?? '',
                      previewVersions[IMAGE_SLOTS[slot].key] ?? 0,
                    )}
                    state={status[slot] ?? 'idle'}
                    message={messages[slot] ?? ''}
                    registerRef={(el) => {
                      refs.current[slot] = el;
                    }}
                    onPick={(file) => void upload(slot, file)}
                  />
                ))}
              </div>
            </section>
          ))}

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

          <ModuleGalleryOverview galleries={galleries} />
        </>
      )}
    </>
  );
}

function ModuleGalleryOverview({ galleries }: { galleries: GalleryFile }) {
  const modulesWithPhotos = MODULES.map((module) => {
    const gallery = galleries[module.slug];
    const photos = PHOTO_CATEGORIES.flatMap((category) =>
      (gallery?.[category.slug as PhotoCategory] ?? []).map((image) => ({
        ...image,
        category: category.label,
      })),
    );
    return { module, photos };
  }).filter(({ photos }) => photos.length > 0);

  return (
    <section className="admin-image-group" aria-labelledby="module-gallery-overview">
      <h2 id="module-gallery-overview" className="admin-image-group-title">
        Module gallery photos already on the website
      </h2>
      <p className="admin-lede">
        These are the photos currently stored in <code>content/module-photos.json</code> and
        rendered by the public module galleries. Use the module link to edit captions,
        alt text, order, or delete a photo.
      </p>
      {modulesWithPhotos.length === 0 ? (
        <p className="admin-muted">No module gallery photos are stored yet.</p>
      ) : (
        modulesWithPhotos.map(({ module, photos }) => (
          <section className="admin-card admin-gallery-module" key={module.slug}>
            <div className="admin-actions" style={{ justifyContent: 'space-between' }}>
              <div>
                <h3 className="admin-card-title">{module.title}</h3>
                <p className="admin-muted">
                  {photos.length} photo{photos.length === 1 ? '' : 's'} across {new Set(photos.map((photo) => photo.category)).size} categories
                </p>
              </div>
              <a className="admin-button admin-button-secondary" href={`/admin/modules/${module.slug}`}>
                Edit module gallery
              </a>
            </div>
            <div className="admin-image-grid admin-module-photo-grid">
              {photos.map((photo) => (
                <figure className="admin-gallery-photo" key={photo.key}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl(photo.url, 0)}
                    alt={photo.alt || `${photo.category} photo for ${module.title}`}
                    loading="lazy"
                  />
                  <figcaption>
                    <strong>{photo.category}</strong>
                    <span>{photo.caption || 'No caption added'}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))
      )}
    </section>
  );
}

/**
 * One upload slot.
 *
 * Extracted so the page can group slots by where they appear without repeating
 * this markup four times, and so the ordering and remove behaviour live in one
 * place.
 */
function SlotCard({
  slot,
  path,
  state,
  message,
  registerRef,
  onPick,
}: {
  slot: ImageSlotName;
  path: string;
  state: Status;
  message: string;
  registerRef: (el: HTMLInputElement | null) => void;
  onPick: (file: File) => void;
}) {
  const spec = IMAGE_SLOTS[slot];
  /*
   * A local ref as well as the shared registry: the button needs to open THIS
   * input, and the parent needs every input addressable for its own bookkeeping.
   * Pointing both at the same node is what keeps the two in step.
   */
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="admin-card">
      <h3 className="admin-card-title">{spec.label}</h3>
      <p className="admin-hint">{spec.hint}</p>
      <p className="admin-muted">
        Best size: {spec.width}×{spec.height}
      </p>

      <div className="admin-image-preview">
        {path ? (
          // A plain <img>: operator uploads at unknown dimensions on an internal
          // page, so the optimiser has nothing to work from and would need a
          // loader configured for the R2 host.
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
            inputRef.current = el;
            registerRef(el);
          }}
          className="admin-omit"
          type="file"
          accept={
            slot === 'logo'
              ? 'image/png,image/svg+xml,image/webp'
              : 'image/jpeg,image/png,image/webp,image/avif'
          }
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPick(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          className="admin-button admin-button-secondary"
          disabled={state === 'uploading'}
          onClick={() => inputRef.current?.click()}
        >
          {state === 'uploading' ? 'Uploading…' : path ? 'Replace image' : 'Upload image'}
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
}
