/**
 * Announcement banner — operator-controlled, off by default.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THIS IS NOT PART OF ANY EXISTING CONTENT MODULE
 *
 *  Every other editable export is a string or an array the page already
 *  renders. A banner is different: it is a surface that does not exist until
 *  someone turns it on, and it can be a link, a notice, or nothing at all.
 *
 *  So it has its own module with an `enabled` flag. That makes "no banner" the
 *  default state a fresh checkout renders — an empty banner would otherwise
 *  occupy space at the top of the page on day one, which is worse than not
 *  having the feature.
 *
 *  ── Why the tone is a name, not a colour ────────────────────────────────
 *  `tone` selects a class that owns the fill, the border and the text colour
 *  together. Passing a hex would let a banner be composed on a phone and land
 *  on the page in a combination nobody designed, against a palette whose whole
 *  point is that two colours were chosen.
 * ════════════════════════════════════════════════════════════════════════
 */

/** Which palette pairing the banner uses. */
export type BannerTone = 'orange' | 'yellow' | 'neutral';

export interface BannerContent {
  /** Off by default; the banner renders nothing unless this is true. */
  readonly enabled: boolean;
  /** The message. Kept short — one line on a desktop. */
  readonly message: string;
  /**
   * Optional link. Rendered as an anchor when non-empty; the button is hidden
   * when it is, so a banner without a link does not show a dead control.
   */
  readonly linkHref: string;
  /** Label for the link. */
  readonly linkLabel: string;
  /** Fill and text pairing. */
  readonly tone: BannerTone;
  /**
   * Whether the visitor can dismiss it. Persisted in `sessionStorage`, so a
   * dismissal lasts the visit rather than reappearing on every navigation.
   */
  readonly dismissible: boolean;
}

/**
 * Banner defaults — disabled, with the copy pre-filled.
 *
 * Pre-filling the text rather than leaving it empty means turning the banner on
 * is one click and produces something sensible, instead of requiring the
 * operator to write copy before they can see what the banner looks like.
 */
export const BANNER: BannerContent = {
  enabled: false,
  message: 'Now accepting in-house training bookings for Q1.',
  linkHref: '#contact',
  linkLabel: 'Request a proposal',
  tone: 'orange',
  dismissible: true,
};
