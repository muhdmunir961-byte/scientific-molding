/**
 * POST /api/admin/images — upload an image into one of the six slots.
 *
 * ── Why the slot name is validated against a fixed list ─────────────────
 * The slot becomes part of an object key and, on the local fallback, part of a
 * filesystem path. Accepting an arbitrary string there would open path
 * traversal (`../../`). Restricting it to the six known names closes that
 * entirely: an unknown slot is rejected before any path is constructed.
 *
 * ── Why the ORIGINAL bytes are stored, not a resized copy ───────────────
 * `next/image` already resizes and re-encodes per request and per breakpoint,
 * from the stored original. Resizing on upload would bake one size in, lose
 * quality permanently, and require a native image library in the deploy. The
 * panel's job is to get the best available bytes into place.
 *
 * The consequence is that an oversized upload is stored in full, which is why
 * there is an 8 MB ceiling and a clear error stating the recommended
 * dimensions for each slot.
 */

import { NextResponse } from 'next/server';

import { requireSession, fail } from '@/lib/admin/guard';
import { IMAGE_SLOTS, type ImageSlotName } from '@/lib/admin/schema';
import { storeImage, validateImage } from '@/lib/admin/store';

export const runtime = 'nodejs';

/**
 * @param {Request} request multipart/form-data with `slot` and `file`
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

  const slot = String(form.get('slot') ?? '');
  if (!(slot in IMAGE_SLOTS)) {
    return fail(`Unknown image slot "${slot}".`);
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return fail('No file was attached.');
  }

  const problem = validateImage({ type: file.type, size: file.size });
  if (problem) return fail(problem);

  const buffer = Buffer.from(await file.arrayBuffer());
  const slotName = slot as ImageSlotName;
  const spec = IMAGE_SLOTS[slotName];

  try {
    const stored = await storeImage({
      slot,
      body: buffer,
      contentType: file.type,
    });

    return NextResponse.json({
      ok: true,
      data: {
        slot,
        /** Content key the path belongs to, e.g. `trainerPortrait`. */
        key: spec.key,
        path: stored.path,
        storage: stored.storage,
        width: spec.width,
        height: spec.height,
        message:
          stored.storage === 'r2'
            ? 'Uploaded to R2. Save the Images group to publish the new path.'
            : 'Saved to the local filesystem (R2 not configured). Save the Images group to publish the new path.',
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return fail(`Upload failed. ${detail}`, 502);
  }
}
