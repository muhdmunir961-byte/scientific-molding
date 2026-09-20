/**
 * Shared primitives for the two transactional emails.
 *
 * ── Why inline styles only ──────────────────────────────────────────
 * Gmail strips `<style>` blocks in many contexts and `outlook.com` strips the
 * entire `<head>`. Inline `style` attributes are the only thing that survives
 * both, so every rule below is inline even though it reads repetitively.
 *
 * ── Why `role="presentation"` ───────────────────────────────────────
 * Email has no semantic HTML, but a screen reader still walks the markup. The
 * attribute tells it "this table is layout, not data", so a reader announces
 * the content rather than "table, 3 columns, 12 rows" before every block.
 *
 * ── Why a white body, not the site's off-white ──────────────────────
 * `#FDFBF7` renders as a washed grey in a mail client's dark mode. White stays
 * legible, and the orange header bar carries the branding instead.
 */

/** Brand values, mirrored from the `--pdf-*` tokens in `globals.css`. */
export const EMAIL_BRAND = {
  orange: '#E8631C',
  charcoal: '#2A2A2A',
  warmGrey: '#6B6B63',
  border: '#E0E0E0',
  white: '#FFFFFF',
} as const;

const FONT = 'Arial,Helvetica,sans-serif';

/**
 * Reduce a value to text that is safe to interpolate into the email HTML.
 *
 * Every field in these emails originates from a public form, so all of it is
 * untrusted. Without escaping, a submitted name of
 * `<img src=x onerror=...>` would be rendered as markup in the recipient's
 * mail client — stored HTML injection delivered by email.
 *
 * @param {*} value
 * @returns {string}
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * The orange bar that opens both emails.
 * @returns {string}
 */
export function headerBar(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="background:${EMAIL_BRAND.orange};height:6px;line-height:6px;font-size:0">&nbsp;</td></tr>
</table>`;
}

/**
 * A section heading inside an email body.
 * @param {string} text
 * @returns {string}
 */
export function sectionHeading(text: string): string {
  return `<h2 style="margin:0 0 12px;font-family:${FONT};font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.08em;color:${EMAIL_BRAND.warmGrey}">${escapeHtml(text)}</h2>`;
}

/**
 * A label/value row.
 * @param {string} label
 * @param {string} value already escaped by the caller
 * @returns {string}
 */
export function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:4px 16px 4px 0;font-family:${FONT};font-size:14px;color:${EMAIL_BRAND.warmGrey};vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>
    <td style="padding:4px 0;font-family:${FONT};font-size:14px;color:${EMAIL_BRAND.charcoal}">${value}</td>
  </tr>`;
}

/**
 * One programme pill.
 *
 * The border is set as well as the fill: some clients strip `background-color`
 * from inline elements, and a white-on-white pill would be invisible.
 *
 * @param {string} label
 * @returns {string}
 */
export function pill(label: string): string {
  return `<span style="display:inline-block;background:${EMAIL_BRAND.orange};border:1px solid ${EMAIL_BRAND.orange};color:${EMAIL_BRAND.white};padding:6px 12px;border-radius:999px;font-family:${FONT};font-weight:bold;font-size:13px;margin:0 6px 6px 0">${escapeHtml(label)}</span>`;
}

/**
 * An orange text link.
 * @param {string} href
 * @param {string} label
 * @returns {string}
 */
export function link(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="color:${EMAIL_BRAND.orange};font-family:${FONT};font-weight:bold;text-decoration:none">${escapeHtml(label)}</a>`;
}

/**
 * Mask an IP address for storage in the email footer.
 *
 * Keeps enough to spot an abusive source, drops the part that identifies a
 * specific device. Full IPs are personal data in several jurisdictions,
 * including under Malaysia's PDPA.
 *
 * @param {string} ip
 * @returns {string}
 */
export function maskIp(ip: string): string {
  if (!ip) return 'unknown';
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 3).join(':')}::x`;
  }
  const parts = ip.split('.');
  if (parts.length !== 4) return 'unknown';
  return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
}

/**
 * Format a timestamp in Malaysia time for the email footer.
 *
 * Uses an explicit timezone rather than the server's local zone: the server
 * may run in UTC, and a footer reading `06:32` when the enquiry arrived at
 * `14:32` reads as an error.
 *
 * @param {Date} [date]
 * @returns {string}
 */
export function formatTimestamp(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}
