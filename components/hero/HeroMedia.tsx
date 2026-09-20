/**
 * HeroMedia — the right-hand visual.
 *
 * ── Placeholder by design, not by omission ──────────────────────────
 * PRD Section 5.1 asks for a high-quality image of an injection moulding
 * machine or engineers. No asset was supplied with the brief, so this renders
 * an explicit, labelled placeholder. It deliberately does NOT reach for a
 * stock photo or an invented `/images/hero.jpg` path: a broken image request
 * and a fabricated asset are both worse than an honest empty frame, and the
 * brief forbids dummy data.
 *
 * Setting `HERO_MEDIA.src` in `hero-content.ts` swaps this for the real
 * `<Image>` with no other change.
 *
 * ── Why next/image ──────────────────────────────────────────────────
 * `width`/`height` are passed even in the placeholder branch so the frame
 * reserves its space from the first paint. That is what prevents the layout
 * shift the Web Interface Guidelines call out — the grid and the fold would
 * otherwise jump when the image finally loads.
 *
 * ── Phase 4B ────────────────────────────────────────────────────────
 * The frame's radius, elevation, border and hover scale moved to
 * `.hero-frame` in `globals.css` — a hover cannot be declared inline. The
 * frame also gained a `::after` grounding gradient, defined alongside it.
 */

import Image from 'next/image';
import { HERO_MEDIA } from './hero-content';

/** The frame ratio. 4:5 portrait gives the visual presence without crowding. */
const ASPECT = `${HERO_MEDIA.width} / ${HERO_MEDIA.height}`;

export default function HeroMedia() {
  return (
    <figure className="relative m-0 w-full">
      {/* Warm halo behind the frame. Purely decorative, so it is aria-hidden
          and kept out of the layout flow.

          This has to stay an inline style: it is a multi-stop gradient with
          two brand colours at specific stops and no token or class expresses
          it, and it is unique to this one element. Unlike the frame's own
          colours below, nothing about it needs a second state. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[var(--ds-radius-xl)] opacity-70 blur-2xl"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 40%, rgba(255,201,60,0.35) 0%, rgba(240,124,35,0.18) 45%, transparent 75%)',
        }}
      />

      {/* The frame's radius, elevation, border and hover scale are on
          `.hero-frame`. The one thing that stays inline is the aspect ratio,
          because it is computed from `HERO_MEDIA`'s intrinsic dimensions —
          an 8px design grid cannot express it, and hard-coding it in CSS
          would let the frame and the asset it reserves space for drift
          apart the moment the asset changes. */}
      <div className="hero-frame" style={{ aspectRatio: ASPECT }}>
        {HERO_MEDIA.src ? (
          <Image
            src={HERO_MEDIA.src}
            alt={HERO_MEDIA.alt}
            width={HERO_MEDIA.width}
            height={HERO_MEDIA.height}
            // Above the fold and critical to the composition.
            priority
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
 * Renders a moulding-platen motif in the brand palette so the placeholder
 * reads as an intentional part of the design rather than a broken slot —
 * and states plainly what belongs here, so nobody ships it by accident.
 */
function PlaceholderFrame() {
  return (
    <div
      role="img"
      aria-label={HERO_MEDIA.alt}
      className="hero-grid flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        fill="none"
        aria-hidden="true"
        className="opacity-80"
      >
        {/* Two platens closing on a mould, drawn rather than illustrated. */}
        <rect x="6" y="10" width="60" height="12" rx="3" stroke="var(--ds-orange-500)" strokeWidth="2.5" />
        <rect x="6" y="50" width="60" height="12" rx="3" stroke="var(--ds-orange-500)" strokeWidth="2.5" />
        <path d="M22 22v28M50 22v28" stroke="var(--ds-yellow-500)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="36" cy="36" r="7" stroke="var(--ds-neutral-500)" strokeWidth="2" />
      </svg>

      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ds-neutral-500)]">
        Image placeholder
      </p>
      <p className="max-w-[24ch] text-xs leading-relaxed text-[var(--ds-neutral-500)]">
        Awaiting the PRD Section 5.1 hero asset — injection moulding machine or
        engineering team.
      </p>
    </div>
  );
}
