'use client';

/**
 * Admin masthead — brand, navigation and sign-out.
 *
 * ── Why sign-out is client-side ─────────────────────────────────────────
 * It issues a DELETE to the auth route, which clears the cookie, then navigates
 * to the login page. Doing it as a form POST to a server action would work too,
 * but a button that both clears a cookie and navigates is exactly the case
 * `fetch` + `router.refresh()` handles without a page reload.
 *
 * ── Why the nav is a plain list of links ────────────────────────────────
 * Four destinations do not need a sidebar, a collapse control or a router
 * integration. `usePathname()` sets `aria-current`, which is what a screen
 * reader needs to know where it is.
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/images', label: 'Images' },
  { href: '/admin/content', label: 'Content' },
] as const;

export default function AdminShell() {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <header className="admin-header">
      <span className="admin-brand">SMTS Admin</span>

      <nav className="admin-nav" aria-label="Admin">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={
              link.href === '/admin'
                ? pathname === '/admin'
                  ? 'page'
                  : undefined
                : pathname.startsWith(link.href)
                  ? 'page'
                  : undefined
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="admin-button admin-button-secondary"
        onClick={signOut}
        disabled={busy}
      >
        {busy ? 'Signing out…' : 'Sign out'}
      </button>
    </header>
  );
}
