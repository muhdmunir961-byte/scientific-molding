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
import { signDeleteRequest, signPutRequest } from './sigv4';

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
 * @deprecated Prefer `storeAtKey`, which takes an explicit key. This wrapper
 *   remains for the fixed special slots, whose naming convention predates the
 *   module galleries.
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
  return storeAtKey({ key: `images/${name}`, body, contentType });
}

/**
 * Upload bytes to an arbitrary key, then verify the result resolves.
 *
 * ── Why the key is a parameter and built by the caller ──────────────────
 * Two conventions are in play: the fixed special slots (`images/hero.jpg`) and
 * the module galleries (`images/<module>/<category>/<ts>-<name>.jpg`). Both go
 * through this one function so the upload, the verification and the error shape
 * are identical — a second code path would be a second place for the HEAD check
 * to be missing.
 *
 * ── Why the URL is verified before it is returned ───────────────────────
 * A PUT can succeed into a bucket whose public domain is not attached, or whose
 * access rules block the read. In that case the panel reported success and the
 * site showed nothing, which is the failure the brief calls out. A HEAD on the
 * returned URL is one request and it turns that silent breakage into a visible
 * one: if the image cannot be fetched, the upload is reported as failed with the
 * URL named.
 *
 * ── Why a failed verify does not delete the object ──────────────────────
 * Deleting would destroy the upload over what may be a transient propagation
 * delay. The object stays, the error names the URL, and the operator can retry
 * or check the bucket domain.
 *
 * @param {object} args
 * @param {string} args.key object key
 * @param {Buffer} args.body
 * @param {string} args.contentType
 * @returns {Promise<StoredImage>}
 */
export async function storeAtKey({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<StoredImage> {
  if (isR2Configured()) {
    const cfg = r2Config();
    const { url, headers } = signPutRequest({
      accountId: cfg.accountId,
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      bucket: cfg.bucket,
      key,
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

    const publicUrl = `${cfg.publicUrl}/${key}`;
    await verifyReachable(publicUrl);
    return { path: publicUrl, storage: 'r2' };
  }

  /*
   * Local fallback. A gallery key contains slashes, so the directory is created
   * from the key's own path — otherwise a nested key fails with ENOENT, which is
   * how the first gallery upload would have broken.
   */
  const localPath = join(process.cwd(), 'public', key);
  await mkdir(join(localPath, '..'), { recursive: true });
  await writeFile(localPath, body);
  return { path: `/${key}`, storage: 'local' };
}

/**
 * Confirm a URL actually serves the object just written.
 *
 * A HEAD rather than a GET: the headers settle whether the public domain is
 * wired, and none of the bytes are transferred twice.
 *
 * `isR2Configured` already required a non-empty public base, so reaching here
 * with one means the base is meant to work. A failure is therefore a real
 * misconfiguration and is thrown, not swallowed.
 *
 * @param {string} url
 * @returns {Promise<void>}
 * @throws {Error} when the URL does not resolve to a successful response
 */
async function verifyReachable(url: string): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(
        `the file was uploaded but ${url} answers ${response.status}. Check that R2_PUBLIC_URL is the bucket's public domain and that public access is enabled.`,
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('the file was uploaded')) {
      throw error;
    }
    const detail = error instanceof Error ? error.message : 'unknown error';
    throw new Error(
      `the file was uploaded but ${url} could not be reached (${detail}). Check that R2_PUBLIC_URL is the bucket's public domain.`,
    );
  }
}

/**
 * Delete a stored object by its public URL.
 *
 * ── Why deletion IS offered, unlike the first revision ──────────────────
 * The earlier version did not delete, reasoning that an accidental removal of a
 * live asset is unrecoverable without bucket versioning. That remains true, and
 * it is why the caller reaches here only after the operator has removed the
 * image from a gallery and saved — the manifest entry is gone first, so the site
 * has already stopped referencing the URL before the bytes go.
 *
 * ── Why a missing object is not an error ────────────────────────────────
 * The caller is usually deleting something already removed, or an upload that
 * failed halfway left no object. Reporting either as an error would block a save
 * over a state the operator cannot fix.
 *
 * @param {string} publicUrl
 * @returns {Promise<{ deleted: boolean; reason?: string }>}
 */
export async function deleteAtUrl(
  publicUrl: string,
): Promise<{ deleted: boolean; reason?: string }> {
  if (!publicUrl) return { deleted: false, reason: 'no url' };

  if (isR2Configured()) {
    const cfg = r2Config();
    if (!publicUrl.startsWith(cfg.publicUrl)) {
      // Not ours to delete — a default path shipped in the repo, or an external
      // URL an operator pasted. Silently skipping is the correct behaviour.
      return { deleted: false, reason: 'not an R2 object' };
    }

    const key = publicUrl.slice(cfg.publicUrl.length + 1);
    const { url, headers } = signDeleteRequest({
      accountId: cfg.accountId,
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      bucket: cfg.bucket,
      key,
    });

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok && response.status !== 404) {
        return { deleted: false, reason: `R2 answered ${response.status}` };
      }
      return { deleted: true };
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown error';
      return { deleted: false, reason: detail };
    }
  }

  if (publicUrl.startsWith('/')) {
    const publicRoot = join(process.cwd(), 'public');
    const localPath = join(publicRoot, publicUrl.slice(1));
    /*
     * Refuse anything that escapes `public/`. The path comes from a manifest the
     * panel itself wrote, but a `..` reaching here would be a real traversal and
     * the check costs one comparison.
     */
    if (!localPath.startsWith(publicRoot)) {
      return { deleted: false, reason: 'outside public' };
    }
    await unlink(localPath).catch(() => undefined);
    return { deleted: true };
  }

  return { deleted: false, reason: 'not a local path' };
}
