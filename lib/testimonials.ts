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

/**
 * How many position dots the slider draws at once.
 *
 * ── Why there is a cap on DOTS when there is none on ENTRIES ────────────
 * The list is unlimited: the operator can publish three testimonials or three
 * hundred, and the row renders every one of them. The dot strip is the only
 * part of the slider that grows with the count, and it grows in the worst
 * possible way — 300 ten-pixel dots do not wrap into something readable, they
 * become a grey smear wider than the viewport that no one can aim at.
 *
 * So past this many entries the strip shows a WINDOW of dots around the
 * current card instead of one per card. Nothing is hidden from the visitor:
 * the card count and the position are still announced ("Testimonial 87 of
 * 300"), the arrows and the scroll row reach every entry, and the dots stay a
 * control that can be hit with a thumb.
 */
export const MAX_SLIDER_DOTS = 9;

/**
 * The dots to draw for a list of `total` entries, centred on `active`.
 *
 * Pure, so the component and the checks cannot disagree about what is shown.
 * Below the cap every entry gets a dot, in order, so the common case is exactly
 * what it always was.
 *
 * Above it the window is clamped to the ends rather than being allowed to run
 * past them: at entry 0 the visitor sees dots 0–8, at the last entry they see
 * the final nine, and in between the active dot sits in the middle. A window
 * that slid off the end would either draw fewer dots or none.
 *
 * @param {number} total how many entries the row holds
 * @param {number} active zero-based index of the card currently in view
 * @param {number} [max] how many dots may be drawn at once
 * @returns {number[]} the entry indexes to draw, ascending
 */
export function dotWindow(
  total: number,
  active: number,
  max: number = MAX_SLIDER_DOTS,
): number[] {
  const count = Math.max(0, Math.floor(total));
  if (count === 0) return [];

  const size = Math.max(1, Math.floor(max));
  if (count <= size) return Array.from({ length: count }, (_, i) => i);

  /* Clamp the active index first: a scroll position can briefly exceed the
     list while a card is being removed, and an out-of-range centre would
     produce a window hanging off the end. */
  const centre = Math.min(count - 1, Math.max(0, Math.floor(active)));
  const half = Math.floor(size / 2);
  const start = Math.min(Math.max(0, centre - half), count - size);

  return Array.from({ length: size }, (_, i) => start + i);
}

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
   * Whether the person's permission to publish this is actually held.
   *
   * ── Why this is a stored field and not a tick-box in the operator's head ─
   * A published testimonial is a quotation attributed to a named person, often
   * with their face, often naming their employer. Publishing one without
   * permission is not a style problem, it is three separate causes of action in
   * Malaysia:
   *
   *   • **Defamation** (Defamation Act 1957) — attributing a statement to a
   *     named person that they did not make. Truth is a defence to a claim BY
   *     that person only if they said it; a fabricated endorsement fails it.
   *   • **PDPA 2010, s.6** — a photograph of an identifiable person is personal
   *     data, and processing it needs consent for that purpose. s.19 requires
   *     the data to be kept accurate, and a withdrawn consent must be actionable.
   *   • **Consumer Protection Act 1999, s.10** — a false or misleading
   *     representation about a service. An invented testimonial is exactly that,
   *     and the *company* named is a second potential claimant.
   *
   * So the permission is recorded per entry, and `validateTestimonial` refuses
   * to publish without it. The field exists to make the operator state a fact
   * once, at the moment they publish, rather than remember it later.
   */
  readonly consentOnFile: boolean;
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
type StoredTestimonial = Omit<Testimonial, 'images' | 'consentOnFile'> & {
  images?: TestimonialImage[];
  /**
   * Absent on any entry written before the permission gate existed. Read as
   * `false` by `upgradeTestimonial` — the safe default for a permission nobody
   * recorded.
   */
  consentOnFile?: boolean;
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
  /*
   * `consentOnFile` defaults to FALSE for every entry that predates it.
   *
   * The safe default for a missing permission is "not held". An entry written
   * before this field existed was published on the strength of a conversation
   * nobody recorded, and assuming consent would keep exactly the exposure the
   * field was added to close. Defaulting to false means such an entry stays
   * visible (the publish flag is untouched) but must be re-affirmed the next
   * time the operator saves it — which is the moment they can actually check.
   */
  const consentOnFile = entry.consentOnFile === true;

  if (Array.isArray(entry.images)) {
    return {
      ...entry,
      consentOnFile,
      images: entry.images.map((image) => makeImage(image)),
    };
  }

  const legacy = entry.screenshot?.trim() ?? '';
  return {
    ...entry,
    consentOnFile,
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
    /*
     * The id is the only thing that identifies an entry through a reorder, a
     * publish toggle and a delete, and the route rejects a duplicate id. A bare
     * timestamp was not unique: the bulk upload loop creates one entry per file
     * inside a single millisecond, so a batch of screenshots produced the same
     * id for several entries and every save after the first was refused.
     *
     * A random suffix costs nothing and makes collision a non-event.
     */
    id: `testimonial-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    role: '',
    company: '',
    quote: '',
    photo: '',
    images: [],
    moduleSlug: null,
    published: false,
    /*
     * A new entry starts with no recorded permission, for the same reason it
     * starts unpublished: both are the safe state, and both require a
     * deliberate act by the operator before anything reaches the page.
     */
    consentOnFile: false,
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
    /*
     * ── The permission gate ─────────────────────────────────────────────
     * This is the one check that exists for a legal reason rather than a
     * presentational one, and it is deliberately FIRST so the message is the
     * one the operator reads.
     *
     * Publishing a quotation attributed to a named person, with their face and
     * often their employer's name, without their permission is a defamation
     * exposure (a statement they did not make), a PDPA s.6 exposure (their
     * photograph and name processed without consent) and a CPA s.10 exposure (a
     * misleading representation about the service). Each is a separate claim,
     * and the company named is a second potential claimant.
     *
     * The panel cannot verify permission — only the operator can. What it can
     * do is refuse to publish until they have stated that they hold it, so the
     * question is asked once, at the moment it matters, instead of relying on
     * someone remembering a conversation.
     */
    if (!entry.consentOnFile) {
      return 'This entry cannot be published until you confirm you hold the person’s permission to quote them. Tick “Permission on file” and save.';
    }

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
