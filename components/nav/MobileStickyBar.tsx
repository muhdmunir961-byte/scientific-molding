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
          className="fixed inset-x-0 bottom-0 flex items-stretch lg:hidden"
          style={{
            zIndex: 40,
            backgroundColor: 'var(--ds-orange-500)',
            /* Top shadow, not bottom: the bar is pinned to the viewport's
               bottom edge, so a downward shadow would fall off-screen. The
               `lg` stack carries upward because each layer's y-offset is
               positive and box-shadow's blur is symmetric. */
            boxShadow: 'var(--ds-shadow-lg)',
            height: `calc(64px + env(safe-area-inset-bottom))`,
            /* Clear the home indicator on a notched phone; without this the
               labels sit under the gesture bar. */
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.4,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <a
              key={action.kind}
              href={actionHref(action.kind)}
              className="flex flex-1 flex-col items-center justify-center gap-1 text-white transition-opacity duration-150 hover:opacity-90 active:opacity-90"
            >
              <QuickIcon kind={action.kind} size={20} />
              <span className="text-[0.6875rem] font-bold uppercase tracking-[0.05em]">
                {action.label}
              </span>
            </a>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
