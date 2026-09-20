/**
 * PROGRAM C — Scientific Moulding Process Development
 * Anchor: #process-development | Badge: 4-Day
 *
 * SOURCE OF TRUTH: the supplied PDF content, extracted verbatim.
 * Overrides PRD 5.3 where they conflict. PDF palette, black hero surface.
 */

export const PROGRAM_C_HERO = {
  id: 'process-development',
  badge: '4-Day',

  eyebrow: 'FOUR-DAY PROFESSIONAL TRAINING FOR ENGINEERING TEAMS',
  title: 'SCIENTIFIC MOULDING PROCESS DEVELOPMENT',
  tagline: 'STOP GUESSING. START DEVELOPING WITH EVIDENCE.',
  subcopy:
    'Develop engineers who can evaluate process evidence, explain variation and support more stable, repeatable injection-moulding production.',
} as const;

/**
 * Six Problems.
 * Source format: "TITLE — description" with no leading number, unlike
 * Programs A and B. Preserved as given.
 */
export const PROGRAM_C_PROBLEMS = [
  {
    title: 'REPEATED GUESSWORK',
    description:
      'Settings are changed without understanding the actual process response.',
  },
  {
    title: 'RECURRING DEFECTS',
    description:
      'Scrap and rework continue when symptoms receive only temporary fixes.',
  },
  {
    title: 'SHIFT-TO-SHIFT VARIATIONS',
    description:
      'Different personnel obtain different results from the same mould.',
  },
  {
    title: 'SLOW PROCESS START-UP',
    description:
      'Unstructured development prolongs start-up and recovery time.',
  },
  {
    title: 'UNCLEAR PROCESS EVIDENCE',
    description:
      'Machine settings are recorded, but actual outputs are not understood.',
  },
  {
    title: 'KEY-PERSON DEPENDENCY',
    description:
      'Critical process knowledge stays with one experienced individual.',
  },
] as const;

/**
 * Five Business Benefits.
 * The source numbers these as a plain list ("1." … "5.") rather than the
 * zero-padded form used elsewhere. Kept as given; the renderer supplies its
 * own numerals so the display stays consistent with the other programs.
 */
export const PROGRAM_C_BENEFITS = [
  {
    title: 'REDUCE AVOIDABLE QUALITY LOSSES',
    description:
      'Improve understanding of recurring defects, scrap, rework and process variation.',
  },
  {
    title: 'ESTABLISH PROCESSES MORE EFFICIENTLY',
    description:
      'Replace repeated trial-and-error with an organised, evidence-based development approach.',
  },
  {
    title: 'STRENGTHEN PRODUCTION REPEATABILITY',
    description:
      'Improve communication and process consistency across shifts, personnel and production runs.',
  },
  {
    title: 'PROTECT AND TRANSFER ENGINEERING KNOWLEDGE',
    description:
      'Document approved process information and reduce reliance on a few experienced individuals.',
  },
  {
    title: 'BUILD MORE DEFENSIBLE TECHNICAL DECISIONS',
    description:
      'Use machine, material and mould evidence to explain decisions to management and customers.',
  },
] as const;

/** Organisational Transformation — before/after with header text in the labels. */
export const PROGRAM_C_BEFORE_AFTER = [
  {
    before: 'Adjust settings until parts appear acceptable.',
    after: 'Evaluate evidence and explain process behaviour.',
  },
  {
    before: 'Troubleshoot recurring symptoms repeatedly.',
    after: 'Investigate mechanisms and relevant 4M evidence.',
  },
  {
    before: 'Keep process knowledge with selected individuals.',
    after: 'Document approved conditions for wider team use.',
  },
] as const;

export const PROGRAM_C_BEFORE_AFTER_LABELS = {
  before: 'BEFORE / REACTIVE PRODUCTION',
  after: 'AFTER / SCIENTIFIC CAPABILITY',
} as const;

export const PROGRAM_C_BEFORE_AFTER_HEADING = 'Organisational Transformation';

/** Five Outcomes. Numbered plainly in the source ("1." … "5."). */
export const PROGRAM_C_OUTCOMES = [
  {
    title: 'APPLY A STRUCTURED DEVELOPMENT METHOD',
    description:
      'Evaluate readiness, process behavior, repeatability and approved documentation systematically.',
  },
  {
    title: 'UNDERSTAND THE FOUR PLASTIC CONDITIONS',
    description:
      'Connect temperature, flow, pressure and cooling with what the plastic actually experiences.',
  },
  {
    title: 'INTERPRET MEASURABLE PROCESS EVIDENCE',
    description:
      'Review fill time, pressure response, cushion, part weight and cavity-to-cavity variation.',
  },
  {
    title: 'INVESTIGATE DEFECTS BEYOND THE SYMPTOM',
    description:
      'Distinguish the defect, physical mechanism and possible material, mould, machine or method causes.',
  },
  {
    title: 'DOCUMENT AND EXPLAIN TECHNICAL DECISIONS',
    description:
      'Communicate approved process information clearly across engineering, production and quality.',
  },
] as const;

/** Philosophy — statement plus four named conditions. */
export const PROGRAM_C_PHILOSOPHY = {
  heading: 'Philosophy',
  statement:
    'Understand what the plastic experiences. Evaluate actual process outputs. Verify conclusions with evidence.',
  items: [
    { title: 'TEMPERATURE', description: 'Material and thermal condition' },
    { title: 'FLOW', description: 'Filling and material movement' },
    { title: 'PRESSURE', description: 'Filling and packing response' },
    { title: 'COOLING', description: 'Heat removal and consistency' },
  ],
} as const;

/** Three Perspectives. */
export const PROGRAM_C_PERSPECTIVES = {
  heading: 'Three Perspectives',
  items: [
    {
      title: 'MACHINE',
      description: 'Actual delivery and speed-linearity evidence.',
    },
    {
      title: 'MATERIAL',
      description: 'Flow behaviour and rheology evidence.',
    },
    {
      title: 'MOULD',
      description: 'Cavity balance, filling response and variation.',
    },
  ],
} as const;

/**
 * Four Day Journey.
 * Source format: "DAY N: STAGE NAME — description". The stage name is part of
 * the PDF's progression marker (Understand → Develop → Evaluate → Sustain),
 * so it is captured separately from the day label.
 */
export const PROGRAM_C_DAYS = {
  heading: 'Four Day Journey',
  items: [
    {
      label: 'DAY 1',
      stage: 'UNDERSTAND',
      summary:
        'Scientific foundations, four plastic conditions and process inputs versus actual outputs.',
    },
    {
      label: 'DAY 2',
      stage: 'DEVELOP',
      summary:
        'Structured process-development logic, filling versus packing and repeatability indicators.',
    },
    {
      label: 'DAY 3',
      stage: 'EVALUATE',
      summary:
        'Machine linearity, material rheology, cavity balance and gate-freeze evidence.',
    },
    {
      label: 'DAY 4',
      stage: 'SUSTAIN',
      summary:
        '4M root-cause thinking, approved process documentation and technical communication.',
    },
  ],
} as const;

/**
 * Take Back — two items.
 * The source gives each as "TITLE — sentence. Sentence." so the description
 * holds two sentences; kept together rather than split arbitrarily.
 */
export const PROGRAM_C_TAKE_BACK = [
  {
    title: 'PROCESS-EVIDENCE CAPABILITY',
    description:
      'Interpret prepared scientific-study findings. Explain process variation with evidence.',
  },
  {
    title: 'TEAM AND DOCUMENTATION CAPABILITY',
    description:
      'Communicate findings across technical teams. Organise approved process information.',
  },
] as const;

/** Who Should Attend. Pipe-separated in the source. */
export const PROGRAM_C_AUDIENCE = {
  heading: 'Who Should Attend',
  items: [
    'Process engineers',
    'Engineering managers',
    'Production supervisors',
    'Quality engineers',
    'Technical specialists',
  ],
} as const;

/** Closing CTA. */
export const PROGRAM_C_CTA = {
  headline: 'READY TO BUILD A STRONGER PROCESS-ENGINEERING TEAM?',
  body: 'REQUEST THE FOUR-DAY TRAINING PROPOSAL',
  programSlug: PROGRAM_C_HERO.id,
  /*
   * PDF-TYPO (name order): the source signs this as
   * "Ts. Hafiedzzul B. Malek Riduan", while Program D signs
   * "Ts Mohd Hafiedzzul B Malek Riduan" and the trainer block gives the full
   * legal form "Ts. Mohd Hafiedzzul Bin Malek Riduan". Preserved verbatim.
   */
  signoff: 'Ts. Hafiedzzul B. Malek Riduan',
  phone: '+6012-4885247',
  phoneHref: 'tel:+60124885247',
  email: 'hafiedzzul@gmail.com',
  emailHref: 'mailto:hafiedzzul@gmail.com',
} as const;

/** Convenience bundle. */
export const PROGRAM_C = {
  id: PROGRAM_C_HERO.id,
  hero: PROGRAM_C_HERO,
  problems: PROGRAM_C_PROBLEMS,
  benefits: PROGRAM_C_BENEFITS,
  beforeAfter: PROGRAM_C_BEFORE_AFTER,
  beforeAfterLabels: PROGRAM_C_BEFORE_AFTER_LABELS,
  beforeAfterHeading: PROGRAM_C_BEFORE_AFTER_HEADING,
  outcomes: PROGRAM_C_OUTCOMES,
  philosophy: PROGRAM_C_PHILOSOPHY,
  perspectives: PROGRAM_C_PERSPECTIVES,
  days: PROGRAM_C_DAYS,
  takeBack: PROGRAM_C_TAKE_BACK,
  audience: PROGRAM_C_AUDIENCE,
  cta: PROGRAM_C_CTA,
} as const;

