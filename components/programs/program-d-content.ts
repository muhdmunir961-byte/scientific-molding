/**
 * PROGRAM D — Defect Troubleshooting
 * Anchor: #defect-troubleshooting | Badge: 2-Day | Engineer-Focused In-House
 *
 * SOURCE OF TRUTH: the supplied PDF content, extracted verbatim.
 * Overrides PRD 5.3 where they conflict. PDF palette, black hero surface.
 */

export const PROGRAM_D_HERO = {
  id: 'defect-troubleshooting',
  badge: '2-Day',
  badgeSecondary: 'Engineer-Focused In-House',

  /*
   * The source runs several metadata items together in the eyebrow line,
   * separated by spaces: "2 DAYS ENGINEER-FOCUSED IN-HOUSE 9:00 AM - 5:00 PM
   * Evidence and case studies Tailored to client needs". They are captured
   * as separate fields here so a renderer can badge them individually, with
   * the original string preserved in `eyebrowRaw`.
   */
  eyebrowRaw:
    '2 DAYS ENGINEER-FOCUSED IN-HOUSE 9:00 AM - 5:00 PM Evidence and case studies Tailored to client needs',
  eyebrowParts: [
    '2 DAYS',
    'ENGINEER-FOCUSED IN-HOUSE',
    '9:00 AM - 5:00 PM',
    'Evidence and case studies',
    'Tailored to client needs',
  ],

  title: 'SIX WARNING SIGNS MANAGEMENT SHOULD RECOGNISE',
  tagline: 'When defects become business problems',

  /*
   * The source puts the six warning signs in the sub-copy slot as one
   * run-on block of sentences. The structured list is in
   * PROGRAM_D_WARNING_SIGNS below; this field holds the original text
   * unchanged so the extraction stays byte-for-byte.
   */
  subcopyRaw:
    'The same defect returns after a temporary setting adjustment. Several parameters are changed together and the team cannot explain which action worked. Troubleshooting depends on senior staff instead of a repeatable company method. Machine, Mold, Material and Method causes are confused or investigated randomly. Production, quality and tooling disagree because decisions are not supported by common evidence. Corrective actions are not validated documented or converted into prevention standards.',
} as const;

/**
 * The six warning signs, split from `subcopyRaw` into one entry per sentence.
 *
 * PDF-TYPO (missing comma): "Corrective actions are not validated documented or
 * converted into prevention standards." — a comma is missing between
 * "validated" and "documented". Preserved verbatim.
 */
export const PROGRAM_D_WARNING_SIGNS = [
  'The same defect returns after a temporary setting adjustment.',
  'Several parameters are changed together and the team cannot explain which action worked.',
  'Troubleshooting depends on senior staff instead of a repeatable company method.',
  'Machine, Mold, Material and Method causes are confused or investigated randomly.',
  'Production, quality and tooling disagree because decisions are not supported by common evidence.',
  'Corrective actions are not validated documented or converted into prevention standards.',
] as const;

/** Five Business Outcomes. Unnumbered in the source. */
export const PROGRAM_D_BUSINESS_OUTCOMES = [
  'Lower scrap, rejection and rework by replacing temporary fixes with better-supported corrective actions.',
  'Faster production recovery through a structured investigation that reduces random trials.',
  'More consistent decisions across shifts using one shared troubleshooting language and method.',
  "Less dependence on a few senior employees by strengthening the engineering team's first-response capability.",
  'Stronger prevention and knowledge retention through validated actions, records and lessons learned.',
] as const;

/** Capability Change — before/after. */
export const PROGRAM_D_BEFORE_AFTER = [
  {
    before: 'Repeated parameter adjustments',
    after: 'Controlled evidence-led investigation',
  },
  {
    before: 'Defect name treated as the cause',
    after: 'Symptom, mechanism and cause separated',
  },
  {
    before: 'Knowledge depends on a few experts',
    after: 'Shared method across the technical team',
  },
] as const;

export const PROGRAM_D_BEFORE_AFTER_LABELS = {
  before: 'BEFORE TRAINING',
  after: 'AFTER TRAINING',
} as const;

export const PROGRAM_D_BEFORE_AFTER_HEADING = 'Capability Change';

/** Management Takeaway. */
export const PROGRAM_D_MANAGEMENT_TAKEAWAY = {
  heading: 'Management Takeaway',
  statement:
    'Turn defect troubleshooting from an individual skill into a shared, evidence-based engineering capability.',
} as const;

/** Five Capabilities. Unnumbered in source; numerals added for the card grid. */
export const PROGRAM_D_CAPABILITIES = [
  {
    number: '01',
    title: 'Identify the defect correctly.',
    description:
      'Differentiate similar-looking visual, dimensional and material defects before selecting an investigation path.',
  },
  {
    number: '02',
    title: 'Explain the physical mechanism.',
    description:
      'Connect the symptom with plastic temperature, flow, pressure, cooling and material behaviour.',
  },
  {
    number: '03',
    title: 'Analyse production evidence.',
    description:
      'Interpret defect pattern, cavity, frequency, process outputs and the last known good condition.',
  },
  {
    number: '04',
    title: 'Rank the 4M causes.',
    description:
      'Separate Machine, Mold, Material and Method hypotheses using relevant supporting evidence.',
  },
  {
    number: '05',
    title: 'Verify and communicate the solution.',
    description:
      'Document the reasoning, validate repeatability and recommend recurrence-prevention actions.',
  },
] as const;


/** "Why Essential" — four unnumbered statements. */
export const PROGRAM_D_WHY_ESSENTIAL = {
  heading: 'Why Essential',
  items: [
    'Similar-looking defects can have different mechanisms and require different investigations.',
    'A defect name is not a root cause so engineers must progress from observation to verified evidence.',
    'A setting change can hide the symptom without removing the condition that caused it.',
    'Machine setpoints do not prove what the plastic experienced so actual process outputs and part evidence matter.',
  ],
} as const;

/** 4M Framework. */
export const PROGRAM_D_FRAME_WORK = {
  heading: '4M Framework',
  items: [
    { title: 'MACHINE', description: 'Actual delivery' },
    { title: 'MOLD', description: 'Cavity condition' },
    { title: 'MATERIAL', description: 'Material behaviour' },
    { title: 'METHOD', description: 'Approved process' },
  ],
} as const;

/** Two-Day Journey. Source format: "DAY N | STAGE — description". */
export const PROGRAM_D_DAYS = {
  heading: 'Two-Day Journey',
  items: [
    {
      label: 'DAY 1',
      stage: 'DIAGNOSE CORRECTLY',
      summary:
        'Defect confirmation, physical mechanisms, process evidence and structured 4M analysis.',
    },
    {
      label: 'DAY 2',
      stage: 'VERIFY AND PREVENT',
      summary:
        'Case-study investigation, hypothesis evaluation, corrective action, validation and prevention.',
    },
  ],
} as const;

/** Defects Covered — three categories, each with a sentence list. */
export const PROGRAM_D_DEFECTS_COVERED = {
  heading: 'Defects Covered',
  categories: [
    {
      title: 'VISUAL',
      items:
        'Short shot, flash, burn marks, sink marks, jetting, gate blush, flow lines and weld lines.',
    },
    {
      title: 'DIMENSIONAL',
      items: 'Oversized or undersized parts, warpage and deformation.',
    },
    {
      title: 'MATERIAL',
      items:
        'Splay, bubbles, brittleness, cracking, contamination and inconsistent colour.',
    },
  ],
} as const;

/** Who Should Attend — one sentence in the source, comma-separated. */
export const PROGRAM_D_AUDIENCE = {
  heading: 'Who Should Attend',
  raw:
    'Process engineers, technicians, supervisors, quality personnel and engineering managers.',
  items: [
    'Process engineers',
    'technicians',
    'supervisors',
    'quality personnel',
    'engineering managers',
  ],
} as const;

/** Learning Format — one sentence in the source, comma-separated. */
export const PROGRAM_D_LEARNING_FORMAT = {
  heading: 'Learning Format',
  raw:
    'Prepared defect samples, production data, 4M worksheets and group case studies.',
  items: [
    'Prepared defect samples',
    'production data',
    '4M worksheets',
    'group case studies',
  ],
} as const;

/** Closing CTA. */
export const PROGRAM_D_CTA = {
  headline: 'BUILD A TEAM THAT SOLVES THE CAUSE — NOT ONLY THE SYMPTOM.',
  body:
    'Request an in-house proposal tailored to your recurring defects, materials and engineer experience levels.',
  programSlug: PROGRAM_D_HERO.id,
  /*
   * PDF-TYPO (name + punctuation): the source signs "Ts Mohd Hafiedzzul B
   * Malek Riduan" (no period after "Ts") and appends the bare words
   * "Freelance trainer" with no separator. Both preserved verbatim; the
   * trailing label is captured separately so a renderer can style it.
   */
  signoff: 'Ts Mohd Hafiedzzul B Malek Riduan',
  signoffTrailing: 'Freelance trainer',
  phone: '+6012-488 5247',
  phoneHref: 'tel:+60124885247',
  email: 'hafiedzzul@gmail.com',
  emailHref: 'mailto:hafiedzzul@gmail.com',
} as const;

/** Convenience bundle. */
export const PROGRAM_D = {
  id: PROGRAM_D_HERO.id,
  hero: PROGRAM_D_HERO,
  warningSigns: PROGRAM_D_WARNING_SIGNS,
  businessOutcomes: PROGRAM_D_BUSINESS_OUTCOMES,
  beforeAfter: PROGRAM_D_BEFORE_AFTER,
  beforeAfterLabels: PROGRAM_D_BEFORE_AFTER_LABELS,
  beforeAfterHeading: PROGRAM_D_BEFORE_AFTER_HEADING,
  managementTakeaway: PROGRAM_D_MANAGEMENT_TAKEAWAY,
  capabilities: PROGRAM_D_CAPABILITIES,
  whyEssential: PROGRAM_D_WHY_ESSENTIAL,
  frameWork: PROGRAM_D_FRAME_WORK,
  days: PROGRAM_D_DAYS,
  defectsCovered: PROGRAM_D_DEFECTS_COVERED,
  audience: PROGRAM_D_AUDIENCE,
  learningFormat: PROGRAM_D_LEARNING_FORMAT,
  cta: PROGRAM_D_CTA,
} as const;
