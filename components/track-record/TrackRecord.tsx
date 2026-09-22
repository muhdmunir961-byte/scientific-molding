/**
 * §5.5 — Track Record / Trust Strip.
 *
 * ── Why a new component, not a `TrainerCredibility` variant ─────────
 * `TrainerCredibility` was a compact strip that repeated inside all five program
 * sections. This section is the opposite — three display figures at
 * `clamp(4rem, 10vw, 6rem)`, an HRDC accreditation card and a trust statement.
 * They share the credentials *data* (`trainer-credibility.ts`), which is the part
 * that actually matters.
 *
 * ════════════════════════════════════════════════════════════════════
 *  POLISH #7 — THIS SECTION IS NOW DARK.
 *
 *  It sat on `--prd-offwhite`, one step off the `--pdf-white` Contact section
 *  below it. Two near-white surfaces in a row is the failure mode the whole
 *  alternation exists to prevent: the boundary between them is invisible, so
 *  the section reads as an extra paragraph rather than as a new topic.
 *
 *  It takes `--ds-neutral-900`, the same dark the program heroes and the footer
 *  use. That does three things at once:
 *
 *    1. It makes the boundary unmistakable, at a hard edge with no divider.
 *    2. It puts the page's biggest claim ("proven across Malaysian injection
 *       moulding") on the page's strongest surface. Weight follows meaning.
 *    3. It restores a dark/light rhythm to the lower half of the page. Before
 *       this, everything from Program E's hero to the footer was light: one
 *       dark block, then six light ones.
 *
 *  Colour on the dark surface: white text, `rgba(255,255,255,0.7)` secondary,
 *  and the figures in `--ds-orange-500`. Charcoal or warm grey on #1a1a1a would
 *  be unreadable, so every colour below was re-picked rather than inherited.
 * ════════════════════════════════════════════════════════════════════
 *
 * ── Accessibility ───────────────────────────────────────────────────
 *  - Each figure is a `<dl>` row: the value and label are a pair, so a screen
 *    reader announces "17+, Years Industry + Academia" as one unit.
 *  - The numeral is `aria-hidden` because its `<dt>` already carries the label;
 *    exposing both makes a reader say the number twice. It is rendered through
 *    `<CountUp>`, which owns that and the tabular figures.
 *  - The credential list is a `<ul>`, so a reader reports "list, 7 items".
 *  - The trust statement is a `<blockquote>` because it is a quoted claim, not
 *    body copy.
 *  - Contrast on `#1a1a1a`: white is 16.9:1, `rgba(255,255,255,0.7)` is ~11.4:1,
 *    and `--ds-orange-500` is 5.2:1 — all above the 4.5:1 floor for body text.
 */

import {
  BadgeCheck,
  Box,
  Car,
  CircuitBoard,
  Factory,
  HeartPulse,
  Package,
  type LucideIcon,
} from 'lucide-react';

import ScrollReveal from '../about/ScrollReveal';
import CountUp from '../shared/CountUp';
import {
  TRAINER_CREDIBILITY_CREDENTIALS,
  TRAINER_CREDIBILITY_NAME,
} from '../programs/trainer-credibility';
import {
  CLIENT_TYPES,
  CLIENT_TYPES_HEADING,
  TRACK_RECORD_CAPTION,
  TRACK_RECORD_HERO,
  TRACK_RECORD_HRDC,
  TRACK_RECORD_ID,
  TRACK_RECORD_STATEMENT,
  TRACK_RECORD_STATS,
} from './track-record-content';

/**
 * Icon lookup for the client-type strip.
 *
 * One explicit map rather than names resolved at render time, so the bundler
 * tree-shakes. A dynamic import would ship all several thousand Lucide icons to
 * render five.
 */
const ICONS: Record<string, LucideIcon> = {
  car: Car,
  'circuit-board': CircuitBoard,
  package: Package,
  'heart-pulse': HeartPulse,
  box: Box,
};

export default function TrackRecord() {
  return (
    <section
      id={TRACK_RECORD_ID}
      aria-labelledby={`${TRACK_RECORD_ID}-heading`}
      className="track-section relative isolate w-full overflow-hidden"
    >
      {/* Hairline grid on the dark surface — white at low alpha, matching the
          program heroes. Decorative, so it is hidden from assistive tech and
          cannot intercept a click. */}
      <div aria-hidden="true" className="track-grid pointer-events-none absolute inset-0 -z-10" />

      <div className="container track-inner">
        <ScrollReveal>
          <header className="max-w-[64ch]">
            <p className="eyebrow">{TRACK_RECORD_HERO.eyebrow}</p>

            <h2 id={`${TRACK_RECORD_ID}-heading`} className="text-h2 track-title">
              {TRACK_RECORD_HERO.title}
            </h2>

            <p className="text-body track-subcopy">{TRACK_RECORD_HERO.subcopy}</p>
          </header>
        </ScrollReveal>

        <BigStatCards />
        <HrdcCard />
        <CredentialStrip />
        <ClientTypeStrip />
        <TrustStatement />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Blocks
 * ------------------------------------------------------------------ */

/**
 * The three display figures.
 *
 * ── Layout: 40 / 35 / 25, not three equal cards ─────────────────────
 * Three identical columns say "these three things are equally important",
 * which is not true and is not what the copy says. "17+" is the headline
 * claim ("proven, and for long enough to matter"); the two volume figures are
 * supporting evidence.
 *
 * So the columns are `4fr 3.5fr 2.5fr` — a visual ratio of roughly 40/35/25.
 * The first figure is set largest, the second slightly smaller, the third
 * smaller again, so the row reads as a ranking rather than as a table. The
 * sublabels are all present and unchanged.
 *
 * ── Cards, on a dark field ─────────────────────────────────────────
 * Each figure is its own panel, one rung above the section surface. The fill is
 * `rgba(255,255,255,0.04)` — a lift, not a second colour — with a hairline
 * border, so the panel reads as raised out of the dark rather than as a white
 * box dropped onto it.
 */
function BigStatCards() {
  return (
    <dl className="track-stats">
      {TRACK_RECORD_STATS.map((stat, i) => (
        <ScrollReveal key={stat.label}>
          <div className="track-stat" data-rank={i}>
            <dt className="sr-only">{stat.label}</dt>
            <dd className="track-stat-body">
              {/* The numeral. `<CountUp>` owns the aria-hidden and the tabular
                  figures; the <dt> above is the accessible name. */}
              <CountUp value={stat.value} className="track-stat-numeral" />

              <span className="track-stat-label">{stat.label}</span>
              <span className="track-stat-sublabel">{stat.sublabel}</span>
            </dd>
          </div>
        </ScrollReveal>
      ))}
    </dl>
  );
}

/**
 * The HRDC accreditation card.
 *
 * Rendered as a full-width card rather than a badge pill: HRDC claimability is
 * a purchasing decision for a Malaysian employer, not a detail. The orange
 * border carries the emphasis without a second fill colour — and on the dark
 * field a solid orange rule is the strongest edge available.
 */
function HrdcCard() {
  return (
    <ScrollReveal delayMs={80}>
      <div className="track-hrdc">
        <span className="track-hrdc-icon">
          <BadgeCheck size={30} strokeWidth={2} aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <p className="track-hrdc-title">{TRACK_RECORD_HRDC.title}</p>
          <p className="track-hrdc-subtext">{TRACK_RECORD_HRDC.subtext}</p>
        </div>
      </div>
    </ScrollReveal>
  );
}

/**
 * The seven credentials, compact.
 *
 * A `<ul>` so a screen reader reports "list, 7 items" and the visitor can step
 * through them.
 *
 * ── Why the icons are gone ─────────────────────────────────────────
 * This strip previously carried seven icons resolved by array position — one
 * per credential, matched to the array order in `trainer-credibility.ts`. That
 * made the icons a second ordering of the same data, and a reordered array
 * silently re-paired every credential with the wrong glyph.
 *
 * An orange dash per row does the same job — it marks the item's start — and
 * cannot drift from the data. The About section keeps its icon tiles; that list
 * is the one a visitor reads in full, and repetition between the two lists was
 * exactly what Polish #7 was removing.
 */
function CredentialStrip() {
  return (
    <ScrollReveal delayMs={80}>
      <h3 className="track-subheading">Credentials</h3>
      <p className="track-credential-name">{TRAINER_CREDIBILITY_NAME}</p>

      <ul className="track-credentials">
        {TRAINER_CREDIBILITY_CREDENTIALS.map((credential) => (
          <li key={credential} className="track-credential">
            <span aria-hidden="true" className="track-credential-mark">
              &mdash;
            </span>
            <span className="track-credential-text">{credential}</span>
          </li>
        ))}
      </ul>
    </ScrollReveal>
  );
}

/**
 * Company TYPES, not client names or logos.
 *
 * PRD 5.5 asks for "company-type logos/icons (generic, non-branded) if
 * available". None were supplied, and using real client marks needs written
 * permission the project does not hold. So this shows the *types* of operation
 * the training serves.
 *
 * ASSUMPTION: the five types were not given in the spec either — they are
 * derived from the industries the source programmes reference. Confirm or
 * replace before launch. Flagged at the data source too.
 */
function ClientTypeStrip() {
  return (
    <ScrollReveal delayMs={80}>
      <h3 className="track-subheading">{CLIENT_TYPES_HEADING}</h3>

      <ul className="track-client-types">
        {CLIENT_TYPES.map((type) => {
          const Icon = ICONS[type.icon] ?? Factory;

          return (
            <li key={type.label} className="track-client-type">
              <Icon size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
              <span>{type.label}</span>
            </li>
          );
        })}
      </ul>
    </ScrollReveal>
  );
}

/**
 * The closing trust statement.
 *
 * A `<blockquote>` because it is a quoted claim rather than body copy, with a
 * thick orange left border as the visual marker. The measure is capped at 60ch:
 * a full-width italic paragraph at this size is hard to track.
 */
function TrustStatement() {
  return (
    <ScrollReveal delayMs={80}>
      <blockquote className="track-statement">{TRACK_RECORD_STATEMENT}</blockquote>

      {/* Assistive-tech caption naming the trust statement. `sr-only` because
          the blockquote's own text is already the visible claim; this exists so
          the section's figures and the quote are bound together for a reader
          who arrives by landmark rather than by scrolling. */}
      <p className="sr-only">{TRACK_RECORD_CAPTION}</p>
    </ScrollReveal>
  );
}
