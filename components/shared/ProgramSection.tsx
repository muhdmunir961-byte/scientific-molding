/**
 * ProgramSection — the light content body shared by all 5 programs.
 *
 * Every program renders the same section primitives under its dark hero:
 * numbered card grids, a before/after table, a philosophy block, a framework
 * stepper, day cards, chip groups and the trainer strip. This component owns
 * that layout so a change lands in all five at once.
 *
 * ── Why the sections are optional ───────────────────────────────────
 * The five PDFs are not identical in shape: Program B has a five-step framework
 * and two module sets, Program C has a four-day journey, Program D has defect
 * categories, Program E is a portfolio overview with no problems table. Making
 * every section optional means one component serves all five without a
 * lowest-common-denominator layout or five near-copies.
 *
 * ── Heading levels ──────────────────────────────────────────────────
 * The dark hero owns the `<h1>`. Everything here is `<h2>` for a section and
 * `<h3>` inside it, so the outline stays flat and navigable. Skipping a level
 * breaks the outline a screen reader navigates by.
 */

import type { ReactNode } from 'react';

import ScrollReveal from '../about/ScrollReveal';
import BeforeAfterTable, { type BeforeAfterRow } from './BeforeAfterTable';
import NumberedProblemCard from './NumberedProblemCard';
import TrainerCredibility from './TrainerCredibility';

/** A numbered card: problems, benefits, capabilities, outcomes. */
export interface NumberedItem {
  readonly number?: string;
  readonly title: string;
  readonly description: string;
  /** Optional category, used by Program B benefits and Program D defects. */
  readonly category?: string;
}

/** A philosophy / framework / conditions item. */
export interface TitledItem {
  readonly title: string;
  readonly description: string;
  readonly number?: string;
}

/** A day in the journey. */
export interface DayItem {
  readonly label: string;
  readonly stage?: string;
  readonly summary: string;
}

/** A tag chip group. */
export interface ChipGroup {
  readonly heading: string;
  readonly items: readonly string[];
  /** Optional provenance note, e.g. Program B's "(from wP)". */
  readonly note?: string;
}

export interface ProgramSectionProps {
  /** Anchor id of the parent section, used to namespace heading ids. */
  id: string;
  /** Alternating surface. Off-white and white alternate between programs. */
  tone?: 'offwhite' | 'white';

  problems?: readonly NumberedItem[];
  beforeAfter?: {
    heading: string;
    caption: string;
    labels?: { before: string; after: string };
    rows: readonly BeforeAfterRow[];
  };
  /** A large statement block, e.g. "Why Foundation Matters". */
  statement?: { heading: string; text: string };
  benefits?: { heading: string; items: readonly NumberedItem[] };
  capabilities?: { heading: string; items: readonly NumberedItem[] };
  outcomes?: { heading: string; items: readonly NumberedItem[] };
  modules?: { heading: string; items: readonly NumberedItem[] };
  /** A second module set, used by Program B. */
  modulesSecondary?: { heading: string; note?: string; items: readonly { title: string; problem: string; outcome: string }[] };
  /** Philosophy or a framework stepper. */
  philosophy?: { heading: string; lines?: readonly string[]; items?: readonly TitledItem[] };
  framework?: { heading: string; steps: readonly TitledItem[]; note?: string };
  days?: { heading: string; items: readonly DayItem[] };
  /** "Why Essential" style plain statement list. */
  statements?: { heading: string; items: readonly string[] };
  /** Defect categories, or any chip-per-category block. */
  categories?: { heading: string; items: readonly { title: string; items: string }[] };
  chips?: readonly ChipGroup[];
  /** Closing CTA. */
  cta?: {
    headline: string;
    body?: string;
    signoff?: string;
    signoffTrailing?: string;
    phone?: string;
    phoneHref?: string;
    email?: string;
    emailHref?: string;
    linkedin?: string;
    linkedinHref?: string;
    /**
     * Programme slug for the "Request a Proposal" link.
     *
     * When set, the CTA gains a primary button that jumps to the §5.6 form with
     * this programme's checkbox already ticked (`#contact?program=<slug>` — see
     * the `Contact` docblock for why the param follows the hash).
     *
     * Optional, because a program with no natural enquiry path should not
     * invent one. Sections that omit it simply show email and phone.
     */
    programSlug?: string;
  };
  /** Show the reusable trainer strip. */
  showTrainer?: boolean;
  children?: ReactNode;
}


/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

/** A section heading inside a program body. */
function Heading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-16 text-2xl font-extrabold leading-tight tracking-[-0.01em] text-[var(--pdf-charcoal)] sm:text-3xl"
    >
      {children}
    </h2>
  );
}

/**
 * A grid of numbered cards.
 *
 * The numeral tile alternates orange and yellow, the Section 13.1 badge
 * treatment. `aria-hidden` on the tile because the card's own heading carries
 * the meaning — exposing it would announce the number twice.
 */
function NumberedGrid({
  items,
  columns = 3,
}: {
  items: readonly NumberedItem[];
  columns?: 2 | 3;
}) {
  const gridCols =
    columns === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <ol className={`mt-8 grid list-none gap-8 p-0 ${gridCols}`}>
      {items.map((item, i) => (
        <li key={item.title} className="flex">
          <NumberedProblemCard
            index={i + 1}
            number={item.number}
            title={item.title}
            description={item.description}
            category={item.category}
          />
        </li>
      ))}
    </ol>
  );
}

/** A grid of large stat figures. */
function StatStrip({
  items,
}: {
  items: readonly { value: string; label: string }[];
}) {
  return (
    <dl
      className="mt-8 grid grid-cols-2 gap-8 border-y py-8 lg:grid-cols-4"
      style={{ borderColor: 'var(--prd-border)' }}
    >
      {items.map((stat) => (
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
  );
}

/* ------------------------------------------------------------------ *
 * Exported child blocks
 * ------------------------------------------------------------------ */

/**
 * A plain statement block, for content that is not a numbered card grid.
 *
 * Exported so a program can render an extra block through
 * `<ProgramSection>`'s `children` when the shared slots do not fit its shape —
 * Program C's two-item "Take Back" is the case that needed it.
 *
 * @param props.heading section heading
 * @param props.items   statement strings
 */
export function Statements({
  heading,
  items,
}: {
  heading: string;
  items: readonly string[];
}) {
  return (
    <ScrollReveal>
      <h2 className="mt-16 text-2xl font-extrabold leading-tight tracking-[-0.01em] text-[var(--pdf-charcoal)] sm:text-3xl">
        {heading}
      </h2>

      <ul className="mt-8 list-none space-y-4 p-0">
        {items.map((text) => (
          <li
            key={text}
            className="flex gap-4 p-8 text-[0.9375rem] leading-relaxed"
            style={{
              backgroundColor: 'var(--pdf-white)',
              color: 'var(--pdf-charcoal)',
              borderRadius: 'var(--prd-radius)',
              border: '1px solid var(--prd-border)',
            }}
          >
            <span aria-hidden="true" style={{ color: 'var(--pdf-orange)' }}>
              &mdash;
            </span>
            <span className="min-w-0" style={{ textWrap: 'pretty' }}>
              {text}
            </span>
          </li>
        ))}
      </ul>
    </ScrollReveal>
  );
}

/* ------------------------------------------------------------------ *
 * Main component
 * ------------------------------------------------------------------ */

export default function ProgramSection({
  id,
  tone = 'offwhite',
  problems,
  beforeAfter,
  statement,
  benefits,
  capabilities,
  outcomes,
  modules,
  modulesSecondary,
  philosophy,
  framework,
  days,
  statements,
  categories,
  chips,
  cta,
  showTrainer = true,
  children,
}: ProgramSectionProps) {
  return (
    <div
      id={id}
      className={`program-section ${tone === 'offwhite' ? 'program-section-offwhite' : 'program-section-white'} relative isolate w-full`}
    >
      <div
        aria-hidden="true"
        className="hero-grid hero-grid-mask pointer-events-none absolute inset-0 -z-10"
      />

      <div className="mx-auto w-full max-w-[1400px] px-8 py-16 sm:px-12 lg:px-16 lg:py-24">
        {problems && problems.length > 0 && (
          <ScrollReveal>
            <Heading id={`${id}-problems`}>Problems We Solve</Heading>
            <NumberedGrid items={problems} />
          </ScrollReveal>
        )}

        {beforeAfter && (
          <ScrollReveal>
            <Heading id={`${id}-before-after`}>{beforeAfter.heading}</Heading>
            <div
              className="mt-8 overflow-hidden"
              style={{ borderRadius: 'var(--prd-radius)' }}
            >
              <BeforeAfterTable
                caption={beforeAfter.caption}
                beforeLabel={beforeAfter.labels?.before}
                afterLabel={beforeAfter.labels?.after}
                rows={beforeAfter.rows}
              />
            </div>
          </ScrollReveal>
        )}

        {statement && (
          <ScrollReveal>
            <Heading id={`${id}-statement`}>{statement.heading}</Heading>
            <blockquote
              className="mt-8 border-l-4 p-8 text-lg font-bold leading-snug sm:text-xl"
              style={{
                borderColor: 'var(--pdf-orange)',
                backgroundColor: 'var(--pdf-white)',
                color: 'var(--pdf-charcoal)',
                borderRadius: '0 var(--prd-radius) var(--prd-radius) 0',
                textWrap: 'pretty',
              }}
            >
              {statement.text}
            </blockquote>
          </ScrollReveal>
        )}

        {benefits && (
          <ScrollReveal>
            <Heading id={`${id}-benefits`}>{benefits.heading}</Heading>
            <NumberedGrid items={benefits.items} />
          </ScrollReveal>
        )}

        {outcomes && (
          <ScrollReveal>
            <Heading id={`${id}-outcomes`}>{outcomes.heading}</Heading>
            <NumberedGrid items={outcomes.items} />
          </ScrollReveal>
        )}

        {capabilities && (
          <ScrollReveal>
            <Heading id={`${id}-capabilities`}>{capabilities.heading}</Heading>
            <NumberedGrid items={capabilities.items} />
          </ScrollReveal>
        )}

        {philosophy && (
          <ScrollReveal>
            <Heading id={`${id}-philosophy`}>{philosophy.heading}</Heading>

            {philosophy.lines && (
              <ul className="mt-8 list-none space-y-2 p-0">
                {philosophy.lines.map((line) => (
                  <li
                    key={line}
                    className="text-xl font-extrabold uppercase leading-snug tracking-[-0.01em] sm:text-2xl"
                    style={{ color: 'var(--pdf-orange)' }}
                  >
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </ScrollReveal>
        )}

        {framework && (
          <ScrollReveal>
            <Heading id={`${id}-framework`}>{framework.heading}</Heading>
            <ol className="mt-8 grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-2 lg:grid-cols-3">
              {framework.steps.map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-4 p-8"
                  style={{
                    backgroundColor: 'var(--pdf-white)',
                    borderRadius: 'var(--prd-radius)',
                    border: '1px solid var(--prd-border)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-extrabold leading-none"
                    style={{
                      backgroundColor:
                        i % 2 === 0 ? 'var(--pdf-orange)' : 'var(--prd-yellow)',
                      color:
                        i % 2 === 0 ? 'var(--pdf-white)' : 'var(--pdf-charcoal)',
                      borderRadius: 'var(--prd-radius-pill)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-extrabold leading-snug text-[var(--pdf-charcoal)]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--pdf-warm-grey)]">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {framework.note && (
              <p
                className="mt-8 border-l-4 pl-4 text-[0.9375rem] italic leading-relaxed"
                style={{
                  borderColor: 'var(--pdf-orange)',
                  color: 'var(--pdf-warm-grey)',
                }}
              >
                {framework.note}
              </p>
            )}
          </ScrollReveal>
        )}

        {modules && (
          <ScrollReveal>
            <Heading id={`${id}-modules`}>{modules.heading}</Heading>
            <NumberedGrid items={modules.items} />
          </ScrollReveal>
        )}

        {modulesSecondary && (
          <ScrollReveal>
            <Heading id={`${id}-modules-secondary`}>
              {modulesSecondary.heading}
              {modulesSecondary.note && (
                <span
                  className="ml-2 text-sm font-semibold normal-case tracking-normal"
                  style={{ color: 'var(--pdf-warm-grey)' }}
                >
                  ({modulesSecondary.note})
                </span>
              )}
            </Heading>

            <ol className="mt-8 list-none space-y-4 p-0">
              {modulesSecondary.items.map((item, i) => (
                <li
                  key={item.title}
                  className="flex flex-col gap-4 p-8 sm:flex-row sm:items-start sm:gap-8"
                  style={{
                    backgroundColor: 'var(--pdf-white)',
                    borderRadius: 'var(--prd-radius)',
                    border: '1px solid var(--prd-border)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-extrabold leading-none"
                    style={{
                      backgroundColor:
                        i % 2 === 0 ? 'var(--pdf-orange)' : 'var(--prd-yellow)',
                      color:
                        i % 2 === 0 ? 'var(--pdf-white)' : 'var(--pdf-charcoal)',
                      borderRadius: 'var(--prd-radius-pill)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-extrabold uppercase leading-snug text-[var(--pdf-charcoal)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--pdf-warm-grey)]">
                      {item.problem}
                    </p>
                    <p className="mt-2 text-[0.9375rem] font-semibold leading-relaxed text-[var(--pdf-charcoal)]">
                      {item.outcome}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        )}

        {days && (
          <ScrollReveal>
            <Heading id={`${id}-days`}>{days.heading}</Heading>
            <dl className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {days.items.map((day) => (
                <div
                  key={day.label}
                  className="p-8"
                  style={{
                    backgroundColor: 'var(--pdf-white)',
                    borderRadius: 'var(--prd-radius)',
                    border: '1px solid var(--prd-border)',
                  }}
                >
                  <dt className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--pdf-orange)]">
                    {day.label}
                  </dt>

                  {day.stage && (
                    <p className="mt-2 text-lg font-extrabold uppercase leading-tight text-[var(--pdf-charcoal)]">
                      {day.stage}
                    </p>
                  )}

                  <dd className="m-0 mt-2 text-[0.9375rem] leading-relaxed text-[var(--pdf-warm-grey)]">
                    {day.summary}
                  </dd>
                </div>
              ))}
            </dl>
          </ScrollReveal>
        )}

        {statements && (
          <ScrollReveal>
            <Heading id={`${id}-statements`}>{statements.heading}</Heading>
            <ul className="mt-8 list-none space-y-4 p-0">
              {statements.items.map((text) => (
                <li
                  key={text}
                  className="flex gap-4 p-8 text-[0.9375rem] leading-relaxed"
                  style={{
                    backgroundColor: 'var(--pdf-white)',
                    color: 'var(--pdf-charcoal)',
                    borderRadius: 'var(--prd-radius)',
                    border: '1px solid var(--prd-border)',
                  }}
                >
                  <span aria-hidden="true" style={{ color: 'var(--pdf-orange)' }}>
                    &mdash;
                  </span>
                  <span className="min-w-0" style={{ textWrap: 'pretty' }}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        )}


        {categories && (
          <ScrollReveal>
            <Heading id={`${id}-categories`}>{categories.heading}</Heading>
            <ul className="mt-8 grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-3">
              {categories.items.map((category) => (
                <li
                  key={category.title}
                  className="p-8"
                  style={{
                    backgroundColor: 'var(--pdf-white)',
                    borderRadius: 'var(--prd-radius)',
                    border: '1px solid var(--prd-border)',
                  }}
                >
                  <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--pdf-orange)]">
                    {category.title}
                  </h3>
                  <p className="mt-4 text-[0.9375rem] leading-relaxed text-[var(--pdf-warm-grey)]">
                    {category.items}
                  </p>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        )}

        {chips?.map((group) => (
          <ScrollReveal key={group.heading}>
            <Heading
              id={`${id}-${group.heading.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {group.heading}
              {group.note && (
                <span className="ml-2 program-chips-note">
                  ({group.note})
                </span>
              )}
            </Heading>

            <ul className="mt-8 flex list-none flex-wrap gap-4 p-0 program-chips-list">
              {group.items.map((item) => (
                <li key={item}>
                  <span className="program-tag-chip inline-flex items-center px-4 py-2 text-sm font-semibold">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        ))}

        {children}

        {cta && (
          <ScrollReveal>
            <div
              className="mt-16 p-8 sm:p-12"
              style={{
                backgroundColor: 'var(--pdf-dark)',
                borderRadius: 'var(--prd-radius)',
              }}
            >
              <h2 className="text-xl font-extrabold uppercase leading-tight text-[var(--pdf-white)] sm:text-2xl">
                {cta.headline}
              </h2>

              {cta.body && (
                <p className="mt-4 program-cta-body">{cta.body}</p>
              )}

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap program-cta-buttons">
                {/*
                 * The primary action: into the form, with this programme ticked.
                 * Rendered first so it reads as the main path, with email and
                 * phone as the fallbacks beside it.
                 */}
                {cta.programSlug && (
                  <a
                    href={`#contact?program=${cta.programSlug}`}
                    className="inline-flex min-h-[56px] items-center justify-center px-8 text-base font-bold program-request-button"
                  >
                    Request a Proposal
                  </a>
                )}

                {cta.email && cta.emailHref && (
                  <a
                    href={cta.emailHref}
                    className="inline-flex min-h-[56px] items-center justify-center px-8 text-base font-bold program-contact-button"
                  >
                    {cta.email}
                  </a>
                )}

                {cta.phone && cta.phoneHref && (
                  <a
                    href={cta.phoneHref}
                    className="inline-flex min-h-[56px] items-center justify-center px-8 text-base font-bold program-contact-link"
                  >
                    {cta.phone}
                  </a>
                )}
              </div>

              {(cta.signoff || cta.linkedin) && (
                <p className="mt-8 program-cta-signoff">
                  {cta.signoff}
                  {cta.signoffTrailing && ` — ${cta.signoffTrailing}`}
                  {cta.linkedin && cta.linkedinHref && (
                    <>
                      {cta.signoff ? ' · ' : ''}
                      <a
                        href={cta.linkedinHref}
                        className="underline program-linkedin-link"
                      >
                        {cta.linkedin}
                      </a>
                    </>
                  )}
                </p>
              )}
            </div>
          </ScrollReveal>
        )}

        {showTrainer && <TrainerCredibility />}
      </div>
    </div>
  );
}
