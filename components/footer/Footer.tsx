/**
 * Site footer — PRD Section 13.2: "Footer (contact details, quick links,
 * legal/compliance line reused from source decks)".
 *
 * ── Three columns on desktop, one on mobile ─────────────────────────
 * Contact / Quick links / Legal. The quick links point at the section anchors
 * from PRD Section 4, which also gives the footer a second navigation path for
 * a visitor who has scrolled to the bottom.
 *
 * ── Dark surface ────────────────────────────────────────────────────
 * The footer uses the same `--pdf-dark` as the program heroes. It is the last
 * thing on the page and a light footer after the white Contact section would
 * read as one undifferentiated block.
 */

import { Mail, Phone } from 'lucide-react';

import {
  CONTACT_DIRECT,
} from '../contact/contact-content';

/** Anchor links, matching the section ids from PRD Section 4. */
const QUICK_LINKS = [
  { href: '#about', label: 'About the Trainer' },
  { href: '#fundamentals', label: 'Programmes' },
  { href: '#why', label: 'Why Scientific Moulding' },
  { href: '#track-record', label: 'Track Record' },
  { href: '#contact', label: 'Request a Proposal' },
] as const;

export default function Footer() {
  return (
    <footer
      className="w-full"
      style={{
        backgroundColor: 'var(--pdf-dark)',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="mx-auto w-full max-w-[1400px] px-8 py-16 sm:px-12 lg:px-16">
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {/* Column 1 — contact */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pdf-orange)]">
              Contact
            </h2>

            <ul className="mt-8 flex list-none flex-col gap-4 p-0">
              <li>
                <a
                  href={CONTACT_DIRECT.phoneHref}
                  className="flex items-center gap-2 text-[0.9375rem] hover:underline"
                  style={{ color: 'var(--pdf-dark-muted)' }}
                >
                  <Phone size={16} aria-hidden="true" className="shrink-0" />
                  {CONTACT_DIRECT.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_DIRECT.emailHref}
                  className="flex items-center gap-2 break-all text-[0.9375rem] hover:underline"
                  style={{ color: 'var(--pdf-dark-muted)' }}
                >
                  <Mail size={16} aria-hidden="true" className="shrink-0" />
                  {CONTACT_DIRECT.email}
                </a>
              </li>
            </ul>

            <p
              className="mt-8 text-sm leading-relaxed"
              style={{ color: 'var(--pdf-dark-subtle)' }}
            >
              Ts. Mohd Hafiedzzul Bin Malek Riduan
            </p>
          </div>

          {/* Column 2 — quick links */}
          <nav aria-labelledby="footer-links">
            <h2
              id="footer-links"
              className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pdf-orange)]"
            >
              Quick Links
            </h2>

            <ul className="mt-8 flex list-none flex-col gap-2 p-0">
              {QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex py-2 text-[0.9375rem] hover:underline"
                    style={{ color: 'var(--pdf-dark-muted)' }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 3 — legal */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pdf-orange)]">
              Legal
            </h2>

            <ul className="mt-8 flex list-none flex-col gap-2 p-0">
              <li>
                <a
                  href="/privacy"
                  className="inline-flex py-2 text-[0.9375rem] hover:underline"
                  style={{ color: 'var(--pdf-dark-muted)' }}
                >
                  Privacy Policy
                </a>
              </li>
            </ul>

            <p
              className="mt-8 text-sm leading-relaxed"
              style={{ color: 'var(--pdf-dark-subtle)' }}
            >
              HRDC Claimable training
            </p>
          </div>
        </div>

        <div
          className="mt-16 border-t pt-8"
          style={{ borderColor: 'var(--pdf-dark-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--pdf-dark-subtle)' }}>
            &copy; 2026 Scientific Molding Training Series. All rights reserved.
          </p>
          <p className="mt-2 text-xs" style={{ color: 'var(--pdf-dark-subtle)' }}>
            HRD Corp Accredited Trainer &middot; NOSS Panel member
          </p>
        </div>
      </div>
    </footer>
  );
}
