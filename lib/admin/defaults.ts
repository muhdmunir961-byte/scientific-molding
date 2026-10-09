/**
 * Built-in defaults for each editable group.
 *
 * These mirror the constants in the hand-written content modules. They are
 * duplicated rather than imported because importing those modules into a
 * server-only admin path would pull component code into the admin bundle for
 * no benefit — and the admin panel only ever needs the string values.
 *
 * They serve two purposes:
 *   1. What the form shows before the panel has ever been saved to.
 *   2. The fallback for any field a generated module omits, so a partially
 *      written file degrades to a sensible value rather than an empty box.
 *
 * When a hand-written default changes in the component, change it here too.
 * `scripts/check-admin.mjs` asserts the two agree for the fields it can read.
 */

import type { GroupSpec } from './schema';

const DEFAULTS: Record<string, Record<string, string>> = {
  images: {
    hero: '/images/hero-training.jpg',
    trainerPortrait: '/images/trainer-portrait.jpg',
    session1: '/images/session-1.jpg',
    session2: '/images/session-2.jpg',
    session3: '/images/session-3.jpg',
    session4: '/images/session-4.jpg',
  },
  hero: {
    eyebrow: 'HRDC Claimable Training',
    headline: 'Scientific Molding Training Series',
    tagline: '7 structured modules. One stronger moulding organisation.',
    subcopy:
      'Build capability • Improve consistency • Strengthen technical decision-making',
  },
  about: {
    eyebrow: 'About the Trainer',
    name: 'Ts. Mohd Hafiedzzul Bin Malek Riduan',
  },
  testimonials: {
    heading: 'What Participants Say.',
    subcopy:
      'Feedback from engineers and managers who have completed the programmes.',
    name1: '[Name]',
    role1: '[Role]',
    company1: '[Company]',
    quote1: '[Testimonial text — 2-3 sentences]',
    name2: '[Name]',
    role2: '[Role]',
    company2: '[Company]',
    quote2: '[Testimonial text — 2-3 sentences]',
    name3: '[Name]',
    role3: '[Role]',
    company3: '[Company]',
    quote3: '[Testimonial text — 2-3 sentences]',
  },
};

/**
 * The defaults for a group, restricted to that group's declared fields.
 * @param {GroupSpec} group
 * @returns {Record<string,string>}
 */
export function defaultsFor(group: GroupSpec): Record<string, string> {
  const groupDefaults = DEFAULTS[group.id] ?? {};
  const result: Record<string, string> = {};
  for (const field of group.fields) {
    result[field.key] = groupDefaults[field.key] ?? '';
  }
  return result;
}
