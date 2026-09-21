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

import { ExternalLink, Mail, Phone } from 'lucide-react';

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
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-grid">
          {/* Column 1 — contact */}
          <div>
            <h2 className="footer-col-label">Contact</h2>

            <ul className="footer-list">
              <li>
                <a href={CONTACT_DIRECT.phoneHref} className="footer-link">
                  <Phone size={16} aria-hidden="true" className="shrink-0" />
                  {CONTACT_DIRECT.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={CONTACT_DIRECT.emailHref} className="footer-link">
                  <Mail size={16} aria-hidden="true" className="shrink-0" />
                  {CONTACT_DIRECT.email}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_DIRECT.linkedinHref}
                  className="footer-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/*
                   * `ExternalLink`, not a LinkedIn brand mark. Lucide v1 ships
                   * no brand logos, and a generic outbound icon is arguably
                   * clearer — it also signals that the link leaves the site.
                   */}
                  <ExternalLink size={16} aria-hidden="true" className="shrink-0" />
                  LinkedIn
                </a>
              </li>
            </ul>

            <p className="footer-name">Ts. Mohd Hafiedzzul Bin Malek Riduan</p>
          </div>

          {/* Column 2 — quick links */}
          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className="footer-col-label">
              Quick Links
            </h2>

            <ul className="footer-list footer-list-tight">
              {QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="footer-link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 3 — legal */}
          <div>
            <h2 className="footer-col-label">Legal</h2>

            <ul className="footer-list footer-list-tight">
              <li>
                <a href="/privacy" className="footer-link">
                  Privacy Policy
                </a>
              </li>
            </ul>

            {/*
             * The HRDC badge.
             *
             * A pill rather than a paragraph: HRDC claimability is a purchasing
             * decision for a Malaysian employer, and it is the one credential on
             * the page that changes what the training costs them. The orange
             * hairline carries that without a fill, which on a dark surface would
             * be a second light source competing with the footer's own.
             */}
            <p className="footer-badge">HRD Corp Accredited Trainer</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-legal">
            &copy; 2026 Scientific Molding Training Series. All rights reserved.
          </p>
          <p className="footer-legal">
            HRD Corp Accredited Trainer &middot; NOSS Panel member
          </p>
        </div>
      </div>
    </footer>
  );
}
