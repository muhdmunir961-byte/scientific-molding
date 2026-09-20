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
      <h2 className="mt-16 program-modules-heading">
        {heading}
        {note && (
          <span className="ml-2 program-modules-note">
            ({note})
          </span>
        )}
      </h2>

      <ol className="mt-8 program-modules-list list-none p-0">
        {items.map((item, i) => (
          <li
            key={item.title}
            className={`flex flex-col gap-4 p-8 sm:flex-row sm:items-start sm:gap-8 program-module-card-${i % 2 === 0 ? 'orange' : 'yellow'}`}
          >
            <span
              aria-hidden="true"
              className={`program-module-tile-${i % 2 === 0 ? 'orange' : 'yellow'} flex h-10 w-10 shrink-0 items-center justify-center text-sm font-extrabold leading-none program-module-numeral`}
            >
              {String(i + 1).padStart(2, '0')}
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-extrabold uppercase leading-snug program-module-title">
                {item.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed program-module-problem">
                {item.problem}
              </p>
              <p className="mt-2 text-[0.9375rem] font-semibold leading-relaxed program-module-outcome">
                {item.outcome}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </ScrollReveal>
  );
}
