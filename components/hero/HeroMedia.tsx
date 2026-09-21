/**
 * HeroMedia — the right-hand visual.
 *
 * ── Polish #7 ───────────────────────────────────────────────────────
 * This component used to own a bespoke placeholder: a moulding-platen SVG
 * inside a `hero-grid` frame with an "Image placeholder" caption. It now
 * delegates the frame to `<ImageSlot>`, which is the one implementation of
 * "an image position" on the page — the same component fills the trainer
 * portrait and the four session slots in About.
 *
 * ── What moved where ────────────────────────────────────────────────
 *  - The frame's radius (`xl`) and elevation (`lg`) are `ImageSlot` props, per
 *    the shadow table: a photograph on a light field is a floating element.
 *  - The 4:5 ratio comes from `HERO_MEDIA`'s intrinsic dimensions, which is why
 *    the frame reserves its space before the asset arrives and the fold never
 *    shifts.
 *  - The orange tint and the missing-file fallback live in `ImageSlot`, so a
 *    hero image and a session image cannot render two different empty states.
 *
 * ── Why the warm halo stays here ────────────────────────────────────
 * It is a page-specific composition element — the Hero's light source, matching
 * the radial wash on `.hero-section` — not part of what an image slot is. A
 * session photograph in About does not want it, so it belongs at this use site
 * rather than inside the shared frame.
 */

import ImageSlot from '../shared/ImageSlot';
import { HERO_MEDIA } from './hero-content';

export default function HeroMedia() {
  return (
    <figure className="relative m-0 w-full">
      {/* Warm halo behind the frame. Purely decorative, so it is aria-hidden
          and kept out of the layout flow.

          This has to stay an inline style: it is a multi-stop gradient with
          two brand colours at specific stops and no token or class expresses
          it, and it is unique to this one element. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[var(--ds-radius-xl)] opacity-70 blur-2xl"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 40%, rgba(255,201,60,0.35) 0%, rgba(240,124,35,0.18) 45%, transparent 75%)',
        }}
      />

      <ImageSlot
        src={HERO_MEDIA.src}
        width={HERO_MEDIA.width}
        height={HERO_MEDIA.height}
        alt={HERO_MEDIA.alt}
        radius="xl"
        elevation="lg"
        /* Above the fold and critical to the composition. */
        priority
        sizes="(max-width: 1024px) 100vw, 50vw"
        objectPosition="50% 35%"
        className="hero-frame"
      />
    </figure>
  );
}
