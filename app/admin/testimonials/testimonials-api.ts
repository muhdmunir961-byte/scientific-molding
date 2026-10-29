'use client';

/**
 * Testimonials admin API — client side.
 *
 * Same envelope as the gallery client: every call returns `{ ok, data?, error? }`
 * so a component never has to catch, and a network failure is a message it can
 * render rather than an exception it must guess at.
 */

import type { Testimonial } from '@/lib/testimonials';

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

interface TestimonialsPayload {
  testimonials: Testimonial[];
  message?: string;
}

/**
 * @param {string} url
 * @param {RequestInit} [init]
 * @returns {Promise<ApiResult<T>>}
 * @template T
 */
async function request<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, init);
    const body = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      data?: T;
      error?: string;
    };

    if (!response.ok || !body.ok) {
      return { ok: false, error: body.error ?? `Request failed (${response.status}).` };
    }
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: 'Could not reach the server.' };
  }
}

/** Every testimonial, published or not. */
export function fetchTestimonials(): Promise<ApiResult<TestimonialsPayload>> {
  return request('/api/admin/testimonials');
}

/** Add one entry at the end of the list. */
export function addTestimonial(
  draft: Partial<Testimonial>,
): Promise<ApiResult<TestimonialsPayload>> {
  return request('/api/admin/testimonials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
}

/** Edit one entry, including its publish toggle. */
export function editTestimonial(
  entry: Testimonial,
): Promise<ApiResult<TestimonialsPayload>> {
  return request('/api/admin/testimonials', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
}

/** Reorder the list, by id in the new sequence. */
export function reorderTestimonials(
  ids: string[],
): Promise<ApiResult<TestimonialsPayload>> {
  return request('/api/admin/testimonials', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order: ids }),
  });
}

/** Remove one entry. */
export function deleteTestimonial(id: string): Promise<ApiResult<TestimonialsPayload>> {
  return request('/api/admin/testimonials', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
}

export interface UploadedPhoto {
  key: string;
  path: string;
  storage: 'r2' | 'local';
  message: string;
}

/**
 * Upload one headshot and get back the path to write into the entry.
 *
 * The bytes are stored here; writing the path into the entry is a separate
 * `editTestimonial` call, because an upload can succeed while the save fails and
 * the operator needs to be told which of the two happened.
 *
 * @param {File} file
 * @returns {Promise<ApiResult<UploadedPhoto>>}
 */
export function uploadTestimonialPhoto(
  file: File,
  kind: 'headshot' | 'screenshot' = 'headshot',
): Promise<ApiResult<UploadedPhoto>> {
  const form = new FormData();
  form.set('file', file);
  form.set('kind', kind);

  return request('/api/admin/testimonials/photo', { method: 'POST', body: form });
}

export interface BulkUploadResult extends TestimonialsPayload {
  /** How many entries were created. */
  created: number;
  /** Per-file failures, so a partial success is never reported as a full one. */
  errors: string[];
}

/**
 * Upload many screenshots at once, creating one unpublished entry per file.
 *
 * One request rather than one per file: a batch of eleven captures would
 * otherwise mean eleven commits and eleven deploys.
 *
 * @param {File[]} files
 * @returns {Promise<ApiResult<BulkUploadResult>>}
 */
export function bulkUploadScreenshots(files: File[]): Promise<ApiResult<BulkUploadResult>> {
  const form = new FormData();
  for (const file of files) form.append('files', file);

  return request('/api/admin/testimonials/bulk', { method: 'POST', body: form });
}
