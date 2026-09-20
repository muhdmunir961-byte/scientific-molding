'use client';

/**
 * ScrollReveal — fade and lift a block once, when it first enters the viewport.
 *
 * ── Why not Framer Motion ───────────────────────────────────────────
 * The entrance loader uses Framer Motion because the burn is a multi-phase
 * choreography with coupled properties. This is a single fade-and-lift, so a
 * CSS transition driven by one class toggle is smaller, has no runtime cost per
 * frame, and stays on the compositor (`opacity` + `translate3d` only).
 *
 * ── Fires once, then disconnects ────────────────────────────────────
 * The observer unobserves after the first intersection. Revealing on every
 * scroll past would be distracting, and re-observing would leak observers as
 * the visitor scrolls.
 *
 * ── Reduced motion and no-JS ────────────────────────────────────────
 * Both are handled in CSS (`app/globals.css`): the base rule is visible, and
 * the hidden state only applies once this component has mounted and added
 * `data-reveal-ready`. So if JavaScript never runs, the content is simply
 * visible rather than stuck at `opacity: 0` — the failure mode that matters,
 * because invisible content is worse than unanimated content.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface ScrollRevealProps {
  children: ReactNode;
  /**
   * Extra delay in milliseconds, for staggering sibling blocks.
   *
   * Kept below ~200ms: longer stagger makes the later elements feel slow rather
   * than sequenced, because the visitor has already scrolled past them.
   */
  delayMs?: number;
  /** Extra classes on the wrapper. */
  className?: string;
}

export default function ScrollReveal({
  children,
  delayMs = 0,
  className = '',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    /*
     * No IntersectionObserver (very old browser, or a test environment): show
     * the content immediately rather than leaving it hidden.
     */
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        setIsVisible(true);
        // One-shot: stop watching as soon as it has been revealed.
        observer.unobserve(entry.target);
      },
      {
        // Trigger slightly before the block is fully on screen, so the motion
        // finishes around the time it settles into view.
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1,
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      // Marks that JS is driving the reveal, so the CSS may start from hidden.
      data-reveal-ready=""
      data-visible={isVisible ? '' : undefined}
      className={`reveal-block ${className}`}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
