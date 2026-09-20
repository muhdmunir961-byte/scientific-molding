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
 * The five programmes offered as checkboxes.
 *
 * `slug` matches the anchor of each program section, so `?program=fundamentals`
 * pre-checks the matching box. The label is what the enquirer sees.
 */
export const CONTACT_PROGRAMS = [
  { slug: 'fundamentals', label: 'Fundamentals' },
  { slug: 'materials', label: 'Materials' },
  { slug: 'process-development', label: 'Process Development' },
  { slug: 'defect-troubleshooting', label: 'Defect Troubleshooting' },
  { slug: 'pathway', label: 'Full Pathway' },
] as const;

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
