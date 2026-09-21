'use client';

/**
 * useCountUp — animate a numeral from 0 to its value, once, on first view.
 *
 * ── Why not Framer Motion ───────────────────────────────────────────
 * `framer-motion` is already a dependency, but its `useSpring`/`animate` values
 * drive a React render per frame. A counter is a number becoming a string, so
 * the only thing that changes per frame is one text node — a `requestAnimationFrame`
 * loop that writes `textContent` directly is both cheaper and simpler than
 * pushing 120 renders through the tree.
 *
 * ── Why the value is a string in and a string out ───────────────────
 * The page's figures are not numbers. "07" carries a deliberate leading zero,
 * "17+" carries a suffix, "500+" carries a suffix. Parsing them would strip
 * exactly the characters that make them the PRD's figures, so the hook splits
 * the string into a numeric part and a suffix, animates the numeric part and
 * re-attaches the suffix. "07" therefore counts to 7 and renders "07"; "17+"
 * counts to 17 and renders "17+".
 *
 * ── Reduced motion ──────────────────────────────────────────────────
 * `prefers-reduced-motion: reduce` skips the animation and renders the final
 * value on the first frame. The number is the content; the movement is
 * decoration, and a user who has asked for less movement should get the number
 * immediately rather than a two-second ramp.
 *
 * ── Accessibility ───────────────────────────────────────────────────
 * The loop writes `el.textContent`, which mutates the DOM node directly. The
 * element is `aria-hidden` at every call site (the accessible name is on the
 * sibling `<dt>`), so a screen reader is never asked to re-announce a value
 * that is changing 120 times.
 */

import { useEffect, useRef } from 'react';

/** How the value string divides into a count and a fixed suffix. */
interface CountParts {
  /** The digits to count to, or `null` when the string is not countable. */
  readonly target: number | null;
  /** Digits that must keep their leading zeros, e.g. "07". */
  readonly pad: number;
  /** Everything after the digits, e.g. "+". */
  readonly suffix: string;
}

/**
 * Split a displayed figure into the part that counts and the part that does not.
 *
 * @param value the display string, e.g. "07", "17+", "500+"
 * @returns the parsed parts; `target` is `null` when nothing is countable
 */
function parseParts(value: string): CountParts {
  const match = value.match(/^(\d+)(.*)$/);
  const digits = match?.[1];
  const tail = match?.[2];

  if (digits === undefined || tail === undefined) {
    return { target: null, pad: 0, suffix: value };
  }

  return {
    target: Number(digits),
    /* The original digit count, so "07" renders "07" and not "7". */
    pad: digits.length,
    suffix: tail,
  };
}

/** Format the current frame's value the way the source string was written. */
function format(current: number, pad: number, suffix: string): string {
  return `${String(current).padStart(pad, '0')}${suffix}`;
}

/** Duration of the ramp. Two seconds, per the brief — one value, one place. */
const COUNT_MS = 2000;

/**
 * A ref to attach to the numeral element, and the ref for the wrapper that is
 * observed.
 *
 * Returned as one object so a caller cannot pass the observer ref for the wrong
 * element — the numeral must be inside the observed subtree or the counter fires
 * before it is on screen.
 */
export interface CountUpRefs {
  readonly root: React.RefObject<HTMLSpanElement | null>;
  readonly value: React.RefObject<HTMLSpanElement | null>;
}

/**
 * @param value the display string from the content module
 * @returns refs to spread onto the observed wrapper and the numeral
 */
export function useCountUp(value: string): CountUpRefs {
  const root = useRef<HTMLSpanElement | null>(null);
  const display = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = display.current;
    if (!el) return;

    const parts = parseParts(value);

    /* Not a countable figure ("N/A", "—"): leave the text exactly as rendered
       by React and do not observe anything. */
    if (parts.target === null) return;

    const settle = () => {
      el.textContent = value;
    };

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      settle();
      return;
    }

    const host = root.current;
    if (!host) return;

    let frame = 0;
    let started = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (started) return;
        if (!entries.some((entry) => entry.isIntersecting)) return;
        started = true;

        const start = performance.now();

        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / COUNT_MS);
          /* Ease-out cubic. The value decelerates into its target, which is
             what stops the last few digits from looking like a stutter. */
          const eased = 1 - Math.pow(1 - t, 3);

          el.textContent = format(
            Math.round(eased * (parts.target as number)),
            parts.pad,
            parts.suffix,
          );

          if (t < 1) frame = requestAnimationFrame(tick);
          else settle();
        };

        frame = requestAnimationFrame(tick);
      },
      /* Fire when a quarter of the strip is visible, so the count is already
         running as the visitor reads the first figure rather than starting
         after they have scrolled past it. */
      { threshold: 0.25 },
    );

    observer.observe(host);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value]);

  return { root, value: display };
}
