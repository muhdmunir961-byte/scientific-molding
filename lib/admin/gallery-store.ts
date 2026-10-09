/**
 * Module photo gallery — the server-side store.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THIS IS A SEPARATE STORE FROM THE TEXT CONTENT
 *
 *  `lib/admin/content-store.ts` writes a flat map of `<module>.<export>` keys to
 *  override values, which is right for text an operator types. A photo gallery
 *  is a different shape — modules, then categories, then ordered arrays — and
 *  writing it through the text path would mean the override merge had to
 *  understand arrays of objects with identity.
 *
 *  So the gallery has its own file and its own reader/writer. Both commit through
 *  the same GitHub helper, so a photo save and a text save reach production the
 *  same way.
 *
 *  ── Why the file is JSON, not a generated TypeScript module ─────────────
 *  The gallery is pure data with no types to infer, and it is read by
 *  `lib/gallery.ts` which casts it to a known shape. A `.json` file is
 *  diffable, validatable, and — the reason that matters — cannot contain a
 *  syntax error that breaks the build. A generated `.ts` module with a stray
 *  comma takes the whole site down; a broken `.json` fails this one read.
 * ════════════════════════════════════════════════════════════════════════
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { gitConfig, isGitConfigured } from './config';
import { emptyGallery, type GalleryImage, type ModuleGallery } from '@/lib/gallery';
import { categorySlugs, MODULES, type PhotoCategory } from '@/lib/modules';

/** Repo-relative path of the gallery file, for the GitHub API. */
export const GALLERY_PATH = 'content/module-photos.json';

/**
 * Absolute path of the content directory.
 *
 * The segments are literals so the bundler can resolve the directory at build
 * time. A value it cannot see through makes Turbopack trace the entire project
 * into the server output, which bloats the deploy — the same constraint the
 * content store documents.
 */
const CONTENT_ROOT = join(process.cwd(), 'content');

export interface SaveResult {
  /** How the change was persisted. */
  storage: 'git' | 'local';
  /** Commit SHA when committed. */
  commit?: string;
  /** Human-readable outcome for the UI. */
  message: string;
}

/**
 * Render the whole gallery file.
 *
 * Every module and every category is always present, even when empty, so a
 * reader never has to distinguish "no photos" from "no entry". The modules come
 * from the manifest and the categories from `PHOTO_CATEGORIES`, so neither list
 * can be extended in one place and forgotten here.
 *
 * @param {Record<string, ModuleGallery>} modules
 * @returns {string}
 */
export function renderGalleryFile(modules: Record<string, ModuleGallery>): string {
  const out: Record<string, Record<string, GalleryImage[]>> = {};

  for (const module of MODULES) {
    const gallery = modules[module.slug] ?? emptyGallery();
    const categories: Record<string, GalleryImage[]> = {};
    for (const slug of categorySlugs()) {
      categories[slug] = [...(gallery[slug] ?? [])].sort((a, b) => a.order - b.order);
    }
    out[module.slug] = categories;
  }

  return `${JSON.stringify(
    {
      $comment:
        'Module photo galleries. Written by the admin panel and committed through the GitHub API. Read by lib/gallery.ts.',
      modules: out,
    },
    null,
    2,
  )}\n`;
}

/**
 * Read the whole gallery file from disk.
 *
 * A missing or unparseable file yields the empty shape rather than throwing: the
 * panel then shows seven empty galleries, which is the truth, instead of an
 * error page. The file is committed, so an unparseable one would be caught by
 * the build anyway.
 * @returns {Promise<Record<string, ModuleGallery>>}
 */
export async function readGalleryFile(): Promise<Record<string, ModuleGallery>> {
  const all: Record<string, ModuleGallery> = {};
  for (const module of MODULES) all[module.slug] = emptyGallery();

  try {
    const raw = await readFile(join(CONTENT_ROOT, 'module-photos.json'), 'utf8');
    const parsed = JSON.parse(raw) as {
      modules?: Record<string, Partial<ModuleGallery>>;
    };

    for (const module of MODULES) {
      const saved = parsed.modules?.[module.slug];
      const target = all[module.slug];
      if (!saved || !target) continue;

      for (const slug of categorySlugs()) {
        const images = saved[slug];
        if (Array.isArray(images)) {
          target[slug] = [...images].sort((a, b) => a.order - b.order);
        }
      }
    }
  } catch {
    // Missing or malformed — the empty galleries built above stand.
  }

  return all;
}

/**
 * Read one module's gallery.
 * @param {string} moduleSlug
 * @returns {Promise<ModuleGallery>}
 */
export async function readGallery(moduleSlug: string): Promise<ModuleGallery> {
  const all = await readGalleryFile();
  return all[moduleSlug] ?? emptyGallery();
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
 * Save one category, merging it into the whole file.
 *
 * Reading the file, replacing one category and writing it back is what keeps a
 * save from one browser tab from reverting every other module edited since that
 * tab loaded — the failure mode of PUTting a whole manifest the client held.
 *
 * @param {string} moduleSlug
 * @param {PhotoCategory} category
 * @param {GalleryImage[]} images the new contents of that category
 * @returns {Promise<SaveResult>}
 */
export async function saveGallery(
  moduleSlug: string,
  category: PhotoCategory,
  images: GalleryImage[],
): Promise<SaveResult> {
  const all = await readGalleryFile();
  if (!all[moduleSlug]) all[moduleSlug] = emptyGallery();
  all[moduleSlug][category] = images;

  const source = renderGalleryFile(all);
  const verb = images.length === 0 ? 'clear' : 'update';

  if (isGitConfigured()) {
    const sha = await commitToGitHub(
      GALLERY_PATH,
      source,
      `photos(${moduleSlug}/${category}): ${verb} from admin panel`,
    );
    return {
      storage: 'git',
      commit: sha,
      message: `Committed to ${gitConfig().repo}. The site redeploys automatically.`,
    };
  }

  await mkdir(CONTENT_ROOT, { recursive: true });
  await writeFile(join(CONTENT_ROOT, 'module-photos.json'), source, 'utf8');

  return {
    storage: 'local',
    message:
      'Saved to the local filesystem only. Set GITHUB_TOKEN and GITHUB_REPO for this to reach production.',
  };
}
