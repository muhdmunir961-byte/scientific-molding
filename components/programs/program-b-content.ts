/**
 * PROGRAM B — Processability of Thermoplastics in Injection Molding
 * Anchor: #materials | Badge: 2-Day | HRDC Claimable
 *
 * SOURCE OF TRUTH: the supplied PDF content, extracted verbatim.
 * Overrides PRD 5.3 where they conflict. PDF palette, black hero surface.
 * Typos preserved and flagged with PDF-TYPO.
 */

export const PROGRAM_B_HERO = {
  id: 'materials',
  badge: '2-Day',
  badgeSecondary: 'HRDC Claimable',

  eyebrow: 'A TWO-DAY TRAINING - HRDC Claimable',
  title: 'PROCESSABILITY OF THERMOPLASTICS IN INJECTION MOLDING.',
  tagline: 'UNDERSTAND THE MATERIAL & CONTROL THE RESULTS.',
  subcopy:
    'Develop engineers who explain resin behaviour, material condition and production variation before recommending evidence-based scientific molding decisions.',
} as const;

/** Six Production Problems. Source format: "NN TITLE — description". */
export const PROGRAM_B_PROBLEMS = [
  {
    number: '01',
    title: 'COPIED SETTINGS',
    description:
      'Different resin grades are treated as if they behave identically.',
  },
  {
    number: '02',
    title: 'RECURRING DEFECTS',
    description:
      'Temporary adjustments hide the actual material-related mechanism.',
  },
  {
    number: '03',
    title: 'MOISTURE UNCERTAINTY',
    description:
      'Drying condition and moisture sensitivity are poorly understood.',
  },
  {
    number: '04',
    title: 'LOT-TO-LOT VARIATION',
    description:
      'Material documents and batch differences are not investigated.',
  },
  {
    number: '05',
    title: 'EXCESSIVE CYCLE TIME',
    description:
      'Cooling and material response are judged by habit, not evidence.',
  },
  {
    number: '06',
    title: 'EXPERT DEPENDENCY',
    description:
      'Critical technical decisions depend on a few experienced people.',
  },
] as const;

/**
 * Five Benefits. Source format:
 * "NN TITLE (CATEGORY) — description" — the parenthetical is part of the
 * source layout, so it is kept as its own field rather than merged in.
 */
export const PROGRAM_B_BENEFITS = [
  {
    number: '01',
    title: 'LOWER SCRAP & REWORK',
    category: 'QUALITY COST',
    description:
      'Address preventable variation and protect the cost of quality.',
  },
  {
    number: '02',
    title: 'FASTER PROBLEM RESOLUTION',
    category: 'RECOVERY TIME',
    description:
      'Use material evidence to identify likely causes more quickly.',
  },
  {
    number: '03',
    title: 'MORE CONSISTENT OUTPUT',
    category: 'CONSISTENCY',
    description:
      'Improve alignment across resin lots, production shifts and teams.',
  },
  {
    number: '04',
    title: 'BETTER PRODUCTIVITY DECISIONS',
    category: 'PRODUCTIVITY',
    description:
      'Evaluate cycle and cooling assumptions with technical reasoning.',
  },
  {
    number: '05',
    title: 'STRONGER IN-HOUSE CAPABILITY',
    category: 'KNOW-HOW',
    description:
      'Reduce dependency on individual experts and retain knowledge.',
  },
] as const;

/** Before / After. Column headers are part of the source text. */
export const PROGRAM_B_BEFORE_AFTER = [
  {
    before: 'Copied recipes and unexplained parameter changes',
    after: 'Resin behaviour and material condition understood',
  },
  {
    before: 'Material variation mistaken for machine instability',
    after: 'Process intent explained, verified and documented',
  },
] as const;

export const PROGRAM_B_BEFORE_AFTER_LABELS = {
  before: 'BEFORE: REACTIVE PROCESS DECISIONS',
  after: 'AFTER: MATERIAL-AWARE ENGINEERING',
} as const;

/** Management Takeaway. */
export const PROGRAM_B_MANAGEMENT_TAKEAWAY = {
  heading: 'Management Takeaway',
  statement:
    'BETTER MATERIAL UNDERSTANDING CREATES BETTER DECISIONS. Review outcomes through scrap, rework, investigation time, lot variation, cycle stability and knowledge transfer.',
} as const;

/** Five Capabilities. */
export const PROGRAM_B_CAPABILITIES = [
  {
    number: '01',
    title: 'PREDICT HOW DIFFERENT THERMOPLASTICS BEHAVE',
    description:
      'Relate polymer family and structure to flow behaviour, thermal sensitivity, shrinkage and cooling response.',
  },
  {
    number: '02',
    title: 'DEFINE A MATERIAL-BASED INITIAL PROCESS WINDOW',
    description:
      'Use material identity, supplier information and resin behaviour to explain an evidence-based processing intent.',
  },
  {
    number: '03',
    title: 'TROUBLESHOOT MATERIAL-SENSITIVE DEFECTS SCIENTIFICALLY',
    description:
      'Connect recurring symptoms with plausible moisture, thermal-history, resin or wider 4M mechanisms.',
  },
  {
    number: '04',
    title: 'RECOGNISE DRYING AND MOISTURE RISK',
    description:
      'Distinguish hygroscopic and non-hygroscopic materials and understand why material condition matters.',
  },
  {
    number: '05',
    title: 'TURN TDS, COA AND SDS INTO ENGINEERING EVIDENCE',
    description:
      'Interpret document purpose, material recommendations and lot information before technical conclusions.',
  },
] as const;

/** Scientific Molding Framework — 5 numbered steps, plus a closing note. */
export const PROGRAM_B_FRAMEWORK = {
  heading: 'Scientific Molding Framework',
  steps: [
    {
      number: '01',
      title: 'MATERIAL IDENTITY',
      description: 'Grade, lot and condition',
    },
    {
      number: '02',
      title: 'MATERIAL BEHAVIOUR',
      description: 'Flow, thermal response, shrinkage',
    },
    {
      number: '03',
      title: 'FOUR PLASTIC CONDITIONS',
      description: 'Temperature | Flow | Pressure | Cooling',
    },
    {
      number: '04',
      title: 'PROCESS CONTROL',
      description: 'Method, mold and machine interaction',
    },
    {
      number: '05',
      title: 'VERIFIED WINDOW',
      description: 'Evidence and acceptable quality',
    },
  ],
  note:
    'Machine settings are control inputs, not proof. The materials perspective checks the interaction of Material, Method, Mold and Machine.',
} as const;

/**
 * "Four Modules. Four Problems."
 * Source layout: "NN TITLE — Problem: … Outcome: …"
 */
export const PROGRAM_B_MODULES = [
  {
    number: '01',
    title: 'MATERIAL CLASSIFICATION',
    problem: 'Different polymers are treated the same.',
    outcome:
      'Explain polymer structure, flow, thermal response and shrinkage.',
  },
  {
    number: '02',
    title: 'PROPERTIES & PROCESS CORRELATIONS',
    problem: 'Production decisions are based on copied assumptions.',
    outcome: 'Connect material behaviour with the four plastic conditions.',
  },
  {
    number: '03',
    title: 'DRYING & MOISTURE MANAGEMENT',
    problem: 'Moisture-sensitive symptoms keep returning.',
    outcome:
      'Understand resin sensitivity and material-condition risks.',
  },
  {
    number: '04',
    title: 'TDS, SDS & COA INTERPRETATION',
    problem: 'Supplier and batch information is overlooked.',
    outcome: 'Use material documents as evidence in technical decisions.',
  },
] as const;

/** Four Plastic Conditions. */
export const PROGRAM_B_PLASTIC_CONDITIONS = {
  heading: 'Four Plastic Conditions',
  items: [
    { title: 'TEMPERATURE', description: 'Thermal behaviour and stability' },
    { title: 'FLOW', description: 'Material response during filling' },
    { title: 'PRESSURE', description: 'How process demand is understood' },
    { title: 'COOLING', description: 'Shrinkage and dimensional response' },
  ],
} as const;

/**
 * Four Core Modules (from wP).
 * The source marks this set "(from wP)" — kept in the heading so the
 * provenance is not lost.
 */
export const PROGRAM_B_CORE_MODULES = {
  heading: 'Four Core Modules',
  provenance: 'from wP',
  items: [
    {
      title: 'READ THE RESIN BEFORE SETTING THE MACHINE',
      problem:
        'Different thermoplastics are processed using the same assumptions.',
      outcome:
        'Connect material family, molecular structure, flow behaviour, shrinkage and cooling response.',
    },
    {
      title: 'TRANSLATE MATERIAL BEHAVIOUR INTO PROCESS INTENT',
      problem: 'Decisions rely on copied settings instead of material evidence.',
      outcome:
        'Relate rheology and thermal behaviour to temperature, flow, pressure and cooling.',
    },
    {
      title: 'UNDERSTAND MOISTURE AND THERMAL HISTORY',
      problem:
        'Material-sensitive defects and degradation are misunderstood.',
      outcome:
        'Recognise drying-related risks and distinguish material mechanisms from other 4M causes.',
    },
    {
      title: 'USE MATERIAL DOCUMENTS FOR THE RIGHT DECISIONS',
      problem:
        'TDS, COA and SDS information is collected but not applied correctly.',
      outcome:
        'Interpret material identity, recommended ranges, lot variation and document purpose.',
    },
  ],
} as const;

/** "Take Back" — three items. */
export const PROGRAM_B_TAKE_BACK = [
  {
    title: 'MATERIAL DECISION MAP',
    description:
      'A structured connection between resin behaviour and process intent.',
  },
  {
    title: 'EVIDENCE REVIEW',
    description:
      'A clearer approach to TDS, COA and material-sensitive variation.',
  },
  {
    title: 'SHARED TEAM LANGUAGE',
    description:
      'Consistent communication across production, quality and engineering.',
  },
] as const;

/** Learning approach tags. Pipe-separated in the source. */
export const PROGRAM_B_LEARNING_APPROACH = {
  heading: 'Learning Approach',
  items: [
    'Guided discussion',
    'Prepared defect case studies',
    'Material-data interpretation',
    'Cross-functional 4M thinking',
  ],
} as const;

/** Who Should Attend. Pipe-separated in the source. */
export const PROGRAM_B_AUDIENCE = {
  heading: 'Who Should Attend',
  items: [
    'Process engineers and technicians',
    'QA/QC personnel',
    'Production supervisors',
    'Material handlers',
    'Setup technicians',
    'Technical managers',
  ],
} as const;

/** Closing CTA. */
export const PROGRAM_B_CTA = {
  headline: 'REQUEST YOUR TWO-DAY IN-HOUSE TRAINING PROPOSAL',
  body:
    'Build a material-aware engineering team with stronger evidence-based decisions.',
  programSlug: PROGRAM_B_HERO.id,
  phone: '012-488 5247',
  phoneHref: 'tel:+60124885247',
  email: 'hafiedzzul@gmail.com',
  emailHref: 'mailto:hafiedzzul@gmail.com',
  linkedin: 'linkedin.com/in/hafiedzzul',
  linkedinHref: 'https://linkedin.com/in/hafiedzzul',
} as const;

/** Convenience bundle. */
export const PROGRAM_B = {
  id: PROGRAM_B_HERO.id,
  hero: PROGRAM_B_HERO,
  problems: PROGRAM_B_PROBLEMS,
  benefits: PROGRAM_B_BENEFITS,
  beforeAfter: PROGRAM_B_BEFORE_AFTER,
  beforeAfterLabels: PROGRAM_B_BEFORE_AFTER_LABELS,
  managementTakeaway: PROGRAM_B_MANAGEMENT_TAKEAWAY,
  capabilities: PROGRAM_B_CAPABILITIES,
  framework: PROGRAM_B_FRAMEWORK,
  modules: PROGRAM_B_MODULES,
  plasticConditions: PROGRAM_B_PLASTIC_CONDITIONS,
  coreModules: PROGRAM_B_CORE_MODULES,
  takeBack: PROGRAM_B_TAKE_BACK,
  learningApproach: PROGRAM_B_LEARNING_APPROACH,
  audience: PROGRAM_B_AUDIENCE,
  cta: PROGRAM_B_CTA,
} as const;
