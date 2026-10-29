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
import {
  ASPECT_RATIOS,
  FULL_CROP,
  isAspect,
  validateCrop,
  type ImageAspect,
  type ImageCrop,
} from '@/lib/image-crop';

/**
 * The crop type is shared with the module galleries — see `lib/image-crop.ts`
 * for why there is one definition rather than two.
 */
export type TestimonialCrop = ImageCrop;
export { FULL_CROP, ASPECT_RATIOS, type ImageAspect };

/** One image attached to a testimonial. */
export interface TestimonialImage {
  /** Stable identity, so reordering cannot re-pair a crop with the wrong file. */
  readonly id: string;
  /** The stored path or URL. */
  readonly src: string;
  /** Printed under this image. */
  readonly caption: string;
  /** A hand-drawn crop. `null` means "fit automatically". */
  readonly crop: TestimonialCrop | null;
  /** The frame shape used when there is no hand-drawn crop. */
  readonly aspect: ImageAspect;
}

/**
 * Build an image record with every field defaulted.
 * @param {Partial<TestimonialImage> & { src: string }} input
 * @returns {TestimonialImage}
 */
export function makeImage(input: Partial<TestimonialImage> & { src: string }): TestimonialImage {
  return {
    id: input.id ?? `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    src: input.src,
    caption: input.caption ?? '',
    crop: input.crop ?? null,
    aspect: input.aspect ?? 'auto',
  };
}

/**
 * How the section behaves, as opposed to what it contains.
 *
 * ── Why these live in the data file and not in a component constant ─────
 * Every one of them is a presentation decision the operator may want to change
 * without a code edit: whether the row scrolls itself, how fast, whether there
 * are arrows, whether clicking a screenshot opens it larger. Putting them in
 * `testimonials-content.ts` would mean a deploy per toggle; here the panel can
 * change them like any other content.
 */
export interface TestimonialsSettings {
  /** `slider` scrolls sideways; `grid` wraps into rows. */
  readonly layout: 'slider' | 'grid';
  /** Whether the row advances on its own. */
  readonly autoplay: boolean;
  /** Seconds to rest on each card before advancing. */
  readonly autoplaySeconds: number;
  /** Show the previous/next buttons. */
  readonly arrows: boolean;
  /** Show the position dots under the row. */
  readonly dots: boolean;
  /** Clicking a screenshot opens it full size. */
  readonly lightbox: boolean;
  /** Card width on a wide screen, in pixels. */
  readonly cardWidth: number;
  /**
   * The default frame for an image that has no hand-drawn crop.
   * `auto` keeps each image's own shape.
   */
  readonly imageAspect: ImageAspect;
}

/** The settings a fresh install behaves with. */
export const DEFAULT_TESTIMONIALS_SETTINGS: TestimonialsSettings = {
  layout: 'slider',
  autoplay: true,
  autoplaySeconds: 5,
  arrows: true,
  dots: true,
  lightbox: true,
  cardWidth: 420,
  imageAspect: 'auto',
};

/** Bounds the panel enforces, and the reader clamps to. */
export const SETTINGS_LIMITS = {
  autoplaySeconds: { min: 2, max: 20 },
  cardWidth: { min: 260, max: 720 },
} as const;

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
   * Every screenshot attached to this entry — a WhatsApp or email capture.
   *
   * ── Why an array with no limit ──────────────────────────────────────────
   * A real feedback thread is often several captures: the message, the reply, a
   * follow-up. Capping it at one forced the operator to choose which part of the
   * evidence to drop, and stacking them into one file loses the individual
   * captions. Each image carries its own crop and caption and has a stable id,
   * so reordering cannot pair a crop with the wrong file.
   *
   * There is no maximum. The panel warns past a point where the card becomes a
   * scroll marathon, but it does not refuse the operator.
   */
  readonly images: TestimonialImage[];
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
 * ── Why three generations of shape are accepted here ────────────────────
 * This file is edited by the panel and committed to git, so old copies exist on
 * every branch and in every deployment. Refusing an older shape would mean a
 * migration step between deploys, and a failed migration takes the section down.
 *
 *   v1  `photo` only.
 *   v2  one `screenshot` + one `caption` + one `crop`.
 *   v3  an `images` array, any length, each with its own crop and caption.
 *
 * `allTestimonials()` upgrades v1 and v2 on read, so the rest of the codebase
 * only ever sees v3.
 */
type StoredTestimonial = Omit<Testimonial, 'images'> & {
  images?: TestimonialImage[];
  /** v2 fields, still read so nothing is lost on the way through. */
  screenshot?: string;
  caption?: string;
  crop?: TestimonialCrop | null;
};

const FILE = raw as { testimonials: StoredTestimonial[] };

/**
 * The section settings, clamped into their allowed ranges.
 *
 * ── Why the reader clamps and the writer validates ──────────────────────
 * The writer rejects a bad value so the operator sees the error. The reader
 * clamps anyway, because the committed JSON is also edited by hand and by older
 * builds — a `autoplaySeconds: 0` there would produce a row that never rests,
 * and a `cardWidth: 5000` would produce one card wider than the page.
 * @returns {TestimonialsSettings}
 */
export function testimonialsSettings(): TestimonialsSettings {
  const stored = (raw as { settings?: Partial<TestimonialsSettings> }).settings ?? {};
  const limits = SETTINGS_LIMITS;

  const clamp = (value: unknown, fallback: number, min: number, max: number): number => {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
  };

  const bool = (value: unknown, fallback: boolean): boolean =>
    typeof value === 'boolean' ? value : fallback;

  return {
    layout: stored.layout === 'grid' ? 'grid' : 'slider',
    autoplay: bool(stored.autoplay, DEFAULT_TESTIMONIALS_SETTINGS.autoplay),
    autoplaySeconds: clamp(
      stored.autoplaySeconds,
      DEFAULT_TESTIMONIALS_SETTINGS.autoplaySeconds,
      limits.autoplaySeconds.min,
      limits.autoplaySeconds.max,
    ),
    arrows: bool(stored.arrows, DEFAULT_TESTIMONIALS_SETTINGS.arrows),
    dots: bool(stored.dots, DEFAULT_TESTIMONIALS_SETTINGS.dots),
    lightbox: bool(stored.lightbox, DEFAULT_TESTIMONIALS_SETTINGS.lightbox),
    cardWidth: clamp(
      stored.cardWidth,
      DEFAULT_TESTIMONIALS_SETTINGS.cardWidth,
      limits.cardWidth.min,
      limits.cardWidth.max,
    ),
    imageAspect: isAspect(stored.imageAspect)
      ? stored.imageAspect
      : DEFAULT_TESTIMONIALS_SETTINGS.imageAspect,
  };
}

/**
 * Upgrade one stored entry to the current shape.
 *
 * A v2 entry had a single `screenshot`; it becomes a one-item `images` array so
 * the renderer has one shape to handle. The old fields are read but never
 * written back, so the file converges on v3 the next time the panel saves.
 * @param {StoredTestimonial} entry
 * @returns {Testimonial}
 */
export function upgradeTestimonial(entry: StoredTestimonial): Testimonial {
  if (Array.isArray(entry.images)) {
    return {
      ...entry,
      images: entry.images.map((image) => makeImage(image)),
    };
  }

  const legacy = entry.screenshot?.trim() ?? '';
  return {
    ...entry,
    images: legacy
      ? [
          makeImage({
            src: legacy,
            caption: entry.caption ?? '',
            crop: entry.crop ?? null,
          }),
        ]
      : [],
  };
}

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
    .map(upgradeTestimonial);
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
    images: [],
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
      entry.images.length > 0 ||
      entry.quote.trim() !== '' ||
      entry.name.trim() !== '';

    if (!hasSomething) {
      return 'A published entry needs at least a screenshot, a quote or a name.';
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
   * Rejected per image so the public page can trust the values it reads, and so
   * the message names which image is wrong rather than the whole entry.
   */
  for (const [index, image] of entry.images.entries()) {
    if (image.src.trim() === '') {
      return `Image ${index + 1} has no file. Remove it or upload a file for it.`;
    }

    if (image.crop === null) continue;

    const problem = validateCrop(image.crop, `Image ${index + 1}`);
    if (problem) return problem;
  }

  return '';
}
