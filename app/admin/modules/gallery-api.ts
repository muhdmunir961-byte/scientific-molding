'use client';

/**
 * Client-side gallery API.
 *
 * ── Why this is a module and not inline fetches ─────────────────────────
 * The per-module manager calls six operations (read, upload, reorder, edit,
 * delete, plus the summary read) and every one of them has to surface an error
 * the same way. Inlining them would mean six places deciding what "failed"
 * looks like, and the operator would see a different message shape depending on
 * which button they pressed.
 *
 * Every function returns the same result envelope: `{ ok, data?, error? }`. The
 * caller never has to catch — a network failure arrives as `ok: false` with a
 * readable message, which is what a component can actually render.
 */

import type { GalleryImage, ModuleGallery } from '@/lib/gallery';

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Perform a request and normalise the response.
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

/** A module's gallery. */
export function fetchGallery(moduleSlug: string): Promise<ApiResult<{ gallery: ModuleGallery }>> {
  return request(`/api/admin/module-photos?module=${encodeURIComponent(moduleSlug)}`);
}

/** Every module's photo counts, for the Overview. */
export function fetchAllGalleries(): Promise<ApiResult<{ modules: Record<string, ModuleGallery> }>> {
  return request('/api/admin/module-photos');
}

/**
 * Upload files into one category.
 *
 * The body is multipart because the payload is bytes, and the field is repeated
 * (`files`) rather than indexed so the server can use `getAll` — an indexed name
 * scheme would need the server to know how many to expect.
 * @param {string} moduleSlug
 * @param {string} category
 * @param {File[]} files
 * @returns {Promise<ApiResult<{ uploaded: number; errors: string[]; images: GalleryImage[]; message: string }>>}
 */
export function uploadPhotos(
  moduleSlug: string,
  category: string,
  files: File[],
): Promise<
  ApiResult<{ uploaded: number; errors: string[]; images: GalleryImage[]; message: string }>
> {
  const form = new FormData();
  form.set('module', moduleSlug);
  form.set('category', category);
  for (const file of files) form.append('files', file);

  return request('/api/admin/module-photos', { method: 'POST', body: form });
}

/** Reorder a category, by key in the new order. */
export function reorderPhotos(
  moduleSlug: string,
  category: string,
  keys: string[],
): Promise<ApiResult<{ images: GalleryImage[]; message: string }>> {
  return request('/api/admin/module-photos', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module: moduleSlug, category, keys }),
  });
}

/** Edit one photo's caption and alt text. */
export function editPhoto(
  moduleSlug: string,
  category: string,
  key: string,
  fields: { caption?: string; alt?: string },
): Promise<ApiResult<{ images: GalleryImage[]; message: string }>> {
  return request('/api/admin/module-photos', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module: moduleSlug, category, key, ...fields }),
  });
}

/** Remove one photo. */
export function deletePhoto(
  moduleSlug: string,
  category: string,
  key: string,
): Promise<ApiResult<{ images: GalleryImage[]; objectDeleted: boolean; message: string }>> {
  return request('/api/admin/module-photos', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module: moduleSlug, category, key }),
  });
}
