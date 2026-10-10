import ProgramHero from './ProgramHero';
import ProgramSection from '../shared/ProgramSection';
import ModuleGallery from './ModuleGallery';
import { ctaLabelFor } from './program-cta-content';
import { withOverrides } from '@/lib/admin/overrides';
import {
  PROGRAM_M5_AUDIENCE as PROGRAM_M5_AUDIENCE_RAW,
  PROGRAM_M5_BEFORE_AFTER,
  PROGRAM_M5_BEFORE_AFTER_LABELS,
  PROGRAM_M5_BENEFITS as PROGRAM_M5_BENEFITS_RAW,
  PROGRAM_M5_CTA,
  PROGRAM_M5_DAYS as PROGRAM_M5_DAYS_RAW,
  PROGRAM_M5_HERO as PROGRAM_M5_HERO_RAW,
  PROGRAM_M5_LEARNING_FORMAT as PROGRAM_M5_LEARNING_FORMAT_RAW,
  PROGRAM_M5_OUTCOMES as PROGRAM_M5_OUTCOMES_RAW,
  PROGRAM_M5_PHILOSOPHY as PROGRAM_M5_PHILOSOPHY_RAW,
  PROGRAM_M5_PROBLEMS as PROGRAM_M5_PROBLEMS_RAW,
} from './program-m5-content';

const PROGRAM_M5_AUDIENCE = withOverrides('program-m5.PROGRAM_M5_AUDIENCE', PROGRAM_M5_AUDIENCE_RAW);
const PROGRAM_M5_BENEFITS = withOverrides('program-m5.PROGRAM_M5_BENEFITS', PROGRAM_M5_BENEFITS_RAW);
const PROGRAM_M5_DAYS = withOverrides('program-m5.PROGRAM_M5_DAYS', PROGRAM_M5_DAYS_RAW);
const PROGRAM_M5_HERO = withOverrides('program-m5.PROGRAM_M5_HERO', PROGRAM_M5_HERO_RAW);
const PROGRAM_M5_LEARNING_FORMAT = withOverrides('program-m5.PROGRAM_M5_LEARNING_FORMAT', PROGRAM_M5_LEARNING_FORMAT_RAW);
const PROGRAM_M5_OUTCOMES = withOverrides('program-m5.PROGRAM_M5_OUTCOMES', PROGRAM_M5_OUTCOMES_RAW);
const PROGRAM_M5_PHILOSOPHY = withOverrides('program-m5.PROGRAM_M5_PHILOSOPHY', PROGRAM_M5_PHILOSOPHY_RAW);
const PROGRAM_M5_PROBLEMS = withOverrides('program-m5.PROGRAM_M5_PROBLEMS', PROGRAM_M5_PROBLEMS_RAW);

export default function ProgramParameterSettingM5() {
  return (
    <section id={PROGRAM_M5_HERO.id} aria-labelledby={`${PROGRAM_M5_HERO.id}-heading`}>
      <ProgramHero
        id={PROGRAM_M5_HERO.id}
        eyebrow={PROGRAM_M5_HERO.eyebrow}
        titleOrange="SYSTEMATIC PARAMETER SETTING"
        titleRest="FOR INJECTION MOLDING"
        subcopy={PROGRAM_M5_HERO.subcopy}
        badge={PROGRAM_M5_HERO.badge}
        badgeSecondary={PROGRAM_M5_HERO.badgeSecondary}
      />
      <ProgramSection
        id={PROGRAM_M5_HERO.id}
        tone="white"
        problems={PROGRAM_M5_PROBLEMS}
        beforeAfter={{
          heading: 'Before / After',
          caption: 'From personal habit to shared engineering capability',
          labels: PROGRAM_M5_BEFORE_AFTER_LABELS,
          rows: PROGRAM_M5_BEFORE_AFTER,
        }}
        benefits={{ heading: 'Five Business Benefits', items: PROGRAM_M5_BENEFITS }}
        outcomes={{ heading: 'Five Practical Outcomes', items: PROGRAM_M5_OUTCOMES }}
        philosophy={PROGRAM_M5_PHILOSOPHY}
        days={{ heading: 'Two-Day Journey', items: PROGRAM_M5_DAYS }}
        audience={PROGRAM_M5_AUDIENCE}
        format={PROGRAM_M5_LEARNING_FORMAT}
        cta={{ ...PROGRAM_M5_CTA, label: ctaLabelFor(PROGRAM_M5_HERO.id) }}
      >
        <ModuleGallery moduleSlug="m5-parameter-setting" moduleTitle={PROGRAM_M5_HERO.title} />
      </ProgramSection>
    </section>
  );
}
