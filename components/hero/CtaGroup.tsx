/**
 * CtaGroup — primary proposal CTA plus the two direct contact routes.
 *
 * ── Colour and contrast ─────────────────────────────────────────────
 * The brief specifies orange `#F07C23` with a hover to yellow `#FFC93C`.
 * White text on that yellow is roughly 1.9:1 — far below the 4.5:1 floor, so a
 * yellow hover with white text would fail WCAG AA on the most important
 * control on the page.
 *
 * The hover therefore flips the label to the dark ink token on yellow
 * (~10.5:1). The colour change the brief asks for is preserved exactly; only
 * the text colour moves, and only for the duration of the hover.
 *
 * ── The secondary CTAs ──────────────────────────────────────────────
 * Phase 4B restyled these to the brief's outline treatment: a 2px orange
 * ring, orange label, filling to `--ds-orange-50` on hover, at the pill
 * radius. The previous version was a bordered white card carrying a warm
 * shadow on hover — a second card, competing with the stat strip directly
 * above it.
 *
 * The styles live on `.cta-secondary` in `globals.css` rather than here so
 * that all three states (rest, hover, focus-visible) are declared together
 * at one specificity. As inline styles they could only ever express the
 * first, which is why this control had no focus state of its own.
 *
 * ── Why the CTAs are anchors, not buttons ───────────────────────────
 * They navigate (to `tel:`, `mailto:`) or scroll to a section. An anchor gets
 * middle-click, Cmd/Ctrl-click and "copy link address" for free; a button with
 * an onClick handler gets none of that. The Web Interface Guidelines are
 * explicit on this point.
 */

import { HERO_CONTACT, HERO_CTA, HERO_CTA_TARGET } from './hero-content';

const STAGGER_CTA_MS = 320;

export default function CtaGroup() {
  return (
    <div
      className="content-reveal mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center"
      style={{ animationDelay: `calc(1750ms + ${STAGGER_CTA_MS}ms)` }}
    >
      <PrimaryCta />
      <ContactCta
        href={HERO_CONTACT.phoneHref}
        label={HERO_CTA.call}
        value={HERO_CONTACT.phoneDisplay}
        icon={<PhoneIcon />}
      />
      <ContactCta
        href={HERO_CONTACT.emailHref}
        label={HERO_CTA.email}
        value={HERO_CONTACT.emailDisplay}
        icon={<MailIcon />}
      />
    </div>
  );
}

/**
 * The primary action.
 *
 * PRD Section 5.1: `Request a Customised Proposal` "(scrolls to `#contact`)" —
 * so `#contact` is the PRD's own destination, not a placeholder guess. The
 * section is built in a later phase; until then the anchor simply does nothing.
 *
 * PRD Section 13.1 lists an optional "Orange → Yellow diagonal gradient
 * `#F07C23 → #FFC93C` for hero banner and primary CTA buttons". That gradient
 * is applied here, on the single most important control in the hero.
 *
 * The hover colour swap lives in `globals.css` as `.cta-primary` rather than a
 * Tailwind `hover:` pair, because the background and the label colour have to
 * change together to stay legible — two coordinated values, not one.
 */
function PrimaryCta() {
  return (
    <a
      href={HERO_CTA_TARGET}
      className="cta-primary group inline-flex min-h-[56px] w-full items-center justify-center gap-2 px-8 text-base font-bold transition-[background-color,color,box-shadow,transform] duration-200 active:translate-y-0 sm:w-auto"
    >
      {HERO_CTA.primary}
      <ArrowIcon />
    </a>
  );
}


/**
 * A secondary contact route.
 *
 * The phone number and email address are part of the label, not hidden behind
 * it: a visitor deciding whether to call wants to see the number first, and
 * this is the only place in the hero where that information can surface
 * without a separate contact block.
 *
 * The whole row is one hit target — no dead zone between the icon and the text.
 *
 * @param props.href   destination (`tel:` or `mailto:`)
 * @param props.label  the PRD action label
 * @param props.value  the visible number or address
 * @param props.icon   decorative leading icon
 */
function ContactCta({
  href,
  label,
  value,
  icon,
}: {
  href: string;
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="cta-secondary group inline-flex min-h-[56px] w-full items-center gap-4 px-4 text-left sm:w-auto"
    >
      <span aria-hidden="true" className="cta-secondary-icon flex h-8 w-8 shrink-0 items-center justify-center">
        {icon}
      </span>

      <span className="flex min-w-0 flex-col">
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[var(--ds-neutral-500)]">
          {label}
        </span>
        <span className="truncate text-sm font-semibold text-[var(--ds-neutral-900)]">
          {value}
        </span>
      </span>
    </a>
  );
}

/* ------------------------------------------------------------------ *
 * Icons — decorative, so every one is aria-hidden
 * ------------------------------------------------------------------ */

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 transition-transform duration-200 group-hover:translate-x-1"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}
