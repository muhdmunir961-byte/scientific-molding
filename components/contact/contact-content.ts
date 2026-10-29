/**
 * §5.6 contact form content.
 *
 * Copy supplied verbatim in the task spec, drawing on PRD Section 5.6.
 */

/** Section identity. Anchor name comes from PRD Section 4. */
export const CONTACT_ID = 'contact' as const;

/** Hero statement. */
export const CONTACT_HERO = {
  eyebrow: 'REQUEST A PROPOSAL',
  title: "Let's Build Your Team's Capability.",
  subcopy:
    "Tell us about your team and training needs. We'll send a customised in-house proposal within 2 working days.",
} as const;

/**
 * Canonical list of programme identifiers and labels comes from the CTA
 * registry, so form choices and request links cannot drift apart. The legacy
 * keys keep the existing public links/bookmarks and email validation stable.
 */
import { PROGRAM_CTA_FOOTERS } from '../programs/program-cta-content';

export const CONTACT_PROGRAMS = PROGRAM_CTA_FOOTERS.map(({ slug, label }) => ({
  slug,
  label,
}));

export const CONTACT_PROGRAM_ALIASES: Readonly<Record<string, string>> = {
  'm1-fundamental': 'fundamentals',
  'm2-processability': 'materials',
  'm4-process-development': 'process-development',
  'm6-defects-troubleshooting': 'defect-troubleshooting',
  'm7-process-portability': 'pathway',
};

/** Consent checkbox text. Required — PDPA depends on it being explicit. */
export const CONTACT_CONSENT =
  'I agree to be contacted regarding this enquiry and understand that my details will be used solely for this purpose.' as const;

/** Field labels, so the form and the server messages stay in step. */
export const CONTACT_LABELS = {
  name: 'Name',
  company: 'Company',
  jobTitle: 'Job Title',
  email: 'Email',
  phone: 'Phone',
  programs: 'Programme(s) of Interest',
  participants: 'Number of Participants',
  preferredDates: 'Preferred Dates',
  message: 'Message',
} as const;

/** Placeholders. Every one ends with a single-character ellipsis. */
export const CONTACT_PLACEHOLDERS = {
  name: 'Your full name',
  company: 'Company name',
  jobTitle: 'e.g. Process Engineer',
  email: 'name@company.com',
  phone: '+60 12-345 6789',
  participants: 'e.g. 8',
  preferredDates: 'e.g. March 2026, or flexible',
  message: 'Tell us about your team, machines and current challenges…',
} as const;

/** Direct-contact column. */
export const CONTACT_DIRECT = {
  heading: 'Prefer direct contact?',
  phoneDisplay: '+60 12-488 5247',
  phoneHref: 'tel:+60124885247',
  email: 'hafiedzzul@gmail.com',
  emailHref: 'mailto:hafiedzzul@gmail.com',
  linkedin: 'linkedin.com/in/hafiedzzul',
  linkedinHref: 'https://linkedin.com/in/hafiedzzul',
  whatsapp: 'WhatsApp',
  whatsappHref: 'https://wa.me/60124885247',
  responseNote: 'Replies within 2 working days',
} as const;

/** Success state, shown in place of the form after a 200. */
export const CONTACT_SUCCESS = {
  heading: 'Enquiry sent',
  body: "We'll be in touch within 2 working days.",
  again: 'Send another enquiry',
} as const;
