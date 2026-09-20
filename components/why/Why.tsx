/**
 * §5.4 — Why Scientific Molding, a cross-cutting summary.
 *
 * ── Why a custom layout, not `BeforeAfterTable` ─────────────────────
 * `BeforeAfterTable` renders paired *rows*: one Before cell beside its matching
 * After cell. This section pairs nothing — four problems sit opposite four
 * shifts, and problem 1 does not become shift 1. Forcing it into that component
 * would imply a one-to-one mapping the copy does not claim.
 *
 * So the two columns are parallel lists, each with its own heading, and the
 * pairing is the column itself. The block carries one accessible description
 * via `role="group"` + `aria-label`, and each column is a real `<ol>` because
 * the numerals are meaningful order.
 *
 * ── Icons ───────────────────────────────────────────────────────────
 * Resolved through an explicit map rather than a dynamic import, so the bundler
 * tree-shakes. Importing all of `lucide-react` would ship several thousand
 * icons to render eight.
 */

import {
  AlertCircle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

import ScrollReveal from '../about/ScrollReveal';
import {
  WHY_CAPTION,
  WHY_HERO,
  WHY_ID,
  WHY_LABELS,
  WHY_PROBLEMS,
  WHY_SHIFTS,
} from './why-content';

/**
 * Icon lookup for the eight items.
 *
 * The arrows signal direction ("getting worse" / "getting better"); the circles
 * flag attention and completion. Repeating one icon eight times would be
 * decoration rather than a cue.
 */
const ICONS: Record<string, LucideIcon> = {
  'trending-down': TrendingDown,
  'trending-up': TrendingUp,
  'alert-circle': AlertCircle,
  'check-circle': CheckCircle,
};

export default function Why() {
  return (
    <section
      id={WHY_ID}
      aria-labelledby={`${WHY_ID}-heading`}
      className="why-section"
      data-why-root="why"
    >
      <div
        aria-hidden="true"
        className="hero-grid hero-grid-mask pointer-events-none absolute inset-0 -z-10 why-grid"
      />

      <div className="container why-container">
        <ScrollReveal>
          <header className="why-hero">
            <p className="eyebrow why-hero-eyebrow">{WHY_HERO.eyebrow}</p>

            <h2 id={`${WHY_ID}-heading`} className="text-h2 why-hero-title">
              {WHY_HERO.title}
            </h2>

            <p className="text-body why-hero-subcopy">{WHY_HERO.subcopy}</p>
          </header>
        </ScrollReveal>

        {/*
         * One group describing the whole comparison, so a screen reader meets
         * "four problems against four shifts" once rather than inferring it
         * from two unrelated lists.
         */}
        <div
          role="group"
          aria-label={WHY_CAPTION}
          className="why-beforeafter-grid"
        >
          <ComparisonColumn
            heading={WHY_LABELS.beforeHeading}
            subline={WHY_LABELS.beforeSubline}
            variant="before"
            items={WHY_PROBLEMS}
          />
          <ComparisonColumn
            heading={WHY_LABELS.afterHeading}
            subline={WHY_LABELS.afterSubline}
            variant="after"
            items={WHY_SHIFTS}
            delayMs={80}
          />
        </div>
      </div>
    </section>
  );
}

/** One item in the comparison; shared shape for both columns. */
interface ComparisonItem {
  readonly number: string;
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

/**
 * One column of the comparison.
 *
 * The two columns differ only by heading, sub-line, surface and reveal delay,
 * so they share one component. Duplicating the markup for a four-line
 * difference is how the two sides drift apart.
 */
function ComparisonColumn({
  heading,
  subline,
  variant,
  items,
  delayMs = 0,
}: {
  heading: string;
  subline: string;
  variant: 'before' | 'after';
  items: readonly ComparisonItem[];
  delayMs?: number;
}) {
  return (
    <ScrollReveal delayMs={delayMs}>
      <div
        className={`why-col why-col-${variant}`}
        data-why-column={variant}
      >
        <h3 className="why-column-heading">{heading}</h3>

        <p className="text-body-sm why-subline">{subline}</p>

        <ol className="why-list">
          {items.map((item) => (
            <Item key={item.number} {...item} />
          ))}
        </ol>
      </div>
    </ScrollReveal>
  );
}

/**
 * One numbered item.
 *
 * The tile is solid orange on both columns so the two read as one component
 * family; the column surface carries the before/after distinction.
 *
 * The description is charcoal on both, not warm grey: warm grey on the yellow
 * tint measures ~3.8:1, below the 4.5:1 floor for body text.
 *
 * ── Where the colours live ──────────────────────────────────────────
 * Nothing here is passed a colour. The icon takes its colour from
 * `.why-col-before .why-item-icon` / `.why-col-after .why-item-icon`, so the
 * two columns cannot drift apart and the values are themeable from the
 * stylesheet. The size and stroke width are the only remaining inline props,
 * and both are geometry rather than palette — lucide takes them as props, not
 * as CSS, so they cannot move to a class.
 */
function Item({ number, icon, title, description }: ComparisonItem) {
  const Icon = ICONS[icon] ?? AlertCircle;

  return (
    <li className="why-item">
      <span aria-hidden="true" className="why-numeral-tile">
        {number}
      </span>

      <div className="why-item-body">
        <div className="why-item-head">
          <Icon
            size={24}
            strokeWidth={2.5}
            aria-hidden="true"
            className="why-item-icon"
          />
          <h4 className="text-h4 why-item-title">{title}</h4>
        </div>

        <p className="text-body-sm why-item-description">{description}</p>
      </div>
    </li>
  );
}
