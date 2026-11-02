/**
 * Upload limits — the one place both the browser and the server read.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THIS IS SEPARATE FROM `lib/admin/store.ts`
 *
 *  `store.ts` is server-only: it imports `node:fs` and `node:path` to write the
 *  local fallback. A client component cannot import it, so the panel had no way
 *  to show the size limit or pre-check a file before spending a round trip on it
 *  — the operator only learned about a rejected file from a server error after
 *  the upload had already been attempted.
 *
 *  So the numbers live here, with no Node imports at all, and `store.ts`
 *  re-exports them. There is still exactly one definition of each limit; the
 *  difference is that this module can be reached from the browser.
 * ════════════════════════════════════════════════════════════════════════
 */

/**
 * Image types the panel accepts.
 *
 * SVG is in the list because the logo is a vector, but `validateImage` in
 * `store.ts` refuses it for every other slot — see the note there.
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
] as const;

/**
 * The `accept` attribute for a photograph picker.
 *
 * SVG is deliberately absent: a screenshot or a camera photo is raster, and the
 * logo is the only position that takes a vector.
 */
export const ACCEPTED_IMAGE_ATTR = 'image/jpeg,image/png,image/webp,image/avif';

/**
 * Maximum size of one file, in bytes.
 *
 * ── Why 25 MB ───────────────────────────────────────────────────────────
 * Nothing here re-encodes an upload: the original bytes are stored and served,
 * because `next/image` already produces every display size from the original
 * and a resize-on-upload would bake one size in permanently. The cost of that
 * decision is that an upload is stored in full, so the ceiling has to cover a
 * real file: a modern phone screenshot is 2–6 MB and a full-resolution camera
 * photo is 8–20 MB.
 */
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

/**
 * How many files travel in one request.
 *
 * ── Why there is a batch size at all, when the panel offers no limit ────
 * "Unlimited" is about what the OPERATOR may select, not about how many
 * megabytes arrive in a single HTTP body. A hundred screenshots in one multipart
 * request is a body the platform will refuse (and a request that has to finish
 * entirely before anything is stored, so a failure at file 99 loses all 99).
 *
 * So the browser splits the selection into batches of this size and sends them
 * one after another. Every batch that lands is committed and visible; a failure
 * names the batch it happened in and the files already stored stay stored. From
 * the operator's side the selection is unlimited — they pick 3 or 300.
 */
export const UPLOAD_BATCH_SIZE = 20;

/**
 * Human-readable size.
 *
 * Reported in MB above a megabyte because "1,234,567 bytes" tells an operator
 * nothing about whether they are near a limit.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Why a file cannot be uploaded, or null when it can.
 *
 * Checked in the browser before the request so a 40 MB TIFF is reported
 * instantly and by name, instead of the operator waiting for a server round trip
 * to be told the same thing. The server runs the same checks — this is a
 * courtesy, not a control.
 * @param {File} file
 * @returns {string|null}
 */
export function rejectReason(file: File): string | null {
  if (file.size === 0) return 'The file is empty.';
  if (file.size > MAX_IMAGE_BYTES) {
    return `${formatBytes(file.size)} is over the ${formatBytes(MAX_IMAGE_BYTES)} limit.`;
  }
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `Unsupported type "${file.type || 'unknown'}". Use JPEG, PNG, WebP or AVIF.`;
  }
  if (file.type === 'image/svg+xml') {
    return 'SVG is only accepted for the logo. Use JPEG, PNG, WebP or AVIF for photographs.';
  }
  return null;
}

/**
 * Split a selection into the batches the API accepts.
 * @param {File[]} files
 * @param {number} [size]
 * @returns {File[][]}
 */
export function batchFiles(files: File[], size = UPLOAD_BATCH_SIZE): File[][] {
  if (size < 1) throw new Error('The batch size must be at least 1.');
  const batches: File[][] = [];
  for (let i = 0; i < files.length; i += size) {
    batches.push(files.slice(i, i + size));
  }
  return batches;
}
