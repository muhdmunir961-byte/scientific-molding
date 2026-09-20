/**
 * About — the trainer bio section, PRD Section 5.2.
 *
 * ── Layout ──────────────────────────────────────────────────────────
 * Desktop: 2 columns, bio left, photo right.
 * Mobile:  stacked. The bio is first in DOM order, so a screen-reader or
 *          keyboard user meets the name and credentials before the portrait —
 *          which is the order that matters for comprehension.
 * `lg:` drives the switch, so nothing measures the viewport in JavaScript.
 *
 * ── No entrance animation ───────────────────────────────────────────
 * This section is BELOW the fold, so it is not part of the burn-out reveal.
 * It uses `ScrollReveal` — an IntersectionObserver that fades and lifts each
 * block once, when it first comes into view. That is the standard treatment for
 * content below the fold; replaying the entrance animation here would be wrong
 * and would delay content the visitor is already looking at.
 *
 * ── Surface alternation ─────────────────────────────────────────────
 * PRD Section 13.1: off-white `#FDFBF7` "for alternating sections (instead of
 * dark blocks)". The Hero takes the off-white end of that alternation, so this
 * section takes white — the two still alternate down the page exactly as the
 * token table describes. `.about-section` in `globals.css` carries the detail:
 * a white base with a wash mirrored from the Hero's, which is what stops the
 * alternation reading as a hole where the Hero's colour simply stops.
 */

import CredentialList from './CredentialList';
import ScrollReveal from './ScrollReveal';
import TrainerPhoto from './TrainerPhoto';
import TrainerStatCards from './TrainerStatCards';
import { TRAINER_EYEBROW, TRAINER_NAME } from './about-content';

export default function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="about-section relative isolate w-full overflow-hidden"
    >
      {/* Blueprint grid, continuous with the Hero. Decorative, so it is hidden
          from assistive tech and cannot intercept a click. */}
      <div
        aria-hidden="true"
        className="hero-grid hero-grid-mask pointer-events-none absolute inset-0 -z-10"
      />

      {/* Section rhythm on the 8px grid: 64px mobile, 96px desktop. */}
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-start gap-16 px-8 py-16 sm:px-12 lg:grid-cols-2 lg:px-16 lg:py-24">
        <BioColumn />
        <ScrollReveal delayMs={160}>
          <TrainerPhoto />
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Left column — bio
 * ------------------------------------------------------------------ */

function BioColumn() {
  return (
    <div className="flex min-w-0 flex-col">
      <ScrollReveal>
        <p className="eyebrow text-[var(--ds-orange-500)]">{TRAINER_EYEBROW}</p>

        {/* `.text-h2`, not a bespoke clamp. The heading was
            `text-[1.75rem] … lg:text-[2.5rem]` — three size overrides
            approximating a step the scale already defines, and one of four
            slightly different h2 steps across the page. The section heading is
            already `<h2>`, so it takes the h2 step. */}
        <h2
          id="about-heading"
          className="mt-4 text-h2 text-[var(--ds-neutral-900)]"
        >
          {TRAINER_NAME}
        </h2>
      </ScrollReveal>

      <ScrollReveal delayMs={80}>
        <CredentialList />
      </ScrollReveal>

      <ScrollReveal delayMs={160}>
        <TrainerStatCards />
      </ScrollReveal>
    </div>
  );
}
