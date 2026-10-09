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

import { MODULES } from '@/lib/modules';

import DeployButton from './DeployButton';

const LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/images', label: 'Images' },
  { href: '/admin/testimonials', label: 'Testimonials' },
  { href: '/admin/content', label: 'Content' },
] as const;

/**
 * Admin masthead — brand, navigation, module dropdown, deploy and sign-out.
 *
 * ── Why the module dropdown reads `MODULES` ─────────────────────────────
 * The seven modules come from `content/modules.json`, the same file the public
 * Programs menu reads. Hardcoding them here would be the second copy of one
 * fact, which is how the public menu and the client's PDF came to disagree in
 * the first place.
 *
 * ── Why deploy lives here and not on the content page ───────────────────
 * The moment an operator needs to deploy is the moment they have just saved and
 * cannot see the change. Putting the control in the masthead means it is one
 * click away from every panel page.
 */
export default function AdminShell({ deployEnabled }: { deployEnabled: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);

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

        {/* The module dropdown. A `details`/`summary` pair would be simpler but
            cannot be closed by clicking elsewhere, which is what a menu needs. */}
        <div className="admin-nav-dropdown">
          <button
            type="button"
            className="admin-nav-trigger"
            aria-haspopup="true"
            aria-expanded={modulesOpen}
            onClick={() => setModulesOpen((open) => !open)}
            data-active={pathname.startsWith('/admin/modules')}
          >
            Modules ▾
          </button>

          {modulesOpen && (
            <ul className="admin-nav-menu">
              {MODULES.map((module) => (
                <li key={module.slug}>
                  <Link
                    href={`/admin/modules/${module.slug}`}
                    onClick={() => setModulesOpen(false)}
                    aria-current={
                      pathname === `/admin/modules/${module.slug}` ? 'page' : undefined
                    }
                  >
                    <span className="nav-menu-item-label">{module.title}</span>
                    <span className="nav-menu-item-detail">
                      {module.days} days · {module.level}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
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
