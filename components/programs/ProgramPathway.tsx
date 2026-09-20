/**
 * Program E — 7-Module Professional Training Pathway (portfolio overview).
 *
 * Thin composition: dark hero, a stat strip, the seven module cards, the
 * pathway stepper and the organisation summary. All copy comes from
 * `program-e-content.ts`, the verbatim PDF extraction.
 *
 * Surface: off-white, continuing the alternation from Program D's white body.
 *
 * ── Not a ProgramSection ────────────────────────────────────────────
 * This program has no "Problems We Solve", no Before/After and no numbered
 * problem grid — it is a portfolio overview. Forcing it through the shared
 * template would produce a page of empty sections, so it composes its own body
 * from the same primitives.
 */

import ScrollReveal from '../about/ScrollReveal';
import TrainerCredibility from '../shared/TrainerCredibility';
import ProgramHero from './ProgramHero';
import LevelBadge from './LevelBadge';
import {
  PROGRAM_E_CTA,
  PROGRAM_E_HERO,
  PROGRAM_E_MODULES,
  PROGRAM_E_ORGANISATION_BUILD,
  PROGRAM_E_PATHWAY,
  PROGRAM_E_SECTION,
  PROGRAM_E_STATS,
} from './program-e-content';

/** Shared heading style for this program's body sections. */
const HEADING_CLASS =
  'mt-16 text-2xl font-extrabold leading-tight tracking-[-0.01em] text-[var(--pdf-charcoal)] sm:text-3xl';

export default function ProgramPathway() {
  const id = PROGRAM_E_HERO.id;

  return (
    <section id={id} aria-labelledby={`${id}-heading`}>
      <ProgramHero
        id={id}
        eyebrow="Complete Professional Training Portfolio"
        titleOrange="7 STRUCTURED MODULES."
        titleRest="ONE STRONGER MOULDING ORGANISATION."
        subcopy={PROGRAM_E_HERO.subcopy}
      />

      <div
        className="relative isolate w-full"
        style={{ backgroundColor: 'var(--prd-offwhite)' }}
      >
        <div className="mx-auto w-full max-w-[1400px] px-8 py-16 sm:px-12 lg:px-16 lg:py-24">
          <StatStrip />

          <ScrollReveal>
            <h2 id={`${id}-modules`} className={HEADING_CLASS}>
              {PROGRAM_E_SECTION.heading}
            </h2>
            <p
              className="mt-4 text-lg font-semibold leading-snug"
              style={{ color: 'var(--pdf-warm-grey)' }}
            >
              {PROGRAM_E_SECTION.subline}
            </p>
          </ScrollReveal>

          <ModuleCards />
          <PathwayBlock />
          <OrganisationBlock />
          <ClosingCta />

          <TrainerCredibility />
        </div>
      </div>
    </section>
  );
}

/** The four program-E figures. */
function StatStrip() {
  return (
    <ScrollReveal>
      <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
        {PROGRAM_E_STATS.map((stat) => (
          <div key={stat.label} className="flex min-w-0 flex-col">
            <dt className="sr-only">{stat.label}</dt>
            <dd className="m-0 flex flex-col">
              <span
                aria-hidden="true"
                className="text-4xl font-extrabold leading-none sm:text-5xl"
                style={{
                  color: 'var(--pdf-orange)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {stat.value}
              </span>
              <span
                className="mt-2 text-sm font-bold uppercase tracking-[0.08em]"
                style={{ color: 'var(--pdf-warm-grey)' }}
              >
                {stat.label}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </ScrollReveal>
  );
}

/**
 * The seven module cards.
 *
 * Each carries the PRD 13.2 capability-card fields: code, title, description,
 * tag chips, level badge, duration and a one-line outcome.
 *
 * Badge colour keys off depth: ADVANCED and APPLICATION take the orange tile
 * with white text, FOUNDATION and BRIDGE the yellow tile with charcoal. That is
 * a deliberate progression, and it keeps every badge legible — white on the
 * lighter yellow would not clear contrast at this size.
 */
function ModuleCards() {
  return (
    <ol className="mt-8 grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-2 lg:grid-cols-3">
      {PROGRAM_E_MODULES.map((module) => {
        return (
          <li
            key={module.code}
            className="flex flex-col p-8"
            style={{
              backgroundColor: 'var(--pdf-white)',
              borderRadius: 'var(--prd-radius)',
              border: '1px solid var(--prd-border)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center text-base font-extrabold leading-none"
                style={{
                  backgroundColor: 'var(--pdf-orange)',
                  color: 'var(--pdf-white)',
                  borderRadius: 'var(--prd-radius-sm)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {module.number}
              </span>

              <LevelBadge label={module.badge} />
            </div>

            <p
              className="mt-4 text-xs font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--pdf-warm-grey)' }}
            >
              {module.code} &middot; {module.duration}
            </p>

            <h3 className="mt-2 text-lg font-bold leading-snug text-[var(--pdf-charcoal)]">
              {module.title}
            </h3>

            <p
              className="mt-2 text-[0.9375rem] leading-relaxed"
              style={{ color: 'var(--pdf-warm-grey)', textWrap: 'pretty' }}
            >
              {module.description}
            </p>

            <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
              {module.tags.map((tag) => (
                <li key={tag}>
                  <span
                    className="inline-flex items-center px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.06em]"
                    style={{
                      backgroundColor: 'var(--prd-neutral)',
                      color: 'var(--pdf-charcoal)',
                      borderRadius: 'var(--prd-radius-pill)',
                    }}
                  >
                    {tag}
                  </span>
                </li>
              ))}
            </ul>

            <p
              className="mt-4 border-t pt-4 text-[0.9375rem] font-semibold leading-relaxed text-[var(--pdf-charcoal)]"
              style={{ borderColor: 'var(--prd-border)' }}
            >
              {module.outcome}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** The recommended pathway stepper. Not numeric order — M1→M2→M3→M5→M4→M6→M7. */
function PathwayBlock() {
  return (
    <ScrollReveal>
      <h2 id="pathway-pathway" className={HEADING_CLASS}>
        {PROGRAM_E_PATHWAY.heading}
      </h2>
      <p
        className="mt-4 text-base leading-relaxed"
        style={{ color: 'var(--pdf-warm-grey)' }}
      >
        {PROGRAM_E_PATHWAY.note}
      </p>

      <ol className="mt-8 flex list-none flex-wrap gap-4 p-0">
        {PROGRAM_E_PATHWAY.steps.map((step) => (
          <li
            key={step.code}
            className="flex items-center gap-2 px-4 py-2"
            style={{
              backgroundColor: 'var(--pdf-white)',
              border: '1px solid var(--pdf-orange)',
              borderRadius: 'var(--prd-radius-pill)',
            }}
          >
            <span className="text-sm font-extrabold text-[var(--pdf-orange)]">
              {step.code}
            </span>
            <span
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: 'var(--pdf-charcoal)' }}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </ScrollReveal>
  );
}

/** "What the Organisation Can Build" — three summary columns. */
function OrganisationBlock() {
  return (
    <ScrollReveal>
      <h2 id="pathway-build" className={HEADING_CLASS}>
        {PROGRAM_E_ORGANISATION_BUILD.heading}
      </h2>

      <ul className="mt-8 grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-3">
        {PROGRAM_E_ORGANISATION_BUILD.items.map((item) => (
          <li
            key={item.title}
            className="flex flex-col p-8"
            style={{
              backgroundColor: 'var(--pdf-white)',
              borderRadius: 'var(--prd-radius)',
              border: '1px solid var(--prd-border)',
            }}
          >
            <span
              aria-hidden="true"
              className="mb-4 flex h-12 w-12 items-center justify-center text-base font-extrabold leading-none"
              style={{
                backgroundColor: 'var(--prd-yellow)',
                color: 'var(--pdf-charcoal)',
                borderRadius: 'var(--prd-radius-sm)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {item.number}
            </span>
            <h3 className="text-base font-extrabold uppercase leading-snug text-[var(--pdf-charcoal)]">
              {item.title}
            </h3>
            <p
              className="mt-2 text-[0.9375rem] leading-relaxed"
              style={{ color: 'var(--pdf-warm-grey)', textWrap: 'pretty' }}
            >
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </ScrollReveal>
  );
}

/** Program E's closing CTA. */
function ClosingCta() {
  return (
    <ScrollReveal>
      <div
        className="mt-16 p-8 sm:p-12"
        style={{
          backgroundColor: 'var(--pdf-dark)',
          borderRadius: 'var(--prd-radius)',
        }}
      >
        <h2 className="text-xl font-extrabold uppercase leading-tight text-[var(--pdf-white)] sm:text-2xl">
          {PROGRAM_E_CTA.headline}
        </h2>
        <p
          className="mt-4 text-base leading-relaxed"
          style={{ color: 'var(--pdf-dark-muted)' }}
        >
          {PROGRAM_E_CTA.body}
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <a
            href={`#contact?program=${PROGRAM_E_CTA.programSlug}`}
            className="inline-flex min-h-[56px] items-center justify-center px-8 text-base font-bold transition-[background-color,transform] duration-200 hover:-translate-y-0.5"
            style={{
              backgroundColor: 'var(--pdf-orange)',
              color: 'var(--pdf-white)',
              borderRadius: 'var(--prd-radius-pill)',
            }}
          >
            Request a Proposal
          </a>

          <a
            href={PROGRAM_E_CTA.phoneHref}
            className="inline-flex min-h-[56px] items-center justify-center px-8 text-base font-bold"
            style={{
              border: '1px solid var(--pdf-orange)',
              color: 'var(--pdf-white)',
              borderRadius: 'var(--prd-radius-pill)',
            }}
          >
            {PROGRAM_E_CTA.phone}
          </a>
        </div>

        <p className="mt-8 text-sm" style={{ color: 'var(--pdf-dark-subtle)' }}>
          {PROGRAM_E_CTA.signoff}
        </p>
      </div>
    </ScrollReveal>
  );
}

