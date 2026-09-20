/**
 * TrainerPhoto — the trainer portrait frame.
 *
 * ── Placeholder by design, not by omission ──────────────────────────
 * PRD Section 5.2: "Photo gallery (training session photos from source PDFs —
 * **replace with licensed/owned photography, do not reuse third-party stock
 * without rights**)."
 *
 * No owned photograph was supplied, so this renders a labelled frame. It does
 * NOT reach for a stock portrait or an invented `/images/trainer.jpg` path: the
 * PRD explicitly warns against third-party stock without rights, and a broken
 * request is worse than an honest empty frame.
 *
 * Setting `TRAINER_PHOTO.src` in `about-content.ts` swaps this for the real
 * `next/image` with no other change.
 *
 * ── Why width/height are always passed ──────────────────────────────
 * The frame reserves its space from first paint, so revealing the section
 * cannot shift the layout — the Web Interface Guidelines require explicit
 * dimensions on images for exactly this reason.
 *
 * ── Height cap and radius ───────────────────────────────────────────
 * A 4:5 portrait at full column width is very tall on a wide desktop. The frame
 * is capped at 32rem so the section stays balanced against the bio column,
 * which is shorter. On hover the frame scales 1% and its halo opens — a frame
 * around a bitmap has no text to re-rasterise, so `scale()` is the right
 * transform here (docs/design-system.md). The cap and the ratio stay inline:
 * both are computed from `TRAINER_PHOTO`, and a hover cannot be declared
 * inline anyway, which is why the rest moved to `.trainer-frame`.
 */

import Image from 'next/image';
import { UserRound } from 'lucide-react';

import { TRAINER_PHOTO } from './about-content';

/** The frame ratio. 4:5 portrait reads as a formal bio photograph. */
const ASPECT = `${TRAINER_PHOTO.width} / ${TRAINER_PHOTO.height}`;

/**
 * The portrait frame.
 *
 * Ratio and cap come from `TRAINER_PHOTO`, so they stay inline; everything
 * that has to respond to a hover lives in `.trainer-frame` in `globals.css`.
 */
export default function TrainerPhoto() {
  return (
    <figure className="relative m-0 w-full">
      {/* Warm halo behind the frame. Decorative, and `aria-hidden` for that
          reason. Its geometry and gradient live in `.trainer-halo` so the
          hover can drive them. */}
      <div aria-hidden="true" className="trainer-halo" />

      <div
        className="trainer-frame mx-auto"
        style={{ aspectRatio: ASPECT, maxWidth: '32rem' }}
      >
        {TRAINER_PHOTO.src ? (
          <Image
            src={TRAINER_PHOTO.src}
            alt={TRAINER_PHOTO.alt}
            width={TRAINER_PHOTO.width}
            height={TRAINER_PHOTO.height}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="h-full w-full object-cover"
          />
        ) : (
          <PlaceholderFrame />
        )}
      </div>
    </figure>
  );
}

/**
 * The stand-in frame.
 *
 * States plainly what belongs here so nobody ships it by accident, and uses the
 * blueprint grid the Hero already defines so it reads as part of the design
 * system rather than a broken slot.
 */
function PlaceholderFrame() {
  return (
    <div
      role="img"
      aria-label={TRAINER_PHOTO.alt}
      className="hero-grid flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <span className="trainer-placeholder-icon flex h-16 w-16 items-center justify-center">
        <UserRound size={28} strokeWidth={2} aria-hidden="true" />
      </span>

      <p className="eyebrow text-[var(--ds-neutral-500)]">Photo placeholder</p>
      <p className="max-w-[26ch] text-caption leading-relaxed text-[var(--ds-neutral-500)]">
        Awaiting owned photography — PRD Section 5.2 specifies training-session
        photos, licensed or owned, not third-party stock.
      </p>
    </div>
  );
}
