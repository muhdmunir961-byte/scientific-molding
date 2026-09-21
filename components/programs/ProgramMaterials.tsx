/**
 * Program B — Processability of Thermoplastics in Injection Molding.
 *
 * Thin composition: dark hero plus the shared light body. All copy comes from
 * `program-b-content.ts`, the verbatim PDF extraction.
 *
 * ── Surface alternation ─────────────────────────────────────────────
 * The About section is white, so Program A takes off-white and Program B takes
 * white. They alternate down the page per PRD 13.1: off-white "for alternating
 * sections". Getting this wrong makes two adjacent sections merge visually.
 */

import ProgramHero from './ProgramHero';
import ProgramSection from '../shared/ProgramSection';
import ModuleSet from '../shared/ModuleSet';
import { ctaLabelFor } from './program-cta-content';
import {
  PROGRAM_B_AUDIENCE,
  PROGRAM_B_BENEFITS,
  PROGRAM_B_CAPABILITIES,
  PROGRAM_B_CORE_MODULES,
  PROGRAM_B_CTA,
  PROGRAM_B_FRAMEWORK,
  PROGRAM_B_HERO,
  PROGRAM_B_LEARNING_APPROACH,
  PROGRAM_B_MANAGEMENT_TAKEAWAY,
  PROGRAM_B_MODULES,
  PROGRAM_B_PLASTIC_CONDITIONS,
  PROGRAM_B_PROBLEMS,
  PROGRAM_B_TAKE_BACK,
} from './program-b-content';

export default function ProgramMaterials() {
  return (
    <section id={PROGRAM_B_HERO.id} aria-labelledby={`${PROGRAM_B_HERO.id}-heading`}>
      <ProgramHero
        id={PROGRAM_B_HERO.id}
        eyebrow={PROGRAM_B_HERO.eyebrow}
        titleOrange="PROCESSABILITY OF THERMOPLASTICS"
        titleRest="IN INJECTION MOLDING."
        tagline={PROGRAM_B_HERO.tagline}
        subcopy={PROGRAM_B_HERO.subcopy}
        badge={PROGRAM_B_HERO.badge}
        badgeSecondary={PROGRAM_B_HERO.badgeSecondary}
      />

      <ProgramSection
        id={PROGRAM_B_HERO.id}
        tone="white"
        problems={PROGRAM_B_PROBLEMS}
        benefits={{ heading: 'Five Benefits', items: PROGRAM_B_BENEFITS }}
        statement={{
          heading: PROGRAM_B_MANAGEMENT_TAKEAWAY.heading,
          text: PROGRAM_B_MANAGEMENT_TAKEAWAY.statement,
        }}
        capabilities={{
          heading: 'Five Capabilities',
          items: PROGRAM_B_CAPABILITIES,
        }}
        framework={{
          heading: PROGRAM_B_FRAMEWORK.heading,
          steps: PROGRAM_B_FRAMEWORK.steps,
          note: PROGRAM_B_FRAMEWORK.note,
        }}
        modulesSecondary={{
          heading:
            'FOUR MODULES. FOUR PRACTICAL PRODUCTION PROBLEMS.',
          items: PROGRAM_B_MODULES.map((module) => ({
            title: module.title,
            problem: module.problem,
            outcome: module.outcome,
          })),
        }}
        philosophy={{
          heading: PROGRAM_B_PLASTIC_CONDITIONS.heading,
          items: PROGRAM_B_PLASTIC_CONDITIONS.items,
        }}
        outcomes={{ heading: 'Take Back', items: PROGRAM_B_TAKE_BACK }}
        format={{
          heading: PROGRAM_B_LEARNING_APPROACH.heading,
          items: PROGRAM_B_LEARNING_APPROACH.items,
        }}
        audience={PROGRAM_B_AUDIENCE}
        cta={{ ...PROGRAM_B_CTA, label: ctaLabelFor(PROGRAM_B_HERO.id) }}
      >
        {/*
         * Program B's second module set. It uses the same problem → outcome
         * shape as the first, but `ProgramSection` has one `modulesSecondary`
         * slot — so this one is passed as a child rather than widening the
         * shared API to an array for a single program's edge case.
         */}
        <ModuleSet
          heading="FOUR CORE MODULES — READ THE RESIN BEFORE SETTING THE MACHINE"
          items={PROGRAM_B_CORE_MODULES.items}
        />
      </ProgramSection>
    </section>
  );
}
