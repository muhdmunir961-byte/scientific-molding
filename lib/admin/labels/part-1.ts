/**
 * Human field labels — part 1: Hero, About, Why.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THIS EXISTS
 *
 *  The editor renders whatever shape a content module has and labels each input
 *  by humanising its key: `subcopy` becomes "Subcopy", `linkHref` becomes "Link
 *  Href". That is accurate and useless. The person using this panel is a
 *  trainer, not the person who named those keys, and "Eyebrow" is not a word
 *  that means anything to them.
 *
 *  So every field that needs better wording than its key is named here, with a
 *  plain description of where it appears on the page. A field with no entry
 *  falls back to the humanised key, so a newly added field is still editable
 *  immediately — it just gets a plainer label until someone names it.
 *
 *  ── Why `where` and `hint` are separate ─────────────────────────────────
 *  `where` answers "which part of the page is this?" and orients the reader.
 *  `hint` answers "what should I type?" Merging them produces a paragraph
 *  nobody reads.
 * ════════════════════════════════════════════════════════════════════════
 */

export interface FieldLabel {
  /** What the field is called on screen. */
  readonly label: string;
  /** Where it appears on the page, for orientation. */
  readonly where?: string;
  /** What to type, or a caveat. */
  readonly hint?: string;
}

/** Labels for the Hero, About and Why sections. */
export const LABELS_PART_1: Record<string, FieldLabel> = {
  /* ---------------- Hero ---------------- */
  'hero.HERO_COPY.eyebrow': {
    label: 'Small label above the headline',
    where: 'Hero — the very top of the page',
    hint: 'Short text in capitals, currently "HRDC Claimable Training".',
  },
  'hero.HERO_COPY.headline': {
    label: 'Main headline',
    where: 'Hero — the largest text on the page',
    hint: 'The words "Scientific Molding" are coloured orange automatically.',
  },
  'hero.HERO_COPY.tagline': {
    label: 'Tagline under the headline',
    where: 'Hero — directly beneath the headline',
  },
  'hero.HERO_COPY.subcopy': {
    label: 'Short description',
    where: 'Hero — beneath the tagline',
    hint: 'One line. Longer text wraps awkwardly beside the image.',
  },
  'hero.HERO_STATS': {
    label: 'The four figures',
    where: 'Hero — the row of numbered tiles',
    hint: 'Each needs a number and a label. The number is stored as text, so "07" keeps its leading zero.',
  },
  'hero.HERO_CTA.primary': { label: 'Main button text', where: 'Hero — the orange button' },
  'hero.HERO_CTA.call': { label: 'Call button label', where: 'Hero — the "Call Now" button' },
  'hero.HERO_CTA.email': { label: 'Email button label', where: 'Hero — the "Email Now" button' },
  'hero.HERO_CONTACT.phoneDisplay': {
    label: 'Phone number shown',
    where: 'Hero and the mobile bar',
    hint: 'As a visitor should read it, e.g. "+60 12-488 5247".',
  },
  'hero.HERO_CONTACT.phoneHref': {
    label: 'Phone number the Call button dials',
    where: 'Hero — what happens when tapped',
    hint: 'Digits only with a leading plus, e.g. "tel:+60124885247".',
  },
  'hero.HERO_CONTACT.emailDisplay': { label: 'Email address shown', where: 'Hero and the mobile bar' },
  'hero.HERO_CONTACT.emailHref': {
    label: 'Email link',
    where: 'Hero — what happens when clicked',
    hint: 'Starts with "mailto:", e.g. "mailto:name@example.com".',
  },

  /* ---------------- About ---------------- */
  'about.TRAINER_NAME': { label: 'Trainer name', where: 'About the trainer — the heading' },
  'about.TRAINER_EYEBROW': {
    label: 'Section label',
    where: 'About — small text above the name',
    hint: 'Shown in capitals.',
  },
  'about.TRAINER_CREDENTIALS': {
    label: 'Credentials list',
    where: 'About — the ticked list',
    hint: 'One row per qualification. Add or remove rows freely.',
  },
  'about.TRAINER_STATS': {
    label: 'Track record figures',
    where: 'About — the numbered tiles',
    hint: 'The "+" is part of the value, so keep it.',
  },

  /* ---------------- Why ---------------- */
  'why.WHY_HERO.eyebrow': { label: 'Section label', where: 'Why — small text above the heading' },
  'why.WHY_HERO.title': { label: 'Section heading', where: 'Why Scientific Molding' },
  'why.WHY_HERO.subcopy': { label: 'Section description', where: 'Why — under the heading' },
  'why.WHY_PROBLEMS': {
    label: 'Left column — the problems',
    where: 'Why — the "Before" side',
    hint: 'Four items, each with a title and a description.',
  },
  'why.WHY_SHIFTS': {
    label: 'Right column — the improvements',
    where: 'Why — the "After" side',
    hint: 'Four items, matching the problems on the left.',
  },
};
