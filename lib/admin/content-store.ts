/**
 * Content store — read a module export, write a new value back.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THE WRITE IS ONE JSON FILE, NOT PER-MODULE REGENERATION
 *
 *  An earlier revision generated one `.ts` module per editable group. That does
 *  not scale to ~125 exports across 14 modules: every save would rewrite a file
 *  per module, and each generated file needed its own parser.
 *
 *  Instead the panel maintains a single `content-overrides.generated.ts` holding
 *  a JSON map of `<module>.<export>` → value. `lib/admin/overrides.ts` merges
 *  each entry over the hand-written default at render time.
 *
 *  That gives three properties the per-module approach could not:
 *
 *    1. One writer, one reader, one merge — no per-shape code to keep in step.
 *    2. The merge is additive, so adding a field to a content module does not
 *       invalidate saved overrides for its neighbours.
 *    3. The whole edit history is a diff of one readable file.
 *
 *  ── Why a git commit and not just a file write ──────────────────────────
 *  Coolify builds from the repository. A file written inside the running
 *  container is gone at the next deploy, so a save that only touched the
 *  filesystem would look successful and then silently vanish. Committing through
 *  the GitHub API is what makes the change persist. Without a token the store
 *  writes locally and the panel warns that the change will not reach production.
 * ════════════════════════════════════════════════════════════════════════
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { gitConfig, isGitConfigured } from './config';
import type { JsonValue } from './overrides';

/**
 * Absolute path of the generated directory.
 *
 * The path segments are literals rather than imported constants so the bundler
 * can resolve the directory at build time. A value it cannot see through — even
 * a plain `const` imported from another module — makes Turbopack trace the
 * entire project into the server output, which bloats the deploy and can hit
 * size limits.
 */
const GENERATED_ROOT = join(process.cwd(), 'components', 'generated');

/** The single generated overrides file. */
const OVERRIDES_FILE = 'content-overrides.generated.ts';

/** Repo-relative path of the overrides file, for the GitHub API. */
export const OVERRIDES_PATH = `components/generated/${OVERRIDES_FILE}`;

export interface SaveResult {
  /** How the change was persisted. */
  storage: 'git' | 'local';
  /** Commit SHA when committed. */
  commit?: string;
  /** Human-readable outcome for the UI. */
  message: string;
}

/**
 * Render the overrides file from a map.
 *
 * Values are JSON-encoded rather than template-literal interpolated: JSON
 * escaping handles quotes, newlines and backslashes correctly, and a quote or an
 * apostrophe in a testimonial is entirely likely. A template literal would break
 * the file the first time someone typed one.
 *
 * Keys are sorted so a diff reads as content changes rather than as reordering,
 * and the output is pretty-printed so an operator can review a commit.
 *
 * @param {Record<string, JsonValue>} overrides
 * @returns {string}
 */
export function renderOverridesFile(overrides: Record<string, JsonValue>): string {
  const keys = Object.keys(overrides).sort();

  const body = keys
    .map((key) => {
      const value = JSON.stringify(overrides[key], null, 2).split('\n').join('\n  ');
      return `  ${JSON.stringify(key)}: ${value},`;
    })
    .join('\n');

  return [
    '/* GENERATED FILE — do not edit by hand.',
    ' *',
    ' * Written by the admin panel: /admin/content saves here and commits the result.',
    ' *',
    ' * ── Shape ─────────────────────────────────────────────────────────────',
    ' * A flat map of `<module>.<export>` keys to the module\'s JSON-serialised value.',
    ' * `lib/admin/overrides.ts` merges each entry over the hand-written default at',
    ' * that key, so an absent key means "use the default in the content module".',
    ' *',
    ' * ── Why this file is checked in even when empty ────────────────────────',
    ' * `lib/admin/overrides.ts` imports it unconditionally, so it must exist for a',
    ' * fresh clone to build. An empty map is the honest representation of "nothing',
    ' * has been overridden yet", and it keeps the import static — which lets the',
    ' * bundler tree-shake and avoids the guarded `require` the image override needed.',
    ' */',
    '',
    'export const OVERRIDES: Record<string, unknown> = {',
    body,
    '};',
    '',
  ].join('\n');
}

/**
 * Read the saved override map from disk.
 *
 * Parsed out of the generated file rather than imported, because the file is
 * written at runtime and an `import` would be resolved at build time — a save
 * would not be visible to the next read until a rebuild.
 *
 * The parse is deliberately narrow: it matches `"key": <value>` pairs. That is
 * exactly the shape `renderOverridesFile` produces, so the reader and writer
 * cannot disagree about the format.
 *
 * @returns {Promise<Record<string, JsonValue>>}
 */
export async function readOverrides(): Promise<Record<string, JsonValue>> {
  try {
    const source = await readFile(join(GENERATED_ROOT, OVERRIDES_FILE), 'utf8');

    const start = source.indexOf('export const OVERRIDES');
    if (start === -1) return {};
    const open = source.indexOf('{', start);
    const close = source.lastIndexOf('}');
    if (open === -1 || close <= open) return {};

    // The object body is valid JSON once the trailing commas are removed, so
    // JSON.parse does the work rather than a hand-rolled tokeniser.
    const body = source
      .slice(open + 1, close)
      .replace(/,\s*$/, '')
      .replace(/,\s*(?=[}\]])/g, '');

    return body.trim() ? (JSON.parse(`{${body}}`) as Record<string, JsonValue>) : {};
  } catch {
    // No file yet, or an unreadable one. An empty map means "no overrides",
    // which is the correct behaviour for a fresh checkout.
    return {};
  }
}

/**
 * Commit a file to the repository through the GitHub contents API.
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
    const headBody = (await head.json()) as { sha?: string };
    existingSha = headBody.sha;
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
    throw new Error(`GitHub commit failed (${response.status}). ${detail.slice(0, 200)}`);
  }

  const result = (await response.json()) as { commit?: { sha?: string } };
  return result.commit?.sha ?? '';
}

/**
 * Save a single export's value, merging it into the existing override map.
 *
 * Merging rather than replacing is what lets the panel save one folder at a
 * time: writing the whole map would mean a save from a stale browser tab
 * silently reverts every other module edited since it loaded.
 *
 * @param {string} moduleId
 * @param {string} exportName
 * @param {JsonValue} value the new value for this export
 * @returns {Promise<SaveResult>}
 */
export async function saveExport(
  moduleId: string,
  exportName: string,
  value: JsonValue,
): Promise<SaveResult> {
  const key = `${moduleId}.${exportName}`;
  const existing = await readOverrides();
  const merged: Record<string, JsonValue> = { ...existing, [key]: value };
  const source = renderOverridesFile(merged);

  if (isGitConfigured()) {
    const sha = await commitToGitHub(
      OVERRIDES_PATH,
      source,
      `content(${moduleId}): update ${exportName} from admin panel`,
    );
    return {
      storage: 'git',
      commit: sha,
      message: `Saved and committed to ${gitConfig().repo}. The site redeploys automatically.`,
    };
  }

  await mkdir(GENERATED_ROOT, { recursive: true });
  await writeFile(join(GENERATED_ROOT, OVERRIDES_FILE), source, 'utf8');

  return {
    storage: 'local',
    message:
      'Saved to the local filesystem only. Set GITHUB_TOKEN and GITHUB_REPO for this to reach production.',
  };
}
