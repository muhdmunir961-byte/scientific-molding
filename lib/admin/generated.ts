/**
 * Generated-module rendering and parsing.
 *
 * ── Why the panel writes a generated module instead of editing in place ──
 * Two options were available:
 *
 *   1. Regex-replace the string literals inside the existing content `.ts`.
 *   2. Write a separate machine-owned module the component reads as an
 *      override.
 *
 * (1) is the tempting one and it is a trap. The content modules are heavily
 * commented, the same string appears in both comments and code, and a
 * multi-line value spans lines a regex cannot safely match. A mis-anchored
 * replace silently corrupts the file, and the worst case is not a crash but a
 * successful-looking save that wrote the wrong text.
 *
 * So each editable group writes its own small, machine-owned module. Those
 * files have no comments and one export, which makes both the writer and the
 * parser trivially correct — and the diff obviously safe to review.
 */

import type { GroupSpec } from './schema';

/** Repo-relative directory the generated modules live in. */
export const GENERATED_DIR = 'components/generated';

/**
 * Path of the generated module for a group.
 * @param {GroupSpec} group
 * @returns {string} repo-relative path
 */
export function generatedPath(group: GroupSpec): string {
  return `${GENERATED_DIR}/${group.id}-content.generated.ts`;
}

/**
 * Render the generated module's source for a group and a set of values.
 *
 * Values are JSON-encoded rather than template-literal interpolated: JSON
 * escaping handles quotes, newlines and backslashes correctly, and a quote
 * inside a testimonial is entirely likely. A template literal would break the
 * file the first time someone typed an apostrophe. (The typographic apostrophe
 * in these very comments is the same hazard, which is why it is spelled out
 * here rather than tempting fate.)
 *
 * @param {GroupSpec} group
 * @param {Record<string, string>} values
 * @returns {string}
 */
export function renderModule(group: GroupSpec, values: Record<string, string>): string {
  const lines: string[] = [];

  lines.push('/* GENERATED FILE — do not edit by hand.');
  lines.push(` * Written by the admin panel from group "${group.id}".`);
  lines.push(' * Regenerate through /admin/content, or delete this file to fall back');
  lines.push(' * to the hand-written defaults in the content module.');
  lines.push(' */');
  lines.push('');
  lines.push(`export const ${group.export} = {`);

  for (const field of group.fields) {
    lines.push(`  ${field.key}: ${JSON.stringify(values[field.key] ?? '')},`);
  }

  lines.push('} as const;');
  lines.push('');

  return lines.join('\n');
}

/**
 * Parse a generated module back into values.
 *
 * Deliberately narrow: it matches `key: "value"` pairs at the start of a line.
 * The generated file is machine-written to exactly that shape, so this cannot
 * be defeated by the comment-heavy formatting of a hand-written module — which
 * is the whole reason the generated-module design was chosen.
 *
 * @param {string} source
 * @param {GroupSpec} group
 * @returns {Record<string,string>}
 */
export function parseGenerated(
  source: string,
  group: GroupSpec,
): Record<string, string> {
  const values: Record<string, string> = {};

  for (const field of group.fields) {
    const match = source.match(
      new RegExp(`^\\s*${field.key}\\s*:\\s*("(?:[^"\\\\]|\\\\.)*")\\s*,`, 'm'),
    );
    if (!match) continue;
    const literal = match[1];
    if (literal === undefined) continue;
    try {
      values[field.key] = JSON.parse(literal) as string;
    } catch {
      // A malformed literal leaves the field absent, so the caller falls back
      // to the default rather than showing a broken value in the form.
    }
  }

  return values;
}
