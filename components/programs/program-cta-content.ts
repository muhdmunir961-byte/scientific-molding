/**
 * The five program CTA headlines and bodies, collected for the Contact section.
 *
 * ── Why this is a projection, not a copy ────────────────────────────
 * The strings below are reassembled from the same `PROGRAM_*_CTA` constants the
 * program bodies used. Re-typing them here would create a second source of
 * truth for copy that the output checker asserts verbatim, and the two would
 * drift the first time one was edited.
 *
 * Nothing is reworded. Where a program's `body` doubles as an instruction
 * ("REQUEST THE FOUR-DAY TRAINING PROPOSAL") it is used as the body verbatim,
 * because that is what the PDF says.
 *
 * ── Why the sign-offs are dropped ───────────────────────────────────
 * Four of the five CTAs carry a `signoff` naming the trainer, and two of those
 * are PDF-TYPO variants of the name ("Ts. Hafiedzzul B. Malek Riduan" in C,
 * "Ts Mohd Hafiedzzul B Malek Riduan" in D and E). Reproducing all three
 * spellings side by side in one list would read as three different people. The
 * canonical full form appears once in the About section and once in
 * `TrainerCredibility`, which is where a reader looks for it.
 *
 * ── Why the phone and email are dropped ─────────────────────────────
 * Every CTA carried the same number and address. They are rendered once, by
 * `ContactDirect`, directly beneath this block — one place to look, not five.
 */

import {
  PROGRAM_E_CTA,
  PROGRAM_E_HERO,
} from '../programs/program-e-content';
import { PROGRAM_A_CTA, PROGRAM_A_HERO } from '../programs/program-a-content';
import { PROGRAM_B_CTA, PROGRAM_B_HERO } from '../programs/program-b-content';
import { PROGRAM_C_CTA, PROGRAM_C_HERO } from '../programs/program-c-content';
import { PROGRAM_D_CTA, PROGRAM_D_HERO } from '../programs/program-d-content';

export interface ProgramCtaEntry {
  /** Anchor id of the program, also the `?program=` slug. */
  readonly slug: string;
  /** The program's own CTA headline, verbatim. */
  readonly headline: string;
  /** The program's own CTA body, verbatim. */
  readonly body: string;
  /** Link text naming the programme, so five links are distinguishable. */
  readonly label: string;
}

/** The label for one programme, by slug. Used by the program bodies. */
export function ctaLabelFor(slug: string): string | undefined {
  return PROGRAM_CTA_FOOTERS.find((entry) => entry.slug === slug)?.label;
}

/**
 * The five entries, in page order (A → E).
 *
 * `slug` is taken from each program's own hero id rather than written as a
 * literal, so a renamed anchor cannot leave these links pointing at nothing.
 */
export const PROGRAM_CTA_FOOTERS: readonly ProgramCtaEntry[] = [
  {
    slug: PROGRAM_A_HERO.id,
    headline: PROGRAM_A_CTA.headline,
    body: PROGRAM_A_CTA.body,
    label: 'Request Fundamentals',
  },
  {
    slug: PROGRAM_B_HERO.id,
    headline: PROGRAM_B_CTA.headline,
    body: PROGRAM_B_CTA.body,
    label: 'Request Materials',
  },
  {
    slug: PROGRAM_C_HERO.id,
    headline: PROGRAM_C_CTA.headline,
    body: PROGRAM_C_CTA.body,
    label: 'Request Process Development',
  },
  {
    slug: PROGRAM_D_HERO.id,
    headline: PROGRAM_D_CTA.headline,
    body: PROGRAM_D_CTA.body,
    label: 'Request Defect Troubleshooting',
  },
  {
    slug: PROGRAM_E_HERO.id,
    headline: PROGRAM_E_CTA.headline,
    body: PROGRAM_E_CTA.body,
    label: 'Request the 7-Module Pathway',
  },
] as const;
