/**
 * Server-side validation for the contact form.
 *
 * ── Why this duplicates the client checks ───────────────────────────
 * Client-side validation is a UX affordance. Anything can POST to this route —
 * curl, a script, a modified form — so the server validates independently and
 * never trusts the shape or content of what arrives.
 *
 * The rules mirror the client's on purpose, so a field rejected in the browser
 * is rejected here with the same message. When they diverge, the user sees an
 * error the client never warned about.
 */

/** Programmes the form may reference. Source: the five PRD 5.3 programs. */
export const PROGRAM_OPTIONS = [
  'Fundamentals',
  'Materials',
  'Process Development',
  'Defect Troubleshooting',
  'Full Pathway',
] as const;

export type ProgramOption = (typeof PROGRAM_OPTIONS)[number];

/** A validated enquiry. */
export interface ValidatedEnquiry {
  name: string;
  company: string;
  jobTitle: string;
  email: string;
  phone: string;
  programs: ProgramOption[];
  participants: string;
  preferredDates: string;
  message: string;
}

/** Field-keyed validation failures, so the client can mark each input. */
export type FieldErrors = Record<string, string>;

export interface ValidationResult {
  ok: boolean;
  data?: ValidatedEnquiry;
  errors?: FieldErrors;
}

/**
 * Collapse whitespace and trim.
 * @param {*} value
 * @returns {string}
 */
function clean(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Derive the source page from a referer header.
 *
 * Returns origin + path only — never the full URL with its query string. A full
 * URL could carry a token or personal identifier, and the trainer only needs to
 * know *which page* the enquiry came from.
 *
 * @param {string|undefined} referer
 * @returns {string} origin + path, or "direct" when absent or unparseable
 */
export function sourcePage(referer: string | undefined): string {
  if (!referer) return 'direct';
  try {
    const url = new URL(referer);
    return `${url.protocol}//${url.host}${url.pathname}`.slice(0, 200);
  } catch {
    return 'direct';
  }
}

/**
 * Validate a Malaysian phone number.
 *
 * Accepts the shapes people actually type: `+60124885247`, `012-488 5247`,
 * `0124885247`, `+60 12 488 5247`. Also accepts any international `+` number,
 * because an overseas enquiry is still a lead.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/[\s\-().]/g, '');
  // Malaysian mobile: 01x-xxxxxxx, optionally prefixed +60.
  if (/^(\+?60)?1\d{8,9}$/.test(digits)) return true;
  // Malaysian landline, e.g. 03-12345678.
  if (/^(\+?60)?[3-9]\d{7,8}$/.test(digits)) return true;
  // Any other international number, conservatively bounded.
  return /^\+\d{7,15}$/.test(digits);
}

/**
 * Validate an email address.
 *
 * Deliberately simple rather than RFC-complete: an over-strict pattern rejects
 * valid addresses, and no regex can confirm an address exists. The real check
 * is the auto-reply — if it bounces, the address was wrong.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isValidEmail(value: string): boolean {
  if (value.length === 0 || value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/**
 * Validate a submitted enquiry.
 *
 * @param {Record<string, unknown>} body parsed request body
 * @returns {ValidationResult}
 */
export function validateEnquiry(body: Record<string, unknown>): ValidationResult {
  const errors: FieldErrors = {};

  const name = clean(body.name);
  const company = clean(body.company);
  const jobTitle = clean(body.jobTitle);
  const email = clean(body.email).toLowerCase();
  const phone = clean(body.phone);
  const participantsRaw = clean(body.participants);
  const preferredDates = clean(body.preferredDates);
  const message = clean(body.message);

  // --- required text -------------------------------------------------
  if (name.length < 2) errors.name = 'Please enter your name.';
  else if (name.length > 120) errors.name = 'Name is too long.';

  if (company.length < 2) errors.company = 'Please enter your company name.';
  else if (company.length > 160) errors.company = 'Company name is too long.';

  if (jobTitle.length < 2) errors.jobTitle = 'Please enter your job title.';
  else if (jobTitle.length > 120) errors.jobTitle = 'Job title is too long.';

  // --- email ---------------------------------------------------------
  if (!email) errors.email = 'Please enter your email address.';
  else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.';

  // --- phone ---------------------------------------------------------
  if (!phone) errors.phone = 'Please enter your phone number.';
  else if (!isValidPhone(phone)) {
    errors.phone =
      'Please enter a valid Malaysian phone number, e.g. +60 12-345 6789.';
  }

  // --- programmes (optional multi-select) ----------------------------
  /*
   * Unknown values are dropped rather than rejected. A stale bookmark or a
   * renamed programme would otherwise block a genuine enquiry over a value the
   * visitor cannot see or fix.
   */
  const rawPrograms = Array.isArray(body.programs) ? body.programs : [];
  const programs = rawPrograms
    .map((p) => clean(p))
    .filter((p): p is ProgramOption =>
      (PROGRAM_OPTIONS as readonly string[]).includes(p),
    );

  // --- participants (optional, 1..100) -------------------------------
  if (participantsRaw) {
    const n = Number.parseInt(participantsRaw, 10);
    if (!Number.isFinite(n) || n < 1 || n > 100) {
      errors.participants = 'Please enter a number between 1 and 100.';
    }
  }

  // --- preferred dates (optional) ------------------------------------
  if (preferredDates.length > 200) {
    errors.preferredDates = 'Please keep this shorter.';
  }

  // --- message (optional, max 500) -----------------------------------
  if (message.length > 500) {
    errors.message = 'Please keep your message under 500 characters.';
  }

  // --- consent -------------------------------------------------------
  // Checked server-side, not only in the browser: a direct POST would
  // otherwise record an enquiry with no consent attached, which is exactly
  // what PDPA compliance depends on.
  if (body.consent !== true && body.consent !== 'true' && body.consent !== 'on') {
    errors.consent = 'Please confirm you agree to be contacted.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      name,
      company,
      jobTitle,
      email,
      phone,
      programs,
      participants: participantsRaw,
      preferredDates,
      message,
    },
  };
}

