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
 * The headline, split for the two-tone treatment.
 *
 * ── Why a split rather than a second headline string ────────────────
 * The brief asks for "Scientific Molding" in orange and "Training Series" in
 * charcoal. The obvious implementation is two strings and a `<span>` each —
 * which makes the headline two sources of truth, and the day someone edits one
 * of them the h1 on the page no longer matches the h1 in the PRD.
 *
 * So the split is DERIVED here from `HERO_COPY.headline` by splitting on the
 * final space. The rendered h1 is therefore always exactly the PRD string, in
 * one `<h1>`, and the two fragments are a presentation detail rather than copy.
 *
 * The keyword check is explicit: if the string ever stops containing the
 * keyword, `accent` is empty and the whole headline falls to `rest` in one
 * colour. That is a legible headline, not a broken one — the failure mode of a
 * positional split would be an orange fragment nobody asked for.
 */
export const HERO_HEADLINE_KEYWORD = 'Scientific Molding' as const;

export const HERO_HEADLINE_PARTS = (() => {
  const full = HERO_COPY.headline;
  const at = full.indexOf(HERO_HEADLINE_KEYWORD);

  if (at === -1) return { accent: '', rest: full } as const;

  const end = at + HERO_HEADLINE_KEYWORD.length;

  return {
    accent: full.slice(at, end),
    /* The space between the fragments is preserved here rather than baked into
       a span, so the two runs read as one sentence to a screen reader and to
       text selection. */
    rest: full.slice(end),
  } as const;
})();


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
 * third-party stock without rights" — so no stock image is bundled here.
 *
 * ── Polish #7 ───────────────────────────────────────────────────────
 * `src` now names the path the asset WILL live at rather than `null`. The frame
 * renders through `<ImageSlot>`, which requests this file and, if it is not
 * there yet, falls back to a brand gradient. Dropping
 * `public/images/hero-training.jpg` in place is therefore the ONLY step needed
 * to go live — no code change.
 *
 * `width`/`height` are 800×1000, the 4:5 portrait ratio. They are the asset's
 * intrinsic dimensions and they set the frame's aspect ratio, so the browser
 * reserves the space before the file arrives and the grid never shifts.
 */
export const HERO_MEDIA = {
  width: 800,
  height: 1000,
  /** Alt text describing the intended subject, not the empty state. */
  alt: 'Technician reviewing process parameters on an injection moulding machine',
  /** The asset path. Replace the file to go live. */
  src: '/images/hero-training.jpg',
} as const;


