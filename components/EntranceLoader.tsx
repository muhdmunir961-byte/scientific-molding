'use client';

/**
 * EntranceLoader — full-screen "burn out" entrance animation.
 *
 * Every phase reads its duration from `TIMING`, so the choreography cannot
 * drift out of sync when one number is tuned.
 *
 * ── Burn-out physics ────────────────────────────────────────────────
 * The effect reads as a heat flash rather than a plain fade because four
 * properties move together, each with its own curve:
 *
 *   logo scale    1    → 1.06   easeOut    (the press outward, phase 1)
 *   logo glow     0px  → 28px   easeInOut  (heat building, phase 1)
 *   overlay scale 1    → 1.35   accelerate (the image rushing at you)
 *   overlay blur  0px  → 20px   accelerate (focus lost as it burns)
 *   overlay alpha 1    → 0      accelerate, then it is gone
 *
 * Transform and opacity are compositor properties. `filter` is not, but blur
 * cannot be expressed any other way; the layer is short-lived, full-screen and
 * isolated with `will-change`, so the cost is bounded and paid once.
 * ────────────────────────────────────────────────────────────────────
 */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

/** Phases of the sequence, in milliseconds, measured from mount. */
export const TIMING = {
  /** How long the logo glows before the burn begins. */
  holdMs: 1500,
  /** Duration of the burn-out itself. */
  burnMs: 700,
  /** Overlay fade duration when motion is reduced. */
  reducedFadeMs: 300,
} as const;

/** Total time from mount until the overlay has unmounted. */
export const TOTAL_MS = TIMING.holdMs + TIMING.burnMs;

export interface EntranceLoaderProps {
  /**
   * Rendered underneath the overlay and revealed as the burn completes.
   * Pass the page content here so the reveal is part of the choreography.
   */
  children?: ReactNode;
  /** Logo text. */
  label?: string;
  /** Fires once the overlay has fully unmounted. */
  onComplete?: () => void;
}

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

export default function EntranceLoader({
  children,
  label = 'SCIENTIFIC MOLDING',
  onComplete,
}: EntranceLoaderProps) {
  const [isBurning, setIsBurning] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Reduced motion still gets an entrance, just not a violent one: the overlay
  // fades and the content appears without scale, blur or travel. Removing the
  // animation entirely would be the other valid choice; a short crossfade
  // keeps the page feeling intentional at no vestibular cost.
  const isReduced = prefersReducedMotion === true;
  const holdMs = isReduced ? 400 : TIMING.holdMs;

  /**
   * Single timer drives the sequence.
   *
   * The cleanup is what makes this safe under React StrictMode: the effect
   * runs, unmounts and re-runs in development, and without clearing the handle
   * the first timer would still fire and advance the animation twice.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => setIsBurning(true), holdMs);
    return () => window.clearTimeout(timer);
  }, [holdMs]);

  /**
   * Report completion once, after the overlay has gone.
   *
   * Deliberately a separate effect from the timer: if `onComplete` were in the
   * timer effect's dependency list, passing an inline arrow function would
   * restart the countdown on every render.
   */
  useEffect(() => {
    if (!isBurning) return undefined;

    const done = window.setTimeout(
      () => onComplete?.(),
      isReduced ? TIMING.reducedFadeMs : TIMING.burnMs,
    );

    return () => window.clearTimeout(done);
  }, [isBurning, isReduced, onComplete]);


  return (
    <>
      {/* ------------------------------------------------------------
          Page content. Mounted from the start so it is laid out and painted
          underneath the overlay — by the time the burn clears there is nothing
          left to load.

          Not aria-hidden: the page underneath is the real content and must
          stay reachable by assistive tech throughout.
          ------------------------------------------------------------ */}
      {children}

      <AnimatePresence>
        {!isBurning && (
          <motion.div
            key="entrance-overlay"
            /*
             * z-index 9999 as specified. `pointer-events: none` is applied from
             * the first frame rather than only after the animation: the overlay
             * covers the viewport but must never swallow a click, so the page
             * underneath is interactive the moment it is revealed.
             */
            className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
            style={{
              // Radial gradient: PRD yellow core cooling to PRD orange at the
              // edges. Values match Section 13.1 via the task brief.
              backgroundImage:
                'radial-gradient(circle at 50% 50%, #FFC93C 0%, #F79E32 45%, #F07C23 100%)',
              // Promote to its own layer — the blur would otherwise repaint the
              // entire document every frame.
              willChange: 'transform, opacity, filter',
              isolation: 'isolate',
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            animate={
              isReduced
                ? { opacity: 0 }
                : { scale: 1.35, opacity: 0, filter: 'blur(20px)' }
            }
            exit={{ opacity: 0 }}
            transition={
              isReduced
                ? { duration: TIMING.reducedFadeMs / 1000, ease: 'easeOut' }
                : {
                    duration: TIMING.burnMs / 1000,
                    // Accelerates hard then holds — the signature of a flash
                    // rather than a drift.
                    ease: [0.7, 0, 0.84, 0],
                  }
            }
            /*
             * Decoration only. The brand name already appears in the document
             * title and the page heading, so announcing it here would be noise.
             */
            role="presentation"
            aria-hidden="true"
          >
            <motion.span
              className="select-none text-center font-extrabold uppercase text-white"
              style={{
                fontFamily: 'var(--font-poppins), sans-serif',
                fontSize: 'clamp(1.375rem, 6.5vw, 4.5rem)',
                letterSpacing: 'clamp(0.04em, 1vw, 0.18em)',
                lineHeight: 1.1,
                textWrap: 'balance',
                // Keeps the two words together on narrow screens rather than
                // orphaning "MOLDING" on its own line.
                whiteSpace: 'nowrap',
              }}
              initial={{ opacity: 1, scale: 1 }}
              animate={isReduced ? { opacity: 1 } : { opacity: 1, scale: 1.06 }}
              transition={
                isReduced
                  ? { duration: 0.01 }
                  : { duration: holdMs / 1000, ease: [0.22, 1, 0.36, 1] }
              }
            >
              {/* Phase 1 glow. A separate element so the animated shadow does
                  not fight the parent's scale for the same layer. */}
              <motion.span
                style={{ display: 'block' }}
                initial={{
                  filter: isReduced ? 'none' : 'drop-shadow(0 0 0px rgba(255,255,255,0))',
                }}
                animate={
                  isReduced
                    ? { filter: 'none' }
                    : {
                        filter: [
                          'drop-shadow(0 0 0px rgba(255,255,255,0))',
                          'drop-shadow(0 0 28px rgba(255,255,255,0.9))',
                          'drop-shadow(0 0 14px rgba(255,255,255,0.65))',
                        ],
                      }
                }
                transition={
                  isReduced
                    ? { duration: 0.01 }
                    : { duration: holdMs / 1000, ease: 'easeInOut' }
                }
              >
                {label}
              </motion.span>
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------
          Screen-reader status. The overlay is decorative, so this is the only
          signal that the page is settling. `aria-live="polite"` is the
          documented treatment for an async state change.
          ------------------------------------------------------------ */}
      <span className="sr-only" role="status" aria-live="polite">
        {isBurning ? 'Ready' : 'Loading…'}
      </span>
    </>
  );
}
