/**
 * TrainerPhoto — the trainer portrait frame plus the session gallery.
 *
 * ── Bug fix: empty placeholder frames ───────────────────────────────
 * The gallery rendered all four `SESSION_IMAGES` unconditionally. `ImageSlot`
 * falls back to a brand gradient when a file is missing, which is right for a
 * single hero frame — "a photograph goes here" — but wrong four times over: the
 * About section showed a 2×2 grid of empty peach tiles, which reads as a broken
 * page rather than as photographs not yet taken.
 *
 * So the grid renders only the sessions that have an image, and disappears
 * entirely when there are none.
 *
 * ── Why the filtered list arrives as a prop ─────────────────────────────
 * Deciding whether a local file exists needs `node:fs`. This component is a
 * client component, so it cannot make that check itself — an earlier attempt put
 * the check in `image-content.ts` and the build failed with
 * `the chunking context does not support external modules (request: node:fs)`.
 *
 * The filter therefore runs in `About.tsx`, which is a server component, and the
 * result comes in as `sessions`. This component only lays out what it is given,
 * which is the right division regardless: it has no business reading a disk.
 *
 * ── Frames, per the brief ───────────────────────────────────────────
 *   Portrait  3:4, radius XL, warm shadow. `--ds-shadow-warm` because the frame
 *             sits beside a yellow-tinted credential list — a brand-adjacent
 *             surface takes the warm shadow per docs/design-system.md.
 *   Sessions  4:3, radius MD, `sm` at rest. Small frames in a 2×2 grid: one rung
 *             of elevation each, so the grid reads as a set rather than as four
 *             competing cards.
 *
 * ── Why the session grid is a `<ul>` ────────────────────────────────
 * Photographs with no order and no caption pair are a set, which is what a list
 * is for. A screen reader reports "list, N items" and can skip it in one action;
 * N bare figures would be announced as they arrive.
 */

import ImageSlot from '../shared/ImageSlot';
import { TRAINER_PORTRAIT_IMAGE, type SessionImage } from '../shared/image-content';

export interface TrainerPhotoProps {
  /**
   * The session photographs that have a file, resolved on the server.
   *
   * Empty means the gallery section is not rendered at all.
   */
  sessions: readonly SessionImage[];
}

/**
 * The portrait and the gallery.
 *
 * The portrait keeps its 32rem cap: a 3:4 frame at full column width is still
 * very tall on a wide desktop, and the bio column beside it is shorter, so an
 * uncapped frame would leave the two columns visibly out of balance.
 *
 * The portrait itself renders unconditionally. Unlike the gallery, a single
 * gradient frame in its place is a legitimate "photo coming" state rather than a
 * grid of holes, and in production it has an uploaded image anyway.
 */
export default function TrainerPhoto({ sessions }: TrainerPhotoProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <figure className="relative m-0 w-full">
        {/* Warm halo behind the frame. Decorative, and `aria-hidden` for that
            reason. Its geometry and gradient live in `.trainer-halo` so the
            hover can drive them. */}
        <div aria-hidden="true" className="trainer-halo" />

        <ImageSlot
          src={TRAINER_PORTRAIT_IMAGE.src}
          width={TRAINER_PORTRAIT_IMAGE.width}
          height={TRAINER_PORTRAIT_IMAGE.height}
          alt={TRAINER_PORTRAIT_IMAGE.alt}
          radius="xl"
          elevation="warm"
          sizes="(max-width: 1024px) 100vw, 40vw"
          objectPosition="50% 25%"
          className="trainer-frame mx-auto"
        />
      </figure>

      {sessions.length > 0 && <SessionGallery sessions={sessions} />}
    </div>
  );
}

/**
 * The training-session photographs.
 *
 * 2×2 from the `sm` breakpoint, one column below it, and the grid adapts to
 * however many photographs exist — three photos leave one cell empty rather
 * than a placeholder frame.
 */
function SessionGallery({ sessions }: { sessions: readonly SessionImage[] }) {
  return (
    <ul className="session-grid">
      {sessions.map((session) => (
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
