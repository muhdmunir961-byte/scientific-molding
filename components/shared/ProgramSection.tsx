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

import { type ReactNode } from 'react';

import ScrollReveal from '../about/ScrollReveal';
import BeforeAfterTable, { type BeforeAfterRow } from './BeforeAfterTable';

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
     * Programme slug for the "Request for [Program]" link.
     *
     * When set, the CTA gains a small outline button that jumps to the §5.6 form
     * with this programme's checkbox already ticked (`#contact?program=<slug>` —
     * see the `Contact` docblock for why the param follows the hash).
     *
     * Optional, because a program with no natural enquiry path should not
     * invent one. Sections that omit it simply show the comparison link.
     */
    programSlug?: string;
    /**
     * The programme's own name, used to build the button label ("Request for
     * Fundamentals"). Comes from `PROGRAM_CTA_FOOTERS`' `label`, which is the
     * one place the five names are spelled for a button.
     *
     * Why a label rather than "Request a Proposal" everywhere: five identical
     * buttons on one page read as one button. Naming the programme makes each
     * one a distinct action, and the label is the same string the Contact
     * section's consolidated CTA uses, so the two cannot drift.
     */
    label?: string;
  };
  /** Show the reusable trainer strip. */
  showTrainer?: boolean;
  /**
   * Who the programme is for, in the source's own words.
   *
   * Rendered as one comma-joined line beside `format`, not as a tag-chip grid.
   * The chips version gave six items their own pills and a heading, which made
   * a one-sentence statement about the audience look like a feature list.
   */
  audience?: { heading?: string; items: readonly string[] };
  /** Learning format, in the source's own words. Pairs with `audience`. */
  format?: { heading?: string; items: readonly string[] };
  children?: ReactNode;
}


/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

/**
 * A section heading inside a program body.
 *
 * `--ds-space-12` (48px) above, and `--ds-space-6` (24px) below when a list
 * follows. Polish #7 compacted this from `mt-16` / `mt-8`: across five programs
 * with six headings each, 64px of margin above every heading was ~2,000px of
 * scroll the visitor paid for nothing.
 *
 * The type step is the h3 clamp at weight 600 — sentence case, per the brief's
 * "NO uppercase for h2/h3/h4". It was `text-2xl … sm:text-3xl font-extrabold`,
 * two bespoke sizes approximating a step the scale already defines.
 */
function Heading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-12 text-h3 font-semibold text-[var(--ds-neutral-800)]"
    >
      {children}
    </h2>
  );
}

/**
 * Zero-pad a position to two digits.
 * @param position 1-based index
 * @returns the padded numeral, e.g. "03"
 */
function pad(position: number): string {
  return String(position).padStart(2, '0');
}

/**
 * A compact two-column list replacing the old numbered card grid.
 *
 * ── Why this is not a card grid any more ────────────────────────────
 * The card version (`.program-problem-card`, 64px numeral tile, white fill,
 * `--ds-shadow-sm`, hover lift) is correct for ONE grid per page and was
 * originally used for five. Across five programs it produced 40–60 equal-weight
 * boxes with identical hover behaviour, which reads as a template rather than
 * as content — and the visual weight of each box fought the section heading for
 * attention.
 *
 * Here the items are a plain list: a 24px numeral, the title, the description.
 * No fill, no border, no shadow, no hover. The section heading and the one
 * remaining CTA are the only elements with elevation on a program body, which
 * is what makes them read as the ranked elements they are.
 *
 * ── Why `<ol>` and not `<ul>` ───────────────────────────────────────
 * The source PDFs number these sets ("01"…"06") and the numerals are asserted
 * verbatim by the output checker, so the order is meaningful and `<ol>` is the
 * element that says so. The numeral is `aria-hidden` because the list position
 * already announces it — a screen reader would otherwise say "1, 01".
 */
function NumberedList({ items }: { items: readonly NumberedItem[] }) {
  return (
    <ol className="program-compact-list">
      {items.map((item, i) => (
        <li key={item.title} className="program-compact-item">
          <span aria-hidden="true" className="program-compact-numeral">
            {item.number ?? pad(i + 1)}
          </span>

          <div className="program-compact-body">
            <h3 className="program-compact-title">
              {item.title}
              {item.category && (
                <span className="program-compact-category">{item.category}</span>
              )}
            </h3>
            <p className="program-compact-description">{item.description}</p>
          </div>
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
      <h2 className="mt-12 text-h3 font-semibold text-[var(--ds-neutral-800)]">
        {heading}
      </h2>

      {/* Compact rows, not `p-8` cards. Same reasoning as the numbered list:
          a set of short statements does not need a box and an elevation each —
          four bordered boxes make a paragraph of prose look like a feature
          grid. The orange dash marks each item's start. */}
      <ul className="program-statement-list">
        {items.map((text) => (
          <li key={text} className="program-statement">
            <span aria-hidden="true" className="program-statement-mark">
              &mdash;
            </span>
            <span className="min-w-0">{text}</span>
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
  audience,
  format,
  showTrainer,
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

      <div className="container program-section-inner">
        {problems && problems.length > 0 && (
          <ScrollReveal>
            <Heading id={`${id}-problems`}>Problems We Solve</Heading>
            <NumberedList items={problems} />
          </ScrollReveal>
        )}

        {/*
         * The Before/After table is NOT rendered here any more.
         *
         * It appeared in all five programs and again in §5.4, so the visitor met
         * six variants of the same comparison and none of them was the canonical
         * one. The table now lives only in §5.4 (`#why`), and `beforeAfterLink`
         * below leaves a one-line path to it. The `beforeAfter` prop is still
         * accepted for now so a program can opt back in, but no program passes
         * it — see the `beforeAfterHref` slot for what replaced it.
         */}
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
            <NumberedList items={benefits.items} />
          </ScrollReveal>
        )}

        {outcomes && (
          <ScrollReveal>
            <Heading id={`${id}-outcomes`}>{outcomes.heading}</Heading>
            <NumberedList items={outcomes.items} />
          </ScrollReveal>
        )}

        {capabilities && (
          <ScrollReveal>
            <Heading id={`${id}-capabilities`}>{capabilities.heading}</Heading>
            <NumberedList items={capabilities.items} />
          </ScrollReveal>
        )}

        {philosophy && (
          <ScrollReveal>
            <Heading id={`${id}-philosophy`}>{philosophy.heading}</Heading>

            {philosophy.lines && (
              <ul className="program-philosophy-lines">
                {philosophy.lines.map((line) => (
                  <li key={line} className="program-philosophy-line">
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

            {/* Compact steps: a 32px numeral tile and the text beside it, in a
                2-column grid at `md` and 3 at `lg`. The `p-8` card it was is
                the same box the rest of this pass removed. */}
            <ol className="program-modules-list">
              {framework.steps.map((step, i) => (
                <li key={step.title}>
                  <span
                    aria-hidden="true"
                    className={`program-module-tile-${i % 2 === 0 ? 'orange' : 'yellow'}`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="program-module-title">{step.title}</h3>
                    <p className="program-module-problem">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            {framework.note && (
              <p className="program-frame-note">{framework.note}</p>
            )}
          </ScrollReveal>
        )}

        {modules && (
          <ScrollReveal>
            <Heading id={`${id}-modules`}>{modules.heading}</Heading>
            <NumberedList items={modules.items} />
          </ScrollReveal>
        )}

        {modulesSecondary && (
          <ScrollReveal>
            <Heading id={`${id}-modules-secondary`}>
              {modulesSecondary.heading}
              {modulesSecondary.note && (
                <span className="ml-2 program-modules-note">
                  ({modulesSecondary.note})
                </span>
              )}
            </Heading>

            <ol className="program-modules-list">
              {modulesSecondary.items.map((item, i) => (
                <li key={item.title}>
                  <span
                    aria-hidden="true"
                    className={`program-module-tile-${i % 2 === 0 ? 'orange' : 'yellow'}`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="program-module-title">{item.title}</h3>
                    <p className="program-module-problem">{item.problem}</p>
                    <p className="program-module-outcome">{item.outcome}</p>
                  </div>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        )}

        {days && (
          <ScrollReveal>
            <Heading id={`${id}-days`}>{days.heading}</Heading>
            <dl className="program-day-list">
              {days.items.map((day) => (
                <div key={day.label} className="program-day-item">
                  <dt className="program-day-label">{day.label}</dt>

                  {day.stage && <p className="program-day-stage">{day.stage}</p>}

                  <dd className="program-day-summary">{day.summary}</dd>
                </div>
              ))}
            </dl>
          </ScrollReveal>
        )}

        {statements && (
          <ScrollReveal>
            <Heading id={`${id}-statements`}>{statements.heading}</Heading>
            <ul className="program-pill-list">
              {statements.items.map((text) => (
                <li key={text} className="program-pill">
                  {text}
                </li>
              ))}
            </ul>
          </ScrollReveal>
        )}


        {categories && (
          <ScrollReveal>
            <Heading id={`${id}-categories`}>{categories.heading}</Heading>

            {/* Compact rows with a colour-keyed category label. The `p-8`
                bordered card it was made three categories look like three
                products; they are three headings over a list of defects. */}
            <ul className="program-category-list">
              {categories.items.map((category) => (
                <li key={category.title} className="program-category">
                  <h3 className="program-category-title">{category.title}</h3>
                  <p className="program-category-items">{category.items}</p>
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

        {/*
         * The closing CTA is now ONE line plus ONE button.
         *
         * It used to be a dark `p-12` panel carrying a headline, a body, three
         * 56px buttons and a sign-off — repeated in all five programs. Forty per
         * cent of a program body's vertical weight was the same "Request a
         * Proposal" block, which meant the visitor saw the page's real
         * conversion path five times and stopped reading it as an action.
         *
         * The headline, body and sign-off copy are NOT deleted: they render in
         * the §5.6 Contact section, which is the one place a decision to enquire
         * is actually made. See `ProgramCtaFooter` — the copy moved, it did not
         * disappear.
         *
         * What remains here is the local affordance: the audience line (who this
         * is for, in the program's own words) and a single button that jumps into
         * the form with this programme pre-ticked.
         */}
        {(audience || format) && (
          <p className="program-audience-line">
            {audience && (
              <>
                <span className="program-audience-key">For:</span>{' '}
                {audience.items.join(', ')}
              </>
            )}
            {audience && format && (
              <span aria-hidden="true" className="program-audience-sep">
                {' · '}
              </span>
            )}
            {format && (
              <>
                <span className="program-audience-key">Format:</span>{' '}
                {format.items.join(', ')}
              </>
            )}
          </p>
        )}

        <div className="program-cta-row">
          {cta?.programSlug && (
            <a
              href={`#contact?program=${cta.programSlug}`}
              className="program-request-button"
            >
              Request for {cta.label}
            </a>
          )}

          <a href="#why" className="program-why-link">
            See the capability shift
            <span aria-hidden="true"> →</span>
          </a>
        </div>
      </div>
    </div>
  );
}
