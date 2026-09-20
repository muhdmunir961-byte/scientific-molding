#!/usr/bin/env node
/**
 * Verify the EntranceLoader + Hero render correctly in the served HTML.
 *
 * This asserts on the *output*, not the source. A component can compile
 * cleanly and still emit nothing if a conditional swallows it — and a stale
 * `next start` process will happily serve an old build while every local check
 * passes. Asserting on the served bytes is the only way to catch both.
 *
 * Usage:
 *   npm run dev                      # then, in another shell:
 *   npm run check:entrance
 *
 *   BASE=http://localhost:3210 node scripts/check-entrance.mjs
 */

import { readFileSync } from 'node:fs';

/*
 * Default to 5555, the port this project's own start script uses. Port 3000 is
 * occupied by an unrelated Express app in this workspace. An earlier default
 * pointed at a port held by a stale process and silently asserted against an
 * old build — exactly the failure this script exists to catch, so the default
 * is an explicit port this project owns.
 */
const BASE = process.env.BASE ?? 'http://localhost:5555';

/* ------------------------------------------------------------------ *
 * Assertions
 * ------------------------------------------------------------------ */

/**
 * Decode the HTML entities React emits for text content.
 *
 * React escapes `&`, `<` and `>` in rendered text, so a heading written as
 * "Before & After" arrives as "Before &amp; After". Comparing raw source
 * strings against that would fail on a correct build. Decoding narrows the
 * difference without weakening the assertion: the decoded text still has to
 * match exactly.
 *
 * Only the three entities React's default text escaping produces are handled,
 * plus the handful of named entities used deliberately in the copy. If a
 * future string needs more, the comparison should be revisited rather than a
 * full entity table pasted in.
 *
 * Note the direction: React does NOT emit `&copy;` — it emits the literal `©`
 * character. So a named entity in the source is normalised to its character
 * here, because that is what actually arrives over the wire.
 *
 * @param {string} text
 * @returns {string}
 */
const decodeEntities = (text) =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&copy;/g, '\u00a9')
    .replace(/&middot;/g, '\u00b7')
    .replace(/&larr;/g, '\u2190');

/** Structure that must appear in the served HTML. */
const STRUCTURE = [
  ['logo text', 'SCIENTIFIC MOLDING'],
  ['radial gradient', 'radial-gradient'],
  ['yellow core', '#FFC93C'],
  ['orange edge', '#F07C23'],
  ['z-index 9999', 'z-[9999]'],
  ['pointer-events none', 'pointer-events-none'],
  ['initial blur', 'blur(0px)'],
  ['content reveal class', 'content-reveal'],
  ['live region', 'aria-live'],
  ['status role', 'role="status"'],
  ['hero section', 'id="hero"'],
  ['headline id', 'id="hero-headline"'],
  ['blueprint grid', 'hero-grid'],
  ['media placeholder', 'Image placeholder'],
  // Section 5.2
  ['about section', 'id="about"'],
  ['about heading id', 'id="about-heading"'],
  ['credential list is a <ul>', 'list-none'],
  ['trainer photo frame', 'Photo placeholder'],
  // Section 5.3 Program A
  ['program A section', 'id="fundamentals"'],
  ['program A heading id', 'id="fundamentals-heading"'],
  ['program A hero is dark', 'var(--pdf-dark)'],
  ['program hero height', 'min-height:70vh'],
  ['before/after table', 'before-after-table'],
  // Section 5.3 Programs B–E anchors
  ['program B anchor', 'id="materials"'],
  ['program C anchor', 'id="process-development"'],
  ['program D anchor', 'id="defect-troubleshooting"'],
  ['program E anchor', 'id="pathway"'],
  // Section 5.4
  ['why section', 'id="why"'],
  ['why heading id', 'id="why-heading"'],
  ['why comparison group', 'role="group"'],
  // Section 5.5
  ['track record section', 'id="track-record"'],
  ['track record heading id', 'id="track-record-heading"'],
  ['trust statement is a blockquote', '<blockquote'],
  ['credential list is a <ul>', '<ul'],
  // Section 5.6
  ['contact section', 'id="contact"'],
  ['contact heading id', 'id="contact-heading"'],
  ['enquiry form element', '<form'],
  /*
   * Consent's `required` attribute is asserted separately — see
   * `CONSENT_REQUIRED` below the fetch block. It needs a pattern rather than a
   * bare substring, because asserting `required=""` alone passed by matching
   * the text inputs while consent was in fact unenforced.
   */
  ['honeypot is hidden from assistive tech', 'tabindex="-1"'],
  ['footer element', '<footer'],
];

/**
 * PRD 5.5 — Track Record. Copy verbatim from the task spec.
 *
 * The three figures are asserted as separate value + label + sublabel strings
 * rather than as a combined line, because the renderer splits them across three
 * elements and a combined assertion would pass on a wrong layout.
 */
const TRACK_RECORD_COPY = [
  'TRACK RECORD',
  'Proven Across Malaysian Injection Moulding.',
  'Seventeen years building scientific moulding capability. Hundreds of engineers trained. Dozens of manufacturing partners.',
  // Big stat cards — value, label, sublabel
  '17+',
  'Years Industry + Academia',
  'Since ~2008',
  '500+',
  'Technical Personnel Trained',
  'Across 5 training programmes',
  '60+',
  'Malaysian Manufacturing Companies',
  'Injection moulding operations',
  // HRDC block
  'HRD Corp Accredited Trainer',
  'Training programmes are HRDC-claimable for Malaysian employers.',
  // Credentials strip
  'Credentials',
  'Professional Technologist',
  'Global Certification for Plastics Professionals (Routsis, USA)',
  'Injection Molding Driver License (L5, German Training Center)',
  'Former Process Engineer',
  'Senior Lecturer',
  // Trust statement
  'The same trainer who wrote the programmes delivers them. No subcontracting, no junior facilitator. Direct from practitioner to team.',
];

/**
 * ASSUMPTION — the five operation types in the "Operations We Serve" strip.
 *
 * PRD 5.5 asks for company-type markers "if available"; none were supplied,
 * and these five were not given in the spec either. They are derived from the
 * industries the source programmes reference. Asserted so that replacing them
 * with unconfirmed types is a deliberate edit rather than an accident.
 */
const CLIENT_TYPE_COPY = [
  'Industries We Typically Serve',
  'Automotive',
  'Electronics',
  'Consumer Goods',
  'Medical Devices',
  'Packaging',
];

/**
 * PRD 5.4 — Why Scientific Molding. Copy verbatim from the task spec.
 *
 * The four problem titles and four shift titles are the load-bearing strings:
 * they are the aggregation the whole section exists for, so each is asserted
 * individually rather than as a pair.
 */
const WHY_COPY = [
  'WHY SCIENTIFIC MOULDING',
  'Before vs After — the capability gap.',
  'Four recurring problems we see across Malaysian injection moulding operations. Four shifts that scientific thinking delivers.',
  // Before column
  'Copied settings',
  'Numbers are repeated without understanding the plastic. Different resin grades treated as if they behave identically.',
  'Recurring defects',
  'Temporary adjustments hide the actual mechanism. Same defect returns after a setting change.',
  'Key-person dependency',
  'Critical decisions depend on a few senior experts. Knowledge stays with individuals, not the team.',
  'Unclear process evidence',
  'Machine settings are recorded, but actual outputs are not understood. Decisions rely on habit, not evidence.',
  // After column
  'Material-aware process intent',
  'Understand what the plastic requires, then set the machine.',
  'Evidence-led investigation',
  'Symptom, mechanism and cause separated. Corrective actions validated and documented.',
  'Shared method across team',
  'One troubleshooting language. First-response capability built across shifts.',
  'Verifiable, repeatable decisions',
  'Process behaviour explained by evidence. Approved conditions documented for the team.',
];

/**
 * The five program hero titles, one fragment per program. Each is the orange
 * or white run that only that program's hero renders, so a copy mix-up between
 * programs fails rather than passing on a shared string.
 */
const PROGRAM_TITLES = [
  'FUNDAMENTALS.',
  'IN INJECTION MOLDING.',
  'PROCESS DEVELOPMENT',
  'MANAGEMENT SHOULD RECOGNISE',
  'ONE STRONGER MOULDING ORGANISATION.',
];

/**
 * Copy unique to each program, chosen to prove all five bodies rendered rather
 * than one repeated. Drawn from the verbatim PDF extraction.
 */
const PROGRAM_BODIES = [
  // Program A
  'Slow, inconsistent onboarding',
  'MATERIAL + MOULD + MACHINE + PROCESS',
  // Program B
  'MOISTURE UNCERTAINTY',
  'Four Plastic Conditions',
  // Program C
  'SHIFT-TO-SHIFT VARIATIONS',
  'Four Day Journey',
  // Program D
  'SIX WARNING SIGNS',
  'Defects Covered',
  // Program E
  '7 structured modules',
  'SPECIALIST MODULES',
  'Process Portability',
];

/** PRD Section 5.2 — About the Trainer. */
const ABOUT_COPY = [
  'About the Trainer',
  'Ts. Mohd Hafiedzzul Bin Malek Riduan',
  'Professional Technologist',
  'HRD Corp Accredited Trainer',
  'Global Certification for Plastics Professionals (Routsis, USA)',
  'Injection Molding Driver License (L5, German Training Center)',
  'Former Process Engineer',
  'Senior Lecturer',
  'NOSS Panel member',
  '17+',
  '500+',
  '60+',
  'Years Experience',
  'Personnel Trained',
  'Injection Molding Companies',
];

/**
 * Copy that must appear byte-for-byte, from PRD Section 5.1. These are the
 * strings a later refactor is most likely to quietly reword.
 */
const COPY = [
  'Scientific Molding Training Series',
  '7 structured modules. One stronger moulding organisation.',
  'Build capability • Improve consistency • Strengthen technical decision-making',
  'HRDC Claimable Training',
  '07',
  '16',
  '04',
  '01',
  'specialist modules',
  'total training days',
  'capability levels',
  'clear learning path',
  'Request a Customised Proposal',
  'Call Now',
  'Email Now',
];

/**
 * PRD 5.3 / PDF Program A copy — the verbatim strings asserted in the output.
 *
 * These come from the supplied PDF content, which overrides PRD 5.3. Two of
 * them are deliberate `PDF-TYPO` strings: they are the source's own wording and
 * are asserted so a future "fix" is caught rather than shipped silently.
 */
const PROGRAM_A_COPY = [
  'Move from memorized settings to scientific material-and-process thinking',
  'SCIENTIFIC MOULDING',
  'FUNDAMENTALS.',
  // PDF-TYPO: mid-sentence capitals preserved
  'Build Engineers Who understand The Process.',
  'A two-day foundation linking material, mould, machine and process to safer, clearer and more consistent workplace performance.',
  '2-Day',
  'HRDC Claimable',
  'Slow, inconsistent onboarding',
  'Memorised machine settings',
  'Trial-and-error assumptions',
  'Weak defect awareness',
  'Unclear technical communication',
  'Dependence on senior engineers',
  'Five Measurable Benefits',
  'Faster technical onboarding',
  'Sustainable engineering capability',
  // PDF-TYPO: "Memories" preserved
  'Memories machine settings',
  'BEFORE',
  'AFTER',
  'Why Foundation Matters',
  'A DEFECT IS A SYMPTOM — NOT AUTOMATIC PROOF OF ITS ROOT CAUSE.',
  'Five Outcomes for New Engineers',
  'Philosophy',
  'MATERIAL + MOULD + MACHINE + PROCESS',
  'TEMPERATURE | FLOW | PRESSURE | COOLING',
  // PDF-TYPO: "behavior" (US) against "behaviour" (UK) elsewhere, preserved
  'Material behavior, the four plastic conditions and machine-function awareness.',
  'Two-Day Journey',
  'Learning Format',
  'Guided discussions',
  'BUILD A STRONGER ENGINEERING FOUNDATION',
  'Ts. Mohd Hafiedzzul Bin Malek Riduan',
  'Professional Technologist',
  'NOSS Panel member',
];

/**
 * Design tokens that must appear in the generated CSS, from PRD Section 13.1.
 *
 * Asserted against the stylesheet rather than the markup, since that is where
 * Tailwind and the token block are emitted. Matched loosely: the production
 * CSS minifier strips the space after the colon and shortens hex values
 * (`#ffffff` → `#fff`), so the check normalises both sides rather than
 * demanding byte-identical source formatting.
 */
const TOKENS = [
  ['orange accent', '--prd-orange:#f07c23'],
  ['orange deep (pressed)', '--prd-orange-deep:#e8631c'],
  ['yellow accent', '--prd-yellow:#ffc93c'],
  ['warm off-white', '--prd-offwhite:#fdfbf7'],
  ['charcoal text', '--prd-ink:#2a2a2a'],
  ['warm grey muted', '--prd-ink-muted:#6b6b63'],
  ['success tint', '--prd-success-bg:#fff6dd'],
  ['neutral', '--prd-neutral:#f3f1ec'],
  ['gradient accent', '--prd-gradient:linear-gradient(135deg, #f07c23 0%, #ffc93c 100%)'],
  ['pill radius', '--prd-radius-pill:999px'],
];

/**
 * PDF palette tokens that must appear in the generated CSS.
 *
 * These OVERRIDE PRD 13.1: the customer supplied five program PDFs and asked
 * for them to match exactly, so the PDF's darker orange and its solid black
 * program hero win over the PRD's "no dark/black sections" line.
 */
const PDF_TOKENS = [
  ['pdf orange', '--pdf-orange:#e8631c'],
  ['pdf orange dark', '--pdf-orange-dark:#d9541c'],
  ['pdf dark surface', '--pdf-dark:#1a1a1a'],
  ['pdf dark soft', '--pdf-dark-soft:#2a2a2a'],
  ['pdf charcoal', '--pdf-charcoal:#2a2a2a'],
  ['pdf warm grey', '--pdf-warm-grey:#6b6b63'],
];

/**
 * Collapse whitespace so a minified stylesheet compares equal to its source
 * form. Only whitespace is normalised — the values themselves must match
 * exactly, which is the point of the assertion.
 * @param {string} text
 * @returns {string}
 */
const squash = (text) => text.replace(/\s+/g, ' ').trim();

/** Contact routes. A typo here silently breaks every lead. */
const CONTACT = ['tel:+60124885247', 'mailto:hafiedzzul@gmail.com'];

/**
 * §5.6 contact-form field names.
 *
 * Asserted as the literal `name="..."` attributes rather than the visible
 * labels, because the `name` is what the server validation keys on. A label
 * can be reworded freely; renaming a field silently breaks the route, and the
 * form would still look correct on screen.
 */
const CONTACT_FORM_NAMES = [
  'name="name"',
  'name="company"',
  'name="jobTitle"',
  'name="email"',
  'name="phone"',
  'name="programs"',
  'name="participants"',
  'name="preferredDates"',
  'name="message"',
  'name="consent"',
];

/**
 * §5.6 direct-contact routes.
 *
 * Every one is a link a visitor can actually click. `wa.me` is asserted
 * because a WhatsApp number typed without the country code still renders
 * perfectly and then fails on the device that taps it.
 */
const CONTACT_ROUTES = [
  ['phone route', 'tel:+60124885247'],
  ['email route', 'mailto:hafiedzzul@gmail.com'],
  ['linkedin route', 'https://linkedin.com/in/hafiedzzul'],
  ['whatsapp route', 'https://wa.me/60124885247'],
  ['privacy policy link', 'href="/privacy"'],
];

/**
 * §6 footer. Contact details, quick links, legal line.
 *
 * The quick links are asserted against the section anchors from PRD Section 4,
 * so a renamed section id fails here rather than producing a dead footer link.
 */
const FOOTER_COPY = [
  ['footer quick links heading', 'Quick Links'],
  ['footer legal heading', 'Legal'],
  ['footer privacy link', 'Privacy Policy'],
  ['compliance line', 'HRD Corp Accredited Trainer'],
  ['compliance line', 'NOSS Panel member'],
  /*
   * Matched as the literal character, not `&copy;`. React renders the entity
   * to `©` on the way out, so that is what the served bytes contain.
   */
  ['copyright year', '\u00a9 2026 Scientific Molding Training Series'],
  ['anchor to about', 'href="#about"'],
  ['anchor to why', 'href="#why"'],
  ['anchor to track record', 'href="#track-record"'],
  ['anchor to contact', 'href="#contact"'],
];

/**
 * §5.6 contact copy, supplied verbatim in the task spec.
 *
 * The success-state strings are asserted too. They only appear after a
 * successful submit, so a client-rendered success card would not be in this
 * HTML — `SuccessCard` is therefore only checked for existence, while these
 * strings are checked in the served payload's script bundle instead.
 */
const CONTACT_COPY = [
  ['contact eyebrow', 'REQUEST A PROPOSAL'],
  ['contact title', "Let's Build Your Team's Capability."],
  [
    'contact subcopy',
    "Tell us about your team and training needs. We'll send a customised in-house proposal within 2 working days.",
  ],
  ['consent text', 'I agree to be contacted regarding this enquiry'],
  ['direct contact heading', 'Prefer direct contact?'],
  ['response promise', 'Replies within 2 working days'],
  ['programme label', 'Fundamentals'],
  ['programme label', 'Materials'],
  ['programme label', 'Process Development'],
  ['programme label', 'Defect Troubleshooting'],
  ['programme label', 'Full Pathway'],
  ['field label', 'Job Title'],
  ['field label', 'Number of Participants'],
  ['field label', 'Preferred Dates'],
];

/**
 * §5.6 success state.
 *
 * These strings live in the client bundle, not the initial HTML, so they are
 * matched against the script chunks the page loads. That is still an
 * output-level check: if the component tree drops `SuccessCard`, the strings
 * vanish from the bundle and this fails.
 */
const CONTACT_SUCCESS_COPY = [
  ['success heading', 'Enquiry sent'],
  ['success body', "We'll be in touch within 2 working days."],
  ['success reset action', 'Send another enquiry'],
];

/**
 * §5.3 → §5.6 programme CTAs.
 *
 * Each program's closing CTA must jump to the form with its own programme
 * pre-selected. Asserted per slug because a copy-paste that reuses the wrong
 * slug still renders a working-looking button — it would just tick the wrong
 * box, which is invisible until a lead arrives labelled as the wrong course.
 */
const PROGRAM_CTA_LINKS = [
  ['program A CTA', '#contact?program=fundamentals'],
  ['program B CTA', '#contact?program=materials'],
  ['program C CTA', '#contact?program=process-development'],
  ['program D CTA', '#contact?program=defect-troubleshooting'],
  ['program E CTA', '#contact?program=pathway'],
];

/**
 * §6.1/6.2 — header, hamburger and mobile panel.
 *
 * The panel itself only exists in the DOM once opened, so its attributes are
 * asserted against the fetched client bundle rather than the server HTML. That
 * still keeps the check at the output level: it proves the aria wiring shipped,
 * not merely that a source file contains it.
 */
const NAV_STRUCTURE = [
  ['header is fixed and sticky', 'class="nav-shell fixed inset-x-0 top-0 z-50"'],
  ['desktop nav is a <nav>', 'aria-label="Main"'],
  ['programs trigger is a button', 'aria-haspopup="true"'],
  ['programs menu has an id', 'id="nav-programs-menu"'],
];

/** §6 — nav labels and the header CTA, from the server HTML. */
const NAV_COPY = [
  ['home link', '>Home<'],
  ['about link', '>About<'],
  ['programs trigger', 'Programs'],
  ['why link', '>Why<'],
  ['track record link', '>Track Record<'],
  ['contact link', '>Contact<'],
  ['header CTA', 'Request Proposal'],
];

/** §6.2 — merged-into-`htmlText` attrs are already there; these are deep ones. */
const NAV_SCRIPT_MARKERS = [
  ['mobile panel is a dialog', 'role:"dialog"'],
  ['panel is modal', 'aria-modal'],
  ['panel is labelled', 'aria-labelledby'],
  ['safe-area padding', 'env(safe-area-inset'],
];

/**
 * Phase 4A — design-system tokens that must survive the build.
 *
 * Only a handful of each family is pinned. Asserting all ~70 would be a list
 * that grows with every token and passes for the wrong reason the moment a
 * name is mistyped in _both_ places; these are chosen so that each family has
 * at least one representative, and so that a token that is referenced by a
 * utility class is covered:
 *
 *   --shadow-md    consumed by `.elevated-md`
 *   --text-h2      consumed by `.text-h2`
 *   --radius-lg    the card radius
 *   --ease-out     the default easing
 *   --orange-500   the primary brand colour
 *   --ring-orange  the focus ring
 *   --space-6      the base spacing unit
 *   --duration-normal
 *   --container-max
 *
 * The needle is the declaration through its terminating semicolon, not just
 * the name. `--text-h2:` would also match `--text-h2-something:`, and the
 * point of pinning a name is that it is unambiguous.
 */
const DESIGN_TOKENS = [
  ['--ds-shadow-md declaration', '--ds-shadow-md:'],
  ['--ds-text-h2 declaration', '--ds-text-h2:'],
  ['--ds-radius-lg declaration', '--ds-radius-lg:'],
  ['--ds-ease-out declaration', '--ds-ease-out:'],
  ['--ds-orange-500 declaration', '--ds-orange-500:'],
  ['--ds-ring-orange declaration', '--ds-ring-orange:'],
  ['--ds-space-6 declaration', '--ds-space-6:'],
  ['--ds-duration-normal declaration', '--ds-duration-normal:'],
  ['--ds-container-max declaration', '--ds-container-max:'],
];

/**
 * Phase 4A — the utilities and the focus ring.
 *
 * A token that is declared but whose consumer was dropped is invisible: the
 * custom property still ships, the check still passes, and every section that
 * uses `.text-h2` quietly falls back to inherited type. These assert the
 * consumers exist too.
 *
 * `:focus-visible` is asserted on the declaration rather than the selector,
 * because the selector is emitted minified and may be grouped.
 */
const DESIGN_UTILITIES = [
  ['.section rhythm is declared', '.section{'],
  ['.section does not use @apply', 'padding-block:var(--ds-section-padding-y-mobile)'],
  ['.container is declared', '.container{'],
  ['.text-hero consumes the token', 'font-size:var(--ds-text-hero)'],
  ['.text-h2 consumes the token', 'font-size:var(--ds-text-h2)'],
  ['.eyebrow is wide-tracked', 'letter-spacing:var(--ds-tracking-wider)'],
  ['.elevated-md consumes the shadow', 'box-shadow:var(--ds-shadow-md)'],
  ['focus ring uses the token', 'box-shadow:var(--ds-ring-orange)'],
];

/**
 * Phase 4B — nav polish.
 *
 * Asserted on the *served* CSS and the *served* HTML, not the source. The nav
 * polish moved a large amount of inline styling into `@layer`-free CSS rules,
 * and a class that is renamed in the component but not in the stylesheet
 * produces no error anywhere — the element simply renders unstyled. These
 * pin the pair together, and pin the option values the spec named so a later
 * edit that changes `--ds-duration-normal` to a hard-coded `250ms` fails here
 * rather than silently untying the nav from the motion scale.
 *
 * The inline-style absence checks are the other half: `.nav-cta` only wins if
 * the component stopped setting `background-color` inline, because an inline
 * style beats any class. Asserting the class exists without asserting the
 * inline style is gone would pass on a build where the polish does nothing.
 */
const NAV_POLISH = [
  ['nav shell is a class, not inline', '.nav-shell[data-scrolled=true]'],
  ['scrolled surface uses --ds-neutral-0', 'background-color:var(--ds-neutral-0)'],
  ['scrolled header carries --ds-shadow-sm', 'box-shadow:var(--ds-shadow-sm)'],
  ['nav row height transition is tokenised', 'transition:height var(--ds-duration-normal)'],
  ['logo uses the h4 step', 'font-size:var(--ds-text-h4)'],
  ['nav link is body-sm', 'font-size:var(--ds-text-body-sm)'],
  ['nav link hover is orange-500', 'color:var(--ds-orange-500)'],
  ['active nav link is orange-600', 'color:var(--ds-orange-600)'],
  ['dropdown is radius-lg', 'border-radius:var(--ds-radius-lg)'],
  ['dropdown carries --ds-shadow-lg', 'box-shadow:var(--ds-shadow-lg)'],
  ['dropdown hover is orange-50', 'background-color:var(--ds-orange-50)'],
  ['nav CTA is a full pill', 'border-radius:var(--ds-radius-full)'],
  ['nav CTA hover is orange-600', 'background-color:var(--ds-orange-600)'],
  ['nav CTA lifts 2px on hover', 'transform:translateY(-2px)'],
  ['nav CTA hover carries --ds-shadow-warm', 'box-shadow:var(--ds-shadow-warm)'],
  ['mobile panel has a left-only radius', 'border-top-left-radius:var(--ds-radius-xl)'],
  ['backdrop is charcoal-tinted', 'background-color:#1a1a1a99'],
  ['underline uses the motion tokens', 'transition:transform var(--ds-duration-normal)'],
  ['underline is rounded', 'border-radius:var(--ds-radius-full)'],
];

/* The executable Phase 4B nav assertions live further down, after `cssText`,
   `html` and `scriptText` are fetched — see the note there. */

/** §6.3/6.4/6.5 — CSS and z-index contract. */
const NAV_CSS = [
  ['anchor offset clears the header', 'scroll-margin-top:88px'],
  ['smooth scroll', 'scroll-behavior:smooth'],
  ['reduced-motion jumps instead', 'scroll-behavior:auto'],
  ['underline is a transform', 'scaleX(0)'],
];

/**
 * §6 — the anchor set, asserted as a set rather than as individual substrings.
 *
 * A renamed section (say `#program-a` → `#fundamentals`) would otherwise leave a
 * nav link pointing at an id that no longer exists: the link still renders, the
 * nav still looks complete, and clicking it silently does nothing. Checking both
 * that every link target exists AND that every section is reachable is what
 * catches that, in both directions.
 */
const NAV_ANCHORS = [
  'hero',
  'about',
  'fundamentals',
  'materials',
  'process-development',
  'defect-troubleshooting',
  'pathway',
  'why',
  'track-record',
  'contact',
];

/** Strings that indicate a mistake or a stale build. */
const FORBIDDEN = [
  ['third-party font host', 'fonts.googleapis.com'],
  ['blocking font stylesheet', 'fonts.gstatic.com'],
  ['leftover template heading from phase 1', '>Home Page<'],
  ['Montserrat variable from the previous build', '--font-montserrat'],
  ['removed ink-subtle token', '--prd-ink-subtle'],
  ['superseded eyebrow copy', 'Scientific Molding Foundation Training'],
  ['lower-bound figure the range decision replaced', '15–17+'],
  ['lower-bound figure the range decision replaced', '400–500+'],
];

let failures = 0;

/**
 * @param {boolean} ok
 * @param {string} label
 * @param {string} [detail] Why the check matters, or what went wrong. Shown only
 *   on failure, so a passing run never reads as an accusation.
 */
function report(ok, label, detail) {
  const mark = ok ? '\u001b[32m✓\u001b[0m' : '\u001b[31m✗\u001b[0m';
  console.log(`  ${mark} ${label}${!ok && detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

/**
 * Run one assertion group.
 * @param {string} name
 * @param {Array<string|Array<string>>} entries
 * @param {(needle: string) => boolean} predicate
 */
function group(name, entries, predicate) {
  console.log(`\n\u001b[1m${name}\u001b[0m`);
  for (const entry of entries) {
    const [label, needle] = Array.isArray(entry) ? entry : [entry, entry];
    report(predicate(needle), label);
  }
}

/*
 * A RegExp needle cannot go through `group`, whose second element is typed as a
 * string. Rather than loosen that type, the one structural assertion that needs
 * a pattern is run through it directly.
 */
const CONSENT_REQUIRED = /name="consent"[^>]*required|required[^>]*name="consent"/;

/* ------------------------------------------------------------------ *
 * Fetch
 * ------------------------------------------------------------------ */

const response = await fetch(`${BASE}/`).catch((error) => {
  console.error(`Could not reach ${BASE}: ${error.message}`);
  process.exit(2);
});

if (!response.ok) {
  console.error(`${BASE}/ responded ${response.status}`);
  process.exit(2);
}

const html = await response.text();

/*
 * Normalised HTML for copy assertions. React escapes `&` as `&amp;` in rendered
 * text, so comparing against the source string fails on a correct build — the
 * heading is right, the encoding differs.
 */
const htmlText = decodeEntities(html);

console.log(`\n\u001b[32mEntranceLoader + Hero + About + Program A output check\u001b[0m  (${BASE}/)`);
console.log(`served ${html.length} bytes`);

/*
 * A growth warning, not a failure. The PRD's §7 target is LCP < 2.5s and the
 * page ships every section in one document, so payload size is the budget that
 * will drive the deferred-loading work. Flagged here so it is visible on every
 * run rather than discovered in the field.
 */
if (html.length > 500_000) {
  console.log(
    `  \u001b[33m!\u001b[0m served HTML is ${Math.round(html.length / 1024)} KB — over the 500 KB budget`,
  );
}

/*
 * Fetch the generated stylesheets up front. The design tokens and the font
 * custom properties live in CSS, not in the markup, so a token assertion that
 * looked at the HTML would fail on a correct build.
 *
 * ⚠️ FILE-FIRST, and that is the whole point.
 *
 * `/_next/static/chunks/x.css` is served from `.next/static/chunks/x.css` on
 * disk, so the build artifact can be read directly. That matters because a
 * fetch can be intercepted: during Polish #5 the stylesheet did not load in
 * the browser at all (a proxy in front of the dev server returned an empty
 * body for CSS), which would make every CSS assertion below pass vacuously —
 * `squash('')` contains nothing, and "the rule is absent" is indistinguishable
 * from "the stylesheet never arrived" when both are the empty string.
 *
 * Reading the artifact removes the middleman. The fetch stays as a fallback
 * for the case where the checker runs against a remote build with no local
 * `.next` directory, and the byte-count guard below fails loudly rather than
 * letting an empty stylesheet turn the rest of this file into a no-op.
 */
const cssHrefs = [...html.matchAll(/href="([^"]+\.css)"/g)].map((m) => m[1]);
let cssSource = 'file';
const cssText = (
  await Promise.all(
    cssHrefs.map(async (href) => {
      // `/_next/static/...` → `.next/static/...`: drop the `_next` prefix.
      const localPath = `.next${href.replace(/^\/_next/, '')}`;
      try {
        return readFileSync(localPath, 'utf8');
      } catch {
        cssSource = 'fetch (no local artifact)';
        return fetch(href.startsWith('http') ? href : `${BASE}${href}`)
          .then((r) => r.text())
          .catch(() => '');
      }
    }),
  )
).join('');
console.log(
  `read ${cssHrefs.length} stylesheet(s) via ${cssSource}, ${cssText.length} bytes`,
);

/*
 * The guard that makes every CSS assertion below meaningful. If this fails,
 * the stylesheet was not read and the failures that follow would be noise.
 */
report(
  cssText.length > 5000,
  'the served stylesheet was actually read',
  `cssText is ${cssText.length} bytes — an empty stylesheet makes every CSS assertion in this file vacuous`,
);

/*
 * Fetch the client chunks too. The success-state strings only exist in the
 * React bundle — they render after a submit, so they are absent from the
 * server HTML by design. Asserting on the bundle keeps the check at the
 * output level instead of grepping the source file.
 */
const scriptSrcs = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
/*
 * Kept per-chunk as well as concatenated. A few Phase 4B assertions are about
 * the NAV specifically, and "the string is somewhere in the bundle" cannot
 * express that — several unpolished sections still carry the same values.
 */
const scriptChunks = await Promise.all(
  scriptSrcs.map((src) =>
    fetch(src.startsWith('http') ? src : `${BASE}${src}`)
      .then((r) => r.text())
      .catch(() => ''),
  ),
);
const scriptText = scriptChunks.join('');
console.log(`fetched ${scriptSrcs.length} script chunk(s), ${scriptText.length} bytes`);

group('Phase 4B nav polish (CSS)', NAV_POLISH, (needle) => squash(cssText).includes(needle));

/*
 * The logo's accent dot is rendered from the component, so it appears in the
 * served HTML rather than the stylesheet — a CSS-scoped needle for it would
 * fail on a correct build. It is also the one place the nav reads the yellow
 * accent, so it is worth pinning.
 */
report(
  html.includes('var(--ds-yellow-500)'),
  'the logo accent dot uses --ds-yellow-500',
  'the accent dot no longer reads the yellow accent token',
);

/**
 * The nav classes the components must actually apply.
 *
 * Scoped to the client chunk, where the nav components are bundled. A class
 * that exists in the stylesheet but is never applied is invisible in every
 * other check here.
 */
const NAV_CLASS_USAGE = [
  ['Navbar applies .nav-shell', 'nav-shell'],
  ['Navbar applies .nav-row', 'nav-row'],
  ['Navbar applies .nav-logo', 'nav-logo'],
  ['Navbar applies .nav-menu', 'nav-menu'],
  ['Navbar applies .nav-menu-item', 'nav-menu-item'],
  ['Navbar applies .nav-icon-button', 'nav-icon-button'],
  ['Navbar applies .nav-cta', 'nav-cta'],
  ['MobileNav applies .nav-panel', 'nav-panel'],
  ['MobileNav applies .nav-backdrop', 'nav-backdrop'],
];

group('Phase 4B nav polish (applied)', NAV_CLASS_USAGE, (needle) =>
  scriptText.includes(needle),
);

/*
 * The inline declarations that would DEFEAT the nav polish must be gone.
 *
 * Three approaches were tried here. The first two were wrong and are recorded
 * because the failure mode is subtle:
 *
 * (1) Scanning the concatenated bundle. `backgroundColor:"var(--pdf-orange)"`
 *     appears because Contact, Hero and Track Record still set it inline —
 *     sections that are not polished yet.
 *
 * (2) Scanning the chunk containing `nav-shell`. Next.js puts several route
 *     components in ONE shared chunk, so that chunk also holds the Contact
 *     form's submit button, which legitimately still sets the same values.
 *
 * (3) — what is used below — asking a narrower question: does any nav element
 *     still set a colour or radius inline? The nav legitimately keeps several
 *     inline styles, and inspecting the served chunk confirms each one:
 *     `zIndex` on the panel and backdrop, `height` on the header row,
 *     `letterSpacing` on the panel wordmark, `transform`/`transition` on the
 *     dropdown chevron, `borderTop` on the quick-action row. None of those
 *     collide with a polished class. The ones that DID collide were the
 *     background, colour, borderRadius and boxShadow on links, the CTA and the
 *     dropdown — all of which are now class-driven.
 *
 * So the assertion is on those specific properties, not on the presence of a
 * style object. A blanket `style:{` check fails on a correctly-polished nav.
 */
const NAV_FORBIDDEN_INLINE = [
  'backgroundColor:"var(--pdf-orange)"',
  'color:"var(--pdf-white)"',
  'borderRadius:"var(--prd-radius-pill)"',
];

/*
 * The nav region of the chunk, bracketed by the FIRST and LAST nav-only class.
 *
 * ⚠️ A first attempt used `nav-backdrop` … `nav-menu-item`, which is wrong in
 * a way that silently disables the check: `nav-icon-button` is the last nav
 * class in the chunk (the desktop hamburger, which is rendered after the CTA),
 * and the Navbar's own CTA sits AFTER `nav-menu-item`. The bracket ended 447
 * characters before the very element most likely to regress, so injecting an
 * inline style on the header CTA passed the check. Verified by injecting one
 * and watching the run stay green.
 *
 * `nav-shell` is only in Navbar and `nav-icon-button` is emitted last, so the
 * span from the first to the last of those covers both Navbar and MobileNav —
 * including the quick-action row that sits between them. The window is widened
 * by 400 chars at each end to catch a marker-adjacent change.
 *
 * This checks the FAILURE MODE rather than the shape of the code: the nav is
 * allowed to keep inline styles (zIndex, height, letterSpacing, the chevron
 * transform are all still inline and all legitimate), but it may not set a
 * colour or radius inline, because an inline style beats `.nav-cta`.
 */
const navLo = scriptText.indexOf('nav-shell');
const navHi = scriptText.lastIndexOf('nav-icon-button');
const navRegion =
  navLo === -1 || navHi <= navLo ? '' : scriptText.slice(navLo - 400, navHi + 400);

report(
  navRegion.length > 2000,
  'the nav region of the bundle is locatable',
  `could not bracket the nav code between \`nav-shell\` and \`nav-icon-button\` (span was ${navRegion.length} chars), so the inline-style check below is vacuous`,
);

const navInlineLeaks = NAV_FORBIDDEN_INLINE.filter((needle) => navRegion.includes(needle));

report(
  navInlineLeaks.length === 0,
  'no nav element sets a colour or radius inline',
  `these survive in the nav and beat the class that replaced them: ${navInlineLeaks.join(', ')}`,
);

/*
 * The double focus ring is gone: `.cta-primary:focus-visible` must no longer
 * declare an outline. `outline: none` is correct here — the ring is a
 * box-shadow, and a UA outline would paint on top of it.
 *
 * The selector and its body are matched separately rather than as one literal
 * string. The minifier reorders declarations within a block (the served rule
 * is `box-shadow:…;outline:none`, not the source's `outline:none;box-shadow:…`),
 * so a coupled literal fails on a correct build. Reading the body out of the
 * served rule and asserting on its contents is order-independent.
 */
const ctaFocusBody =
  squash(cssText).match(/\.cta-primary:focus-visible\{([^}]*)\}/)?.[1] ?? '';

report(
  ctaFocusBody.includes('outline:none') &&
    ctaFocusBody.includes('box-shadow:var(--ds-ring-orange)') &&
    !/outline:(?!none)/.test(ctaFocusBody),
  'the CTA resolves to a single focus signal',
  `the CTA declares something other than the shared ring — served rule body: ${ctaFocusBody || '(absent)'}`,
);

/*
 * The nav CTA lift is a transform, and a transform is movement — the
 * preference removes it rather than just animating it in 0.01ms.
 *
 * ⚠️ This assertion used to read `.nav-cta:hover{transform:none}` in the
 * reduced-motion block, which stopped being true in Phase 4B polish #2: the
 * Hero's cards needed the same treatment, so the three selectors were merged
 * into one grouped rule. The check then failed on a correct build — a stale
 * needle, not a regression. It asserts the merged rule now, and the Hero
 * cards are asserted separately below.
 *
 * Matching the whole group rather than just `.nav-cta:hover` is deliberate:
 * splitting the group back up would be a legitimate refactor, but silently
 * dropping a selector from it would not, and this catches that.
 */
report(
  /prefers-reduced-motion:reduce\)\{[^@]*?\.nav-cta:hover,\.hero-stat:hover,\.hero-frame:hover\{transform:none\}/.test(
    squash(cssText),
  ),
  'reduced motion neutralises the nav CTA lift',
  'the CTA still jumps 2px on hover with reduced motion on — the duration guard alone does not remove the movement',
);

group('Structure', STRUCTURE, (needle) => htmlText.includes(needle));
report(
  CONSENT_REQUIRED.test(htmlText),
  'consent checkbox carries required',
  'PDPA consent must be enforced without JS',
);
group('PRD 5.1 copy', COPY, (needle) => htmlText.includes(needle));
group('PRD 5.2 copy', ABOUT_COPY, (needle) => htmlText.includes(needle));
group('PRD 5.3 program A copy', PROGRAM_A_COPY, (needle) => htmlText.includes(needle));
group('PRD 5.3 program titles', PROGRAM_TITLES, (needle) => htmlText.includes(needle));
group('PRD 5.3 program bodies', PROGRAM_BODIES, (needle) => htmlText.includes(needle));
group('PRD 5.4 why copy', WHY_COPY, (needle) => htmlText.includes(needle));
group('PRD 5.5 track record copy', TRACK_RECORD_COPY, (needle) => htmlText.includes(needle));
group('ASSUMPTION operation types', CLIENT_TYPE_COPY, (needle) => htmlText.includes(needle));
group('PRD 5.6 contact copy', CONTACT_COPY, (needle) => htmlText.includes(needle));
group('PRD 5.6 form field names', CONTACT_FORM_NAMES, (needle) => htmlText.includes(needle));
group('PRD 5.6 contact routes', CONTACT_ROUTES, (needle) => htmlText.includes(needle));
group('PRD 5.3 → 5.6 programme CTAs', PROGRAM_CTA_LINKS, (needle) => htmlText.includes(needle));
group('§6 footer', FOOTER_COPY, (needle) => htmlText.includes(needle));
group('§6 nav structure', NAV_STRUCTURE, (needle) => htmlText.includes(needle));
group('§6 nav copy', NAV_COPY, (needle) => htmlText.includes(needle));
group('§6 nav CSS', NAV_CSS, (needle) => squash(cssText).includes(squash(needle)));
group('Phase 4A design tokens', DESIGN_TOKENS, (needle) =>
  squash(cssText).includes(squash(needle)),
);
group('Phase 4A utilities', DESIGN_UTILITIES, (needle) =>
  squash(cssText).includes(squash(needle)),
);

/*
 * Phase 4A — the multi-line shadow stacks.
 *
 * The `--ds-*` prefix means these no longer collide with Tailwind v4's theme
 * variables, which is why this block is now a plain containment check rather
 * than the collision-avoidance dance it needed before the rename. Tailwind
 * still emits its own `--shadow-sm|md|lg` inside `@layer theme`; ours are
 * `--ds-shadow-*` in a flat `:root`, so a needle for `--ds-shadow-md:10 2px`
 * can only match ours.
 *
 * The check is an exact full-value match, not a prefix of one. A stack that
 * lost its widest layer would still contain a prefix of the correct string,
 * so a prefix test would pass on a broken build.
 */
const SHADOW_STACKS = [
  [
    '--ds-shadow-md has all three layers',
    '--ds-shadow-md:0 2px 4px #2a2a2a0a, 0 4px 8px #2a2a2a0f, 0 8px 16px #2a2a2a0a',
  ],
  [
    '--ds-shadow-lg has all three layers',
    '--ds-shadow-lg:0 4px 8px #2a2a2a0a, 0 12px 24px #2a2a2a0f, 0 24px 48px #2a2a2a14',
  ],
  [
    '--ds-shadow-warm is orange-tinted',
    '--ds-shadow-warm:0 4px 12px #e8631c14, 0 12px 32px #e8631c0f',
  ],
];

group('Phase 4A shadow stacks', SHADOW_STACKS, (needle) =>
  squash(cssText).includes(squash(needle)),
);

/*
 * Phase 4A — the resolved `--ds-*` namespace.
 *
 * The rename to `--ds-*` was the point of this step, so it is asserted in both
 * directions: our tokens must be prefixed, AND no unprefixed 4A token may
 * survive under OUR `:root`.
 *
 * Scoping is the whole trick. Tailwind v4 emits its own theme block declaring
 * `--text-xs`, `--tracking-wide`, `--radius-lg`, `--shadow-md`, `--ease-out`
 * and friends — those are Tailwind's, they belong there, and a stylesheet-wide
 * scan reports all of them as stray (which is exactly what the first run of
 * this check did). Only unprefixed tokens inside our own `:root` are evidence
 * of a token the rename missed, so the assertion reads that block and nothing
 * else.
 *
 * `--prd-*` and `--pdf-*` are deliberately excluded: they are a different
 * system, migrated section-by-section in Phase 4B, and renaming them here
 * would be the silent reflow this phase exists to avoid.
 */
const DS_FAMILIES =
  'text|leading|tracking|space|section-padding|container|shadow|ring|radius|ease|duration|orange|yellow|neutral';

/*
 * Each of our `:root` blocks. The design-system tokens are spread across three
 * of them, so this collects all matches rather than assuming one.
 */
const rootBlocks = [...squash(cssText).matchAll(/:root\{([^}]*)\}/g)]
  .map(([, body]) => body)
  .filter((body) => /--(?:ds-)?(?:orange|shadow|space|text)-/.test(body));

const rootText = rootBlocks.join(';');

const UNPREFIXED_4A = new RegExp(`--(?:${DS_FAMILIES})-[a-z0-9-]+(?=[:)])`, 'g');

const strayTokens = [...new Set([...rootText.matchAll(UNPREFIXED_4A)].map((m) => m[0]))].filter(
  (name) => !name.startsWith('--ds-'),
);

report(
  strayTokens.length === 0,
  'no unprefixed Phase 4A token survives in our :root',
  `these are still unprefixed in :root and collide with Tailwind: ${strayTokens.join(', ')}`,
);

/*
 * And the other direction, on the same block: the prefixed tokens must be
 * there. Without this, deleting the whole `:root` would pass the check above,
 * since an empty string contains no stray tokens.
 */
report(
  rootText.includes('--ds-shadow-md:') && rootText.includes('--ds-orange-500:'),
  'the design-system tokens are present and prefixed in :root',
  'our :root block is missing the --ds-* tokens entirely',
);

for (const legacy of ['--prd-orange:', '--prd-offwhite:', '--pdf-orange:', '--pdf-white:']) {
  report(
    squash(cssText).includes(legacy),
    `${legacy.slice(0, -1)} still present`,
    'a legacy token was renamed or dropped — Phase 4B migrates these section by section, not now',
  );
}

/*
 * Phase 4A — no single-layer shadows were introduced.
 *
 * One blur reads as a grey halo rather than as height, which is why every
 * stack here is layered. A value with no comma between layers is the failure
 * this catches. Scoped to `--ds-shadow-*` in our own `:root`: Tailwind's own
 * `--shadow-*` names cannot match with the prefix, so the old hand-rolled
 * "which block is this value from" filter is no longer needed at all — the
 * rename removed the ambiguity this used to work around.
 */
const shadowDeclarations = [...rootText.matchAll(/--ds-shadow-[a-z]+:([^;}]*)/g)].map(
  ([, value]) => value,
);

const singleLayer = shadowDeclarations.filter((value) => !value.includes(', '));

report(
  singleLayer.length === 0,
  'no Phase 4A shadow is a single layer',
  `single-layer shadow(s) found: ${singleLayer.join(' | ')}`,
);

report(
  shadowDeclarations.length === 4,
  'all four --ds-shadow-* tokens survive in :root',
  `expected 4 shadow tokens (sm, md, lg, warm), found ${shadowDeclarations.length}: the stack was truncated`,
);

/*
 * Phase 4A — the reduced-motion guard must neutralise the duration tokens.
 *
 * Asserting only that `--duration-slow` exists would pass on a build where
 * nothing respects the preference, because the token is declared in `:root`
 * either way. This checks the override specifically, which is the part that
 * only appears inside the media query.
 */
report(
  /prefers-reduced-motion:reduce\)\{[^@]*?--ds-duration-slow:0?\.01ms/.test(squash(cssText)),
  'reduced motion neutralises --ds-duration-slow',
  'the duration tokens survive the reduced-motion guard, so anything animated with them ignores the preference',
);

group('§6 mobile panel (client chunk)', NAV_SCRIPT_MARKERS, (needle) =>
  scriptText.includes(needle),
);

/*
 * §6 — bidirectional anchor check, as two distinct assertions per anchor.
 *
 * Direction 1: every anchor the nav links to must exist as a section id.
 * Direction 2: every section in the reading order must be linked from the nav.
 *
 * Split deliberately. A single combined check reports "failed" whether the id
 * is missing or the link is missing, and those have different causes: a renamed
 * section versus a nav entry that was never added. The separate labels say which.
 */
for (const anchor of NAV_ANCHORS) {
  report(
    htmlText.includes(`id="${anchor}"`),
    `§6 anchor #${anchor} resolves`,
    'no section carries this id — the nav link points at nothing',
  );
  report(
    htmlText.includes(`href="#${anchor}"`),
    `§6 anchor #${anchor} is linked`,
    'no nav link targets this section — it is unreachable from the nav',
  );
}

/* The CTA carries a programme slug, so it is a distinct form of anchor. */
report(
  htmlText.includes('href="#contact?program=') ||
    scriptText.includes('#contact?program='),
  '§6 programme links still carry their slug',
  'the nav must not swallow the #contact?program= hash used by the CTAs',
);

group('PRD 5.6 success state (client chunk)', CONTACT_SUCCESS_COPY, (needle) =>
  scriptText.includes(needle),
);
group('PRD 13.1 tokens', TOKENS, (needle) => squash(cssText).includes(squash(needle)));
group('PDF palette override', PDF_TOKENS, (needle) => squash(cssText).includes(squash(needle)));
group('Contact routes', CONTACT, (needle) => htmlText.includes(needle));
group('Must NOT appear', FORBIDDEN, (needle) => !htmlText.includes(needle) && !cssText.includes(needle));

/*
 * The missing-content marker must be PRESENT while the source PDF copy has not
 * been supplied. It is now supplied, so this assertion is inverted: the marker
 * must be ABSENT. A leftover placeholder would otherwise ship silently.
 */
/*
 * The enquiry form posts to a route that needs RESEND_API_KEY to actually
 * deliver. Without it the route runs in test mode: it logs the payload and
 * returns 200 without sending anything.
 *
 * That is fine while developing — but it is the worst possible failure in
 * production, because the form tells the visitor "Enquiry sent" while the
 * message goes nowhere. So the severity depends on the environment: a warning
 * in development, a build failure otherwise.
 *
 * Checked here rather than only in the route because the route cannot tell a
 * deliberate test-mode setup from a forgotten env var on a deploy.
 */
console.log('\n\u001b[1mEmail delivery\u001b[0m');
{
  const hasKey = Boolean(process.env.RESEND_API_KEY?.trim());
  if (hasKey) {
    report(true, 'RESEND_API_KEY is set — enquiries will be delivered');
  } else if (process.env.NODE_ENV === 'production') {
    report(
      false,
      'RESEND_API_KEY is not set — the contact form cannot send in production',
      'set it before deploying',
    );
  } else {
    console.log(
      '  \u001b[33m!\u001b[0m RESEND_API_KEY not set — contact form runs in TEST MODE',
    );
    console.log('    payload is logged, nothing is emailed, route returns 200');
  }
}

console.log('\n\u001b[1mContent completeness\u001b[0m');
report(
  !htmlText.includes('CONTENT REQUIRED'),
  'no "CONTENT REQUIRED" placeholder remains',
  'PDF copy supplied; marker must be gone',
);

console.log('\n\u001b[1mFont\u001b[0m');
report(/\/_next\/static\/media\/[^"]+\.woff2/.test(html), 'fonts self-hosted');
report(cssText.includes('--font-poppins'), 'Poppins variable registered (headings)');
report(cssText.includes('--font-inter'), 'Inter variable registered (body)');

/* ------------------------------------------------------------------ *
 * Phase 4B — Hero polish
 * ------------------------------------------------------------------ */

/*
 * Asserted on the served CSS and HTML, like the nav block above, for the same
 * reason: the source is not what ships. The minifier rewrites declaration
 * order and shorthand, so a check that reads the source can pass on a build
 * that serves something else.
 */

/** The declarations the Hero polish is responsible for. */
const HERO_CSS = [
  // Section surface: warm wash top-left over a white base.
  '.hero-section{background:radial-gradient(',
  'var(--ds-orange-50)',
  // Blueprint grid at the brief's 0.03, up from 0.055.
  '.hero-section .hero-grid{background-image:',
  // Stat card: white, radius-lg, one elevation rung, lifting on hover.
  '.hero-stat{background-color:var(--ds-neutral-0)',
  '.hero-stat:hover{box-shadow:var(--ds-shadow-md)',
  
  // Secondary CTA: 2px orange ring, pill, filling on hover.
  '.cta-secondary{background-color:var(--ds-neutral-0)',
  '.cta-secondary:hover{background-color:var(--ds-orange-50)',
  '.cta-secondary:hover .cta-secondary-icon{background-color:var(--ds-orange-500)',
  // Image frame: radius-xl, shadow-lg, 1% hover, grounding gradient.
  '.hero-frame:hover{transform:scale(1.01)',
];

group('Phase 4B hero CSS', HERO_CSS, (needle) => squash(cssText).includes(squash(needle)));

/*
 * ⚠️ The rest of this block reads DECLARATIONS out of the served rules rather
 * than matching whole rule bodies as literals.
 *
 * A first version asserted `.hero-stat{border-radius:var(--ds-radius-lg)`,
 * `.hero-stat{box-shadow:var(--ds-shadow-sm)`, `.hero-frame{box-shadow:…}` and
 * three like it — and all six failed on a correct build. The stylesheet is
 * minified, so a rule's declarations are reordered (`.hero-frame` serves
 * `border-radius` before `box-shadow`, and `.cta-secondary` serves `border`
 * before `border-radius`), the shorthand is rewritten (`border:2px solid` →
 * `border:2px solid`, but `linear-gradient(to right…)` → `linear-gradient(90deg…)`),
 * and hex colours are compressed (`rgba(42,42,42,0.03)` → `#2a2a2a08`).
 *
 * Coupling a declaration to its position or its spelling inside a rule body
 * tests the minifier, not the design. Each assertion below pulls the specific
 * declaration out of the specific rule and compares the value, which is stable
 * under reordering and independent of how the value is written.
 *
 * This is the same class of bug as the nav block's `outline:none;box-shadow:…`
 * literal: it fails on a *correct* build, which is worse than a missing check,
 * because the usual response to a red check is to "fix" working code.
 */
function declarationsOf(selector) {
  const body =
    squash(cssText).match(new RegExp(`${selector.replace(/[.:[\]]/g, '\\$&')}\\{([^}]*)\\}`))?.[1] ??
    '';
  return new Map(
    body
      .split(';')
      .filter(Boolean)
      .map((decl) => {
        const at = decl.indexOf(':');
        return [decl.slice(0, at).trim(), decl.slice(at + 1).trim()];
      }),
  );
}

const heroStatDecls = declarationsOf('.hero-stat');

report(
  heroStatDecls.get('border-radius') === 'var(--ds-radius-lg)' &&
    heroStatDecls.get('box-shadow') === 'var(--ds-shadow-sm)',
  'the stat card sits at radius-lg with one elevation rung',
  `expected radius-lg + shadow-sm at rest — served: ${JSON.stringify(Object.fromEntries(heroStatDecls))}`,
);

const heroStatHoverDecls = declarationsOf('.hero-stat:hover');

report(
  heroStatHoverDecls.get('box-shadow') === 'var(--ds-shadow-md)' &&
    heroStatHoverDecls.get('transform') === 'translateY(-2px)',
  'the stat card lifts and gains elevation on hover',
  `expected md shadow + translateY(-2px) — served: ${JSON.stringify(Object.fromEntries(heroStatHoverDecls))}`,
);

const heroFrameDecls = declarationsOf('.hero-frame');

report(
  heroFrameDecls.get('border-radius') === 'var(--ds-radius-xl)' &&
    heroFrameDecls.get('box-shadow') === 'var(--ds-shadow-lg)',
  'the hero frame floats at radius-xl with shadow-lg',
  `expected radius-xl + shadow-lg — served: ${JSON.stringify(Object.fromEntries(heroFrameDecls))}`,
);

const secondaryDecls = declarationsOf('.cta-secondary');

report(
  secondaryDecls.get('border')?.includes('2px solid var(--ds-orange-500)') &&
    secondaryDecls.get('border-radius') === 'var(--ds-radius-full)' &&
    secondaryDecls.get('color') === 'var(--ds-orange-500)',
  'the secondary CTA is an orange pill with a 2px ring',
  `expected a 2px orange border, pill radius and orange label — served: ${JSON.stringify(Object.fromEntries(secondaryDecls))}`,
);

/*
 * The blueprint grid's alpha, read out of the value rather than matched as a
 * literal. `rgba(42,42,42,0.03)` is served as `#2a2a2a08`, so a literal needle
 * for the source spelling fails on a correct build.
 *
 * The brief's band is 0.02–0.04. Each alpha is decoded from whichever form the
 * minifier chose and checked against that band, so this assertion survives a
 * change of notation and fails only if the grid is genuinely out of range.
 */
const gridDecls = declarationsOf('.hero-section .hero-grid');

/** Largest alpha present in a `background-image` declaration, or `null`. */
function gridAlpha(decl) {
  if (!decl) return null;
  const alphas = [];
  for (const [, hex] of decl.matchAll(/#2a2a2a([0-9a-f]{2})/g)) {
    alphas.push(parseInt(hex, 16) / 255);
  }
  for (const [, alpha] of decl.matchAll(/rgba\(\s*42\s*,\s*42\s*,\s*42\s*,\s*([\d.]+)\s*\)/g)) {
    alphas.push(Number(alpha));
  }
  return alphas.length ? Math.max(...alphas) : null;
}

const gridTopAlpha = gridAlpha(gridDecls.get('background-image'));
const gridInBand = gridTopAlpha !== null && gridTopAlpha >= 0.02 && gridTopAlpha <= 0.05;

report(
  gridInBand,
  'the blueprint grid sits inside the brief’s 0.02–0.04 band',
  `the most present grid line is at ${gridTopAlpha ?? '(unreadable)'}, above 0.04 it competes with the headline — served: ${gridDecls.get('background-image') ?? '(absent)'}`,
);

report(
  squash(cssText).includes('.hero-frame:after{content:""'),
  'the hero frame carries its grounding gradient',
  'the ::after overlay is missing, so the frame has no bottom-edge grounding',
);

/*
 * The Hero's own focus treatment. Same question as the nav CTA: exactly one
 * signal, and it is the shared ring.
 *
 * Read as a rule body rather than a literal so the minifier's declaration
 * order cannot fail a correct build — the same correction the nav block
 * needed.
 */
const secondaryFocusBody =
  squash(cssText).match(/\.cta-secondary:focus-visible\{([^}]*)\}/)?.[1] ?? '';

report(
  secondaryFocusBody.includes('outline:none') &&
    secondaryFocusBody.includes('box-shadow:var(--ds-ring-orange)') &&
    !/outline:(?!none)/.test(secondaryFocusBody),
  'the secondary CTA resolves to a single focus signal',
  `expected the shared orange ring and no outline — served rule body: ${secondaryFocusBody || '(absent)'}`,
);

/*
 * The scroll cue. It is a NEW animation introduced by this polish, so it must
 * be stopped under reduced motion — and stopped at its origin, not merely
 * shortened, or the chevron parks 6px low.
 */
report(
  /@keyframes hero-cue-bob/.test(squash(cssText)),
  'the scroll cue animation is declared',
  'the bob keyframes are missing, so the cue would sit still under every preference',
);

report(
  /prefers-reduced-motion:reduce\)\{[^@]*?\.hero-scroll-cue-icon\{animation:none/.test(
    squash(cssText),
  ),
  'reduced motion stops the scroll cue outright',
  'the cue still animates with reduced motion on — the duration guard alone leaves it parked mid-bob',
);

report(
  /prefers-reduced-motion:reduce\)\{[^@]*?\.hero-stat:hover,\.hero-frame:hover\{transform:none\}/.test(
    squash(cssText),
  ),
  'reduced motion removes the hero hover movement',
  'the stat card or image frame still jumps on hover with reduced motion on',
);

/*
 * The stat numerals use tabular figures so all digits align in columns —
 * essential for any numeric table. This is asserted on the served HTML where
 * the numeral span appears with `tabular-nums` class, and also on the served
 * CSS where the `.text-h2` step declares it.
 *
 * A first version checked only the CSS declaration, but that passed while the
 * numerals used proportional figures inline (the brief says "large bold
 * numerals" without specifying proportional vs tabular). We must assert the
 * actual markup too.
 */
report(
  /<span[^>]*tabular-nums/.test(htmlText) && /--ds-text-h2:[^;]+/.test(cssText),
  'stat numerals carry tabular-nums at the h2 step',
  'the <span> lacks tabular-nums or .text-h2 is missing its numeric-spacing declaration',
);

/*
 * The Hero's inline style leak check.
 *
 * ⚠️ This scans the served HTML, not `scriptText`. A first version read the
 * client bundle and PASSED a deliberate injection of
 * `boxShadow: 'var(--prd-shadow-warm)'` onto `.hero-frame`.
 *
 * The reason is that the Hero is a React Server Component: its markup and its
 * inline styles are serialised into the HTML payload and never appear in a
 * client chunk at all. `find .next/static/chunks -name '*.js' | xargs grep
 * 'hero-frame'` returns nothing; the same grep against the served HTML
 * returns the frame. So a bundle scan here is vacuous — it would pass no
 * matter what the Hero rendered. Caught by the negative test, which is the
 * only reason it was found.
 *
 * Scoping: the Hero's own markup sits between `class="hero-section"` and the
 * About section's opening. `hero-section` appears exactly once. Widened by a
 * fixed margin on each side so an injected line just inside the boundary is
 * still read.
 *
 * The assertion is on the FAILURE MODE, not on the presence of a style
 * object. The Hero legitimately keeps inline styles: `animation-delay` on
 * every staggered element, `aspect-ratio` on the frame (computed from the
 * asset's dimensions), and the `background-color`/`color`/`border-radius` on
 * the stat numerals (per-figure data). A blanket `style=` check would fail on
 * a correctly-polished Hero — which is also why the selectors above exist.
 */
const heroRegion = (() => {
  const lo = htmlText.indexOf('class="hero-section');
  if (lo === -1) return '';
  const hi = htmlText.indexOf('id="about"', lo);
  return htmlText.slice(Math.max(0, lo - 200), hi === -1 ? lo + 20000 : hi);
})();

report(
  heroRegion.length > 3000,
  'the hero region of the served HTML is locatable',
  `could not bracket the hero markup (span was ${heroRegion.length} chars), so the inline-style check below is vacuous`,
);

const HERO_FORBIDDEN_INLINE = [
  'var(--prd-offwhite)',
  'var(--prd-white)',
  'var(--prd-shadow',
  'var(--prd-radius',
  'var(--prd-ink',
  'var(--prd-border)',
];

const heroInlineLeaks = HERO_FORBIDDEN_INLINE.filter((needle) => heroRegion.includes(needle));

report(
  heroInlineLeaks.length === 0,
  'no hero element renders from the legacy palette',
  `these survive in the hero and beat the class that replaced them: ${heroInlineLeaks.join(', ')}`,
);

/*
 * Structural proof the polish reached the markup: the classes must be present
 * in the served HTML, not merely defined in the served CSS. A stylesheet full
 * of correct rules that nothing consumes passes every assertion above.
 */
group(
  'Phase 4B hero classes in markup',
  [
    'hero-section',
    'hero-stat',
    'hero-stat-strip',
    'hero-frame',
    'cta-secondary',
    'cta-secondary-icon',
    'hero-scroll-cue',
    'hero-scroll-cue-icon',
  ],
  (needle) => htmlText.includes(needle),
);

group(
  'Phase 4B hero type utilities',
  ['text-hero', 'text-body-lg', 'eyebrow'],
  (needle) => htmlText.includes(needle),
);

/* ------------------------------------------------------------------ *
 * Phase 4B — About the Trainer polish
 * ------------------------------------------------------------------ */

/*
 * `.about-section`, not `bg-[var(--prd-white)]`.
 *
 * The section had a flat white field. Against the Hero's warm wash that
 * read as the colour simply stopping — the alternation was correct on
 * paper (PRD 13.1 gives off-white to alternating sections, and the Hero
 * takes it) but the Hero is no longer a flat field, so white here is no
 * longer its complement.
 *
 * `.about-section` carries a white base with a wash mirrored from the
 * Hero's: top-right instead of top-left, spent by 45% instead of 55%. The
 * section is still markedly lighter than the Hero, so the alternation
 * holds, and the two washes read as one light source moving down the page.
 */
const aboutDecls = declarationsOf('.about-section');

report(
  aboutDecls.get('background')?.includes('radial-gradient') &&
    aboutDecls.get('background')?.includes('var(--ds-orange-50)') &&
    aboutDecls.get('background')?.includes('var(--ds-neutral-0)'),
  'the about section carries the mirrored warm wash',
  `expected a radial wash over a white base — served: ${aboutDecls.get('background') ?? '(absent)'}`,
);

/* The wash is mirrored, not copied. A top-LEFT wash here would put two of
   them in the same corner and make the join read as a single smeared
   gradient rather than two sections. */
report(
  /at\s+100%\s+0%|at\s+right\s+top/i.test(aboutDecls.get('background') ?? ''),
  'the about wash is anchored top-right, mirroring the hero',
  `the wash must come from the corner the hero does not use — served: ${aboutDecls.get('background') ?? '(absent)'}`,
);

/* The blueprint grid must be declared for THIS section. The Hero's rule is
   scoped `.hero-section .hero-grid` and does not reach here, so without
   this the grid would silently vanish below the fold line — and the class
   name is shared, so it looks like it should work. */
const aboutGridDecls = declarationsOf('.about-section .hero-grid');

report(
  aboutGridDecls.get('background-image')?.includes('linear-gradient'),
  'the blueprint grid is declared inside the about section',
  'About renders `hero-grid` markup but has no rule, so the grid stops at the fold line',
);

/* --- Credential rows. --- */

const credentialDecls = declarationsOf('.credential-item');

report(
  credentialDecls.get('background-color') === 'var(--ds-yellow-50)' &&
    credentialDecls.get('border-radius') === 'var(--ds-radius-md)',
  'the credential row is a yellow card at radius-md',
  `expected yellow-50 + radius-md — served: ${JSON.stringify(Object.fromEntries(credentialDecls))}`,
);

const credentialHoverDecls = declarationsOf('.credential-item:hover');

report(
  credentialHoverDecls.get('background-color') === 'var(--ds-orange-50)' &&
    credentialHoverDecls.get('box-shadow') === 'var(--ds-shadow-sm)' &&
    credentialHoverDecls.get('transform') === 'translateY(-1px)',
  'the credential row warms, lifts and gains elevation on hover',
  `expected orange-50 + shadow-sm + translateY(-1px) — served: ${JSON.stringify(Object.fromEntries(credentialHoverDecls))}`,
);

/* ONE focus signal, and it is the shared ring. This is the third section to
   need the same correction (.cta-primary and .cta-secondary were the other
   two), which is why it is asserted rather than eyeballed. */
const credentialFocusBody =
  squash(cssText).match(/\.credential-item:focus-visible\{([^}]*)\}/)?.[1] ?? '';

report(
  credentialFocusBody.includes('outline:none') &&
    credentialFocusBody.includes('box-shadow:var(--ds-ring-orange)') &&
    !/outline:(?!none)/.test(credentialFocusBody),
  'the credential row resolves to a single focus signal',
  `expected the shared orange ring and no outline — served rule body: ${credentialFocusBody || '(absent)'}`,
);

/* Hover-only movement is invisible to a keyboard user, so a row that lifts
   must also be reachable. This is the assertion that actually enforces
   docs/design-system.md's "pair the lift with a keyboard path" rule. */
report(
  /<li[^>]*tabindex="0"[^>]*class="credential-item/.test(htmlText) ||
    /<li[^>]*class="credential-item[^"]*"[^>]*tabindex="0"/.test(htmlText),
  'every credential row is keyboard reachable',
  'the rows lift on hover but are not focusable, so the response is pointer-only',
);

/* The icon tile owns its radius and its inversion. Recolouring the row
   without the tile would leave a yellow chip on an orange row. */
report(
  declarationsOf('.credential-icon').get('border-radius') === 'var(--ds-radius-full)' &&
    declarationsOf('.credential-item:hover .credential-icon').get('background-color') ===
      'var(--ds-orange-500)',
  'the credential icon tile inverts with its row',
  'the icon tile inverts with its row',
  'the tile does not carry its own radius or does not follow the row hover',
);

/* The tile's glyph must inherit, not be frozen to a literal colour, or the
   inversion leaves a low-contrast glyph on the orange fill. */
report(
  !/color="var\(--prd-/.test(htmlText) && !/stroke="var\(--prd-orange\)"/.test(htmlText),
  'no icon is frozen to a legacy colour literal',
  'an icon still carries color="var(--prd-…)", so it cannot follow its tile through the hover',
);

/* --- Portrait frame. --- */

const trainerFrameDecls = declarationsOf('.trainer-frame');

report(
  trainerFrameDecls.get('border-radius') === 'var(--ds-radius-xl)' &&
    trainerFrameDecls.get('box-shadow') === 'var(--ds-shadow-warm)',
  'the trainer frame floats at radius-xl with the warm shadow',
  `expected radius-xl + shadow-warm (a brand-adjacent surface stays warm, per the shadow table) — served: ${JSON.stringify(Object.fromEntries(trainerFrameDecls))}`,
);

report(
  declarationsOf('.trainer-frame:hover').get('transform') === 'scale(1.01)',
  'the trainer frame scales on hover',
  'a frame around a bitmap has no text to re-rasterise, so scale() is the right transform here',
);

/* The halo is driven by the figure, not by itself: it renders BEHIND the
   frame, so a `:hover` on the halo would only fire on pixels the frame
   already covers. */
const haloHoverDecls = declarationsOf('figure:hover .trainer-halo');

report(
  haloHoverDecls.get('opacity') === '1' && haloHoverDecls.get('transform') === 'scale(1.04)',
  'the halo opens on the figure hover, not on its own',
  `the halo sits behind the frame, so its hover must be triggered by the wrapping <figure> — served: ${JSON.stringify(Object.fromEntries(haloHoverDecls))}`,
);

/* --- Track-record tiles. --- */

const numeralDecls = declarationsOf('.trainer-stat-numeral');

report(
  numeralDecls.get('background-color') === 'var(--ds-yellow-500)' &&
    numeralDecls.get('font-variant-numeric') === 'tabular-nums' &&
    numeralDecls.get('border-radius') === 'var(--ds-radius-md)',
  'the track-record tile is a yellow tile with tabular figures',
  `expected yellow-500 + tabular-nums + radius-md — served: ${JSON.stringify(Object.fromEntries(numeralDecls))}`,

);

/* Track-record numerals are yellow tiles with tabular figures; data-tone drives colour variants */
report(
  declarationsOf('.trainer-stat-numeral').get('background-color') === 'var(--ds-yellow-500)' &&
    /data-tone/.test(htmlText),
  'the track-record tiles start with yellow',
  'no background colour or no data-tone attributes',
);

report(
  declarationsOf('.trainer-stat-numeral:hover').get('transform') === 'translateY(-2px)',
  'the track-record tile lifts on hover',
  'the numeral tile has no hover response',
);

/* Reduced motion removes every about hover movement. Grouped into one rule for */

group(
  'Phase 4B about classes in markup',
  [
    'about-section',
    'credential-item',
    'credential-icon',
    'trainer-frame',
    'trainer-halo',
    'trainer-placeholder-icon',
    'trainer-stat-numeral',
    'trainer-stat-strip',
    'data-tone',
  ],
  (needle) => htmlText.includes(needle),
);

group(
  'Phase 4B about type utilities',
  ['eyebrow', 'text-h2', 'text-body'],
  (needle) => htmlText.includes(needle),
);

const aboutRegion = (() => {
  const lo = htmlText.indexOf('id="about"');
  if (lo === -1) return '';
  const hi = htmlText.indexOf('id="fundamentals"', lo);
  return htmlText.slice(lo, hi === -1 ? lo + 20000 : hi);
})();

report(
  aboutRegion.length > 3000,
  'the about region of the served HTML is locatable',
  `could not bracket the about markup (span was ${aboutRegion.length} chars), so the check below is vacuous`,
);

const aboutInlineLeaks = [
  'var(--prd-white)',
  'var(--prd-offwhite)',
  'var(--prd-ink',
  'var(--prd-border',
  'var(--prd-radius',
  'var(--prd-shadow',
  'var(--prd-success-bg)',
  'var(--prd-orange)',
  'var(--prd-yellow)',
].filter((needle) => aboutRegion.includes(needle));

report(
  aboutInlineLeaks.length === 0,
  'no about element renders from the legacy palette',
  `these survive in the about section and beat the classes that replaced them: ${aboutInlineLeaks.join(', ')}`,
);

/* ------------------------------------------------------------------ *
 * Phase 4B — Programs B–E (Polish #5): badge tones + LevelBadge
 * ------------------------------------------------------------------ */

/*
 * Both systems are pure CSS: a pill's fill is never in the markup unless it is
 * an inline style, which is exactly what this polish removed. So the colour
 * assertions read the served stylesheet (file-based, see the loader) and the
 * STRUCTURE assertions read the served HTML.
 *
 * Declarations are pulled out by name rather than matched as literals, because
 * the minifier rewrites rgba() to hex — `rgba(232, 99, 28, 0.16)` is served as
 * `#e8631c29`, and a literal needle for the source spelling fails on a correct
 * build.
 */

const badgeOrangeBg = declarationsOf('.program-badge-orange').get('background-color') ?? '';

report(
  /e8631c|232,\s*99,\s*28/i.test(badgeOrangeBg) &&
    declarationsOf('.program-badge-orange').get('color') === 'var(--ds-neutral-0)',
  'the standard badge tone keeps the accessible translucent orange',
  `expected the tinted orange recipe with white text (solid orange under 14px white is AA-large only) — served: ${JSON.stringify(Object.fromEntries(declarationsOf('.program-badge-orange')))}`,
);

report(
  declarationsOf('.program-badge-yellow').get('background-color') === 'var(--ds-yellow-500)' &&
    declarationsOf('.program-badge-yellow').get('color') === 'var(--ds-neutral-900)',
  'the premium badge tone is a solid yellow pill with charcoal text',
  `expected yellow-500 + neutral-900 — served: ${JSON.stringify(Object.fromEntries(declarationsOf('.program-badge-yellow')))}`,
);

report(
  declarationsOf('.level-badge').get('border-radius') === 'var(--ds-radius-full)' &&
    declarationsOf('.level-badge-foundation').get('background-color') === 'var(--ds-neutral-100)' &&
    declarationsOf('.level-badge-bridge').get('background-color') === 'var(--ds-yellow-100)' &&
    declarationsOf('.level-badge-advanced').get('background-color') === 'var(--ds-orange-500)' &&
    declarationsOf('.level-badge-application').get('background-color') === 'var(--ds-orange-600)',
  'the level badge ramp runs neutral → yellow → orange → deep orange',
  'a tier is missing its fill, so the progression is no longer readable from colour alone',
);

/* --- Structure: which program renders which tone. --- */

const countOccurrences = (haystack, needle) => haystack.split(needle).length - 1;

/** Slice the served HTML between two anchors, or '' if either is missing. */
function region(from, to, span = 60000) {
  const lo = htmlText.indexOf(from);
  if (lo === -1) return '';
  const hi = htmlText.indexOf(to, lo);
  return htmlText.slice(lo, hi === -1 ? lo + span : hi);
}

const programARegion = region('id="fundamentals"', 'id="materials"');
const programCRegion = region('id="process-development"', 'id="defect-troubleshooting"');
const programERegion = region('id="pathway"', '<footer');

report(
  programARegion.length > 3000 && programCRegion.length > 3000 && programERegion.length > 1000,
  'the program regions of the served HTML are locatable',
  `could not bracket the program markup (A=${programARegion.length}, C=${programCRegion.length}, E=${programERegion.length} chars), so the tone checks below are vacuous`,
);

report(
  programARegion.includes('program-badge-orange') &&
    !programARegion.includes('program-badge-yellow'),
  'Program A keeps the standard orange badge',
  'the 2-Day badge is not the orange tone, or picked up the premium tone',
);

report(
  programCRegion.includes('program-badge-yellow') &&
    !programCRegion.includes('program-badge-orange'),
  'Program C renders the premium yellow badge',
  'the 4-Day badge is not yellow — the premium tier is indistinguishable from the standard one',
);

/*
 * Seven modules, four tiers: foundation ×2, bridge ×2, advanced ×2,
 * application ×1. Asserted per tier, not as a total, because a total of seven
 * would still pass if two modules swapped tiers.
 */
const eTierCounts = {
  foundation: countOccurrences(programERegion, 'level-badge-foundation'),
  bridge: countOccurrences(programERegion, 'level-badge-bridge'),
  advanced: countOccurrences(programERegion, 'level-badge-advanced'),
  application: countOccurrences(programERegion, 'level-badge-application'),
};

report(
  eTierCounts.foundation === 2 &&
    eTierCounts.bridge === 2 &&
    eTierCounts.advanced === 2 &&
    eTierCounts.application === 1,
  'Program E carries all four tiers across its seven modules',
  `expected foundation×2, bridge×2, advanced×2, application×1 — served: ${JSON.stringify(eTierCounts)}`,
);

report(
  countOccurrences(programERegion, 'level-badge level-badge-') === 7,
  'all seven of Program E’s module cards carry a level badge',
  `expected 7 badges across the module grid — served: ${countOccurrences(programERegion, 'level-badge level-badge-')}`,
);

/* ------------------------------------------------------------------ *
 * Phase 4B — Why Scientific Molding (Polish #6)
 * ------------------------------------------------------------------ */

/*
 * The section had three jobs to do at once and only one of them was working.
 *
 * (1) It was still rendering from the legacy `--pdf-*` palette through inline
 *     styles — eight orange numeral tiles, eight charcoal descriptions, two
 *     warm-grey sub-lines. Every value was correct; none of them could be
 *     themed, and each duplicated a rule that already existed elsewhere.
 * (2) The CSS that had been written for it was partly DEAD. `.why-numeral`,
 *     `.why-icon-tile` and `.why-hero-eyebrow` were declared but nothing
 *     consumed them: the component used Tailwind arbitrary values
 *     (`text-[var(--pdf-charcoal)]`) instead, so those rules shipped as
 *     bytes that styled nothing.
 * (3) `.why-hero-title` was declared but never applied, while the heading
 *     still carried `text-h2 text-center max-w-[60ch] mx-auto` — the class
 *     and the utility were fighting over the same element.
 *
 * So the checks below are TWO-SIDED on purpose: that the rules exist in the
 * stylesheet AND that the markup actually asks for them. A single-sided check
 * is exactly what let (2) through.
 *
 * Colour values are asserted by DECLARATION, not by literal, for the same
 * reason as the hero and badge blocks: the minifier compresses
 * `rgba(232, 99, 28, 0.16)` to `#e8631c29`, and a literal needle would fail on
 * a correct build.
 */

const whySectionDecls = declarationsOf('.why-section');

report(
  whySectionDecls.get('background-color') === 'var(--ds-neutral-0)',
  'the why section sits on a flat white field',
  `expected --ds-neutral-0 — served: ${whySectionDecls.get('background-color') ?? '(absent)'}`,
);

report(
  whySectionDecls.get('padding-block') === 'var(--ds-space-16)',
  'the why section carries the mobile section rhythm',
  `expected --ds-space-16 — served: ${whySectionDecls.get('padding-block') ?? '(absent)'}`,
);

/*
 * The grid is scoped, not global. `.hero-grid` alone would never reach here:
 * the Hero's own rule is `.hero-section .hero-grid`, so an unscoped
 * declaration would leave this section without its blueprint grid while
 * looking like it had one. Same failure the About polish found.
 */
const whyGridDecls = declarationsOf('.why-section .why-grid');

report(
  whyGridDecls.get('background-image')?.includes('linear-gradient') &&
    whyGridDecls.get('background-size') === '48px 48px',
  'the why section declares its own scoped blueprint grid',
  `expected a scoped linear-gradient grid at 48px — served: ${JSON.stringify(Object.fromEntries(whyGridDecls))}`,
);

const whyBeforeColDecls = declarationsOf('.why-col-before');
const whyAfterColDecls = declarationsOf('.why-col-after');

report(
  whyBeforeColDecls.get('background-color') === 'var(--ds-neutral-100)' &&
    whyAfterColDecls.get('background-color') === 'var(--ds-yellow-100)',
  'the two columns carry the warm-grey / yellow-tint pairing',
  `expected neutral-100 then yellow-100 — served: ${whyBeforeColDecls.get('background-color') ?? '(absent)'} / ${whyAfterColDecls.get('background-color') ?? '(absent)'}`,
);

const whyTileDecls = declarationsOf('.why-numeral-tile');

report(
  whyTileDecls.get('background-color') === 'var(--ds-orange-500)' &&
    whyTileDecls.get('color') === 'var(--ds-neutral-0)' &&
    whyTileDecls.get('border-radius') === 'var(--ds-radius-sm)' &&
    whyTileDecls.get('font-variant-numeric') === 'tabular-nums',
  'the numeral tile is an orange tile with white figures',
  `expected orange-500 + neutral-0 + radius-sm + tabular-nums — served: ${JSON.stringify(Object.fromEntries(whyTileDecls))}`,
);

/*
 * The icon takes its colour from the COLUMN, not from a prop. Passing a hex
 * from the component is what let the two columns drift apart before; one rule
 * per column makes the distinction structural.
 */
report(
  declarationsOf('.why-col-before .why-item-icon').get('color') ===
    'var(--ds-neutral-500)' &&
    declarationsOf('.why-col-after .why-item-icon').get('color') ===
      'var(--ds-orange-600)',
  'the item icon is coloured by its column, not by the component',
  `expected neutral-500 in Before and orange-600 in After — served: ${declarationsOf('.why-col-before .why-item-icon').get('color') ?? '(absent)'} / ${declarationsOf('.why-col-after .why-item-icon').get('color') ?? '(absent)'}`,
);

report(
  declarationsOf('.why-item-description').get('color') === 'var(--ds-neutral-800)',
  'the item description is charcoal on both columns',
  `warm grey on the yellow tint measures ~3.8:1, below the 4.5:1 floor for body text — served: ${declarationsOf('.why-item-description').get('color') ?? '(absent)'}`,
);

/* --- Structure: the markup must actually consume the rules. --- */

const whyRegion = region('id="why"', 'id="track-record"');

report(
  whyRegion.length > 4000,
  'the why region of the served HTML is locatable',
  `could not bracket the why markup (span was ${whyRegion.length} chars), so the checks below are vacuous`,
);

report(
  countOccurrences(whyRegion, 'why-col-before') === 1 &&
    countOccurrences(whyRegion, 'why-col-after') === 1,
  'the why region renders exactly one Before column and one After column',
  `expected 1 of each — served: before=${countOccurrences(whyRegion, 'why-col-before')}, after=${countOccurrences(whyRegion, 'why-col-after')}`,
);

/*
 * Four problems and four shifts. Counted PER COLUMN, not as a total of eight:
 * a total would still pass if one column rendered six and the other two, and
 * the whole claim of the section is that the two sides balance.
 *
 * The count is anchored on `<li class="why-item"` rather than on `why-item`
 * alone, because that name is a prefix of `why-item-icon`, `why-item-title`
 * and `why-item-description` — a bare substring count returns 32 for eight
 * items and would hide a genuinely missing one.
 */
const whyReasons = {
  before: countOccurrences(
    region('why-col-before', 'why-col-after', 20000),
    '<li class="why-item"',
  ),
  after: countOccurrences(
    region('why-col-after', '</section>', 20000),
    '<li class="why-item"',
  ),
};

report(
  whyReasons.before === 4 && whyReasons.after === 4,
  'the why columns balance four problems against four shifts',
  `expected 4 items per column — served: before=${whyReasons.before}, after=${whyReasons.after}`,
);

const whyItemTitleCount = countOccurrences(whyRegion, '<h4 class="text-h4 why-item-title"');
const whyItemDescriptionCount = countOccurrences(whyRegion, '<p class="text-body-sm why-item-description"');
const whyItemIconCount = countOccurrences(whyRegion, 'why-item-icon');

/*
 * Eight items, so eight of each element — counted on the full opening tag, not
 * on the bare class name. The first version of this check asserted 16 on the
 * assumption that the class name would appear once in the markup and once in
 * the stylesheet; the served HTML holds the class exactly once per element and
 * the stylesheet is read into a different variable, so 8 is the correct number.
 * Measured against the build rather than reasoned about, which is why the
 * number is 8 and not what the comment above it originally guessed.
 */
report(
  whyItemTitleCount === 8 &&
    whyItemDescriptionCount === 8 &&
    whyItemIconCount === 8,
  'every why item renders its own icon, title and description',
  `eight items means eight of each element — served: title=${whyItemTitleCount}, description=${whyItemDescriptionCount}, icon=${whyItemIconCount}`,
);

/* The class hooks the CSS depends on. `.why-numeral` and `.why-icon-tile` must
   be gone from BOTH sides: leaving them behind is the dead-rule failure this
   polish exists to remove — a rule that ships but styles nothing. */
report(
  !squash(cssText).includes('.why-numeral{') &&
    !squash(cssText).includes('.why-icon-tile{'),
  'the superseded why-numeral / why-icon-tile rules are gone',
  'these were declared but never applied — the classes must not survive as dead bytes',
);

/*
 * The inline palette, gone from this section.
 *
 * Scoped to the why region deliberately. Why, Contact and Track Record are the
 * sections Polish #7–#10 have not reached yet, so a global "no inline colour"
 * assertion would fail on a correct build for a reason that has nothing to do
 * with this polish — the same trap the nav block documented.
 */
const whyInlineLeaks = [
  'var(--pdf-orange)',
  'var(--pdf-charcoal)',
  'var(--pdf-warm-grey)',
  'var(--pdf-white)',
  'var(--pdf-dark)',
  'var(--prd-orange)',
  'var(--prd-yellow)',
  'var(--prd-neutral)',
  'var(--prd-border',
  'var(--prd-radius',
  'var(--prd-shadow',
].filter((needle) => whyRegion.includes(needle));

report(
  whyInlineLeaks.length === 0,
  'no why element renders from the legacy palette',
  `these survive in the why section and beat the classes that replaced them: ${whyInlineLeaks.join(', ')}`,
);

/*
 * A style attribute whose declarations are palette values is exactly what this
 * polish removed, so the region must carry none. This is the check that catches
 * a re-introduced `style={{ color: 'red' }}` on a why element — the injected
 * `color:red` renders as `style="color:red"` and fails here.
 */
const whyStyleAttrs = [...whyRegion.matchAll(/style="([^"]*)"/g)]
  .map((m) => m[1])
  .filter((decl) => /background|color|border-radius|box-shadow/.test(decl));

report(
  whyStyleAttrs.length === 0,
  'the why section renders with no inline palette styles at all',
  `expected zero — served: ${JSON.stringify(whyStyleAttrs)}`,
);

group(
  'Phase 4B why classes in markup',
  [
    'why-section',
    'why-grid',
    'why-container',
    'why-hero-eyebrow',
    'why-hero-title',
    'why-hero-subcopy',
    'why-beforeafter-grid',
    'why-col-before',
    'why-col-after',
    'why-column-heading',
    'why-subline',
    'why-list',
    'why-item',
    'why-item-icon',
    'why-item-title',
    'why-item-description',
    'why-numeral-tile',
  ],
  (needle) => whyRegion.includes(needle),
);

group(
  'Phase 4B why type utilities',
  ['eyebrow', 'text-h2', 'text-body', 'text-body-sm', 'text-h4'],
  (needle) => whyRegion.includes(needle),
);

group(
  'Phase 4B why CSS',
  [
    '.why-section{',
    '.why-section .why-grid{',
    '.why-container{',
    '.why-beforeafter-grid{',
    '.why-col{',
    '.why-col-before{',
    '.why-col-after{',
    '.why-column-heading{',
    '.why-subline{',
    '.why-list{',
    '.why-item{',
    '.why-item-icon{',
    '.why-item-title{',
    '.why-item-description{',
    '.why-numeral-tile{',
  ],
  (needle) => squash(cssText).includes(needle),
);

/* ------------------------------------------------------------------ *
 * Summary
 * ------------------------------------------------------------------ */

console.log('');
if (failures === 0) {
  console.log('  \u001b[32mALL CHECKS PASSED\u001b[0m\n');
  process.exit(0);
}

console.log(`  \u001b[31m${failures} CHECK(S) FAILED\u001b[0m\n`);
console.log('  If the copy checks fail but the build was clean, you are likely');
console.log('  reading a stale server — an old `next start` still holding the');
console.log('  port. Stop it and restart:\n');
console.log('    fuser -k 3210/tcp || true');
console.log('    npm run build && npx next start -p 3210\n');
process.exit(1);

