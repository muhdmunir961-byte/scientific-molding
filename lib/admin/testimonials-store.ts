/**
 * Testimonials store — read and write `content/testimonials.json`.
 *
 * ── Why this is its own store and not a content override ────────────────
 * `lib/admin/content-store.ts` writes a flat map of override values keyed by
 * module export. A testimonial list is an ordered array of objects with a stable
 * identity and a publish flag, and the public component reads it through
 * `lib/testimonials.ts` rather than through `withOverrides`. Routing it through
 * the override path would mean the merge logic had to understand array identity
 * for one list.
 *
 * ── Why a JSON file rather than generated TypeScript ────────────────────
 * Same reasoning as the gallery: pure data with no types to infer, diffable, and
 * — the reason that matters — a stray comma cannot break the build. A generated
 * `.ts` module with a syntax error takes the whole site down; a broken `.json`
 * fails this one read.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { gitConfig, isGitConfigured } from './config';
import type { Testimonial } from '@/lib/testimonials';

/** Repo-relative path, for the GitHub API. */
export const TESTIMONIALS_PATH = 'content/testimonials.json';

/** Absolute path of the content directory. Literals, so the bundler can scope it. */
const CONTENT_ROOT = join(process.cwd(), 'content');
const FILE = join(CONTENT_ROOT, 'testimonials.json');

export interface SaveResult {
  storage: 'git' | 'local';
  commit?: string;
  message: string;
}

/**
 * Render the testimonials file.
 *
 * Entries are written in `order`, so a reader never has to sort and the file
 * reads in the order the panel shows. Arrays are pretty-printed with an indent
 * so the diff of a single edited quote is one changed line rather than a
 * reformatted block.
 * @param {Testimonial[]} entries
 * @returns {string}
 */
export function renderTestimonialsFile(entries: Testimonial[]): string {
  const ordered = [...entries].sort((a, b) => a.order - b.order);

  return `${JSON.stringify(
    {
      $comment:
        'Testimonials. Written by the admin panel and committed through the GitHub API. The public site renders only entries with published: true.',
      testimonials: ordered,
    },
    null,
    2,
  )}\n`;
}

/**
 * Read the testimonials from disk.
 *
 * A missing or unparseable file yields an empty list rather than throwing: the
 * public section then renders nothing and the panel shows an empty list, which
 * is the truth, instead of an error page.
 * @returns {Promise<Testimonial[]>}
 */
export async function readTestimonials(): Promise<Testimonial[]> {
  try {
    const raw = await readFile(FILE, 'utf8');
    const parsed = JSON.parse(raw) as { testimonials?: Testimonial[] };
    const entries = parsed.testimonials;
    if (!Array.isArray(entries)) return [];
    return [...entries].sort((a, b) => a.order - b.order);
  } catch {
    return [];
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
 * Save the whole list.
 *
 * The whole list rather than one entry, because every operation the panel
 * offers — add, delete, reorder, toggle — changes positions, and a partial write
 * cannot express "this moved to index 0" without also rewriting its neighbours.
 *
 * @param {Testimonial[]} entries
 * @param {string} reason short description of the change, for the commit message
 * @returns {Promise<SaveResult>}
 */
export async function saveTestimonials(
  entries: Testimonial[],
  reason: string,
): Promise<SaveResult> {
  const source = renderTestimonialsFile(entries);

  if (isGitConfigured()) {
    const sha = await commitToGitHub(
      TESTIMONIALS_PATH,
      source,
      `testimonials: ${reason}`,
    );
    return {
      storage: 'git',
      commit: sha,
      message: `Committed to ${gitConfig().repo}. The site redeploys automatically.`,
    };
  }

  await mkdir(CONTENT_ROOT, { recursive: true });
  await writeFile(FILE, source, 'utf8');

  return {
    storage: 'local',
    message:
      'Saved to the local filesystem only. Set GITHUB_TOKEN and GITHUB_REPO for this to reach production.',
  };
}
