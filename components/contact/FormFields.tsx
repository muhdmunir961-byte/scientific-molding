'use client';

/**
 * Reusable form primitives for the contact form.
 *
 * Kept separate from `Contact.tsx` so the form's own logic stays readable —
 * these are the repetitive, accessibility-critical parts.
 *
 * ── Accessibility contract ──────────────────────────────────────────
 * Every control here:
 *  - has a real `<label>` bound with `htmlFor`, never a placeholder standing in
 *    for one;
 *  - sets `aria-invalid` when in error, which is also what styles the red
 *    border — so the visual and the announced state cannot disagree;
 *  - wires its message with `aria-describedby`, so a screen reader reads the
 *    error as part of the field rather than as unrelated text elsewhere;
 *  - puts the message in a `role="alert"` region so it is announced when it
 *    appears.
 */

import type { FocusEvent } from 'react';

import { CONTACT_CONSENT, CONTACT_PROGRAMS } from './contact-content';

/** Shared props for the two text-like fields. */
interface FieldProps {
  name: string;
  label: string;
  placeholder: string;
  error?: string;
  type?: 'text' | 'email' | 'tel' | 'number';
  required?: boolean;
  autoComplete?: string;
  spellCheck?: boolean;
  min?: number;
  max?: number;
  onBlur: (event: FocusEvent<HTMLInputElement>) => void;
}

/**
 * A labelled text input with inline error handling.
 */
export function Field({
  name,
  label,
  placeholder,
  error,
  type = 'text',
  required = false,
  autoComplete,
  spellCheck,
  min,
  max,
  onBlur,
}: FieldProps) {
  const id = `contact-${name}`;
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {/* The required marker is part of the label, so it inherits the label's
            own size and weight; only its colour is set, from the brand orange
            token (`--ds-orange-500`, the design-system name for the same value
            the `--pdf-*` program palette carries) rather than a legacy
            `--pdf-*` alias — this is a §5.6 form field, not a program section. */}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--ds-orange-500)' }}>
            {' '}*
          </span>
        )}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        className="field-input"
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
        min={min}
        max={max}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        onBlur={onBlur}
      />

      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The five programme checkboxes.
 *
 * A `<fieldset>` with a `<legend>`: the five boxes are one grouped question, and
 * a screen reader announces "Programme(s) of Interest, group" before reading
 * the options. Five bare checkbox-and-label pairs would lose that grouping.
 *
 * Each label wraps its checkbox, so the whole row is one hit target with no
 * dead zone beside the box.
 */
export function ProgramCheckboxes({
  selected,
  onToggle,
}: {
  selected: readonly string[];
  onToggle: (slug: string) => void;
}) {
  return (
    <fieldset className="mt-8 border-0 p-0 m-0">
      <legend className="field-label">Programme(s) of Interest</legend>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CONTACT_PROGRAMS.map((program) => (
          <label
            key={program.slug}
            className="checkbox-row"
            htmlFor={`contact-program-${program.slug}`}
          >
            <input
              type="checkbox"
              id={`contact-program-${program.slug}`}
              name="programs"
              value={program.slug}
              checked={selected.includes(program.slug)}
              onChange={() => onToggle(program.slug)}
            />
            <span className="text-body-sm text-[var(--ds-neutral-800)]">
              {program.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The consent checkbox.
 *
 * Required, and checked server-side too. An enquiry stored without a recorded
 * consent is exactly what PDPA compliance depends on being able to show.
 */
export function ConsentField({
  formId,
  error,
}: {
  formId: string;
  error?: string;
}) {
  return (
    <div className="mt-8">
      <label className="flex items-start gap-4 cursor-pointer" htmlFor={`${formId}-consent`}>
        <input
          type="checkbox"
          id={`${formId}-consent`}
          name="consent"
          /*
           * `required` is set so the browser blocks a submit when consent is
           * unticked. The JS check in `validateAll` is the one that produces the
           * readable inline message, but consent is the one field where relying
           * on script alone is not good enough — PDPA depends on being able to
           * show the enquirer agreed, and a no-JS submit must not slip through
           * with the box empty.
           */
          required
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer"
          /* `accent-color` is the one property that has to reach the native
             checkbox, which no class can target. Orange from the design-system
             token, not the `--pdf-*` alias — see the marker above. */
          style={{ accentColor: 'var(--ds-orange-500)' }}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${formId}-consent-error` : undefined}
        />
        <span
          className="text-body-sm leading-relaxed"
          style={{ color: 'var(--ds-neutral-500)', textWrap: 'pretty' }}
        >
          {CONTACT_CONSENT}{' '}
          <a
            href="/privacy"
            className="underline"
            style={{ color: 'var(--ds-orange-500)' }}
          >
            Privacy Policy
          </a>
        </span>
      </label>

      {error && (
        <p className="field-error" id={`${formId}-consent-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

