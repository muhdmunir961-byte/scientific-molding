/**
 * Module photo gallery API.
 *
 *   POST   /api/admin/module-photos    upload one or more photos into a category
 *   PATCH  /api/admin/module-photos    reorder a category, or edit caption/alt
 *   DELETE /api/admin/module-photos    remove one photo
 *
 * ── Why one route serves all three verbs ────────────────────────────────
 * All three operate on the same resource — a module's category — and all three
 * have to end in the same commit. Splitting them across three route files would
 * mean three copies of the module/category validation and three chances for one
 * of them to accept a slug the others reject.
 *
 * ── Why the manifest is written BEFORE the object is deleted ────────────
 * On a delete the entry leaves the manifest, the manifest is committed, and only
 * then is the object removed. Reversed, a failed commit would leave the live
 * site pointing at bytes that no longer exist — a broken image. This order's
 * worst case is an orphaned object, which costs storage and breaks nothing.
 * ════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';

import { readGallery, saveGallery } from '@/lib/admin/gallery-store';
import { requireSession, fail } from '@/lib/admin/guard';
import { galleryKey } from '@/lib/admin/r2-keys';
import { deleteAtUrl, storeAtKey, validateImage } from '@/lib/admin/store';
import type { GalleryImage } from '@/lib/gallery';
import { PHOTO_CATEGORIES, isValidCategory, isValidModuleSlug, type PhotoCategory } from '@/lib/modules';

export const runtime = 'nodejs';

/** Ten photos per request covers a workshop session without a long upload. */
const MAX_FILES = 10;

/**
 * Validate a module + category pair from a request.
 *
 * Returns a message rather than throwing so each handler can shape its own
 * response, and so an empty slug is rejected here rather than reaching a lookup
 * — the mistake that produced the "Unknown module ''" bug on the other route.
 * @param {string} moduleSlug
 * @param {string} category
 * @returns {string} '' when both are valid
 */
function validateTarget(moduleSlug: string, category: string): string {
  if (!moduleSlug) return 'No module was specified.';
  if (!isValidModuleSlug(moduleSlug)) return `There is no module called "${moduleSlug}".`;
  if (!category) return 'No category was specified.';
  if (!isValidCategory(category)) {
    const names = PHOTO_CATEGORIES.map((c) => c.slug).join(', ');
    return `Unknown category "${category}". Expected one of: ${names}.`;
  }
  return '';
}

/** GET — read a module's gallery, or every module's if none is named. */
export async function GET(request: Request): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  const moduleSlug = (new URL(request.url).searchParams.get('module') ?? '').trim();

  if (!moduleSlug) {
    // The Overview panel asks for every module at once.
    const { readGalleryFile } = await import('@/lib/admin/gallery-store');
    return NextResponse.json({ ok: true, data: { modules: await readGalleryFile() } });
  }

  if (!isValidModuleSlug(moduleSlug)) {
    return fail(`There is no module called "${moduleSlug}".`, 404);
  }

  return NextResponse.json({
    ok: true,
    data: { module: moduleSlug, gallery: await readGallery(moduleSlug) },
  });
}

/**
 * Upload photos into one category.
 * @param {Request} request multipart: `module`, `category`, `files` (repeated)
 * @returns {Promise<NextResponse>}
 */
export async function POST(request: Request): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail('Expected a multipart form upload.');
  }

  const moduleSlug = String(form.get('module') ?? '').trim();
  const category = String(form.get('category') ?? '').trim();

  const problem = validateTarget(moduleSlug, category);
  if (problem) return fail(problem);

  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return fail('No files were attached.');
  if (files.length > MAX_FILES) {
    return fail(`Up to ${MAX_FILES} photos can be uploaded at once.`);
  }

  const gallery = await readGallery(moduleSlug);
  const existing = gallery[category as PhotoCategory];
  const uploaded: GalleryImage[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const invalid = validateImage({ type: file.type, size: file.size });
    if (invalid) {
      errors.push(`${file.name}: ${invalid}`);
      continue;
    }

    try {
      /*
       * The timestamp is offset by the number already handled in this request.
       * Two files picked in the same millisecond would otherwise produce the
       * same key and the second would overwrite the first.
       */
      const timestamp = Date.now() + uploaded.length;
      const key = galleryKey({ moduleSlug, category, filename: file.name, timestamp });

      const stored = await storeAtKey({
        key,
        body: Buffer.from(await file.arrayBuffer()),
        contentType: file.type,
      });

      uploaded.push({
        /*
         * The key doubles as the object's identity — derived from the R2 key
         * rather than generated separately, so the manifest entry and the stored
         * object cannot drift. There is one name for one photograph.
         */
        key,
        url: stored.path,
        alt: '',
        caption: '',
        order: existing.length + uploaded.length,
        uploadedAt: new Date().toISOString(),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown error';
      errors.push(`${file.name}: ${detail}`);
    }
  }

  if (uploaded.length === 0) {
    return fail(errors.join(' ') || 'Nothing was uploaded.', 502);
  }

  const merged = [...existing, ...uploaded];
  const result = await saveGallery(moduleSlug, category as PhotoCategory, merged);

  return NextResponse.json({
    ok: true,
    data: {
      uploaded: uploaded.length,
      /** Per-file failures, so a partial success is never reported as a full one. */
      errors,
      images: merged,
      storage: result.storage,
      message:
        errors.length > 0
          ? `${uploaded.length} uploaded, ${errors.length} failed. ${result.message}`
          : `${uploaded.length} uploaded. ${result.message}`,
    },
  });
}

/**
 * Reorder a category, or edit one photo's caption/alt.
 * @param {Request} request JSON: `module`, `category`, then `keys` OR `key`
 * @returns {Promise<NextResponse>}
 */
export async function PATCH(request: Request): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Expected a JSON body.');
  }

  const moduleSlug = String(payload.module ?? '').trim();
  const category = String(payload.category ?? '').trim();

  const problem = validateTarget(moduleSlug, category);
  if (problem) return fail(problem);

  const gallery = await readGallery(moduleSlug);
  const existing = gallery[category as PhotoCategory];

  /*
   * Either a full reorder (`keys` in the new order) or a single edit (`key` plus
   * the fields to change). Reorder wins when both are present, because an edit
   * to a list whose order also changed should apply to the new order rather than
   * to a stale index.
   */
  let next: GalleryImage[];

  if (Array.isArray(payload.keys)) {
    const order = payload.keys.map((k) => String(k));
    const byKey = new Map(existing.map((img) => [img.key, img]));

    /*
     * Every existing image must appear exactly once. Without this a dropped key
     * would silently delete a photograph through what the operator believed was
     * a reorder — the worst possible way to lose data.
     */
    if (order.length !== existing.length || order.some((k) => !byKey.has(k))) {
      return fail('The new order does not match the photos in this category.');
    }

    next = order.map((key, index) => ({
      ...(byKey.get(key) as GalleryImage),
      order: index,
    }));
  } else if (typeof payload.key === 'string') {
    if (!existing.some((img) => img.key === payload.key)) {
      return fail('That photo is not in this category.', 404);
    }

    next = existing.map((img) =>
      img.key === payload.key
        ? {
            ...img,
            caption: typeof payload.caption === 'string' ? payload.caption : img.caption,
            alt: typeof payload.alt === 'string' ? payload.alt : img.alt,
          }
        : img,
    );
  } else {
    return fail('Send either `keys` to reorder or `key` to edit.');
  }

  const result = await saveGallery(moduleSlug, category as PhotoCategory, next);

  return NextResponse.json({
    ok: true,
    data: { images: next, storage: result.storage, message: result.message },
  });
}

/**
 * Remove one photo.
 * @param {Request} request JSON: `module`, `category`, `key`
 * @returns {Promise<NextResponse>}
 */
export async function DELETE(request: Request): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Expected a JSON body.');
  }

  const moduleSlug = String(payload.module ?? '').trim();
  const category = String(payload.category ?? '').trim();
  const key = String(payload.key ?? '').trim();

  const problem = validateTarget(moduleSlug, category);
  if (problem) return fail(problem);
  if (!key) return fail('No photo was specified.');

  const gallery = await readGallery(moduleSlug);
  const existing = gallery[category as PhotoCategory];
  const target = existing.find((img) => img.key === key);
  if (!target) return fail('That photo is not in this category.', 404);

  // Close the order gap, so the manifest never has holes to reason about.
  const remaining = existing
    .filter((img) => img.key !== key)
    .map((img, index) => ({ ...img, order: index }));

  /*
   * Manifest first, then the object — see the file docblock. The commit has to
   * land before the bytes are removed, or the live site could reference a URL
   * that no longer resolves.
   */
  const result = await saveGallery(moduleSlug, category as PhotoCategory, remaining);
  const removed = await deleteAtUrl(target.url);

  return NextResponse.json({
    ok: true,
    data: {
      images: remaining,
      storage: result.storage,
      /*
       * Whether the object was actually removed, reported rather than hidden. An
       * orphaned object costs storage and an operator who knows can clean it up.
       * A failure here does NOT fail the request: the site is already correct
       * once the manifest is written.
       */
      objectDeleted: removed.deleted,
      objectNote: removed.reason ?? null,
      message: result.message,
    },
  });
}
