/**
 * TrainerStatCards — the trainer's track record, PRD Section 5.2.
 *
 * ── Same treatment as the Hero strip ────────────────────────────────
 * Per the decision for this build, these reuse the Section 13.1 badge
 * treatment the Hero uses: "Large bold numerals on solid orange or yellow
 * tiles (white numeral text on orange; charcoal numeral text on yellow)."
 *
 * The tiles alternate starting with orange, so the two strips on the page read
 * as the same component family rather than two different designs.
 *
 * ── Markup: a description list ──────────────────────────────────────
 * A label/value pairing, which is what `<dl>` is for. A `<ul>` of divs would
 * read the numerals and labels as unrelated siblings.
 *
 * ── Three items, not four ───────────────────────────────────────────
 * PRD 5.2 gives three figures and the PRD is the source of truth, so this is
 * a 3-column grid at `sm`. Forcing four would mean inventing a fourth.
 *
 * ── `tabular-nums` ──────────────────────────────────────────────────
 * "17+", "500+" and "60+" sit in separate cells, so tabular figures keep the
 * three columns visually even. Without it the wider "500+" nudges its label.
 * It lives on the numeral from `.trainer-stat-numeral` in `globals.css` and is
 * asserted there, so the CSS and the renderer cannot disagree.
 *
 * ── Tiles are focusable ─────────────────────────────────────────────
 * Each tile lifts and gains elevation on hover, so each takes `tabIndex={0}`
 * (docs/design-system.md, "card hover lift"). Focusable but not clickable: no
 * `role`, no key handler, because activating a tile does nothing.
 */

import { TRAINER_STATS } from './about-content';

export default function TrainerStatCards() {
  return (
    <dl className="trainer-stat-strip mt-8 grid grid-cols-1 gap-8 border-y py-8 sm:grid-cols-3">
      {TRAINER_STATS.map((stat) => (
        <div key={stat.label} className="flex min-w-0 items-start gap-4">
          {/*
           * `aria-hidden` on the numeral: the <dt> already carries the label,
           * and leaving both audible makes a screen reader announce
           * "17+, Years Experience, 17+".
           */}
          <dt className="sr-only">{stat.label}</dt>
          <dd className="m-0 flex items-start gap-4">
            <span
              aria-hidden="true"
              tabIndex={0}
              data-tone={stat.tone}
              className="trainer-stat-numeral flex h-16 w-16 shrink-0 items-center justify-center text-xl font-extrabold leading-none sm:h-20 sm:w-20 sm:text-2xl"
            >
              {stat.value}
            </span>
            <span className="min-w-0 pt-2 text-body-sm font-semibold leading-snug text-[var(--ds-neutral-800)] sm:text-body [text-wrap:pretty]">
              {stat.label}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
