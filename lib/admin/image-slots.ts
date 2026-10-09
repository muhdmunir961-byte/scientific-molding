/**
 * Image slots — the six upload positions.
 *
 * Kept separate from `schema.ts`, which describes the editable text modules.
 * These are file uploads with fixed dimensions, not JSON values, so they have
 * their own contract: a slot name, the content key that stores its path, and the
 * intrinsic dimensions the frame reserves.
 */

/**
 * The six image slots the upload API accepts.
 *
 * Dimensions are declared here rather than inferred from the uploaded file
 * because they set `ImageSlot`'s aspect ratio, and a ratio that changed with
 * every upload would reflow the layout on each replacement.
 */
export const IMAGE_SLOTS = {
  hero: { key: 'hero', width: 800, height: 1000, label: 'Hero image' },
  'trainer-portrait': {
    key: 'trainerPortrait',
    width: 600,
    height: 800,
    label: 'Trainer portrait',
  },
  'session-1': { key: 'session1', width: 800, height: 600, label: 'Session photo 1' },
  'session-2': { key: 'session2', width: 800, height: 600, label: 'Session photo 2' },
  'session-3': { key: 'session3', width: 800, height: 600, label: 'Session photo 3' },
  'session-4': { key: 'session4', width: 800, height: 600, label: 'Session photo 4' },
} as const;

/** Valid slot names, for validation. */
export type ImageSlotName = keyof typeof IMAGE_SLOTS;
