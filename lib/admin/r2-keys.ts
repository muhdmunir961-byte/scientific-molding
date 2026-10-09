/**
 * R2 key construction.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THE KEY IS BUILT HERE AND NOT AT THE CALL SITE
 *
 *  The first revision named every object `<slot>.<ext>` directly under
 *  `images/` — so `images/hero.jpg`, `images/trainer-portrait.jpg`. Two
 *  problems followed from that:
 *
 *    1. Re-uploading to a slot wrote the SAME key. The bytes changed, the URL
 *       did not, and every browser kept serving the old image from cache. The
 *       operator saw their upload "succeed" and the old photograph stay put.
 *    2. A filename carried no information. `images/lecture.jpg` said nothing
 *       about which module or category it belonged to, so a bucket with a
 *       hundred photographs was unnavigable and a stray object could not be
 *       attributed to anything.
 *
 *  The convention is now:
 *
 *      images/<moduleSlug>/<category>/<timestamp>-<slug>.<ext>
 *
 *  A timestamp makes every upload a distinct key, so a replacement is a new URL
 *  and the browser cannot serve a stale one. It also sorts chronologically in
 *  the bucket listing, which is how an operator actually looks for a recent
 *  upload.
 *
 *  Special slots keep a `_branding` / `_trainer` prefix rather than a module
 *  slug, because they do not belong to any module.
 * ════════════════════════════════════════════════════════════════════════
 */

import { isValidCategory, isValidModuleSlug } from '../modules';

/** Prefixes for the slots that are not inside a module. */
export const SPECIAL_PREFIX = {
  branding: '_branding',
  trainer: '_trainer',
} as const;

/**
 * Reduce a filename to a safe, readable slug.
 *
 * Everything outside `[a-z0-9]` becomes a hyphen, runs collapse, and the result
 * is trimmed. This closes path traversal (`../`) and header injection through
 * the object key in one rule, and produces a name a human can read in a bucket
 * listing.
 * @param {string} name
 * @returns {string}
 */
export function slugify(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '') // drop the extension; it is appended separately
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return cleaned || 'image';
}

export interface GalleryKeyParts {
  moduleSlug: string;
  category: string;
  filename: string;
  /** Milliseconds since epoch. Injected so the caller can make the key testable. */
  timestamp: number;
}

/**
 * Build an R2 key for a module photo.
 *
 * Rejects an unknown module or category rather than sanitising it into
 * something plausible: a typo in a slug should fail loudly at the boundary, not
 * quietly create a fifth folder nobody looks in.
 *
 * @param {GalleryKeyParts} parts
 * @returns {string} e.g. `images/m1-fundamental/lecture/1728450000000-lathe-setup.jpg`
 * @throws {Error} when the module slug or category is not recognised
 */
export function galleryKey({
  moduleSlug,
  category,
  filename,
  timestamp,
}: GalleryKeyParts): string {
  if (!isValidModuleSlug(moduleSlug)) {
    throw new Error(`Unknown module "${moduleSlug}".`);
  }
  if (!isValidCategory(category)) {
    throw new Error(`Unknown category "${category}".`);
  }

  return `images/${moduleSlug}/${category}/${timestamp}-${slugify(filename)}`;
}
