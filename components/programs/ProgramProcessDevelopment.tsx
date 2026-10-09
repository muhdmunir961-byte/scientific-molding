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
import { withOverrides } from '@/lib/admin/overrides';
import {
  PROGRAM_C_AUDIENCE as PROGRAM_C_AUDIENCE_RAW,
  PROGRAM_C_BENEFITS as PROGRAM_C_BENEFITS_RAW,
  PROGRAM_C_CTA as PROGRAM_C_CTA_RAW,
  PROGRAM_C_DAYS as PROGRAM_C_DAYS_RAW,
  PROGRAM_C_HERO as PROGRAM_C_HERO_RAW,
  PROGRAM_C_OUTCOMES as PROGRAM_C_OUTCOMES_RAW,
  PROGRAM_C_PERSPECTIVES as PROGRAM_C_PERSPECTIVES_RAW,
  PROGRAM_C_PHILOSOPHY as PROGRAM_C_PHILOSOPHY_RAW,
  PROGRAM_C_PROBLEMS as PROGRAM_C_PROBLEMS_RAW,
  PROGRAM_C_TAKE_BACK as PROGRAM_C_TAKE_BACK_RAW,
} from './program-c-content';

/*
 * Admin overrides, resolved once at module load. The programme text is
 * editable by decision, with the PDF caution shown in the panel — see
 * `PDF_EDIT_WARNING` in `lib/admin/schema.ts`.
 */
const PROGRAM_C_AUDIENCE = withOverrides('program-c.PROGRAM_C_AUDIENCE', PROGRAM_C_AUDIENCE_RAW);
const PROGRAM_C_BENEFITS = withOverrides('program-c.PROGRAM_C_BENEFITS', PROGRAM_C_BENEFITS_RAW);
const PROGRAM_C_CTA = withOverrides('program-c.PROGRAM_C_CTA', PROGRAM_C_CTA_RAW);
const PROGRAM_C_DAYS = withOverrides('program-c.PROGRAM_C_DAYS', PROGRAM_C_DAYS_RAW);
const PROGRAM_C_HERO = withOverrides('program-c.PROGRAM_C_HERO', PROGRAM_C_HERO_RAW);
const PROGRAM_C_OUTCOMES = withOverrides('program-c.PROGRAM_C_OUTCOMES', PROGRAM_C_OUTCOMES_RAW);
const PROGRAM_C_PERSPECTIVES = withOverrides('program-c.PROGRAM_C_PERSPECTIVES', PROGRAM_C_PERSPECTIVES_RAW);
const PROGRAM_C_PHILOSOPHY = withOverrides('program-c.PROGRAM_C_PHILOSOPHY', PROGRAM_C_PHILOSOPHY_RAW);
const PROGRAM_C_PROBLEMS = withOverrides('program-c.PROGRAM_C_PROBLEMS', PROGRAM_C_PROBLEMS_RAW);
const PROGRAM_C_TAKE_BACK = withOverrides('program-c.PROGRAM_C_TAKE_BACK', PROGRAM_C_TAKE_BACK_RAW);

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
