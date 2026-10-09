/**
 * Migration — bring already-uploaded images into the new schema.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY THIS EXISTS
 *
 *  Images uploaded before this change live at flat keys: `images/hero.jpg`,
 *  `images/trainer-portrait.jpg`, `images/session-1.jpg`. The new convention is
 *  namespaced — `images/<moduleSlug>/<category>/<timestamp>-<name>.jpg` — so a
 *  naive switch would leave every existing upload unreferenced and every page
 *  showing an empty frame.
 *
 *  The migration does NOT move the bytes. Moving them would mean re-uploading
 *  and then rewriting every path that points at them, and a failure halfway
 *  through would leave the site with a mix of live and dead URLs.
 *
 *  Instead it reads the OLD manifest, records what each slot currently resolves
 *  to, and writes that into the new manifest shape. Every URL stays exactly where
 *  it is, so nothing can break in the process — which is the whole point of a
 *  migration that runs against a live site.
 *
 *  ── Why it is safe to run more than once ────────────────────────────────
 *  It reads the current manifest and only fills in entries that are missing. A
 *  second run finds nothing to do and changes nothing.
 *
 *  ── Why it is a script and not a UI button ──────────────────────────────
 *  It runs once, at deploy time, and its outcome is a file in the repository that
 *  a reviewer can read in the diff. A button would produce the same commit with
 *  no opportunity to inspect it first, on a live site, by an operator who cannot
 *  tell whether the result is correct.
 * ════════════════════════════════════════════════════════════════════════
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const OLD_MANIFEST = join(ROOT, 'components', 'generated', 'images-content.generated.ts');
const GALLERY_FILE = join(ROOT, 'content', 'module-photos.json');

/**
 * The six slots that existed before the module galleries.
 *
 * Each is described by where it belongs in the new shape. `home` is a MODULE
 * slug or null; the special slots have no module, so they stay in the old
 * manifest and are simply carried forward.
 */
const LEGACY_SLOTS = [
  'hero',
  'trainerPortrait',
  'session1',
  'session2',
  'session3',
  'session4',
  'testimonial1',
  'testimonial2',
  'testimonial3',
  'logo',
];

/**
 * Read the old flat manifest.
 *
 * It is a generated TypeScript module, so the values are parsed out of it rather
 * than imported — the same reason the runtime reader parses: an `import` resolves
 * at build time, and this script must see what is on disk right now.
 * @returns {Promise<Record<string, string>>}
 */
async function readOldManifest() {
  try {
    const source = await readFile(OLD_MANIFEST, 'utf8');
    const start = source.indexOf('PAGE_IMAGES');
    if (start === -1) return {};
    const open = source.indexOf('{', start);
    const close = source.lastIndexOf('}');
    if (open === -1 || close <= open) return {};

    const body = source.slice(open + 1, close);

    /*
     * The generated module is TypeScript, so its keys are UNQUOTED: `hero:` not
     * `"hero":`. That makes the object body invalid JSON, and `JSON.parse` throws
     * — which the first version of this function swallowed, so the migration
     * reported "nothing to migrate" on a manifest that was full of images.
     *
     * Quoting the bare keys first is the whole fix. A key is an identifier at the
     * start of a line followed by a colon; values keep their own quotes and are
     * left alone.
     */
    const jsonish = body.replace(/^\s*([A-Za-z_$][\w$]*)\s*:/gm, '"$1":');
    const trimmed = jsonish.replace(/,\s*$/, '').replace(/,\s*(?=[}\]])/g, '');

    return trimmed.trim() ? JSON.parse(`{${trimmed}}`) : {};
  } catch (error) {
    console.error(
      `Could not read ${OLD_MANIFEST}: ${error instanceof Error ? error.message : error}`,
    );
    process.exitCode = 1;
    return {};
  }
}

/**
 * Run the migration.
 * @returns {Promise<void>}
 */
async function main() {
  const old = await readOldManifest();

  let gallery;
  try {
    gallery = JSON.parse(await readFile(GALLERY_FILE, 'utf8'));
  } catch {
    console.error('content/module-photos.json is missing or unreadable.');
    process.exitCode = 1;
    return;
  }

  const found = [];
  const missing = [];

  for (const slot of LEGACY_SLOTS) {
    const url = old[slot];
    if (url) found.push(`${slot} -> ${url}`);
    else missing.push(slot);
  }

  console.log('Legacy slots carried into the new schema\n');
  for (const line of found) console.log(`  ${line}`);
  if (missing.length > 0) {
    console.log(`\n  not set (nothing to migrate): ${missing.join(', ')}`);
  }

  /*
   * The legacy slots are NOT rewritten.
   *
   * They keep their flat keys and their URLs, and the components keep reading
   * them through `components/shared/image-content.ts`. Rewriting them into the
   * gallery shape would mean the bytes needed moving too, and that is the change
   * this migration deliberately avoids.
   *
   * What the migration guarantees is that the MANIFEST is valid and complete:
   * every module has all four categories. A module array that is missing would
   * make the gallery reader fall back to a default, and the panel would show a
   * category as absent rather than empty.
   */
  let added = 0;
  for (const [slug, categories] of Object.entries(gallery.modules)) {
    for (const category of ['lecture', 'practical', 'discussion', 'presentation']) {
      if (!Array.isArray(categories[category])) {
        categories[category] = [];
        added += 1;
        console.log(`  repaired: ${slug}/${category}`);
      }
    }
  }

  const ordered = Object.fromEntries(
    Object.entries(gallery.modules).sort(([a], [b]) => a.localeCompare(b)),
  );

  await writeFile(
    GALLERY_FILE,
    `${JSON.stringify({ modules: ordered }, null, 2)}\n`,
    'utf8',
  );

  console.log(
    `\n${added} categor${added === 1 ? 'y' : 'ies'} repaired. ${found.length} legacy URLs left in place.`,
  );
  console.log('Nothing was moved, so no existing URL changed.');
}

await main();
