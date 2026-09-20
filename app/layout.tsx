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
      <body className="antialiased">{children}</body>
    </html>
  );
}

