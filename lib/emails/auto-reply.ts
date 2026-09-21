/**
 * The auto-reply email — sent to the enquirer the moment they submit.
 *
 * Approved design. The most valuable line is the "What you sent us" echo: it
 * proves a readable record arrived, and if the visitor mistyped anything they
 * see it immediately and can reply to correct it.
 */

import { EMAIL_BRAND, escapeHtml, headerBar, link, row, sectionHeading } from './shared';

const FONT = 'Arial,Helvetica,sans-serif';

/** The shape the API route passes in. */
export interface AutoReplyData {
  name: string;
  programs: string[];
  participants: string;
  preferredDates: string;
}

/** Contact routes, from the PRD Section 5.6 details. */
const CONTACT = {
  phoneDisplay: '+60 12-488 5247',
  phoneHref: 'tel:+60124885247',
  email: 'hafiedzzul@gmail.com',
  emailHref: 'mailto:hafiedzzul@gmail.com',
  linkedin: 'linkedin.com/in/hafiedzzul',
  linkedinHref: 'https://linkedin.com/in/hafiedzzul',
} as const;

/** Canonical trainer identity — the full legal form, with credentials. */
const TRAINER = {
  name: 'Ts. Mohd Hafiedzzul Bin Malek Riduan',
  credentials:
    'Professional Technologist &middot; HRD Corp Accredited Trainer &middot; NOSS Panel member',
} as const;

/**
 * Build the auto-reply.
 *
 * @param data the visitor's own submission, echoed back
 * @returns `{ subject, html }` ready for the mail provider
 */
export function buildAutoReply(data: AutoReplyData): {
  subject: string;
  html: string;
} {
  const subject =
    'We received your training enquiry — Scientific Molding Training Series';

  // First name only. "Thank you, Ahmad bin Ismail." reads like a form letter.
  const firstName = data.name.trim().split(/\s+/)[0] || 'there';

  const echoRows = [
    data.programs.length
      ? row('Programmes', data.programs.map(escapeHtml).join(' &middot; '))
      : '',
    data.participants ? row('Participants', escapeHtml(data.participants)) : '',
    data.preferredDates
      ? row('Preferred Dates', escapeHtml(data.preferredDates))
      : '',
  ].join('');

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

      <tr><td style="padding:32px 24px 0">
        <h1 style="margin:0;font-family:${FONT};font-size:22px;font-weight:bold;color:${EMAIL_BRAND.charcoal}">Thank you, ${escapeHtml(firstName)}.</h1>
        <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${EMAIL_BRAND.charcoal}">
          We&rsquo;ve received your enquiry and will send a customised in-house proposal within
          <strong>2 working days</strong>.
        </p>
      </td></tr>

      <tr><td style="padding:24px">
        ${sectionHeading('What you sent us')}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${
            echoRows ||
            /* Nothing was filled in beyond the required fields. Rendering an
               empty table here would make the echo section look broken in the
               visitor's own inbox — the one place the message must read as
               intentional. */
            `<tr><td style="padding:4px 0;font-family:${FONT};font-size:14px;font-style:italic;color:${EMAIL_BRAND.warmGrey}">No programme, participant count or dates specified yet &mdash; we&rsquo;ll suggest options.</td></tr>`
          }
        </table>
        <p style="margin:12px 0 0;font-family:${FONT};font-size:13px;color:${EMAIL_BRAND.warmGrey}">
          If anything above is wrong, just reply to this email and we&rsquo;ll correct it.
        </p>
      </td></tr>

      <tr><td style="padding:0 24px 24px">
        ${sectionHeading('Prefer to talk first?')}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:4px 0;font-family:${FONT};font-size:15px">
            ${link(CONTACT.phoneHref, CONTACT.phoneDisplay)}
          </td></tr>
          <tr><td style="padding:4px 0;font-family:${FONT};font-size:15px">
            ${link(CONTACT.emailHref, CONTACT.email)}
          </td></tr>
          <tr><td style="padding:4px 0;font-family:${FONT};font-size:15px">
            ${link(CONTACT.linkedinHref, CONTACT.linkedin)}
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:16px 24px 32px;border-top:1px solid ${EMAIL_BRAND.border}">
        <p style="margin:0;font-family:${FONT};font-size:14px;font-weight:bold;color:${EMAIL_BRAND.charcoal}">
          ${TRAINER.name}
        </p>
        <p style="margin:4px 0 0;font-family:${FONT};font-size:13px;color:${EMAIL_BRAND.warmGrey}">
          ${TRAINER.credentials}
        </p>
        <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;color:${EMAIL_BRAND.warmGrey}">
          HRD Corp Accredited Trainer &mdash; programmes are HRDC-claimable for Malaysian employers.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}
