'use client';

/**
 * ImageSlot — one image frame, with an honest empty state.
 *
 * ════════════════════════════════════════════════════════════════════
 *  WHY THIS EXISTS
 *
 *  The page previously rendered two bespoke placeholders — `HeroMedia`'s
 *  moulding-platen SVG and `TrainerPhoto`'s `UserRound` icon — each with its
 *  own "Image placeholder" caption. Both were correct for their own section and
 *  both were the wrong shape for what Polish #7 needed:
 *
 *    - Six image positions (hero, portrait, four session photos) would have
 *      meant six more near-copies of the same frame.
 *    - A labelled placeholder with an icon reads as UNFINISHED. A visitor
 *      cannot tell a deliberate "photo coming" state from a broken asset, and
 *      the caption text ("Awaiting the PRD Section 5.1 hero asset") is internal
 *      project language on a customer-facing page.
 *
 *  So there is one frame, and the empty state is a BRAND GRADIENT — no icon, no
 *  caption, no shimmer, no skeleton. It reads as a designed surface that is
 *  awaiting a photograph, which is what it is. `role="img"` plus `aria-label`
 *  keeps it announced as the image it stands in for.
 * ════════════════════════════════════════════════════════════════════
 *
 * ── Why `onError` and not a build-time file check ───────────────────
 * `src` is set in the content modules to the path the asset WILL live at, so
 * dropping the file into `public/images/` is the only step needed to go live —
 * no code change, no env var. `next/image` then requests the real file, and if
 * it is not there yet the request 404s and `onError` flips this frame back to
 * the gradient.
 *
 * A build-time `fs.existsSync` would need the content modules to import
 * `node:fs` and would break the moment the app is deployed somewhere the
 * filesystem is not the one the build read from. An `onError` handler travels
 * with the component.
 *
 * ── Why the aspect ratio is a prop, not a class ─────────────────────
 * It is computed from the asset's intrinsic dimensions in each content module,
 * so it cannot be expressed on the 8px grid. Keeping it a prop means the frame
 * and the file it reserves space for cannot drift: change the asset, change its
 * `width`/`height` beside it, and the box follows.
 *
 * ── Why the radius and shadow are class names ───────────────────────
 * `radius` and `elevation` name an intent (`xl`, `warm`) and the class map owns
 * the token. Passing a raw value would let a frame pick an elevation rung the
 * shadow table does not have, which is the thing docs/design-system.md exists
 * to prevent.
 */

import Image from 'next/image';
import { useState } from 'react';

/** Frame radius. Maps to a `--ds-radius-*` token, never a raw value. */
export type ImageSlotRadius = 'sm' | 'md' | 'lg' | 'xl';

/** Elevation rung. Maps to a `--ds-shadow-*` token, per the shadow table. */
export type ImageSlotElevation = 'sm' | 'md' | 'lg' | 'warm';

export interface ImageSlotProps {
  /** Public path, e.g. `/images/hero-training.jpg`. */
  src: string;
  /** Intrinsic dimensions of the asset — they set the frame ratio. */
  width: number;
  height: number;
  /** Describes the intended subject, not the empty state. */
  alt: string;
  /**
   * `object-position` for the subject. Portraits usually need the subject
   * centred high; a wide session photograph usually does not.
   */
  objectPosition?: string;
  radius?: ImageSlotRadius;
  elevation?: ImageSlotElevation;
  /** Set on the one image above the fold, so it is not lazy-loaded. */
  priority?: boolean;
  /** `sizes` for the srcset. Required on a responsive frame. */
  sizes?: string;
  /** Classes for the outer frame element. */
  className?: string;
}

const RADIUS_CLASS: Record<ImageSlotRadius, string> = {
  sm: 'rounded-[var(--ds-radius-sm)]',
  md: 'rounded-[var(--ds-radius-md)]',
  lg: 'rounded-[var(--ds-radius-lg)]',
  xl: 'rounded-[var(--ds-radius-xl)]',
};

const ELEVATION_CLASS: Record<ImageSlotElevation, string> = {
  sm: 'shadow-[var(--ds-shadow-sm)]',
  md: 'shadow-[var(--ds-shadow-md)]',
  lg: 'shadow-[var(--ds-shadow-lg)]',
  warm: 'shadow-[var(--ds-shadow-warm)]',
};

export default function ImageSlot({
  src,
  width,
  height,
  alt,
  objectPosition,
  radius = 'lg',
  elevation = 'sm',
  priority = false,
  sizes = '100vw',
  className = '',
}: ImageSlotProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`image-slot relative overflow-hidden ${RADIUS_CLASS[radius]} ${ELEVATION_CLASS[elevation]} ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {failed ? (
        /*
         * The brand gradient. `--ds-orange-50` → `--ds-yellow-50` at 135° is the
         * same warm pairing the rest of the page uses, so an empty frame reads as
         * part of the design rather than as a missing asset. `role="img"` is what
         * makes it announce as the photograph it stands in for; without it the
         * frame is an anonymous empty div.
         */
        <div
          role="img"
          aria-label={alt}
          className="h-full w-full"
          style={{
            background:
              'linear-gradient(135deg, var(--ds-orange-50), var(--ds-yellow-50))',
          }}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
          style={objectPosition ? { objectPosition } : undefined}
        />
      )}

      {/*
       * The orange tint, 8%. Warms the highlight side of the photograph and
       * carries the brand colour across the image edge without recolouring the
       * subject.
       *
       * It is a CLASS rather than an inline style so the value lives in the
       * stylesheet with the rest of the palette and so the output checker can
       * assert it. `pointer-events: none` so it cannot swallow a click meant
       * for a link sitting over the frame, and `aria-hidden` because it is
       * purely decorative.
       */}
      <div aria-hidden="true" className="image-slot-tint" />
    </div>
  );
}
