/**
 * The 7 training modules — the single source of truth.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  SOURCE: 0_7_Module_SIM_Professional_Training.pdf
 *
 *  This list is authoritative and is NOT to be inferred from anything else in
 *  the repository. Before this file existed the site carried five modules under
 *  different slugs (`fundamentals`, `materials`, `process-development`,
 *  `defect-troubleshooting`, `pathway`), which do not match the PDF: it defines
 *  seven, and one of them (`pathway` → `m7-process-portability`) is a different
 *  subject entirely.
 *
 *  So `content/modules.json` is the one list, and everything that needs the
 *  modules reads it: the admin Overview, the admin dropdown, the per-module
 *  image manager and the public Programs menu. The earlier revision had the
 *  brand id in `components/about/*` and the nav id in `components/nav/*`, which
 *  is two places for one fact.
 *
 *  ── Why `legacySlug` exists ─────────────────────────────────────────────
 *  Images already uploaded under the old slugs must keep working. The legacy id
 *  is retained per module so the migration can find them and so an old anchor
 *  (`#pathway`) can still resolve.
 * ════════════════════════════════════════════════════════════════════════
 */

import raw from '@/content/modules.json';

/** One module, as defined by the source PDF. */
export interface TrainingModule {
  /** Canonical slug. Used for R2 keys, admin URLs and the public anchor. */
  readonly slug: string;
  /** Full title, verbatim from the PDF. */
  readonly title: string;
  /** Duration in days. */
  readonly days: number;
  /** Capability level: Foundation, Bridge, Advanced or Application. */
  readonly level: 'Foundation' | 'Bridge' | 'Advanced' | 'Application';
  /** The id this module had before `modules.json` existed, if any. */
  readonly legacySlug: string | null;
}

interface ModulesFile {
  readonly totalDays: number;
  readonly modules: readonly TrainingModule[];
}

const FILE = raw as ModulesFile;

/** Every module, in PDF order. This order is meaningful and must not change. */
export const MODULES: readonly TrainingModule[] = FILE.modules;

/** Total training days across the seven modules. */
export const TOTAL_DAYS = FILE.totalDays;

/** Canonical slugs, in order. */
export function moduleSlugs(): string[] {
  return MODULES.map((m) => m.slug);
}

/**
 * Look up a module by canonical slug.
 * @param {string} slug
 * @returns {TrainingModule|undefined}
 */
export function findModule(slug: string): TrainingModule | undefined {
  return MODULES.find((m) => m.slug === slug);
}

/**
 * Whether a slug names a real module.
 *
 * Used to reject an empty or unknown slug at every entry point — the bug that
 * produced "Unknown module ''" was a caller sending nothing and the route
 * treating the empty string as a valid lookup.
 * @param {string} slug
 * @returns {boolean}
 */
export function isValidModuleSlug(slug: string): boolean {
  return MODULES.some((m) => m.slug === slug);
}

/**
 * Resolve a slug that may be a legacy id to its canonical module.
 *
 * The public anchors and any bookmarked admin URL predate the rename, so a
 * request for `pathway` must still find `m7-process-portability` rather than
 * 404.
 * @param {string} slug canonical or legacy
 * @returns {TrainingModule|undefined}
 */
export function resolveModuleSlug(slug: string): TrainingModule | undefined {
  return MODULES.find((m) => m.slug === slug || m.legacySlug === slug);
}

/** The four photo categories, in the order the panel shows them. */
export const PHOTO_CATEGORIES = [
  { slug: 'lecture', label: 'Lecture' },
  { slug: 'practical', label: 'Practical' },
  { slug: 'discussion', label: 'Discussion' },
  { slug: 'presentation', label: 'Presentation' },
] as const;

/** A photo category slug. */
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number]['slug'];

/** Category slugs, in order. */
export function categorySlugs(): PhotoCategory[] {
  return PHOTO_CATEGORIES.map((c) => c.slug);
}

/**
 * Whether a string names a real category.
 * @param {string} slug
 * @returns {boolean}
 */
export function isValidCategory(slug: string): slug is PhotoCategory {
  return PHOTO_CATEGORIES.some((c) => c.slug === slug);
}
