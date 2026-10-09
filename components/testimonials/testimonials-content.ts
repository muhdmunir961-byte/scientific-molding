/**
 * Testimonials — §5.5b, between Track Record and Contact.
 *
 * ════════════════════════════════════════════════════════════════════
 *  ⚠️  CONTENT REQUIRED — testimonials from user.
 *
 *  Every string below is a PLACEHOLDER in square brackets. None of it is a
 *  claim, and none of it may be published as-is.
 *
 *  ── Why placeholders rather than invented copy ──────────────────────
 *  A testimonial is a quotation attributed to a named person at a named
 *  company. Writing plausible quotes and attributing them — even to
 *  "[Name]" — publishes a claim in a real customer's name that they never
 *  made, and a real company's name against a result it never reported. That
 *  is a legal exposure (Malaysian consumer-protection and trade-description
 *  rules both bite on unsubstantiated endorsement) and it is the one thing
 *  the source PDFs and the PRD cannot supply: neither contains a quote.
 *
 *  So the structure ships and the words are bracketed. The section is fully
 *  styled, laid out and wired; replacing the three objects below is the whole
 *  of the remaining work.
 *
 *  ── What to supply, per entry ───────────────────────────────────────
 *    name      Full name, as the person is willing to be quoted.
 *              "Ir. Ahmad bin Ismail", not "Ahmad I."
 *    role      Job title at the time of the training.
 *    company   Company name — ONLY with that company's written permission.
 *              Many Malaysian employers will give a title without the company
 *              name; in that case put the sector, e.g. "Tier-1 automotive
 *              moulder", and the card still works.
 *    quote     Two to three sentences. The most useful ones name a specific
 *              change ("we now set the pack pressure from the material data
 *              sheet instead of copying the last setup"), because a specific
 *              claim is what a procurement reader believes.
 *    avatar    Square headshot, at least 240×240. The card degrades to the
 *              initial-letter tile if the file is absent, so this is optional
 *              at launch.
 *    rating    1–5. Only publish a rating the person actually gave.
 * ════════════════════════════════════════════════════════════════════
 */

/** Section identity. Anchor name follows the §5.x pattern. */
export const TESTIMONIALS_ID = 'testimonials' as const;

/** Section hero copy. */
export const TESTIMONIALS_HERO = {
  eyebrow: 'TESTIMONIALS',
  title: 'What Participants Say.',
  subcopy:
    'Feedback from engineers and managers who have completed the programmes.',
} as const;

/*
 * The testimonial entries themselves are NOT here.
 *
 * They live in `content/testimonials.json` and are read through
 * `lib/testimonials.ts`, because the client adds, reorders and publishes them
 * from the panel. A `readonly` array in a component module cannot be edited, and
 * an entry needs a stable id for a reorder to survive — see that module's
 * docblock.
 *
 * The types are re-exported here so existing imports of `Testimonial` keep
 * working rather than every call site having to learn the new path.
 */
export type { Testimonial } from '@/lib/testimonials';

/**
 * Assistive-tech caption naming the section's purpose.
 *
 * The three cards are quotes from different people, so the section needs one
 * sentence saying what they are a set of — a reader arriving by landmark gets
 * "three participant testimonials" rather than three unattributed blockquotes.
 */
export const TESTIMONIALS_CAPTION =
  'Participant testimonials from the Scientific Moulding training programmes';
