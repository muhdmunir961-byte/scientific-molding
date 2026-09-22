/**
 * Hero — the split-screen opening section.
 *
 * ── Composition ─────────────────────────────────────────────────────
 * Desktop: 50/50 split, content left, visual right.
 * Mobile:  stacked, content first in DOM order so a screen-reader user and a
 *          keyboard user both meet the headline before the decorative frame.
 *          `lg:` drives the switch, so no JavaScript measures the viewport.
 *
 * ── Styling lives in globals.css ────────────────────────────────────
 * Phase 4B moved the section's surface, the stagger's companions (the stat
 * cards, the frame, the CTAs) and the scroll cue out of inline styles into
 * `app/globals.css`. Inline styles cannot express `:hover` or
 * `:focus-visible`, and several of these elements need all three states.
 *
 * What remains inline is only what is genuinely per-instance and
 * unqueryable from CSS: the reveal `animation-delay` values (runtime
 * `calc()`, not a design value) and the scroll cue's layout offset, which
 * is a Tailwind spacing utility like every other gutter in this file.
 *
 * ── Reveal timing ───────────────────────────────────────────────────
 * The Hero is revealed by the `.content-reveal` animation that
 * EntranceLoader's burn-out uncovers — see `app/globals.css`. The stagger
 * below is applied with `animation-delay` on top of that shared start point,
 * so the headline lands first and the visual settles last. Delays are listed
 * explicitly rather than derived, because only a fixed handful of elements
 * need them.
 *
 * ── Not animated with Framer Motion ─────────────────────────────────
 * The reveal is CSS. It starts while the overlay is still burning, which is
 * what makes the two read as one gesture; a Framer Motion variant would need
 * the loader to signal completion and would visibly hand over instead.
 * Framer Motion is used inside EntranceLoader, where the burn lives.
 */

import CtaGroup from './CtaGroup';
import HeroMedia from './HeroMedia';
import StatStrip from './StatStrip';
import {
  HERO_COPY,
  HERO_EYEBROW,
  HERO_HEADLINE_PARTS,
} from './hero-content';

/* ------------------------------------------------------------------ *
 * Reveal stagger
 * ------------------------------------------------------------------ */

/**
 * Extra delay, in ms, applied per region on top of the shared reveal.
 *
 * These sit AFTER the overlay has cleared (2200ms) so nothing is still moving
 * when the burn finishes — the visitor sees the headline, then the rest
 * settles in behind it.
 */
const STAGGER = {
  headline: 0,
  tagline: 90,
  subcopy: 160,
  stats: 240,
  cta: 320,
  media: 200,
} as const;

/**
 * Build the inline style that offsets an element's shared reveal.
 *
 * @param delayMs milliseconds to add after the base reveal begins
 * @returns style object consumed by the `style` attribute
 */
function stagger(delayMs: number): React.CSSProperties {
  return { animationDelay: `calc(1750ms + ${delayMs}ms)` };
}

/* ------------------------------------------------------------------ *
 * Section
 * ------------------------------------------------------------------ */

export default function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-headline"
      className="hero-section content-reveal relative isolate w-full overflow-hidden"
    >
      {/* Blueprint grid. Decorative, so it is hidden from assistive tech and
          cannot intercept a click. */}
      <div
        aria-hidden="true"
        className="hero-grid hero-grid-mask pointer-events-none absolute inset-0 -z-10"
      />

      {/*
       * The top-left radial wash.
       *
       * Polish #7 moved this from `.hero-section`'s `background` shorthand into
       * its own layer. The reason is the blueprint grid: as a `background` layer
       * on the section it sat UNDER the grid div (which is `-z-10` inside the
       * isolated section), so the wash and the grid were compositing in an order
       * that depended on two different stacking mechanisms. As a sibling layer
       * here it is explicit: wash, then grid, then content.
       *
       * It is also the layer the brief asks for at 0.4–0.6 opacity — a gradient
       * that reads as light falling on the corner rather than as a colour fill.
       * `pointer-events: none` so it cannot intercept a click.
       */}
      <div
        aria-hidden="true"
        className="hero-wash pointer-events-none absolute inset-0 -z-20"
      />

      {/*
       * Section rhythm on the compacted grid: 40px mobile, 64px desktop.
       *
       * The split is `1.05fr / 0.95fr` rather than the previous `1fr / 1fr`.
       * The copy column carries the headline, the tagline, the sub-copy, four
       * figures and three CTAs; the image column carries one frame. Equal
       * columns gave the frame the same width as the densest block on the page
       * and left the headline tracking at its 60ch cap before it had used the
       * space. The 5% shift to the left column is small enough that the section
       * still reads as the symmetric split it was designed as, and large enough
       * that the headline sets in two lines instead of three on a laptop.
       */}
      <div className="hero-inner container grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <HeroContent />
        <div className="content-reveal" style={stagger(STAGGER.media)}>
          <HeroMedia />
        </div>
      </div>

      {/* Scroll cue. Decorative — the same destinations are reachable by
          scrolling or by the nav, so this is `aria-hidden` rather than a
          second way into the content. */}
      <ScrollCue />
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Bottom-of-fold scroll cue
 * ------------------------------------------------------------------ */

/**
 * A chevron that bobs, marking the fold.
 *
 * Lucide's `ChevronDown` path is inlined rather than installing
 * `lucide-react` for one glyph — the repo already inlines its other icons
 * (arrow, phone, mail) in keeping with the PRD's zero-extra-dependency
 * stance, and next/image plus next/font already carry the payload budget.
 *
 * The bob lives in `globals.css` so the reduced-motion block can stop it.
 * Centred rather than left-aligned: it points at the page, not at the
 * column.
 */
function ScrollCue() {
  return (
    <div
      aria-hidden="true"
      className="content-reveal pointer-events-none relative z-10 flex justify-center pb-8"
      style={stagger(400)}
    >
      <span className="hero-scroll-cue h-10 w-10">
        <svg
          aria-hidden="true"
          className="hero-scroll-cue-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Left column
 * ------------------------------------------------------------------ */

function HeroContent() {
  return (
    <div className="flex min-w-0 flex-col">
      <Eyebrow />

      {/* Spacing steps are 16px and 24px — 2 and 3 units on the 8px grid.

          `text-hero` carries the size clamp, the 1.1 leading, the tighter
          tracking and the 800 weight. The utilities bake in weight because
          the scale is a hierarchy — a display size set at book weight loses
          the contrast that makes the hierarchy readable — so the previous
          per-element `font-extrabold leading-[1.08] tracking-[-0.02em]` is
          now one class with one source of truth.

          `max-w-[60ch]` is new and is the brief's cap. It is a *ceiling*,
          not a width: the left column is already narrower than 60ch at
          every breakpoint, so nothing reflows today. It exists so a future
          wider column cannot stretch this headline to an unreadable
          measure. */}
      <h1
        id="hero-headline"
        className="content-reveal text-hero mt-4 max-w-[60ch]"
        style={stagger(STAGGER.headline)}
      >
        {/*
         * Two-tone headline. ONE <h1> holding two spans, so a screen reader
         * announces "Scientific Molding Training Series" once rather than as
         * two headings — and so the text is selectable and copyable as one
         * sentence.
         *
         * The fragments come from `HERO_HEADLINE_PARTS`, which DERIVES them from
         * `HERO_COPY.headline`. The visible string is therefore still exactly the
         * PRD's, with no second source of truth to drift from it.
         *
         * The keyword takes `--ds-orange-500` (the brand accent, 3.4:1 — fine at
         * display size) and the remainder `--ds-neutral-800` charcoal. The
         * previous single charcoal run made the headline one flat mass at 800
         * weight; the accent run is what gives the eye an entry point.
         */}
        {HERO_HEADLINE_PARTS.accent && (
          <span className="hero-headline-keyword text-[var(--ds-orange-500)]">
            {HERO_HEADLINE_PARTS.accent}
          </span>
        )}
        <span className="hero-headline-rest text-[var(--ds-neutral-800)]">
          {HERO_HEADLINE_PARTS.rest}
        </span>
      </h1>

      {/* `text-h4` at 18–20px, where the old rule was a fixed `text-lg` /
          `sm:text-xl` (18/20px). Same rendered sizes at every breakpoint —
          the steps now come from the type scale instead of being restated
          per element.

          PRD Section 5.1's tagline string is "7 structured modules. One
          stronger moulding organisation." It contains no occurrence of
          "Scientific Molding", so there is no substring to wrap in the
          brief's keyword colour. Colouring the whole tagline is the only
          way to satisfy that requirement without editing the copy, which
          is out of bounds. Single line, so it is one place to revert. */}
      <p
        className="content-reveal text-h4 mt-4 max-w-[46ch] text-[var(--ds-orange-500)]"
        style={stagger(STAGGER.tagline)}
      >
        {HERO_COPY.tagline}
      </p>

      {/* `--ds-neutral-500` rather than the headline's `--ds-neutral-900`:
          the sub-copy is the third rank in this column and is meant to be
          read after the tagline, not instead of it. */}
      <p
        className="content-reveal text-body-lg mt-4 max-w-[52ch] text-[var(--ds-neutral-500)]"
        style={stagger(STAGGER.subcopy)}
      >
        {HERO_COPY.subcopy}
      </p>

      <StatStrip />
      <CtaGroup />
    </div>
  );
}

/**
 * Small pre-headline label.
 *
 * Copy from `HERO_EYEBROW` — "HRDC Claimable Training". This is a factual
 * accreditation statement (HRD Corp claimable is a specific scheme with its own
 * rules), so it is reproduced verbatim rather than reworded.
 *
 * `.eyebrow` supplies the uppercase transform, the wide tracking and the 600
 * weight at the eyebrow step of the scale. The class replaces a hard-coded
 * `tracking-[0.18em]` and `font-bold` — 0.18em and 700 were both off the
 * scale, and every later section's eyebrow needs to match this one.
 */
function Eyebrow() {
  return (
    <p
      className="content-reveal eyebrow text-[var(--ds-orange-500)]"
      style={stagger(0)}
    >
      {HERO_EYEBROW}
    </p>
  );
}