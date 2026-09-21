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
import ProgramHero from './ProgramHero';
import LevelBadge from './LevelBadge';
import { ctaLabelFor } from './program-cta-content';
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
const HEADING_CLASS = 'mt-12 text-h3 font-semibold text-[var(--ds-neutral-800)]';

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

      <div className="program-section relative isolate w-full program-section-offwhite">
        <div className="container program-section-inner">
          <StatStrip />
          <ScrollReveal>
            <h2 id={`${id}-modules`} className={HEADING_CLASS}>
              {PROGRAM_E_SECTION.heading}
            </h2>
            <p className="program-e-subline">{PROGRAM_E_SECTION.subline}</p>
          </ScrollReveal>

          <ModuleCards />
          <PathwayBlock />
          <OrganisationBlock />
          <ClosingCta />
        </div>
      </div>
    </section>
  );
}

/** The four program-E figures. */
function StatStrip() {
  return (
    <ScrollReveal>
      <dl className="program-e-stats">
        {PROGRAM_E_STATS.map((stat) => (
          <div key={stat.label} className="flex min-w-0 flex-col">
            <dt className="sr-only">{stat.label}</dt>
            <dd className="m-0 flex flex-col">
              <span aria-hidden="true" className="program-e-stat-value">
                {stat.value}
              </span>
              <span className="program-e-stat-label">{stat.label}</span>
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
    <ol className="program-modules-list program-e-modules">
      {PROGRAM_E_MODULES.map((module, i) => {
        return (
          <li key={module.code}>
            <span
              aria-hidden="true"
              className={`program-module-tile-${i % 2 === 0 ? 'orange' : 'yellow'}`}
            >
              {module.number}
            </span>

            <div className="min-w-0 flex-1">
              <div className="program-e-module-head">
                <LevelBadge label={module.badge} />
                <span className="program-e-module-meta">
                  {module.code} &middot; {module.duration}
                </span>
              </div>

              <h3 className="program-module-title mt-2">{module.title}</h3>
              <p className="program-module-problem">{module.description}</p>

              <ul className="program-e-tags">
                {module.tags.map((tag) => (
                  <li key={tag}>
                    <span className="program-e-tag">{tag}</span>
                  </li>
                ))}
              </ul>

              <p className="program-module-outcome">{module.outcome}</p>
            </div>
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
      <p className="program-e-note">{PROGRAM_E_PATHWAY.note}</p>

      <ol className="program-e-steps">
        {PROGRAM_E_PATHWAY.steps.map((step) => (
          <li key={step.code} className="program-e-step">
            <span className="program-e-step-code">{step.code}</span>
            <span className="program-e-step-label">{step.label}</span>
          </li>
        ))}
      </ol>
    </ScrollReveal>
  );
}

/** "What the Organisation Can Build" — three compact columns. */
function OrganisationBlock() {
  return (
    <ScrollReveal>
      <h2 id="pathway-build" className={HEADING_CLASS}>
        {PROGRAM_E_ORGANISATION_BUILD.heading}
      </h2>

      <ul className="program-modules-list program-e-build">
        {PROGRAM_E_ORGANISATION_BUILD.items.map((item, i) => (
          <li key={item.title}>
            <span
              aria-hidden="true"
              className={`program-module-tile-${i % 2 === 0 ? 'yellow' : 'orange'}`}
            >
              {item.number}
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="program-module-title">{item.title}</h3>
              <p className="program-module-problem">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </ScrollReveal>
  );
}

/** Program E's closing CTA. */
/**
 * Program E's closing CTA — the compact treatment.
 *
 * This program does not use `ProgramSection` (it is a portfolio overview with
 * no problems table, no Before/After and no numbered grid), so its closing block
 * is written out here. For a while it kept the old dark `p-12` panel with three
 * buttons and a sign-off, which meant Program E was the one program still
 * carrying the pattern Polish #7 removed from the other four — and its
 * "Request a Proposal" button was the only one on the page NOT using
 * `.program-request-button`, so it was silently absent from that count.
 *
 * The panel copy still renders, once, in §5.6 via `ProgramCtaFooter`. What is
 * left here is the same local affordance the other four programs have: one
 * button, and the link to the canonical comparison.
 */
function ClosingCta() {
  return (
    <ScrollReveal>
      <div className="program-cta-row">
        <a
          href={`#contact?program=${PROGRAM_E_CTA.programSlug}`}
          className="program-request-button"
        >
          Request for {ctaLabelFor(PROGRAM_E_HERO.id)?.replace('Request the ', '')}
        </a>

        <a href="#why" className="program-why-link">
          See the capability shift
          <span aria-hidden="true"> →</span>
        </a>
      </div>
    </ScrollReveal>
  );
}

