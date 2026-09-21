/**
 * Program C — Scientific Moulding Process Development.
 *
 * Thin composition: dark hero plus the shared light body. All copy comes from
 * `program-c-content.ts`, the verbatim PDF extraction.
 *
 * Surface: off-white, continuing the alternation from Program B's white body.
 */

import ProgramHero from './ProgramHero';
import ProgramSection, { Statements } from '../shared/ProgramSection';
import { ctaLabelFor } from './program-cta-content';
import {
  PROGRAM_C_AUDIENCE,
  PROGRAM_C_BENEFITS,
  PROGRAM_C_CTA,
  PROGRAM_C_DAYS,
  PROGRAM_C_HERO,
  PROGRAM_C_OUTCOMES,
  PROGRAM_C_PERSPECTIVES,
  PROGRAM_C_PHILOSOPHY,
  PROGRAM_C_PROBLEMS,
  PROGRAM_C_TAKE_BACK,
} from './program-c-content';

export default function ProgramProcessDevelopment() {
  return (
    <section id={PROGRAM_C_HERO.id} aria-labelledby={`${PROGRAM_C_HERO.id}-heading`}>
      <ProgramHero
        id={PROGRAM_C_HERO.id}
        eyebrow={PROGRAM_C_HERO.eyebrow}
        titleOrange="SCIENTIFIC MOULDING"
        titleRest="PROCESS DEVELOPMENT"
        tagline={PROGRAM_C_HERO.tagline}
        subcopy={PROGRAM_C_HERO.subcopy}
        badge={PROGRAM_C_HERO.badge}
        /* 4-Day is the premium tier: the badge takes the yellow accent. */
        badgeTone="yellow"
      />

      <ProgramSection
        id={PROGRAM_C_HERO.id}
        tone="offwhite"
        problems={PROGRAM_C_PROBLEMS}
        benefits={{
          heading: 'Five Business Benefits',
          items: PROGRAM_C_BENEFITS.map((item, i) => ({
            number: String(i + 1).padStart(2, '0'),
            ...item,
          })),
        }}
        outcomes={{
          heading: 'Five Outcomes',
          items: PROGRAM_C_OUTCOMES.map((item, i) => ({
            number: String(i + 1).padStart(2, '0'),
            ...item,
          })),
        }}
        philosophy={{
          heading: PROGRAM_C_PHILOSOPHY.heading,
          lines: [PROGRAM_C_PHILOSOPHY.statement],
          items: PROGRAM_C_PHILOSOPHY.items,
        }}
        framework={{
          heading: PROGRAM_C_PERSPECTIVES.heading,
          steps: PROGRAM_C_PERSPECTIVES.items,
        }}
        days={{ heading: PROGRAM_C_DAYS.heading, items: PROGRAM_C_DAYS.items }}
        audience={PROGRAM_C_AUDIENCE}
        cta={{ ...PROGRAM_C_CTA, label: ctaLabelFor(PROGRAM_C_HERO.id) }}
      >
        {/* "Take Back" has two items and the source gives each as two
            sentences, so it renders as a plain statement block rather than the
            3-card grid used by the other programs. */}
        <Statements
          heading="Take Back"
          items={PROGRAM_C_TAKE_BACK.map(
            (item) => `${item.title} — ${item.description}`,
          )}
        />
      </ProgramSection>
    </section>
  );
}
