/**
 * Testimonials — types and accessors.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THIS MOVED OUT OF `components/testimonials/testimonials-content.ts`
 *
 *  The three quotes used to be a `readonly` array baked into a component module.
 *  That is fine for copy an operator never touches, and wrong for a list the
 *  client wants to add to, reorder and publish from the panel: a `readonly`
 *  array cannot be edited, and the editor needs a stable identity per entry to
 *  reorder without re-pairing quotes with the wrong names.
 *
 *  So the data lives in `content/testimonials.json`, with an `id` and an `order`,
 *  and this module reads it. The component module keeps only the section's own
 *  copy — the eyebrow, the title, the caption.
 *
 *  ── The publish gate ────────────────────────────────────────────────────
 *  `published` defaults to FALSE for every entry, including the shipped
 *  placeholders. A testimonial is a quotation attributed to a named person at a
 *  named company, and publishing one that person never gave is a legal exposure
 *  under Malaysian consumer-protection and trade-description rules. Shipping them
 *  hidden means the failure mode is an empty section, not a fabricated claim.
 * ════════════════════════════════════════════════════════════════════════
 */

import raw from '@/content/testimonials.json';
import { isValidModuleSlug } from '@/lib/modules';

/** One testimonial. */
export interface Testimonial {
  /** Stable identity. Reordering depends on it; see `lib/gallery.ts` for why. */
  readonly id: string;
  /** Full name, as the person is willing to be quoted. */
  readonly name: string;
  /** Job title at the time of the training. */
  readonly role: string;
  readonly company: string;
  /** Two to three sentences. */
  readonly quote: string;
  /** Optional headshot path. Empty string renders an initial-letter tile. */
  readonly photo: string;
  /** Which module this relates to, or null. Must be a real module slug. */
  readonly moduleSlug: string | null;
  /** Rendered on the public site only when true. */
  readonly published: boolean;
  /** Sort position. Ascending. */
  readonly order: number;
}

const FILE = raw as { testimonials: Testimonial[] };

/** Every testimonial, in order — published or not. For the admin panel. */
export function allTestimonials(): Testimonial[] {
  return [...FILE.testimonials].sort((a, b) => a.order - b.order);
}

/**
 * The testimonials the public site may render.
 *
 * ── Why an unpublished entry is dropped rather than shown dimmed ────────
 * There is no "draft" state on a public page. An entry is either safe to
 * attribute or it is not, so the filter is binary and the component decides
 * whether to render the section at all from the length of this result.
 * @returns {Testimonial[]}
 */
export function publishedTestimonials(): Testimonial[] {
  return allTestimonials().filter((t) => t.published);
}

/** Whether the section has anything to show. */
export function hasPublishedTestimonials(): boolean {
  return publishedTestimonials().length > 0;
}

/**
 * A new, empty testimonial.
 *
 * `published: false` and `moduleSlug: null` on purpose: a blank entry must not
 * be able to appear on the site because someone forgot to untick a box.
 * @param {number} order position to insert at
 * @returns {Testimonial}
 */
export function blankTestimonial(order: number): Testimonial {
  return {
    id: `testimonial-${Date.now().toString(36)}`,
    name: '',
    role: '',
    company: '',
    quote: '',
    photo: '',
    moduleSlug: null,
    published: false,
    order,
  };
}

/**
 * Validate one testimonial before it is saved.
 *
 * `name` and `quote` are required; everything else may be empty. The module slug
 * is checked against the manifest rather than accepted as a free string, so a
 * typo cannot attach a quote to a module that does not exist.
 * @param {Testimonial} entry
 * @returns {string} '' when acceptable
 */
export function validateTestimonial(entry: Testimonial): string {
  if (!entry.id.trim()) return 'The entry has no id.';
  if (!entry.name.trim()) return 'A name is required.';
  if (!entry.quote.trim()) return 'The quote is required.';

  if (entry.moduleSlug !== null && !isValidModuleSlug(entry.moduleSlug)) {
    return `"${entry.moduleSlug}" is not one of the training modules.`;
  }

  if (!Number.isInteger(entry.order) || entry.order < 0) {
    return 'The order must be a whole number from 0.';
  }

  return '';
}
