/**
 * PROGRAM M5 — Systematic Parameter Setting for Injection Molding.
 * Source: trainer-supplied and approved content; see docs/m3-m5-review.md.
 */

export const PROGRAM_M5_HERO = {
  id: 'm5-parameter-setting',
  badge: '2-Day',
  badgeSecondary: 'HRDC Claimable',
  eyebrow: 'Introduce a consistent framework for parameter-setting decisions',
  title: 'SYSTEMATIC PARAMETER SETTING FOR INJECTION MOLDING',
  subcopy:
    'A two-day bridge from personal habit to shared engineering capability, using plastic conditions, evidence and controlled decisions.',
} as const;

export const PROGRAM_M5_PROBLEMS = [
  { title: 'Settings differ by person', description: 'the same mould is set up differently on every shift.' },
  { title: 'Changes without a reason', description: 'parameters are changed with no stated intent.' },
  { title: 'Several changes at once', description: 'the team cannot tell which action worked.' },
  { title: 'No agreed order of decisions', description: 'setting discussions jump randomly between parameters.' },
  { title: 'Copied setups', description: 'values from a similar job are reused without checking the conditions.' },
  { title: 'Reasoning not recorded', description: 'the next person inherits numbers but not the logic.' },
] as const;

export const PROGRAM_M5_BENEFITS = [
  { number: '01', title: 'More consistent setups', category: 'Consistency', description: 'one method across shifts and personnel.' },
  { number: '02', title: 'Clearer setting discussions', category: 'Communication', description: 'production, quality and engineering use the same logic.' },
  { number: '03', title: 'Fewer unexplained changes', category: 'Control', description: 'every change has an intent and a recorded response.' },
  { number: '04', title: 'Better setup records', category: 'Documentation', description: 'decisions can be followed and reviewed.' },
  { number: '05', title: 'Less dependence on individuals', category: 'Know-how', description: 'the method belongs to the team, not one person.' },
] as const;

export const PROGRAM_M5_BEFORE_AFTER = [
  { before: 'Change several parameters and hope', after: 'Change one thing at a time with a stated intent' },
  { before: 'Copy the last setup', after: 'Decide settings from plastic conditions and evidence' },
  { before: 'Numbers handed over without reasons', after: 'Rationale recorded for the next person' },
] as const;

export const PROGRAM_M5_BEFORE_AFTER_LABELS = { before: 'BEFORE', after: 'AFTER' } as const;

export const PROGRAM_M5_OUTCOMES = [
  { number: '01', title: 'Explain the logic of each major parameter group in terms of the four plastic conditions.', description: 'Connect each group to Temperature, Flow, Pressure and Cooling.' },
  { number: '02', title: 'Follow a structured method for deciding and ordering settings.', description: 'Use an agreed sequence rather than personal habit.' },
  { number: '03', title: 'Justify a parameter decision with evidence and a clear intent.', description: 'State why a change is being considered.' },
  { number: '04', title: 'Apply controlled changes and record the process response.', description: 'Change one thing at a time and document what happened.' },
  { number: '05', title: 'Communicate and document setting decisions so others can follow them.', description: 'Make the reasoning available to the wider team.' },
] as const;

export const PROGRAM_M5_PHILOSOPHY = {
  heading: 'Philosophy',
  lines: [
    'MATERIAL + MOULD + MACHINE + PROCESS',
    'TEMPERATURE | FLOW | PRESSURE | COOLING',
    'Observe the evidence. Understand the material. Connect the cause-and-effect.',
  ],
} as const;

export const PROGRAM_M5_DAYS = [
  { label: 'DAY 1', stage: 'Parameter logic', summary: 'Settings as inputs, not proof; linking parameters to Temperature, Flow, Pressure and Cooling; parameter groups; why a structured sequence matters.' },
  { label: 'DAY 2', stage: 'Structured method in practice', summary: 'A step-by-step decision framework on prepared case studies; change control; recording the rationale; group review of settings and consistency across shifts.' },
] as const;

export const PROGRAM_M5_LEARNING_FORMAT = {
  heading: 'Learning Format',
  items: ['Guided discussions', 'Prepared case studies', 'Decision worksheets', 'Process diagrams', 'Group review'],
} as const;

export const PROGRAM_M5_AUDIENCE = {
  heading: 'Who Should Attend',
  items: ['Process engineers and technicians', 'Setup technicians', 'Production supervisors', 'Technical managers'],
  prerequisite: 'Recommended after M3.',
} as const;

export const PROGRAM_M5_CTA = {
  headline: 'SET A PROCESS THE SAME WAY EVERY TIME',
  body: 'Request a customised in-house training proposal for your engineering team.',
  programSlug: PROGRAM_M5_HERO.id,
} as const;

export const PROGRAM_M5_SAFETY =
  'Training uses prepared case studies, process data and authorised observations. Equipment operation, process changes and mold service are restricted to qualified, authorised personnel.' as const;
