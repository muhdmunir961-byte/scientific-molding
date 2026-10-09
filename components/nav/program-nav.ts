/**
 * The nav's programme links, derived from the authoritative module list.
 *
 * ── Why this is derived and not written out ─────────────────────────────
 * `content/modules.json` is the one list of the seven training modules, sourced
 * from the client PDF. The nav previously carried its own five-entry array with
 * different slugs, which is how the site ended up one module short of the
 * client's document. Deriving from the manifest means the menu cannot disagree
 * with the PDF, and adding a module is one edit in one file.
 *
 * ── Why the label is short and the detail is separate ───────────────────
 * The dropdown needs two things per row: something to click and something that
 * says what the module is. The full PDF title ("Processability of Thermoplastics
 * in Injection Molding") is too long for a menu row, so it is shown beneath the
 * short name along with the duration and level. Both come from the manifest —
 * nothing here is written by hand, so the menu cannot describe a module the
 * client did not define.
 */

import { MODULES, type TrainingModule } from '@/lib/modules';
import type { NavItem } from './nav-content';

/** A dropdown row: an anchor plus the module's own facts as its description. */
export interface ProgramNavItem extends NavItem {
  /** Full title from the source PDF. */
  readonly detail: string;
  /** Duration in days. */
  readonly days: number;
  /** Capability level. */
  readonly level: TrainingModule['level'];
  /**
   * Whether a section with this id exists on the page.
   *
   * False for a module the PDF defines but the site has no section for. The menu
   * still lists it — the client asked for seven — but renders it as text rather
   * than as a link, so a visitor is not sent to nothing.
   */
  readonly published: boolean;
}

/**
 * Slugs that have a section on the page.
 *
 * The programme bodies shipped as A–E and answer to both their own id
 * (`fundamentals`) and the canonical slug, via the compatibility anchor in
 * `ProgramHero`. m3 and m5 are defined by the PDF but have no body, so no
 * anchor resolves for them — that is a content decision, not one this file
 * should make by inventing a section.
 */
const PUBLISHED_SLUGS = new Set([
  'm1-fundamental',
  'm2-processability',
  'm4-process-development',
  'm6-defects-troubleshooting',
  'm7-process-portability',
]);

/**
 * A short label for a menu row.
 *
 * The manifest titles are the PDF's own wording and several exceed 40
 * characters, which wraps badly in a 280px dropdown. Rather than invent shorter
 * names, the title is trimmed at a word boundary and the full title is shown
 * underneath — so the menu stays readable without paraphrasing the client.
 * @param {TrainingModule} module
 * @returns {string}
 */
function shortLabel(module: TrainingModule): string {
  const title = module.title;
  if (title.length <= 34) return title;

  const cut = title.slice(0, 34);
  const atSpace = cut.lastIndexOf(' ');
  return `${(atSpace > 12 ? cut.slice(0, atSpace) : cut).trim()}…`;
}

/**
 * The seven modules as nav rows, in manifest order.
 *
 * Each anchors to `#<slug>`. The legacy id is accepted as an alias by
 * `resolveModuleSlug`, so an old bookmark such as `#pathway` still resolves.
 */
export const PROGRAM_ITEMS: readonly ProgramNavItem[] = MODULES.map((module) => ({
  id: module.slug,
  label: shortLabel(module),
  detail: module.title,
  days: module.days,
  level: module.level,
  published: PUBLISHED_SLUGS.has(module.slug),
}));
