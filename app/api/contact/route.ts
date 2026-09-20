/**
 * POST /api/contact — accept a training enquiry and email it on.
 *
 * ── Flow ────────────────────────────────────────────────────────────
 *   1. Honeypot check      → fake success, no mail, content not logged
 *   2. Rate limit per IP   → 429 (3 per hour)
 *   3. Server validation   → 400 with field-keyed errors
 *   4. Send to the trainer (reply-to = enquirer)
 *   5. Send the auto-reply to the enquirer
 *   6. 200
 *
 * ── Test mode ───────────────────────────────────────────────────────
 * With no `RESEND_API_KEY` set, the route logs the payload and a preview of the
 * rendered email to the server console and returns success. That lets the whole
 * flow be exercised before an email account exists, with no code change to
 * switch over: set the key and it sends for real.
 *
 * In **production** the missing key is fatal instead — see below. Silently
 * accepting enquiries that are never delivered would lose real leads while
 * showing the visitor a success message, which is the worst of both outcomes.
 *
 * ── Why the honeypot returns 200, not 400 ───────────────────────────
 * A bot that receives an error knows the trap and adapts. A bot that receives
 * the same success as everyone else has no signal, and the enquiry is dropped.
 */

import { NextResponse } from 'next/server';

import { buildAutoReply } from '@/lib/emails/auto-reply';
import { buildEnquiryEmail } from '@/lib/emails/enquiry';
import { maskIp } from '@/lib/emails/shared';
import { sourcePage, validateEnquiry } from '@/lib/contact-validation';

export const runtime = 'nodejs';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const FALLBACK_CONTACT_EMAIL = 'hafiedzzul@gmail.com';

/**
 * The destination inbox.
 *
 * Falls back to the address from PRD 5.6 rather than throwing, so a missing
 * variable cannot take the endpoint down in development.
 * @returns {string}
 */
function contactEmail(): string {
  return process.env.CONTACT_EMAIL || FALLBACK_CONTACT_EMAIL;
}

/* ------------------------------------------------------------------ *
 * Rate limiting
 * ------------------------------------------------------------------ */

/** Sliding window: 3 submissions per IP per hour. */
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/**
 * In-memory counters, keyed by masked IP.
 *
 * Adequate for the single-instance v1 shape. It does NOT survive a restart and
 * does NOT share state across instances — move to Redis before scaling out.
 */
const hits = new Map<string, number[]>();

/**
 * Record a hit and report whether the caller is over the limit.
 * @param {string} key
 * @returns {boolean} true when the request should be rejected
 */
function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);

  // Opportunistic sweep so a long-running process does not grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(k);
    }
  }

  return false;
}

/* ------------------------------------------------------------------ *
 * Handler
 * ------------------------------------------------------------------ */

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid request body.' },
      { status: 400 },
    );
  }

  /* --- 1. Honeypot ------------------------------------------------- */
  // Named "website" because that is what a naive bot fills in. A real user
  // never sees it: it is hidden from sight AND from assistive tech.
  if (typeof body.website === 'string' && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true, data: { message: 'received' } });
  }

  /* --- 2. Rate limit ----------------------------------------------- */
  const ip =
    (request.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const ipKey = maskIp(ip);

  if (isRateLimited(ipKey)) {
    return NextResponse.json(
      { ok: false, error: 'Too many enquiries sent. Please try again later.' },
      { status: 429 },
    );
  }

  /* --- 3. Validate ------------------------------------------------- */
  const result = validateEnquiry(body);

  if (!result.ok || !result.data) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Please correct the highlighted fields.',
        errors: result.errors,
      },
      { status: 400 },
    );
  }

  const enquiry = result.data;
  const referer = sourcePage(request.headers.get('referer') ?? undefined);

  /* --- 4/5. Mail --------------------------------------------------- */
  const apiKey = process.env.RESEND_API_KEY;
  const mailConfigured = typeof apiKey === 'string' && apiKey.length > 0;

  if (!mailConfigured && IS_PRODUCTION) {
    /*
     * Fail closed in production. Accepting a submission that is never
     * delivered loses a real lead while showing the visitor success.
     */
    console.error(
      '[contact] RESEND_API_KEY is not set in production. Refusing to accept an enquiry.',
    );
    return NextResponse.json(
      {
        ok: false,
        error: 'Email service is not configured. Please contact us directly.',
      },
      { status: 500 },
    );
  }

  const { subject, html } = buildEnquiryEmail({
    ...enquiry,
    ip,
    sourcePage: referer,
  });

  const { subject: replySubject, html: replyHtml } = buildAutoReply({
    name: enquiry.name,
    programs: enquiry.programs,
    participants: enquiry.participants,
    preferredDates: enquiry.preferredDates,
  });

  if (!mailConfigured) {
    /* --- Test mode: log instead of send ---------------------------- */
    console.info(
      [
        '',
        '┌──────────────────────────────────────────────────────────┐',
        '│  CONTACT FORM — TEST MODE (no RESEND_API_KEY set)        │',
        '│  No email was sent. The payload is logged below.         │',
        '└──────────────────────────────────────────────────────────┘',
        `  to         : ${contactEmail()}`,
        `  reply-to   : ${enquiry.email}`,
        `  subject    : ${subject}`,
        `  auto-reply : ${replySubject}`,
        `  source     : ${referer}`,
        `  ip         : ${ipKey}`,
        '',
        '  payload:',
        JSON.stringify(enquiry, null, 2),
        '',
        '  enquiry html preview (first 600 chars):',
        html.replace(/\s+/g, ' ').slice(0, 600),
        '',
      ].join('\n'),
    );

    return NextResponse.json({
      ok: true,
      data: { message: 'received', testMode: true },
    });
  }

  /* --- Real send --------------------------------------------------- */
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    // Enquiry to the trainer. `replyTo` is the enquirer, so hitting Reply in
    // Gmail writes to them rather than back into the trainer's own inbox.
    const sent = await resend.emails.send({
      from: 'Scientific Molding Training Series <onboarding@resend.dev>',
      to: contactEmail(),
      replyTo: enquiry.email,
      subject,
      html,
    });

    if (sent.error) {
      console.error('[contact] enquiry send failed:', sent.error.message);
      return NextResponse.json(
        {
          ok: false,
          error: 'Could not send your enquiry. Please contact us directly.',
        },
        { status: 502 },
      );
    }

    /*
     * Auto-reply to the visitor.
     *
     * A failure here is logged but does NOT fail the request. The enquiry has
     * already reached the trainer, which is the outcome that matters; losing a
     * courtesy reply is a smaller problem than telling the visitor their
     * enquiry failed when it did not.
     */
    const replied = await resend.emails.send({
      from: 'Scientific Molding Training Series <onboarding@resend.dev>',
      to: enquiry.email,
      subject: replySubject,
      html: replyHtml,
    });

    if (replied.error) {
      console.warn('[contact] auto-reply failed:', replied.error.message);
    }

    return NextResponse.json({ ok: true, data: { message: 'received' } });
  } catch (err) {
    console.error('[contact] unexpected mail error:', err);
    return NextResponse.json(
      { ok: false, error: 'Could not send your enquiry. Please try again.' },
      { status: 500 },
    );
  }
}

