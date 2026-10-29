/**
 * POST /api/admin/testimonials/photo — upload one headshot for one entry.
 *
 * ── Why this is not a reuse of `/api/admin/images` ──────────────────────
 * That route writes into one of the ten FIXED slots (`testimonial-1` …
 * `testimonial-3`), and a slot's path is stored as a global override keyed
 * `testimonial1`. Two consequences made it wrong for this form:
 *
 *   1. Every entry uploaded to `testimonial-1` would overwrite the same R2
 *      object and the same override, so uploading a photo for the second
 *      testimonial would change the first one's avatar.
 *   2. A slot only holds three photos. A fourth, fifth or tenth testimonial —
 *      which the panel explicitly allows — has no slot at all.
 *
 * So this route stores the bytes under a unique key and returns the path. The
 * caller writes that path into the entry's own `photo` field, which is the one
 * value that belongs to that testimonial and travels with it when the list is
 * reordered.
 *
 * ── Why the key carries a timestamp ─────────────────────────────────────
 * Same reasoning as `lib/admin/r2-keys.ts`: a stable key means a replacement
 * keeps the same URL, and every browser keeps serving the old bytes from cache.
 * A timestamp makes each upload a new URL, so a replaced headshot actually
 * appears.
 */

import { NextResponse } from 'next/server';

import { requireSession, fail } from '@/lib/admin/guard';
import { slugify } from '@/lib/admin/r2-keys';
import { storeAtKey, validateImage } from '@/lib/admin/store';

export const runtime = 'nodejs';

/**
 * Extension for an accepted MIME type.
 *
 * The R2 PUT carries `Content-Type`, so a key without an extension would still
 * serve correctly there. The local fallback writes a plain file into `public/`
 * and Next serves it by extension, so an extensionless key would be answered as
 * `application/octet-stream` and `next/image` would refuse it. One key shape for
 * both stores is simpler than a conditional.
 * @param {string} mime
 * @returns {string}
 */
function extensionFor(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/avif':
      return 'avif';
    default:
      return 'jpg';
  }
}

/**
 * @param {Request} request multipart/form-data with `file`
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

  const file = form.get('file');
  if (!(file instanceof File)) {
    return fail('No file was attached.');
  }

  /*
   * The slot is passed as '' rather than 'logo', so an SVG is refused here.
   * A headshot is a photograph; the SVG exception exists for the wordmark only.
   */
  const problem = validateImage({ type: file.type, size: file.size });
  if (problem) return fail(problem);

  const key = `images/testimonials/${Date.now()}-${slugify(file.name)}.${extensionFor(file.type)}`;

  try {
    const stored = await storeAtKey({
      key,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });

    return NextResponse.json({
      ok: true,
      data: {
        key,
        path: stored.path,
        storage: stored.storage,
        message:
          stored.storage === 'r2'
            ? 'Photo uploaded. Save the entry to publish the new path.'
            : 'Saved to the local filesystem (R2 not configured). This file is lost on the next deploy.',
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return fail(`Upload failed. ${detail}`, 502);
  }
}