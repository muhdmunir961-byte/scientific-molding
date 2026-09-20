/**
 * TRAINER CREDIBILITY — reusable block shown in every program.
 *
 * SOURCE OF TRUTH: the supplied PDF content, extracted verbatim.
 *
 * ── Why this is a separate module ──────────────────────────────────
 * The brief says "Reusable — Display in every program", so the data lives in
 * one place rather than being repeated per program. `components/about/` already
 * renders the same credentials in Section 5.2; these are the same facts in the
 * PDF's wording, kept separate so an edit to the program-block copy cannot
 * silently change the About section.
 *
 * ── Note on the credentials ────────────────────────────────────────
 * The credential list and the three stats are IDENTICAL to the values already
 * extracted in `about-content.ts` from PRD Section 5.2 — the PDF block and the
 * PRD agree here, with no wording difference. So this file exists mainly for
 * the reusable block's framing (name + credentials + stats as one unit).
 */

/** Trainer name, full form. Matches the PRD 5.2 wording. */
export const TRAINER_CREDIBILITY_NAME =
  'Ts. Mohd Hafiedzzul Bin Malek Riduan' as const;

/** Credentials, in the source order. */
export const TRAINER_CREDIBILITY_CREDENTIALS = [
  'Professional Technologist',
  'HRD Corp Accredited Trainer',
  'Global Certification for Plastics Professionals (Routsis, USA)',
  'Injection Molding Driver License (L5, German Training Center)',
  'Former Process Engineer',
  'Senior Lecturer',
  'NOSS Panel member',
] as const;

/**
 * Track-record figures.
 * Preserved as strings — the "+" is part of the value.
 */
export const TRAINER_CREDIBILITY_STATS = [
  { value: '17+', label: 'Years' },
  { value: '500+', label: 'Personnel Trained' },
  { value: '60+', label: 'Companies' },
] as const;

/** Convenience bundle for a reusable <TrainerCredibility /> block. */
export const TRAINER_CREDIBILITY = {
  name: TRAINER_CREDIBILITY_NAME,
  credentials: TRAINER_CREDIBILITY_CREDENTIALS,
  stats: TRAINER_CREDIBILITY_STATS,
} as const;
