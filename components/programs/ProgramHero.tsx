/**
 * ProgramHero — the solid-black program hero, reusable across all 5 programs.
 *
 * ════════════════════════════════════════════════════════════════════
 *  PDF WINS OVER PRD 13.1 HERE.
 *
 *  PRD 13.1 says: "replacing the earlier black/dark scheme. No dark/black
 *  sections; dark text sits on white/light backgrounds instead."
 *
 *  All five supplied program PDFs use a solid black hero with an orange
 *  title. The customer confirmed the PDF look is required. So this one
 *  component deliberately contradicts that PRD line, and it is the only
 *  place in the build that does.
 *
 *  The site Hero (5.1) and About (5.2) keep their light treatment — they
 *  match their own brief, and the program PDFs do not cover them.
 * ════════════════════════════════════════════════════════════════════
 *
 * ── Layout ──────────────────────────────────────────────────────────
 * Full-width, `min-height: 50vh` capped at 80vh so a wide desktop does not
 * produce an absurdly tall block. Padding carries the safe-area insets.
 *
 * The height was 70vh/90vh. Across five consecutive programs that is five
 * near-full-viewport blocks before any content — the visitor scrolls a screen
 * and a half per program just to reach the material the program exists to show.
 * 50vh still reads as a hero (it holds the eyebrow, title, tagline, sub-copy and
 * badges with room to spare) while letting the first content block appear above
 * the fold on a laptop.
 *
 * ── Title treatment ─────────────────────────────────────────────────
 * The PDFs set the program name in large orange caps. `titleOrange` holds the
 * leading fragment and `titleRest` the remainder, so the two-tone split
 * survives extraction rather than being lost in a single string.
 *
 * ── Accessibility ───────────────────────────────────────────────────
 *  - The two title fragments are ONE `<h1>` (a text run, not two headings),
 *    so a screen reader announces the full program name once.
 *  - The eyebrow is a `<p>`, not a heading: it is a label, and making it a
 *    heading would add an outline level nothing navigates by.
 *  - Contrast: white on #1A1A1A is ~16.9:1; the orange title is ~4.6:1, which
 *    clears AA for the large text it is used for.
 */

import ScrollReveal from '../about/ScrollReveal';
import { TRAINER_CREDIBILITY } from './trainer-credibility';

export interface ProgramHeroProps {
  /** Anchor id, e.g. "fundamentals". */
  id: string;
  /** Small uppercase tracking-wide label above the title. */
  eyebrow: string;
  /**
   * Leading fragment of the title, rendered in PDF orange.
   * Omit to render `titleRest` alone in white.
   */
  titleOrange?: string;
  /** Remainder of the title, rendered in white. */
  titleRest: string;
  /** Second line under the title. */
  tagline?: string;
  /** Longer paragraph. */
  subcopy?: string;
  /** Primary badge, e.g. "2-Day". */
  badge?: string;
  /** Secondary badge, e.g. "HRDC Claimable". */
  badgeSecondary?: string;
  /**
   * Badge colour. `'orange'` is the standard treatment; `'yellow'` marks the
   * premium tier (Program C's 4-Day).
   *
   * A tone, not a colour: the value names the brand accent, and the class it
   * selects owns the fill, border and text colour together. Passing a raw hex
   * here would let the badge drift from the palette the rest of the page uses.
   */
  badgeTone?: 'orange' | 'yellow';
}

/**
 * A hero badge on the dark surface.
 *
 * Orange fill with white text is 3.1:1 — AA-large only — and these labels are
 * 14px. So the badge uses an orange-tinted translucent fill with an orange
 * border and white text, which keeps the PDF look while putting the label at
 * ~13:1.
 */
function HeroBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'orange' | 'yellow';
}) {
  return (
    <li>
      {/* `.program-hero-badge` owns the pill geometry; `.program-badge-<tone>`
          owns the colour, so a program swaps tone without re-declaring shape. */}
      <span className={`program-hero-badge program-badge-${tone}`}>
        {label}
      </span>
    </li>
  );
}

export default function ProgramHero({
  id,
  eyebrow,
  titleOrange,
  titleRest,
  tagline,
  subcopy,
  badge,
  badgeSecondary,
  badgeTone = 'orange',
}: ProgramHeroProps) {
  const headingId = `${id}-heading`;

  return (
    <header
      id={id}
      className="program-hero relative isolate w-full overflow-hidden"
      style={{ minHeight: '50vh', maxHeight: '80vh' }}
    >
      {/* Hairline grid on the dark surface. White at low alpha, decorative, so
          it is hidden from assistive tech and cannot take a click. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 program-hero-grid"
      />

      {/* Padding is the compacted section rhythm, so a hero and the body beneath
          it sit on the same grid. It was `py-16 lg:py-24` inside a 1400px
          container while the body below it used 1400px too — consistent, but
          32px wider than every other section on the page. `.container` is now
          1280px, matching About, Why, Track Record, Testimonials and Contact. */}
      <div className="container program-hero-inner">
        <div className="max-w-[64ch]">
          <ScrollReveal>
            <p className="eyebrow program-hero-eyebrow">
              {eyebrow}
            </p>

            {/*
             * One <h2> holding two spans. Two headings would make a screen
             * reader announce the program name as two separate titles.
             *
             * ── Why h2 and not h1 (Polish #7, Session 2) ────────────────
             * Every program hero shipped as an <h1>, so the document carried
             * SIX top-level headings: the site headline plus five program
             * titles. A screen-reader user navigating by heading (`H` in most
             * readers) jumps between six equally-ranked titles with no way to
             * tell which one is the page, and "the h1 of this page" has no
             * single answer — which breaks the one navigation shortcut heading
             * structure exists to provide.
             *
             * The page's subject is the training series, so the site Hero owns
             * the <h1>. Each program is a section of that page, and a section
             * heading is an <h2>. The outline is now: h1 (page) → h2 (each
             * section, including each program) → h3 (blocks within it).
             *
             * The `<h1>` in the heading-level check was correct before this and
             * would not have caught it: a skip is a *missing* level, and six h1s
             * is a level that appears too often.
             */}
            <h2 id={headingId} className="mt-3 program-hero-heading">
              {titleOrange && (
                <span className="program-hero-title-orange">{titleOrange}</span>
              )}{' '}
              <span className="program-hero-title-white">{titleRest}</span>
            </h2>

            {tagline && (
              <p className="mt-3 program-hero-tagline">{tagline}</p>
            )}

            {subcopy && (
              <p className="mt-3 program-hero-subcopy">{subcopy}</p>
            )}

            {(badge || badgeSecondary) && (
              <ul className="mt-6 program-hero-badges">
                {badge && <HeroBadge label={badge} tone={badgeTone} />}
                {badgeSecondary && <HeroBadge label={badgeSecondary} tone={badgeTone} />}
              </ul>
            )}

            {/*
             * The one-line trainer credit.
             *
             * Every program used to close with the full `TrainerCredibility`
             * strip — a "Your Trainer" heading, seven credentials with icons and
             * a three-figure stat row — under all five program bodies. That is
             * the same block five times on one page, and the copy is identical
             * each time, so it stopped being a credential and became wallpaper.
             *
             * The full strip now renders once, in the About section, which is
             * where a reader goes to evaluate the trainer. Here the hero carries
             * the single line that matters at the moment of choosing a
             * programme: who runs it, how long they have done it, and that it is
             * HRD Corp claimable. The name and the figures are the SAME strings
             * from `trainer-credibility.ts`, so the two cannot drift.
             */}
            <p className="program-hero-credibility">{TRAINER_CREDIBILITY.oneLine}</p>
          </ScrollReveal>
        </div>
      </div>
    </header>
  );
}
