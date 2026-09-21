'use client';

/**
 * §5.6 — Contact / Request a Proposal.
 *
 * ── Why this is a client component ──────────────────────────────────
 * It holds form state, validates on blur, and reads `?program=` to pre-check a
 * box. None of that is possible in a server component.
 *
 * ── Validation runs twice, deliberately ─────────────────────────────
 * Here and in the API route, with the same rules and the same wording. The
 * client copy is a UX affordance — instant feedback without a round trip. The
 * server copy is the control, because anything can POST to the route directly.
 * Divergence would mean the user sees an error the client never warned about.
 *
 * ── Pre-select reads `window.location`, not `useSearchParams` ───────
 * `useSearchParams` opts the whole page out of static rendering in the App
 * Router. This page is otherwise fully static, so the query string is read in
 * an effect after mount instead — no hydration mismatch, no dynamic rendering.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

import ScrollReveal from '../about/ScrollReveal';
import ContactDirect from './ContactDirect';
import ProgramCtaFooter from './ProgramCtaFooter';
import { ConsentField, Field, ProgramCheckboxes } from './FormFields';
import {
  CONTACT_HERO,
  CONTACT_ID,
  CONTACT_LABELS,
  CONTACT_PLACEHOLDERS,
  CONTACT_PROGRAMS,
  CONTACT_SUCCESS,
} from './contact-content';

/**
 * Validation messages.
 *
 * Byte-identical to the strings in `lib/contact-validation.ts`. Changing one
 * without the other produces a field the browser accepts and the server
 * rejects, with a message the user has never seen.
 */
const MESSAGES = {
  name: 'Please enter your name.',
  company: 'Please enter your company name.',
  jobTitle: 'Please enter your job title.',
  emailRequired: 'Please enter your email address.',
  emailInvalid: 'Please enter a valid email address.',
  phoneRequired: 'Please enter your phone number.',
  phoneInvalid: 'Please enter a valid Malaysian phone number, e.g. +60 12-345 6789.',
  participants: 'Please enter a number between 1 and 100.',
  message: 'Please keep your message under 500 characters.',
  consent: 'Please confirm you agree to be contacted.',
} as const;

/** Same rule as the server's `isValidEmail`. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Same rule as the server's `isValidPhone`.
 * @param {string} value
 * @returns {boolean}
 */
function isValidPhone(value: string): boolean {
  const digits = value.replace(/[\s\-().]/g, '');
  if (/^(\+?60)?1\d{8,9}$/.test(digits)) return true;
  if (/^(\+?60)?[3-9]\d{7,8}$/.test(digits)) return true;
  return /^\+\d{7,15}$/.test(digits);
}

type Errors = Partial<Record<string, string>>;

export default function Contact() {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [serverError, setServerError] = useState('');
  const [messageLength, setMessageLength] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    /*
     * The programme CTA links to `#contact?program=<slug>`, so the param lives
     * in the hash, not the query string — a plain `#contact` link would scroll
     * here without also having to be a full page navigation.
     *
     * `useSearchParams` cannot see hash content, and reading the query string
     * would miss it, so this reads the hash directly. Both forms are accepted:
     * a bare `?program=` in the query string still works, which keeps the
     * behaviour predictable if the link is ever rewritten.
     */
    const read = () => {
      const hash = window.location.hash;
      const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
      const slug =
        new URLSearchParams(hashQuery).get('program') ??
        new URLSearchParams(window.location.search).get('program');

      if (slug && CONTACT_PROGRAMS.some((p) => p.slug === slug)) setSelected([slug]);
    };

    read();
    // The hash changes on an in-page navigation to the CTA link, which does not
    // remount this component.
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  /**
   * Validate a single field.
   * @param {string} name
   * @param {string} value
   * @returns {string} the message, or an empty string when valid
   */
  function validateField(name: string, value: string): string {
    switch (name) {
      case 'name':
        return value.trim().length >= 2 ? '' : MESSAGES.name;
      case 'company':
        return value.trim().length >= 2 ? '' : MESSAGES.company;
      case 'jobTitle':
        return value.trim().length >= 2 ? '' : MESSAGES.jobTitle;
      case 'email':
        if (!value.trim()) return MESSAGES.emailRequired;
        return EMAIL_RE.test(value.trim().toLowerCase()) ? '' : MESSAGES.emailInvalid;
      case 'phone':
        if (!value.trim()) return MESSAGES.phoneRequired;
        return isValidPhone(value.trim()) ? '' : MESSAGES.phoneInvalid;
      case 'participants': {
        if (!value.trim()) return '';
        const n = Number.parseInt(value, 10);
        return Number.isFinite(n) && n >= 1 && n <= 100 ? '' : MESSAGES.participants;
      }
      case 'message':
        return value.length <= 500 ? '' : MESSAGES.message;
      default:
        return '';
    }
  }

  /** Clear a field's error as soon as it becomes valid. */
  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  }

  /** Toggle one programme checkbox. */
  function toggleProgram(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  /**
   * Validate everything, focus the first failure, and report whether to send.
   * @returns {boolean}
   */
  function validateAll(): boolean {
    const form = formRef.current;
    if (!form) return false;

    const data = new FormData(form);
    const next: Errors = {};

    for (const field of ['name', 'company', 'jobTitle', 'email', 'phone', 'participants', 'message']) {
      const message = validateField(field, String(data.get(field) ?? ''));
      if (message) next[field] = message;
    }

    if (data.get('consent') !== 'on') next.consent = MESSAGES.consent;

    setErrors(next);

    // Focus the first failure so a keyboard user is not left hunting for it.
    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return false;
    }
    return true;
  }


  /** Submit the enquiry. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError('');

    if (!validateAll()) return;

    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus('sending');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          company: data.get('company'),
          jobTitle: data.get('jobTitle'),
          email: data.get('email'),
          phone: data.get('phone'),
          // Slug -> display label, so the email reads "Process Development"
          // rather than "process-development".
          programs: selected.map(
            (slug) => CONTACT_PROGRAMS.find((p) => p.slug === slug)?.label ?? slug,
          ),
          participants: data.get('participants'),
          preferredDates: data.get('preferredDates'),
          message: data.get('message'),
          consent: true,
          website: data.get('website'),
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        // Field errors from the server merge back into the form, so a rule the
        // client missed still marks the right input.
        if (payload?.errors) setErrors(payload.errors);
        setServerError(payload?.error || 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      setStatus('sent');
    } catch {
      setServerError('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  }

  return (
    <section
      id={CONTACT_ID}
      aria-labelledby={`${CONTACT_ID}-heading`}
      className="contact-section relative isolate w-full overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="hero-grid hero-grid-mask pointer-events-none absolute inset-0 -z-10"
      />

      <div className="container contact-inner">
        <ScrollReveal>
          <header className="contact-hero">
            <p className="eyebrow">{CONTACT_HERO.eyebrow}</p>
            <h2 id={`${CONTACT_ID}-heading`} className="text-h2 contact-title">
              {CONTACT_HERO.title}
            </h2>
            <p className="text-body contact-subcopy">{CONTACT_HERO.subcopy}</p>
          </header>
        </ScrollReveal>

        <ScrollReveal>
          <ProgramCtaFooter />
        </ScrollReveal>

        <div className="contact-grid">
          <ScrollReveal>
            {status === 'sent' ? (
              <SuccessCard onReset={() => setStatus('idle')} />
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                <ServerErrorBanner show={status === 'error'} message={serverError} />
                <DetailFields errors={errors} onBlur={handleBlur} />
                <ProgramCheckboxes selected={selected} onToggle={toggleProgram} />
                <DatesField formId={formId} />
                <MessageField
                  formId={formId}
                  error={errors.message}
                  length={messageLength}
                  onLengthChange={setMessageLength}
                  setError={(message) =>
                    setErrors((prev) => ({ ...prev, message }))
                  }
                />
                <Honeypot formId={formId} />
                <ConsentField formId={formId} error={errors.consent} />
                <SubmitButton sending={status === 'sending'} />
              </form>
            )}
          </ScrollReveal>

          <ScrollReveal delayMs={80}>
            <ContactDirect />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}


/* ------------------------------------------------------------------ *
 * Form blocks
 * ------------------------------------------------------------------ */

/** The red alert shown above the form when the server rejects a submission. */
/**
 * The server-error banner.
 *
 * `role="alert"` so it is announced the moment it appears — a submit that fails
 * with no visible change is the worst outcome for a form, and an alert region is
 * what stops it being silent for a screen-reader user.
 *
 * The red tint is the one non-palette colour in the form, and deliberately so:
 * an error state that uses a brand colour reads as a feature rather than as a
 * problem. `--ds-*` has no semantic red, and inventing a token for one use would
 * imply it is reusable. See `.contact-error` in `globals.css`.
 */
function ServerErrorBanner({ show, message }: { show: boolean; message: string }) {
  if (!show || !message) return null;

  return (
    <div role="alert" className="contact-error">
      <AlertCircle size={20} aria-hidden="true" className="contact-error-icon" />
      <p className="contact-error-text">{message}</p>
    </div>
  );
}

/** The six text-like fields. */
function DetailFields({
  errors,
  onBlur,
}: {
  errors: Errors;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="sr-only">Your details</legend>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <Field
          name="name"
          label={CONTACT_LABELS.name}
          placeholder={CONTACT_PLACEHOLDERS.name}
          error={errors.name}
          required
          autoComplete="name"
          onBlur={onBlur}
        />
        <Field
          name="company"
          label={CONTACT_LABELS.company}
          placeholder={CONTACT_PLACEHOLDERS.company}
          error={errors.company}
          required
          autoComplete="organization"
          onBlur={onBlur}
        />
        <Field
          name="jobTitle"
          label={CONTACT_LABELS.jobTitle}
          placeholder={CONTACT_PLACEHOLDERS.jobTitle}
          error={errors.jobTitle}
          required
          autoComplete="organization-title"
          onBlur={onBlur}
        />
        <Field
          name="email"
          type="email"
          label={CONTACT_LABELS.email}
          placeholder={CONTACT_PLACEHOLDERS.email}
          error={errors.email}
          required
          autoComplete="email"
          spellCheck={false}
          onBlur={onBlur}
        />
        <Field
          name="phone"
          type="tel"
          label={CONTACT_LABELS.phone}
          placeholder={CONTACT_PLACEHOLDERS.phone}
          error={errors.phone}
          required
          autoComplete="tel"
          onBlur={onBlur}
        />
        <Field
          name="participants"
          type="number"
          label={CONTACT_LABELS.participants}
          placeholder={CONTACT_PLACEHOLDERS.participants}
          error={errors.participants}
          min={1}
          max={100}
          onBlur={onBlur}
        />
      </div>
    </fieldset>
  );
}

/**
 * Preferred dates.
 *
 * `autoComplete="off"` because a date preference is not a name or an address,
 * and letting the browser autofill it produces nonsense.
 */
function DatesField({ formId }: { formId: string }) {
  return (
    <div className="mt-8">
      <label htmlFor={`${formId}-dates`} className="field-label">
        {CONTACT_LABELS.preferredDates}
      </label>
      <input
        id={`${formId}-dates`}
        name="preferredDates"
        className="field-input"
        placeholder={CONTACT_PLACEHOLDERS.preferredDates}
        maxLength={200}
        autoComplete="off"
      />
    </div>
  );
}

/**
 * Message, with a live character counter.
 *
 * The counter and the error are mutually exclusive, so they never stack. The
 * textarea writes its own error through `onBlur`, matching the shared validator
 * the parent uses for the inputs.
 */
function MessageField({
  formId,
  error,
  length,
  onLengthChange,
  setError,
}: {
  formId: string;
  error?: string;
  length: number;
  onLengthChange: (n: number) => void;
  setError: (message: string) => void;
}) {
  return (
    <div className="mt-8">
      <label htmlFor={`${formId}-message`} className="field-label">
        {CONTACT_LABELS.message}
      </label>
      <textarea
        id={`${formId}-message`}
        name="message"
        className="field-input"
        rows={5}
        maxLength={500}
        placeholder={CONTACT_PLACEHOLDERS.message}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${formId}-message-error` : undefined}
        onChange={(e) => {
          onLengthChange(e.target.value.length);
          setError(validateMessage(e.target.value));
        }}
      />

      {error ? (
        <p className="field-error" id={`${formId}-message-error`} role="alert">
          {error}
        </p>
      ) : (
        <p
          className="mt-2 text-right text-xs"
          style={{
            color: 'var(--pdf-warm-grey)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {length} / 500
        </p>
      )}
    </div>
  );
}

/**
 * Validate the message length.
 *
 * A module-level function rather than a method on the component, so
 * `MessageField` can use it without receiving the whole form state.
 *
 * @param {string} value
 * @returns {string} the message, or an empty string when valid
 */
function validateMessage(value: string): string {
  return value.length <= 500 ? '' : MESSAGES.message;
}

/**
 * The submit button.
 *
 * Full-width on mobile, auto on desktop: at 375px a button hugging a long label
 * is an awkward target, and the form column is the whole width anyway.
 *
 * The spinner is `aria-hidden` and the in-flight state is announced from the
 * `role="status"` paragraph below it, so a screen reader hears "Sending your
 * enquiry" once rather than an unlabelled graphic.
 *
 * ── Polish #7, Session 2 ────────────────────────────────────────────
 * This block was previously defined TWICE in this file, and the first copy was
 * unterminated — `validateMessage` above closed without its brace and the
 * duplicate `SubmitButton`/`SuccessCard` pair followed it. The duplication is
 * gone and the brace is closed; the styles moved to `.contact-submit` in
 * `globals.css`, so all four states (rest, hover, focus-visible and the disabled
 * state while sending) are declared together at one specificity.
 */
function SubmitButton({ sending }: { sending: boolean }) {
  return (
    <>
      <button type="submit" disabled={sending} className="contact-submit">
        {sending ? (
          <>
            <span aria-hidden="true" className="contact-submit-spinner" />
            Sending…
          </>
        ) : (
          'Send Enquiry'
        )}
      </button>

      {/*
       * The spinner is `aria-hidden`, so this is the only signal a screen
       * reader gets that the request is in flight.
       */}
      <p className="sr-only" role="status">
        {sending ? 'Sending your enquiry' : ''}
      </p>
    </>
  );
}

/**
 * Success state, shown in place of the form.
 *
 * The form is replaced rather than annotated, so the same enquiry cannot be
 * submitted twice by hitting the button again.
 *
 * ── Polish #7, Session 2 ────────────────────────────────────────────
 * The card was a green success tint with a green icon. Green is not in the
 * palette — it appeared nowhere else on the page — so the one moment the visitor
 * most needs to trust read as a different site. It takes the brand's own yellow
 * (`--ds-yellow-100`) with an orange left rule instead: the same
 * tint-plus-accent pairing the Why columns and the credential rows use.
 *
 * `role="status"` plus `aria-live="polite"` is what announces the swap. A form
 * that disappears silently is the failure a sighted user never sees and a
 * screen-reader user always hits.
 */
function SuccessCard({ onReset }: { onReset: () => void }) {
  return (
    <div role="status" aria-live="polite" className="contact-success">
      <CheckCircle size={32} aria-hidden="true" className="contact-success-icon" />

      <h3 className="text-h4 contact-success-heading">{CONTACT_SUCCESS.heading}</h3>

      <p className="text-body-sm contact-success-body">{CONTACT_SUCCESS.body}</p>

      <button type="button" onClick={onReset} className="contact-success-again">
        {CONTACT_SUCCESS.again}
      </button>
    </div>
  );
}

/**
 * The honeypot.
 *
 * Hidden three ways — visually, from assistive tech, and out of the tab order.
 * A real user cannot reach it by any route; only a bot that fills every input
 * will populate it, and the API route then drops the enquiry silently.
 *
 * Not `display: none`: some bots skip hidden fields, and the point is to be
 * filled. `sr-only` clips it to a 1px box, which a scraper still finds in the
 * DOM and a screen reader never announces.
 */
function Honeypot({ formId }: { formId: string }) {
  return (
    <div aria-hidden="true" className="sr-only">
      <label htmlFor={`${formId}-website`}>Leave this empty</label>
      <input
        id={`${formId}-website`}
        name="website"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
