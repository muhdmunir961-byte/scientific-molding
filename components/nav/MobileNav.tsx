'use client';

/**
 * §6.2 — Hamburger menu (≤1024px).
 *
 * ── Why this is `role="dialog"` and not just a `<nav>` ──────────────
 * A slide-in panel that covers the page and traps focus is a modal dialog in
 * every sense that matters to assistive tech. Without `aria-modal="true"` a
 * screen reader will happily wander into the page behind the overlay, which is
 * visible to nobody. The dialog role is what makes the rest of the page inert.
 *
 * ── Why `inert` on the page behind ──────────────────────────────────
 * `aria-modal` alone is a promise that the author keeps by also stopping
 * keyboard focus from leaving. `inert` on the page content enforces it for
 * real — including for the mouse and for assistive tech — rather than being
 * hand-rolled here. The attribute is set by `<NavChrome>` on the content
 * wrapper; see the note there.
 *
 * ── Focus management ────────────────────────────────────────────────
 * On open: focus moves to the close button (the first focusable element, and
 * the one action that is always available). On close: focus returns to whatever
 * was focused before, which is the hamburger. Without the restore, focus falls
 * to `<body>` and a keyboard user is dropped at the top of the document.
 *
 * Tab is cycled manually rather than relying on `inert`, because focus can also
 * leave via the browser chrome (address bar, then Tab back in) and manual
 * cycling keeps the boundary correct even then.
 *
 * ── Reduced motion ──────────────────────────────────────────────────
 * `useReducedMotion()` collapses the slide and the backdrop fade to 0ms. The
 * panel still opens and closes; it simply appears.
 */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

import {
  actionHref,
  LOGO,
  NAV_CTA,
  NAV_ITEMS,
  PROGRAM_ITEMS,
  PROGRAMS_LABEL,
  QUICK_ACTIONS,
} from './nav-content';
import QuickIcon from './QuickIcon';

export interface MobileNavProps {
  /** Matches the hamburger's `aria-controls`. */
  id: string;
  isOpen: boolean;
  onClose: () => void;
}

/** Selector for the elements the tab cycle visits, in DOM order. */
const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function MobileNav({ id, isOpen, onClose }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  /* Whatever had focus before opening, so it can be restored on close. */
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  /* ---- Open/close side effects: focus, scroll lock, Escape ---- */
  useEffect(() => {
    if (!isOpen) return undefined;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    /* `overflow: hidden` on <body> — the layout viewport, not the panel — is
       what stops the page scrolling underneath the overlay. */
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      /* Wrap at both ends. Shift+Tab from the first element goes to the last,
         Tab from the last goes to the first. */
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  /*
   * Auto-close when the viewport grows past the panel's breakpoint. The panel is
   * `lg:hidden`, so at ≥1025px it is invisible while `isOpen` stays true — which
   * would leave <body> scroll-locked with nothing on screen to explain why.
   */
  useEffect(() => {
    if (!isOpen) return undefined;

    const query = window.matchMedia('(min-width: 1025px)');
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) onClose();
    };

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [isOpen, onClose]);

  const onNavigate = useCallback(() => {
    /* Close first, then let the browser process the anchor jump. Because the
       cleanup above restores `overflow`, the scroll is unlocked in time for the
       browser to complete the smooth scroll to the target. */
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="lg:hidden" style={{ zIndex: 60 }}>
          {/* ---- Backdrop ---- */}
          <motion.div
            className="nav-backdrop fixed inset-0"
            style={{ zIndex: 60 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* ---- Panel ---- */}
          <motion.div
            ref={panelRef}
            id={id}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            className="nav-panel fixed right-0 top-0 flex h-full w-full max-w-[320px] flex-col overflow-y-auto"
            style={{
              zIndex: 61,
              /* Safe area: on a notched device the panel must not run under the
                 status bar or the home indicator. */
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* ---- Panel header ---- */}
            <div className="flex items-center justify-between px-5 py-4">
              <p
                id={`${id}-title`}
                className="nav-logo text-[1.0625rem]"
                style={{ letterSpacing: 'var(--ds-tracking-tight)' }}
              >
                {LOGO.full}
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="nav-icon-button flex h-11 w-11 items-center justify-center"
              >
                <X size={24} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            {/* ---- Section links ---- */}
            <nav aria-label="Mobile" className="flex-1 px-5 pb-4">
              <ul>
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={onNavigate}
                      /* 18px with 16px vertical padding: a comfortable tap
                         target on a phone, where 14px links are a mis-tap
                         waiting to happen. */
                      className="nav-link block py-4 text-[1.125rem]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}

                {/* ---- Programs group ---- */}
                <li>
                  <p className="py-4 text-[1.125rem] font-semibold" style={{ color: 'var(--ds-neutral-800)' }}>
                    {PROGRAMS_LABEL}
                  </p>
                  {/* Indented one step and a notch smaller, so the hierarchy
                      reads without relying on colour alone. */}
                  <ul className="pl-6">
                    {PROGRAM_ITEMS.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={onNavigate}
                          className="nav-link block py-3 text-[1rem] font-normal"
                          style={{ color: 'var(--ds-neutral-500)' }}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>

              {/* ---- Primary CTA ---- */}
              <a
                href={NAV_CTA.href}
                onClick={onNavigate}
                className="nav-cta mt-6 flex w-full items-center justify-center px-6 py-3.5 text-[0.9375rem] font-bold"
              >
                {NAV_CTA.label}
              </a>
            </nav>

            {/* ---- Quick contact actions ---- */}
            <div
              className="px-5 py-5"
              style={{ borderTop: '1px solid var(--ds-neutral-200)' }}
            >
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-3">
                {QUICK_ACTIONS.map((action) => (
                  <li key={action.kind}>
                    <a
                      href={actionHref(action.kind)}
                      /* Phone numbers and email addresses are links, not
                         buttons: they are destinations, and a link gets
                         long-press, "copy address" and middle-click free. */
                      className="flex items-center gap-2 text-[0.875rem] font-semibold"
                      style={{ color: 'var(--ds-neutral-800)' }}
                    >
                      <QuickIcon kind={action.kind} />
                      {action.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

