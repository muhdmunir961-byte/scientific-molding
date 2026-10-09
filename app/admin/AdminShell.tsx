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

import DeployButton from './DeployButton';

const LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/images', label: 'Images' },
  { href: '/admin/content', label: 'Content' },
] as const;

/**
 * Admin masthead — brand, navigation, deploy and sign-out.
 *
 * ── Why deploy lives here and not on the content page ───────────────────
 * The moment an operator needs to deploy is the moment they have just saved and
 * cannot see the change. Putting the control on the page they save from means
 * it is always one click away, from any panel page, without hunting.
 *
 * ── Why `deployEnabled` is a prop rather than an env read ───────────────
 * Reading `process.env` in a client component inlines the value at build time.
 * That is harmless for this boolean, but having one rule for environment access
 * — read on the server, pass down — is what stops the next variable from being
 * read client-side by accident.
 */
export default function AdminShell({ deployEnabled }: { deployEnabled: boolean }) {
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

      <div className="admin-header-actions">
        <DeployButton enabled={deployEnabled} />

        <button
          type="button"
          className="admin-button admin-button-secondary"
          onClick={signOut}
          disabled={busy}
        >
          {busy ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </header>
  );
}
