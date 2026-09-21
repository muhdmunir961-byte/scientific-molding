'use client';

/**
 * §6.5 — Mobile sticky action bar.
 *
 * ── Why it exists ───────────────────────────────────────────────────
 * On a phone, the single most likely action for a B2B visitor who is interested
 * is to call or WhatsApp. Both are one tap away at all times once the reader has
 * moved past the hero, instead of requiring a scroll to the contact section.
 *
 * ── Why it appears at 400px and not immediately ─────────────────────
 * The hero already carries its own CTA. Showing a second, competing action bar
 * over the hero splits attention at the exact moment the visitor is reading the
 * headline. Past the hero the reader has committed to scanning, and a persistent
 * action becomes an affordance rather than a distraction.
 *
 * ── Motion ──────────────────────────────────────────────────────────
 * Framer Motion is used here (rather than a CSS class toggle) because the bar
 * mounts and unmounts: `AnimatePresence` is what lets the exit animation run at
 * all. A CSS-only approach would need the element to stay in the DOM permanently
 * and toggle classes, which would leave three focusable links in the tab order
 * behind an invisible bar on desktop.
 *
 * A 16px rise plus a fade, at 250ms. It was a full-height slide (`y: '100%'`),
 * which is 64px of travel for a bar that occupies 64px — the whole bar moved its
 * own height, which reads as the page shifting rather than as a control
 * arriving. Reduced motion skips it entirely rather than shortening it.
 *
 * ── Colours, geometry and focus live in globals.css ─────────────────
 * Polish #7, Session 2 moved everything except the animation off the inline
 * `style` object. `:focus-visible` is not expressible inline, so the three links
 * — the bar's only interactive elements — had no keyboard focus indicator at
 * all. See `.mobile-sticky-bar` for the full reasoning.
 *
 * ── z-index: 40, i.e. under the header (50) and the panel (60/61) ────
 * The bar must never sit above the mobile nav overlay. §6.5's hierarchy is
 * authoritative and is asserted in `check-entrance.mjs`.
 */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { actionHref, QUICK_ACTIONS } from './nav-content';
import QuickIcon from './QuickIcon';

/** Scroll distance, in px, after which the bar slides in. */
export const STICKY_BAR_THRESHOLD = 400;

export default function MobileStickyBar() {
  const [isVisible, setIsVisible] = useState(false);
  const lastVisible = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > STICKY_BAR_THRESHOLD;
      /* Write state only when the boolean flips — two renders per traversal
         rather than one per scroll event. */
      if (next !== lastVisible.current) {
        lastVisible.current = next;
        setIsVisible(next);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="mobile-sticky-bar"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{
            /* Reduced motion: instant show/hide. Not a shortened duration — a
               0.01s slide is a flash, which is the movement the preference is
               asking us to remove. */
            duration: shouldReduceMotion ? 0 : 0.25,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <a key={action.kind} href={actionHref(action.kind)} className="mobile-sticky-link">
              <QuickIcon kind={action.kind} size={20} />
              <span className="mobile-sticky-label">{action.label}</span>
            </a>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
