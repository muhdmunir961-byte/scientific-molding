/**
 * Admin panel — environment configuration and capability detection.
 *
 * ── Why capability detection rather than hard requirements ──────────────
 * The panel must run in three environments:
 *
 *   1. Local development, with nothing configured at all.
 *   2. A staging box with R2 but no git token.
 *   3. Production, with both.
 *
 * Making every key mandatory would mean the panel cannot start until all three
 * services exist, which blocks the actual work (writing the UI, testing the
 * flow) on an account signup. So each capability is probed and the panel
 * degrades: image uploads fall back to the local filesystem, content edits fall
 * back to writing the `.ts` module directly.
 *
 * This mirrors the existing `RESEND_API_KEY` pattern in
 * `app/api/contact/route.ts`: absent key means a working test path, present key
 * means the real send. It is deliberate that production does NOT silently
 * degrade in the same way for auth — see `lib/admin/auth.ts`.
 *
 * ── Security note on the fallback ──────────────────────────────────────
 * The local filesystem fallback writes inside the running container, so on
 * Coolify the file is lost on the next deploy. That is acceptable for
 * development and unacceptable for production, so `deploymentWarnings()` is
 * surfaced in the admin UI to make the state visible rather than silent.
 */

/** Names of the environment variables the admin panel reads. */
export const ADMIN_ENV = {
  password: 'ADMIN_PASSWORD',
  sessionSecret: 'ADMIN_SESSION_SECRET',
  r2AccountId: 'R2_ACCOUNT_ID',
  r2AccessKeyId: 'R2_ACCESS_KEY_ID',
  r2SecretAccessKey: 'R2_SECRET_ACCESS_KEY',
  r2Bucket: 'R2_BUCKET',
  r2PublicUrl: 'R2_PUBLIC_URL',
  githubToken: 'GITHUB_TOKEN',
  githubRepo: 'GITHUB_REPO',
} as const;

/**
 * Read an environment variable, treating whitespace-only as unset.
 *
 * A Coolify variable created but left blank is extremely common, and
 * `process.env.X` is `''` rather than `undefined` in that case, which would
 * otherwise pass a naive `if (process.env.X)` check.
 * @param {string} name
 * @returns {string} trimmed value, or '' when absent
 */
function read(name: string): string {
  return (process.env[name] ?? '').trim();
}

/**
 * Whether the panel can write images to Cloudflare R2.
 *
 * All four credentials plus the public URL are required: a bucket without a
 * public URL would upload files nobody can load, which is worse than not
 * offering the upload at all.
 * @returns {boolean}
 */
export function isR2Configured(): boolean {
  return (
    read(ADMIN_ENV.r2AccountId) !== '' &&
    read(ADMIN_ENV.r2AccessKeyId) !== '' &&
    read(ADMIN_ENV.r2SecretAccessKey) !== '' &&
    read(ADMIN_ENV.r2Bucket) !== '' &&
    read(ADMIN_ENV.r2PublicUrl) !== ''
  );
}

/**
 * Whether the panel can commit content changes back to the git repository.
 * @returns {boolean}
 */
export function isGitConfigured(): boolean {
  return read(ADMIN_ENV.githubToken) !== '' && read(ADMIN_ENV.githubRepo) !== '';
}

/**
 * Whether a login password has been set.
 *
 * Without this the panel refuses every login rather than allowing an unauthed
 * session — fail closed, matching the contact route's production behaviour.
 * @returns {boolean}
 */
export function isAuthConfigured(): boolean {
  return read(ADMIN_ENV.password) !== '';
}

/** Resolved R2 settings. Only call when `isR2Configured()` is true. */
export function r2Config() {
  return {
    accountId: read(ADMIN_ENV.r2AccountId),
    accessKeyId: read(ADMIN_ENV.r2AccessKeyId),
    secretAccessKey: read(ADMIN_ENV.r2SecretAccessKey),
    bucket: read(ADMIN_ENV.r2Bucket),
    /** e.g. https://cdn.example.com — no trailing slash. */
    publicUrl: read(ADMIN_ENV.r2PublicUrl).replace(/\/+$/, ''),
  };
}

/** Resolved git settings. Only call when `isGitConfigured()` is true. */
export function gitConfig() {
  const repo = read(ADMIN_ENV.githubRepo);
  return {
    token: read(ADMIN_ENV.githubToken),
    /** `owner/name`. */
    repo,
    branch: read('GITHUB_BRANCH') || 'main',
  };
}

/**
 * Warnings to show in the admin UI about degraded capabilities.
 *
 * These are not errors — the panel works — but a content edit that vanishes on
 * the next deploy is the kind of surprise that must be visible at the moment
 * it is made, not discovered a week later.
 * @returns {string[]}
 */
export function deploymentWarnings(): string[] {
  const warnings: string[] = [];

  if (!isR2Configured()) {
    warnings.push(
      'R2 is not configured. Image uploads are saved to the local filesystem, which is lost on the next deploy. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET and R2_PUBLIC_URL.',
    );
  }

  if (!isGitConfigured()) {
    warnings.push(
      'No GITHUB_TOKEN / GITHUB_REPO. Text edits are written to the local filesystem only and will not reach production. Set both to commit changes to the repository.',
    );
  }

  if (process.env.NODE_ENV === 'production' && !isAuthConfigured()) {
    warnings.push(
      'ADMIN_PASSWORD is not set in production. The panel is refusing all logins until it is.',
    );
  }

  return warnings;
}
