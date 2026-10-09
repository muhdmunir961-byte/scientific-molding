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

import { useState } from 'react';

import ScrollReveal from '../about/ScrollReveal';
import { withOverrides } from '@/lib/admin/overrides';
import { TESTIMONIAL_AVATARS } from '../shared/image-content';
import { publishedTestimonials, type Testimonial } from '@/lib/testimonials';
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
 * The avatar override lives in the Images group (a file upload) while the entry
 * itself lives in `content/testimonials.json`. Pairing them here is what lets the
 * operator upload a headshot on one page and edit the quote on another without
 * either clobbering the other.
 *
 * The pairing is by INDEX, which only holds while the upload slots stay named
 * `testimonial1..3` and the entries stay in that order. A fourth testimonial has
 * no slot and falls back to its own `photo` field, which is correct.
 */
function publishedWithPhotos(): (Testimonial & { resolvedPhoto: string })[] {
  return publishedTestimonials().map((testimonial, index) => ({
    ...testimonial,
    resolvedPhoto: TESTIMONIAL_AVATARS[index] || testimonial.photo,
  }));
}




export default function Testimonials() {
  const entries = publishedWithPhotos();

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

        <ul className="testimonial-grid">
          {entries.map((testimonial, i) => (
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
function TestimonialCard({
  testimonial,
}: {
  testimonial: Testimonial & { resolvedPhoto: string };
}) {
  return (
    <figure className="testimonial-card">
      <blockquote className="testimonial-quote">{testimonial.quote}</blockquote>

      <figcaption className="testimonial-attribution">
        <Avatar src={testimonial.resolvedPhoto} name={testimonial.name} />

        <div className="min-w-0">
          <p className="testimonial-name">{testimonial.name}</p>
          <p className="testimonial-role">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
      </figcaption>

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

