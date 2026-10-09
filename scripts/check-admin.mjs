#!/usr/bin/env node
/**
 * Admin panel checks.
 *
 * Asserted on the SOURCE, not the served output, because most of these are
 * invariants about code that has not run yet: every admin API route must call
 * the session guard, the schema must not reference a group without defaults,
 * and the panel must not be reachable without a password.
 *
 * Each check is a real failure mode rather than a style preference.
 *
 * Run: node scripts/check-admin.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

let failures = 0;

/**
 * @param {boolean} ok
 * @param {string} label
 * @param {string} [detail]
 */
function report(ok, label, detail = '') {
  const mark = ok ? '\u001b[32m✓\u001b[0m' : '\u001b[31m✗\u001b[0m';
  console.log(`  ${mark} ${label}${!ok && detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

/** Read a file relative to the project root. */
function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

/** List every file under a directory, recursively, relative to the root. */
function walk(dir) {
  const absolute = join(root, dir);
  if (!existsSync(absolute)) return [];
  const files = [];
  for (const entry of readdirSync(absolute)) {
    const path = join(absolute, entry);
    if (statSync(path).isDirectory()) files.push(...walk(relative(root, path)));
    else files.push(relative(root, path));
  }
  return files;
}

console.log('\n\u001b[1mAdmin panel\u001b[0m\n');

/* ------------------------------------------------------------------ *
 * 1. Every admin API route is guarded
 * ------------------------------------------------------------------ */

const apiRoutes = walk('app/api/admin').filter((f) => f.endsWith('route.ts'));

report(apiRoutes.length >= 3, 'the admin API routes exist', `found ${apiRoutes.length}`);

const unguarded = apiRoutes.filter((file) => {
  // The auth route IS the login; it cannot require a session to sign in.
  if (file.includes('/auth/')) return false;
  return !read(file).includes('requireSession');
});

report(
  unguarded.length === 0,
  'every admin API route calls the session guard',
  `these would be publicly reachable: ${unguarded.join(', ')}`,
);

/* ------------------------------------------------------------------ *
 * 2. Every admin page is guarded
 * ------------------------------------------------------------------ */

const adminPages = walk('app/admin')
  .filter((f) => f.endsWith('page.tsx'))
  .filter((f) => !f.includes('/login/'));

const unguardedPages = adminPages.filter((file) => !read(file).includes('requirePage'));

report(adminPages.length >= 3, 'the admin pages exist', `found ${adminPages.length}`);
report(
  unguardedPages.length === 0,
  'every admin page calls the page guard',
  `these would render for a signed-out visitor: ${unguardedPages.join(', ')}`,
);

/* ------------------------------------------------------------------ *
 * 3. The panel is not indexable
 * ------------------------------------------------------------------ */

const layout = read('app/admin/layout.tsx');
report(
  /robots:\s*\{[^}]*index:\s*false/.test(layout),
  'the admin layout sets noindex',
  'robots.txt is advisory; the meta tag is what a crawler honours',
);

/* ------------------------------------------------------------------ *
 * 4. Every registered export is consumed by a component
 * ------------------------------------------------------------------ */

/*
 * The bug this check exists to prevent: the panel saves an override, the
 * component still reads its default, and every step reports success. That
 * happened with the image path and it would happen with text — the registry
 * would grow while the components kept importing their raw constants.
 */
const registry = read('lib/admin/registry.ts');
const registeredKeys = [
  ...registry.matchAll(/'([a-z-]+)\.([A-Z0-9_]+)':/g),
].map((m) => `${m[1]}.${m[2]}`);

const componentFiles = [
  ...walk('components').filter((f) => /\.tsx?$/.test(f)),
  // `app/page.tsx` composes the banner override, so the sweep must see it.
  'app/page.tsx',
];
const consumedKeys = new Set();
for (const file of componentFiles) {
  const source = read(file);
  for (const m of source.matchAll(/withOverrides\(\s*'([a-z-]+)\.([A-Z0-9_]+)'/g)) {
    consumedKeys.add(`${m[1]}.${m[2]}`);
  }
}

const unwired = registeredKeys.filter((k) => !consumedKeys.has(k));

report(
  registeredKeys.length >= 25,
  'the content registry is populated',
  `found ${registeredKeys.length} keys`,
);
report(
  unwired.length === 0,
  'every registered export is consumed via withOverrides',
  `the panel would save these and the site would ignore them: ${unwired.join(', ')}`,
);

/* ------------------------------------------------------------------ *
 * 5. The schema and the registry agree
 * ------------------------------------------------------------------ */

/*
 * Only EDITABLE exports need a registry entry — a locked (PDF-derived) export
 * is rendered read-only from the schema, so it has no value to read through the
 * override machinery.
 *
 * The two lists are parsed separately rather than by searching the whole file,
 * because `LOCKED_MODULES` appears after `MODULES` and a single regex over the
 * file cannot tell which block an export name came from.
 */
const schema = read('lib/admin/schema.ts');

/*
 * Editable exports come from `MODULES` (site chrome) and `PROGRAM_MODULES`
 * (programme bodies). Both are editable; `LOCKED_MODULES` is empty by default
 * and is read separately so a future locked module is not required to have a
 * registry entry.
 */
const editableBlock = schema.slice(
  schema.indexOf('export const MODULES'),
  schema.indexOf('export const LOCKED_MODULES'),
);
const programmeBlock = schema.slice(
  schema.indexOf('export const PROGRAM_MODULES'),
  schema.indexOf('export function findModule'),
);

const editableExportNames = [
  ...editableBlock.matchAll(/name:\s*'([A-Z0-9_]+)'/g),
  ...programmeBlock.matchAll(/name:\s*'([A-Z0-9_]+)'/g),
].map((m) => m[1]);

/*
 * `PAGE_IMAGES` is the exception: it is listed in the panel so the paths are
 * discoverable, but its value is managed by the image upload flow rather than by
 * a text field, so it has no registry entry by design.
 */
const REGISTRY_EXEMPT = new Set(['PAGE_IMAGES']);

const registryExportNames = new Set(registeredKeys.map((k) => k.split('.')[1]));

const missingFromRegistry = editableExportNames.filter(
  (n) => !registryExportNames.has(n) && !REGISTRY_EXEMPT.has(n),
);

report(
  editableExportNames.length >= 60,
  'the schema lists the editable exports',
  `found ${editableExportNames.length}`,
);
report(
  missingFromRegistry.length === 0,
  'every editable schema export has a registry entry',
  `listed in the panel but with no value to read: ${missingFromRegistry.join(', ')}`,
);

/* ------------------------------------------------------------------ *
 * 6. Content module path literals stay bundler-resolvable
 * ------------------------------------------------------------------ */

const store = read('lib/admin/content-store.ts');
report(
  /join\(process\.cwd\(\),\s*'components',\s*'generated'\)/.test(store),
  'the generated-module path is built from literals',
  'a path the bundler cannot resolve statically makes it trace the whole project into the deploy',
);

report(
  existsSync(join(root, 'components/generated/content-overrides.generated.ts')),
  'the overrides file is committed',
  'lib/admin/overrides.ts imports it unconditionally, so a fresh clone must have it',
);

/* ------------------------------------------------------------------ *
 * 6. The image override require is guarded
 * ------------------------------------------------------------------ */

const imageContent = read('components/shared/image-content.ts');
report(
  /try\s*\{[\s\S]*?require\([\s\S]*?\}\s*catch/.test(imageContent),
  'the generated image override is loaded inside try/catch',
  'an unguarded require of a file that may not exist fails the build on a fresh checkout',
);

/* ------------------------------------------------------------------ *
 * 7. Auth fails closed
 * ------------------------------------------------------------------ */

const auth = read('lib/admin/auth.ts');
report(
  /if\s*\(!isAuthConfigured\(\)\)\s*return\s*false/.test(auth),
  'an unconfigured password refuses every login',
  'an unset ADMIN_PASSWORD must never mean "no password required"',
);
report(
  /timingSafeEqual/.test(auth),
  'the password comparison is constant-time',
  'a short-circuiting === leaks how many leading characters were correct',
);

/* ------------------------------------------------------------------ *
 * 8. The image components read the override module
 * ------------------------------------------------------------------ */

/*
 * The bug this check exists to prevent: the panel uploaded an image, saved the
 * path, committed it — and nothing changed on the site, because the components
 * still imported their defaults directly. Every step reported success. Catching
 * it here means the wiring cannot be forgotten again.
 */
const imageConsumers = [
  'components/hero/HeroMedia.tsx',
  'components/about/TrainerPhoto.tsx',
];

const bypassing = imageConsumers.filter((file) => !read(file).includes('image-content'));

report(
  bypassing.length === 0,
  'every image component reads the admin override module',
  `these import their defaults directly, so a panel upload would not appear: ${bypassing.join(', ')}`,
);

report(
  !/from '\.\/hero-content'/.test(read('components/hero/HeroMedia.tsx')) &&
    !/TRAINER_PHOTO/.test(read('components/about/TrainerPhoto.tsx')),
  'no image component imports the raw default constants',
  'importing HERO_MEDIA / TRAINER_PHOTO directly bypasses the override',
);

/* ------------------------------------------------------------------ *
 * 9. The generated override reaches the build
 * ------------------------------------------------------------------ */

const imageContentHasRequire = /require\(/.test(imageContent);
report(
  imageContentHasRequire,
  'the override module loads the generated file',
  'without this the override can never apply',
);

report(
  !/components\/generated\/\*\.generated\.ts/.test(read('.gitignore')),
  'the generated modules are not gitignored',
  'a gitignored generated file would be invisible to git status while still being imported',
);

/* ------------------------------------------------------------------ *
 * 10. Remote images are allowlisted for the optimiser
 * ------------------------------------------------------------------ */

/*
 * Without `images.remotePatterns`, `next/image` rejects a remote R2 URL at
 * REQUEST time with a 400 — the build stays green and the hero photograph
 * renders broken in production. That is the failure this asserts against.
 */
const nextConfig = read('next.config.ts');
report(
  /remotePatterns/.test(nextConfig),
  'next.config declares images.remotePatterns',
  'without it the image optimiser returns 400 for every R2 URL, and the build gives no warning',
);
report(
  /R2_PUBLIC_URL/.test(nextConfig),
  'the remote pattern is derived from R2_PUBLIC_URL',
  'a hardcoded hostname would drift from the storage config the panel reads',
);

/* ------------------------------------------------------------------ *
 * Summary
 * ------------------------------------------------------------------ */

console.log('');
if (failures === 0) {
  console.log('  \u001b[32mADMIN CHECKS PASSED\u001b[0m\n');
  process.exit(0);
}

console.log(`  \u001b[31m${failures} ADMIN CHECK(S) FAILED\u001b[0m\n`);
process.exit(1);
