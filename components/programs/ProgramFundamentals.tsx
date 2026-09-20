/**
 * Program A — Scientific Moulding Fundamentals. PRD 5.3 / PDF content.
 *
 * Thin composition: the dark hero plus the shared light body. All copy comes
 * from `program-a-content.ts`, which is the verbatim extraction.
 */

import ProgramHero from './ProgramHero';
import ProgramSection from '../shared/ProgramSection';
import {
  PROGRAM_A_BEFORE_AFTER,
  PROGRAM_A_BEFORE_AFTER_LABELS,
  PROGRAM_A_BENEFITS,
  PROGRAM_A_CTA,
  PROGRAM_A_DAYS,
  PROGRAM_A_FOUNDATIONS,
  PROGRAM_A_HERO,
  PROGRAM_A_LEARNING_FORMAT,
  PROGRAM_A_OUTCOMES,
  PROGRAM_A_PHILOSOPHY,
  PROGRAM_A_PROBLEMS,
  PROGRAM_A_WHY_MATTERS,
} from './program-a-content';

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
        beforeAfter={{
          heading: 'Before & After',
          caption:
            'Before and after comparison for Scientific Moulding Fundamentals',
          labels: PROGRAM_A_BEFORE_AFTER_LABELS,
          rows: PROGRAM_A_BEFORE_AFTER,
        }}
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
        chips={[PROGRAM_A_LEARNING_FORMAT]}
        cta={PROGRAM_A_CTA}
      />
    </section>
  );
}
