/**
 * NumberedProblemCard — one client-pain card.
 *
 * PRD Section 13.2: "Problem card (numbered, title, description)".
 * PRD Section 5.3: `"Problems We Solve" grid (numbered client-pain cards)`.
 * PRD Section 13.1: "Numbered badges — Large bold numerals on solid orange or
 * yellow tiles (white numeral text on orange; charcoal numeral text on yellow)."
 *
 * ── Alternating tile colour ─────────────────────────────────────────
 * `index` drives the colour: even-index cards get the orange tile with a white
 * numeral, odd-index cards the yellow tile with charcoal. That is the
 * alternation the Section 13.1 badge rule describes. It also gives a long grid
 * a visual rhythm so the eye can track row boundaries on mobile.
 *
 * ── Markup: <ol> at the parent, <article> here ──────────────────────
 * The parent renders an `<ol>` because the PRD calls these "numbered cards" —
 * the numbering is meaningful order, not decoration. This component is the
 * `<li>` content, so a screen reader announces "list item 3 of 6".
 *
 * ── The numeral is aria-hidden ──────────────────────────────────────
 * The list item position is already announced by the list semantics. Exposing
 * the numeral too would make a screen reader say "list item 3, 03, Copied
 * settings…" — the number twice, once as a graphic.
 */

export interface NumberedProblemCardProps {
  /**
   * 1-based position, used when no explicit `number` is supplied. Shown as a
   * zero-padded numeral ("01" … "06"). The padding is deliberate: mixed digit
   * widths would make a card grid visibly ragged, and it matches the Hero
   * strip's treatment.
   */
  index: number;
  /**
   * Explicit numeral from the source, overriding the auto-padded `index`.
   *
   * Needed because the PDFs number some sets and not others: Program A's
   * problems are unnumbered prose bullets, while its benefits read "01" … "05"
   * in the source. Taking the source value when it exists keeps the extraction
   * byte-for-byte instead of silently renumbering.
   */
  number?: string;
  title: string;
  description: string;
  /** Optional category label, e.g. Program B's "(QUALITY COST)". */
  category?: string;
}

/**
 * Zero-pad a position to two digits.
 * @param position 1-based index
 * @returns the padded numeral, e.g. "03"
 */
function pad(position: number): string {
  return String(position).padStart(2, '0');
}

export default function NumberedProblemCard({
  index,
  number,
  title,
  description,
  category,
}: NumberedProblemCardProps) {
  const isOrange = index % 2 === 1;

  return (
    <article
      className="program-problem-card flex flex-col p-8"
    >
      <span
        aria-hidden="true"
        className={`program-problem-tile-${isOrange ? 'orange' : 'yellow'} mb-4 flex h-16 w-16 items-center justify-center text-xl font-extrabold leading-none program-problem-numeral`}
      >
        {number ?? pad(index)}
      </span>

      <h3 className="program-problem-title text-lg font-bold leading-snug">
        {title}
      </h3>

      {category && (
        <p className="mt-2 program-problem-category text-xs font-bold uppercase tracking-[0.12em]">
          {category}
        </p>
      )}

      <p className="mt-2 program-problem-description text-[0.9375rem] leading-relaxed [text-wrap:pretty]">
        {description}
      </p>
    </article>
  );
}
