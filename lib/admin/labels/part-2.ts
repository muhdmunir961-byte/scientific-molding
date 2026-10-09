/**
 * Human field labels — part 2: Track record, Testimonials, Contact.
 *
 * See `part-1.ts` for why this exists. The same `FieldLabel` shape is used.
 */

import type { FieldLabel } from './part-1';

/** Labels for Track record, Testimonials and Contact. */
export const LABELS_PART_2: Record<string, FieldLabel> = {
  /* ---------------- Track record ---------------- */
  'track-record.TRACK_RECORD_HERO.eyebrow': { label: 'Section label', where: 'Track record' },
  'track-record.TRACK_RECORD_HERO.title': { label: 'Section heading', where: 'Track record' },
  'track-record.TRACK_RECORD_HERO.subcopy': { label: 'Section description', where: 'Track record' },
  'track-record.TRACK_RECORD_STATS': {
    label: 'The three big figures',
    where: 'Track record — the large numbers',
    hint: 'Each needs a value, a label and a short explanation.',
  },
  'track-record.TRACK_RECORD_HRDC': {
    label: 'HRD Corp card',
    where: 'Track record — the outlined box',
  },
  'track-record.TRACK_RECORD_STATEMENT': {
    label: 'Closing statement',
    where: 'Track record — the quoted line at the bottom',
  },
  'track-record.CLIENT_TYPES_HEADING': { label: 'Industry list heading', where: 'Track record' },
  'track-record.CLIENT_TYPES': {
    label: 'Industries served',
    where: 'Track record — the chips',
    hint: 'The icon name must be one of: car, circuit-board, package, heart-pulse, box, factory.',
  },

  /* ---------------- Testimonials ---------------- */
  'testimonials.TESTIMONIALS_HERO.eyebrow': { label: 'Section label', where: 'Testimonials' },
  'testimonials.TESTIMONIALS_HERO.title': { label: 'Section heading', where: 'Testimonials' },
  'testimonials.TESTIMONIALS_HERO.subcopy': { label: 'Section description', where: 'Testimonials' },
  'testimonials.TESTIMONIALS': {
    label: 'The quotes',
    where: 'Testimonials — the three cards',
    hint: 'To add a photo: upload it on the Images page using a "Testimonial" slot, then paste the path it gives you into that person\u2019s Photo path field.',
  },
  'testimonials.TESTIMONIALS[].name': { label: "Person's name", where: 'Testimonial card' },
  'testimonials.TESTIMONIALS[].role': { label: 'Job title', where: 'Testimonial — under the name' },
  'testimonials.TESTIMONIALS[].company': {
    label: 'Company',
    where: 'Testimonial — after the job title',
    hint: 'Only with that company\u2019s written permission. Otherwise describe the sector instead.',
  },
  'testimonials.TESTIMONIALS[].quote': {
    label: 'What they said',
    where: 'Testimonial — the main text',
    hint: 'Two or three sentences. A specific change is more convincing than praise.',
  },
  'testimonials.TESTIMONIALS[].avatar': {
    label: 'Photo path',
    where: 'Testimonial — the round photo',
    hint: 'Upload on the Images page using a "Testimonial" slot, then paste the path here. Leave unchanged to show an initial letter instead.',
  },
  'testimonials.TESTIMONIALS[].rating': {
    label: 'Star rating (1-5)',
    where: 'Testimonial — the stars',
    hint: 'Only publish a rating the person actually gave.',
  },

  /* ---------------- Contact ---------------- */
  'contact.CONTACT_HERO.eyebrow': { label: 'Section label', where: 'Contact' },
  'contact.CONTACT_HERO.title': { label: 'Section heading', where: 'Contact' },
  'contact.CONTACT_HERO.subcopy': { label: 'Section description', where: 'Contact' },
  'contact.CONTACT_LABELS': {
    label: 'Form field labels',
    where: 'Contact — the enquiry form',
    hint: 'What each input is called. These are the words visitors read above each box.',
  },
  'contact.CONTACT_PLACEHOLDERS': {
    label: 'Form placeholder text',
    where: 'Contact — the grey text inside each box',
  },
  'contact.CONTACT_CONSENT': {
    label: 'Consent sentence',
    where: 'Contact — beside the checkbox',
    hint: 'Required for PDPA compliance. Have it reviewed before changing it.',
  },
  'contact.CONTACT_DIRECT.phoneDisplay': { label: 'Phone number', where: 'Contact — the contact list' },
  'contact.CONTACT_DIRECT.phoneHref': { label: 'Phone link', where: 'Contact — dials when tapped' },
  'contact.CONTACT_DIRECT.email': { label: 'Email address', where: 'Contact — the contact list' },
  'contact.CONTACT_DIRECT.emailHref': { label: 'Email link', where: 'Contact — opens mail when clicked' },
  'contact.CONTACT_DIRECT.linkedin': { label: 'LinkedIn text', where: 'Contact — the contact list' },
  'contact.CONTACT_DIRECT.linkedinHref': { label: 'LinkedIn URL', where: 'Contact — opens when clicked' },
  'contact.CONTACT_DIRECT.whatsapp': { label: 'WhatsApp number shown', where: 'Contact — the contact list' },
  'contact.CONTACT_DIRECT.whatsappHref': { label: 'WhatsApp link', where: 'Contact — opens chat when clicked' },
  'contact.CONTACT_DIRECT.responseNote': { label: 'Response-time note', where: 'Contact — under the list' },
  'contact.CONTACT_SUCCESS.heading': { label: 'Success message heading', where: 'Contact — shown after sending' },
  'contact.CONTACT_SUCCESS.body': { label: 'Success message text', where: 'Contact — shown after sending' },
  'contact.CONTACT_SUCCESS.again': { label: 'Send-another button', where: 'Contact — shown after sending' },
};
