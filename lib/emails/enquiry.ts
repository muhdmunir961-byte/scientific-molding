/**
 * The enquiry notification email — sent to the trainer when a lead submits the
 * contact form.
 *
 * Approved design. Two details worth keeping in mind if you edit it:
 *
 *  - **`replyTo` is the enquirer's address**, set by the API route, not here.
 *    Without it, hitting Reply in Gmail goes to the trainer's own inbox and the
 *    address has to be copy-pasted by hand.
 *  - **The "reply within 2 working days" line in the footer is deliberate.**
 *    The auto-reply promises the customer a 2-working-day response, so the
 *    notification carries a subtle reminder of the commitment the customer was
 *    given. Italic, small, warm grey — a nudge, not a heading.
 */

import {
  EMAIL_BRAND,
  escapeHtml,
  formatTimestamp,
  headerBar,
  link,
  maskIp,
  pill,
  row,
  sectionHeading,
} from './shared';

const FONT = 'Arial,Helvetica,sans-serif';

/** The shape the API route passes in. */
export interface EnquiryEmailData {
  name: string;
  company: string;
  jobTitle: string;
  email: string;
  phone: string;
  programs: string[];
  participants: string;
  preferredDates: string;
  message: string;
  /** Masked before it reaches this function. */
  ip: string;
  /** Where the visitor submitted from, or "direct". */
  sourcePage: string;
}

/**
 * Build the notification email.
 *
 * @param data the validated enquiry
 * @returns `{ subject, html }` ready for the mail provider
 */
export function buildEnquiryEmail(data: EnquiryEmailData): {
  subject: string;
  html: string;
} {
  const programCount = data.programs.length;
  /*
   * Zero programmes is a legitimate submission — the checkbox group is optional
   * and a manager who does not yet know which course their team needs is exactly
   * the enquirer this section is for.
   *
   * So the label degrades rather than reading "(0 programmes)", which looks like
   * a rendering fault in the trainer's inbox. "no programme selected" is a true
   * statement about the enquiry, and it tells the trainer to open it rather than
   * to assume the form broke.
   */
  const programLabel =
    programCount === 0
      ? 'no programme selected'
      : programCount === 1
        ? '1 programme'
        : `${programCount} programmes`;

  const subject = `New Training Enquiry — ${data.company} (${programLabel})`;

  /*
   * Optional fields are omitted rather than rendered empty. A row reading
   * "Participants —" makes the trainer scan past it every time; an absent row
   * is faster to read.
   */
  const requestRows = [
    data.participants
      ? row('Participants', escapeHtml(data.participants))
      : '',
    data.preferredDates
      ? row('Preferred Dates', escapeHtml(data.preferredDates))
      : '',
    row('Received via', escapeHtml('Website contact form (#contact)')),
    row('Source page', escapeHtml(data.sourcePage)),
  ].join('');

  const messageBlock = data.message
    ? `<tr><td style="padding:0 24px 24px">
         ${sectionHeading('Message')}
         <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.6;color:${EMAIL_BRAND.charcoal};white-space:pre-wrap">${escapeHtml(data.message)}</p>
       </td></tr>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.white}">
${headerBar()}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EMAIL_BRAND.white}">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%">

      <tr><td style="padding:32px 24px 8px">
        <h1 style="margin:0;font-family:${FONT};font-size:22px;font-weight:bold;color:${EMAIL_BRAND.charcoal}">New Training Enquiry</h1>
        <p style="margin:4px 0 0;font-family:${FONT};font-size:14px;color:${EMAIL_BRAND.warmGrey}">Scientific Molding Training Series</p>
      </td></tr>

      <tr><td style="padding:24px">
        ${sectionHeading('Contact')}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${row('Name', escapeHtml(data.name))}
          ${row('Company', escapeHtml(data.company))}
          ${row('Job Title', escapeHtml(data.jobTitle))}
          ${row('Email', link(`mailto:${data.email}`, data.email))}
          ${row('Phone', link(`tel:${data.phone.replace(/[^\d+]/g, '')}`, data.phone))}
        </table>
      </td></tr>

      <tr><td style="padding:0 24px 24px">
        ${sectionHeading('Request')}
        ${
          programCount > 0
            ? `<div style="margin:0 0 16px">${data.programs.map((p) => pill(p)).join('')}</div>`
            : /* No programme selected: say so rather than rendering an empty
                 div, which would leave a blank band above the table and read as
                 a broken row. */
              `<p style="margin:0 0 16px;font-family:${FONT};font-size:14px;font-style:italic;color:${EMAIL_BRAND.warmGrey}">No specific programme selected &mdash; the enquirer is open to a recommendation.</p>`
        }
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${requestRows}
        </table>
      </td></tr>

      ${messageBlock}

      <tr><td style="padding:16px 24px 8px;border-top:1px solid ${EMAIL_BRAND.border}">
        <p style="margin:0;font-family:${FONT};font-size:12px;color:${EMAIL_BRAND.warmGrey}">
          Submitted <strong style="color:${EMAIL_BRAND.charcoal}">${escapeHtml(formatTimestamp())}</strong>
          &middot; MYT &middot; IP ${escapeHtml(maskIp(data.ip))}
        </p>
        <p style="margin:8px 0 0;font-family:${FONT};font-size:12px;font-style:italic;color:${EMAIL_BRAND.warmGrey}">
          Reply within 2 working days to match the promise made in the auto-reply.
        </p>
      </td></tr>

      <tr><td style="padding:0 24px 32px" height="16">&nbsp;</td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}
