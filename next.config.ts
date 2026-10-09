import type { NextConfig } from 'next';

/**
 * Next.js configuration.
 *
 * ── Why `images.remotePatterns` is required here ────────────────────────
 * Images uploaded through `/admin/images` are stored in Cloudflare R2 and
 * referenced by an absolute URL (`https://assets.scientificmoldings.com/...`).
 *
 * `next/image` refuses to optimise a remote host it has not been told about,
 * and it fails at REQUEST time with a 400 rather than at build time — so the
 * build stays green while the hero photograph renders broken in production.
 * That is the worst possible shape for this failure, which is why the pattern
 * is declared explicitly rather than left to be discovered.
 *
 * The hostname is read from `R2_PUBLIC_URL` so the allowlist and the storage
 * configuration cannot drift apart: point the panel at a different bucket
 * domain and the optimiser follows automatically. When the variable is absent
 * (local development, no R2) only the local `/images/*` paths are used, and the
 * pattern list is simply empty.
 *
 * `pathname` is narrowed to `/images/**` because every object the panel writes
 * lives under that prefix — the bucketed path is not a general-purpose CDN
 * allowance.
 */
function r2RemotePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const raw = (process.env.R2_PUBLIC_URL ?? '').trim();
  if (!raw) return [];

  try {
    const url = new URL(raw);
    return [
      {
        protocol: url.protocol.replace(':', '') as 'https' | 'http',
        hostname: url.hostname,
        pathname: '/images/**',
      },
    ];
  } catch {
    // A malformed URL must not take the build down. The panel's own config
    // check already reports the problem in the admin UI, which is where an
    // operator will look.
    return [];
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: r2RemotePatterns(),
  },
};

export default nextConfig;
