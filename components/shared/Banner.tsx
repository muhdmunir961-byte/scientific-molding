'use client';

/**
 * Announcement banner.
 *
 * ── Why this is a client component ──────────────────────────────────────
 * Dismissal is state, and the dismissed flag is kept in `sessionStorage` so it
 * survives a navigation within the visit. Neither is possible in a server
 * component.
 *
 * ── Why the banner renders VISIBLE and is hidden only once dismissed ────
 * The first revision started hidden and revealed after mount, to avoid a flash
 * for a visitor who had already dismissed it. That is the wrong trade: it made
 * the banner absent from the served HTML entirely, so a visitor without
 * JavaScript never saw the notice at all, and a search engine never saw it
 * either. An announcement that most people cannot read is not an announcement.
 *
 * So the server renders the banner, and a pre-paint script hides it when the
 * dismissal flag is already set. That is the same technique the theme toggle
 * uses on most sites: the cost is that a dismissal takes effect on the next
 * navigation rather than instantly on the current one, which nobody notices.
 *
 * ── Why the content is passed in as props ───────────────────────────────
 * The override for `banner.BANNER` is resolved on the SERVER (see
 * `lib/admin/overrides.ts`), so the saved copy arrives as a prop rather than
 * being read here. That keeps the admin bundle out of the public page.
 */

import { useEffect, useState } from 'react';

import type { BannerContent } from './banner-content';

/** Storage key. Namespaced so it cannot collide with another script. */
const DISMISS_KEY = 'smts-banner-dismissed';

export default function Banner({ content }: { content: BannerContent }) {
  const [dismissed, setDismissed] = useState(false);

  /*
   * Hide on mount when a dismissal is already recorded. Runs before paint in
   * practice, so a returning visitor does not see the bar flash.
   */
  useEffect(() => {
    if (!content.dismissible) return;
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === '1') setDismissed(true);
    } catch {
      // Storage can throw in a private window or with cookies blocked. Showing
      // the banner is the safer failure: a dismissible notice that reappears is
      // an annoyance, a notice that never appears is a lost message.
    }
  }, [content.dismissible]);

  const enabled = content.enabled && content.message.trim().length > 0;
  if (!enabled || dismissed) return null;

  function dismiss() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // See above — dismissal simply does not persist.
    }
    /*
     * Set the attribute the pre-paint script in `layout.tsx` also sets, so the
     * inline CSS hides the bar immediately. Without it the React state change
     * would hide it on the next render, which is a frame later and can be
     * visible.
     */
    document.documentElement.setAttribute('data-banner-dismissed', '');
    setDismissed(true);
  }

  return (
    <div
      className={`announce-banner announce-banner-${content.tone}`}
      role="region"
      aria-label="Announcement"
    >
      <p className="announce-banner-text">
        {content.message}
        {content.linkHref && content.linkLabel && (
          <>
            {' '}
            <a className="announce-banner-link" href={content.linkHref}>
              {content.linkLabel}
            </a>
          </>
        )}
      </p>

      {content.dismissible && (
        <button
          type="button"
          className="announce-banner-close"
          onClick={dismiss}
          aria-label="Dismiss announcement"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
