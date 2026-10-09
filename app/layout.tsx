import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';

/**
 * Two font roles, both from PRD Section 13.1:
 *
 *   Heading — "Bold, modern sans-serif (e.g. Poppins/Sora/Inter Bold)"
 *   Body    — "Inter/IBM Plex Sans or similar — clean, highly readable at
 *              small sizes"
 *
 * Loaded through next/font rather than a <link> to Google Fonts: the files are
 * self-hosted, so there is no render-blocking request to a third-party origin,
 * no layout shift while the faces swap in, and no visitor IP sent to Google.
 *
 * Weights are limited to what the Hero actually uses. Each extra weight is
 * another file on the critical path.
 */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Scientific Molding Training Series',
  description:
    '7 structured modules. One stronger moulding organisation. Build capability, improve consistency, strengthen technical decision-making.',
};

/**
 * `themeColor` uses the off-white section background so the mobile browser
 * chrome matches the page. `colorScheme: 'light'` reflects PRD 13.1 — the theme
 * is orange/white/yellow, with "no dark/black sections".
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light',
  themeColor: '#FDFBF7',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <head>
        {/*
         * Hide an already-dismissed announcement banner before first paint.
         *
         * `Banner.tsx` renders the bar on the SERVER so a visitor without
         * JavaScript still sees the notice. That means a returning visitor would
         * otherwise get a flash of a bar they already closed, so this runs
         * synchronously in `<head>` — before the browser paints anything — and
         * removes it from the DOM when the dismissal flag is set.
         *
         * This is the standard technique for exactly this problem. The
         * alternative (rendering hidden and revealing on mount) is what made the
         * banner invisible to no-JS visitors in the first place.
         *
         * Wrapped in try/catch because `sessionStorage` throws in a private
         * window with storage disabled. On failure the banner simply shows,
         * which is the safe direction: a notice that reappears is an annoyance,
         * a notice that never appears is a lost message.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('smts-banner-dismissed')==='1'){document.documentElement.setAttribute('data-banner-dismissed','')}}catch(e){}",
          }}
        />
        {/*
         * The CSS half of that. Kept inline and before the stylesheet so the
         * element is never painted: a stylesheet rule would arrive too late.
         */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              'html[data-banner-dismissed] .announce-banner{display:none!important}',
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

