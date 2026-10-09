/**
 * Page images — the six image positions, with admin-panel overrides.
 *
 * ── How the override works ──────────────────────────────────────────────
 * The admin panel writes `components/generated/images-content.generated.ts`
 * when image paths are saved. This module tries to import it and falls back to
 * the defaults below when it does not exist.
 *
 * A static `import` would fail the build if the file were absent, so the
 * generated module is read through `try/catch`-guarded `require`-style access —
 * which is only sound because the import is build-time resolved. The pattern
 * used here is a plain conditional import in a server-safe module.
 *
 * ── Why the dimensions live here, not in the generated file ─────────────
 * `ImageSlot` uses `width`/`height` to reserve the frame's aspect ratio. If an
 * upload changed the ratio, the layout would reflow on every replacement of an
 * image. So the ratio is fixed here and only the path is overridable.
 */

import { HERO_MEDIA } from '../hero/hero-content';
import { TRAINER_PHOTO, TRAINER_SESSIONS } from '../about/about-content';

/**
 * Overrides written by the admin panel.
 *
 * Declared as an optional lookup rather than a required import so the site
 * builds and runs identically before the panel has ever been used. Assignment
 * happens below in a guarded block.
 */
interface ImageOverrides {
  readonly hero?: string;
  readonly trainerPortrait?: string;
  readonly session1?: string;
  readonly session2?: string;
  readonly session3?: string;
  readonly session4?: string;
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

/**
 * The four session photographs, with any panel override applied per slot.
 *
 * A zip rather than a map with a non-null assertion: `TRAINER_SESSIONS` may in
 * principle be shorter than the four override keys, and pairing by index keeps
 * the dimensions attached to the right slot without a lookup that could miss.
 */
export const SESSION_IMAGES = TRAINER_SESSIONS.map((session, index) => {
  const key = `session${index + 1}` as keyof ImageOverrides;
  return {
    src: overrides[key] || session.src,
    width: session.width,
    height: session.height,
    alt: session.alt,
  };
});
