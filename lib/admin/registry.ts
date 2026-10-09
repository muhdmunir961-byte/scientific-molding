/**
 * Content registry — reads each editable module's exports by importing them
 * statically.
 *
 * ════════════════════════════════════════════════════════════════════════
 *  WHY A STATIC IMPORT MAP RATHER THAN A DYNAMIC REQUIRE
 *
 *  The obvious implementation reads a module by path at request time:
 *
 *      const mod = await import(moduleSpec.file);
 *
 *  That does not work here, for two independent reasons:
 *
 *    1. Turbopack cannot resolve a path built from a variable. It either fails
 *       the build or — worse — falls back to tracing the entire project, which
 *       is the deploy-size problem the content store already hit once.
 *    2. The content modules export TypeScript types as well as values, and a
 *       dynamic import would pull the whole component graph into the admin
 *       bundle.
 *
 *  So each module is imported statically below. The cost is one import line per
 *  module, added when a module is added to `schema.ts` — and
 *  `scripts/check-admin.mjs` asserts the two lists agree, so forgetting is a
 *  failing check rather than a missing form field.
 *
 *  The values are read through `withOverrides`, so what the panel shows is
 *  exactly what the site renders — including any saved override. Without that,
 *  editing a field twice would start from the default and silently discard the
 *  previous save.
 * ════════════════════════════════════════════════════════════════════════
 */

import { withOverrides, type JsonValue } from './overrides';

import { HERO_COPY, HERO_EYEBROW, HERO_STATS, HERO_CTA, HERO_CONTACT } from '@/components/hero/hero-content';
import {
  TRAINER_NAME,
  TRAINER_EYEBROW,
  TRAINER_CREDENTIALS,
  TRAINER_STATS,
} from '@/components/about/about-content';
import { WHY_HERO, WHY_PROBLEMS, WHY_SHIFTS, WHY_LABELS } from '@/components/why/why-content';
import {
  TRACK_RECORD_HERO,
  TRACK_RECORD_STATS,
  TRACK_RECORD_HRDC,
  TRACK_RECORD_STATEMENT,
  CLIENT_TYPES_HEADING,
  CLIENT_TYPES,
} from '@/components/track-record/track-record-content';
import {
  TESTIMONIALS_HERO,
  TESTIMONIALS,
} from '@/components/testimonials/testimonials-content';
import {
  CONTACT_HERO,
  CONTACT_LABELS,
  CONTACT_PLACEHOLDERS,
  CONTACT_CONSENT,
  CONTACT_DIRECT,
  CONTACT_SUCCESS,
} from '@/components/contact/contact-content';
import {
  LOGO,
  NAV_ITEMS,
  PROGRAMS_LABEL,
  PROGRAM_ITEMS,
  NAV_CTA,
  QUICK_ACTIONS,
} from '@/components/nav/nav-content';

/**
 * Every export the panel may edit, keyed `<moduleId>.<exportName>`.
 *
 * Each entry is the RAW default. `readExport` applies any saved override, so
 * this map stays a plain description of the code and the override logic lives
 * in one place.
 */
const REGISTRY: Record<string, JsonValue> = {
  'hero.HERO_COPY': HERO_COPY as unknown as JsonValue,
  'hero.HERO_EYEBROW': HERO_EYEBROW,
  'hero.HERO_STATS': HERO_STATS as unknown as JsonValue,
  'hero.HERO_CTA': HERO_CTA as unknown as JsonValue,
  'hero.HERO_CONTACT': HERO_CONTACT as unknown as JsonValue,

  'about.TRAINER_NAME': TRAINER_NAME,
  'about.TRAINER_EYEBROW': TRAINER_EYEBROW,
  'about.TRAINER_CREDENTIALS': TRAINER_CREDENTIALS as unknown as JsonValue,
  'about.TRAINER_STATS': TRAINER_STATS as unknown as JsonValue,

  'why.WHY_HERO': WHY_HERO as unknown as JsonValue,
  'why.WHY_PROBLEMS': WHY_PROBLEMS as unknown as JsonValue,
  'why.WHY_SHIFTS': WHY_SHIFTS as unknown as JsonValue,
  'why.WHY_LABELS': WHY_LABELS as unknown as JsonValue,

  'track-record.TRACK_RECORD_HERO': TRACK_RECORD_HERO as unknown as JsonValue,
  'track-record.TRACK_RECORD_STATS': TRACK_RECORD_STATS as unknown as JsonValue,
  'track-record.TRACK_RECORD_HRDC': TRACK_RECORD_HRDC as unknown as JsonValue,
  'track-record.TRACK_RECORD_STATEMENT': TRACK_RECORD_STATEMENT,
  'track-record.CLIENT_TYPES_HEADING': CLIENT_TYPES_HEADING,
  'track-record.CLIENT_TYPES': CLIENT_TYPES as unknown as JsonValue,

  'testimonials.TESTIMONIALS_HERO': TESTIMONIALS_HERO as unknown as JsonValue,
  'testimonials.TESTIMONIALS': TESTIMONIALS as unknown as JsonValue,

  'contact.CONTACT_HERO': CONTACT_HERO as unknown as JsonValue,
  'contact.CONTACT_LABELS': CONTACT_LABELS as unknown as JsonValue,
  'contact.CONTACT_PLACEHOLDERS': CONTACT_PLACEHOLDERS as unknown as JsonValue,
  'contact.CONTACT_CONSENT': CONTACT_CONSENT,
  'contact.CONTACT_DIRECT': CONTACT_DIRECT as unknown as JsonValue,
  'contact.CONTACT_SUCCESS': CONTACT_SUCCESS as unknown as JsonValue,

  'nav.LOGO': LOGO as unknown as JsonValue,
  'nav.NAV_ITEMS': NAV_ITEMS as unknown as JsonValue,
  'nav.PROGRAMS_LABEL': PROGRAMS_LABEL,
  'nav.PROGRAM_ITEMS': PROGRAM_ITEMS as unknown as JsonValue,
  'nav.NAV_CTA': NAV_CTA as unknown as JsonValue,
  'nav.QUICK_ACTIONS': QUICK_ACTIONS as unknown as JsonValue,
};

/**
 * The current value of an export, with any saved override applied.
 * @param {string} moduleId
 * @param {string} exportName
 * @returns {JsonValue|undefined} undefined when the key is not registered
 */
export function readExport(moduleId: string, exportName: string): JsonValue | undefined {
  const key = `${moduleId}.${exportName}`;
  const fallback = REGISTRY[key];
  if (fallback === undefined) return undefined;
  return withOverrides(key, fallback);
}

/** Every registered key, for the checker and the diagnostics panel. */
export function registeredKeys(): string[] {
  return Object.keys(REGISTRY);
}
