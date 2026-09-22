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

          The gradient reads its two stops from the palette tokens rather than
          hardcoded rgba: `--ds-yellow-500` is the same #FFC93C and
          `--ds-orange-500` the same #E8631C the previous literals named, so the
          halo cannot fork from the brand if either token moves. The softness
          comes from the layer's own opacity and the `blur-2xl` utility rather
          than from alpha baked into the stops.

          The gradient itself lives in `.hero-media-halo` in `globals.css` — it
          is a multi-stop radial with element-specific geometry, which no token
          expresses, so it is declared as a class rather than inline. */}
      <div
        aria-hidden="true"
        className="hero-media-halo pointer-events-none absolute -inset-4 -z-10 rounded-[var(--ds-radius-xl)] blur-2xl"
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
