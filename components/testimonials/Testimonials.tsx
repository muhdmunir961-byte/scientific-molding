'use client';

/**
 * Testimonials — §5.5b.
 *
 * ════════════════════════════════════════════════════════════════════
 *  ⚠️  CONTENT REQUIRED — see `content/testimonials.json`.
 *
 *  Every shipped entry has `published: false` and bracketed copy. The section
 *  renders nothing at all until real, permissioned quotes are switched on from
 *  `/admin/testimonials`.
 * ════════════════════════════════════════════════════════════════════
 *
 * ── Why unpublished entries are dropped, not hidden ─────────────────
 * A testimonial is a quotation attributed to a named person at a named company.
 * Publishing one that person never gave is a legal exposure under Malaysian
 * consumer-protection and trade-description rules, and it is the one thing the
 * source PDFs cannot supply — neither contains a quote. So the default is
 * hidden, and the section disappears entirely when nothing is published: an
 * empty section looks broken, and a fabricated claim is worse than both.
 *
 * ── Why it sits between Track Record and Contact ────────────────────
 * The Track Record section makes a claim about the trainer ("proven across
 * Malaysian injection moulding"). This section is the corroboration, and the
 * Contact section is the ask. Claim → evidence → invitation is the order a
 * procurement reader moves through, and putting the evidence where they are
 * already weighing the claim is the only placement that does work.
 *
 * ── Why the avatar has a fallback ───────────────────────────────────
 * `next/image`'s `onError` swaps a missing file for an initial-letter tile
 * rather than a broken frame. A testimonial IS the quotation — the photograph
 * is decoration — so the card has to survive an absent headshot. It is also the
 * reason this is a client component: the fallback is state.
 *
 * ── The stars ───────────────────────────────────────────────────────
 * Five 16px `Star` glyphs with the rating as the accessible name. Lucide icons
 * are `aria-hidden`, so "5 out of 5 stars" is announced once from the wrapper
 * rather than as five separate graphics.
 *
 * An unfilled star takes `--ds-neutral-200` rather than a faded orange: at this
 * size a 0.2-alpha orange does not read as "an empty star", it reads as a
 * second colour. That only matters if a rating below 5 is ever published, which
 * is the correct default to design for.
 */

import Image from 'next/image';

import { useCallback, useEffect, useRef, useState } from 'react';

import ScrollReveal from '../about/ScrollReveal';
import { withOverrides } from '@/lib/admin/overrides';
import { TESTIMONIAL_AVATARS } from '../shared/image-content';
import {
  publishedTestimonials,
  testimonialsSettings,
  type Testimonial,
} from '@/lib/testimonials';
import {
  TESTIMONIALS_CAPTION,
  TESTIMONIALS_HERO as TESTIMONIALS_HERO_RAW,
  TESTIMONIALS_ID,
} from './testimonials-content';

/* Admin overrides, resolved once at module load. See Hero.tsx for the reasoning. */
const TESTIMONIALS_HERO = withOverrides('testimonials.TESTIMONIALS_HERO', TESTIMONIALS_HERO_RAW);

/**
 * The quotes the public site may render, in order, with their uploaded photos.
 *
 * The photo comes from the entry's own `photo` field, which the Testimonials page
 * uploads directly onto the entry. It is deliberately NOT a position-based image
 * slot: a slot pairs by index, so inserting a testimonial above another would
 * silently move every headshot down one place — the wrong person's face on the
 * wrong quote.
 */
function publishedWithPhotos(): (Testimonial & { resolvedPhoto: string })[] {
  return publishedTestimonials().map((testimonial, index) => ({
    ...testimonial,
    resolvedPhoto: TESTIMONIAL_AVATARS[index] || testimonial.photo,
  }));
}




export default function Testimonials() {
  const entries = publishedWithPhotos();
  const settings = testimonialsSettings();

  /*
   * Render nothing when there is nothing to show.
   *
   * Returning null rather than an empty section: a heading with no cards under
   * it reads as a broken page, and the brief asks for the section to be hidden
   * when no testimonial is published.
   */
  if (entries.length === 0) return null;

  return (
    <section
      id={TESTIMONIALS_ID}
      aria-labelledby={`${TESTIMONIALS_ID}-heading`}
      aria-describedby={`${TESTIMONIALS_ID}-caption`}
      className="testimonials-section relative isolate w-full overflow-hidden"
    >
      <div className="container testimonials-inner">
        <ScrollReveal>
          <header className="testimonials-hero">
            <p className="eyebrow">{TESTIMONIALS_HERO.eyebrow}</p>

            <h2 id={`${TESTIMONIALS_ID}-heading`} className="text-h2 testimonials-title">
              {TESTIMONIALS_HERO.title}
            </h2>

            <p className="text-body testimonials-subcopy">
              {TESTIMONIALS_HERO.subcopy}
            </p>
          </header>
        </ScrollReveal>

        <p id={`${TESTIMONIALS_ID}-caption`} className="sr-only">
          {TESTIMONIALS_CAPTION}
        </p>

        {settings.layout === 'slider' ? (
          <TestimonialSlider entries={entries} settings={settings} />
        ) : (
          <ul className="testimonial-grid">
            {entries.map((testimonial, i) => (
              <li key={testimonial.id} className="testimonial-cell">
                <ScrollReveal delayMs={i * 80}>
                  <TestimonialCard testimonial={testimonial} lightbox={settings.lightbox} />
                </ScrollReveal>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/**
 * One testimonial card.
 *
 * The card is not focusable and has no hover handler: it is quoted content, not
 * a control, and there is nothing to activate. It keeps the 2px hover lift so
 * the row responds like every other card on the page — per
 * docs/design-system.md, that is one behaviour, not one per section.
 */
function TestimonialCard({
  testimonial,
  lightbox,
}: {
  testimonial: Testimonial & { resolvedPhoto: string };
  lightbox: boolean;
}) {
  const [open, setOpen] = useState(false);

  /*
   * Only render the attribution when there is something to attribute. A
   * screenshot-only entry has no name yet, and an empty `<p>` with a stray "·"
   * between two blank strings reads as a rendering bug rather than as missing
   * content.
   */
  const hasAttribution = testimonial.name.trim() !== '' || testimonial.role.trim() !== '';
  const roleLine = [testimonial.role, testimonial.company].filter((v) => v.trim() !== '').join(' · ');

  return (
    <figure className="testimonial-card">
      {testimonial.screenshot && (
        <FeedbackScreenshot
          src={testimonial.screenshot}
          crop={testimonial.crop}
          name={testimonial.name}
          expandable={lightbox}
          onExpand={() => setOpen(true)}
        />
      )}

      {open && (
        <Lightbox
          src={testimonial.screenshot}
          alt={`Feedback as submitted by ${testimonial.name}`}
          caption={testimonial.caption}
          onClose={() => setOpen(false)}
        />
      )}

      {testimonial.screenshot && testimonial.caption.trim() !== '' && (
        <figcaption className="testimonial-caption">{testimonial.caption}</figcaption>
      )}

      {testimonial.quote.trim() !== '' && (
        <blockquote className="testimonial-quote">{testimonial.quote}</blockquote>
      )}

      {hasAttribution && (
        <figcaption className="testimonial-attribution">
          <Avatar src={testimonial.resolvedPhoto} name={testimonial.name} />

          <div className="min-w-0">
            {testimonial.name.trim() !== '' && (
              <p className="testimonial-name">{testimonial.name}</p>
            )}
            {roleLine !== '' && <p className="testimonial-role">{roleLine}</p>}
          </div>
        </figcaption>
      )}

      {/*
        * No stars.
        *
        * The published shape has no rating field — the brief's F asks for name,
        * role, company, quote, photo, module tag and a publish toggle, and a star
        * rating is not among them. Rendering a hardcoded five would attribute a
        * score nobody gave, which for a testimonial is exactly the fabrication
        * the publish gate exists to prevent.
        */}
    </figure>
  );
}

/**
 * The horizontal row of cards.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY A SCROLLER AND NOT A TRANSFORMED TRACK
 *
 *  A `translateX` track with an index is the usual carousel implementation, and
 *  it breaks the two things a visitor actually does: swiping on a phone, and
 *  scrolling with a trackpad. Both are native scroll gestures, and a transformed
 *  track ignores them — the row looks scrollable and is not.
 *
 *  So the row IS a scroll container (`overflow-x: auto` with scroll snapping),
 *  which makes swipe, trackpad and shift-wheel work for free. The arrows and the
 *  autoplay drive it by calling `scrollBy`, so there is one source of truth for
 *  the position and no index to drift out of sync with what is on screen.
 * ════════════════════════════════════════════════════════════════════════
 */
function TestimonialSlider({
  entries,
  settings,
}: {
  entries: (Testimonial & { resolvedPhoto: string })[];
  settings: ReturnType<typeof testimonialsSettings>;
}) {
  const trackRef = useRef<HTMLUListElement | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /** Move by one card width, measured from the DOM rather than assumed. */
  const step = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector<HTMLElement>('.testimonial-cell');
    const gap = 32; // matches --ds-space-8 in the stylesheet
    const distance = (card?.offsetWidth ?? track.clientWidth) + gap;

    track.scrollBy({ left: direction * distance, behavior: 'smooth' });
  }, []);

  /*
   * Read the position from scroll events rather than tracking it in state.
   *
   * The visitor can drag, swipe or scroll the row directly, so any index this
   * component kept would be wrong the moment they did. Deriving it means the
   * arrows, the dots and the edge state always describe what is actually shown.
   */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function onScroll() {
      if (!track) return;
      const card = track.querySelector<HTMLElement>('.testimonial-cell');
      const gap = 32;
      const distance = (card?.offsetWidth ?? track.clientWidth) + gap;

      setActive(Math.round(track.scrollLeft / distance));
      setAtStart(track.scrollLeft <= 2);
      // 2px of slack: sub-pixel layout means the exact end is rarely reached.
      setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 2);
    }

    onScroll();
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [entries.length]);

  /*
   * Autoplay.
   *
   * Paused on hover, on focus, when the tab is hidden, and — importantly — when
   * the visitor has asked for reduced motion. A row that keeps moving while
   * someone is reading it is the single most common complaint about carousels,
   * and `prefers-reduced-motion` is the platform's way of saying so.
   */
  useEffect(() => {
    if (!settings.autoplay || paused || entries.length < 2) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const id = window.setInterval(() => {
      const track = trackRef.current;
      if (!track) return;

      // Wrap to the start rather than stopping at the end: a row that halts
      // silently reads as broken.
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      step(1);
    }, settings.autoplaySeconds * 1000);

    return () => window.clearInterval(id);
  }, [settings.autoplay, settings.autoplaySeconds, paused, entries.length, step]);

  return (
    <div
      className="testimonial-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <ul
        ref={trackRef}
        className="testimonial-track"
        style={{ '--testimonial-card-width': `${settings.cardWidth}px` } as React.CSSProperties}
        tabIndex={0}
        role="region"
        aria-label="Testimonials — scroll or use the arrow keys"
      >
        {entries.map((testimonial, i) => (
          <li key={testimonial.id} className="testimonial-cell">
            <ScrollReveal delayMs={Math.min(i, 4) * 80}>
              <TestimonialCard testimonial={testimonial} lightbox={settings.lightbox} />
            </ScrollReveal>
          </li>
        ))}
      </ul>

      {settings.arrows && (
        <div className="testimonial-arrows">
          <button
            type="button"
            className="testimonial-arrow"
            onClick={() => step(-1)}
            disabled={atStart}
            aria-label="Previous testimonial"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            className="testimonial-arrow"
            onClick={() => step(1)}
            disabled={atEnd}
            aria-label="Next testimonial"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {settings.dots && entries.length > 1 && (
        <div className="testimonial-dots" role="tablist" aria-label="Choose a testimonial">
          {entries.map((entry, i) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Testimonial ${i + 1} of ${entries.length}`}
              className="testimonial-dot"
              data-active={i === active}
              onClick={() => {
                const track = trackRef.current;
                const card = track?.querySelector<HTMLElement>('.testimonial-cell');
                if (!track) return;
                track.scrollTo({
                  left: i * ((card?.offsetWidth ?? track.clientWidth) + 32),
                  behavior: 'smooth',
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A screenshot that opens full size on click.
 *
 * ── Why a dialog and not a new tab ──────────────────────────────────────
 * A new tab loses the page the visitor was reading, and on mobile it is a
 * context switch they often do not come back from. The dialog keeps the section
 * behind it, closes on Escape, and traps focus so keyboard users are not
 * dropped into the page behind an overlay.
 */
function Lightbox({
  src,
  alt,
  caption,
  onClose,
}: {
  src: string;
  alt: string;
  caption: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    // The page behind must not scroll while the overlay is open, or the visitor
    // closes it and has lost their place.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="testimonial-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className="testimonial-lightbox-close"
        onClick={onClose}
        aria-label="Close"
      >
        <span aria-hidden="true">✕</span>
      </button>

      {/* Clicks inside the frame must not close it — only the backdrop does. */}
      <figure className="testimonial-lightbox-frame" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} />
        {caption.trim() !== '' && <figcaption>{caption}</figcaption>}
      </figure>
    </div>
  );
}

/**
 * The feedback exactly as the person sent it — a WhatsApp or email capture.
 *
 * ── Why this is not a square thumbnail ──────────────────────────────────
 * The whole point of a screenshot is that it is unedited evidence. Cropping it
 * into a card-shaped frame would remove the name, the timestamp or the message
 * bubble, which is precisely what makes it believable. So it keeps its own
 * aspect ratio and the frame grows to fit.
 *
 * ── How the crop is applied without re-encoding ─────────────────────────
 * The stored file is the original upload, untouched. The crop is a set of
 * fractions of the original, so it is applied with CSS: the image is scaled to
 * `1/w` of the frame's width and shifted by `-x/w`, which shows exactly the
 * selected region. No server-side image library, and changing the crop later
 * never degrades the file.
 *
 * The `padding-top` on the frame reserves the cropped region's aspect ratio
 * before the image loads, so the card does not jump as bytes arrive.
 */
function FeedbackScreenshot({
  src,
  crop,
  name,
  expandable,
  onExpand,
}: {
  src: string;
  crop: Testimonial['crop'];
  name: string;
  expandable: boolean;
  onExpand: () => void;
}) {
  const region = crop ?? { x: 0, y: 0, w: 1, h: 1 };

  /*
   * Guard against a crop saved before validation existed. A zero dimension
   * would divide by zero and collapse the frame.
   */
  const width = region.w > 0 ? region.w : 1;
  const height = region.h > 0 ? region.h : 1;

  const frame = (
    <div
      className="testimonial-screenshot"
      /* The cropped region's ratio, so the frame is the right shape pre-load. */
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <Image
        src={src}
        alt={`Feedback as submitted by ${name}`}
        width={1200}
        height={Math.round(1200 * (height / width))}
        sizes="(min-width: 768px) 33vw, 100vw"
        style={{
          position: 'absolute',
          width: `${100 / width}%`,
          height: `${100 / height}%`,
          left: `${(-region.x * 100) / width}%`,
          top: `${(-region.y * 100) / height}%`,
          maxWidth: 'none',
        }}
      />
    </div>
  );

  /*
   * A button wrapper only when the lightbox is enabled.
   *
   * Rendering a `<button>` around an image that does nothing would add a
   * focus stop and a click target that lead nowhere, which is worse than the
   * image not being clickable at all.
   */
  if (!expandable) return frame;

  return (
    <button
      type="button"
      className="testimonial-screenshot-button"
      onClick={onExpand}
      aria-label={`Open the feedback screenshot from ${name} at full size`}
    >
      {frame}
      <span className="testimonial-expand-hint" aria-hidden="true">
        Click to enlarge
      </span>
    </button>
  );
}

/**
 * The headshot, with an initial-letter fallback.
 *
 * A 60px circle. The fallback is the person's first letter on `--ds-orange-50`
 * with an orange glyph — the same tint/solid pairing the credential tiles use,
 * so an absent headshot reads as a design state rather than as a hole.
 *
 * ── Why the alt text is empty ───────────────────────────────────────
 * The name is already in the adjacent `<p>`. An `alt` naming the person here
 * would make a screen reader say the name twice, once for a decorative
 * photograph. An empty `alt` is the correct value for an image whose
 * information is given in text beside it.
 */
function Avatar({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);

  /* The initial, or a middle dot for a bracketed placeholder — "[Name]" would
     otherwise fall back to "(", which reads as a typo rather than a blank. */
  const cleaned = name.replace(/[^A-Za-z0-9]/g, '');
  const initial = cleaned ? cleaned.charAt(0) : '\u00b7';

  /*
   * An empty `src` is a normal state now that the photo is optional: the panel
   * lets an entry exist with only a screenshot. `next/image` would throw on an
   * empty src, so the fallback tile is rendered directly.
   */
  if (src.trim() === '' || failed) {
    return (
      <span className="testimonial-avatar">
        <span className="testimonial-avatar-fallback" aria-hidden="true">
          {initial.toUpperCase()}
        </span>
      </span>
    );
  }

  return (
    <span className="testimonial-avatar">
      <Image
        src={src}
        alt=""
        width={60}
        height={60}
        sizes="60px"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </span>
  );
}

