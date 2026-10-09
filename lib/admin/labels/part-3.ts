/**
 * Human field labels — part 3: Navigation and Banner.
 *
 * See `part-1.ts` for why this exists. The same `FieldLabel` shape is used.
 */

import type { FieldLabel } from './part-1';

/** Labels for the navigation, footer contact routes and the announcement banner. */
export const LABELS_PART_3: Record<string, FieldLabel> = {
  /* ---------------- Navigation ---------------- */
  'nav.LOGO.full': { label: 'Logo text', where: 'Site header — top left' },
  'nav.LOGO.short': { label: 'Short logo text', where: 'Mobile header' },
  'nav.NAV_ITEMS': {
    label: 'Menu items',
    where: 'Site header — the links',
    hint: 'Each entry needs a label and the section it scrolls to.',
  },
  'nav.PROGRAMS_LABEL': { label: 'Programmes dropdown label', where: 'Menu — the dropdown trigger' },
  'nav.PROGRAM_ITEMS': { label: 'Programmes dropdown items', where: 'Menu — the dropdown list' },
  'nav.NAV_CTA.label': { label: 'Header button text', where: 'Header — the orange button' },
  'nav.NAV_CTA.href': { label: 'Header button link', where: 'Header button destination' },
  'nav.QUICK_ACTIONS': {
    label: 'Mobile quick actions',
    where: 'Phone — the bar at the bottom',
    hint: 'The actions themselves are fixed (call, WhatsApp, email); only the labels are editable.',
  },

  /* ---------------- Banner ---------------- */
  'banner.BANNER.enabled': {
    label: 'Show the banner',
    where: 'Top of every page',
    hint: 'Tick to display it. The message below is ignored while this is unticked.',
  },
  'banner.BANNER.message': { label: 'Banner message', where: 'Banner — the text' },
  'banner.BANNER.linkHref': {
    label: 'Link destination',
    where: 'Banner — where the link goes',
    hint: 'e.g. "#contact" scrolls to the enquiry form. Leave blank for no link at all.',
  },
  'banner.BANNER.linkLabel': {
    label: 'Link text',
    where: 'Banner — the clickable words',
    hint: 'Hidden when the destination above is blank.',
  },
  'banner.BANNER.tone': {
    label: 'Colour',
    where: 'Banner',
    hint: 'One of: orange, yellow, neutral.',
  },
  'banner.BANNER.dismissible': {
    label: 'Let visitors close it',
    where: 'Banner — the × button',
  },
};
