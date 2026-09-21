/**
 * Program D — Defect Troubleshooting.
 *
 * Thin composition: dark hero plus the shared light body. All copy comes from
 * `program-d-content.ts`, the verbatim PDF extraction.
 *
 * Surface: white, continuing the alternation from Program C's off-white body.
 */

import ProgramHero from './ProgramHero';
import ProgramSection, { Statements } from '../shared/ProgramSection';
import { ctaLabelFor } from './program-cta-content';
import {
  PROGRAM_D_AUDIENCE,
  PROGRAM_D_BUSINESS_OUTCOMES,
  PROGRAM_D_CAPABILITIES,
  PROGRAM_D_CTA,
  PROGRAM_D_DAYS,
  PROGRAM_D_DEFECTS_COVERED,
  PROGRAM_D_FRAME_WORK,
  PROGRAM_D_HERO,
  PROGRAM_D_LEARNING_FORMAT,
  PROGRAM_D_MANAGEMENT_TAKEAWAY,
  PROGRAM_D_WARNING_SIGNS,
  PROGRAM_D_WHY_ESSENTIAL,
} from './program-d-content';

export default function ProgramDefectTroubleshooting() {
  return (
    <section id={PROGRAM_D_HERO.id} aria-labelledby={`${PROGRAM_D_HERO.id}-heading`}>
      <ProgramHero
        id={PROGRAM_D_HERO.id}
        eyebrow={PROGRAM_D_HERO.eyebrowRaw}
        titleOrange="SIX WARNING SIGNS"
        titleRest="MANAGEMENT SHOULD RECOGNISE"
        tagline={PROGRAM_D_HERO.tagline}
        subcopy={PROGRAM_D_HERO.subcopyRaw}
        badge={PROGRAM_D_HERO.badge}
        badgeSecondary={PROGRAM_D_HERO.badgeSecondary}
      />

      <ProgramSection
        id={PROGRAM_D_HERO.id}
        tone="white"
        /*
         * The source puts the six warning signs in the sub-copy slot as one
         * run-on block. The structured list renders them as a statement block
         * so each is readable on its own.
         */
        statements={{
          heading: 'Six Warning Signs',
          items: PROGRAM_D_WARNING_SIGNS,
        }}
        outcomes={{
          heading: 'Five Business Outcomes',
          items: PROGRAM_D_BUSINESS_OUTCOMES.map((text, i) => ({
            number: String(i + 1).padStart(2, '0'),
            title: '',
            description: text,
          })),
        }}
        statement={{
          heading: PROGRAM_D_MANAGEMENT_TAKEAWAY.heading,
          text: PROGRAM_D_MANAGEMENT_TAKEAWAY.statement,
        }}
        capabilities={{
          heading: 'Five Capabilities',
          items: PROGRAM_D_CAPABILITIES,
        }}
        framework={{
          heading: PROGRAM_D_FRAME_WORK.heading,
          steps: PROGRAM_D_FRAME_WORK.items,
        }}
        days={{ heading: PROGRAM_D_DAYS.heading, items: PROGRAM_D_DAYS.items }}
        categories={{
          heading: PROGRAM_D_DEFECTS_COVERED.heading,
          items: PROGRAM_D_DEFECTS_COVERED.categories,
        }}
        audience={PROGRAM_D_AUDIENCE}
        format={{
          heading: PROGRAM_D_LEARNING_FORMAT.heading,
          items: PROGRAM_D_LEARNING_FORMAT.items,
        }}
        cta={{ ...PROGRAM_D_CTA, label: ctaLabelFor(PROGRAM_D_HERO.id) }}
      >
        <Statements
          heading={PROGRAM_D_WHY_ESSENTIAL.heading}
          items={PROGRAM_D_WHY_ESSENTIAL.items}
        />
      </ProgramSection>
    </section>
  );
}
