/**
 * §5.5 — Track Record / Trust Strip.
 *
 * The trust statement: a visitor who has read this far has seen all five
 * programmes, and this section confirms the trainer behind them is proven.
 *
 * ── Content sources ─────────────────────────────────────────────────
 * Copy supplied verbatim in the task spec, drawing on PRD 5.5 and the shared
 * trainer block across the source PDFs.
 *
 * ── What is deliberately ABSENT ─────────────────────────────────────
 * Two things the PRD allows but the project cannot supply:
 *
 *   1. **Testimonials.** PRD 5.5 does not call for them and no source exists.
 *      The PRD has a `#track-record` section for *figures*, not quotes, so no
 *      placeholder was invented. A fabricated quote is a public claim in a real
 *      customer's name.
 *
 *   2. **Client company logos.** PRD 5.5 says "company-type logos/icons
 *      (generic, non-branded) **if available**". They are not available, and
 *      displaying real client logos needs written permission the project does
 *      not hold.
 *
 * `CLIENT_TYPES` below is the substitute the PRD anticipates, and it is flagged
 * as an ASSUMPTION because the five types were not supplied — they are derived
 * from the industries the source programmes mention.
 */

/** Section identity. Anchor name comes from PRD Section 4. */
export const TRACK_RECORD_ID = 'track-record' as const;

/** Hero statement. */
export const TRACK_RECORD_HERO = {
  eyebrow: 'TRACK RECORD',
  title: 'Proven Across Malaysian Injection Moulding.',
  subcopy:
    'Seventeen years building scientific moulding capability. Hundreds of engineers trained. Dozens of manufacturing partners.',
} as const;

/**
 * The three headline figures.
 *
 * `value` is a string, not a number: "17+" is not numeric and typing it as a
 * number would strip the "+". `label` and `sublabel` are separate so they can
 * carry different weights and colours.
 */
export const TRACK_RECORD_STATS = [
  {
    value: '17+',
    label: 'Years Industry + Academia',
    sublabel: 'Since ~2008',
  },
  {
    value: '500+',
    label: 'Technical Personnel Trained',
    sublabel: 'Across 5 training programmes',
  },
  {
    value: '60+',
    label: 'Malaysian Manufacturing Companies',
    sublabel: 'Injection moulding operations',
  },
] as const;

/** HRDC accreditation block. */
export const TRACK_RECORD_HRDC = {
  icon: 'badge-check',
  title: 'HRD Corp Accredited Trainer',
  subtext:
    'Training programmes are HRDC-claimable for Malaysian employers.',
} as const;

/**
 * Closing trust statement.
 *
 * A differentiator the source material states directly, so it is reproduced
 * verbatim rather than softened.
 */
export const TRACK_RECORD_STATEMENT =
  'The same trainer who wrote the programmes delivers them. No subcontracting, no junior facilitator. Direct from practitioner to team.' as const;

/**
 * Heading for the operation-types strip.
 *
 * Deliberately "Industries We **Typically** Serve" rather than "We Serve":
 * the latter implies a verifiable client list the project cannot evidence.
 * "Typically" is the honest claim — these are the industries the training
 * addresses, not named accounts.
 */
export const CLIENT_TYPES_HEADING = 'Industries We Typically Serve' as const;

/**
 * ASSUMPTION — company types, not client names.
 *
 * PRD 5.5 asks for "company-type logos/icons (generic, non-branded) **if
 * available**". No logos or client list were supplied, and using real client
 * marks requires written permission the project does not hold.
 *
 * So these are the *types* of operation the training serves. The five were not
 * given in the spec either — they are derived from the industries the source
 * programmes reference (automotive tooling, electronics housings, consumer
 * goods, medical, packaging). **Confirm or replace before launch.**
 */
export const CLIENT_TYPES = [
  { icon: 'car', label: 'Automotive' },
  { icon: 'circuit-board', label: 'Electronics' },
  { icon: 'package', label: 'Consumer Goods' },
  { icon: 'heart-pulse', label: 'Medical Devices' },
  { icon: 'box', label: 'Packaging' },
] as const;

/** Assistive-tech caption naming the trust statement. */
export const TRACK_RECORD_CAPTION =
  'Trainer track record: seventeen years, five hundred personnel trained, sixty Malaysian manufacturing companies';
