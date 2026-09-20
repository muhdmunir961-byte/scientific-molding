/**
 * PROGRAM E — 7-Module Professional Training Pathway (Portfolio Overview)
 * Anchor: #pathway
 *
 * SOURCE OF TRUTH: the supplied PDF content, extracted verbatim.
 * Overrides PRD 5.3 where they conflict. PDF palette, black hero surface.
 *
 * Note: Program E's hero reuses the site Hero copy verbatim — the same title
 * and sub-copy already live in `hero/hero-content.ts`. They are repeated here
 * rather than imported so this file stays a self-contained extraction; the
 * duplicate strings are asserted by the checker either way.
 */

export const PROGRAM_E_HERO = {
  id: 'pathway',

  title: '7 structured modules. One stronger moulding organisation.',
  subcopy:
    'Build capability - Improve consistency - Strengthen technical decision-making',
} as const;

/**
 * Stat strip. Four figures with their labels.
 * Preserved as strings because of the leading zeros, same reasoning as the
 * site Hero: typed as numbers they would render "7", "16", "4", "1".
 */
export const PROGRAM_E_STATS = [
  { value: '07', label: 'SPECIALIST MODULES' },
  { value: '16', label: 'TOTAL TRAINING DAYS' },
  { value: '04', label: 'CAPABILITY LEVELS' },
  { value: '01', label: 'CLEAR LEARNING PATH' },
] as const;

/** Section heading and its sub-line. */
export const PROGRAM_E_SECTION = {
  heading: 'COMPLETE PROFESSIONAL TRAINING PORTFOLIO',
  subline: 'Seven modules. Clear outcomes. Practical value.',
} as const;

/**
 * Seven modules.
 *
 * Each carries the PRD 13.2 module-card fields: icon-equivalent code, title,
 * description, tag chips, level badge, duration and a one-line outcome.
 *
 * Source format: "NN Title — "description" Tags: … Badge: … Duration: …
 * Code: … Outcome: "…""
 */
export const PROGRAM_E_MODULES = [
  {
    number: '01',
    code: 'M1',
    title: 'Fundamental of Scientific Molding',
    description:
      'Develop a shared, evidence-led understanding of scientific moulding.',
    tags: ['CORE CONCEPTS', 'PROCESS BASICS', 'SHARED LANGUAGE'],
    badge: 'FOUNDATION',
    duration: '2 DAYS',
    outcome:
      'Create a common technical foundation across the organisation.',
  },
  {
    number: '02',
    code: 'M2',
    title: 'Processability of Thermoplastics in Injection Molding',
    description:
      'Understand how thermoplastic behaviour influences moulding quality.',
    tags: ['THERMOPLASTICS', 'MATERIAL BEHAVIOUR', 'PROCESSABILITY'],
    badge: 'FOUNDATION',
    duration: '2 DAYS',
    outcome:
      'Connect material characteristics to product and process performance.',
  },
  {
    number: '03',
    code: 'M3',
    title: 'Fundamental of Scientific Molding - Process Development',
    description:
      'Build the essential principles behind structured process development.',
    tags: ['DEVELOPMENT BASICS', 'PROCESS PHASES', 'DATA THINKING'],
    badge: 'BRIDGE',
    duration: '2 DAYS',
    outcome:
      'Prepare the team for more advanced process-development learning.',
  },
  {
    number: '04',
    code: 'M4',
    title: 'Scientific Molding - Process Development',
    description:
      'Advance towards more robust, consistent process-development thinking.',
    tags: ['ROBUST PROCESSES', 'PROCESS EVIDENCE', 'REPEATABILITY'],
    badge: 'ADVANCED',
    duration: '4 DAYS',
    outcome:
      'Strengthen the ability to evaluate and standardise process decisions.',
  },
  {
    number: '05',
    code: 'M5',
    title: 'Systematic Parameter Setting for Injection Molding',
    description:
      'Introduce a consistent framework for parameter-setting decisions.',
    tags: ['PARAMETER LOGIC', 'STRUCTURED METHOD', 'CONSISTENCY'],
    badge: 'BRIDGE',
    duration: '2 DAYS',
    outcome:
      'Promote a logical, shared approach to process-setting discussions.',
  },
  {
    number: '06',
    code: 'M6',
    title: 'Scientific Molding: Defects Troubleshooting',
    description:
      'Explore a structured, evidence-led approach to recurring defects.',
    tags: ['DEFECT PATTERNS', 'ROOT-CAUSE THINKING', 'EVIDENCE'],
    badge: 'APPLICATION',
    duration: '2 DAYS',
    outcome:
      'Improve problem identification and the quality of defect investigation.',
  },
  {
    number: '07',
    code: 'M7',
    title: 'Scientific Molding: Process Portability',
    description:
      'Understand how a defined process can remain consistent across contexts.',
    tags: ['PROCESS TRANSFER', 'STANDARDISATION', 'DOCUMENTATION'],
    badge: 'ADVANCED',
    duration: '2 DAYS',
    outcome:
      'Support reproducibility and communication across teams or locations.',
  },
] as const;

/**
 * Recommended Pathway. A stepper, not a list — the arrow flow is meaningful
 * order (M1 → M2 → M3 → M5 → M4 → M6 → M7) and does not match numeric order.
 */
export const PROGRAM_E_PATHWAY = {
  heading: 'Recommended Pathway',
  note: 'Start with the right foundation, then progress according to participant readiness.',
  steps: [
    { code: 'M1', label: 'FOUNDATION' },
    { code: 'M2', label: 'MATERIALS' },
    { code: 'M3', label: 'BRIDGE' },
    { code: 'M5', label: 'PARAMETERS' },
    { code: 'M4', label: 'ADVANCED' },
    { code: 'M6', label: 'DEFECTS' },
    { code: 'M7', label: 'TRANSFER' },
  ],
} as const;

/** "What the Organisation Can Build" — three summary columns. */
export const PROGRAM_E_ORGANISATION_BUILD = {
  heading: 'What Organisation Can Build',
  items: [
    {
      number: '01',
      title: 'STRONGER CAPABILITY',
      description:
        'Develop a common technical language and a more confident engineering team.',
    },
    {
      number: '02',
      title: 'BETTER CONSISTENCY',
      description:
        'Strengthen evidence-led decisions, process discipline and learning continuity.',
    },
    {
      number: '03',
      title: 'CLEARER PRIORITIES',
      description:
        'Select the modules that match business needs and participant readiness.',
    },
  ],
} as const;

/** Closing CTA. */
export const PROGRAM_E_CTA = {
  headline: 'BUILD THE RIGHT CAPABILITY FOR YOUR MOULDING TEAM.',
  body: 'Structured learning. Clear priorities. Stronger technical confidence.',
  programSlug: PROGRAM_E_HERO.id,
  /*
   * PDF-TYPO (name + phone format): the source signs
   * "Ts Mohd Hafiedzzul B Malek Riduan" (no period after "Ts") and gives the
   * phone as "0124885247" with no separators. Both preserved verbatim.
   */
  signoff: 'Ts Mohd Hafiedzzul B Malek Riduan',
  phone: '0124885247',
  phoneHref: 'tel:+60124885247',
} as const;

/**
 * Convenience bundle.
 *
 * `PROGRAM_E_MODULES` is exported separately above because it is also the
 * data behind the PRD 13.2 capability/module cards.
 */
export const PROGRAM_E = {
  id: PROGRAM_E_HERO.id,
  hero: PROGRAM_E_HERO,
  stats: PROGRAM_E_STATS,
  section: PROGRAM_E_SECTION,
  modules: PROGRAM_E_MODULES,
  pathway: PROGRAM_E_PATHWAY,
  organisationBuild: PROGRAM_E_ORGANISATION_BUILD,
  cta: PROGRAM_E_CTA,
} as const;
