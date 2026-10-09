/**
 * Override resolution — the bridge between the admin panel and the components.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY A GENERIC OVERRIDE INSTEAD OF ONE FIELD LIST PER MODULE
 *
 *  The first revision described every editable field as a `FieldSpec` in
 *  `lib/admin/schema.ts`. That works for four flat string groups and does not
 *  scale: the content surface is roughly 125 exports across 14 modules, most of
 *  them arrays of objects (`PROGRAM_A_PROBLEMS`, `TRAINER_CREDENTIALS`) or
 *  nested objects (`CONTACT_LABELS`, `WHY_HERO`).
 *
 *  Hand-describing each one would be:
 *    - ~1000 lines of field specs, each of which could drift from its module;
 *    - a form, a validator and a writer per shape, all three kept in step by
 *      hand, with silent divergence as the failure mode.
 *
 *  So the panel edits the module's actual VALUE, serialised as JSON, and this
 *  file merges the saved overrides back over the defaults. One writer, one
 *  reader, one merge — and a field cannot exist in the editor without it
 *  existing in the data, because they are the same object.
 *
 *  ── How a component consumes this ────────────────────────────────────
 *      import { withOverrides } from '@/lib/admin/overrides';
 *      import { HERO_COPY } from './hero-content';
 *
 *      const hero = withOverrides('hero', HERO_COPY);
 *
 *  `withOverrides` is a plain function, not a hook: it runs on the server
 *  during render, which is where the content is needed. The saved values arrive
 *  as a module import, so they are part of the build and there is no runtime
 *  fetch, no loading state, and no client bundle cost.
 * ════════════════════════════════════════════════════════════════════════
 */

import { OVERRIDES } from '@/components/generated/content-overrides.generated';

/** A JSON value: what a content module's export serialises to. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** The saved override map, keyed by `<module>.<export>`. */
type OverrideMap = Record<string, JsonValue>;

/**
 * The generated override map.
 *
 * `content-overrides.generated.ts` is written by the admin panel and committed
 * through the GitHub API. It is imported directly rather than guarded with
 * `require` inside `try/catch` (which the image module needed) because this
 * file is ALWAYS present — the panel's generator and the repository's checked-in
 * copy are the same file, and `scripts/check-admin.mjs` asserts it exists.
 *
 * A missing import would therefore be a genuine build error worth failing on,
 * not a state to paper over.
 */
const saved: OverrideMap = (OVERRIDES ?? {}) as OverrideMap;

/**
 * Merge saved overrides over a module's default export.
 *
 * ── Merge semantics, and why they are shallow for arrays ────────────────
 * Objects merge key by key, so adding a field to a content module does not
 * require re-saving every override — an untouched key keeps its default.
 *
 * Arrays are replaced wholesale, never merged element-wise. Element-wise
 * merging needs a stable identity per element to know which saved entry maps to
 * which default, and these arrays carry titles rather than ids. Guessing by
 * index would silently re-pair content when an item is inserted, which is a far
 * worse failure than an override that replaces the list.
 *
 * @param {string} key `<module>.<export>`, e.g. `hero.HERO_COPY`
 * @param {T} fallback the hand-written default from the content module
 * @returns {T} the default with any saved override merged over it
 * @template T
 */
export function withOverrides<T>(key: string, fallback: T): T {
  const override = saved[key];
  if (override === undefined) return fallback;

  // An array or a scalar override replaces the default outright.
  if (Array.isArray(override) || typeof override !== 'object' || override === null) {
    return override as T;
  }

  // A scalar default cannot be merged with an object override.
  if (typeof fallback !== 'object' || fallback === null || Array.isArray(fallback)) {
    return override as T;
  }

  return deepMerge(fallback, override) as T;
}

/**
 * Merge `patch` over `base`, one level deep per object, arrays replaced.
 *
 * `undefined` in the patch never overwrites: JSON has no `undefined`, so a
 * present-but-undefined key would mean the serialiser dropped it, and treating
 * that as "clear this field" would erase content on a round trip.
 *
 * @param {unknown} base
 * @param {unknown} patch
 * @returns {unknown}
 */
function deepMerge(base: unknown, patch: unknown): unknown {
  if (patch === undefined) return base;
  if (Array.isArray(patch)) return patch;

  if (
    typeof base === 'object' &&
    base !== null &&
    !Array.isArray(base) &&
    typeof patch === 'object' &&
    patch !== null
  ) {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
      out[k] = deepMerge((base as Record<string, unknown>)[k], v);
    }
    return out;
  }

  return patch;
}

/**
 * Whether any override has been saved.
 *
 * Used by the admin overview to report whether the panel has ever written
 * anything, which distinguishes "no overrides yet" from "overrides failing to
 * load" — two states that otherwise look identical from the site.
 * @returns {boolean}
 */
export function hasOverrides(): boolean {
  return Object.keys(saved).length > 0;
}
