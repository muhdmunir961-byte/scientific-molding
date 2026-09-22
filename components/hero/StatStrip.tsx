/**
 * StatStrip — the four PRD figures (Section 5.1).
 *
 * ── Markup choice: a description list ───────────────────────────────
 * This is a label/value pairing, which is what `<dl>` exists for. A screen
 * reader announces "07, specialist modules" as one unit; a `<ul>` of divs
 * would read the numbers and labels as unrelated siblings.
 *
 * ── `tabular-nums` ──────────────────────────────────────────────────
 * Every numeral sits in its own cell, so proportional figures would make the
 * four columns visibly uneven. Tabular figures lock the digit width, which the
 * Web Interface Guidelines require for any numeric column.
 *
 * The strip is four cards rather than four columns of one ruled table: each
 * figure is its own surface, which is what gives it a hover state at all.
 * A ruled column has nothing to lift.
 *
 * ── The leading zeros are content ───────────────────────────────────
 * "07", "04", "01" come straight from the PRD as strings. They are not
 * numbers to be normalised — the zero-padding is a deliberate design device
 * that gives the strip its rhythm — and they are the specific reason
 * `tabular-nums` matters here: proportional figures also vary the *gap*
 * after each digit, so the four two-digit figures would sit at four
 * different visual widths.
 *
 * ── Phase 4B ────────────────────────────────────────────────────────
 * The card surface (radius, background, the sm→md elevation step and the
 * lift) lives on `.hero-stat` in `globals.css`, not inline, because hover
 * and focus are not expressible in an inline style. What stays inline is
 * the per-instance `animation-delay`, which is a runtime value.
 */

import CountUp from '../shared/CountUp';
import { HERO_STATS } from './hero-content';

const STAGGER_STATS_MS = 240;

export default function StatStrip() {
  return (
    <dl
      className="hero-stat-strip content-reveal mt-8 grid grid-cols-2 gap-4 border-y py-8 sm:grid-cols-4"
      style={{
        animationDelay: `calc(1750ms + ${STAGGER_STATS_MS}ms)`,
      }}
    >
      {HERO_STATS.map((stat) => (
        /* `tabIndex={0}` so the card's hover state has a keyboard
           equivalent: without it the elevation change is mouse-only, and a
           keyboard user has no way to reach a `<dl>` child. The card is not
           a control, so it gets no `role` and no handler — it is focusable
           purely so `:focus-visible` can show the same raised state. */
        <div
          key={stat.label}
          tabIndex={0}
          className="hero-stat flex min-w-0 flex-col items-center px-4 py-6 text-center"
        >
          <dt className="sr-only">{stat.label}</dt>
          <dd className="m-0 flex flex-col items-center">
            {/* The numeral. Two treatments from PRD 13.1, "Numbered
                badges": "Large bold numerals on solid orange or yellow
                tiles". The first tile is solid orange with white text and
                the rest are yellow with charcoal, which is how the PRD
                describes the two treatments and gives the strip a lead
                figure. The accessible label is the <dt> above — the numeral
                is aria-hidden inside `<CountUp>`, because a value that
                animates from 0 must never be an accessible name. */}
            <CountUp
              value={stat.value}
              tone={stat.tone}
              className="text-h2 flex h-16 w-16 items-center justify-center leading-none sm:h-20 sm:w-20"
            />
            <span className="mt-3 text-body-sm text-[var(--ds-neutral-500)]">
              {stat.label}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
