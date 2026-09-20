/**
 * CredentialList — the trainer's credentials, PRD Section 5.2.
 *
 * ── Markup: a real <ul> ─────────────────────────────────────────────
 * This is a list of peer items, so it is a `<ul>` of `<li>`. A screen reader
 * announces "list, 7 items" and lets the user jump item by item; a stack of
 * `<div>`s loses that entirely. The Web Interface Guidelines are explicit:
 * use semantic HTML before reaching for ARIA.
 *
 * ── Icons ───────────────────────────────────────────────────────────
 * Each icon is decorative — the credential text already carries the meaning.
 * So every icon is `aria-hidden`, otherwise a screen reader would announce a
 * meaningless graphic name before each item.
 *
 * ── These rows are interactive ───────────────────────────────────────
 * A credential row responds to hover: the row warms and lifts 1px, and its
 * icon tile inverts to solid orange. That is the same response language the
 * Hero's stat cards use, so the page has one hover behaviour rather than one
 * per section (docs/design-system.md, "card hover lift").
 *
 * Because the row moves on hover it is `tabIndex={0}`. A hover-only response
 * is invisible to anyone navigating by keyboard, and an element that visibly
 * reacts to a pointer but not to focus is the classic half-built control. It
 * is focusable, not clickable: there is no `role` and no key handler, because
 * nothing happens on activation and claiming otherwise would be a lie.
 *
 * ── Tap and reading order ───────────────────────────────────────────
 * Icon and text sit in one flex row so there is no dead zone between them, and
 * the text is allowed to wrap: one credential is 54 characters and will wrap to
 * two lines on a narrow phone.
 */

import {
  Award,
  BadgeCheck,
  ClipboardCheck,
  Factory,
  Gauge,
  GraduationCap,
  Presentation,
  type LucideIcon,
} from 'lucide-react';

import { TRAINER_CREDENTIALS } from './about-content';

/**
 * Map the icon name stored in the content module to its component.
 *
 * Kept as an explicit map rather than a dynamic lookup so the bundler can
 * tree-shake: importing all of `lucide-react` would ship several thousand
 * icons to render seven.
 */
const ICONS: Record<string, LucideIcon> = {
  'badge-check': BadgeCheck,
  'graduation-cap': GraduationCap,
  award: Award,
  gauge: Gauge,
  factory: Factory,
  presentation: Presentation,
  'clipboard-check': ClipboardCheck,
};

/*
 * `gap-2` rather than the old `gap-4`: the rows now have their own padding, so
 * a 16px gap between them plus 8px of padding each side is 32px of dead space
 * — twice what the 8px grid wants between peers. 8px gap plus 8px padding
 * gives 24px, and the rows read as a list rather than a stack of loose items.
 */
export default function CredentialList() {
  return (
    <ul className="mt-8 flex list-none flex-col gap-2 p-0">
      {TRAINER_CREDENTIALS.map((credential) => {
        const Icon = ICONS[credential.icon] ?? BadgeCheck;

        return (
          <li
            key={credential.label}
            tabIndex={0}
            className="credential-item -mx-3 flex items-start gap-3"
          >
            <span
              className="credential-icon flex h-8 w-8 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              {/* Icon colour is `currentColor`, inherited from
                  `.credential-icon`, so the tile's hover can change the glyph
                  and its background together. Passing `color="var(--…)"`
                  directly would freeze the glyph against the tile it sits on. */}
              <Icon size={16} strokeWidth={2.25} />
            </span>

            <span className="min-w-0 pt-1 text-body text-[var(--ds-neutral-800)] [text-wrap:pretty]">
              {credential.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
