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

/**
 * A crop of a screenshot, as fractions of the ORIGINAL image.
 *
 * ── Why fractions rather than pixels ────────────────────────────────────
 * The stored screenshot is never re-encoded: the original bytes are uploaded and
 * served as-is. A crop in pixels would therefore be tied to one exact file, and
 * re-uploading a screenshot at a different size would move the crop onto the
 * wrong part of the image. Fractions survive any resize, and they are what the
 * renderer needs anyway — it scales the image inside the frame.
 *
 * `x + w` and `y + h` must stay within 0..1. A full image is `0, 0, 1, 1`.
 */
export interface TestimonialCrop {
  /** Left edge, 0..1. */
  readonly x: number;
  /** Top edge, 0..1. */
  readonly y: number;
  /** Width, > 0..1. */
  readonly w: number;
  /** Height, > 0..1. */
  readonly h: number;
}

/** The whole image — no cropping. */
export const FULL_CROP: TestimonialCrop = { x: 0, y: 0, w: 1, h: 1 };

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
  /**
   * Optional screenshot of the feedback as the person actually gave it — a
   * WhatsApp or email capture. Shown at its own aspect ratio, never forced into
   * a square, because the point of it is that it is unedited evidence.
   */
  readonly screenshot: string;
  /** Optional caption printed under the screenshot. */
  readonly caption: string;
  /** Crop applied to `screenshot`. `null` means show the whole image. */
  readonly crop: TestimonialCrop | null;
  /** Which module this relates to, or null. Must be a real module slug. */
  readonly moduleSlug: string | null;
  /** Rendered on the public site only when true. */
  readonly published: boolean;
  /** Sort position. Ascending. */
  readonly order: number;
}

/**
 * The file's shape as it may exist on disk.
 *
 * `screenshot` and `crop` are optional here on purpose: entries written before
 * those fields existed do not have them, and the committed JSON is edited by the
 * panel rather than migrated. `allTestimonials()` fills the gaps.
 */
type StoredTestimonial = Omit<Testimonial, 'screenshot' | 'caption' | 'crop'> & {
  screenshot?: string;
  caption?: string;
  crop?: TestimonialCrop | null;
};

const FILE = raw as { testimonials: StoredTestimonial[] };

/**
 * Every testimonial, in order — published or not. For the admin panel.
 *
 * Defaults are filled here rather than at every call site: `screenshot` and
 * `crop` were added after the first entries were written, so an older file has
 * neither key. Reading them as `undefined` would make every consumer guard
 * against a shape the type says cannot happen.
 */
export function allTestimonials(): Testimonial[] {
  return [...FILE.testimonials]
    .sort((a, b) => a.order - b.order)
    .map((entry) => ({
      ...entry,
      screenshot: entry.screenshot ?? '',
      caption: entry.caption ?? '',
      crop: entry.crop ?? null,
    }));
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
    screenshot: '',
    caption: '',
    crop: null,
    moduleSlug: null,
    published: false,
    order,
  };
}

/**
 * Validate one testimonial before it is saved.
 *
 * ── Why every content field is optional ─────────────────────────────────
 * A testimonial can arrive as a screenshot with no typed quote, a quote with no
 * name, or just a logo and a sentence. Requiring `name` and `quote` forced the
 * operator to invent filler to satisfy the form, which is worse than an
 * incomplete entry they can come back to.
 *
 * What is NOT optional is that a PUBLISHED entry has something to show. An
 * empty card is a visible defect, so the gate moves from "the fields are filled"
 * to "there is something on the card".
 *
 * The module slug is still checked against the manifest rather than accepted as
 * a free string, so a typo cannot attach an entry to a module that does not
 * exist.
 * @param {Testimonial} entry
 * @returns {string} '' when acceptable
 */
export function validateTestimonial(entry: Testimonial): string {
  if (!entry.id.trim()) return 'The entry has no id.';

  /*
   * An unpublished entry may be completely blank — that is a draft being set up
   * across several saves. Only publishing demands content, because only a
   * published entry reaches the page.
   */
  if (entry.published) {
    const hasSomething =
      entry.screenshot.trim() !== '' ||
      entry.quote.trim() !== '' ||
      entry.name.trim() !== '' ||
      entry.caption.trim() !== '';

    if (!hasSomething) {
      return 'A published entry needs at least a screenshot, a quote, a name or a caption.';
    }
  }

  if (entry.moduleSlug !== null && !isValidModuleSlug(entry.moduleSlug)) {
    return `"${entry.moduleSlug}" is not one of the training modules.`;
  }

  if (!Number.isInteger(entry.order) || entry.order < 0) {
    return 'The order must be a whole number from 0.';
  }

  /*
   * A crop that runs past the image edge would render as blank space in the
   * frame, and one with zero width or height would make the frame collapse.
   * Rejected here so the public page can trust the values it reads.
   */
  if (entry.crop !== null) {
    const { x, y, w, h } = entry.crop;
    const finite = [x, y, w, h].every((v) => typeof v === 'number' && Number.isFinite(v));
    if (!finite) return 'The crop values must be numbers.';
    if (w <= 0 || h <= 0) return 'The crop must have a width and a height.';
    if (x < 0 || y < 0 || x + w > 1.0001 || y + h > 1.0001) {
      return 'The crop must stay inside the image.';
    }
  }

  return '';
}
