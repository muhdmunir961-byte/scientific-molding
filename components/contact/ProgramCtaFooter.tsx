/**
 * ProgramCtaFooter — the Contact section's ONE big CTA.
 *
 * ── Why this exists ─────────────────────────────────────────────────
 * Each of the five programs used to close with its own dark CTA panel: a
 * headline, a body line, three buttons and a sign-off. Five panels, 24 lines of
 * near-identical copy, all arriving just before the visitor reached the section
 * that actually does the job.
 *
 * The panels are gone from the program bodies, but the COPY is not deleted — it
 * is collected here, once, at the point of decision. Each program's headline is
 * still on the page, in its own words, and each one still links into the form
 * with that programme pre-ticked. A decision to enquire is made once, at the
 * form; repeating the invitation above every program does not add a second
 * chance to convert — it teaches the visitor that the button is furniture.
 *
 * ── Polish #7 — this IS the page's one big CTA ──────────────────────
 * It was previously the same list of five entries in an unemphasised block that
 * sat above the form. The brief asks for the "Request Proposal" big CTA exactly
 * once, in Contact — so this block carries that weight now: the orange panel,
 * one heading, and the five programme headlines with their own request links.
 * The program bodies keep only the small outline button.
 *
 * ── Why the entries are not buttons ─────────────────────────────────
 * Each entry is a headline plus its own link, not a button, because the five
 * headlines are different lengths and five pill buttons of five different widths
 * in one panel is noise. The link is the affordance; the headline is the
 * context that tells the visitor which programme they are requesting.
 */

import { PROGRAM_CTA_FOOTERS } from '../programs/program-cta-content';

export default function ProgramCtaFooter() {
  return (
    <div className="program-cta-footer">
      <h3 className="program-cta-footer-heading">
        Request a Proposal for Any Programme
      </h3>

      <ul className="program-cta-footer-list">
        {PROGRAM_CTA_FOOTERS.map((entry) => (
          <li key={entry.slug} className="program-cta-footer-item">
            <p className="program-cta-footer-headline">{entry.headline}</p>

            <p className="program-cta-footer-body">{entry.body}</p>

            <a
              href={`#contact?program=${entry.slug}`}
              className="program-cta-footer-link"
            >
              {entry.label}
              <span aria-hidden="true"> →</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
