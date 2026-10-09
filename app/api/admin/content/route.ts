/**
 * Admin content API.
 *
 *   GET  /api/admin/content?module=<id>   read a module's exports, current values
 *   POST /api/admin/content               save one export's value
 *
 * ── Why the shape is module + export rather than a flat field list ──────
 * See `lib/admin/schema.ts`. The panel edits a module export's actual value as
 * JSON, so the API takes exactly that: a module id, an export name, and the new
 * value. There is no field-level schema to keep in sync with the content module
 * — the content module IS the schema.
 *
 * ── Why a locked module is rejected rather than silently ignored ────────
 * The programme bodies are read-only. A request that tries to write one gets a
 * 403 naming the reason, because a save that reports success and does nothing is
 * the failure mode this whole panel keeps running into.
 */

import { NextResponse } from 'next/server';

import { readOverrides, saveExport, readImagesManifest } from '@/lib/admin/content-store';
import { requireSession, fail } from '@/lib/admin/guard';
import { loadImageManifest, readExport } from '@/lib/admin/registry';
import { MODULES, findAnyModule, overrideKey } from '@/lib/admin/schema';
import type { JsonValue } from '@/lib/admin/overrides';

export const runtime = 'nodejs';

/** Keep bodies small. The largest legitimate export is a programme body. */
const MAX_BODY_BYTES = 512 * 1024;

/**
 * List the editable modules, or read one module's exports.
 * @param {Request} request
 * @returns {Promise<NextResponse>}
 */
export async function GET(request: Request): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  const requested = new URL(request.url).searchParams.get('module');

  /*
   * No `module` parameter at all: this is the list request. Legitimate — the
   * editor's dropdown asks for it on first paint.
   */
  if (requested === null) {
    return NextResponse.json({
      ok: true,
      data: {
        modules: MODULES.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          exports: m.exports.map((e) => ({
            name: e.name,
            label: e.label,
            description: e.description,
          })),
        })),
      },
    });
  }

  /*
   * A `module` parameter that is present but empty is an ERROR, not a list
   * request.
   *
   * The bug this replaces: the Images page asked for `?group=images` — the
   * parameter was renamed from `group` to `module` and that call site was missed
   * — so `module` was absent, the route returned the module LIST, the client
   * found no `values`, and the operator saw `Unknown module ""`. Treating the
   * empty string as "list" would reproduce the same silent confusion, which is
   * why the two cases are now distinguished by `null` versus `''`.
   */
  const id = requested.trim();
  if (!id) {
    return fail('No section was specified. Pick one from the list.', 400);
  }

  const found = findAnyModule(id);
  if (!found) {
    return fail(
      `There is no section called "${id}". It may have been renamed — reload and pick one from the list.`,
      404,
    );
  }

  const saved = await readOverrides();

  /*
   * Load the saved image paths before reading any export, so the Images module
   * resolves to what the site actually renders rather than to the defaults.
   */
  await loadImageManifest(readImagesManifest);

  return NextResponse.json({
    ok: true,
    data: {
      id: found.module.id,
      title: found.module.title,
      description: found.module.description,
      editable: found.editable,
      exports: found.module.exports.map((e) => {
        const key = overrideKey(found.module.id, e.name);
        return {
          name: e.name,
          label: e.label,
          description: e.description,
          locked: e.mode === 'locked' || !found.editable,
          value: readExport(found.module.id, e.name) ?? null,
          hasOverride: Object.prototype.hasOwnProperty.call(saved, key),
        };
      }),
    },
  });
}

/**
 * Save one export's value.
 * @param {Request} request
 * @returns {Promise<NextResponse>}
 */
export async function POST(request: Request): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return fail('The submission is too large.', 413);
  }

  let payload: { module?: unknown; export?: unknown; value?: unknown };
  try {
    payload = JSON.parse(raw) as { module?: unknown; export?: unknown; value?: unknown };
  } catch {
    return fail('Expected a JSON body.');
  }

  const moduleId = typeof payload.module === 'string' ? payload.module : '';
  const exportName = typeof payload.export === 'string' ? payload.export : '';

  const found = findAnyModule(moduleId);
  if (!found) return fail(`Unknown module "${moduleId}".`, 404);
  if (!found.editable) {
    return fail(
      `"${found.module.title}" is read-only. Its text is a verbatim extraction from the customer PDF.`,
      403,
    );
  }

  const spec = found.module.exports.find((e) => e.name === exportName);
  if (!spec) return fail(`Unknown export "${exportName}" in module "${moduleId}".`, 404);
  if (spec.mode === 'locked') {
    return fail(`"${spec.label}" is read-only.`, 403);
  }

  const value = payload.value as JsonValue;
  if (value === undefined) {
    return fail('The submission has no value.');
  }

  try {
    const result = await saveExport(moduleId, exportName, value);
    return NextResponse.json({
      ok: true,
      data: {
        storage: result.storage,
        commit: result.commit ?? null,
        message: result.message,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return fail(`Save failed. ${detail}`, 502);
  }
}
