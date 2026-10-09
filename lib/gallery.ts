/**
 * Module photo galleries — types and accessors.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  SHAPE, and why it is keyed the way it is
 *
 *  The client wants photos separated per module AND per activity category,
 *  rather than one flat list of six positions. So:
 *
 *    modules[<moduleSlug>][<category>] = Image[]
 *
 *  Both keys come from other files rather than being written out here:
 *  module slugs from `content/modules.json` (`lib/modules.ts`) and categories
 *  from `PHOTO_CATEGORIES` in the same module. That is what stops the gallery
 *  growing a seventh module or a fifth category by accident — the panel can only
 *  write keys it was given.
 *
 *  ── Why an absent module is treated as empty rather than as an error ────
 *  The JSON is written by the panel one module at a time, so a file saved before
 *  a module was added has no entry for it. Reading that as empty means the site
 *  renders and the panel shows an empty gallery, which is the honest state;
 *  throwing would take the whole page down over a missing array.
 * ════════════════════════════════════════════════════════════════════════
 */

import raw from '@/content/module-photos.json';
import { MODULES, PHOTO_CATEGORIES, type PhotoCategory } from '@/lib/modules';

/** One photograph in a module's gallery. */
export interface GalleryImage {
  /**
   * Stable identity for this image, independent of its position.
   *
   * Reordering has to survive a save, so an element cannot be identified by its
   * index — insert one photo at the top and every index below it shifts, which
   * would silently re-pair captions with the wrong photographs. The key is
   * generated once at upload and never changes.
   */
  readonly key: string;
  /** Public URL the site renders. */
  readonly url: string;
  /** Describes the subject, for a screen reader. */
  readonly alt: string;
  /** Optional visible caption. Empty string when the operator set none. */
  readonly caption: string;
  /** Sort position within its category. Ascending. */
  readonly order: number;
  /** ISO timestamp of upload, for the admin's own ordering sanity. */
  readonly uploadedAt: string;
}

/** A module's four categories. */
export type ModuleGallery = Record<PhotoCategory, GalleryImage[]>;

/** The whole file: module slug to gallery. */
export type GalleryFile = Record<string, ModuleGallery>;

/** The parsed file. The cast is narrow: the JSON is written by the panel. */
const FILE = raw as { modules: Record<string, Partial<ModuleGallery>> };

/**
 * An empty gallery, with all four categories present.
 *
 * Built from `PHOTO_CATEGORIES` so a fifth category added to the manifest
 * appears here automatically. A hardcoded four-key object would silently omit
 * it, and the panel would show a category with no photos rather than no
 * category at all.
 * @returns {ModuleGallery}
 */
export function emptyGallery(): ModuleGallery {
  return {
    lecture: [],
    practical: [],
    discussion: [],
    presentation: [],
  };
}

/**
 * A module's gallery, with every category guaranteed present.
 *
 * Missing categories are filled with an empty array rather than left undefined,
 * so a caller can iterate `PHOTO_CATEGORIES` and index the result without a
 * null check at each turn.
 * @param {string} moduleSlug
 * @returns {ModuleGallery}
 */
export function galleryFor(moduleSlug: string): ModuleGallery {
  const saved: Partial<ModuleGallery> = FILE.modules[moduleSlug] ?? {};
  const gallery = emptyGallery();

  for (const category of PHOTO_CATEGORIES) {
    const images = saved[category.slug];
    if (Array.isArray(images)) {
      // A saved order may have gaps after a delete; sorting here means the
      // renderer never has to care.
      gallery[category.slug] = [...images].sort((a, b) => a.order - b.order);
    }
  }

  return gallery;
}

/**
 * How many photos a module has, and in which categories.
 *
 * The Overview panel uses this for its completeness count, which is why it
 * returns per-category numbers rather than a single total: "3 of 4 categories
 * have photos" is actionable, "5 photos" is not.
 * @param {string} moduleSlug
 * @returns {{ total: number; byCategory: Record<PhotoCategory, number> }}
 */
export function galleryCounts(moduleSlug: string): {
  total: number;
  byCategory: Record<PhotoCategory, number>;
} {
  const gallery = galleryFor(moduleSlug);
  const byCategory = {
    lecture: 0,
    practical: 0,
    discussion: 0,
    presentation: 0,
  } as Record<PhotoCategory, number>;
  let total = 0;

  for (const category of PHOTO_CATEGORIES) {
    const count = gallery[category.slug].length;
    byCategory[category.slug] = count;
    total += count;
  }

  return { total, byCategory };
}

/**
 * Every module's photo counts, for the Overview panel.
 * @returns {Record<string, { total: number; byCategory: Record<PhotoCategory, number> }>}
 */
export function allGalleryCounts(): Record<
  string,
  { total: number; byCategory: Record<PhotoCategory, number> }
> {
  const counts: Record<string, { total: number; byCategory: Record<PhotoCategory, number> }> = {};
  for (const module of MODULES) counts[module.slug] = galleryCounts(module.slug);
  return counts;
}
