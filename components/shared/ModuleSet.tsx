/**
 * ModuleSet — a second module block for programs that carry two.
 *
 * Program B is the only one: it has the four core modules from the proposal and
 * a further four marked "(from wP)". `ProgramSection` exposes a single
 * `modulesSecondary` slot, so the second set is passed to it as a child rather
 * than widening the shared API to an array for one program's edge case.
 *
 * The markup and the numeral treatment match `ProgramSection`'s block exactly,
 * so the two sets read as the same component even though one is a prop and one
 * is a child.
 */

import ScrollReveal from '../about/ScrollReveal';

export interface ModuleSetItem {
  readonly title: string;
  readonly problem: string;
  readonly outcome: string;
}

export interface ModuleSetProps {
  heading: string;
  /** Optional provenance note rendered in parentheses after the heading. */
  note?: string;
  items: readonly ModuleSetItem[];
}

export default function ModuleSet({ heading, note, items }: ModuleSetProps) {
  return (
    <ScrollReveal>
      <h2 className="mt-12 program-modules-heading">
        {heading}
        {note && (
          <span className="ml-2 program-modules-note">
            ({note})
          </span>
        )}
      </h2>

      <ol className="program-modules-list">
        {items.map((item, i) => (
          <li key={item.title}>
            <span
              aria-hidden="true"
              className={`program-module-tile-${i % 2 === 0 ? 'orange' : 'yellow'}`}
            >
              {String(i + 1).padStart(2, '0')}
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="program-module-title">{item.title}</h3>
              <p className="program-module-problem">{item.problem}</p>
              <p className="program-module-outcome">{item.outcome}</p>
            </div>
          </li>
        ))}
      </ol>
    </ScrollReveal>
  );
}
