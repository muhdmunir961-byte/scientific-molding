import ProgramHero from './ProgramHero';
import ProgramSection from '../shared/ProgramSection';
import ModuleGallery from './ModuleGallery';
import { ctaLabelFor } from './program-cta-content';
import { withOverrides } from '@/lib/admin/overrides';
import {
  PROGRAM_M3_AUDIENCE as PROGRAM_M3_AUDIENCE_RAW,
  PROGRAM_M3_BEFORE_AFTER,
  PROGRAM_M3_BEFORE_AFTER_LABELS,
  PROGRAM_M3_BENEFITS as PROGRAM_M3_BENEFITS_RAW,
  PROGRAM_M3_CTA,
  PROGRAM_M3_DAYS as PROGRAM_M3_DAYS_RAW,
  PROGRAM_M3_HERO as PROGRAM_M3_HERO_RAW,
  PROGRAM_M3_LEARNING_FORMAT as PROGRAM_M3_LEARNING_FORMAT_RAW,
  PROGRAM_M3_OUTCOMES as PROGRAM_M3_OUTCOMES_RAW,
  PROGRAM_M3_PHILOSOPHY as PROGRAM_M3_PHILOSOPHY_RAW,
  PROGRAM_M3_PROBLEMS as PROGRAM_M3_PROBLEMS_RAW,
} from './program-m3-content';

const PROGRAM_M3_AUDIENCE = withOverrides('program-m3.PROGRAM_M3_AUDIENCE', PROGRAM_M3_AUDIENCE_RAW);
const PROGRAM_M3_BENEFITS = withOverrides('program-m3.PROGRAM_M3_BENEFITS', PROGRAM_M3_BENEFITS_RAW);
const PROGRAM_M3_DAYS = withOverrides('program-m3.PROGRAM_M3_DAYS', PROGRAM_M3_DAYS_RAW);
const PROGRAM_M3_HERO = withOverrides('program-m3.PROGRAM_M3_HERO', PROGRAM_M3_HERO_RAW);
const PROGRAM_M3_LEARNING_FORMAT = withOverrides('program-m3.PROGRAM_M3_LEARNING_FORMAT', PROGRAM_M3_LEARNING_FORMAT_RAW);
const PROGRAM_M3_OUTCOMES = withOverrides('program-m3.PROGRAM_M3_OUTCOMES', PROGRAM_M3_OUTCOMES_RAW);
const PROGRAM_M3_PHILOSOPHY = withOverrides('program-m3.PROGRAM_M3_PHILOSOPHY', PROGRAM_M3_PHILOSOPHY_RAW);
const PROGRAM_M3_PROBLEMS = withOverrides('program-m3.PROGRAM_M3_PROBLEMS', PROGRAM_M3_PROBLEMS_RAW);

export default function ProgramProcessDevelopmentM3() {
  return (
    <section id={PROGRAM_M3_HERO.id} aria-labelledby={`${PROGRAM_M3_HERO.id}-heading`}>
      <ProgramHero
        id={PROGRAM_M3_HERO.id}
        eyebrow={PROGRAM_M3_HERO.eyebrow}
        titleOrange="FUNDAMENTAL OF SCIENTIFIC MOULDING:"
        titleRest="PROCESS DEVELOPMENT"
        subcopy={PROGRAM_M3_HERO.subcopy}
        badge={PROGRAM_M3_HERO.badge}
        badgeSecondary={PROGRAM_M3_HERO.badgeSecondary}
      />
      <ProgramSection
        id={PROGRAM_M3_HERO.id}
        tone="offwhite"
        problems={PROGRAM_M3_PROBLEMS}
        beforeAfter={{
          heading: 'Before / After',
          caption: 'From unstructured adjustment to structured process development',
          labels: PROGRAM_M3_BEFORE_AFTER_LABELS,
          rows: PROGRAM_M3_BEFORE_AFTER,
        }}
        benefits={{ heading: 'Five Business Benefits', items: PROGRAM_M3_BENEFITS }}
        outcomes={{ heading: 'Five Practical Outcomes', items: PROGRAM_M3_OUTCOMES }}
        philosophy={PROGRAM_M3_PHILOSOPHY}
        days={{ heading: 'Two-Day Journey', items: PROGRAM_M3_DAYS }}
        audience={PROGRAM_M3_AUDIENCE}
        format={PROGRAM_M3_LEARNING_FORMAT}
        cta={{ ...PROGRAM_M3_CTA, label: ctaLabelFor(PROGRAM_M3_HERO.id) }}
      >
        <ModuleGallery moduleSlug="m3-fundamental-pd" moduleTitle={PROGRAM_M3_HERO.title} />
      </ProgramSection>
    </section>
  );
}
