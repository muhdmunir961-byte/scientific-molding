/**
 * Shared crop and framing types.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THIS IS ITS OWN MODULE
 *
 *  Testimonials and the module galleries both show operator photographs, and
 *  both need the same two things: a hand-drawn crop and a preset frame shape.
 *  Keeping two copies of the type would let one drift — a crop saved by the
 *  testimonial editor would stop being readable by the gallery renderer, and the
 *  failure would be a silently uncropped image rather than an error.
 *
 *  So the shape and the arithmetic live here once, and both features import it.
 * ════════════════════════════════════════════════════════════════════════
 */

/**
 * A crop, as fractions of the ORIGINAL image.
 *
 * ── Why fractions rather than pixels ────────────────────────────────────
 * Uploaded files are stored byte-for-byte and never re-encoded, so a crop in
 * pixels would be tied to one exact file. Replacing an image at a different
 * resolution would move the crop onto the wrong part of it. Fractions survive
 * any resize, and they are what the renderer needs anyway — it scales the image
 * inside the frame.
 *
 * `x + w` and `y + h` must stay within 0..1. A full image is `0, 0, 1, 1`.
 */
export interface ImageCrop {
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
export const FULL_CROP: ImageCrop = { x: 0, y: 0, w: 1, h: 1 };

/**
 * How an image is fitted into its frame when nobody has cropped it by hand.
 *
 * `auto` keeps the image's own shape, so nothing is hidden by default. The other
 * three force a consistent frame across a set, which is what makes a mixed batch
 * (a phone capture beside a camera photo) look deliberate.
 */
export type ImageAspect = 'auto' | 'square' | 'portrait' | 'landscape';

/** The ratio each non-auto aspect resolves to. */
export const ASPECT_RATIOS: Record<Exclude<ImageAspect, 'auto'>, number> = {
  square: 1,
  portrait: 4 / 5,
  landscape: 16 / 9,
};

/** Whether a value is one of the four frame shapes. */
export function isAspect(value: unknown): value is ImageAspect {
  return value === 'auto' || value === 'square' || value === 'portrait' || value === 'landscape';
}

/**
 * Coerce an unknown value into a crop, or null.
 *
 * Only the four known numeric keys are taken, so a caller cannot smuggle extra
 * properties into a committed file. A value that is not four finite numbers is
 * treated as "no crop" rather than as an error: the committed JSON is also
 * edited by hand, and one malformed crop must not stop every save.
 * @param {unknown} raw
 * @returns {ImageCrop|null}
 */
export function toCrop(raw: unknown): ImageCrop | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;

  const source = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === 'number' ? v : Number(v));

  const crop = {
    x: num(source.x),
    y: num(source.y),
    w: num(source.w),
    h: num(source.h),
  };

  if (Object.values(crop).some((v) => !Number.isFinite(v))) return null;
  return crop;
}

/**
 * Check a crop is renderable, returning a message when it is not.
 *
 * A crop past the image edge renders as blank space, and one with zero width
 * makes the frame collapse. Checked at the boundary so the public page can trust
 * what it reads.
 * @param {ImageCrop} crop
 * @param {string} label which image, for the message
 * @returns {string} '' when acceptable
 */
export function validateCrop(crop: ImageCrop, label: string): string {
  const { x, y, w, h } = crop;
  const finite = [x, y, w, h].every((v) => typeof v === 'number' && Number.isFinite(v));
  if (!finite) return `${label}: the crop values must be numbers.`;
  if (w <= 0 || h <= 0) return `${label}: the crop needs a width and a height.`;
  if (x < 0 || y < 0 || x + w > 1.0001 || y + h > 1.0001) {
    return `${label}: the crop must stay inside the image.`;
  }
  return '';
}

/**
 * The frame's aspect ratio, and the CSS that shows the chosen region.
 *
 * ── Why this is one function ────────────────────────────────────────────
 * The frame and the image must agree. Computing the ratio in one place and the
 * offsets in another is how a crop ends up shifted by a few percent — visible as
 * a sliver of the neighbouring message in a screenshot.
 *
 * @param {ImageCrop|null} crop hand-drawn crop, or null
 * @param {ImageAspect} aspect preset, used only when there is no crop
 * @returns {{ ratio: string; fitted: boolean; imageStyle: Record<string,string|number> }}
 */
export function frameStyle(
  crop: ImageCrop | null,
  aspect: ImageAspect,
): { ratio: string; fitted: boolean; imageStyle: Record<string, string | number> } {
  const region = crop ?? FULL_CROP;
  const width = region.w > 0 ? region.w : 1;
  const height = region.h > 0 ? region.h : 1;

  /*
   * A hand-drawn crop wins over the preset: the operator has already said
   * exactly what they want shown, and a preset that clipped more of it would
   * silently undo that work.
   */
  const forced = crop === null && aspect !== 'auto' ? ASPECT_RATIOS[aspect] : null;

  if (forced !== null) {
    return {
      ratio: `${forced}`,
      fitted: true,
      imageStyle: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      },
    };
  }

  return {
    ratio: `${width} / ${height}`,
    fitted: false,
    imageStyle: {
      position: 'absolute',
      width: `${100 / width}%`,
      height: `${100 / height}%`,
      left: `${(-region.x * 100) / width}%`,
      top: `${(-region.y * 100) / height}%`,
      maxWidth: 'none',
    },
  };
}