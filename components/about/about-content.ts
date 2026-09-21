/**
 * About the Trainer — copy and data, PRD Section 5.2.
 *
 * Same convention as `hero/hero-content.ts`: every string lives here verbatim
 * with no interpolation and no logic, so the file can be diffed against the PRD
 * line by line, and `scripts/check-entrance.mjs` asserts each one appears in the
 * served HTML.
 */

/**
 * PRD Section 5.2: "Name: **Ts. Mohd Hafiedzzul Bin Malek Riduan**"
 */
export const TRAINER_NAME = 'Ts. Mohd Hafiedzzul Bin Malek Riduan' as const;

/**
 * Section eyebrow. Matches the naming pattern the PRD uses for section labels
 * ("Eyebrow label (brief type…)" in the 5.3 template).
 */
export const TRAINER_EYEBROW = 'About the Trainer' as const;

/**
 * PRD Section 5.2 credentials, split from the single comma-separated line in
 * the source into one entry per credential.
 *
 * Order is the PRD's order and is not ranked — Professional Technologist first,
 * NOSS Panel member last. `LucideIcon` names are chosen to match the credential
 * type rather than repeated decoratively.
 */
export const TRAINER_CREDENTIALS = [
  { label: 'Professional Technologist', icon: 'badge-check' },
  { label: 'HRD Corp Accredited Trainer', icon: 'graduation-cap' },
  {
    label: 'Global Certification for Plastics Professionals (Routsis, USA)',
    icon: 'award',
  },
  {
    label: 'Injection Molding Driver License (L5, German Training Center)',
    icon: 'gauge',
  },
  { label: 'Former Process Engineer', icon: 'factory' },
  { label: 'Senior Lecturer', icon: 'presentation' },
  { label: 'NOSS Panel member', icon: 'clipboard-check' },
] as const;

/** A figure in the trainer's track-record strip. */
export interface TrainerStat {
  /**
   * The numeral as displayed. A string, not a number: "17+" and "500+" are not
   * numeric values, and storing them as numbers would strip the "+".
   */
  readonly value: string;
  /** The label beneath the numeral. */
  readonly label: string;
  /**
   * Which accent the numeral tile takes.
   *
   * The tile used to be coloured by `index === 0` inside the renderer. That
   * put design data in a component, and worse, it meant reordering the array
   * silently re-coloured the strip. Naming the tone per figure makes the
   * accent follow what the figure *is* — the headline number — and mirrors
   * `HeroStat.tone` in `hero/hero-content.ts` so both strips are configured
   * the same way.
   */
  readonly tone: 'orange' | 'yellow';
}

/**
 * PRD Section 5.2 track record:
 * "15–17+ Years Experience | 400–500+ Personnel Trained |
 *  60+ Injection Molding Companies"
 *
 * These are ranges in the PRD. Per the decision taken for this build, the
 * **upper bound** is shown: 17+ / 500+ / 60+. The reasoning, recorded so it is
 * not lost:
 *
 *   - A range cannot sit in the numeral-tile treatment Section 13.1 specifies
 *     for badges ("Large bold numerals on solid orange or yellow tiles") — a
 *     tile cannot hold "15–17+" without breaking the layout the PRD designs.
 *   - The upper bound is the figure used elsewhere in the source material for
 *     marketing, and 60+ is stated as a floor in the PRD itself.
 *   - If an audience ever challenges a figure, 17+/500+ are the defensible
 *     readings of the PRD's own ranges.
 *
 * Changing this to a lower bound or a midpoint is a single edit here.
 */
export const TRAINER_STATS: readonly TrainerStat[] = [
  { value: '17+', label: 'Years Experience', tone: 'orange' },
  { value: '500+', label: 'Personnel Trained', tone: 'yellow' },
  { value: '60+', label: 'Injection Molding Companies', tone: 'yellow' },
] as const;

/**
 * The trainer photo.
 *
 * PRD Section 5.2 is explicit about the asset policy: "Photo gallery (training
 * session photos from source PDFs — **replace with licensed/owned photography,
 * do not reuse third-party stock without rights**)."
 *
 * So no image is bundled. `src` names the path the asset WILL live at, and
 * `<ImageSlot>` requests it — falling back to a brand gradient until the file
 * exists. Dropping `public/images/trainer-portrait.jpg` in place is the only
 * step needed to go live.
 *
 * `width`/`height` are 600×800 — the 3:4 portrait ratio the brief specifies.
 */
export const TRAINER_PHOTO = {
  width: 600,
  height: 800,
  /** Describes the intended subject, not the empty state. */
  alt: 'Ts. Mohd Hafiedzzul conducting a Scientific Moulding training session',
  /** The asset path. Replace the file to go live. */
  src: '/images/trainer-portrait.jpg',
} as const;

/**
 * Training-session photographs, PRD Section 5.2's "photo gallery".
 *
 * Four slots at 4:3 landscape, laid out 2×2 on desktop. The PRD asks for
 * "training session photos from source PDFs"; none were supplied with rights
 * that survived extraction, so the paths are reserved and the frames render the
 * empty state until owned photography replaces them.
 *
 * ── Why `alt` describes the SUBJECT rather than the file ────────────
 * The alt text is what a screen reader announces in place of the photograph.
 * "Session photo 1" would announce the slot, not the content. These name what
 * the photograph is intended to show, so the group reads as a description of
 * the training environment even before the assets land — and the text is still
 * correct once they do.
 */
export const TRAINER_SESSIONS = [
  {
    src: '/images/session-1.jpg',
    width: 800,
    height: 600,
    alt: 'Engineers reviewing process parameters together on the moulding floor',
  },
  {
    src: '/images/session-2.jpg',
    width: 800,
    height: 600,
    alt: 'In-house training session with the team gathered around a machine control panel',
  },
  {
    src: '/images/session-3.jpg',
    width: 800,
    height: 600,
    alt: 'Trainer explaining a moulding defect against a sample part',
  },
  {
    src: '/images/session-4.jpg',
    width: 800,
    height: 600,
    alt: 'Process engineers documenting an approved machine setup during a workshop',
  },
] as const;

