/**
 * Content store — read a content group, write it back.
 *
 * ── Why a git commit and not just a file write ──────────────────────────
 * Coolify builds from the repository. A file written inside the running
 * container is gone at the next deploy, so a save that only touched the
 * filesystem would look successful and then silently vanish. Committing through
 * the GitHub API is what makes the change actually persist. Without a token the
 * store writes locally and the panel shows a warning that the change will not
 * reach production — a visible degraded state rather than a silent one.
 *
 * See `lib/admin/generated.ts` for why the write produces a separate generated
 * module rather than editing the commented content file in place.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { gitConfig, isGitConfigured } from './config';
import { defaultsFor } from './defaults';
import { GENERATED_DIR, generatedPath, parseGenerated, renderModule } from './generated';
import type { GroupSpec } from './schema';

// `GENERATED_DIR` is asserted equal to the literal in `GENERATED_ROOT` by
// `scripts/check-admin.mjs`, so the two cannot drift apart unnoticed.
void GENERATED_DIR;

/**
 * Absolute path of the generated-module directory.
 *
 * The path segments are literals rather than imported constants so the bundler
 * can resolve the directory at build time. A value it cannot see through — even
 * a plain `const` imported from another module — makes Turbopack trace the
 * entire project into the server output, which bloats the deploy and can hit
 * size limits. The warning is real, not cosmetic: the directory is
 * `components/generated`, and the literal below must match `GENERATED_DIR` in
 * `./generated`.
 */
const GENERATED_ROOT = join(process.cwd(), 'components', 'generated');

export interface SaveResult {
  /** How the change was persisted. */
  storage: 'git' | 'local';
  /** Commit SHA when committed. */
  commit?: string;
  /** Human-readable outcome for the UI. */
  message: string;
}

/**
 * Commit a file to the repository through the GitHub contents API.
 *
 * @param {string} path repo-relative path
 * @param {string} content file source
 * @param {string} message commit message
 * @returns {Promise<string>} the new commit SHA
 */
async function commitToGitHub(
  path: string,
  content: string,
  message: string,
): Promise<string> {
  const { token, repo, branch } = gitConfig();
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'smts-admin',
  };

  /*
   * A PUT needs the current blob SHA to update an existing file. Without it
   * GitHub returns 422 rather than overwriting, which is the correct default:
   * a blind overwrite would clobber a concurrent edit.
   */
  let existingSha: string | undefined;
  const head = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, { headers });
  if (head.ok) {
    const body = (await head.json()) as { sha?: string };
    existingSha = body.sha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch,
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `GitHub commit failed (${response.status}). ${detail.slice(0, 200)}`,
    );
  }

  const result = (await response.json()) as { commit?: { sha?: string } };
  return result.commit?.sha ?? '';
}

/**
 * Save a group's values.
 * @param {GroupSpec} group
 * @param {Record<string, string>} values validated values
 * @returns {Promise<SaveResult>}
 */
export async function saveGroup(
  group: GroupSpec,
  values: Record<string, string>,
): Promise<SaveResult> {
  const path = generatedPath(group);
  const source = renderModule(group, values);

  if (isGitConfigured()) {
    const sha = await commitToGitHub(
      path,
      source,
      `content(${group.id}): update from admin panel`,
    );
    return {
      storage: 'git',
      commit: sha,
      message: `Saved and committed to ${gitConfig().repo}. The site redeploys automatically.`,
    };
  }

  await mkdir(GENERATED_ROOT, { recursive: true });
  await writeFile(join(GENERATED_ROOT, `${group.id}-content.generated.ts`), source, 'utf8');

  return {
    storage: 'local',
    message:
      'Saved to the local filesystem only. Set GITHUB_TOKEN and GITHUB_REPO for this to reach production.',
  };
}

/**
 * Read the current values for a group: the generated module when present,
 * otherwise the hand-written defaults.
 *
 * @param {GroupSpec} group
 * @returns {Promise<Record<string,string>>} field key to value
 */
export async function readGroup(group: GroupSpec): Promise<Record<string, string>> {
  const fallback = defaultsFor(group);

  try {
    const source = await readFile(
      join(GENERATED_ROOT, `${group.id}-content.generated.ts`),
      'utf8',
    );
    // Merge over the defaults so a partially written module still fills the
    // form rather than leaving blank inputs.
    return { ...fallback, ...parseGenerated(source, group) };
  } catch {
    return fallback;
  }
}
