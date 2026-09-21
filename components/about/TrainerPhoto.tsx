/**
 * TrainerPhoto — the trainer portrait frame plus the session gallery.
 *
 * ── Polish #7 ───────────────────────────────────────────────────────
 * The bespoke placeholder (a `UserRound` icon in a `hero-grid` frame captioned
 * "Photo placeholder") is gone. Both image positions now render through
 * `<ImageSlot>`, so:
 *
 *   - an empty frame is a brand gradient rather than a labelled icon, which
 *     reads as "a photograph goes here" instead of "something is broken";
 *   - the internal note ("Awaiting owned photography — PRD Section 5.2 …") is
 *     no longer customer-facing copy;
 *   - the four session photographs the PRD's "photo gallery" asks for have a
 *     home, in `TRAINER_SESSIONS`.
 *
 * ── Frames, per the brief ───────────────────────────────────────────
 *   Portrait  3:4, radius XL, warm shadow. `--ds-shadow-warm` because the frame
 *             sits beside a yellow-tinted credential list — a brand-adjacent
 *             surface takes the warm shadow per docs/design-system.md.
 *   Sessions  4:3, radius MD, `sm` at rest and `md` on hover. Small frames in a
 *             2×2 grid: one rung of elevation each, so the grid reads as a set
 *             rather than as four competing cards.
 *
 * ── Why the session grid is a `<ul>` ────────────────────────────────
 * Four photographs with no order and no caption pair are a set, which is what a
 * list is for. A screen reader reports "list, 4 items" and can skip it in one
 * action; four bare figures would be announced as they arrive.
 */

import ImageSlot from '../shared/ImageSlot';
import { TRAINER_PHOTO, TRAINER_SESSIONS } from './about-content';

/**
 * The portrait and the gallery.
 *
 * The portrait keeps its 32rem cap: a 3:4 frame at full column width is still
 * very tall on a wide desktop, and the bio column beside it is shorter, so an
 * uncapped frame would leave the two columns visibly out of balance.
 */
export default function TrainerPhoto() {
  return (
    <div className="flex w-full flex-col gap-6">
      <figure className="relative m-0 w-full">
        {/* Warm halo behind the frame. Decorative, and `aria-hidden` for that
            reason. Its geometry and gradient live in `.trainer-halo` so the
            hover can drive them. */}
        <div aria-hidden="true" className="trainer-halo" />

        <ImageSlot
          src={TRAINER_PHOTO.src}
          width={TRAINER_PHOTO.width}
          height={TRAINER_PHOTO.height}
          alt={TRAINER_PHOTO.alt}
          radius="xl"
          elevation="warm"
          sizes="(max-width: 1024px) 100vw, 40vw"
          objectPosition="50% 25%"
          className="trainer-frame mx-auto"
        />
      </figure>

      <SessionGallery />
    </div>
  );
}

/**
 * The four training-session photographs.
 *
 * 2×2 from the `sm` breakpoint, one column below it. Two rather than one at the
 * smallest width because a 4:3 photograph at 320px wide is a 240px-tall frame —
 * two of those side by side still read as photographs rather than as thumbnails.
 */
function SessionGallery() {
  return (
    <ul className="session-grid">
      {TRAINER_SESSIONS.map((session) => (
        <li key={session.src} className="session-grid-item">
          <ImageSlot
            src={session.src}
            width={session.width}
            height={session.height}
            alt={session.alt}
            radius="md"
            elevation="sm"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
          />
        </li>
      ))}
    </ul>
  );
}
