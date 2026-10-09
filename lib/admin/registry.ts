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
import { BANNER } from '@/components/shared/banner-content';
import { buildManifest } from './images-manifest';
import {
  TRAINER_CREDIBILITY_NAME,
  TRAINER_CREDIBILITY_CREDENTIALS,
  TRAINER_CREDIBILITY_ONE_LINE,
} from '@/components/programs/trainer-credibility';
import {
  PROGRAM_CTA_FOOTERS,
} from '@/components/programs/program-cta-content';
import {
  PROGRAM_A_HERO,
  PROGRAM_A_PROBLEMS,
  PROGRAM_A_BENEFITS,
  PROGRAM_A_OUTCOMES,
  PROGRAM_A_PHILOSOPHY,
  PROGRAM_A_FOUNDATIONS,
  PROGRAM_A_DAYS,
  PROGRAM_A_LEARNING_FORMAT,
} from '@/components/programs/program-a-content';
import {
  PROGRAM_B_HERO,
  PROGRAM_B_PROBLEMS,
  PROGRAM_B_BENEFITS,
  PROGRAM_B_CAPABILITIES,
  PROGRAM_B_MODULES,
  PROGRAM_B_CORE_MODULES,
  PROGRAM_B_FRAMEWORK,
  PROGRAM_B_TAKE_BACK,
  PROGRAM_B_AUDIENCE,
  PROGRAM_B_LEARNING_APPROACH,
} from '@/components/programs/program-b-content';
import {
  PROGRAM_C_HERO,
  PROGRAM_C_PROBLEMS,
  PROGRAM_C_BENEFITS,
  PROGRAM_C_OUTCOMES,
  PROGRAM_C_PHILOSOPHY,
  PROGRAM_C_PERSPECTIVES,
  PROGRAM_C_DAYS,
  PROGRAM_C_TAKE_BACK,
  PROGRAM_C_AUDIENCE,
} from '@/components/programs/program-c-content';
import {
  PROGRAM_D_HERO,
  PROGRAM_D_WARNING_SIGNS,
  PROGRAM_D_BUSINESS_OUTCOMES,
  PROGRAM_D_DEFECTS_COVERED,
  PROGRAM_D_CAPABILITIES,
  PROGRAM_D_DAYS,
  PROGRAM_D_AUDIENCE,
  PROGRAM_D_LEARNING_FORMAT,
} from '@/components/programs/program-d-content';
import {
  PROGRAM_E_HERO,
  PROGRAM_E_STATS,
  PROGRAM_E_SECTION,
  PROGRAM_E_MODULES,
  PROGRAM_E_PATHWAY,
  PROGRAM_E_ORGANISATION_BUILD,
} from '@/components/programs/program-e-content';

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

  'banner.BANNER': BANNER as unknown as JsonValue,

  'trainer-credibility.TRAINER_CREDIBILITY_NAME': TRAINER_CREDIBILITY_NAME,
  'trainer-credibility.TRAINER_CREDIBILITY_CREDENTIALS':
    TRAINER_CREDIBILITY_CREDENTIALS as unknown as JsonValue,
  'trainer-credibility.TRAINER_CREDIBILITY_ONE_LINE': TRAINER_CREDIBILITY_ONE_LINE,

  'program-cta.PROGRAM_CTA_FOOTERS': PROGRAM_CTA_FOOTERS as unknown as JsonValue,

  'program-a.PROGRAM_A_HERO': PROGRAM_A_HERO as unknown as JsonValue,
  'program-a.PROGRAM_A_PROBLEMS': PROGRAM_A_PROBLEMS as unknown as JsonValue,
  'program-a.PROGRAM_A_BENEFITS': PROGRAM_A_BENEFITS as unknown as JsonValue,
  'program-a.PROGRAM_A_OUTCOMES': PROGRAM_A_OUTCOMES as unknown as JsonValue,
  'program-a.PROGRAM_A_PHILOSOPHY': PROGRAM_A_PHILOSOPHY as unknown as JsonValue,
  'program-a.PROGRAM_A_FOUNDATIONS': PROGRAM_A_FOUNDATIONS as unknown as JsonValue,
  'program-a.PROGRAM_A_DAYS': PROGRAM_A_DAYS as unknown as JsonValue,
  'program-a.PROGRAM_A_LEARNING_FORMAT': PROGRAM_A_LEARNING_FORMAT as unknown as JsonValue,

  'program-b.PROGRAM_B_HERO': PROGRAM_B_HERO as unknown as JsonValue,
  'program-b.PROGRAM_B_PROBLEMS': PROGRAM_B_PROBLEMS as unknown as JsonValue,
  'program-b.PROGRAM_B_BENEFITS': PROGRAM_B_BENEFITS as unknown as JsonValue,
  'program-b.PROGRAM_B_CAPABILITIES': PROGRAM_B_CAPABILITIES as unknown as JsonValue,
  'program-b.PROGRAM_B_MODULES': PROGRAM_B_MODULES as unknown as JsonValue,
  'program-b.PROGRAM_B_CORE_MODULES': PROGRAM_B_CORE_MODULES as unknown as JsonValue,
  'program-b.PROGRAM_B_FRAMEWORK': PROGRAM_B_FRAMEWORK as unknown as JsonValue,
  'program-b.PROGRAM_B_TAKE_BACK': PROGRAM_B_TAKE_BACK as unknown as JsonValue,
  'program-b.PROGRAM_B_AUDIENCE': PROGRAM_B_AUDIENCE as unknown as JsonValue,
  'program-b.PROGRAM_B_LEARNING_APPROACH': PROGRAM_B_LEARNING_APPROACH as unknown as JsonValue,

  'program-c.PROGRAM_C_HERO': PROGRAM_C_HERO as unknown as JsonValue,
  'program-c.PROGRAM_C_PROBLEMS': PROGRAM_C_PROBLEMS as unknown as JsonValue,
  'program-c.PROGRAM_C_BENEFITS': PROGRAM_C_BENEFITS as unknown as JsonValue,
  'program-c.PROGRAM_C_OUTCOMES': PROGRAM_C_OUTCOMES as unknown as JsonValue,
  'program-c.PROGRAM_C_PHILOSOPHY': PROGRAM_C_PHILOSOPHY as unknown as JsonValue,
  'program-c.PROGRAM_C_PERSPECTIVES': PROGRAM_C_PERSPECTIVES as unknown as JsonValue,
  'program-c.PROGRAM_C_DAYS': PROGRAM_C_DAYS as unknown as JsonValue,
  'program-c.PROGRAM_C_TAKE_BACK': PROGRAM_C_TAKE_BACK as unknown as JsonValue,
  'program-c.PROGRAM_C_AUDIENCE': PROGRAM_C_AUDIENCE as unknown as JsonValue,

  'program-d.PROGRAM_D_HERO': PROGRAM_D_HERO as unknown as JsonValue,
  'program-d.PROGRAM_D_WARNING_SIGNS': PROGRAM_D_WARNING_SIGNS as unknown as JsonValue,
  'program-d.PROGRAM_D_BUSINESS_OUTCOMES': PROGRAM_D_BUSINESS_OUTCOMES as unknown as JsonValue,
  'program-d.PROGRAM_D_DEFECTS_COVERED': PROGRAM_D_DEFECTS_COVERED as unknown as JsonValue,
  'program-d.PROGRAM_D_CAPABILITIES': PROGRAM_D_CAPABILITIES as unknown as JsonValue,
  'program-d.PROGRAM_D_DAYS': PROGRAM_D_DAYS as unknown as JsonValue,
  'program-d.PROGRAM_D_AUDIENCE': PROGRAM_D_AUDIENCE as unknown as JsonValue,
  'program-d.PROGRAM_D_LEARNING_FORMAT': PROGRAM_D_LEARNING_FORMAT as unknown as JsonValue,

  'program-e.PROGRAM_E_HERO': PROGRAM_E_HERO as unknown as JsonValue,
  'program-e.PROGRAM_E_STATS': PROGRAM_E_STATS as unknown as JsonValue,
  'program-e.PROGRAM_E_SECTION': PROGRAM_E_SECTION as unknown as JsonValue,
  'program-e.PROGRAM_E_MODULES': PROGRAM_E_MODULES as unknown as JsonValue,
  'program-e.PROGRAM_E_PATHWAY': PROGRAM_E_PATHWAY as unknown as JsonValue,
  'program-e.PROGRAM_E_ORGANISATION_BUILD': PROGRAM_E_ORGANISATION_BUILD as unknown as JsonValue,
};

/**
 * Saved image paths, loaded once per request by `loadImageManifest()`.
 *
 * Kept module-level because `readExport` must stay synchronous — the editor
 * calls it in a loop for every export in a module, and making it async would
 * thread a promise through the whole render for one field. The route loads the
 * saved values before reading any export.
 */
let savedImagePaths: Record<string, string> = {};

/**
 * Load the saved image paths so `readExport('images', 'PAGE_IMAGES')` can
 * return them.
 *
 * Called by the content route before it reads exports. Idempotent and cheap: it
 * reads one small generated file.
 * @param {() => Promise<Record<string,string>>} loader
 * @returns {Promise<void>}
 */
export async function loadImageManifest(
  loader: () => Promise<Record<string, string>>,
): Promise<void> {
  savedImagePaths = await loader();
}

/**
 * The current value of an export, with any saved override applied.
 * @param {string} moduleId
 * @param {string} exportName
 * @returns {JsonValue|undefined} undefined when the key is not registered
 */
export function readExport(moduleId: string, exportName: string): JsonValue | undefined {
  const key = `${moduleId}.${exportName}`;

  /*
   * `images.PAGE_IMAGES` is computed, not stored in the override map.
   *
   * It is the output of the upload pipeline rather than a value an operator
   * types, so it has no registry entry — which is exactly why the admin Content
   * page rendered `null` for it. Building it from the saved paths merged over
   * the defaults means the field can never be null: every slot resolves to a
   * path, or to the explicit empty state the admin renders as "not set".
   */
  if (key === 'images.PAGE_IMAGES') {
    return buildManifest(savedImagePaths) as unknown as JsonValue;
  }

  const fallback = REGISTRY[key];
  if (fallback === undefined) return undefined;
  return withOverrides(key, fallback);
}

/** Every registered key, for the checker and the diagnostics panel. */
export function registeredKeys(): string[] {
  return Object.keys(REGISTRY);
}
