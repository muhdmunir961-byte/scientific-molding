/**
 * The direct-contact column of §5.6.
 *
 * ── Why every route is a link ───────────────────────────────────────
 * `tel:`, `mailto:` and `https://` are real destinations, so they are anchors.
 * An anchor gets middle-click, Cmd/Ctrl-click and "copy link address" for free;
 * a `<button>` with an `onClick` gets none of that. The Web Interface Guidelines
 * are explicit on this point.
 *
 * ── Why WhatsApp is included ────────────────────────────────────────
 * PRD Section 12 lists it as an open question: *"Is a WhatsApp click-to-chat
 * link desired alongside phone/email (common in Malaysian B2B contexts)?"*
 * The task spec resolved it — include it — so it is here. `wa.me` needs the
 * number in international format with no separators.
 *
 * ── Icons ───────────────────────────────────────────────────────────
 * All `aria-hidden`: the label text carries the meaning, and an exposed icon
 * would announce a graphic name before every row.
 */

import { ExternalLink, Mail, MessageCircle, Phone } from 'lucide-react';

import { CONTACT_DIRECT } from './contact-content';

/** One row of the contact list. */
function Route({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <li className="contact-route">
      <span className="contact-route-icon">
        <Icon size={24} strokeWidth={2} aria-hidden="true" />
      </span>

      <div className="min-w-0 pt-1">
        <p className="text-caption contact-direct-label">
          {label}
        </p>
        <a
          href={href}
          className="contact-direct-link"
          {...(external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {value}
        </a>
      </div>
    </li>
  );
}

export default function ContactDirect() {
  return (
    <div className="contact-direct">
      <h3 className="text-h3 contact-direct-heading">
        {CONTACT_DIRECT.heading}
      </h3>

      <ul className="contact-direct-list">
        <Route
          icon={Phone}
          label="Phone"
          value={CONTACT_DIRECT.phoneDisplay}
          href={CONTACT_DIRECT.phoneHref}
        />
        <Route
          icon={Mail}
          label="Email"
          value={CONTACT_DIRECT.email}
          href={CONTACT_DIRECT.emailHref}
        />
        <Route
          /*
           * `ExternalLink`, not a LinkedIn brand mark.
           *
           * Lucide v1 deliberately ships no brand logos, so `Linkedin` does not
           * exist in the icon set. A generic outbound-link icon is the honest
           * alternative — and it is arguably clearer than a brand glyph, since
           * it also signals that the link leaves the site.
           */
          icon={ExternalLink}
          label="LinkedIn"
          value={CONTACT_DIRECT.linkedin}
          href={CONTACT_DIRECT.linkedinHref}
          external
        />
        <Route
          icon={MessageCircle}
          label="WhatsApp"
          value={CONTACT_DIRECT.whatsapp}
          href={CONTACT_DIRECT.whatsappHref}
          external
        />
      </ul>

      <p className="contact-direct-note">{CONTACT_DIRECT.responseNote}</p>
    </div>
  );
}
