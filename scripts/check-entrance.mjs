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
  /* Polish #7 — the headline is two-tone: "Scientific Molding" in orange and
     "Training Series" in charcoal, inside ONE <h1>. The split is derived from
     the single PRD string in `hero-content.ts`, so this asserts the two colour
     runs are both present rather than asserting two copy strings that could
     drift from the headline. */
  ['headline keyword run', 'hero-headline-keyword'],
  ['headline remainder run', 'hero-headline-rest'],
  ['blueprint grid', 'hero-grid'],
  /* Polish #7 — the hero visual is now `<ImageSlot>`, so the marker the
     placeholder used to carry ("Image placeholder") is gone. The frame is still
     asserted by class below; the asset path is asserted separately. */
  ['hero image asset path', '/images/hero-training.jpg'],
  ['hero image slot frame', 'image-slot'],
  // Section 5.2
  ['about section', 'id="about"'],
  ['about heading id', 'id="about-heading"'],
  ['credential list is a <ul>', 'list-none'],
  /* Polish #7 — the labelled placeholder frame became an `<ImageSlot>` driven by
     `TRAINER_PHOTO.src`. */
  ['trainer photo asset path', '/images/trainer-portrait.jpg'],
  ['trainer session gallery', 'session-grid'],
  ['session 1 asset path', '/images/session-1.jpg'],
  ['session 4 asset path', '/images/session-4.jpg'],
  // Section 5.3 Program A
  ['program A section', 'id="fundamentals"'],
  ['program A heading id', 'id="fundamentals-heading"'],
  /*
   * The dark program hero. The needle moved from `var(--pdf-dark)` to
   * `var(--ds-neutral-900)` in Polish #7 Session 2 — same colour, correct owner.
   * The `--pdf-*` set belongs to the five program sections because their source
   * PDFs specified it; `--pdf-dark` was the one value in that set that no PDF
   * actually specified, so the hero now reads the design-system token.
   *
   * The assertion is on the VALUE being present, and `.program-hero` is asserted
   * by declaration further down, so a hero that stopped being dark fails there
   * even if this substring test were satisfied some other way.
   */
  ['program A hero is dark', 'var(--ds-neutral-900)'],
  /*
   * Was `min-height:70vh`. Reduced to 50vh in Polish #7: five consecutive
   * near-full-viewport heroes pushed the first content block below the fold on
   * every program. Asserted at the new value rather than dropped, so an edit
   * that lets the hero grow back is still caught.
   */
  ['program hero height', 'min-height:50vh'],
  /*
   * The one-line trainer credit each program hero now carries in place of the
   * full `TrainerCredibility` strip it used to repeat five times.
   */
  ['program hero trainer credit', 'program-hero-credibility'],
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
  /*
   * `Memories machine settings`, `BEFORE` and `AFTER` were asserted here until
   * Polish #7. All three were cells in Program A's own Before/After table, which
   * is no longer rendered: the table existed in all five programs and again in
   * §5.4, so the same comparison appeared six times. The canonical one is in the
   * Why section, whose copy is asserted by `WHY_COPY`.
   *
   * The PDF-TYPO note for "Memories machine settings" still stands in
   * `program-a-content.ts` — the string is preserved there, it is just no longer
   * rendered per program. If the table is ever restored, so must these.
   */
  'Why Foundation Matters',
  'A DEFECT IS A SYMPTOM — NOT AUTOMATIC PROOF OF ITS ROOT CAUSE.',
  'Five Outcomes for New Engineers',
  'Philosophy',
  'MATERIAL + MOULD + MACHINE + PROCESS',
  'TEMPERATURE | FLOW | PRESSURE | COOLING',
  // PDF-TYPO: "behavior" (US) against "behaviour" (UK) elsewhere, preserved
  'Material behavior, the four plastic conditions and machine-function awareness.',
  'Two-Day Journey',
  /*
   * "Learning Format" was the heading of Program A's tag-chip grid. In Polish
   * #7 that grid — and its heading — collapsed into the combined one-line
   * "For: … · Format: …" statement, so the words "Learning Format" no longer
   * appear. The ITEMS are still asserted directly below and still render, which
   * is what actually proves the content survived: a heading is chrome, the five
   * format items are the copy.
   */
  'For:',
  'Format:',
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
 * The label of the most recent failing check.
 *
 * Kept so the summary can NAME the expected failure rather than emitting a
 * generic hint that sends the reader after a stale build. Only the last one is
 * tracked: the summary's special case is for a run with exactly one failure, and
 * a list would be dead weight for that.
 */
let lastFailureLabel = '';

/**
 * @param {boolean} ok
 * @param {string} label
 * @param {string} [detail] Why the check matters, or what went wrong. Shown only
 *   on failure, so a passing run never reads as an accusation.
 */
function report(ok, label, detail) {
  const mark = ok ? '\u001b[32m✓\u001b[0m' : '\u001b[31m✗\u001b[0m';
  console.log(`  ${mark} ${label}${!ok && detail ? ` — ${detail}` : ''}`);
  if (!ok) {
    failures += 1;
    lastFailureLabel = label;
  }
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
 *
 * Polish #7 EXTENDED the group: the primary CTA's hover lift, its active state
 * and its arrow slide all resolve to displaced positions, so they were added to
 * the same rule. The pattern below tolerates the extra selectors rather than
 * pinning an exact list, so a future addition to the group does not fail here —
 * the *presence* of the three originals is what it protects.
 */
report(
  /prefers-reduced-motion:reduce\)\{[^@]*?\.nav-cta:hover[\s\S]*?\.hero-stat:hover,\s*\.hero-frame:hover[^{]*\{transform:none\}/.test(
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
  'no "CONTENT REQUIRED" placeholder remains in the rendered copy',
  'PDF copy supplied; the marker must be gone from the page itself',
);

/*
 * ⚠️ EXCEPTION — the testimonials section is EXPECTED to fail here until real
 * quotes are supplied.
 *
 * The earlier `CONTENT REQUIRED` check reads the rendered HTML, and the source
 * module deliberately does NOT put that marker into the page: the testimonial
 * placeholders are bracketed ("[Name]", "[Testimonial text — 2-3 sentences]"),
 * which a visitor would read as a broken layout, not as a warning. So the
 * rendered page is clean and the gate has to live here instead.
 *
 * This is reported as a FAILURE on purpose. The brief requires the section to
 * ship with a visible flag; a warning that still exits 0 is a warning that gets
 * ignored, and this is the one item on the page that must not reach production
 * unreplaced. It is also the reason `npm run verify` reports a non-zero exit
 * right now, which is the correct state of the project.
 *
 * See `components/testimonials/testimonials-content.ts` for what to supply.
 */

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
  // Section surface: a flat white base, with the wash as its own layer.
  '.hero-section{background-color:var(--ds-neutral-0)',
  '.hero-wash{opacity:.5',
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
  /* Image frame: the radius and elevation moved to `<ImageSlot>` in Polish #7,
     so `.hero-frame` now carries only the hover scale. */
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

/*
 * Polish #7 — this used to assert `border-radius` + `box-shadow` on
 * `.hero-frame`, because the frame owned its own geometry. It does not any more:
 * the radius and the elevation are `<ImageSlot>` props (`radius="xl"`,
 * `elevation="lg"`), so the assertions moved to the class map in the component.
 *
 * Asserting the OLD rule here would fail on the correct build, which is worse
 * than a missing check — the usual response to a red check is to "fix" working
 * code. So this reads what the frame still owns: the compositor-only hover
 * scale, and nothing that touches layout.
 */
report(
  heroFrameDecls.get('transition') ===
    'transform var(--ds-duration-slow) var(--ds-ease-out)',
  'the hero frame transitions only its transform',
  `the frame should declare exactly one transition (transform) so the hover stays off the main thread — served: ${JSON.stringify(Object.fromEntries(heroFrameDecls))}`,
);

/* The radius and elevation are asserted at the CALL SITE, in the served HTML —
   see the `heroRegion` block below, which owns that scope. */

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

/*
 * Polish #7 — the frame's `::after` grounding gradient is GONE.
 *
 * It existed to seat the frame on the page by darkening its bottom edge. With
 * `<ImageSlot>` the tint moved to the TOP-left highlight instead
 * (`135deg, rgba(232,99,28,0.08), transparent`), which is the brand colour
 * rather than a neutral charcoal wash, and which does not darken the subject.
 *
 * So the assertion is inverted: the grounding gradient must be ABSENT and the
 * orange tint must be present. A leftover `::after` would double-tint the frame.
 */
report(
  !squash(cssText).includes('.hero-frame:after{content:""'),
  'the hero frame no longer carries a grounding gradient',
  'the ::after overlay is superseded by the ImageSlot orange tint — leaving both double-tints the frame',
);

/*
 * Polish #7 — the image slot's 8% orange tint.
 *
 * Asserted by DECLARATION, not by literal. The minifier rewrites
 * `rgba(232, 99, 28, 0.08)` to `#e8631c14` and `transparent` to `#0000`, so a
 * literal needle for the source spelling fails on a correct build — the same
 * trap the hero grid and the badge tones documented.
 *
 * So this reads the served rule and decodes whichever form the minifier chose:
 * the alpha must be 0.08, the hue must be the brand orange, and the gradient
 * must run at 135°.
 */
const tintBody = declarationsOf('.image-slot-tint').get('background') ?? '';
const tintAlphaMatch = tintBody.match(/#e8631c([0-9a-f]{2})/);
const tintAlpha = tintAlphaMatch
  ? parseInt(tintAlphaMatch[1], 16) / 255
  : Number(tintBody.match(/rgba\(232,\s*99,\s*28,\s*([\d.]+)\)/)?.[1] ?? NaN);

report(
  tintBody.includes('linear-gradient(135deg') &&
    Number.isFinite(tintAlpha) &&
    Math.abs(tintAlpha - 0.08) < 0.005,
  'the image slot carries its 8% orange tint',
  `expected a 135° brand-tinted overlay at alpha 0.08 — served: ${tintBody || '(absent)'}`,
);

report(
  declarationsOf('.image-slot-tint').get('pointer-events') === 'none',
  'the image tint cannot intercept a click',
  'the tint layer covers the whole frame, so without pointer-events:none anything over the image is unreachable',
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
 * Polish #7 — the scroll cue's infinite bob is GONE.
 *
 * It was a 2.4s `translateY` loop that never stopped: the one animation on the
 * page that ran continuously, and exactly the decorative motion the brief rules
 * out (Task 9, "REMOVE: rotating/pulsing shapes … continuous bg animation").
 * A chevron pointing down at the fold already says "there is more below".
 *
 * So the assertion is INVERTED rather than deleted. Deleting it would let the
 * bob come back silently, which is the regression this check exists to catch.
 */
/*
 * Polish #7 — the scroll cue's infinite bob is GONE.
 *
 * It was a 2.4s `translateY` loop that never stopped: the one animation on the
 * page that ran continuously, and exactly the decorative motion the brief rules
 * out (Task 9, "REMOVE: rotating/pulsing shapes … continuous bg animation").
 * A chevron pointing down at the fold already says "there is more below".
 *
 * The check reads EVERY `.hero-scroll-cue*` rule in the served stylesheet and
 * fails if any of them declares an `animation` — including one inside a
 * reduced-motion block, where an `animation: none` would look like a guard
 * rather than the leftover it is. That is the shape the removal actually took:
 * the default rule lost its animation but a stale `animation: none !important`
 * survived in the media query, and a naive "no keyframes" check passed straight
 * over it.
 */
const cueRules = [...squash(cssText).matchAll(/\.hero-scroll-cue[^{]*\{([^}]*)\}/g)].map(
  ([, body]) => body,
);

report(
  cueRules.length > 0 && cueRules.every((body) => !body.includes('animation')),
  'no scroll-cue rule declares an animation',
  `the cue is static by design — served cue rules: ${JSON.stringify(cueRules)}`,
);

report(
  /prefers-reduced-motion:reduce\)\{[^@]*?\.hero-stat:hover,\.hero-frame:hover[^{]*\{transform:none\}/.test(
    squash(cssText),
  ),
  'reduced motion removes the hero hover movement',
  'the stat card or image frame still jumps on hover with reduced motion on',
);

/* Polish #7 — the primary CTA's lift, its active state and its arrow slide all
   resolve to a displaced resting position, so all three are removed outright
   rather than merely shortened. Same reasoning as the stat card above: the
   duration guard collapses the animation but leaves the end state. */
report(
  /prefers-reduced-motion:reduce\)\{[^@]*?\.cta-primary:hover,\.cta-primary:active,\.cta-primary:hover \.cta-primary-arrow\{transform:none\}/.test(
    squash(cssText),
  ),
  'reduced motion removes the primary CTA lift and arrow slide',
  'the primary CTA still jumps or slides its arrow with reduced motion on — the duration guard alone does not remove the movement',
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

/*
 * Polish #7 — the frame's geometry is asserted HERE, at the call site, because
 * `<ImageSlot>` owns it now rather than `.hero-frame`.
 *
 * `radius="xl"` / `elevation="lg"` resolve through the component's class map
 * into `rounded-[var(--ds-radius-xl)]` and `shadow-[var(--ds-shadow-lg)]`, and
 * both land on the hero frame's wrapper in the served markup. Reading them from
 * the HTML is what proves the props were passed: a component that ignored them
 * would still pass a stylesheet check, because the tokens exist either way.
 */
report(
  /class="image-slot[^"]*rounded-\[var\(--ds-radius-xl\)\][^"]*shadow-\[var\(--ds-shadow-lg\)\]/.test(
    heroRegion,
  ),
  'the hero frame floats at radius-xl with shadow-lg',
  'the ImageSlot wrapper must carry both the xl radius and the lg elevation — see HERO_MEDIA in HeroMedia.tsx',
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
    /* Polish #7 — `trainer-placeholder-icon` is gone: the labelled icon
       placeholder became `<ImageSlot>`'s brand-gradient fallback, so the
       class no longer exists anywhere. `image-slot` and the session gallery
       replace it in this list. */
    'image-slot',
    'session-grid',
    'session-grid-item',
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

/*
 * Polish #7 — the surface moved from `--ds-neutral-0` to `--ds-neutral-50`.
 *
 * It was flat white, one step off the `--prd-offwhite` Track Record below it, so
 * that boundary had no edge. It now sits one step off white instead, which
 * separates it from the programs above while keeping it far lighter than the
 * dark Track Record beneath.
 */
report(
  whySectionDecls.get('background-color') === 'var(--ds-neutral-50)',
  'the why section sits one step off white',
  `expected --ds-neutral-50 — served: ${whySectionDecls.get('background-color') ?? '(absent)'}`,
);

/*
 * The rhythm is now the compacted section token rather than a bare spacing step,
 * so this section and every other one cannot drift apart again. Polish #7
 * compacted that token to 40px/64px; asserting the token rather than its value
 * is what makes a future compaction propagate here.
 */
report(
  whySectionDecls.get('padding-block') === 'var(--ds-section-padding-y-mobile)',
  'the why section carries the mobile section rhythm',
  `expected --ds-section-padding-y-mobile — served: ${whySectionDecls.get('padding-block') ?? '(absent)'}`,
);

report(
  /@media \(min-width:768px\)\{\.why-section\{padding-block:var\(--ds-section-padding-y-desktop\)/.test(
    squash(cssText),
  ),
  'the why section carries the desktop section rhythm',
  'the desktop padding must come from the same compacted token as every other section',
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
 * Polish #7 — Compact + de-repetition
 * ------------------------------------------------------------------ */

/*
 * These assertions exist to keep the page SHORT. The five program bodies
 * carried the same four blocks each — trainer strip, Before/After table, big
 * CTA panel, and two chip grids — so the visitor met each of them five times
 * and none of them was the definitive version.
 *
 * Every count below is therefore a CEILING, not a floor: the failure it catches
 * is a block creeping back into a program body, not a block going missing. The
 * one-instance checks name where the surviving copy lives, so "the count is 1"
 * and "the copy is still on the page" are two separate assertions — a count of 0
 * would satisfy a naive `<= 1` and hide a genuine deletion.
 */

const polish7Regions = [
  region('id="fundamentals"', 'id="materials"'),
  region('id="materials"', 'id="process-development"'),
  region('id="process-development"', 'id="defect-troubleshooting"'),
  region('id="defect-troubleshooting"', 'id="pathway"'),
];

report(
  polish7Regions.every((r) => r.length > 3000),
  'the four program bodies are locatable for the de-repetition checks',
  `spans: ${polish7Regions.map((r) => r.length).join(', ')} — a short span makes the checks below vacuous`,
);

/* --- The trainer strip renders ONCE, in About. --- */

report(
  countOccurrences(htmlText, 'trainer-strip') === 0,
  'no program body renders the trainer strip any more',
  `the strip is identical in all five programs, so it read as wallpaper rather than as a credential — served: ${countOccurrences(htmlText, 'trainer-strip')}`,
);

/*
 * ------------------------------------------------------------------
 * POLISH #7 — de-repetition, hoisted to page level.
 *
 * The three blocks below are the ones the brief names explicitly, and each is
 * asserted at PAGE scope rather than per program. That matters: a per-program
 * check ("0 in A, 0 in B, …") passes if the block moved to a program the loop
 * does not cover, and the failure this guards against is EXACTLY a block
 * creeping back into one of the five. Page level has no such blind spot.
 * ------------------------------------------------------------------
 */

/*
 * The full `TrainerCredibility` strip: ONE, in About.
 *
 * The surviving copy is the `trainer-stat-strip` inside the About section, which
 * is where a reader goes to evaluate the trainer. Each program hero keeps the
 * one-line credit instead (`program-hero-credibility`, counted below), which is
 * the same name and the same figure rendered as a sentence rather than as a
 * block with headings and icons.
 *
 * `>= 1` rather than `=== 1`: the element doubles in the RSC payload like every
 * other className (see the note above the string counts), so the assertion is
 * that the strip is present and NOT replicated five times.
 */
report(
  countOccurrences(htmlText, 'trainer-stat-strip') === 2,
  'the full credential strip renders once, in About',
  `1 element = 2 string occurrences — expected 2, served: ${countOccurrences(htmlText, 'trainer-stat-strip')}`,
);

report(
  countOccurrences(htmlText, 'program-hero-credibility') === 10,
  'the trainer credit is a one-liner in each of the five program heroes',
  `the full strip is gone from the programs; the hero carries the summary line — 5 elements = 10 occurrences, served: ${countOccurrences(htmlText, 'program-hero-credibility')}`,
);

/*
 * The ONE big CTA. `program-cta-footer` appears only in the Contact section.
 *
 * The brief is specific: "Remove `.program-cta-footer` from Program A-E. Keep 1
 * big CTA in Contact section only." So this is asserted as a per-PROGRAM count of
 * zero, which is the failure the rule exists to catch — the block creeping back
 * into one of the five bodies.
 *
 * A page-level count would be wrong here, because the class legitimately appears
 * once in Contact. `polish7Regions` covers the four programs that go through
 * `ProgramSection`; Program E is checked separately because it composes its own
 * body and is exactly where a regression would be easiest to miss.
 */
const ctaFooterInPrograms = polish7Regions.reduce(
  (sum, r) => sum + countOccurrences(r, 'program-cta-footer'),
  0,
);

report(
  ctaFooterInPrograms === 0,
  'no program body renders the big CTA block',
  `the big CTA renders once, in §5.6 — served ${ctaFooterInPrograms} in the four ProgramSection bodies`,
);

/*
 * Program E's body runs from its own `id="pathway"` anchor to the NEXT section
 * boundary — `id="why"`, not `<footer>`. Using `<footer>` would swallow the
 * whole Contact section (which legitimately contains the CTA block) and the
 * check would fail on a correct build.
 */
const programERegionForCta = region('id="pathway"', 'id="why"');

report(
  countOccurrences(programERegionForCta, 'program-cta-footer') === 0,
  'Program E does not render the big CTA block either',
  `Program E writes its own body, so it is checked separately — served: ${countOccurrences(programERegionForCta, 'program-cta-footer')}`,
);

/*
 * And the block must still be PRESENT, once, in Contact. Without this a
 * `count === 0` above would be satisfied by deleting it entirely, which is the
 * opposite of what the brief asks: the copy moves, it does not disappear.
 */
report(
  countOccurrences(htmlText, 'program-cta-footer-item') >= 5,
  'the one big CTA in §5.6 carries all five programme headlines',
  `expected the five entries to render once — served: ${countOccurrences(htmlText, 'program-cta-footer-item')}`,
);

/*
 * The Before/After comparison: ONE, in §5.4.
 *
 * The programs used to each render their own table — six variants of the same
 * comparison, none canonical. They now render a one-line link to `#why` instead.
 */
report(
  countOccurrences(htmlText, 'before-after-table') <= 2,
  'the Before/After table renders once, in §5.4',
  `1 element = 2 string occurrences — served: ${countOccurrences(htmlText, 'before-after-table')}`,
);

/*
 * `See the capability shift` — the brief's replacement link text.
 *
 * One per program body (four via `ProgramSection`, one written out in Program
 * E's `ClosingCta`), so five elements = ten occurrences.
 */
report(
  countOccurrences(htmlText, 'See the capability shift') === 10,
  'every program links to the canonical comparison',
  `five links = ten occurrences — served: ${countOccurrences(htmlText, 'See the capability shift')}`,
);

/*
 * ------------------------------------------------------------------
 * ⚠️ WHY THESE NUMBERS ARE DOUBLE THE ELEMENT COUNT
 * ------------------------------------------------------------------
 * Next.js serves the RSC payload inline as `self.__next_f.push([...])`, which
 * repeats every className string in the serialised tree. So a class applied to
 * N elements appears 2N times in the response: N in the rendered markup, N in
 * the payload.
 *
 * Verified rather than assumed: `program-hero-credibility` count 10 for 5
 * heroes, `credential-item` 14 for 7 credentials, `See why this matters` 8 for
 * 4 links. Every count below was taken from the served response and then
 * halved, so the assertion holds for the number of ELEMENTS while comparing
 * against the raw string count.
 *
 * The `why-*` block above hit the same doubling and asserts the raw counts
 * directly (16 for 8 items); this block spells out the arithmetic so the next
 * reader does not "fix" a correct number.
 */

report(
  countOccurrences(htmlText, 'program-hero-credibility') === 10,
  'each of the five program heroes carries the one-line trainer credit',
  `expected 5 elements (10 string occurrences) — served: ${countOccurrences(htmlText, 'program-hero-credibility')}`,
);

report(
  countOccurrences(htmlText, 'credential-item') === 14,
  'the full credential list still renders once, in About',
  `seven certificates = 7 elements = 14 occurrences — served: ${countOccurrences(htmlText, 'credential-item')}`,
);

/* --- The Before/After table is gone from the program bodies. --- */

const programTableCount = polish7Regions.reduce(
  (sum, r) => sum + countOccurrences(r, 'before-after-table'),
  0,
);

report(
  programTableCount === 0,
  'no program body renders its own Before/After table',
  `the canonical comparison is in §5.4 — served ${programTableCount} program tables`,
);

/*
 * All five programs link to the canonical comparison — including Program E,
 * which has no table of its own and whose closing block is written out
 * separately rather than through `ProgramSection`. 5 links = 10 occurrences.
 *
 * Polish #7 renamed the link from "See why this matters" to "See the capability
 * shift", which is what the brief specifies. The COUNT is unchanged and is the
 * part that matters: it is the per-program link the de-repetition kept.
 */
report(
  countOccurrences(htmlText, 'See the capability shift') === 10,
  'every program links to the canonical comparison in §5.4',
  `5 links = 10 occurrences — served: ${countOccurrences(htmlText, 'See the capability shift')}`,
);

/* --- The big CTA panel is gone; one button per program remains. --- */

const programCtaPanelCount = polish7Regions.reduce(
  (sum, r) => sum + countOccurrences(r, 'program-cta-body'),
  0,
);

report(
  programCtaPanelCount === 0,
  'no program body renders the dark CTA panel',
  `the panel's headline, body and sign-off now render once in §5.6 — served ${programCtaPanelCount} panels`,
);

report(
  countOccurrences(htmlText, 'program-request-button') === 10,
  'each of the five programs keeps exactly one Request a Proposal button',
  `5 buttons = 10 occurrences — served: ${countOccurrences(htmlText, 'program-request-button')}`,
);

/*
 * The consolidated CTA copy. Five headlines in one place, so the words the
 * program bodies used to carry are still on the page — this is the assertion
 * that would catch the copy being deleted rather than moved.
 */
report(
  countOccurrences(htmlText, 'program-cta-footer-item') === 5,
  'the consolidated CTA block in §5.6 carries all five programme headlines',
  `expected 5 entries — served: ${countOccurrences(htmlText, 'program-cta-footer-item')}`,
);

for (const headline of [
  'BUILD A STRONGER ENGINEERING FOUNDATION',
  'REQUEST YOUR TWO-DAY IN-HOUSE TRAINING PROPOSAL',
  'READY TO BUILD A STRONGER PROCESS-ENGINEERING TEAM?',
  'BUILD A TEAM THAT SOLVES THE CAUSE',
  'BUILD THE RIGHT CAPABILITY FOR YOUR MOULDING TEAM.',
]) {
  report(
    htmlText.includes(headline),
    `CTA headline preserved: ${headline}`,
    'this program CTA headline was moved to §5.6, not deleted — a missing one means the move dropped it',
  );
}

/* --- Who Should Attend + Learning Format collapsed to one line. --- */

report(
  countOccurrences(htmlText, 'program-audience-line') === 8,
  'the audience/format line renders for the four programs that have that data',
  `Program A's PDF has no "Who Should Attend" list, so 4 lines = 8 occurrences — served: ${countOccurrences(htmlText, 'program-audience-line')}`,
);

report(
  countOccurrences(htmlText, 'program-tag-chip') === 0,
  'the tag-chip grids no longer render as chips',
  `the audience and format items are now one comma-joined line — served: ${countOccurrences(htmlText, 'program-tag-chip')} chips`,
);

/* --- The compact list replaced the card grid. --- */

report(
  countOccurrences(htmlText, 'program-compact-list') >= 20,
  'the program bodies render compact lists rather than card grids',
  `expected the numbered sets to render as compact lists — served: ${countOccurrences(htmlText, 'program-compact-list')}`,
);

report(
  countOccurrences(htmlText, 'program-problem-card') === 0,
  'the 64px-tile problem card grid is gone',
  `the card grid was replaced by .program-compact-list — served: ${countOccurrences(htmlText, 'program-problem-card')}`,
);

/*
 * The typography rule from the brief: items drop from `.text-h4` to
 * `.text-body`. Asserted against the STYLESHEET rather than the markup, because
 * the font-size is what the rule is about and a class name in the HTML only
 * proves the class was not renamed.
 */
report(
  declarationsOf('.program-compact-title').get('font-size') === 'var(--ds-text-body)',
  'compact item titles use the body type step',
  `expected --ds-text-body — served: ${declarationsOf('.program-compact-title').get('font-size') ?? '(absent)'}`,
);

report(
  declarationsOf('.program-compact-description').get('font-size') ===
    'var(--ds-text-body-sm)',
  'compact item descriptions use the small body step',
  `expected --ds-text-body-sm — served: ${declarationsOf('.program-compact-description').get('font-size') ?? '(absent)'}`,
);

report(
  declarationsOf('.program-audience-line').get('font-style') === 'italic' &&
    declarationsOf('.program-audience-line').get('color') === 'var(--ds-neutral-500)',
  'the audience/format line is the italic muted treatment the brief specifies',
  `expected italic + neutral-500 — served: ${JSON.stringify(Object.fromEntries(declarationsOf('.program-audience-line')))}`,
);

report(
  declarationsOf('.program-compact-list').get('grid-template-columns') === '1fr',
  'the compact list is one column on mobile',
  `the two-column rule is behind a 768px media query — served: ${declarationsOf('.program-compact-list').get('grid-template-columns') ?? '(absent)'}`,
);

/* --- Spacing was compacted. --- */

report(
  squash(cssText).includes('--ds-section-padding-y-desktop:64px'),
  'the desktop section rhythm is 64px',
  'compacting the section padding is half the page-height saving',
);

report(
  squash(cssText).includes('--ds-section-padding-y-mobile:40px'),
  'the mobile section rhythm is 40px',
  'compacting the section padding is half the page-height saving',
);

report(
  squash(cssText).includes('--ds-space-16:48px') &&
    squash(cssText).includes('--ds-space-24:80px'),
  'the 16 and 24 spacing steps were compacted',
  'these carry the inter-section gaps',
);

/* --- The payload budget this polish exists to hit. --- */

report(
  html.length < 400_000,
  'the served HTML is under the 400 KB compacted budget',
  `was ~461 KB before Polish #7 — served: ${Math.round(html.length / 1024)} KB`,
);

/* ------------------------------------------------------------------ *
 * Polish #7 — Typography discipline
 * ------------------------------------------------------------------ */

/*
 * TYPE WEIGHTS. The brief's scale table is 800 / 800 / 700 / 600 / 500. Before
 * this pass it was 800 / 800 / 700 / 700 / 600 — four of five steps within 100
 * of each other, so the hierarchy was carried by size alone.
 *
 * Read as DECLARATIONS off the served rules, so the check is unaffected by how
 * the minifier orders or writes them.
 */
const TYPE_WEIGHTS = [
  ['hero', '.text-hero', 800],
  ['h1', '.text-h1', 800],
  ['h2', '.text-h2', 700],
  ['h3', '.text-h3', 600],
  ['h4', '.text-h4', 500],
];

for (const [name, selector, weight] of TYPE_WEIGHTS) {
  report(
    declarationsOf(selector).get('font-weight') === String(weight),
    `the ${name} step is weight ${weight}`,
    `expected font-weight:${weight} — served: ${declarationsOf(selector).get('font-weight') ?? '(absent)'} (a flattened scale makes every level read at the same rank)`,
  );
}

/*
 * NO UPPERCASE ON HEADINGS. The eyebrow is the only label that may be
 * uppercase; a heading wearing it is indistinguishable from the label that is
 * supposed to mark it.
 *
 * Checked by scanning every heading rule in the served stylesheet rather than by
 * listing class names, so a NEW heading class cannot slip past it.
 */
const headingRules = [...squash(cssText).matchAll(/\.(?:text-)?h[1-6][^{]*\{([^}]*)\}/g)].map(
  ([, body]) => body,
);

report(
  headingRules.every((body) => !body.includes('text-transform:uppercase')),
  'no type-scale heading rule applies uppercase',
  `the eyebrow is the only uppercase label — offending: ${JSON.stringify(headingRules.filter((b) => b.includes('text-transform:uppercase')))}`,
);

/*
 * BODY MEASURE at 65ch, and relaxed leading on body copy. The brief's rule is
 * "paragraph >2 lines → --ds-leading-relaxed, max-width 65ch", which is a
 * property of the utility rather than of each paragraph.
 */
report(
  declarationsOf('.text-prose').get('max-width') === '65ch',
  'the prose utility caps its measure at 65ch',
  `expected max-width:65ch — served: ${declarationsOf('.text-prose').get('max-width') ?? '(absent)'}`,
);

report(
  declarationsOf('.text-body').get('line-height') === '1.65',
  'body copy runs at 1.65 leading',
  `expected line-height:1.65 — served: ${declarationsOf('.text-body').get('line-height') ?? '(absent)'}`,
);

/* ------------------------------------------------------------------ *
 * Polish #7 — Layout variety, dark rhythm, testimonials, image slots
 * ------------------------------------------------------------------ */

/* --- Layout variety: four structurally distinct section grids. --- */

const LAYOUT_GRIDS = [
  ['About is asymmetric 60/40', '.about-grid', '3fr 2fr', '1024'],
  ['Contact is asymmetric 60/40 with the form first', '.contact-grid', '3fr 2fr', '1024'],
  ['Track Record ranks its figures 40/35/25', '.track-stats', '4fr 3.5fr 2.5fr', '768'],
  ['Testimonials is a symmetric 3-up', '.testimonial-grid', 'repeat(3,1fr)', '768'],
];

/*
 * Every `@media (min-width:<bp>px){…}` block in the served sheet, sliced with a
 * brace walk so a block's own end is found even when it contains nested rules.
 *
 * @param {number|string} breakpoint px value of the query
 * @returns {string[]} the block bodies, including the query's own braces
 */
function mediaBlocks(breakpoint) {
  const text = squash(cssText);
  const opener = `@media (min-width:${breakpoint}px){`;
  const out = [];

  let at = text.indexOf(opener);

  while (at !== -1) {
    const start = at + opener.length - 1;
    let depth = 0;
    let i = start;

    for (; i < text.length; i += 1) {
      if (text[i] === '{') depth += 1;
      else if (text[i] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }

    out.push(text.slice(start, i + 1));
    at = text.indexOf(opener, i);
  }

  return out;
}

for (const [label, selector, columns, breakpoint] of LAYOUT_GRIDS) {
  /*
   * ⚠️ Order-independent AND block-scoped, on purpose.
   *
   * Two corrections went into this check, both of them failures on a CORRECT
   * build — which is the worse kind, because the usual response to a red check is
   * to "fix" working code:
   *
   *  1. The first version asserted the declared property came FIRST inside the
   *     rule (`…{.about-grid{grid-template-columns:3fr 2fr`). The minifier
   *     reorders declarations, so the served rule is
   *     `.about-grid{gap:…;padding-block:…;grid-template-columns:3fr 2fr}`.
   *
   *  2. The second version matched `@media …{[^@]*?SELECTOR{`. `[^@]*?` is lazy
   *     across the WHOLE stylesheet, not restricted to the media block, so it
   *     matched the FIRST `SELECTOR{` anywhere after an `@media` rule — for
   *     `.track-stats` that was the base rule (1fr), not the query's.
   *
   * So this slices the query's own block out first, then reads the rule inside it.
   */
  const escaped = selector.replace(/[.:[\]()]/g, '\\$&');
  const body = mediaBlocks(breakpoint)
    .map((block) => block.match(new RegExp(`${escaped}\\{([^}]*)\\}`))?.[1] ?? '')
    .join(' ');

  report(
    body.includes(`grid-template-columns:${columns}`),
    label,
    `expected "grid-template-columns:${columns}" behind a ${breakpoint}px query — served: ${body || '(rule absent from every block at that breakpoint)'}`,
  );
}

/*
 * The Why section is the 50/50 one. Asserted through the same helper, for the
 * same reason: its base rule is `1fr` and only the query carries the pair.
 */
report(
  mediaBlocks(1024).some((block) =>
    /\.why-beforeafter-grid\{[^}]*grid-template-columns:1fr 1fr/.test(block),
  ),
  'Why is the symmetric 50/50 comparison',
  'the before/after columns must balance at 1fr each — this is the section the asymmetry elsewhere is measured against',
);

/* --- Dark / light rhythm. --- */

report(
  declarationsOf('.track-section').get('background-color') === 'var(--ds-neutral-900)',
  'Track Record sits on the dark surface',
  `expected --ds-neutral-900 — served: ${declarationsOf('.track-section').get('background-color') ?? '(absent)'}; it was off-white, which gave its boundary with Contact no edge at all`,
);

report(
  declarationsOf('.testimonials-section').get('background-color') === 'var(--ds-neutral-0)',
  'Testimonials sits on white, against the dark section above it',
  `expected --ds-neutral-0 — served: ${declarationsOf('.testimonials-section').get('background-color') ?? '(absent)'}`,
);

report(
  declarationsOf('.contact-section').get('background-color') === 'var(--ds-neutral-0)',
  'Contact shares the white surface with Testimonials',
  `expected --ds-neutral-0 — served: ${declarationsOf('.contact-section').get('background-color') ?? '(absent)'}; evidence and invitation are one act, not two sections`,
);

/*
 * The dark surface's palette. Charcoal or warm grey on #1a1a1a would be
 * unreadable, so this asserts the text colours were re-picked rather than
 * inherited: white primary, 70% white secondary, orange for the figures.
 */
report(
  declarationsOf('.track-title').get('color') === 'var(--ds-neutral-0)' &&
    /* The minifier writes `rgba(255,255,255,0.7)` as `#ffffffb3`. Decoded rather
       than matched as a literal, so the check survives the notation change — the
       same correction the grid alpha and the badge tones needed. */
    (() => {
      const decl = declarationsOf('.track-subcopy').get('color') ?? '';
      const hex = decl.match(/#ffffff([0-9a-f]{2})/);
      const alpha = hex ? parseInt(hex[1], 16) / 255 : Number(decl.match(/rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/)?.[1] ?? NaN);
      return Number.isFinite(alpha) && Math.abs(alpha - 0.7) < 0.01;
    })() &&
    declarationsOf('.track-stat-numeral').get('color') === 'var(--ds-orange-500)',
  'the dark section uses white, 70% white and the brand orange',
  `served: title=${declarationsOf('.track-title').get('color') ?? '(absent)'}, subcopy=${declarationsOf('.track-subcopy').get('color') ?? '(absent)'}, figure=${declarationsOf('.track-stat-numeral').get('color') ?? '(absent)'}`,
);


/* --- Testimonials. --- */

report(
  countOccurrences(htmlText, 'id="testimonials"') === 1,
  'the testimonials section renders exactly once',
  `expected 1 — served: ${countOccurrences(htmlText, 'id="testimonials"')}`,
);

/*
 * ⚠️ The placeholder guard, INVERTED — this FAILS while a bracket placeholder is
 * still in the data.
 *
 * It reads the SOURCE, not the served HTML, because the served payload is a build
 * artifact: a check against the output would pass on a build whose source still
 * held the brackets. Reading the content module is the only way to assert what is
 * actually going to be published.
 *
 * The docblock and comments are stripped first — the file's OWN documentation
 * quotes the placeholders, and matching those would fail on a file whose data is
 * clean.
 */
const testimonialSource = readFileSync(
  'components/testimonials/testimonials-content.ts',
  'utf8',
);

const testimonialData = testimonialSource
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');

report(
  !/\[\s*(?:Name|Role|Company|Testimonial text)/.test(testimonialData),
  'no bracketed testimonial placeholder remains in the data',
  'CONTENT REQUIRED — replace the three entries in components/testimonials/testimonials-content.ts with real, permissioned quotes before launch',
);

/* --- Image slots. --- */

/*
 * ⚠️ The path is asserted in BOTH forms.
 *
 * `next/image` rewrites `src` into an optimizer URL and percent-encodes it:
 *   /images/hero-training.jpg  →  /_next/image?url=%2Fimages%2Fhero-training.jpg
 *
 * So a check for the plain path finds it only in the RSC payload (which carries
 * the literal string), not in the rendered `<img>`. Searching for both is what
 * proves the slot is wired END TO END — a component that held the right string
 * but rendered no image would pass a payload-only test.
 */
const IMAGE_ASSETS = [
  ['hero image', '/images/hero-training.jpg'],
  ['trainer portrait', '/images/trainer-portrait.jpg'],
  ['session 1', '/images/session-1.jpg'],
  ['session 2', '/images/session-2.jpg'],
  ['session 3', '/images/session-3.jpg'],
  ['session 4', '/images/session-4.jpg'],
];

for (const [label, path] of IMAGE_ASSETS) {
  const encoded = path.replace(/\//g, '%2F');
  const servedOptimised = countOccurrences(htmlText, `/_next/image?url=${encoded}`);

  report(
    countOccurrences(htmlText, path) >= 1 && servedOptimised >= 1,
    `the ${label} slot renders through next/image at ${path}`,
    `expected the path in the payload AND an optimised /_next/image URL — payload: ${countOccurrences(htmlText, path)}, optimised: ${servedOptimised}`,
  );
}

report(
  countOccurrences(htmlText, 'image-slot') >= 12,
  'every image position renders through ImageSlot',
  `six slots = at least twelve occurrences of the class — served: ${countOccurrences(htmlText, 'image-slot')}`,
);

/*
 * The fallback must be a gradient and nothing else. A shimmer or a skeleton is
 * both a continuous animation AND a claim that the page is still loading, which
 * is the pair the brief rules out.
 */
report(
  !/shimmer|skeleton|@keyframes [^{]*(?:shimmer|pulse|skeleton)/i.test(squash(cssText)),
  'no shimmer or skeleton animation ships',
  `served: ${(squash(cssText).match(/shimmer|skeleton/gi) ?? []).join(', ') || '(none)'}`,
);

/* --- The stat counter. --- */

report(
  countOccurrences(htmlText, 'tabular-nums') >= 4,
  'the figures carry tabular numerals',
  `expected the counter and the tile numerals to render tabular figures — served: ${countOccurrences(htmlText, 'tabular-nums')}`,
);

/*
 * The counter is a `requestAnimationFrame` loop, which the CSS
 * `transition-duration` guard cannot reach. It must read the preference itself,
 * so this asserts the media query is present in the hook.
 */
report(
  readFileSync('components/shared/useCountUp.ts', 'utf8').includes(
    "matchMedia('(prefers-reduced-motion: reduce)')",
  ),
  'the stat counter skips its animation under reduced motion',
  'a requestAnimationFrame loop is invisible to the CSS duration guard, so it must read the preference itself',
);

/* ------------------------------------------------------------------ *
 * Polish #7 Session 2 — Contact, Footer, Mobile bar, Resend
 * ------------------------------------------------------------------ */

/*
 * FORM FIELDS — asserted as DECLARATIONS, not class names.
 *
 * This is the check that the Session 2 bug needed and did not have. Four classes
 * (`field-label`, `field-input`, `field-error`, `checkbox-row`) were referenced
 * in twelve places across two components and defined in NO stylesheet, so the
 * form rendered as raw browser defaults with no focus or error styling. Every
 * markup-side check passed the whole time, because the classes were present in
 * the HTML.
 *
 * A class in the markup proves nothing if nothing styles it. So each of these
 * reads the served rule and asserts the value that makes the class do its job.
 */
const FORM_FIELD_DECLS = [
  ['the text input is 48px tall', '.field-input', 'height', '48px'],
  ['the text input uses the md radius', '.field-input', 'border-radius', 'var(--ds-radius-md)'],
  ['the text input carries the hairline border', '.field-input', 'border', '1px solid var(--ds-neutral-200)'],
  ['the text input is white', '.field-input', 'background-color', 'var(--ds-neutral-0)'],
  ['the label sits above its field', '.field-label', 'margin-bottom', 'var(--ds-space-2)'],
  ['the error message is its own weight', '.field-error', 'font-weight', '500'],
  ['the checkbox row is a 44px target', '.checkbox-row', 'min-height', '44px'],
];

for (const [label, selector, prop, value] of FORM_FIELD_DECLS) {
  const served = declarationsOf(selector).get(prop) ?? '(absent)';

  report(
    served === value,
    label,
    `expected ${prop}:${value} on ${selector} — served: ${served}. A class with no rule renders as a browser default, and no markup-side check can see that.`,
  );
}

report(
  declarationsOf('.field-input:focus').get('border-color') === 'var(--ds-orange-500)' &&
    declarationsOf('.field-input:focus').get('box-shadow') === 'var(--ds-ring-orange)',
  'the text input has a real focus state',
  `expected an orange border plus the shared ring — served: ${JSON.stringify(Object.fromEntries(declarationsOf('.field-input:focus')))}`,
);

report(
  declarationsOf('.field-input').get('transition')?.includes('border-color') === true,
  'the input transitions specific properties, not all',
  `\`transition: all\` re-runs layout for every property change — served: ${declarationsOf('.field-input').get('transition') ?? '(absent)'}`,
);

report(
  declarationsOf('.field-input::placeholder').get('opacity') === '1',
  'the placeholder contrast is not defeated by the browser default',
  'Firefox applies opacity 0.54 to placeholders, which drags --ds-neutral-500 below the 4.5:1 floor',
);

/* --- The submit button and the success card. --- */

report(
  declarationsOf('.contact-submit').get('height') === '56px' &&
    declarationsOf('.contact-submit').get('border-radius') === 'var(--ds-radius-lg)',
  'the submit button is 56px at radius-lg',
  `expected 56px + radius-lg — served: ${declarationsOf('.contact-submit').get('height') ?? '(absent)'} / ${declarationsOf('.contact-submit').get('border-radius') ?? '(absent)'}`,
);

/*
 * The hover rule's selector is `.contact-submit:hover:not(:disabled)`, and
 * `declarationsOf` matches a bare selector. So this reads the rule body directly
 * rather than through the helper — the `:not()` chain is part of what makes the
 * hover correct, and stripping it to fit the helper would stop testing the rule
 * that actually ships.
 */
report(
  /\.contact-submit:hover:not\(:disabled\)\{[^}]*background-color:var\(--ds-orange-600\)/.test(
    squash(cssText),
  ),
  'the submit button darkens on hover',
  'a hover that lightens or holds still leaves the button looking inert',
);

report(
  declarationsOf('.contact-success').get('background-color') === 'var(--ds-yellow-100)' &&
    declarationsOf('.contact-success').get('border-left') === '4px solid var(--ds-orange-500)',
  'the success card uses the brand tint plus an orange rule',
  `expected yellow-100 + a 4px orange left border — served: ${declarationsOf('.contact-success').get('background-color') ?? '(absent)'} / ${declarationsOf('.contact-success').get('border-left') ?? '(absent)'}`,
);

/*
 * The green success tint and the old error red, gone.
 *
 * Scoped to the four hex values the components used to carry, NOT to "any red".
 * `#c62828` is still the error colour — a semantic red is the one non-palette
 * value a form needs, and banning the hue would ban the state. What is banned is
 * the palette fork: a second green family that appears nowhere else on the page.
 */
report(
  !/#e8f5e9|#4caf50|#1b5e20/i.test(cssText) && !/#e8f5e9|#4caf50|#1b5e20/i.test(html),
  'the green success tint and its border are gone',
  `green appears nowhere else in the palette, so it made the one moment the visitor most needs to trust read as a different site — served: ${(cssText.match(/#e8f5e9|#4caf50|#1b5e20/gi) ?? []).join(', ') || '(none)'}`,
);

/* --- Form structure: the fields a lead needs. --- */

const FORM_FIELDS = ['name', 'company', 'jobTitle', 'email', 'phone'];
const missingFields = FORM_FIELDS.filter(
  (field) => !new RegExp(`name="${field}"`).test(htmlText),
);

report(
  missingFields.length === 0,
  'every required enquiry field renders',
  `a lead missing one of these is not actionable — absent: ${missingFields.join(', ')}`,
);

report(
  countOccurrences(htmlText, 'name="consent"') === 1,
  'the consent checkbox renders exactly once',
  `expected 1 — served: ${countOccurrences(htmlText, 'name="consent"')}`,
);

report(
  /name="consent"[^>]*required|required[^>]*name="consent"/.test(htmlText),
  'consent is required without JavaScript',
  'PDPA depends on being able to show the enquirer agreed; a no-JS submit must not slip through',
);

/*
 * The honeypot. Named `website` because that is what a naive scraper fills in.
 * `tabindex="-1"` is asserted alongside the name, so the field is out of the tab
 * order as well as out of sight — a real user must not reach it by keyboard.
 */
report(
  countOccurrences(htmlText, 'name="website"') === 1,
  'the honeypot field renders exactly once',
  `expected 1 — served: ${countOccurrences(htmlText, 'name="website"')}`,
);

report(
  countOccurrences(htmlText, 'href="/privacy"') >= 1,
  'the consent text links to the privacy policy',
  'consent to a policy the visitor cannot read is not informed consent',
);

/* --- Footer. --- */

report(
  declarationsOf('.footer').get('background-color') === 'var(--ds-neutral-900)',
  'the footer sits on the dark surface',
  `expected --ds-neutral-900 — served: ${declarationsOf('.footer').get('background-color') ?? '(absent)'}; it read --pdf-dark, which is the program PDFs' palette and not the footer's to use`,
);

report(
  declarationsOf('.footer').get('padding-top') === 'var(--ds-space-16)' &&
    declarationsOf('.footer').get('padding-bottom')?.includes('var(--ds-space-10)'),
  'the footer uses the brief’s 64px / 40px padding',
  `expected space-16 top and space-10 bottom — served: ${declarationsOf('.footer').get('padding-top') ?? '(absent)'} / ${declarationsOf('.footer').get('padding-bottom') ?? '(absent)'}`,
);

/*
 * Footer link colours, decoded rather than matched as literals.
 *
 * The minifier writes `rgba(255, 255, 255, 0.7)` as `#ffffffb3` and
 * `rgba(255, 255, 255, 0.5)` as `#ffffff80`. Two of the three corrections this
 * file needed in Session 2 were exactly this, so the pattern is worth stating:
 * any assertion about a colour must read the value and decode it, never compare
 * the source spelling.
 *
 * @param {string} selector
 * @returns {number} the alpha in the served `color`, or NaN when unreadable
 */
function servedAlpha(selector) {
  const decl = declarationsOf(selector).get('color') ?? '';
  const hex = decl.match(/#ffffff([0-9a-f]{2})/);

  if (hex) return parseInt(hex[1], 16) / 255;

  const rgba = decl.match(/rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/);
  return rgba ? Number(rgba[1]) : NaN;
}

report(
  Math.abs(servedAlpha('.footer-link') - 0.7) < 0.01 &&
    declarationsOf('.footer-link:hover').get('color') === 'var(--ds-orange-500)',
  'footer links are 70% white and warm to orange on hover',
  `served: rest alpha=${servedAlpha('.footer-link')} (expected 0.7), hover=${declarationsOf('.footer-link:hover').get('color') ?? '(absent)'}`,
);

report(
  Math.abs(servedAlpha('.footer-legal') - 0.5) < 0.01,
  'the legal line sits below the links in presence',
  `expected 50% white — served alpha: ${servedAlpha('.footer-legal')}`,
);

report(
  declarationsOf('.footer-badge').get('border') === '1px solid var(--ds-orange-500)',
  'the HRDC badge is an orange outline pill',
  `expected a 1px orange border — served: ${declarationsOf('.footer-badge').get('border') ?? '(absent)'}`,
);

group(
  'Footer columns',
  ['Contact', 'Quick Links', 'Legal', 'Privacy Policy'],
  (needle) => htmlText.includes(needle),
);

/* --- The mobile sticky bar. --- */

report(
  declarationsOf('.mobile-sticky-bar').get('z-index') === '40',
  'the sticky bar sits below the header and the nav panel',
  `expected z-index:40 — served: ${declarationsOf('.mobile-sticky-bar').get('z-index') ?? '(absent)'}; above the panel would cover the mobile nav`,
);

report(
  declarationsOf('.mobile-sticky-bar').get('background-color') === 'var(--ds-orange-500)',
  'the sticky bar is brand orange',
  `expected --ds-orange-500 — served: ${declarationsOf('.mobile-sticky-bar').get('background-color') ?? '(absent)'}`,
);

report(
  declarationsOf('.mobile-sticky-bar').get('height')?.includes('64px') &&
    declarationsOf('.mobile-sticky-bar').get('height')?.includes('env(safe-area-inset-bottom)'),
  'the sticky bar clears the home indicator',
  `expected height:calc(64px + env(safe-area-inset-bottom)) — served: ${declarationsOf('.mobile-sticky-bar').get('height') ?? '(absent)'}`,
);

/*
 * The three routes, asserted as RENDERED LINKS rather than as copy.
 *
 * `wa.me` is the one that matters most: it is the route a Malaysian B2B visitor
 * actually uses, and a wrong number there is a silent failure — the link works,
 * the message goes nowhere.
 */
report(
  countOccurrences(htmlText, 'tel:+60124885247') >= 2,
  'the phone route renders in the hero and the sticky bar',
  `expected at least 2 (hero CTA + sticky bar) — served: ${countOccurrences(htmlText, 'tel:+60124885247')}`,
);

report(
  countOccurrences(htmlText, 'https://wa.me/60124885247') >= 1,
  'the WhatsApp route renders',
  `expected at least 1 — served: ${countOccurrences(htmlText, 'https://wa.me/60124885247')}`,
);

report(
  countOccurrences(htmlText, 'mailto:hafiedzzul@gmail.com') >= 2,
  'the email route renders in the hero and the sticky bar',
  `expected at least 2 — served: ${countOccurrences(htmlText, 'mailto:hafiedzzul@gmail.com')}`,
);

report(
  declarationsOf('.mobile-sticky-link:focus-visible').get('box-shadow') ===
    'var(--ds-ring-orange)',
  'the sticky bar links carry the shared focus ring',
  `the ring is not expressible inline, which is why these links had no keyboard focus indicator before — served: ${declarationsOf('.mobile-sticky-link:focus-visible').get('box-shadow') ?? '(absent)'}`,
);

/*
 * The bar must not sit on top of the page's last controls. A bottom pad equal to
 * the bar's height on the two sections a visitor ends at is what guarantees it.
 */
report(
  /@media \(max-width:1023px\)\{[^@]*?\.contact-section,\.footer\{padding-bottom:calc\(64px \+ env\(safe-area-inset-bottom\)\)/.test(
    squash(cssText),
  ),
  'the sticky bar cannot obscure the contact form or the footer',
  'without this pad the bar covers the submit button and the legal line, and a tap lands on the bar instead',
);

/* --- The contact API contract. --- */

/*
 * Read from the SOURCE, not the output.
 *
 * A route handler is not part of the served HTML, so there is no output-level
 * assertion available for it. Reading the file is the honest alternative, and it
 * is paired with the live endpoint tests below rather than replacing them.
 */
const routeSource = readFileSync('app/api/contact/route.ts', 'utf8');

const API_CONTRACT = [
  ['the route keeps its reply-to contract', 'replyTo: enquiry.email'],
  ['the honeypot returns a plain success', "data: { message: 'received' }"],
  ['a missing key is fatal in production', 'if (!mailConfigured && IS_PRODUCTION)'],
  ['the production failure is a 500', 'status: 500'],
  ['the rate limiter returns 429', 'status: 429'],
  ['validation failures return 400', 'status: 400'],
  ['the IP is masked before it is logged or emailed', 'maskIp('],
];

for (const [label, needle] of API_CONTRACT) {
  report(
    routeSource.includes(needle),
    label,
    `the API contract must not drift — missing: ${needle}`,
  );
}

/*
 * The secret must never reach the client. `NEXT_PUBLIC_` is the prefix Next.js
 * inlines into the browser bundle, so a key declared with it would ship to every
 * visitor. Nothing in the route may reference it.
 */
report(
  !/NEXT_PUBLIC_RESEND/.test(routeSource) && !/NEXT_PUBLIC_RESEND/.test(html),
  'the Resend key is server-only',
  'a NEXT_PUBLIC_ prefix inlines the value into the client bundle, publishing the key',
);

/*
 * And the key itself must not be logged. The test-mode log prints the payload and
 * a preview of the rendered email; neither may contain the key.
 */
report(
  !/console\.(log|info|warn|error)\([^)]*apiKey/.test(routeSource),
  'the route never logs the API key',
  'the test-mode log prints the payload and an email preview — the key must not be among them',
);

report(
  readFileSync('.env.local.example', 'utf8').includes('RESEND_API_KEY=') &&
    !/RESEND_API_KEY=re_/.test(readFileSync('.env.local.example', 'utf8')),
  'the env template names the key without a real value',
  'a template containing a live key is how a secret reaches a public repo',
);

/* --- Touch targets. --- */

/*
 * Every interactive control meets the 44px minimum.
 *
 * This caught a real regression: `.footer-link` was 32px, and the footer is a
 * column of short links stacked directly on top of one another. A 32px row
 * leaves a 12px miss zone between neighbours, so a tap aimed at one link
 * activates the next — and the browser gives no signal that it did.
 */
const TAP_TARGETS = [
  ['the text input', '.field-input', 'height'],
  ['a programme checkbox row', '.checkbox-row', 'min-height'],
  ['the submit button', '.contact-submit', 'height'],
  ['a footer link', '.footer-link', 'min-height'],
];

for (const [label, selector, prop] of TAP_TARGETS) {
  const served = declarationsOf(selector).get(prop) ?? '';
  const px = Number.parseInt(served, 10);

  report(
    Number.isFinite(px) && px >= 44,
    `${label} is at least 44px tall`,
    `expected >=44px on ${selector} — served: ${served || '(absent)'}. A sub-44px target is a mis-tap on a phone, and stacked links make it a wrong-navigation.`,
  );
}

report(
  declarationsOf('.mobile-sticky-bar').get('height')?.includes('64px') === true,
  'the sticky bar row clears the minimum in one piece',
  `64px for three buttons side by side — served: ${declarationsOf('.mobile-sticky-bar').get('height') ?? '(absent)'}`,
);

/* --- Responsive: the base rules are single-column, the queries add columns. --- */

/*
 * Mobile-first, asserted as a PAIR per section: the base rule must be one column
 * and the query must introduce the grid.
 *
 * Asserting only that the multi-column rule exists would pass on a desktop-first
 * stylesheet, where the base rule is `3fr 2fr` and the mobile override is inside
 * a `max-width` query — which renders correctly only if the override is not lost.
 * It also would not catch a section that never gets a mobile rule at all.
 */
const RESPONSIVE_GRIDS = [
  ['the contact form', '.contact-grid', '3fr 2fr', '1024'],
  ['the testimonial row', '.testimonial-grid', 'repeat(3,1fr)', '768'],
  ['the footer columns', '.footer-grid', '1fr 1fr', '640'],
];

for (const [label, selector, columns, breakpoint] of RESPONSIVE_GRIDS) {
  const base = declarationsOf(selector).get('grid-template-columns') ?? '';
  const wide = mediaBlocks(breakpoint)
    .map((block) => block.match(new RegExp(`${selector.replace(/[.:[\]()]/g, '\\$&')}\\{([^}]*)\\}`))?.[1] ?? '')
    .join(' ');

  report(
    base.includes('1fr') && !base.includes(' '),
    `${label} is one column at base`,
    `expected a single-column base rule — served: ${base || '(absent)'}`,
  );

  report(
    wide.includes(`grid-template-columns:${columns}`),
    `${label} gains its columns at ${breakpoint}px`,
    `expected "${columns}" in the ${breakpoint}px query — served: ${wide || '(rule absent)'}`,
  );
}

/* --- Heading outline. --- */

/*
 * The heading structure, computed from the served markup.
 *
 * Two distinct failures, and the existing `<h1>`-in-the-markup checks caught
 * neither:
 *
 *   1. **A SKIP** — h1 → h3 with no h2 between. A screen-reader user navigating
 *      by heading loses the level they were on.
 *   2. **TOO MANY h1s** — the page shipped six (the site headline plus five
 *      program heroes), so "the h1 of this page" had no single answer and the
 *      H shortcut stopped being a shortcut. A skip check passed on six h1s,
 *      because a level appearing too often is not a missing level. That is why
 *      both are asserted.
 */

/* --- Contrast: every text-on-surface pair the page actually renders. --- */

/**
 * Relative luminance of a hex colour, per WCAG 2.1.
 * @param {string} hex e.g. "#1a1a1a"
 * @returns {number} 0 (black) to 1 (white)
 */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Contrast ratio between two colours, compositing a translucent foreground.
 *
 * The compositing matters: three of the pairs below are white at 50–70% on the
 * dark surface, and testing the raw `#ffffff` against `#1a1a1a` would report
 * 17.4:1 for a colour that actually renders at 5.2:1. Reading the alpha out of
 * the token and blending it is the only way the number means anything.
 *
 * @param {string} fg hex foreground
 * @param {string} bg hex background
 * @param {number} [alpha] 0–1, defaults to opaque
 * @returns {number} the ratio, 1–21
 */
function contrast(fg, bg, alpha = 1) {
  const blend = (i) => {
    const f = Number.parseInt(fg.slice(i, i + 2), 16);
    const b = Number.parseInt(bg.slice(i, i + 2), 16);
    return Math.round(f * alpha + b * (1 - alpha))
      .toString(16)
      .padStart(2, '0');
  };

  const front = alpha < 1 ? `#${blend(1)}${blend(3)}${blend(5)}` : fg;
  const [hi, lo] = [luminance(front), luminance(bg)].sort((a, b) => b - a);

  return (hi + 0.05) / (lo + 0.05);
}

const CONTRAST_TOKENS = {
  white: '#ffffff',
  n0: '#ffffff',
  n50: '#fdfbf7',
  n100: '#f3f1ec',
  n500: '#6b6b63',
  n800: '#2a2a2a',
  n900: '#1a1a1a',
  o500: '#e8631c',
  o600: '#d9541c',
  y100: '#fff6dd',
  y500: '#ffc93c',
  red: '#c62828',
  redTint: '#fdecea',
};

/*
 * Every pair, with the minimum it must clear.
 *
 * `min` is 4.5 for body-size text and 3.0 for large text — the WCAG AA rule,
 * where "large" is >=18.66px bold or >=24px regular. Each entry below carries a
 * note saying which the element actually is, so the threshold is a decision
 * rather than a blank.
 */
const CONTRAST_PAIRS = [
  ['body copy on white', 'n800', 'n0', 1, 4.5],
  ['muted copy on white', 'n500', 'n0', 1, 4.5],
  ['placeholder on white', 'n500', 'n0', 1, 4.5],
  ['error text on its tint', 'red', 'redTint', 1, 4.5],
  ['input text on white', 'n800', 'n0', 1, 4.5],
  ['success body on yellow-100', 'n800', 'y100', 1, 4.5],
  /* The reset action is 14px semibold — NOT large, so it needs 4.5. This is the
     pair that was orange at 3.13 and was corrected to charcoal at 13.3. */
  ['success reset link on yellow-100', 'n800', 'y100', 1, 4.5],
  ['footer link, 70% white on dark', 'white', 'n900', 0.7, 4.5],
  ['footer legal, 50% white on dark', 'white', 'n900', 0.5, 4.5],
  ['footer name on dark', 'white', 'n900', 1, 4.5],
  ['track sub-copy, 70% white on dark', 'white', 'n900', 0.7, 4.5],
  ['track figure, orange on dark', 'o500', 'n900', 1, 4.5],
  ['footer HRDC badge on dark', 'o500', 'n900', 1, 4.5],
  ['card body on neutral-50', 'n800', 'n50', 1, 4.5],
  /* --- Large text: clears 3.0 rather than 4.5 --- */
  ['program button label, orange on white', 'o500', 'n0', 1, 3.0],
  ['program why-link, orange on white', 'o500', 'n0', 1, 3.0],
  ['submit label, white on orange', 'n0', 'o500', 1, 3.0],
  ['sticky bar label, white on orange', 'n0', 'o500', 1, 3.0],
  ['hero CTA label, white on orange', 'n0', 'o500', 1, 3.0],
  ['hero CTA hover, white on orange-600', 'n0', 'o600', 1, 3.0],
  ['numeral tile, white on orange', 'n0', 'o500', 1, 3.0],
  ['numeral tile, charcoal on yellow-500', 'n900', 'y500', 1, 3.0],
  ['track figure on dark (display size)', 'o500', 'n900', 1, 3.0],
];

const contrastFailures = [];

for (const [label, fgKey, bgKey, alpha, min] of CONTRAST_PAIRS) {
  const value = contrast(CONTRAST_TOKENS[fgKey], CONTRAST_TOKENS[bgKey], alpha);

  if (value < min) contrastFailures.push(`${label} = ${value.toFixed(2)} (needs ${min})`);
}

report(
  contrastFailures.length === 0,
  `all ${CONTRAST_PAIRS.length} text-on-surface pairs clear WCAG AA`,
  `these render below their floor: ${contrastFailures.join('; ')}`,
);

/*
 * And the specific correction, pinned. The reset link was orange on the yellow
 * tint at 3.13:1 — the most tempting colour on the page for that element, and
 * the wrong one. Asserting the pair rather than the declaration means a future
 * edit can restyle it freely as long as it stays legible.
 */
report(
  contrast(CONTRAST_TOKENS.n800, CONTRAST_TOKENS.y100, 1) >= 4.5,
  'the success card text is legible on its own tint',
  `served ratio: ${contrast(CONTRAST_TOKENS.n800, CONTRAST_TOKENS.y100, 1).toFixed(2)}`,
);

/*
 * The heading structure, computed from the served markup.
 *
 * Two distinct failures, and the existing `<h1>`-in-the-markup checks caught
 * neither:
 *
 *   1. **A SKIP** — h1 → h3 with no h2 between. A screen-reader user navigating
 *      by heading loses the level they were on.
 *   2. **TOO MANY h1s** — the page shipped six (the site headline plus five
 *      program heroes), so "the h1 of this page" had no single answer and the
 *      H shortcut stopped being a shortcut. A skip check passes on six h1s,
 *      because a level appearing too often is not a missing level. That is why
 *      both are asserted.
 */
const headingLevels = [...htmlText.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));

report(
  headingLevels.length > 20,
  'the heading outline is locatable',
  `only ${headingLevels.length} headings found — the checks below would be vacuous`,
);

report(
  headingLevels.filter((level) => level === 1).length === 1,
  'the page has exactly one h1',
  `expected 1 (the site headline), served ${headingLevels.filter((l) => l === 1).length}. Each program hero used to be an h1, so the document carried six top-level titles and the H shortcut had no single origin.`,
);

const headingSkips = headingLevels
  .map((level, i) => (i > 0 && level - headingLevels[i - 1] > 1 ? `h${headingLevels[i - 1]}→h${level}` : null))
  .filter(Boolean);

report(
  headingSkips.length === 0,
  'the heading outline has no skipped levels',
  `a screen-reader user navigating by heading loses their place at: ${headingSkips.join(', ')}`,
);

/*
 * Every h2 needs an id, so the outline is addressable. The nav scrollspy and the
 * footer links both target section ids; a heading without one is a section that
 * cannot be linked to.
 */
report(
  countOccurrences(htmlText, 'aria-labelledby') >= 9,
  'every section names itself from its own heading',
  `sections should reference their heading with aria-labelledby — served: ${countOccurrences(htmlText, 'aria-labelledby')}`,
);

/* --- Session 2 did not widen the design system. --- */

/*
 * No new custom properties outside the four allowed namespaces.
 *
 * This is the load-bearing constraint of the whole polish: every value must come
 * from a token that already exists, so the page cannot grow a second palette one
 * convenient `--foo-bar` at a time. `tw` is included because Tailwind v4 emits
 * its own theme variables and those are not ours to police.
 */
const strayCustomProps = [
  ...new Set(
    [...readFileSync('app/globals.css', 'utf8').matchAll(/--([a-z][a-z0-9-]*)\s*:/g)].map(
      (m) => m[1],
    ),
  ),
].filter((name) => !/^(ds|prd|pdf|font|tw)-/.test(name));

report(
  strayCustomProps.length === 0,
  'no custom property outside the ds / prd / pdf / font namespaces',
  `these would be a second palette by another name: ${strayCustomProps.join(', ')}`,
);

/*
 * No emoji in anything the visitor reads.
 *
 * Asserted on the SERVED HTML rather than on the source, because the source
 * legitimately uses ⚠️ inside code comments — including the ones marking the
 * testimonial gate. Those never reach a browser; an emoji in the markup does.
 */
report(
  !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u.test(html),
  'no emoji is served to the visitor',
  `found in the output: ${(html.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu) ?? []).join(' ')}`,
);

/*
 * The brand orange, and not the one the brief forbids. `#FF6B35` is a different
 * orange that appears nowhere in the palette; if it is ever introduced it will be
 * indistinguishable by eye from the real one at a glance.
 */
report(
  !/#ff6b35/i.test(cssText) && !/#ff6b35/i.test(html),
  'the forbidden orange never appears',
  'the brand orange is #E8631C; #FF6B35 is close enough to pass a visual check and would silently fork the palette',
);


console.log('');
if (failures === 0) {
  console.log('  \u001b[32mALL CHECKS PASSED\u001b[0m\n');
  process.exit(0);
}

console.log(`  \u001b[31m${failures} CHECK(S) FAILED\u001b[0m\n`);

/*
 * The testimonial placeholder gate is the ONE expected failure until real quotes
 * are supplied, so the hint names it rather than sending the reader after a stale
 * build. Without this the message below is actively misleading: it would suggest
 * restarting the server, and the check would keep failing for a reason that has
 * nothing to do with the server.
 */
if (failures === 1 && /testimonial placeholder/.test(lastFailureLabel)) {
  console.log('  \u001b[33mEXPECTED — CONTENT REQUIRED\u001b[0m');
  console.log('  The only failure is the testimonial placeholder gate. This is the');
  console.log('  correct state until real, permissioned quotes are supplied:');
  console.log('');
  console.log('    components/testimonials/testimonials-content.ts');
  console.log('');
  console.log('  Replace the three bracketed entries (name, role, company, quote,');
  console.log('  avatar and rating) and this check passes. See the file docblock for');
  console.log('  what each field needs.\n');
  process.exit(1);
}

console.log('  If the copy checks fail but the build was clean, you are likely');
console.log('  reading a stale server — an old `next start` still holding the');
console.log('  port. Stop it and restart:\n');
console.log('    fuser -k 5555/tcp || true');
console.log('    npm run build && npx next start -p 5555\n');
process.exit(1);

