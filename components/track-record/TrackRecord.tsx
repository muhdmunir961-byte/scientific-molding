/**
 * §5.5 — Track Record / Trust Strip.
 *
 * ── Why a new component, not a `TrainerCredibility` variant ─────────
 * `TrainerCredibility` is a compact strip that repeats inside all five program
 * sections: it names the trainer, lists the credentials and shows three small
 * figures. This section is the opposite — three display figures at
 * `clamp(4rem, 10vw, 6rem)`, an HRDC accreditation card and a trust statement.
 *
 * Adding a `variant="large"` prop would make one component serve two layouts
 * with almost nothing in common, and every future change would need checking
 * against both. They share the credentials *data* (`trainer-credibility.ts`)
 * and the icon component, which is the part that actually matters.
 *
 * ── Accessibility ───────────────────────────────────────────────────
 *  - Each figure is a `<dl>` row: the value and label are a pair, so a screen
 *    reader announces "17+, Years Industry + Academia" as one unit.
 *  - The numeral is `aria-hidden` because its `<dt>` already carries the label;
 *    exposing both makes a reader say the number twice.
 *  - `tabular-nums` on every figure so the three columns stay even.
 *  - The credential list is a `<ul>`, so a reader reports "list, 7 items".
 *  - The trust statement is a `<blockquote>` because it is a quoted claim, not
 *    body copy.
 */

import {
  BadgeCheck,
  Award,
  Box,
  Car,
  CircuitBoard,
  ClipboardCheck,
  Factory,
  Gauge,
  GraduationCap,
  HeartPulse,
  Package,
  Presentation,
  type LucideIcon,
} from 'lucide-react';

import ScrollReveal from '../about/ScrollReveal';
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
 * Icon lookup.
 *
 * One explicit map for the whole section rather than three — the credential
 * icons, the HRDC icon and the client-type icons all resolve here, so the
 * bundler tree-shakes once. A dynamic import would ship all several thousand
 * Lucide icons.
 */
const ICONS: Record<string, LucideIcon> = {
  // Credentials, by position (see CREDENTIAL_ICONS below)
  'badge-check': BadgeCheck,
  'graduation-cap': GraduationCap,
  award: Award,
  gauge: Gauge,
  factory: Factory,
  presentation: Presentation,
  'clipboard-check': ClipboardCheck,
  // Client types
  car: Car,
  'circuit-board': CircuitBoard,
  package: Package,
  'heart-pulse': HeartPulse,
  box: Box,
};

/**
 * Icons for the seven credentials, by position.
 *
 * Matches the array order in `trainer-credibility.ts`, which is the PDF's
 * order and is not ranked.
 */
const CREDENTIAL_ICONS: LucideIcon[] = [
  BadgeCheck,
  GraduationCap,
  Award,
  Gauge,
  Factory,
  Presentation,
  ClipboardCheck,
];

export default function TrackRecord() {
  return (
    <section
      id={TRACK_RECORD_ID}
      aria-labelledby={`${TRACK_RECORD_ID}-heading`}
      className="relative isolate w-full overflow-hidden"
      style={{ backgroundColor: 'var(--prd-offwhite)' }}
    >
      <div
        aria-hidden="true"
        className="hero-grid hero-grid-mask pointer-events-none absolute inset-0 -z-10"
      />

      <div className="mx-auto w-full max-w-[1400px] px-8 py-16 sm:px-12 lg:px-16 lg:py-24">
        <ScrollReveal>
          <header className="max-w-[64ch]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pdf-orange)]">
              {TRACK_RECORD_HERO.eyebrow}
            </p>

            <h2
              id={`${TRACK_RECORD_ID}-heading`}
              className="mt-4 text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-[var(--pdf-charcoal)] sm:text-[2.25rem] lg:text-[2.5rem]"
            >
              {TRACK_RECORD_HERO.title}
            </h2>

            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: 'var(--pdf-warm-grey)', textWrap: 'pretty' }}
            >
              {TRACK_RECORD_HERO.subcopy}
            </p>
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
 * Deliberately much larger than the figures inside the program sections:
 * `clamp(4rem, 10vw, 6rem)` against the 4rem used there. This is the trust
 * moment, so the numbers carry the section.
 */
function BigStatCards() {
  return (
    <dl className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
      {TRACK_RECORD_STATS.map((stat) => (
        <ScrollReveal key={stat.label}>
          <div
            className="flex h-full flex-col p-8"
            style={{
              backgroundColor: 'var(--pdf-white)',
              borderRadius: 'var(--prd-radius)',
              border: '1px solid var(--prd-border)',
              boxShadow: 'var(--prd-shadow-sm)',
            }}
          >
            <dt className="sr-only">{stat.label}</dt>
            <dd className="m-0 flex flex-col">
              {/*
               * `aria-hidden` on the numeral: the <dt> above already carries
               * the label, so exposing both makes a screen reader announce the
               * number and then read it again as the value.
               */}
              <span
                aria-hidden="true"
                className="font-extrabold leading-[0.95]"
                style={{
                  fontSize: 'clamp(4rem, 10vw, 6rem)',
                  color: 'var(--pdf-orange)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {stat.value}
              </span>

              <span
                className="mt-4 text-lg font-bold leading-snug text-[var(--pdf-charcoal)]"
                style={{ textWrap: 'pretty' }}
              >
                {stat.label}
              </span>

              <span
                className="mt-2 text-sm leading-snug"
                style={{ color: 'var(--pdf-warm-grey)' }}
              >
                {stat.sublabel}
              </span>
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
 * border carries the emphasis without a second fill colour.
 */
function HrdcCard() {
  const Icon = ICONS[TRACK_RECORD_HRDC.icon] ?? BadgeCheck;

  return (
    <ScrollReveal delayMs={80}>
      <div
        className="mt-8 flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center"
        style={{
          backgroundColor: 'var(--pdf-white)',
          borderRadius: 'var(--prd-radius)',
          border: '2px solid var(--pdf-orange)',
          boxShadow: 'var(--prd-shadow-warm)',
        }}
      >
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center"
          style={{
            backgroundColor: 'rgba(232, 99, 28, 0.12)',
            borderRadius: 'var(--prd-radius-pill)',
          }}
        >
          <Icon
            size={32}
            strokeWidth={2.25}
            color="var(--pdf-orange)"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0">
          <p className="text-xl font-extrabold leading-snug text-[var(--pdf-charcoal)]">
            {TRACK_RECORD_HRDC.title}
          </p>
          <p
            className="mt-2 text-base leading-relaxed"
            style={{ color: 'var(--pdf-warm-grey)', textWrap: 'pretty' }}
          >
            {TRACK_RECORD_HRDC.subtext}
          </p>
        </div>
      </div>
    </ScrollReveal>
  );
}

/**
 * The seven credentials, compact.
 *
 * A `<ul>` so a screen reader reports "list, 7 items" and the visitor can step
 * through them. Icons are `aria-hidden`: the credential text carries the
 * meaning, and an exposed icon would announce a graphic name before every item.
 */
function CredentialStrip() {
  return (
    <ScrollReveal delayMs={80}>
      <h3 className="mt-16 text-xl font-extrabold leading-tight tracking-[-0.01em] text-[var(--pdf-charcoal)] sm:text-2xl">
        Credentials
      </h3>

      <p
        className="mt-2 text-sm font-semibold"
        style={{ color: 'var(--pdf-warm-grey)' }}
      >
        {TRAINER_CREDIBILITY_NAME}
      </p>

      <ul className="mt-8 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2">
        {TRAINER_CREDIBILITY_CREDENTIALS.map((credential, i) => {
          const Icon = CREDENTIAL_ICONS[i] ?? BadgeCheck;

          return (
            <li key={credential} className="flex items-start gap-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center"
                style={{
                  backgroundColor: 'rgba(232, 99, 28, 0.12)',
                  borderRadius: 'var(--prd-radius-pill)',
                }}
              >
                <Icon
                  size={16}
                  strokeWidth={2.25}
                  color="var(--pdf-orange)"
                  aria-hidden="true"
                />
              </span>

              <span
                className="min-w-0 pt-1 text-[0.9375rem] leading-snug"
                style={{ color: 'var(--pdf-charcoal)', textWrap: 'pretty' }}
              >
                {credential}
              </span>
            </li>
          );
        })}
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
      <h3 className="mt-16 text-xl font-extrabold leading-tight tracking-[-0.01em] text-[var(--pdf-charcoal)] sm:text-2xl">
        {CLIENT_TYPES_HEADING}
      </h3>

      <ul className="mt-8 flex list-none flex-wrap gap-4 p-0">
        {CLIENT_TYPES.map((type) => {
          const Icon = ICONS[type.icon] ?? Factory;

          return (
            <li
              key={type.label}
              className="flex items-center gap-2 px-4 py-2"
              style={{
                backgroundColor: 'var(--pdf-white)',
                border: '1px solid var(--prd-border)',
                borderRadius: 'var(--prd-radius-pill)',
              }}
            >
              <Icon
                size={16}
                strokeWidth={2.25}
                color="var(--pdf-orange)"
                aria-hidden="true"
                className="shrink-0"
              />
              <span className="text-sm font-semibold text-[var(--pdf-charcoal)]">
                {type.label}
              </span>
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
 * thick orange left border as the visual marker. `max-w-[60ch]` keeps the line
 * length readable — a full-width italic paragraph at this size is hard to track.
 */
function TrustStatement() {
  return (
    <ScrollReveal delayMs={80}>
      <blockquote
        className="mt-16 max-w-[60ch] border-l-4 p-8 text-lg italic leading-relaxed sm:text-xl"
        style={{
          borderColor: 'var(--pdf-orange)',
          backgroundColor: 'var(--pdf-white)',
          color: 'var(--pdf-charcoal)',
          borderRadius: '0 var(--prd-radius) var(--prd-radius) 0',
          textWrap: 'pretty',
        }}
      >
        {TRACK_RECORD_STATEMENT}
      </blockquote>
    </ScrollReveal>
  );
}
