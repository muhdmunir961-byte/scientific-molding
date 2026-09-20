'use client';

/**
 * §6 — Site chrome: the sticky header, the mobile panel and the bottom bar.
 *
 * ── Why this is a separate client component ─────────────────────────
 * The header and the mobile panel share open/closed state: the hamburger lives
 * in `<Navbar>` and the panel it controls lives in `<MobileNav>`. That state has
 * to live in a common ancestor, and `page.tsx` is a server component, so the
 * ancestor has to be a client boundary. Putting it here rather than converting
 * the whole page keeps the client bundle to the chrome instead of the content.
 *
 * ── Why the header is inside `<EntranceLoader>`'s sibling, not its child ──
 * The loader paints a full-screen overlay at `z-[9999]`. The header is `z-50`,
 * so it is correctly *under* the burn and is revealed along with the page as
 * the overlay clears — no coordination between the two is needed, and neither
 * may be changed to depend on the other.
 */

import { useState } from 'react';

import MobileNav from './MobileNav';
import MobileStickyBar from './MobileStickyBar';
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
      <MobileStickyBar />
      <MobileNav
        id={MOBILE_NAV_ID}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </>
  );
}
