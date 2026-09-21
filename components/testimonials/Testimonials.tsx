'use client';

/**
 * Testimonials — §5.5b.
 *
 * ════════════════════════════════════════════════════════════════════
 *  ⚠️  CONTENT REQUIRED — see `testimonials-content.ts`. Every quote below
 *  is a bracketed placeholder. The section is complete; the copy is not.
 * ════════════════════════════════════════════════════════════════════
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
import { Star } from 'lucide-react';
import { useState } from 'react';

import ScrollReveal from '../about/ScrollReveal';
import {
  TESTIMONIALS,
  TESTIMONIALS_CAPTION,
  TESTIMONIALS_HERO,
  TESTIMONIALS_ID,
  type Testimonial,
} from './testimonials-content';

/** The five rating positions, so the loop cannot drift from the denominator. */
const RATING_MAX = 5;

export default function Testimonials() {
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

        <ul className="testimonial-grid">
          {TESTIMONIALS.map((testimonial, i) => (
            <li key={testimonial.id} className="testimonial-cell">
              <ScrollReveal delayMs={i * 80}>
                <TestimonialCard testimonial={testimonial} />
              </ScrollReveal>
            </li>
          ))}
        </ul>
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
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="testimonial-card">
      <blockquote className="testimonial-quote">{testimonial.quote}</blockquote>

      <figcaption className="testimonial-attribution">
        <Avatar src={testimonial.avatar} name={testimonial.name} />

        <div className="min-w-0">
          <p className="testimonial-name">{testimonial.name}</p>
          <p className="testimonial-role">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
      </figcaption>

      <Stars rating={testimonial.rating} />
    </figure>
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

  return (
    <span className="testimonial-avatar">
      {failed ? (
        <span className="testimonial-avatar-fallback" aria-hidden="true">
          {initial.toUpperCase()}
        </span>
      ) : (
        <Image
          src={src}
          alt=""
          width={60}
          height={60}
          sizes="60px"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </span>
  );
}

/**
 * The rating.
 *
 * `role="img"` with an `aria-label` on the wrapper, and `aria-hidden` on every
 * glyph: the accessible name is "5 out of 5 stars" once. Five separately
 * announced graphics would be five interruptions for one value.
 */
function Stars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={`${rating} out of ${RATING_MAX} stars`}
      className="testimonial-stars"
    >
      {Array.from({ length: RATING_MAX }, (_, i) => (
        <Star
          key={i}
          size={16}
          strokeWidth={2}
          aria-hidden="true"
          className={i < rating ? 'testimonial-star-filled' : 'testimonial-star-empty'}
        />
      ))}
    </span>
  );
}
