/**
 * Testimonials admin API.
 *
 *   GET    /api/admin/testimonials    every entry, published or not
 *   POST   /api/admin/testimonials    add one
 *   PATCH  /api/admin/testimonials    edit one, reorder, or publish
 *   DELETE /api/admin/testimonials    remove one
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
import { readTestimonials, saveTestimonials } from '@/lib/admin/testimonials-store';
import { blankTestimonial, validateTestimonial, type Testimonial } from '@/lib/testimonials';

export const runtime = 'nodejs';

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
    moduleSlug: moduleSlug === '' ? null : moduleSlug,
    published: raw.published === true,
    order: Number.isInteger(raw.order) ? (raw.order as number) : fallbackOrder,
  };
}

/** GET — every testimonial, for the panel. */
export async function GET(): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  return NextResponse.json({ ok: true, data: { testimonials: await readTestimonials() } });
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
