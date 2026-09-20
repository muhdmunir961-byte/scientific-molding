/**
 * PROGRAM A — Scientific Moulding Fundamentals
 * Anchor: #fundamentals | Badge: 2-Day | HRDC Claimable
 *
 * ════════════════════════════════════════════════════════════════════
 *  SOURCE OF TRUTH: the supplied PDF content, extracted verbatim.
 *
 *  This file OVERRIDES PRD Section 5.3 for Program A. Where the PDF and
 *  the PRD conflict, THE PDF WINS — including the black hero surface,
 *  which contradicts PRD 13.1's "no dark/black sections".
 *
 *  Colour overrides (PDF palette, supersedes PRD 13.1):
 *    Orange       #E8631C
 *    Orange dark  #D9541C
 *    Dark surface #1A1A1A
 *    White        #FFFFFF
 *    Charcoal     #2A2A2A
 *    Warm grey    #6B6B63
 *
 *  Typography: extracted byte-for-byte. Cases, dashes, pipes and spacing
 *  are as supplied. Any typo in the source is preserved and flagged.
 * ════════════════════════════════════════════════════════════════════
 */

/** Program identity and hero block. */
export const PROGRAM_A_HERO = {
  id: 'fundamentals',
  badge: '2-Day',
  badgeSecondary: 'HRDC Claimable',

  /*
   * PDF-TYPO (grammar): "Build Engineers Who understand The Process."
   * Mid-sentence capitals on "understand" and "The". Preserved verbatim
   * because the PDF is the source of truth.
   */
  eyebrow:
    'Move from memorized settings to scientific material-and-process thinking',
  title: 'SCIENTIFIC MOULDING FUNDAMENTALS.',
  tagline: 'Build Engineers Who understand The Process.',
  subcopy:
    'A two-day foundation linking material, mould, machine and process to safer, clearer and more consistent workplace performance.',
} as const;

/** Six Problems — "Problems We Solve". */
export const PROGRAM_A_PROBLEMS = [
  {
    title: 'Slow, inconsistent onboarding',
    description:
      'new engineers learn isolated tasks without the complete process.',
  },
  {
    title: 'Memorised machine settings',
    description: 'numbers are repeated without understanding the plastic.',
  },
  {
    title: 'Trial-and-error assumptions',
    description: 'production concerns are interpreted without evidence.',
  },
  {
    title: 'Weak defect awareness',
    description: 'symptoms, mechanisms and possible causes are confused.',
  },
  {
    title: 'Unclear technical communication',
    description: 'production, quality and tooling lack a shared language.',
  },
  {
    title: 'Dependence on senior engineers',
    description: 'the same fundamentals must be explained repeatedly.',
  },
] as const;

/** Five Measurable Benefits. */
export const PROGRAM_A_BENEFITS = [
  {
    number: '01',
    title: 'Faster technical onboarding',
    description:
      'Establish one consistent foundation for every new engineer.',
  },
  {
    number: '02',
    title: 'Fewer trial-and-error behaviours',
    description:
      'Replace unsupported assumptions with structured observation.',
  },
  {
    number: '03',
    title: 'Stronger quality awareness',
    description:
      'Improve recognition and communication of part abnormalities.',
  },
  {
    number: '04',
    title: 'Clearer cross-functional teamwork',
    description: 'Align engineering, production, quality and tooling.',
  },
  {
    number: '05',
    title: 'Sustainable engineering capability',
    description: 'Prepare the workforce for future scientific development.',
  },
] as const;

/**
 * Before / After comparison.
 *
 * PDF-TYPO (word choice): "Memories machine settings" — presumably
 * "Memorised". Preserved verbatim.
 */
export const PROGRAM_A_BEFORE_AFTER = [
  {
    before: 'Memories machine settings',
    after: 'Understands material and process behaviour',
  },
  {
    before: 'Reports a vague production problem',
    after: 'Describes observations and relevant evidence',
  },
  {
    before: 'Depends heavily on senior staff',
    after: 'Uses a shared framework and escalates correctly',
  },
] as const;

export const PROGRAM_A_BEFORE_AFTER_LABELS = {
  before: 'BEFORE',
  after: 'AFTER',
} as const;

/** "Why Foundation Matters" statement. */
export const PROGRAM_A_WHY_MATTERS = {
  heading: 'Why Foundation Matters',
  statement:
    'A DEFECT IS A SYMPTOM — NOT AUTOMATIC PROOF OF ITS ROOT CAUSE. Fundamentals help engineers observe accurately, communicate clearly and avoid unsupported assumptions.',
} as const;

/** Five Outcomes for New Engineers. */
export const PROGRAM_A_OUTCOMES = [
  {
    number: '01',
    title: 'Understand the complete moulding system',
    description: 'Connect material, mould, machine and process.',
  },
  {
    number: '02',
    title: 'Interpret the four plastic conditions',
    description: 'Explain temperature, flow, pressure and cooling.',
  },
  {
    number: '03',
    title: 'Recognise cause-and-effect',
    description:
      'Separate observations, physical mechanisms and possible causes.',
  },
  {
    number: '04',
    title: 'Communicate and escalate with evidence',
    description: 'Use accurate terminology and approved standards.',
  },
  {
    number: '05',
    title: 'Prepare for advanced technical growth',
    description: 'Build readiness for supervised scientific development.',
  },
] as const;

/** Philosophy block — three lines, kept in order. */
export const PROGRAM_A_PHILOSOPHY = {
  heading: 'Philosophy',
  lines: [
    'MATERIAL + MOULD + MACHINE + PROCESS',
    'TEMPERATURE | FLOW | PRESSURE | COOLING',
    'Observe the evidence. Understand the material. Connect the cause-and-effect.',
  ],
} as const;

/** Four Connected Learning Foundations — table rows. */
export const PROGRAM_A_FOUNDATIONS = [
  {
    number: '01',
    foundation: 'MATERIAL',
    understand:
      'Thermoplastic behaviour, moisture awareness, viscosity and thermal response.',
    workplaceValue: 'Understand what the plastic requires.',
  },
  {
    number: '02',
    foundation: 'MOULD',
    understand:
      'Cavity, core, runner, gate, cooling, venting and ejection functions.',
    workplaceValue: 'Recognise how tooling shapes part quality.',
  },
  {
    number: '03',
    foundation: 'MACHINE',
    understand:
      'Main components, general functions, process delivery and safety boundaries.',
    workplaceValue: 'Connect equipment capability with the process.',
  },
  {
    number: '04',
    foundation: 'PROCESS',
    understand:
      'Filling, packing, cooling, plasticising and observable quality evidence.',
    workplaceValue: 'Explain basic cause-and-effect across the cycle.',
  },
] as const;

export const PROGRAM_A_FOUNDATIONS_COLUMNS = {
  number: '#',
  foundation: 'FOUNDATION',
  understand: 'UNDERSTAND',
  workplaceValue: 'WORKPLACE VALUE',
} as const;

/** Two-Day Journey. */
export const PROGRAM_A_DAYS = [
  {
    label: 'DAY 1',
    summary:
      'Material behavior, the four plastic conditions and machine-function awareness.',
  },
  {
    label: 'DAY 2',
    summary:
      'Mould functions, process-stage understanding and evidence-based communication.',
  },
] as const;

/** Learning format tags. Pipe-separated in the source. */
export const PROGRAM_A_LEARNING_FORMAT = {
  heading: 'Learning Format',
  items: [
    'Guided discussions',
    'Prepared samples',
    'Process diagrams',
    'Case studies',
    'Participant worksheets',
  ],
} as const;

/** Closing CTA. */
export const PROGRAM_A_CTA = {
  headline: 'BUILD A STRONGER ENGINEERING FOUNDATION',
  body:
    'Request a customized in-house training proposal for your engineering team.',
  programSlug: PROGRAM_A_HERO.id,
  phone: '+60 12-488 5247',
  phoneHref: 'tel:+60124885247',
  email: 'hafiedzzul@gmail.com',
  emailHref: 'mailto:hafiedzzul@gmail.com',
} as const;

/**
 * Convenience bundle. The named exports above remain the primary API, so a
 * consumer can import either the whole program or a single section.
 */
export const PROGRAM_A = {
  id: PROGRAM_A_HERO.id,
  hero: PROGRAM_A_HERO,
  problems: PROGRAM_A_PROBLEMS,
  benefits: PROGRAM_A_BENEFITS,
  beforeAfter: PROGRAM_A_BEFORE_AFTER,
  beforeAfterLabels: PROGRAM_A_BEFORE_AFTER_LABELS,
  whyMatters: PROGRAM_A_WHY_MATTERS,
  outcomes: PROGRAM_A_OUTCOMES,
  philosophy: PROGRAM_A_PHILOSOPHY,
  foundations: PROGRAM_A_FOUNDATIONS,
  foundationsColumns: PROGRAM_A_FOUNDATIONS_COLUMNS,
  days: PROGRAM_A_DAYS,
  learningFormat: PROGRAM_A_LEARNING_FORMAT,
  cta: PROGRAM_A_CTA,
} as const;
