/**
 * Testimonials admin API.
 *
 *   GET    /api/admin/testimonials    every entry, published or not, + settings
 *   POST   /api/admin/testimonials    add one
 *   PATCH  /api/admin/testimonials    edit one, reorder, or publish
 *   DELETE /api/admin/testimonials    remove one
 *   PUT    /api/admin/testimonials    replace the section settings
 *
 * ── Why the whole list is saved on every change ─────────────────────────
 * Add, delete and reorder all shift positions. A partial write cannot express
 * "this moved to index 0" without also rewriting its neighbours, so a single
 * write of the ordered list is both simpler and the only correct option.
 *
 * ── Why validation happens before anything is written ───────────────────
 * A testimonial is a quotation attributed to a named person. An entry with no
 * name or no quote is not a draft — it is a malformed claim, and it must not
 * reach the file where a publish toggle could later expose it.
 */

import { NextResponse } from 'next/server';

import { requireSession, fail } from '@/lib/admin/guard';
import {
  readTestimonials,
  readTestimonialsSettings,
  saveTestimonials,
} from '@/lib/admin/testimonials-store';
import {
  blankTestimonial,
  DEFAULT_TESTIMONIALS_SETTINGS,
  makeImage,
  SETTINGS_LIMITS,
  validateTestimonial,
  type ImageAspect,
  type Testimonial,
  type TestimonialCrop,
  type TestimonialImage,
  type TestimonialsSettings,
} from '@/lib/testimonials';

export const runtime = 'nodejs';

/**
 * Coerce an unknown value into a crop, or null.
 *
 * Only the four known numeric keys are taken, so a caller cannot smuggle extra
 * properties into the committed file. `null` and a missing value both mean "no
 * crop" — the whole image.
 * @param {unknown} raw
 * @returns {TestimonialCrop|null}
 */
function toCrop(raw: unknown): TestimonialCrop | null {
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

  // A crop made only of NaN is not a crop; treat it as absent rather than
  // failing every save for an entry whose screenshot was never set.
  if (Object.values(crop).some((v) => !Number.isFinite(v))) return null;

  return crop;
}

/** Whether a value is one of the four frame shapes. */
function isAspect(value: unknown): value is ImageAspect {
  return value === 'auto' || value === 'square' || value === 'portrait' || value === 'landscape';
}

/**
 * Coerce an unknown value into an images array.
 *
 * Only the known keys of each image are taken, for the same reason the entry
 * itself is built field by field: a caller must not be able to write arbitrary
 * keys into the committed file. There is deliberately no length cap — the
 * operator decides how many captures an entry needs.
 * @param {unknown} raw
 * @returns {TestimonialImage[]}
 */
function toImages(raw: unknown): TestimonialImage[] {
  if (!Array.isArray(raw)) return [];

  const images: TestimonialImage[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const source = item as Record<string, unknown>;
    const src = typeof source.src === 'string' ? source.src : '';

    /*
     * An entry with no file is dropped rather than kept as a blank frame. The
     * panel adds an image by uploading, so a src-less record can only come from
     * a hand-edited file or a failed request.
     */
    if (src.trim() === '') continue;

    images.push(
      makeImage({
        id: typeof source.id === 'string' ? source.id : undefined,
        src,
        caption: typeof source.caption === 'string' ? source.caption : '',
        crop: toCrop(source.crop),
        aspect: isAspect(source.aspect) ? source.aspect : 'auto',
      }),
    );
  }

  return images;
}

/**
 * Coerce an unknown payload into a Testimonial, taking only known fields.
 *
 * Explicit field by field rather than a spread: a caller could otherwise write
 * arbitrary keys into the committed file, and the public component would carry
 * them into the render.
 * @param {Record<string, unknown>} raw
 * @param {number} fallbackOrder
 * @returns {Testimonial}
 */
function toTestimonial(raw: Record<string, unknown>, fallbackOrder: number): Testimonial {
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const moduleSlug = str(raw.moduleSlug).trim();

  return {
    id: str(raw.id).trim() || blankTestimonial(fallbackOrder).id,
    name: str(raw.name),
    role: str(raw.role),
    company: str(raw.company),
    quote: str(raw.quote),
    photo: str(raw.photo),
    images: toImages(raw.images),
    moduleSlug: moduleSlug === '' ? null : moduleSlug,
    published: raw.published === true,
    order: Number.isInteger(raw.order) ? (raw.order as number) : fallbackOrder,
  };
}

/**
 * Coerce an unknown payload into settings, rejecting anything out of range.
 *
 * Returns a message rather than a value on failure, so the route can name the
 * field the operator has to fix. Silently clamping in the writer would let a
 * typo look like it worked.
 * @param {Record<string, unknown>} raw
 * @returns {TestimonialsSettings|string}
 */
function toSettings(raw: Record<string, unknown>): TestimonialsSettings | string {
  const bool = (value: unknown, fallback: boolean) =>
    typeof value === 'boolean' ? value : fallback;

  const number = (value: unknown, label: string, min: number, max: number): number | string => {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return `${label} must be a number.`;
    if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
    return Math.round(n);
  };

  const seconds = number(
    raw.autoplaySeconds ?? DEFAULT_TESTIMONIALS_SETTINGS.autoplaySeconds,
    'Autoplay seconds',
    SETTINGS_LIMITS.autoplaySeconds.min,
    SETTINGS_LIMITS.autoplaySeconds.max,
  );
  if (typeof seconds === 'string') return seconds;

  const cardWidth = number(
    raw.cardWidth ?? DEFAULT_TESTIMONIALS_SETTINGS.cardWidth,
    'Card width',
    SETTINGS_LIMITS.cardWidth.min,
    SETTINGS_LIMITS.cardWidth.max,
  );
  if (typeof cardWidth === 'string') return cardWidth;

  return {
    layout: raw.layout === 'grid' ? 'grid' : 'slider',
    autoplay: bool(raw.autoplay, DEFAULT_TESTIMONIALS_SETTINGS.autoplay),
    autoplaySeconds: seconds,
    arrows: bool(raw.arrows, DEFAULT_TESTIMONIALS_SETTINGS.arrows),
    dots: bool(raw.dots, DEFAULT_TESTIMONIALS_SETTINGS.dots),
    lightbox: bool(raw.lightbox, DEFAULT_TESTIMONIALS_SETTINGS.lightbox),
    cardWidth,
    imageAspect: isAspect(raw.imageAspect)
      ? raw.imageAspect
      : DEFAULT_TESTIMONIALS_SETTINGS.imageAspect,
  };
}

/** GET — every testimonial and the section settings, for the panel. */
export async function GET(): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  const stored = await readTestimonialsSettings();

  return NextResponse.json({
    ok: true,
    data: {
      testimonials: await readTestimonials(),
      settings: stored ?? DEFAULT_TESTIMONIALS_SETTINGS,
      /** Whether the file actually contains settings, or these are defaults. */
      settingsSaved: stored !== null,
    },
  });
}

/**
 * POST — add one entry.
 * @param {Request} request JSON with the new entry's fields
 */
export async function POST(request: Request): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Expected a JSON body.');
  }

  const existing = await readTestimonials();
  const entry = toTestimonial(payload, existing.length);

  const problem = validateTestimonial(entry);
  if (problem) return fail(problem);

  if (existing.some((t) => t.id === entry.id)) {
    return fail('An entry with that id already exists.');
  }

  // Appended, never inserted: a new entry appearing in the middle of a published
  // set would move quotes the operator did not touch.
  const next = [...existing, { ...entry, order: existing.length }];
  const result = await saveTestimonials(next, 'add one');

  return NextResponse.json({
    ok: true,
    data: { testimonials: next, storage: result.storage, message: result.message },
  });
}

/**
 * PATCH — edit one entry, or reorder the list.
 * @param {Request} request JSON with `order` (an id array) or `id` (an edit)
 */
export async function PATCH(request: Request): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Expected a JSON body.');
  }

  const existing = await readTestimonials();

  /*
   * A full reorder: `order` is an array of ids in the new sequence. Every
   * existing id must appear exactly once, so a dropped id cannot silently delete
   * a testimonial through what looked like a reorder.
   */
  if (Array.isArray(payload.order)) {
    const ids = payload.order.map((v) => String(v));
    const byId = new Map(existing.map((t) => [t.id, t]));

    if (ids.length !== existing.length || ids.some((id) => !byId.has(id))) {
      return fail('The new order does not match the testimonials in the list.');
    }

    const next = ids.map((id, index) => ({ ...(byId.get(id) as Testimonial), order: index }));
    const result = await saveTestimonials(next, 'reorder');

    return NextResponse.json({
      ok: true,
      data: { testimonials: next, storage: result.storage, message: result.message },
    });
  }

  const id = String(payload.id ?? '').trim();
  if (!id) return fail('No testimonial was specified.');

  const target = existing.find((t) => t.id === id);
  if (!target) return fail('That testimonial is not in the list.', 404);

  const merged = toTestimonial({ ...target, ...payload, id }, target.order);
  const problem = validateTestimonial(merged);
  if (problem) return fail(problem);

  const next = existing.map((t) => (t.id === id ? merged : t));
  const result = await saveTestimonials(next, 'edit one');

  return NextResponse.json({
    ok: true,
    data: { testimonials: next, storage: result.storage, message: result.message },
  });
}

/**
 * DELETE — remove one entry.
 * @param {Request} request JSON with `id`
 */
export async function DELETE(request: Request): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Expected a JSON body.');
  }

  const id = String(payload.id ?? '').trim();
  if (!id) return fail('No testimonial was specified.');

  const existing = await readTestimonials();
  if (!existing.some((t) => t.id === id)) {
    return fail('That testimonial is not in the list.', 404);
  }

  // Close the order gap, so the list never has holes to reason about.
  const next = existing
    .filter((t) => t.id !== id)
    .map((t, index) => ({ ...t, order: index }));

  const result = await saveTestimonials(next, 'remove one');

  return NextResponse.json({
    ok: true,
    data: { testimonials: next, storage: result.storage, message: result.message },
  });
}

/**
 * PUT — replace the section settings.
 *
 * Settings are replaced rather than merged: the panel always sends the complete
 * form, and a merge would leave a value the operator had just cleared in place.
 * @param {Request} request JSON with the settings fields
 */
export async function PUT(request: Request): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Expected a JSON body.');
  }

  const settings = toSettings(payload);
  if (typeof settings === 'string') return fail(settings);

  const existing = await readTestimonials();
  const result = await saveTestimonials(existing, 'update section settings', settings);

  return NextResponse.json({
    ok: true,
    data: { settings, storage: result.storage, message: result.message },
  });
}
