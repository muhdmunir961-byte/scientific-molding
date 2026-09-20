/**
 * §5.4 — Why Scientific Molding (cross-cutting summary).
 *
 * Aggregates the recurring problem themes across the five program PDFs into one
 * Before vs After statement, for a visitor who will not read every program
 * section.
 *
 * ── Source ──────────────────────────────────────────────────────────
 * Copy supplied verbatim in the task spec. It is an aggregation of themes that
 * already appear in the program PDFs, not new claims:
 *
 *   Copied settings       → Program B "COPIED SETTINGS"
 *                           Program C "REPEATED GUESSWORK"
 *   Recurring defects     → Program B "RECURRING DEFECTS"
 *                           Program C "RECURRING DEFECTS"
 *   Key-person dependency → Program B "EXPERT DEPENDENCY"
 *                           Program C "KEY-PERSON DEPENDENCY"
 *   Unclear evidence      → Program C "UNCLEAR PROCESS EVIDENCE"
 *
 * ── Why four, not six ───────────────────────────────────────────────
 * The programs list six problems each. This section distils them to the four
 * themes that recur across more than one program — the ones a manager scanning
 * the page will recognise as their own. Adding the program-specific items back
 * would defeat the purpose of a summary.
 */

/** Section identity. */
export const WHY_ID = 'why' as const;

/** Hero statement. */
export const WHY_HERO = {
  eyebrow: 'WHY SCIENTIFIC MOULDING',
  title: 'Before vs After — the capability gap.',
  subcopy:
    'Four recurring problems we see across Malaysian injection moulding operations. Four shifts that scientific thinking delivers.',
} as const;

/**
 * The four recurring problems — the "Before" column.
 *
 * `icon` names a Lucide component resolved in the renderer through an explicit
 * map, so the bundler can tree-shake rather than pulling all of lucide-react.
 */
export const WHY_PROBLEMS = [
  {
    number: '01',
    icon: 'trending-down',
    title: 'Copied settings',
    description:
      'Numbers are repeated without understanding the plastic. Different resin grades treated as if they behave identically.',
  },
  {
    number: '02',
    icon: 'alert-circle',
    title: 'Recurring defects',
    description:
      'Temporary adjustments hide the actual mechanism. Same defect returns after a setting change.',
  },
  {
    number: '03',
    icon: 'alert-circle',
    title: 'Key-person dependency',
    description:
      'Critical decisions depend on a few senior experts. Knowledge stays with individuals, not the team.',
  },
  {
    number: '04',
    icon: 'alert-circle',
    title: 'Unclear process evidence',
    description:
      'Machine settings are recorded, but actual outputs are not understood. Decisions rely on habit, not evidence.',
  },
] as const;

/** The four shifts — the "After" column. */
export const WHY_SHIFTS = [
  {
    number: '01',
    icon: 'trending-up',
    title: 'Material-aware process intent',
    description:
      'Understand what the plastic requires, then set the machine.',
  },
  {
    number: '02',
    icon: 'check-circle',
    title: 'Evidence-led investigation',
    description:
      'Symptom, mechanism and cause separated. Corrective actions validated and documented.',
  },
  {
    number: '03',
    icon: 'check-circle',
    title: 'Shared method across team',
    description:
      'One troubleshooting language. First-response capability built across shifts.',
  },
  {
    number: '04',
    icon: 'check-circle',
    title: 'Verifiable, repeatable decisions',
    description:
      'Process behaviour explained by evidence. Approved conditions documented for the team.',
  },
] as const;

/** Column labels, drawn from the Before/After framing in the PRD. */
export const WHY_LABELS = {
  beforeHeading: 'Before',
  beforeSubline: 'Four recurring problems',
  afterHeading: 'After',
  afterSubline: 'Four shifts scientific thinking delivers',
} as const;

/** Assistive-tech caption for the comparison. */
export const WHY_CAPTION =
  'Comparison of four recurring injection moulding problems against the four capability shifts scientific moulding delivers';
