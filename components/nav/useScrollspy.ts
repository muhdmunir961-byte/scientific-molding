'use client';

/**
 * useScrollspy — which section is currently "active", for nav highlighting.
 *
 * ── Why IntersectionObserver and not a scroll handler ───────────────
 * The obvious implementation is `window.addEventListener('scroll', …)` and then
 * `getBoundingClientRect()` for every section on every event. That forces a
 * style recalculation on each frame and reads layout in a callback that fires
 * far more often than the value changes — a classic scroll-jank pattern.
 * `IntersectionObserver` is driven by the compositor, coalesces its own
 * callbacks, and needs no per-frame work at all.
 *
 * ── The rootMargin ──────────────────────────────────────────────────
 * `-{TOP}px 0px -60% 0px` shrinks the observation root to a horizontal band
 * starting just below the sticky header and ending 60% down the viewport. With
 * that band, a section counts as active once its top edge passes *under the
 * header* — not when it merely touches the bottom of the screen, which would
 * flip the highlight a full screen too early.
 *
 * ── Why the set of intersecting ids, not the last entry ─────────────
 * An observer callback reports only the entries that *changed*. Reading
 * `entries[0]` alone is ambiguous — several sections can be intersecting the
 * band at once during a fast scroll, and the reported order is not the document
 * order. The hook instead accumulates every intersecting id in a ref and then
 * picks the highest one in `SECTION_IDS` order, which is document order. That
 * is stable regardless of how the callbacks are batched.
 *
 * ── Why the last section needs a special case ───────────────────────
 * The final section (`#contact`) is followed by the footer. If the page ends
 * before `#contact`'s top reaches the band, the band would still hold the
 * previous section and the nav would highlight the wrong link at the very
 * bottom of the page. A scroll listener that only fires *when the reader is at
 * or past the bottom* handles it — this is not a scrollspy loop, it reads no
 * layout, and it is the only reliable way to express "and the last one wins at
 * the end".
 */

import { useEffect, useState } from 'react';

export interface UseScrollspyOptions {
  /**
   * Height in px of the band's top inset — the sticky header height. Sections
   * are considered active once they pass under it.
   */
  headerOffset?: number;
  /**
   * Fraction of the viewport height to reserve below the band. `0.6` means the
   * band ends 60% down the screen.
   */
  bottomMarginRatio?: number;
  /** Disable observation (e.g. while a mobile overlay owns the page). */
  enabled?: boolean;
}

export function useScrollspy(
  sectionIds: readonly string[],
  {
    headerOffset = 80,
    bottomMarginRatio = 0.6,
    enabled = true,
  }: UseScrollspyOptions = {},
): string {
  /*
   * Seeded with the first id rather than an empty string: the nav should show
   * `Home` as active on a fresh load, and a blank state would flash no underline
   * before the first observer callback lands.
   */
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '');

  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const nodes = sectionIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);

    if (nodes.length === 0) return undefined;

    /* Ids currently inside the band. A ref, not state: it is bookkeeping, and
       re-rendering on every entry would undo the point of using an observer. */
    const visible = new Set<string>();

    const pickActive = () => {
      /* Document order, so the first match is the topmost visible section. */
      const next = sectionIds.find((id) => visible.has(id));
      if (next) setActiveId(next);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        pickActive();
      },
      {
        rootMargin: `-${headerOffset}px 0px -${bottomMarginRatio * 100}% 0px`,
        threshold: 0,
      },
    );

    nodes.forEach((node) => observer.observe(node));

    /*
     * Bottom-of-page override. See the note above: `#contact` may never reach
     * the band if the footer is shorter than 60% of the viewport. Guarded on a
     * handful of px rather than `===` so fractional device-pixel scroll heights
     * still match.
     */
    const lastId = sectionIds[sectionIds.length - 1];
    const onScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (nearBottom && lastId) setActiveId(lastId);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [sectionIds, headerOffset, bottomMarginRatio, enabled]);

  return activeId;
}
