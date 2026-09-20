/**
 * Hero copy and data — PRD Section 5.1.
 *
 * ── Why this is a separate module ───────────────────────────────────
 * Every string on the page lives here, verbatim, with no interpolation and no
 * logic. That makes the file auditable against PRD Section 5.1 line by line —
 * you can diff it against the PRD without reading a single JSX expression, and
 * `scripts/check-entrance.mjs` asserts each string appears in the served HTML.
 *
 * ── Source of truth ─────────────────────────────────────────────────
 * All copy below is quoted from PRD Section 5.1. Nothing is paraphrased.
 */

/** A figure in the stat strip. */
export interface HeroStat {
  /**
   * The numeral as displayed. Kept as a string, not a number, because the
   * PRD's leading zeros — "07", "04", "01" — are a deliberate design device.
   * Stored as numbers they would silently render "7", "4", "1".
   */
  readonly value: string;
  /** The label beneath the numeral. */
  readonly label: string;
  /**
   * Which of PRD 13.1's two numeral treatments this figure takes: solid
   * orange with white text, or solid yellow with charcoal text.
   *
   * Stated per figure rather than derived from the array index. Both give
   * the same result today, but "the first one is orange" is a rule about
   * *this* list, and encoding it as `index === 0` would make recolouring or
   * reordering the strip a change to the component rather than to the data.
   */
  readonly tone: 'orange' | 'yellow';
}

/**
 * PRD Section 5.1:
 * "**07** specialist modules | **16** total training days |
 *  **04** capability levels | **01** clear learning path"
 */
export const HERO_STATS: readonly HeroStat[] = [
  { value: '07', label: 'specialist modules', tone: 'orange' },
  { value: '16', label: 'total training days', tone: 'yellow' },
  { value: '04', label: 'capability levels', tone: 'yellow' },
  { value: '01', label: 'clear learning path', tone: 'yellow' },
] as const;

/**
 * PRD Section 5.1:
 * Headline "Scientific Molding Training Series"
 * Tagline  "7 structured modules. One stronger moulding organisation."
 * Sub-copy "Build capability • Improve consistency • Strengthen technical
 *           decision-making"
 */
export const HERO_COPY = {
  headline: 'Scientific Molding Training Series',
  tagline: '7 structured modules. One stronger moulding organisation.',
  subcopy: 'Build capability • Improve consistency • Strengthen technical decision-making',
} as const;

/**
 * Small pre-headline label.
 *
 * "HRDC Claimable Training" is a factual accreditation statement — HRD Corp
 * claimable is a specific scheme with its own rules — so it is reproduced
 * verbatim rather than reworded.
 */
export const HERO_EYEBROW = 'HRDC Claimable Training' as const;

/**
 * PRD Section 5.1:
 * Primary CTA   "Request a Customised Proposal" (scrolls to `#contact`)
 * Secondary CTA "Call Now" / "Email Now" (click-to-call / mailto)
 */
export const HERO_CTA = {
  primary: 'Request a Customised Proposal',
  call: 'Call Now',
  email: 'Email Now',
} as const;

/**
 * Destination of the primary CTA, taken from PRD Section 5.1 — the PRD states
 * the scroll target explicitly, so this is not a placeholder.
 */
export const HERO_CTA_TARGET = '#contact' as const;

/**
 * Contact routes.
 *
 * `tel:` and `mailto:` are built from these rather than hardcoded in JSX so the
 * number appears once. The `tel:` form strips spaces and dashes — some dialers
 * reject a formatted number.
 */
export const HERO_CONTACT = {
  /** Displayed to the reader, formatted for legibility. */
  phoneDisplay: '+60 12-488 5247',
  /** Dialable form. Digits and a single leading plus only. */
  phoneHref: 'tel:+60124885247',
  emailDisplay: 'hafiedzzul@gmail.com',
  emailHref: 'mailto:hafiedzzul@gmail.com',
} as const;

/**
 * The hero visual.
 *
 * PRD Section 5.2 warns: "replace with licensed/owned photography, do not reuse
 * third-party stock without rights" — so no stock image is bundled here. Until
 * an owned asset exists, HeroMedia renders a labelled frame rather than a
 * fabricated path or a broken request.
 *
 * To go live: set `src` to the real asset, place the file in `public/`, and keep
 * `width`/`height` accurate so the browser can reserve space with no layout
 * shift (Web Interface Guidelines: images need explicit dimensions).
 */
export const HERO_MEDIA = {
  /** Intrinsic dimensions of the eventual asset — the 4:5 frame ratio. */
  width: 1200,
  height: 1500,
  /** Alt text describing the intended subject, not the placeholder. */
  alt: 'Technician reviewing process parameters on an injection moulding machine',
  /** Set once an owned image exists. */
  src: null as string | null,
} as const;

