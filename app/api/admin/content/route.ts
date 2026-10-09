/**
 * Admin content API.
 *
 *   GET  /api/admin/content?group=<id>   read a group's current values
 *   POST /api/admin/content               save a group
 *
 * ── Why the group id is a parameter rather than a path segment ──────────
 * A dynamic segment (`/api/admin/content/[group]`) would be the more RESTful
 * shape, but it requires a nested route directory and a second params type for
 * no behavioural difference at this size. The id is validated against the
 * schema either way, so an unknown id is rejected identically.
 */

import { NextResponse } from 'next/server';

import { readGroup, saveGroup } from '@/lib/admin/content-store';
import { requireSession, fail } from '@/lib/admin/guard';
import { CONTENT_GROUPS, findGroup, validateValues } from '@/lib/admin/schema';

export const runtime = 'nodejs';

/** Keep bodies small — the largest legitimate payload is 14 short strings. */
const MAX_BODY_BYTES = 64 * 1024;

/**
 * List the editable groups, without their field values.
 * @returns {Promise<NextResponse>}
 */
export async function GET(request: Request): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  const id = new URL(request.url).searchParams.get('group') ?? '';

  if (!id) {
    return NextResponse.json({
      ok: true,
      data: {
        groups: CONTENT_GROUPS.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
        })),
      },
    });
  }

  const group = findGroup(id);
  if (!group) return fail(`Unknown content group "${id}".`, 404);

  const values = await readGroup(group);
  return NextResponse.json({
    ok: true,
    data: {
      id: group.id,
      title: group.title,
      description: group.description,
      fields: group.fields,
      values,
    },
  });
}

/**
 * Save a group.
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

  let payload: { group?: unknown; values?: unknown };
  try {
    payload = JSON.parse(raw) as { group?: unknown; values?: unknown };
  } catch {
    return fail('Expected a JSON body.');
  }

  const id = typeof payload.group === 'string' ? payload.group : '';
  const group = findGroup(id);
  if (!group) return fail(`Unknown content group "${id}".`, 404);

  const values =
    payload.values && typeof payload.values === 'object'
      ? (payload.values as Record<string, unknown>)
      : {};

  const checked = validateValues(group, values);
  if (!checked.ok) {
    return NextResponse.json(
      { ok: false, error: 'Please correct the highlighted fields.', errors: checked.errors },
      { status: 400 },
    );
  }

  try {
    const result = await saveGroup(group, checked.data);
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
