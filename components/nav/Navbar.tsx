'use client';

/**
 * §6.1 — Sticky header (desktop).
 *
 * ── Behaviour ───────────────────────────────────────────────────────
 * At rest the header is transparent and shadowless, so the Hero reads as one
 * full-bleed surface. Past 80px of scroll it gains a white surface, a soft warm
 * shadow, and loses 12px of height (72 → 60). The height change is a
 * `transition` on the inner row, not a layout swap, so nothing below it jumps.
 *
 * ── Why not Framer Motion ───────────────────────────────────────────
 * This is a two-state class toggle. A CSS transition is smaller and — most
 * importantly — is disabled wholesale by the `prefers-reduced-motion` block in
 * `globals.css` without extra code here. Framer Motion earns its runtime for
 * the multi-phase choreography (loader, mobile panel); a two-state header does
 * not need one.
 *
 * ── The scroll read is throttled, not looped ────────────────────────
 * `onScroll` reads one cheap value (`window.scrollY`) and writes state only when
 * the boolean actually flips, so React re-renders twice per page traversal
 * rather than once per frame. There is no layout read and no
 * `getBoundingClientRect`. This is not the pattern §6.4 warns against — that
 * warning is about the scrollspy, which is fully observer-driven.
 *
 * ── Why `aria-current` and not `aria-selected` ──────────────────────
 * The active state is otherwise conveyed only by an orange underline, which is
 * invisible to a screen reader. `aria-current="true"` is the right token for
 * "this link represents the current position" (WCAG 1.3.1). `aria-selected` is
 * for widgets — tabs, listboxes — not navigation links.
 */

import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  HEADER_HEIGHT,
  HEADER_SCROLL_THRESHOLD,
  LOGO,
  NAV_CTA,
  NAV_ITEMS,
  PROGRAM_ITEMS,
  PROGRAMS_LABEL,
  SECTION_IDS,
} from './nav-content';
import { useScrollspy } from './useScrollspy';

export interface NavbarProps {
  /** Opens the mobile panel. */
  onOpenMobileNav: () => void;
  /** Id of the mobile panel, for `aria-controls`. */
  mobileNavId: string;
}

/**
 * Shared link styling.
 *
 * Size, weight and colour now come from `.nav-link` in `globals.css`, so the
 * top-level links and the dropdown trigger cannot drift apart — they must look
 * identical for the nav to read as one row. This constant is gone rather than
 * kept as a duplicate source of truth.
 */

/** One top-level nav link, with its active underline. */
function NavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <a
      href={href}
      aria-current={isActive ? 'true' : undefined}
      data-active={isActive}
      className="nav-link relative inline-flex items-center px-1 py-2"
    >
      {label}
      {/*
       * The underline is a real element rather than `text-decoration`, because
       * it animates its width from the centre and sits below the text box.
       * aria-hidden — it is decoration; `aria-current` carries the meaning.
       */}
      <span aria-hidden="true" className="nav-link-underline" data-active={isActive} />
    </a>
  );
}

export default function Navbar({ onOpenMobileNav, mobileNavId }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProgramsOpen, setIsProgramsOpen] = useState(false);

  /* Remembers the last written value so the scroll handler can skip redundant
     `setState` calls. A ref, because it must not itself trigger a render. */
  const lastScrolled = useRef(false);

  const activeId = useScrollspy(SECTION_IDS, {
    headerOffset: HEADER_HEIGHT.rest,
  });

  const programIds = PROGRAM_ITEMS.map((item) => item.id);
  /* The trigger is active when any of its children is the active section. */
  const isProgramsActive = programIds.includes(activeId);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > HEADER_SCROLL_THRESHOLD;
      if (next !== lastScrolled.current) {
        lastScrolled.current = next;
        setIsScrolled(next);
      }
    };

    /* Passive: the handler never calls `preventDefault`, so the browser keeps
       scrolling on the compositor thread while it runs. */
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onDropdownKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') setIsProgramsOpen(false);
  }, []);

  const onDropdownBlur = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    /* `relatedTarget` is the element receiving focus. If it is inside the
       dropdown, focus merely moved within it and the menu should stay open. */
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsProgramsOpen(false);
    }
  }, []);

  return (
    <header
      className="nav-shell fixed inset-x-0 top-0 z-50"
      data-scrolled={isScrolled}
    >
      <div
        className="nav-row mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-6"
        style={{ height: isScrolled ? HEADER_HEIGHT.shrunk : HEADER_HEIGHT.rest }}
      >
        {/* ---------------------- Logo ---------------------- */}
        <a href="#hero" className="nav-logo flex shrink-0 items-center">
          {/* Full name for assistive tech; the visual mark splits the wordmark
              so the accent dot can sit between the two words. */}
          <span className="sr-only">{LOGO.full} — back to top</span>
          <span aria-hidden="true" className="flex items-center gap-[0.4em]">
            {LOGO.first}
            <span
              className="inline-block h-[0.4em] w-[0.4em] rounded-full"
              style={{ backgroundColor: 'var(--ds-yellow-500)' }}
            />
            {LOGO.second}
          </span>
        </a>

        {/* ------------- Desktop nav — hidden below 1025px ------------- */}
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <NavLink
              key={item.id}
              href={`#${item.id}`}
              label={item.label}
              isActive={activeId === item.id}
            />
          ))}

          {/* ---- Programs dropdown ---- */}
          <div
            className="relative"
            onMouseEnter={() => setIsProgramsOpen(true)}
            onMouseLeave={() => setIsProgramsOpen(false)}
            onKeyDown={onDropdownKeyDown}
            onBlur={onDropdownBlur}
          >
            {/*
             * A real <button>, not a link: there is no `#programs` section to
             * navigate to (the five programs are separate sections), and a link
             * that goes nowhere lies to a screen reader. `aria-haspopup` plus
             * `aria-expanded` describe the popup it controls.
             */}
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={isProgramsOpen}
              aria-controls="nav-programs-menu"
              onClick={() => setIsProgramsOpen((open) => !open)}
              data-active={isProgramsActive}
              className="nav-link relative inline-flex items-center gap-1 px-1 py-2"
            >
              {PROGRAMS_LABEL}
              <ChevronDown
                size={14}
                strokeWidth={2}
                aria-hidden="true"
                style={{
                  transform: isProgramsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform var(--ds-duration-normal) var(--ds-ease-out)',
                }}
              />
              <span
                aria-hidden="true"
                className="nav-link-underline"
                data-active={isProgramsActive}
              />
            </button>

            {/*
             * Always in the DOM so Tab can reach it; visibility toggles with
             * `hidden`, which also removes it from the tab order — unlike
             * `opacity: 0`, which would leave focusable links on screen.
             */}
            <ul
              id="nav-programs-menu"
              className={`nav-menu absolute left-0 top-full min-w-[240px] py-2 ${
                isProgramsOpen ? 'block' : 'hidden'
              }`}
            >
              {PROGRAM_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={activeId === item.id ? 'true' : undefined}
                    data-active={activeId === item.id}
                    onClick={() => setIsProgramsOpen(false)}
                    className="nav-menu-item block px-4 py-2 text-body-sm"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {NAV_ITEMS.slice(2).map((item) => (
            <NavLink
              key={item.id}
              href={`#${item.id}`}
              label={item.label}
              isActive={activeId === item.id}
            />
          ))}
        </nav>

        {/* -------- Right cluster: CTA (desktop) + hamburger (≤1024px) -------- */}
        <div className="flex shrink-0 items-center gap-3">
          <a
            href={NAV_CTA.href}
            className="nav-cta hidden items-center justify-center px-5 py-2 text-caption font-bold lg:inline-flex"
          >
            {NAV_CTA.label}
          </a>

          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-controls={mobileNavId}
            aria-expanded={false}
            aria-label="Open menu"
            className="nav-icon-button flex h-11 w-11 items-center justify-center lg:hidden"
          >
            {/*
             * Inline SVG rather than the Lucide `Menu` icon: at 24px the icon
             * set's slightly uneven rule lengths read as a custom glyph, and a
             * hamburger is three equal rules by definition. aria-hidden because
             * the button's `aria-label` already names the action.
             *
             * 2.75rem = 44px, so the button meets the WCAG 2.5.5 minimum tap
             * target exactly rather than falling under it.
             */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

