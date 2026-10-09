/**
 * Human field labels.
 *
 * The maps live in three parts so no single file has to be read end to end when
 * one label needs changing; this module merges them and is the only import the
 * editor needs.
 *
 * See `labels/part-1.ts` for why this layer exists at all.
 */

import { LABELS_PART_1, type FieldLabel } from './labels/part-1';
import { LABELS_PART_2 } from './labels/part-2';
import { LABELS_PART_3 } from './labels/part-3';

export type { FieldLabel };

/** Every label, keyed `<moduleId>.<exportName>[.<fieldPath>]`. */
export const FIELD_LABELS: Record<string, FieldLabel> = {
  ...LABELS_PART_1,
  ...LABELS_PART_2,
  ...LABELS_PART_3,
};

/**
 * Look up a label for a field path.
 * @param {string} moduleId
 * @param {string} exportName
 * @param {string} path dotted path within the value, or '' for the whole export
 * @returns {FieldLabel|undefined}
 */
export function fieldLabel(
  moduleId: string,
  exportName: string,
  path = '',
): FieldLabel | undefined {
  return FIELD_LABELS[path ? `${moduleId}.${exportName}.${path}` : `${moduleId}.${exportName}`];
}

/**
 * A label for an array element's field.
 *
 * Entries are written as `TESTIMONIALS[].name` because every element shares the
 * same fields. The editor knows the array index, so any numeric segment is
 * replaced with `[]` before lookup, and the un-substituted path is tried second
 * so a per-index label would still win if one were ever added.
 * @param {string} moduleId
 * @param {string} exportName
 * @param {string} path
 * @returns {FieldLabel|undefined}
 */
export function arrayFieldLabel(
  moduleId: string,
  exportName: string,
  path: string,
): FieldLabel | undefined {
  const bracketed = path.replace(/\.\d+(?=\.|$)/g, '[]');
  return fieldLabel(moduleId, exportName, bracketed) ?? fieldLabel(moduleId, exportName, path);
}
