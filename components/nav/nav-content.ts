/**
 * §6 — Navigation content.
 *
 * ── Why the anchors live here and not in each section ───────────────
 * Every section already owns its own `*_ID` export (`WHY_ID`, `TRACK_RECORD_ID`,
 * `CONTACT_ID`). Those remain the single source of truth for the `<section id>`
 * itself. This module is the *reading order* — the list the nav renders and the
 * scrollspy watches — which is a separate concern that no single section owns.
 *
 * The order below is the PRD Section 4 information architecture:
 *
 *   #hero → #about → #fundamentals → #materials → #process-development
 *        → #defect-troubleshooting → #pathway → #why → #track-record → #contact
 *
 * A test asserts these match the ids actually present in the served HTML, so a
 * renamed section fails the build rather than silently producing a dead link.
 */

/** The logo wordmark. Two words so the accent dot can sit between them. */
export const LOGO = {
  first: 'SCIENTIFIC',
  second: 'MOULDING',
  /** Sits in the footer/legal line too, so it is exported rather than inlined. */
  full: 'SCIENTIFIC MOULDING',
} as const;

/** Anchor + label for one destination. */
export interface NavItem {
  /** Fragment id without the leading `#`. */
  id: string;
  label: string;
}

/**
 * The five programs, in build order A → E.
 *
 * Program E's id is `pathway`, not `program-e`: the section is titled
 * "Full Pathway", so the anchor follows the heading rather than the letter.
 * These are also the dropdown's sub-links.
 */
export const PROGRAM_ITEMS: readonly NavItem[] = [
  { id: 'fundamentals', label: 'Fundamentals' },
  { id: 'materials', label: 'Materials' },
  { id: 'process-development', label: 'Process Development' },
  { id: 'defect-troubleshooting', label: 'Defect Troubleshooting' },
  { id: 'pathway', label: 'Full Pathway' },
] as const;

/**
 * Desktop nav. `Programs` is the only item with children — it is rendered as a
 * dropdown trigger rather than a link, because there is no `#programs` section
 * to jump to (the five programs are separate sections).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'hero', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'why', label: 'Why' },
  { id: 'track-record', label: 'Track Record' },
  { id: 'contact', label: 'Contact' },
] as const;

/** Label for the `Programs` dropdown trigger. */
export const PROGRAMS_LABEL = 'Programs';

/**
 * Every id the scrollspy watches, in document order.
 *
 * `pathway` is included, so scrolling through Program E highlights the
 * `Programs` trigger via its child match rather than leaving the nav blank.
 */
export const SECTION_IDS: readonly string[] = [
  'hero',
  'about',
  ...PROGRAM_ITEMS.map((item) => item.id),
  'why',
  'track-record',
  'contact',
] as const;

/** The persistent header CTA. */
export const NAV_CTA = {
  label: 'Request Proposal',
  href: '#contact',
} as const;

/**
 * Header height, in px, at rest and once shrunk.
 *
 * Exported because the CSS `scroll-margin-top` has to clear the *taller* of the
 * two: anchoring is computed against the resting height, and the header only
 * shrinks once the page has already scrolled, which would otherwise land the
 * heading underneath the header.
 */
export const HEADER_HEIGHT = {
  rest: 72,
  shrunk: 60,
} as const;

/** Scroll distance, in px, after which the header gains its surface. */
export const HEADER_SCROLL_THRESHOLD = 80;

/** The three quick actions, shared by the mobile panel and the sticky bar. */
export const QUICK_ACTIONS = [
  { kind: 'call', label: 'Call' },
  { kind: 'whatsapp', label: 'WhatsApp' },
  { kind: 'email', label: 'Email' },
] as const;

export type QuickActionKind = (typeof QUICK_ACTIONS)[number]['kind'];

/**
 * Contact details.
 *
 * Kept here rather than inline in the two components that render the quick
 * actions, so the panel and the sticky bar cannot disagree about the number.
 * These mirror the §5.6 direct-contact routes.
 */
export const CONTACT_DETAILS = {
  /** E.164 for `tel:` — no spaces, no dashes. */
  phone: '+60124885247',
  /** `wa.me` needs international format with no separators or plus. */
  whatsapp: '60124885247',
  email: 'hafiedzzul@gmail.com',
} as const;

/** Build the href for one quick action. */
export function actionHref(kind: QuickActionKind): string {
  switch (kind) {
    case 'call':
      return `tel:${CONTACT_DETAILS.phone}`;
    case 'whatsapp':
      return `https://wa.me/${CONTACT_DETAILS.whatsapp}`;
    case 'email':
      return `mailto:${CONTACT_DETAILS.email}`;
  }
}

