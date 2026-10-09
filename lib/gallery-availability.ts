/**
 * Gallery availability — which image slots have a usable file.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THIS IS A SEPARATE MODULE, AND WHY IT MATTERS
 *
 *  The first attempt at the empty-frame fix put this check inside
 *  `components/shared/image-content.ts`. That module is imported by
 *  `TrainerPhoto`, which is a **client** component, so `node:fs` was pulled into
 *  the browser bundle and the build failed outright:
 *
 *      Failed to write app endpoint /page
 *      the chunking context does not support external modules (request: node:fs)
 *
 *  That is a build-time failure rather than a silent one, which is the good
 *  case — but it only showed up because the whole page was built. Splitting the
 *  check into its own module, imported only by the server component that needs
 *  it, keeps `image-content.ts` safe to import from either side.
 *
 *  ── Why a filesystem check and not a fetch ─────────────────────────────
 *  A missing file is a fact about the build, not about the network. Checking the
 *  disk is synchronous, cannot fail halfway, and cannot be defeated by a proxy —
 *  the same reasoning the output checker uses when it reads the built stylesheet
 *  from `.next/` rather than fetching it over HTTP.
 *
 *  ── Why a remote URL counts as available ───────────────────────────────
 *  An uploaded image lives in R2, which has no local file to stat. Fetching it
 *  during render would add a network round trip to every page load to answer a
 *  question the operator already answered by uploading. So a remote URL is
 *  trusted, and `ImageSlot`'s runtime `onError` covers the case where it later
 *  404s.
 * ════════════════════════════════════════════════════════════════════════
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { SESSION_IMAGES } from '@/components/shared/image-content';

/**
 * Whether a slot's src resolves to a usable image.
 * @param {string} src
 * @returns {boolean}
 */
export function imageAvailable(src: string): boolean {
  if (!src) return false;
  if (/^https?:\/\//.test(src)) return true;

  try {
    return existsSync(join(process.cwd(), 'public', src.replace(/^\/+/, '')));
  } catch {
    /*
     * A filesystem that cannot be read is not a reason to hide a photograph.
     * Returning true means the worst case is the gradient the page showed
     * before this check existed — a visible frame, not a vanished section.
     */
    return true;
  }
}

/**
 * The session photographs that actually have an image.
 *
 * The gallery renders this rather than `SESSION_IMAGES` so a slot with no file
 * produces no frame at all. Four empty 4:3 tiles read as a broken page; an
 * absent grid reads as a section that has no photographs yet, which is the
 * truth.
 * @returns {typeof SESSION_IMAGES}
 */
export function availableSessionImages(): typeof SESSION_IMAGES {
  return SESSION_IMAGES.filter((session) => imageAvailable(session.src));
}
