/**
 * Admin panel — the content schema.
 *
 * This is the single description of what the panel may edit. The form fields in
 * the UI, the server-side validation and the file writer are all driven from
 * it, so a field cannot exist in the editor without also existing in the
 * validator or the writer. Adding an editable field is one entry here.
 *
 * ── Why a declarative schema rather than bespoke forms ──────────────────
 * Twelve content modules exist. Hand-writing a form, a validator and a writer
 * for each would be three places to keep in step per module, and the failure
 * mode of drift is silent: a field that renders but never saves. A schema makes
 * that structurally impossible.
 *
 * ── What is deliberately NOT editable ───────────────────────────────────
 * Programme bodies (`program-a-content.ts` … `program-e-content.ts`) are
 * verbatim extractions from the customer's five PDFs, and the output checker
 * asserts every string appears in the served HTML. Exposing them to free-text
 * editing would let a well-meaning edit break eight assertions and, worse,
 * silently diverge the published page from the source PDFs the customer
 * approved. They stay in code.
 */

/** A field the panel can edit. */
export interface FieldSpec {
  /** Key in the content module's exported object. */
  readonly key: string;
  /** Label shown in the form. */
  readonly label: string;
  /** `textarea` for multi-line, `image` for an ImageSlot path. */
  readonly type: 'text' | 'textarea' | 'image' | 'number';
  /** Helper text under the field. */
  readonly hint?: string;
  /** Maximum length. Enforced on save. */
  readonly maxLength?: number;
  /** Soft warning length — a longer value is allowed but flagged in the UI. */
  readonly warnLength?: number;
}

/** A group of fields, editing one exported object in one module. */
export interface GroupSpec {
  /** Stable id used in URLs and API payloads. */
  readonly id: string;
  /** Heading in the panel. */
  readonly title: string;
  /** What this content is and where it appears. */
  readonly description: string;
  /** Repo-relative path to the module. */
  readonly file: string;
  /** The exported const the fields live in. */
  readonly export: string;
  /** Fields in this group. */
  readonly fields: readonly FieldSpec[];
}

/**
 * The six image slots the upload API accepts, mapped to the content key that
 * stores their path and the intrinsic dimensions the frame reserves.
 *
 * Dimensions are declared here rather than inferred from the uploaded file
 * because they set `ImageSlot`'s aspect ratio, and a ratio that changed with
 * every upload would reflow the layout on each replacement.
 */
export const IMAGE_SLOTS = {
  hero: { key: 'hero', width: 800, height: 1000, label: 'Hero image' },
  'trainer-portrait': {
    key: 'trainerPortrait',
    width: 600,
    height: 800,
    label: 'Trainer portrait',
  },
  'session-1': { key: 'session1', width: 800, height: 600, label: 'Session photo 1' },
  'session-2': { key: 'session2', width: 800, height: 600, label: 'Session photo 2' },
  'session-3': { key: 'session3', width: 800, height: 600, label: 'Session photo 3' },
  'session-4': { key: 'session4', width: 800, height: 600, label: 'Session photo 4' },
} as const;

/** Valid slot names, for validation. */
export type ImageSlotName = keyof typeof IMAGE_SLOTS;

/**
 * The editable content groups.
 *
 * Order here is the order shown in the panel, grouped by how often the trainer
 * is likely to touch them: images first, then hero, then testimonials.
 */
export const CONTENT_GROUPS: readonly GroupSpec[] = [
  {
    id: 'images',
    title: 'Images',
    description:
      'The six image positions on the page. Each renders a brand gradient until a file is uploaded.',
    file: 'components/shared/image-content.ts',
    export: 'PAGE_IMAGES',
    fields: [
      {
        key: 'hero',
        label: 'Hero image',
        type: 'image',
        hint: 'Portrait 4:5, ideally 800×1000. Appears beside the headline.',
      },
      {
        key: 'trainerPortrait',
        label: 'Trainer portrait',
        type: 'image',
        hint: 'Portrait 3:4, ideally 600×800. Appears in the About section.',
      },
      {
        key: 'session1',
        label: 'Session photo 1',
        type: 'image',
        hint: 'Landscape 4:3, ideally 800×600. Session gallery, top-left.',
      },
      {
        key: 'session2',
        label: 'Session photo 2',
        type: 'image',
        hint: 'Landscape 4:3, ideally 800×600. Session gallery, top-right.',
      },
      {
        key: 'session3',
        label: 'Session photo 3',
        type: 'image',
        hint: 'Landscape 4:3, ideally 800×600. Session gallery, bottom-left.',
      },
      {
        key: 'session4',
        label: 'Session photo 4',
        type: 'image',
        hint: 'Landscape 4:3, ideally 800×600. Session gallery, bottom-right.',
      },
    ],
  },
  {
    id: 'hero',
    title: 'Hero copy',
    description: 'The headline block at the top of the page.',
    file: 'components/hero/hero-content.ts',
    export: 'HERO_EDITED',
    fields: [
      {
        key: 'eyebrow',
        label: 'Eyebrow',
        type: 'text',
        hint: 'Small uppercase label above the headline.',
        maxLength: 60,
      },
      {
        key: 'headline',
        label: 'Headline',
        type: 'text',
        hint: 'The page h1. "Scientific Molding" is coloured automatically.',
        maxLength: 90,
      },
      { key: 'tagline', label: 'Tagline', type: 'text', maxLength: 120 },
      {
        key: 'subcopy',
        label: 'Sub-copy',
        type: 'text',
        maxLength: 160,
        warnLength: 120,
      },
    ],
  },
  {
    id: 'about',
    title: 'About the trainer',
    description: 'The trainer name and section label.',
    file: 'components/about/about-content.ts',
    export: 'TRAINER_EDITED',
    fields: [
      {
        key: 'eyebrow',
        label: 'Section label',
        type: 'text',
        hint: 'Small uppercase label above the trainer name.',
        maxLength: 60,
      },
      { key: 'name', label: 'Trainer name', type: 'text', maxLength: 120 },
    ],
  },
  {
    id: 'testimonials',
    title: 'Testimonials',
    description:
      "The three participant quotes. A published testimonial is a claim in a named person's mouth — only enter quotes the person has actually given, and company names only with written permission.",
    file: 'components/testimonials/testimonials-content.ts',
    export: 'TESTIMONIALS_EDITED',
    fields: [
      { key: 'heading', label: 'Section title', type: 'text', maxLength: 80 },
      { key: 'subcopy', label: 'Section sub-copy', type: 'text', maxLength: 160 },
      { key: 'name1', label: 'Person 1 — name', type: 'text', maxLength: 80 },
      { key: 'role1', label: 'Person 1 — role', type: 'text', maxLength: 80 },
      { key: 'company1', label: 'Person 1 — company', type: 'text', maxLength: 80 },
      { key: 'quote1', label: 'Person 1 — quote', type: 'textarea', maxLength: 400 },
      { key: 'name2', label: 'Person 2 — name', type: 'text', maxLength: 80 },
      { key: 'role2', label: 'Person 2 — role', type: 'text', maxLength: 80 },
      { key: 'company2', label: 'Person 2 — company', type: 'text', maxLength: 80 },
      { key: 'quote2', label: 'Person 2 — quote', type: 'textarea', maxLength: 400 },
      { key: 'name3', label: 'Person 3 — name', type: 'text', maxLength: 80 },
      { key: 'role3', label: 'Person 3 — role', type: 'text', maxLength: 80 },
      { key: 'company3', label: 'Person 3 — company', type: 'text', maxLength: 80 },
      { key: 'quote3', label: 'Person 3 — quote', type: 'textarea', maxLength: 400 },
    ],
  },
] as const;

/**
 * Look up a group by id.
 * @param {string} id
 * @returns {GroupSpec|undefined}
 */
export function findGroup(id: string): GroupSpec | undefined {
  return CONTENT_GROUPS.find((g) => g.id === id);
}

/**
 * Validate a submitted set of field values against a group.
 * @param {GroupSpec} group
 * @param {Record<string, unknown>} values
 * @returns {{ ok: boolean, errors: Record<string,string>, data: Record<string,string> }}
 */
export function validateValues(
  group: GroupSpec,
  values: Record<string, unknown>,
): { ok: boolean; errors: Record<string, string>; data: Record<string, string> } {
  const errors: Record<string, string> = {};
  const data: Record<string, string> = {};

  for (const field of group.fields) {
    const raw = values[field.key];
    const value = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';

    if (field.type !== 'image' && value.length === 0) {
      errors[field.key] = `${field.label} cannot be empty.`;
      continue;
    }

    if (field.maxLength && value.length > field.maxLength) {
      errors[field.key] = `${field.label} is ${value.length} characters; the limit is ${field.maxLength}.`;
      continue;
    }

    /*
     * An image field must be a path or URL, never a bare filename. A bare name
     * would render a broken `<img>` with no error, which is the silent failure
     * this validation exists to prevent.
     */
    if (
      field.type === 'image' &&
      value.length > 0 &&
      !value.startsWith('/') &&
      !/^https?:\/\//.test(value)
    ) {
      errors[field.key] = `${field.label} must be a path or URL. Upload a file instead.`;
      continue;
    }

    data[field.key] = value;
  }

  return { ok: Object.keys(errors).length === 0, errors, data };
}
