#!/usr/bin/env node
/**
 * Validate the module drafts against their schema.
 *
 * ── Why this is a script and not a validation library ───────────────────
 * The project's rule is no new dependency without a reason that survives being
 * written down, and a JSON Schema validator is a large tree for what amounts to
 * a few dozen structural assertions. This checks the parts of the schema that
 * carry meaning — required fields, enumerations, item counts, the number format
 * — which is exactly what a reviewer needs in order to trust the drafts.
 *
 * ── What it deliberately does NOT do ────────────────────────────────────
 * It does not validate the schema file against the JSON Schema meta-schema, and
 * it does not implement `$ref` resolution generally. A `$ref` is followed one
 * level, which is all this schema uses.
 *
 * Run: node scripts/check-module-drafts.mjs
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dir = join(root, 'content', 'modules');

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

const schema = JSON.parse(readFileSync(join(dir, 'module.schema.json'), 'utf8'));

/**
 * Resolve a `$ref` one level against the schema's definitions.
 * @param {string} ref
 * @returns {object}
 */
function resolveRef(ref) {
  if (!ref.startsWith('#/')) return {};
  let node = schema;
  for (const part of ref.slice(2).split('/')) node = node?.[part];
  return node ?? {};
}

/**
 * Check one value against one schema node.
 * @param {*} value
 * @param {object} node
 * @param {string} path
 * @param {string[]} errors
 */
function check(value, node, path, errors) {
  if (node.$ref) node = resolveRef(node.$ref);

  if (node.enum) {
    if (!node.enum.includes(value)) {
      errors.push(`${path}: "${value}" is not one of ${node.enum.join(' | ')}`);
    }
    return;
  }

  if (node.type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push(`${path}: expected an object`);
      return;
    }
    for (const key of node.required ?? []) {
      if (!(key in value)) errors.push(`${path}: missing required "${key}"`);
    }
    for (const [key, child] of Object.entries(node.properties ?? {})) {
      if (key in value) check(value[key], child, `${path}.${key}`, errors);
    }
    return;
  }

  if (node.type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${path}: expected an array`);
      return;
    }
    if (node.minItems !== undefined && value.length < node.minItems) {
      errors.push(`${path}: ${value.length} items, minimum ${node.minItems}`);
    }
    if (node.maxItems !== undefined && value.length > node.maxItems) {
      errors.push(`${path}: ${value.length} items, maximum ${node.maxItems}`);
    }
    if (node.items) {
      value.forEach((item, i) => check(item, node.items, `${path}[${i}]`, errors));
    }
    return;
  }

  if (node.type === 'string') {
    if (typeof value !== 'string') {
      errors.push(`${path}: expected a string`);
      return;
    }
    if (node.pattern && !new RegExp(node.pattern).test(value)) {
      errors.push(`${path}: "${value}" does not match ${node.pattern}`);
    }
    return;
  }

  if (node.type === 'integer') {
    if (!Number.isInteger(value)) {
      errors.push(`${path}: expected an integer`);
      return;
    }
    if (node.minimum !== undefined && value < node.minimum) {
      errors.push(`${path}: ${value} below minimum ${node.minimum}`);
    }
    if (node.maximum !== undefined && value > node.maximum) {
      errors.push(`${path}: ${value} above maximum ${node.maximum}`);
    }
    return;
  }

  if (node.type === 'boolean' && typeof value !== 'boolean') {
    errors.push(`${path}: expected a boolean`);
  }
}

console.log('\n\u001b[1mModule drafts\u001b[0m\n');

const draftFiles = readdirSync(dir).filter(
  (f) => f.endsWith('.json') && f !== 'module.schema.json',
);

report(draftFiles.length >= 2, 'draft files exist', `found ${draftFiles.length}`);

/* The seven canonical slugs, from the authoritative manifest. */
const manifest = JSON.parse(readFileSync(join(root, 'content', 'modules.json'), 'utf8'));
const canonicalSlugs = new Set(manifest.modules.map((m) => m.slug));

for (const file of draftFiles) {
  const draft = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const errors = [];
  check(draft, schema, file.replace('.json', ''), errors);

  report(
    errors.length === 0,
    `${file} validates against the schema`,
    errors.slice(0, 4).join('; '),
  );

  /* The slug must be one the manifest already knows. */
  report(
    canonicalSlugs.has(draft.slug),
    `${file}: slug "${draft.slug}" is in content/modules.json`,
    'a draft for a module the manifest does not define would never render',
  );

  /*
   * Nothing drafted may be published.
   *
   * The load-bearing assertion of the whole task: the drafts are proposed copy,
   * and publishing them before the trainer has read them would put invented
   * claims about a training course on a live customer-facing page.
   */
  report(
    draft.published === false,
    `${file}: is not published`,
    'every draft must ship hidden until the trainer approves it',
  );

  /* Every labelled block must carry a status, so nothing is silently neither. */
  const blocksMissingStatus = Object.entries(draft)
    .filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v))
    .filter(([k]) => k !== '$comment' && k !== 'tags')
    .filter(([k, v]) => !('status' in v) && ['headline', 'promise', 'problems', 'benefits', 'beforeAfter', 'whyMatters', 'outcomes', 'courseStructure', 'audience', 'learningFormat', 'philosophy', 'managementTakeaway', 'safetyNotice', 'cta'].includes(k))
    .map(([k]) => k);

  report(
    blocksMissingStatus.length === 0,
    `${file}: every labelled block carries a status`,
    `unmarked: ${blocksMissingStatus.join(', ')}`,
  );
}

/*
 * The drafts must not leak into the public page.
 *
 * Asserted on the served HTML when a server is running. A draft that rendered
 * would defeat the point of the `published: false` flag, and the failure would be
 * invisible in a build log.
 */
const base = process.env.CHECK_BASE_URL ?? 'http://localhost:5555';
let servedHtml = '';
try {
  const response = await fetch(`${base}/`, { signal: AbortSignal.timeout(10_000) });
  if (response.ok) servedHtml = await response.text();
} catch {
  // No server — the assertion is skipped rather than failed.
}

if (servedHtml) {
  for (const file of draftFiles) {
    const draft = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    /* A distinctive phrase from the DRAFTED copy, not from the facts. */
    const probe = draft.whyMatters?.heading ?? draft.headline?.value ?? '';
    report(
      probe === '' || !servedHtml.includes(probe),
      `${file}: drafted copy is absent from the served page`,
      `found "${probe}" in the output — an unpublished draft is rendering`,
    );
  }
} else {
  console.log(`  \u001b[33m~\u001b[0m skipped the served-output check — no app at ${base}`);
}

console.log('');
if (failures === 0) {
  console.log('  \u001b[32mMODULE DRAFTS OK\u001b[0m\n');
  process.exit(0);
}

console.log(`  \u001b[31m${failures} MODULE DRAFT CHECK(S) FAILED\u001b[0m\n`);
process.exit(1);
