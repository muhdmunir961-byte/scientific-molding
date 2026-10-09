/**
 * Image storage — Cloudflare R2 when configured, local filesystem otherwise.
 *
 * ── Why R2 is the right home for these files ────────────────────────────
 * The site deploys to Coolify, which builds an image from the git repo and
 * replaces it on every deploy. Anything written into the container's
 * filesystem at runtime — including `public/images/` — is gone after the next
 * push. A CMS that stored uploads there would appear to work perfectly and then
 * silently lose every photograph the trainer ever added.
 *
 * R2 stores the bytes outside the deploy, so the image URL written into a
 * content module stays valid across rebuilds.
 *
 * ── Why the local fallback exists ───────────────────────────────────────
 * Without R2 credentials the fallback writes to `public/images/`, which is
 * exactly the file-drop workflow the README already documents. It works in
 * development. `deploymentWarnings()` in `lib/admin/config` surfaces the caveat
 * in the UI, so the degraded state is visible rather than silent.
 */

import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { isR2Configured, r2Config } from './config';
import { signPutRequest } from './sigv4';

/** Where the local fallback writes, relative to the project root. */
const LOCAL_IMAGE_DIR = join(process.cwd(), 'public', 'images');
/** Public path prefix the local fallback serves from. */
const LOCAL_PUBLIC_PREFIX = '/images';
/** Image types the panel accepts. */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  /*
   * SVG is allowed for the logo only — see `validateImage`. An SVG can carry
   * script, so accepting one from a general-purpose upload field would let a
   * crafted file run in the context of the page that embeds it. The logo is the
   * one position where vector is genuinely needed (a raster wordmark looks soft
   * on a retina display), and it is the one position an operator uploads
   * deliberately rather than in bulk.
   */
  'image/svg+xml',
] as const;

/** Maximum upload size in bytes. 8 MB covers a full-resolution camera JPEG. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Extension for a MIME type.
 * @param {string} mime
 * @returns {string}
 */
function extensionFor(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/avif':
      return 'avif';
    case 'image/svg+xml':
      return 'svg';
    default:
      return 'bin';
  }
}

/**
 * Validate an upload before it is stored.
 * @param {{type: string, size: number}} file
 * @param {string} [slot] the slot being uploaded to, when the caller knows it
 * @returns {string} an error message, or '' when acceptable
 */
export function validateImage(
  file: { type: string; size: number },
  slot = '',
): string {
  if (file.size === 0) return 'The file is empty.';
  if (file.size > MAX_IMAGE_BYTES) {
    return `The file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`;
  }

  /*
   * SVG is accepted only for the logo. Everywhere else the upload field is used
   * in bulk and an SVG can embed script, so allowing it generally would widen
   * the surface for no benefit — a photograph should be raster regardless.
   */
  if (file.type === 'image/svg+xml' && slot !== 'logo') {
    return 'SVG is only accepted for the logo. Use JPEG, PNG, WebP or AVIF for photographs.';
  }

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `Unsupported type "${file.type}". Use JPEG, PNG, WebP or AVIF.`;
  }

  return '';
}

/**
 * Turn a slot name into a safe filename.
 *
 * Slot names are a fixed, known set (`hero-training`, `session-1`, …), but a
 * caller can send anything, so every character outside `[a-z0-9-]` is dropped
 * rather than trusted. This closes path traversal (`../`) and header injection
 * through the object key in one rule.
 * @param {string} slot
 * @returns {string}
 */
export function safeSlotName(slot: string): string {
  const cleaned = slot
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return cleaned || 'image';
}

export interface StoredImage {
  /** Path to write into the content module, e.g. `/images/hero-training.jpg`. */
  path: string;
  /** Where the bytes actually live. */
  storage: 'r2' | 'local';
}

/**
 * Store an uploaded image under `slot` and return its public path.
 * @param {object} args
 * @param {string} args.slot logical name, e.g. `hero-training`
 * @param {Buffer} args.body
 * @param {string} args.contentType
 * @returns {Promise<StoredImage>}
 */
export async function storeImage({
  slot,
  body,
  contentType,
}: {
  slot: string;
  body: Buffer;
  contentType: string;
}): Promise<StoredImage> {
  const name = `${safeSlotName(slot)}.${extensionFor(contentType)}`;

  if (isR2Configured()) {
    const cfg = r2Config();
    const { url, headers } = signPutRequest({
      accountId: cfg.accountId,
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      bucket: cfg.bucket,
      key: `images/${name}`,
      body,
      contentType,
    });

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: new Uint8Array(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`R2 upload failed (${response.status}). ${detail.slice(0, 200)}`);
    }

    return { path: `${cfg.publicUrl}/images/${name}`, storage: 'r2' };
  }

  await mkdir(LOCAL_IMAGE_DIR, { recursive: true });
  await writeFile(join(LOCAL_IMAGE_DIR, name), body);
  return { path: `${LOCAL_PUBLIC_PREFIX}/${name}`, storage: 'local' };
}

/**
 * Delete a locally stored image by public path.
 *
 * Only applies to the local fallback. R2 objects are overwritten by key on
 * replace, and remote deletion is deliberately not offered: an accidental
 * delete of a live asset is not recoverable without bucket versioning.
 * @param {string} publicPath
 * @returns {Promise<void>}
 */
export async function deleteLocalImage(publicPath: string): Promise<void> {
  if (!publicPath.startsWith(`${LOCAL_PUBLIC_PREFIX}/`)) return;
  const name = publicPath.slice(LOCAL_PUBLIC_PREFIX.length + 1);
  // `name` is derived from a value the panel itself wrote, and a `/` would mean
  // a nested path this function has no business touching. Refusing anything
  // with a separator keeps the write inside the images directory.
  if (!name || name.includes('/')) return;
  await unlink(join(LOCAL_IMAGE_DIR, name)).catch(() => undefined);
}
