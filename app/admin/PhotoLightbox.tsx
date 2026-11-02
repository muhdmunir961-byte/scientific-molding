'use client';

/**
 * Full-size photo viewer.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THIS EXISTS
 *
 *  The panel showed every photo as a 96px thumbnail with `object-fit: cover`,
 *  which crops whatever does not fit the square. Checking an upload — "is this
 *  the right screenshot, is the text legible, did the right file go to the right
 *  slot" — was impossible from that, and "open full size" navigated away from the
 *  panel to a bare image, losing your place.
 *
 *  So: click a thumbnail, get the whole photograph, step through the set with
 *  the arrow keys, close with Escape. The open-in-new-tab link is still there for
 *  the case where the operator wants the file itself.
 * ════════════════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect } from 'react';

export interface LightboxItem {
  /** Stable identity, used as the React key. */
  key: string;
  /** Full-size URL. */
  src: string;
  /** Shown under the image. */
  caption?: string;
  /** Alternative text for the image. */
  alt?: string;
}

export interface PhotoLightboxProps {
  items: LightboxItem[];
  /** Index of the open item, or null when closed. */
  index: number | null;
  onIndex: (next: number | null) => void;
  /** Small label above the counter, e.g. the category or the person's name. */
  context?: string;
}

export default function PhotoLightbox({ items, index, onIndex, context }: PhotoLightboxProps) {
  const open = index !== null && items[index] !== undefined;

  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      const next = index + delta;
      if (next < 0 || next >= items.length) return;
      onIndex(next);
    },
    [index, items.length, onIndex],
  );

  /* Keyboard control, bound to the document so it works without a focus trap. */
  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onIndex(null);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      }
    }

    document.addEventListener('keydown', onKey);

    /*
     * The page behind must not scroll while the overlay is up — otherwise a
     * trackpad gesture moves the gallery underneath and closing lands somewhere
     * else. The previous value is restored on close rather than set to '', so a
     * page that was already locked stays locked.
     */
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onIndex, step]);

  if (!open || index === null) return null;

  const item = items[index];
  if (!item) return null;

  return (
    <div
      className="photo-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={context ? `Photo viewer — ${context}` : 'Photo viewer'}
      /* Clicking the backdrop closes; clicking the image itself does not. */
      onClick={() => onIndex(null)}
    >
      <div className="photo-lightbox-bar" onClick={(event) => event.stopPropagation()}>
        <span className="photo-lightbox-count">
          {context ? `${context} · ` : ''}
          {index + 1} / {items.length}
        </span>

        <span className="photo-lightbox-actions">
          <a
            className="admin-button admin-button-secondary admin-button-small"
            href={item.src}
            target="_blank"
            rel="noreferrer"
          >
            Open in new tab
          </a>
          <button
            type="button"
            className="admin-icon-button"
            aria-label="Close viewer"
            onClick={() => onIndex(null)}
          >
            ✕
          </button>
        </span>
      </div>

      <div className="photo-lightbox-stage" onClick={(event) => event.stopPropagation()}>
        {/*
         * A plain <img>: the original bytes are what the operator needs to
         * inspect, and the optimiser would re-encode them at a size it chooses.
         */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.src} alt={item.alt ?? item.caption ?? 'Photo'} />

        {item.caption ? <p className="photo-lightbox-caption">{item.caption}</p> : null}
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            className="photo-lightbox-nav photo-lightbox-prev"
            aria-label="Previous photo"
            disabled={index === 0}
            onClick={(event) => {
              event.stopPropagation();
              step(-1);
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="photo-lightbox-nav photo-lightbox-next"
            aria-label="Next photo"
            disabled={index === items.length - 1}
            onClick={(event) => {
              event.stopPropagation();
              step(1);
            }}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
