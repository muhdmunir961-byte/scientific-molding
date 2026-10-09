/**
 * Admin layout.
 *
 * ── Why this is a route group separate from the site ────────────────────
 * `app/admin/*` sits outside the marketing page entirely, so the panel gets its
 * own shell: no site header, no mobile nav, no entrance animation, and no
 * analytics. The public layout does not wrap it, which is what keeps the
 * admin's (deliberately plain) styling from inheriting the marketing type
 * scale and the orange accents.
 *
 * ── Why `noindex` is set here and not only in robots.txt ────────────────
 * `robots.txt` is advisory and a URL that gets linked anywhere will be crawled
 * regardless. The meta tag is enforced by the crawler that reads it. The panel
 * is also never linked from the public site, so it should never be discovered
 * at all — but "should never" is not a control.
 */

import type { Metadata } from 'next';

import { isCoolifyConfigured } from '@/lib/admin/config';

import AdminShell from './AdminShell';
import './admin.css';

export const metadata: Metadata = {
  title: 'Admin — Scientific Molding Training Series',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  /*
   * The masthead is a client component (it needs `usePathname` and the deploy
   * action), so the capability flag is resolved here on the server and passed
   * down. Reading `process.env` in a client component would inline the value at
   * build time, which is fine for this boolean but wrong for anything secret —
   * keeping the read server-side means there is one rule for env access rather
   * than one rule per component.
   */
  const deployEnabled = isCoolifyConfigured();

  return (
    <div className="admin-shell">
      <AdminShell deployEnabled={deployEnabled} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
