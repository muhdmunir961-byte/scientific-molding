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
 * Full-width, `min-height: 70vh` capped at 90vh so a wide desktop does not
 * produce an absurdly tall block. Padding carries the safe-area insets.
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
      style={{ minHeight: '70vh', maxHeight: '90vh' }}
    >
      {/* Hairline grid on the dark surface. White at low alpha, decorative, so
          it is hidden from assistive tech and cannot take a click. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 program-hero-grid"
      />

      <div className="mx-auto w-full max-w-[1400px] px-8 sm:px-12 lg:px-16">
        <div className="max-w-[64ch]">
          <ScrollReveal>
            <p
              className="eyebrow program-hero-eyebrow"
            >
              {eyebrow}
            </p>

            {/*
             * One <h1> holding two spans. Two headings would make a screen
             * reader announce the program name as two separate titles.
             */}
            <h1
              id={headingId}
              className="mt-4 program-hero-heading font-extrabold tracking-tighter leading-[1.05]"
            >
              {titleOrange && (
                <span className="program-hero-title-orange">{titleOrange}</span>
              )}{' '}
              <span className="program-hero-title-white">{titleRest}</span>
            </h1>

            {tagline && (
              <p className="mt-4 program-hero-tagline">{tagline}</p>
            )}

            {subcopy && (
              <p className="mt-4 program-hero-subcopy">{subcopy}</p>
            )}

            {(badge || badgeSecondary) && (
              <ul className="mt-8 program-hero-badges">
                {badge && <HeroBadge label={badge} tone={badgeTone} />}
                {badgeSecondary && <HeroBadge label={badgeSecondary} tone={badgeTone} />}
              </ul>
            )}
          </ScrollReveal>
        </div>
      </div>
    </header>
  );
}
