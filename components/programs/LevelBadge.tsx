/**
 * LevelBadge — the tier pill on Program E's module cards.
 *
 * ── Four tiers, one ramp ────────────────────────────────────────────
 * The seven modules progress Foundation → Bridge → Advanced → Application.
 * The badge carries that progression in its fill: neutral grey, soft yellow,
 * orange, deep orange. Reading top to bottom the badges get heavier, which is
 * the point — a visitor scanning the grid should be able to see the ordering
 * without reading four different words.
 *
 * ── Why a `label` prop as well as `tier` ────────────────────────────
 * The source PDF writes the tier in caps ("FOUNDATION") and that string is
 * already in `program-e-content.ts` as `badge`. Taking the label means the
 * page renders the source spelling verbatim instead of a re-cased copy, and
 * `tierFromLabel` keeps the class selection in one place rather than making
 * every caller remember the lowercase key.
 *
 * ── Not interactive ─────────────────────────────────────────────────
 * This is a label, not a control: no handler, no `role`, no `tabIndex`. It
 * therefore has no hover or focus state — adding one would promise an
 * interaction that does not exist.
 */

/** The four capability tiers, in ascending order. */
export type LevelTier = 'foundation' | 'bridge' | 'advanced' | 'application';

/**
 * Source label → tier key.
 *
 * A map rather than `label.toLowerCase()` so an unexpected string fails
 * visibly below instead of silently producing a class that does not exist.
 */
const TIER_BY_LABEL: Record<string, LevelTier> = {
  FOUNDATION: 'foundation',
  BRIDGE: 'bridge',
  ADVANCED: 'advanced',
  APPLICATION: 'application',
};

/** Resolve a source label to a tier, or `null` if it is not one of the four. */
export function tierFromLabel(label: string): LevelTier | null {
  return TIER_BY_LABEL[label.trim().toUpperCase()] ?? null;
}

export interface LevelBadgeProps {
  /** Explicit tier. Takes precedence over `label`. */
  tier?: LevelTier;
  /** Source label, e.g. `"FOUNDATION"`. Used when `tier` is omitted. */
  label?: string;
  /** Extra classes on the pill. */
  className?: string;
}

export default function LevelBadge({ tier, label, className = '' }: LevelBadgeProps) {
  const resolved = tier ?? (label ? tierFromLabel(label) : null);

  /*
   * An unrecognised label renders nothing rather than a grey fallback pill: a
   * badge with no tier is a design decision nobody has made, and silently
   * dressing it as "Foundation" would misreport a module's level.
   */
  if (!resolved) return null;

  return (
    <span className={`level-badge level-badge-${resolved} ${className}`.trim()}>
      {label ?? resolved}
    </span>
  );
}
