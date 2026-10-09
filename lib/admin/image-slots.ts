/**
 * Image slots — the upload positions.
 *
 * Kept separate from `schema.ts`, which describes the editable text modules.
 * These are file uploads with fixed dimensions, not JSON values, so they have
 * their own contract: a slot name, the content key that stores its path, and the
 * intrinsic dimensions the frame reserves.
 *
 * ── Why a slot declares its own `group` ─────────────────────────────────
 * The upload page groups slots by where they appear on the page, so the operator
 * sees "Testimonial photos" rather than a flat list of nine names. The group is
 * display metadata only; it does not affect storage.
 */

/** Where an image slot lives on the page, for grouping in the panel. */
export type SlotGroup = 'Hero' | 'About the trainer' | 'Testimonials' | 'Branding';

/**
 * The image slots the upload API accepts.
 *
 * Dimensions are declared here rather than inferred from the uploaded file
 * because they set `ImageSlot`'s aspect ratio, and a ratio that changed with
 * every upload would reflow the layout on each replacement.
 */
export const IMAGE_SLOTS = {
  'hero': {
    key: 'hero',
    width: 800,
    height: 1000,
    label: 'Hero image',
    group: 'Hero' as SlotGroup,
    hint: 'Portrait. Appears beside the headline.',
  },
  'trainer-portrait': {
    key: 'trainerPortrait',
    width: 600,
    height: 800,
    label: 'Trainer portrait',
    group: 'About the trainer' as SlotGroup,
    hint: 'Portrait. The main photo in the About section.',
  },
  'session-1': {
    key: 'session1',
    width: 800,
    height: 600,
    label: 'Session photo 1',
    group: 'About the trainer' as SlotGroup,
    hint: 'Landscape. Gallery, top left.',
  },
  'session-2': {
    key: 'session2',
    width: 800,
    height: 600,
    label: 'Session photo 2',
    group: 'About the trainer' as SlotGroup,
    hint: 'Landscape. Gallery, top right.',
  },
  'session-3': {
    key: 'session3',
    width: 800,
    height: 600,
    label: 'Session photo 3',
    group: 'About the trainer' as SlotGroup,
    hint: 'Landscape. Gallery, bottom left.',
  },
  'session-4': {
    key: 'session4',
    width: 800,
    height: 600,
    label: 'Session photo 4',
    group: 'About the trainer' as SlotGroup,
    hint: 'Landscape. Gallery, bottom right.',
  },
  'testimonial-1': {
    key: 'testimonial1',
    width: 240,
    height: 240,
    label: 'Testimonial photo 1',
    group: 'Testimonials' as SlotGroup,
    hint: 'Square headshot. Paste the path into the first testimonial on the Content page.',
  },
  'testimonial-2': {
    key: 'testimonial2',
    width: 240,
    height: 240,
    label: 'Testimonial photo 2',
    group: 'Testimonials' as SlotGroup,
    hint: 'Square headshot. Paste the path into the second testimonial on the Content page.',
  },
  'testimonial-3': {
    key: 'testimonial3',
    width: 240,
    height: 240,
    label: 'Testimonial photo 3',
    group: 'Testimonials' as SlotGroup,
    hint: 'Square headshot. Paste the path into the third testimonial on the Content page.',
  },
  'logo': {
    key: 'logo',
    width: 320,
    height: 80,
    label: 'Logo image',
    group: 'Branding' as SlotGroup,
    hint: 'Landscape, transparent PNG or SVG. Replaces the text wordmark in the header when set.',
  },
} as const;

/** Valid slot names, for validation. */
export type ImageSlotName = keyof typeof IMAGE_SLOTS;

/** The slots, grouped for display. */
export function slotsByGroup(): { group: SlotGroup; slots: ImageSlotName[] }[] {
  const groups: SlotGroup[] = ['Branding', 'Hero', 'About the trainer', 'Testimonials'];
  return groups
    .map((group) => ({
      group,
      slots: (Object.keys(IMAGE_SLOTS) as ImageSlotName[]).filter(
        (s) => IMAGE_SLOTS[s].group === group,
      ),
    }))
    .filter((g) => g.slots.length > 0);
}
