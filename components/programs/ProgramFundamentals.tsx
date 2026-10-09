/**
 * Program A — Scientific Moulding Fundamentals. PRD 5.3 / PDF content.
 *
 * Thin composition: the dark hero plus the shared light body. All copy comes
 * from `program-a-content.ts`, which is the verbatim extraction.
 */

import ProgramHero from './ProgramHero';
import ProgramSection from '../shared/ProgramSection';
import ModuleGallery from './ModuleGallery';
import { ctaLabelFor } from './program-cta-content';
import { withOverrides } from '@/lib/admin/overrides';
import {
  PROGRAM_A_BENEFITS as PROGRAM_A_BENEFITS_RAW,
  PROGRAM_A_CTA as PROGRAM_A_CTA_RAW,
  PROGRAM_A_DAYS as PROGRAM_A_DAYS_RAW,
  PROGRAM_A_FOUNDATIONS as PROGRAM_A_FOUNDATIONS_RAW,
  PROGRAM_A_HERO as PROGRAM_A_HERO_RAW,
  PROGRAM_A_LEARNING_FORMAT as PROGRAM_A_LEARNING_FORMAT_RAW,
  PROGRAM_A_OUTCOMES as PROGRAM_A_OUTCOMES_RAW,
  PROGRAM_A_PHILOSOPHY as PROGRAM_A_PHILOSOPHY_RAW,
  PROGRAM_A_PROBLEMS as PROGRAM_A_PROBLEMS_RAW,
  PROGRAM_A_WHY_MATTERS as PROGRAM_A_WHY_MATTERS_RAW,
} from './program-a-content';

/*
 * Admin overrides, resolved once at module load.
 *
 * Programme text is editable by decision, with the PDF caution shown in the
 * panel: the copy is a verbatim extraction from the document the customer
 * approved, so an edit means the page no longer matches it. See
 * `PDF_EDIT_WARNING` in `lib/admin/schema.ts`.
 */
const PROGRAM_A_HERO = withOverrides('program-a.PROGRAM_A_HERO', PROGRAM_A_HERO_RAW);
const PROGRAM_A_PROBLEMS = withOverrides('program-a.PROGRAM_A_PROBLEMS', PROGRAM_A_PROBLEMS_RAW);
const PROGRAM_A_BENEFITS = withOverrides('program-a.PROGRAM_A_BENEFITS', PROGRAM_A_BENEFITS_RAW);
const PROGRAM_A_OUTCOMES = withOverrides('program-a.PROGRAM_A_OUTCOMES', PROGRAM_A_OUTCOMES_RAW);
const PROGRAM_A_PHILOSOPHY = withOverrides('program-a.PROGRAM_A_PHILOSOPHY', PROGRAM_A_PHILOSOPHY_RAW);
const PROGRAM_A_FOUNDATIONS = withOverrides('program-a.PROGRAM_A_FOUNDATIONS', PROGRAM_A_FOUNDATIONS_RAW);
const PROGRAM_A_DAYS = withOverrides('program-a.PROGRAM_A_DAYS', PROGRAM_A_DAYS_RAW);
const PROGRAM_A_LEARNING_FORMAT = withOverrides('program-a.PROGRAM_A_LEARNING_FORMAT', PROGRAM_A_LEARNING_FORMAT_RAW);
const PROGRAM_A_WHY_MATTERS = withOverrides('program-a.PROGRAM_A_WHY_MATTERS', PROGRAM_A_WHY_MATTERS_RAW);
const PROGRAM_A_CTA = withOverrides('program-a.PROGRAM_A_CTA', PROGRAM_A_CTA_RAW);


export default function ProgramFundamentals() {
  return (
    <section id={PROGRAM_A_HERO.id} aria-labelledby={`${PROGRAM_A_HERO.id}-heading`}>
      <ProgramHero
        id={PROGRAM_A_HERO.id}
        eyebrow={PROGRAM_A_HERO.eyebrow}
        titleOrange="SCIENTIFIC MOULDING"
        titleRest="FUNDAMENTALS."
        tagline={PROGRAM_A_HERO.tagline}
        subcopy={PROGRAM_A_HERO.subcopy}
        badge={PROGRAM_A_HERO.badge}
        badgeSecondary={PROGRAM_A_HERO.badgeSecondary}
      />

      <ProgramSection
        id={PROGRAM_A_HERO.id}
        tone="offwhite"
        problems={PROGRAM_A_PROBLEMS}
        benefits={{ heading: 'Five Measurable Benefits', items: PROGRAM_A_BENEFITS }}
        statement={{
          heading: PROGRAM_A_WHY_MATTERS.heading,
          text: PROGRAM_A_WHY_MATTERS.statement,
        }}
        outcomes={{
          heading: 'Five Outcomes for New Engineers',
          items: PROGRAM_A_OUTCOMES,
        }}
        philosophy={{
          heading: PROGRAM_A_PHILOSOPHY.heading,
          lines: PROGRAM_A_PHILOSOPHY.lines,
        }}
        modules={{
          heading: 'Four Connected Learning Foundations',
          items: PROGRAM_A_FOUNDATIONS.map((row) => ({
            number: row.number,
            title: row.foundation,
            description: `${row.understand} ${row.workplaceValue}`,
          })),
        }}
        days={{ heading: 'Two-Day Journey', items: PROGRAM_A_DAYS }}
        format={PROGRAM_A_LEARNING_FORMAT}
        cta={{ ...PROGRAM_A_CTA, label: ctaLabelFor(PROGRAM_A_HERO.id) }}
      >
        {/*
          * The module's photo gallery.
          *
          * Passed as a child rather than added to `ProgramSection`, because the
          * gallery is not a text block: it renders nothing at all until an
          * operator uploads photographs, and threading an empty-by-default
          * section through the shared template would add a slot four other
          * programmes never use.
          *
          * `moduleSlug` is the canonical slug from `content/modules.json`, which
          * is also what the admin panel writes under.
          */}
        <ModuleGallery
          moduleSlug="m1-fundamental"
          moduleTitle="Fundamental of Scientific Molding"
        />
      </ProgramSection>
    </section>
  );
}
