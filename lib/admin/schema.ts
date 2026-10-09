/**
 * Admin panel — what is editable.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THIS IS A MODULE LIST, NOT A FIELD LIST
 *
 *  The first revision hand-described every editable field. That does not scale
 *  to the real content surface — roughly 125 exports across 14 modules, mostly
 *  arrays of objects and nested objects — and it put a second description of
 *  each module next to the module itself, which is a thing that drifts.
 *
 *  Instead the panel lists the MODULES and the EXPORTS within them, and reads
 *  each export's actual value at runtime. The editor renders whatever shape it
 *  finds, so adding a field to a content module makes it editable with no
 *  change here at all.
 *
 *  See `lib/admin/overrides.ts` for how a saved value reaches a component.
 * ════════════════════════════════════════════════════════════════════════
 */

/** How much freedom an export gets in the editor. */
export type EditMode =
  /** Every field editable, including arrays. */
  | 'full'
  /**
   * Listed and viewable, but locked. Used for the programme bodies, whose text
   * is a verbatim extraction from the customer's PDFs: an unprompted edit there
   * silently diverges the published page from the document the customer
   * approved. The panel shows the content so it stays discoverable, and refuses
   * the edit with the reason stated.
   */
  | 'locked';

/** One exported constant within a content module. */
export interface ExportSpec {
  /** Export name, e.g. `HERO_COPY`. Used as the override key's second half. */
  readonly name: string;
  /** Label shown in the panel. */
  readonly label: string;
  /** What this content is. */
  readonly description: string;
  /** `locked` keeps it read-only. Defaults to `full`. */
  readonly mode?: EditMode;
}

/** One content module. */
export interface ModuleSpec {
  /** Stable id used in URLs and override keys, e.g. `hero`. */
  readonly id: string;
  /** Heading in the panel. */
  readonly title: string;
  /** Where this content appears on the page. */
  readonly description: string;
  /** Repo-relative path to the module. */
  readonly file: string;
  /** The exported constants in this module. */
  readonly exports: readonly ExportSpec[];
}

/**
 * Why the programme bodies are read-only.
 *
 * Exported so the reason is stated once and reused: the panel shows it as the
 * lock explanation, and the setup guide points at it.
 */
export const PDF_LOCK_REASON =
  'This text is a verbatim extraction from the customer-supplied programme PDF. Editing it would diverge the published page from the approved document, so it is read-only. Change the PDF first, then the code.';

/**
 * Every editable module, in page order so the panel reads as a walk down the
 * page.
 */
export const MODULES: readonly ModuleSpec[] = [
  {
    id: 'images',
    title: 'Images',
    description: 'The six image positions. Managed from the Images page, not as text.',
    file: 'components/generated/images-content.generated.ts',
    exports: [
      {
        name: 'PAGE_IMAGES',
        label: 'Image paths',
        description: 'Upload files on the Images page.',
        mode: 'locked',
      },
    ],
  },
  {
    id: 'hero',
    title: 'Hero',
    description: 'The opening section: eyebrow, headline, tagline, sub-copy, stats and CTAs.',
    file: 'components/hero/hero-content.ts',
    exports: [
      { name: 'HERO_COPY', label: 'Headline copy', description: 'Eyebrow, headline, tagline and sub-copy.' },
      { name: 'HERO_EYEBROW', label: 'Eyebrow label', description: 'Small uppercase label above the headline.' },
      { name: 'HERO_STATS', label: 'Stat figures', description: 'The four figures in the strip under the CTAs.' },
      { name: 'HERO_CTA', label: 'Button labels', description: 'Primary, call and email button text.' },
      { name: 'HERO_CONTACT', label: 'Contact routes', description: 'Phone and email shown in the hero.' },
    ],
  },
  {
    id: 'about',
    title: 'About the trainer',
    description: 'The trainer name, credentials, track record and section label.',
    file: 'components/about/about-content.ts',
    exports: [
      { name: 'TRAINER_NAME', label: 'Trainer name', description: 'The name shown as the section heading.' },
      { name: 'TRAINER_EYEBROW', label: 'Section label', description: 'Small uppercase label above the name.' },
      { name: 'TRAINER_CREDENTIALS', label: 'Credentials', description: 'The seven credential rows.' },
      { name: 'TRAINER_STATS', label: 'Track record figures', description: 'Years, personnel trained, companies.' },
    ],
  },
  {
    id: 'why',
    title: 'Why Scientific Molding',
    description: 'The before/after comparison section.',
    file: 'components/why/why-content.ts',
    exports: [
      { name: 'WHY_HERO', label: 'Section heading', description: 'Eyebrow, title and sub-copy.' },
      { name: 'WHY_PROBLEMS', label: 'Before column', description: 'The four problems.' },
      { name: 'WHY_SHIFTS', label: 'After column', description: 'The four shifts.' },
      { name: 'WHY_LABELS', label: 'Column labels', description: 'Headings and sub-lines for both columns.' },
    ],
  },
  {
    id: 'track-record',
    title: 'Track record',
    description: 'The dark trust section: figures, HRDC card, credentials and client types.',
    file: 'components/track-record/track-record-content.ts',
    exports: [
      { name: 'TRACK_RECORD_HERO', label: 'Section heading', description: 'Eyebrow, title and sub-copy.' },
      { name: 'TRACK_RECORD_STATS', label: 'Figures', description: 'The ranked display figures.' },
      { name: 'TRACK_RECORD_HRDC', label: 'HRDC card', description: 'The accreditation card copy.' },
      { name: 'TRACK_RECORD_STATEMENT', label: 'Trust statement', description: 'The closing blockquote.' },
      { name: 'CLIENT_TYPES_HEADING', label: 'Client types heading', description: 'Heading above the industry list.' },
      { name: 'CLIENT_TYPES', label: 'Client types', description: 'The five operation types.' },
    ],
  },
  {
    id: 'testimonials',
    title: 'Testimonials',
    description:
      "The three participant quotes. A published testimonial is a claim in a named person's mouth — only enter quotes the person has actually given, and company names only with written permission.",
    file: 'components/testimonials/testimonials-content.ts',
    exports: [
      { name: 'TESTIMONIALS_HERO', label: 'Section heading', description: 'Eyebrow, title and sub-copy.' },
      { name: 'TESTIMONIALS', label: 'Quotes', description: 'The three testimonial entries.' },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    description: 'The enquiry section: heading, form labels, direct routes and success message.',
    file: 'components/contact/contact-content.ts',
    exports: [
      { name: 'CONTACT_HERO', label: 'Section heading', description: 'Eyebrow, title and sub-copy.' },
      { name: 'CONTACT_LABELS', label: 'Form labels', description: 'The visible label per field.' },
      { name: 'CONTACT_PLACEHOLDERS', label: 'Placeholders', description: 'The example text in each field.' },
      { name: 'CONTACT_CONSENT', label: 'Consent text', description: 'The PDPA consent sentence.' },
      { name: 'CONTACT_DIRECT', label: 'Direct routes', description: 'Phone, email, LinkedIn and WhatsApp.' },
      { name: 'CONTACT_SUCCESS', label: 'Success message', description: 'Shown after a successful submit.' },
    ],
  },
  {
    id: 'nav',
    title: 'Navigation',
    description: 'Menu labels, the logo, and the quick actions in the mobile bar.',
    file: 'components/nav/nav-content.ts',
    exports: [
      { name: 'LOGO', label: 'Logo text', description: 'The wordmark in the header.' },
      { name: 'NAV_ITEMS', label: 'Menu items', description: 'The top-level navigation links.' },
      { name: 'PROGRAMS_LABEL', label: 'Programmes label', description: 'The dropdown trigger text.' },
      { name: 'PROGRAM_ITEMS', label: 'Programme links', description: 'The five dropdown entries.' },
      { name: 'NAV_CTA', label: 'Header button', description: 'The button in the header.' },
      { name: 'QUICK_ACTIONS', label: 'Quick actions', description: 'Call / WhatsApp / Email in the mobile bar.' },
    ],
  },
] as const;

/**
 * The programme body modules — listed so their content is discoverable, and
 * explicitly locked.
 *
 * Separated from `MODULES` rather than mixed in with `mode: 'locked'`, because a
 * single list would mean every consumer had to check `mode` before trusting a
 * module to be writable — and the one place that forgot would be the one that
 * let an edit through. Two lists make "editable" a property of which list you
 * are iterating.
 */
export const LOCKED_MODULES: readonly ModuleSpec[] = [
  {
    id: 'trainer-credibility',
    title: 'Programme trainer credit',
    description: 'The one-line credit under every program hero.',
    file: 'components/programs/trainer-credibility.ts',
    exports: [
      { name: 'TRAINER_CREDIBILITY_ONE_LINE', label: 'Credit line', description: PDF_LOCK_REASON, mode: 'locked' },
    ],
  },
  {
    id: 'program-cta',
    title: 'Programme CTAs',
    description: 'The five request links in the Contact section.',
    file: 'components/programs/program-cta-content.ts',
    exports: [
      { name: 'PROGRAM_CTA_FOOTERS', label: 'Programme CTAs', description: PDF_LOCK_REASON, mode: 'locked' },
    ],
  },
  {
    id: 'program-a',
    title: 'Programme A — Fundamentals',
    description: 'Verbatim from the customer PDF.',
    file: 'components/programs/program-a-content.ts',
    exports: [
      { name: 'PROGRAM_A_HERO', label: 'Hero', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_A_PROBLEMS', label: 'Problems', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_A_BENEFITS', label: 'Benefits', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_A_OUTCOMES', label: 'Outcomes', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_A_PHILOSOPHY', label: 'Philosophy', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_A_FOUNDATIONS', label: 'Foundations', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_A_DAYS', label: 'Day breakdown', description: PDF_LOCK_REASON, mode: 'locked' },
    ],
  },
  {
    id: 'program-b',
    title: 'Programme B — Processability',
    description: 'Verbatim from the customer PDF.',
    file: 'components/programs/program-b-content.ts',
    exports: [
      { name: 'PROGRAM_B_HERO', label: 'Hero', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_B_PROBLEMS', label: 'Problems', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_B_BENEFITS', label: 'Benefits', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_B_CAPABILITIES', label: 'Capabilities', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_B_MODULES', label: 'Modules', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_B_FRAMEWORK', label: 'Framework', description: PDF_LOCK_REASON, mode: 'locked' },
    ],
  },
  {
    id: 'program-c',
    title: 'Programme C — Process Development',
    description: 'Verbatim from the customer PDF.',
    file: 'components/programs/program-c-content.ts',
    exports: [
      { name: 'PROGRAM_C_HERO', label: 'Hero', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_C_PROBLEMS', label: 'Problems', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_C_BENEFITS', label: 'Benefits', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_C_OUTCOMES', label: 'Outcomes', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_C_PHILOSOPHY', label: 'Philosophy', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_C_DAYS', label: 'Day breakdown', description: PDF_LOCK_REASON, mode: 'locked' },
    ],
  },
  {
    id: 'program-d',
    title: 'Programme D — Defect Troubleshooting',
    description: 'Verbatim from the customer PDF.',
    file: 'components/programs/program-d-content.ts',
    exports: [
      { name: 'PROGRAM_D_HERO', label: 'Hero', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_D_WARNING_SIGNS', label: 'Warning signs', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_D_BUSINESS_OUTCOMES', label: 'Outcomes', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_D_DEFECTS_COVERED', label: 'Defects covered', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_D_DAYS', label: 'Day breakdown', description: PDF_LOCK_REASON, mode: 'locked' },
    ],
  },
  {
    id: 'program-e',
    title: 'Programme E — Training Pathway',
    description: 'Verbatim from the customer PDF.',
    file: 'components/programs/program-e-content.ts',
    exports: [
      { name: 'PROGRAM_E_HERO', label: 'Hero', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_E_STATS', label: 'Figures', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_E_MODULES', label: 'Module cards', description: PDF_LOCK_REASON, mode: 'locked' },
      { name: 'PROGRAM_E_PATHWAY', label: 'Pathway', description: PDF_LOCK_REASON, mode: 'locked' },
    ],
  },
] as const;

/**
 * Look up an editable module by id.
 * @param {string} id
 * @returns {ModuleSpec|undefined}
 */
export function findModule(id: string): ModuleSpec | undefined {
  return MODULES.find((m) => m.id === id);
}

/**
 * Look up any module by id, editable or locked.
 *
 * The content editor uses this so it can render a locked module read-only
 * rather than 404 on it — the content stays discoverable, which is the point of
 * listing it.
 * @param {string} id
 * @returns {{ module: ModuleSpec, editable: boolean }|undefined}
 */
export function findAnyModule(
  id: string,
): { module: ModuleSpec; editable: boolean } | undefined {
  const editable = MODULES.find((m) => m.id === id);
  if (editable) return { module: editable, editable: true };

  const locked = LOCKED_MODULES.find((m) => m.id === id);
  if (locked) return { module: locked, editable: false };

  return undefined;
}

/**
 * The override key for a module export.
 * @param {string} moduleId
 * @param {string} exportName
 * @returns {string} e.g. `hero.HERO_COPY`
 */
export function overrideKey(moduleId: string, exportName: string): string {
  return `${moduleId}.${exportName}`;
}
