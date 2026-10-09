/**
 * The images manifest — a real, always-present structure.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THIS EXISTS
 *
 *  The admin Content page showed "Images → PAGE IMAGES (read-only) → null".
 *  Two causes, both structural:
 *
 *    1. `PAGE_IMAGES` lived only inside a component module
 *       (`components/generated/images-content.generated.ts`) that is written by
 *       the upload flow and read by the components. The admin's registry had no
 *       entry for it, so `readExport()` returned `undefined` and the editor
 *       rendered `null`.
 *    2. There was no single place that could answer "what images does the site
 *       currently use?" — the six defaults were spread across `hero-content.ts`,
 *       `about-content.ts` and `testimonials-content.ts`.
 *
 *  So the manifest is now a first-class structure with a defined shape and
 *  defined defaults. It is never null: every slot resolves to either a saved
 *  path or its built-in default, which is what lets the admin page list the
 *  current state instead of an empty value.
 *
 *  ── Why the default lives here rather than in the content modules ───────
 *  The content modules still own their copy. This file only needs the DEFAULT
 *  PATH for each slot so it can answer the question above; the modules remain
 *  the source for everything else about an image (alt text, dimensions).
 * ════════════════════════════════════════════════════════════════════════
 */

import { allTestimonials } from '@/lib/testimonials';

import { HERO_MEDIA } from '@/components/hero/hero-content';
import { TRAINER_PHOTO, TRAINER_SESSIONS } from '@/components/about/about-content';

/**
 * The manifest: one entry per slot, keyed by the content key the components use.
 *
 * `url` is the resolved value the site renders — an uploaded path when one
 * exists, otherwise the built-in default. It is never empty for a slot that has
 * a default, and never absent for a slot that does not.
 */
export interface ImagesManifest {
  readonly [key: string]: {
    /** The path the site renders. */
    readonly url: string;
    /** Where the value came from, so the admin can show provenance. */
    readonly source: 'override' | 'default' | 'unset';
  };
}

/**
 * Built-in defaults, by content key.
 *
 * These mirror the constants the components import. A slot with no shipped
 * asset has `''` — the logo, because no logo ships with the repository — and the
 * admin shows that as "not set" rather than as a missing value.
 * @returns {Record<string,string>}
 */
export function imageDefaults(): Record<string, string> {
  const sessions = TRAINER_SESSIONS.map((s) => s.src);
  return {
    hero: HERO_MEDIA.src,
    trainerPortrait: TRAINER_PHOTO.src,
    session1: sessions[0] ?? '',
    session2: sessions[1] ?? '',
    session3: sessions[2] ?? '',
    session4: sessions[3] ?? '',
    testimonial1: allTestimonials()[0]?.photo ?? '',
    testimonial2: allTestimonials()[1]?.photo ?? '',
    testimonial3: allTestimonials()[2]?.photo ?? '',
    logo: '',
  };
}

/**
 * Build the manifest from saved overrides and the defaults.
 *
 * Pure, so the admin route and the components cannot compute it differently.
 * @param {Record<string, string>} overrides saved paths, keyed by content key
 * @returns {ImagesManifest}
 */
export function buildManifest(overrides: Record<string, string>): ImagesManifest {
  const defaults = imageDefaults();
  const manifest: Record<string, { url: string; source: 'override' | 'default' | 'unset' }> = {};

  for (const [key, fallback] of Object.entries(defaults)) {
    const saved = overrides[key];
    if (saved) {
      manifest[key] = { url: saved, source: 'override' };
    } else if (fallback) {
      manifest[key] = { url: fallback, source: 'default' };
    } else {
      manifest[key] = { url: '', source: 'unset' };
    }
  }

  return manifest;
}
