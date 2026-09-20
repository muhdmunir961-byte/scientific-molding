/**
 * BeforeAfterTable — the "Before / After" comparison block.
 *
 * PRD Section 13.2: "Before/After split panel (two-column desktop → stacked
 * mobile)".
 * PRD Section 5.3: each program has a `"Before / After" comparison block`.
 * PRD Section 13.1 tokens: "Neutral (Before) — Light warm grey `#F3F1EC`" and
 * "Success/positive (After) — Soft yellow tint `#FFF6DD`".
 *
 * ── Why a real <table> ──────────────────────────────────────────────
 * This is genuinely tabular: two rows of paired states across the same
 * dimensions. A `<table>` gives a screen reader row and column counts, header
 * association via `<th scope>`, and table-navigation keystrokes. A grid of
 * divs would lose all of it. The Web Interface Guidelines are explicit: use
 * semantic HTML before reaching for ARIA.
 *
 * `scope="col"` on the two headers is what lets a screen reader announce
 * "After, Reduced scrap rate" rather than just reading cells in sequence.
 *
 * ── Responsive: stacking without breaking the table ─────────────────
 * PRD 13.2 asks for "two-column desktop → stacked mobile". The naive approach
 * is `display: block` on the table, which destroys its accessibility semantics
 * in most screen readers. Instead the table keeps its structure and only the
 * *visual* layout changes: below 640px the two columns stack vertically inside
 * each row using CSS grid on the `<tr>`.
 *
 * A caption is included but visually hidden: it names the table for assistive
 * tech without repeating the section heading on screen.
 */

export interface BeforeAfterRow {
  /** The "before" state — the current pain. */
  readonly before: string;
  /** The "after" state — the outcome once fixed. */
  readonly after: string;
}

export interface BeforeAfterTableProps {
  /** Names the table for assistive tech. Visually hidden. */
  caption: string;
  /** Header for the left column. */
  beforeLabel?: string;
  /** Header for the right column. */
  afterLabel?: string;
  rows: readonly BeforeAfterRow[];
}

export default function BeforeAfterTable({
  caption,
  beforeLabel = 'Before',
  afterLabel = 'After',
  rows,
}: BeforeAfterTableProps) {
  return (
    <div className="w-full overflow-x-auto beforeafter-container">
      <table className="before-after-table w-full border-collapse text-left">
        <caption className="sr-only">{caption}</caption>

        <thead>
          <tr className="beforeafter-header-row">
            <th
              scope="col"
              className="px-6 py-4 beforeafter-header-cell program-beforeafter-header"
            >
              {beforeLabel}
            </th>
            <th
              scope="col"
              className="px-6 py-4 beforeafter-header-cell program-beforeafter-header after"
            >
              {afterLabel}
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr key={row.before} className={`before-after-row ${i % 2 === 0 ? 'even' : 'odd'}`}>
              <td
                className="px-6 py-6 align-top text-[0.9375rem] leading-relaxed beforeafter-cell"
              >
                {row.before}
              </td>
              <td
                className="px-6 py-6 align-top text-[0.9375rem] font-semibold leading-relaxed beforeafter-cell program-beforeafter-after"
              >
                {row.after}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
