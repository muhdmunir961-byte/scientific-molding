'use client';

/**
 * CountUp — a numeral that counts to its value on first view.
 *
 * The hook (`./useCountUp`) owns the mechanism; this owns the markup contract,
 * which is the part that has to be identical everywhere a figure appears:
 *
 *   - `<span className="tabular-nums">` so the digits never reflow as they
 *     change width. Without it a counter visibly jitters, which is why the
 *     scale table requires tabular figures on all numbers.
 *   - `aria-hidden` on the animated element, with the accessible name supplied
 *     by the caller's own `<dt>` or `<span className="sr-only">`. A value that
 *     changes 120 times must never be an accessible name.
 *   - The server renders the FINAL value, not 0. A visitor with JavaScript
 *     disabled, or one who arrives before hydration, sees the real figure
 *     rather than a zero that never moves.
 */

import { useCountUp } from './useCountUp';

export interface CountUpProps {
  /** The display string, e.g. "07", "17+", "500+". */
  value: string;
  /**
   * Accent tone. Maps to a `.hero-stat-numeral[data-tone]` rule, which owns the
   * fill and the label colour TOGETHER — see the docblock there for why the
   * pairing is not two independent props.
   */
  tone?: string;
  /**
   * Extra classes for the numeral. Colour and size are the caller's, because
   * a hero figure and a track-record figure are different ranks.
   */
  className?: string;
}

export default function CountUp({
  value,
  tone,
  className = '',
}: CountUpProps) {
  const refs = useCountUp(value);

  return (
    <span
      ref={refs.root}
      className={`hero-stat-numeral ${className}`}
      {...(tone ? { 'data-tone': tone } : {})}
    >
      <span ref={refs.value} aria-hidden="true" className="tabular-nums">
        {value}
      </span>
    </span>
  );
}
