/**
 * TrainerCredibility — the reusable trainer strip shown in every program.
 *
 * The brief marks this "Reusable — Display in every program", so it is one
 * component driven by `trainer-credibility.ts` rather than markup repeated five
 * times. A change to the credentials lands in all five programs at once.
 *
 * ── Markup ──────────────────────────────────────────────────────────
 * Credentials are a `<ul>` and the stats a `<dl>`: a list of peers and a set of
 * label/value pairs are exactly what those elements are for, and both give a
 * screen reader counts and item-by-item navigation that a stack of `<div>`s
 * would lose.
 *
 * ── Name form ───────────────────────────────────────────────────────
 * The full legal form is used here, per the design decision: the PDF program
 * CTAs keep their own variants ("Ts. Hafiedzzul B. Malek Riduan" in C,
 * "Ts Mohd Hafiedzzul B Malek Riduan" in D and E), and those stay on the CTAs.
 * This strip is the canonical version.
 *
 * ── Numerals ────────────────────────────────────────────────────────
 * "17+", "500+" and "60+" are strings, not numbers — the "+" and the padding
 * are part of the value. `tabular-nums` keeps the three columns even.
 */

import {
  BadgeCheck,
  ClipboardCheck,
  Factory,
  Gauge,
  GraduationCap,
  Presentation,
  Award,
  type LucideIcon,
} from 'lucide-react';

import ScrollReveal from '../about/ScrollReveal';
import {
  TRAINER_CREDIBILITY,
  TRAINER_CREDIBILITY_CREDENTIALS,
} from '../programs/trainer-credibility';

/**
 * Icon per credential, by position.
 *
 * An array rather than a name lookup: the seven credentials are a fixed ordered
 * set, and position keeps the icon choice next to the data it decorates.
 */
const CREDENTIAL_ICONS: LucideIcon[] = [
  BadgeCheck,
  GraduationCap,
  Award,
  Gauge,
  Factory,
  Presentation,
  ClipboardCheck,
];

export interface TrainerCredibilityProps {
  /** Surface tone. Programs alternate, and the strip must sit on either. */
  tone?: 'light' | 'dark';
}

export default function TrainerCredibility({
  tone = 'light',
}: TrainerCredibilityProps) {
  const isDark = tone === 'dark';
  const stripClass = isDark ? 'trainer-strip-dark' : 'trainer-strip-light';
  const dividerClass = isDark ? 'border-dark-border' : 'border-normal-border';

  return (
    <ScrollReveal>
      <section
        aria-labelledby="trainer-credibility-heading"
        className={`mt-16 trainer-strip ${stripClass} ${dividerClass}`}
      >
        <h3
          id="trainer-credibility-heading"
          className="program-trainer-heading text-xs font-bold uppercase tracking-[0.18em]"
        >
          Your Trainer
        </h3>

        <p
          className="mt-4 program-trainer-name text-xl font-extrabold leading-tight [text-wrap:balance] sm:text-2xl"
        >
          {TRAINER_CREDIBILITY.name}
        </p>

        <ul className="mt-8 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 program-trainer-credentials">
          {TRAINER_CREDIBILITY_CREDENTIALS.map((credential, i) => {
            const Icon = CREDENTIAL_ICONS[i] ?? BadgeCheck;

            return (
              <li key={credential} className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center trainer-credential-icon">
                  <Icon
                    size={16}
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                </span>

                <span className="min-w-0 pt-1 text-[0.9375rem] leading-snug trainer-credential-text">
                  {credential}
                </span>
              </li>
            );
          })}
        </ul>

        <dl
          className={`mt-8 grid grid-cols-1 gap-8 border-t pt-8 sm:grid-cols-3 ${isDark ? 'border-dark-border' : 'border-normal-border'}`}
        >
          {TRAINER_CREDIBILITY.stats.map((stat) => (
            <div key={stat.label} className="flex min-w-0 flex-col">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="m-0 flex flex-col">
                <span
                  aria-hidden="true"
                  className="text-3xl font-extrabold leading-none sm:text-4xl program-trainer-numeral"
                >
                  {stat.value}
                </span>
                <span className="mt-2 text-sm font-medium leading-snug program-trainer-label">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </ScrollReveal>
  );
}
