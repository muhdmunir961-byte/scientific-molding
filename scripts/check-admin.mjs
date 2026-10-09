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
 * 4. The schema and the defaults agree
 * ------------------------------------------------------------------ */

const schema = read('lib/admin/schema.ts');
const defaults = read('lib/admin/defaults.ts');

const schemaGroups = [...schema.matchAll(/^\s{4}id:\s*'([a-z-]+)',/gm)].map((m) => m[1]);
const defaultKeys = [...defaults.matchAll(/^\s{2}([a-z-]+):\s*\{/gm)].map((m) => m[1]);

const missingDefaults = schemaGroups.filter((id) => !defaultKeys.includes(id));

report(
  schemaGroups.length >= 4,
  'the schema declares the content groups',
  `found ${schemaGroups.length}: ${schemaGroups.join(', ')}`,
);
report(
  missingDefaults.length === 0,
  'every schema group has built-in defaults',
  `a group without defaults renders blank inputs on first load: ${missingDefaults.join(', ')}`,
);

/* ------------------------------------------------------------------ *
 * 5. The generated-module path is bundler-resolvable
 * ------------------------------------------------------------------ */

const store = read('lib/admin/content-store.ts');
const generated = read('lib/admin/generated.ts');

report(
  /join\(process\.cwd\(\),\s*'components',\s*'generated'\)/.test(store),
  'the generated-module path is built from literals',
  'a path the bundler cannot resolve statically makes it trace the whole project into the deploy',
);

const dirMatch = generated.match(/GENERATED_DIR\s*=\s*'([^']+)'/);
const declaredDir = dirMatch ? dirMatch[1] : '';
report(
  declaredDir === 'components/generated',
  'GENERATED_DIR matches the literal path in the store',
  `store uses components/generated, generated.ts declares "${declaredDir}"`,
);

report(
  existsSync(join(root, 'components/generated')),
  'the generated directory is committed',
  'components/shared/image-content.ts requires a file from it, so it must exist on a fresh checkout',
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
 * Summary
 * ------------------------------------------------------------------ */

console.log('');
if (failures === 0) {
  console.log('  \u001b[32mADMIN CHECKS PASSED\u001b[0m\n');
  process.exit(0);
}

console.log(`  \u001b[31m${failures} ADMIN CHECK(S) FAILED\u001b[0m\n`);
process.exit(1);
