/**
 * Page images — every image position, with admin-panel overrides.
 *
 * ── How the override works ──────────────────────────────────────────────
 * The admin panel writes `components/generated/images-content.generated.ts`
 * when image paths are saved. This module tries to import it and falls back to
 * the defaults below when it does not exist.
 *
 * ── Why the dimensions live here, not in the generated file ─────────────
 * `ImageSlot` uses `width`/`height` to reserve the frame's aspect ratio. If an
 * upload changed the ratio, the layout would reflow on every replacement of an
 * image. So the ratio is fixed here and only the path is overridable.
 */

import { HERO_MEDIA } from '../hero/hero-content';
import { TRAINER_PHOTO, TRAINER_SESSIONS } from '../about/about-content';
import { TESTIMONIALS } from '../testimonials/testimonials-content';

/**
 * Overrides written by the admin panel.
 *
 * Declared as an optional lookup rather than a required import so the site
 * builds and runs identically before the panel has ever been used.
 */
interface ImageOverrides {
  readonly hero?: string;
  readonly trainerPortrait?: string;
  readonly session1?: string;
  readonly session2?: string;
  readonly session3?: string;
  readonly session4?: string;
  readonly testimonial1?: string;
  readonly testimonial2?: string;
  readonly testimonial3?: string;
  readonly logo?: string;
}

let overrides: ImageOverrides = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  overrides = require('../generated/images-content.generated').PAGE_IMAGES ?? {};
} catch {
  // No generated file yet — the defaults below are used. This is the normal
  // state on a fresh checkout and must not be treated as an error.
}

/** The hero image, with any panel override applied. */
export const HERO_IMAGE = {
  src: overrides.hero || HERO_MEDIA.src,
  width: HERO_MEDIA.width,
  height: HERO_MEDIA.height,
  alt: HERO_MEDIA.alt,
} as const;

/** The trainer portrait, with any panel override applied. */
export const TRAINER_PORTRAIT_IMAGE = {
  src: overrides.trainerPortrait || TRAINER_PHOTO.src,
  width: TRAINER_PHOTO.width,
  height: TRAINER_PHOTO.height,
  alt: TRAINER_PHOTO.alt,
} as const;

/** One session photograph, with any panel override applied. */
export interface SessionImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

/**
 * The four session photographs, with any panel override applied per slot.
 *
 * A map rather than a zip: `TRAINER_SESSIONS` may in principle be shorter than
 * the four override keys, and pairing by index keeps the dimensions attached to
 * the right slot without a lookup that could miss.
 */
export const SESSION_IMAGES: readonly SessionImage[] = TRAINER_SESSIONS.map(
  (session, index) => {
    const key = `session${index + 1}` as keyof ImageOverrides;
    return {
      src: overrides[key] || session.src,
      width: session.width,
      height: session.height,
      alt: session.alt,
    };
  },
);

/**
 * Testimonial avatars, with any panel override applied per slot.
 *
 * Unlike the other slots, the avatar default comes from the testimonial itself
 * (each entry names its own `avatar` path), so the override only wins when the
 * admin has actually uploaded a replacement.
 */
export const TESTIMONIAL_AVATARS = TESTIMONIALS.map((testimonial, index) => {
  const key = `testimonial${index + 1}` as keyof ImageOverrides;
  return overrides[key] || testimonial.avatar;
});

/**
 * The logo image.
 *
 * Empty by default: the header renders the text wordmark, and an uploaded logo
 * takes its place. A default logo path would show a broken frame on every fresh
 * checkout, because no logo asset ships with the repository.
 */
export const LOGO_IMAGE = overrides.logo ?? '';

/**
 * Whether a slot's src is a remote URL rather than a local path.
 *
 * Safe to call from a client component: it reads nothing but the string.
 * @param {string} src
 * @returns {boolean}
 */
export function isRemote(src: string): boolean {
  return /^https?:\/\//.test(src);
}

/**
 * The session photographs whose src is a remote URL.
 *
 * ── Why this is NOT the availability filter ─────────────────────────────
 * Deciding whether a local file exists needs `node:fs`, and this module is
 * imported by `TrainerPhoto`, which is a client component — so a filesystem call
 * here ends up in the browser bundle and Turbopack fails the build with
 * `the chunking context does not support external modules (request: node:fs)`.
 *
 * The filesystem half of the check therefore lives in
 * `lib/gallery-availability.ts`, which is imported only by the server component
 * `About.tsx`. What stays here is the half that needs no Node API.
 *
 * @returns {typeof SESSION_IMAGES}
 */
export function remoteSessionImages(): typeof SESSION_IMAGES {
  return SESSION_IMAGES.filter((session) => isRemote(session.src));
}
