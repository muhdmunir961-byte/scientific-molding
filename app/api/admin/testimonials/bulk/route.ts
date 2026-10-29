/**
 * POST /api/admin/testimonials/bulk — upload many screenshots at once.
 *
 * ── Why this exists ─────────────────────────────────────────────────────
 * A testimonial screenshot arrives in batches: the client sends eleven WhatsApp
 * captures at once. One-entry-per-request meant eleven round trips, eleven
 * commits and eleven chances to lose track of which file went where.
 *
 * So this takes all the files, stores them, and creates one unpublished entry
 * per file. Unpublished on purpose: the panel's publish gate is the only thing
 * standing between a real person's screenshot and the live site, and a bulk
 * upload is not a decision to publish.
 *
 * ── Why a partial success is reported as one ────────────────────────────
 * A single bad file (too large, wrong type) must not discard the nine that were
 * fine. Every failure is named per file, and the response says how many of each.
 *
 * ── Why one commit for the whole batch ──────────────────────────────────
 * `saveTestimonials` writes the whole list, so calling it per file would produce
 * N commits and N deploys. The entries are appended and written once.
 */

import { NextResponse } from 'next/server';

import { requireSession, fail } from '@/lib/admin/guard';
import { slugify } from '@/lib/admin/r2-keys';
import { readTestimonials, saveTestimonials } from '@/lib/admin/testimonials-store';
import { storeAtKey, validateImage } from '@/lib/admin/store';
import { blankTestimonial, type Testimonial } from '@/lib/testimonials';

export const runtime = 'nodejs';

/** Enough for a full client conversation, small enough to stay under the body limit. */
const MAX_FILES = 20;

/**
 * Extension for an accepted MIME type.
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
 * @param {Request} request multipart with `files` (repeated)
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

  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return fail('No files were attached.');
  if (files.length > MAX_FILES) {
    return fail(`Up to ${MAX_FILES} screenshots can be uploaded at once.`);
  }

  const existing = await readTestimonials();
  const created: Testimonial[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const invalid = validateImage({ type: file.type, size: file.size }, 'testimonial');
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
      const key = `images/testimonials/screenshots/${Date.now() + created.length}-${slugify(file.name)}.${extensionFor(file.type)}`;

      const stored = await storeAtKey({
        key,
        body: Buffer.from(await file.arrayBuffer()),
        contentType: file.type,
      });

      created.push({
        ...blankTestimonial(existing.length + created.length),
        screenshot: stored.path,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown error';
      errors.push(`${file.name}: ${detail}`);
    }
  }

  if (created.length === 0) {
    return fail(errors.join(' ') || 'Nothing was uploaded.', 502);
  }

  /*
   * Appended in order and written once. Every new entry is unpublished, so this
   * commit cannot expose a screenshot before the operator has reviewed it.
   */
  const next = [...existing, ...created];
  const result = await saveTestimonials(next, `bulk add ${created.length}`);

  return NextResponse.json({
    ok: true,
    data: {
      testimonials: next,
      created: created.length,
      errors,
      storage: result.storage,
      message:
        errors.length > 0
          ? `${created.length} added, ${errors.length} failed. They are hidden until you publish them. ${result.message}`
          : `${created.length} added and hidden until you publish them. ${result.message}`,
    },
  });
}