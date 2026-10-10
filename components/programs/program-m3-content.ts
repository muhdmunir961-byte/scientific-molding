/**
 * PROGRAM M3 — Fundamental of Scientific Moulding: Process Development
 * Anchor: #m3-fundamental-pd | Badge: 2-Day | HRDC Claimable
 *
 * ════════════════════════════════════════════════════════════════════
 *  SOURCE OF TRUTH: content supplied by the trainer.
 *
 *  Unlike Program A, there is NO source PDF for this module. The copy was
 *  written by Ts. Mohd Hafiedzzul Bin Malek Riduan and approved by him, and
 *  is reproduced here without paraphrase. See docs/m3-m5-review.md for the
 *  approved checklist.
 *
 *  The same series-wide values Program A uses — the philosophy lines and the
 *  four plastic conditions — are reused rather than restated, so the series
 *  cannot describe itself two different ways.
 *
 *  SPELLING NOTE: the trainer's M3 headline uses "Moulding" while the M5
 *  headline and every title in content/modules.json use "Molding". Both are
 *  recorded as supplied. See docs/m3-m5-review.md question 1.
 * ════════════════════════════════════════════════════════════════════
 */

/** Module identity and hero block. */
export const PROGRAM_M3_HERO = {
  id: 'm3-fundamental-pd',
  badge: '2-Day',
  badgeSecondary: 'HRDC Claimable',
  eyebrow: 'Build the essential principles behind structured process development',
  title: 'FUNDAMENTAL OF SCIENTIFIC MOULDING: PROCESS DEVELOPMENT',
  /** No tagline was supplied for this module; the hero renders without one. */
  subcopy:
    'A two-day bridge from the fundamentals to structured development work, built on the four plastic conditions and a shared definition of repeatability.',
} as const;

/** Six Problems this module helps solve. */
export const PROGRAM_M3_PROBLEMS = [
  {
    title: 'Unstructured start-ups',
    description:
      'the process is set up differently each time, depending on who is on shift.',
  },
  {
    title: 'No development phases',
    description:
      'filling, packing and cooling are adjusted together without separating their roles.',
  },
  {
    title: 'Settings recorded, evidence ignored',
    description:
      'values are written down, but actual process outputs are not read.',
  },
  {
    title: 'No shared meaning of "stable"',
    description: 'teams do not agree on what repeatable means.',
  },
  {
    title: 'Data collected but unused',
    description: 'numbers are gathered without a clear purpose.',
  },
  {
    title: 'Not ready for advanced learning',
    description:
      'the basics are missing, so advanced development training is hard to absorb.',
  },
] as const;

/** Five business benefits for management. */
export const PROGRAM_M3_BENEFITS = [
  {
    number: '01',
    title: 'More organised start-up',
    category: 'Efficiency',
    description: 'replace random adjustment with a clear development sequence.',
  },
  {
    number: '02',
    title: 'Clearer process thinking',
    category: 'Understanding',
    description: 'connect each process phase to what the plastic experiences.',
  },
  {
    number: '03',
    title: 'Better use of process data',
    category: 'Data',
    description: 'turn recorded values into usable evidence.',
  },
  {
    number: '04',
    title: 'Shared development language',
    category: 'Teamwork',
    description: 'align engineering, production and quality.',
  },
  {
    number: '05',
    title: 'Readiness for advanced capability',
    category: 'Growth path',
    description: 'prepare the team for 4-day Process Development.',
  },
] as const;

/** Before / After comparison. */
export const PROGRAM_M3_BEFORE_AFTER = [
  {
    before: 'Adjust settings until parts look acceptable',
    after: 'Follow a phase-by-phase development logic',
  },
  {
    before: 'Record setpoints only',
    after: 'Read actual outputs alongside setpoints',
  },
  {
    before: '"Stable" means "it ran well today"',
    after: 'Repeatability has a shared meaning and indicators',
  },
] as const;

export const PROGRAM_M3_BEFORE_AFTER_LABELS = {
  before: 'BEFORE',
  after: 'AFTER',
} as const;

/** Five practical outcomes for engineers. */
export const PROGRAM_M3_OUTCOMES = [
  {
    number: '01',
    title: 'Describe the process phases and what each is meant to achieve',
    description: 'Name each phase and state its purpose.',
  },
  {
    number: '02',
    title: 'Separate process inputs from actual process outputs',
    description: 'Distinguish what is set from what the process actually does.',
  },
  {
    number: '03',
    title: 'Read basic process data and explain what it suggests',
    description: 'Turn recorded figures into a statement about the process.',
  },
  {
    number: '04',
    title: 'Explain what repeatability means and recognise its basic indicators',
    description: 'State the definition and the signs that support it.',
  },
  {
    number: '05',
    title: 'Record process information clearly for the wider team',
    description: 'Document so another engineer can follow it.',
  },
] as const;

/** Philosophy block — series-wide, reused unchanged. */
export const PROGRAM_M3_PHILOSOPHY = {
  heading: 'Philosophy',
  lines: [
    'MATERIAL + MOULD + MACHINE + PROCESS',
    'TEMPERATURE | FLOW | PRESSURE | COOLING',
    'Observe the evidence. Understand the material. Connect the cause-and-effect.',
  ],
} as const;

/** Two-day journey. */
export const PROGRAM_M3_DAYS = [
  {
    label: 'DAY 1',
    stage: 'Understand the structure',
    summary:
      'Why development must be structured; the four plastic conditions; process phases; inputs versus outputs.',
  },
  {
    label: 'DAY 2',
    stage: 'Apply the basics',
    summary:
      'Basic data thinking; recording and documenting; the concept of repeatability; a simple development sequence applied to a prepared case study; readiness review and pathway to M4.',
  },
] as const;

/** Learning format tags. */
export const PROGRAM_M3_LEARNING_FORMAT = {
  heading: 'Learning Format',
  items: [
    'Guided discussions',
    'Process diagrams',
    'Prepared data sets',
    'Case studies',
    'Participant worksheets',
  ],
} as const;

/**
 * Audience.
 *
 * `prerequisite` is rendered as its own line rather than folded into the list,
 * because "who should attend" and "what they should already know" are different
 * facts and a reader scans for them separately.
 */
export const PROGRAM_M3_AUDIENCE = {
  heading: 'Who Should Attend',
  items: [
    'Process engineers and technicians',
    'Setup technicians',
    'Production supervisors',
    'QA/QC personnel',
  ],
  prerequisite: 'Recommended after M1 and M2.',
} as const;

/**
 * Closing CTA.
 *
 * The headline and body are the build's, not the trainer's — his content did not
 * include a CTA. Flagged in docs/m3-m5-review.md question 3.
 */
export const PROGRAM_M3_CTA = {
  headline: 'BUILD A SHARED DEVELOPMENT METHOD',
  body: 'Request a customised in-house training proposal for your engineering team.',
  programSlug: PROGRAM_M3_HERO.id,
} as const;

/**
 * The safety and conduct line for this module.
 *
 * The trainer supplied a longer footer for M3 and M5 than the series uses
 * elsewhere, so it is kept verbatim and named separately rather than replacing
 * the shared line. See docs/m3-m5-review.md question 2.
 */
export const PROGRAM_M3_SAFETY =
  'Training uses prepared case studies, process data and authorised observations. Equipment operation, process changes and mold service are restricted to qualified, authorised personnel.' as const;
