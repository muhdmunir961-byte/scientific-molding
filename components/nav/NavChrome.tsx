'use client';

/**
 * §6 — Site chrome: the sticky header and the mobile panel.
 *
 * ── Why this is a separate client component ─────────────────────────
 * The header and the mobile panel share open/closed state: the hamburger lives
 * in `<Navbar>` and the panel it controls lives in `<MobileNav>`. That state has
 * to live in a common ancestor, and `page.tsx` is a server component, so the
 * ancestor has to be a client boundary. Putting it here rather than converting
 * the whole page keeps the client bundle to the chrome instead of the content.
 *
 * ── Why there is no bottom action bar ───────────────────────────────
 * There was one: a fixed strip with Call / Email / WhatsApp pinned to the bottom
 * of the viewport on phones. It was removed on request because it duplicated
 * what the hamburger panel already offers and it covered the last lines of every
 * section while scrolling — the operator's words were "it gets in the way".
 *
 * Removing it here rather than hiding it in CSS means it is not rendered, not
 * fetched, and not a tab stop for a keyboard or screen-reader user.
 *
 * ── Why the header is inside `<EntranceLoader>`'s sibling, not its child ──
 * The loader paints a full-screen overlay at `z-[9999]`. The header is `z-50`,
 * so it is correctly *under* the burn and is revealed along with the page as
 * the overlay clears — no coordination between the two is needed, and neither
 * may be changed to depend on the other.
 */

import { useState } from 'react';

import MobileNav from './MobileNav';
import Navbar from './Navbar';

/** Shared between the hamburger's `aria-controls` and the panel's `id`. */
const MOBILE_NAV_ID = 'mobile-nav';

export default function NavChrome() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <>
      <Navbar
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
        mobileNavId={MOBILE_NAV_ID}
      />
      <MobileNav
        id={MOBILE_NAV_ID}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </>
  );
}
