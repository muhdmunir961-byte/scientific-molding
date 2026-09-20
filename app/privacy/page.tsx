import type { Metadata } from 'next';
import Link from 'next/link';

/**
 * Privacy Policy. Minimal placeholder page.
 *
 * ⚠️ REQUIRES LEGAL REVIEW BEFORE LAUNCH.
 *
 * This is a starting point covering what the site actually does — it collects
 * an enquiry through a form and stores a newsletter subscription. It is not
 * legal advice and has not been reviewed by a lawyer.
 *
 * Under Malaysia's PDPA (Personal Data Protection Act 2010) a notice must
 * state, at minimum: what data is collected, the purpose, how it is used and
 * disclosed, how to access and correct it, and how to contact the data user.
 * Each is marked `TODO(user)` below where only the business can answer.
 *
 * The site collects exactly two things:
 *   1. Contact-form submissions — name, company, job title, email, phone,
 *      optional programme interests, participants, dates, message, plus a
 *      masked IP for abuse detection.
 *   2. Newsletter subscribers — email, language, source, masked IP.
 *
 * Nothing else: no analytics, no tracking pixels, no advertising.
 */

export const metadata: Metadata = {
  title: 'Privacy Policy — Scientific Molding Training Series',
  description:
    'How enquiries and newsletter subscriptions submitted through this site are handled.',
  robots: { index: false, follow: true },
};

/**
 * One labelled section of the policy.
 * @param props.title heading
 * @param props.children body paragraphs
 */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <h2 className="text-xl font-extrabold leading-tight text-[var(--pdf-charcoal)] sm:text-2xl">
        {title}
      </h2>
      <div
        className="mt-4 flex flex-col gap-4 text-base leading-relaxed"
        style={{ color: 'var(--pdf-warm-grey)', textWrap: 'pretty' }}
      >
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main
      className="mx-auto w-full max-w-[70ch] px-8 py-16 sm:px-12 lg:py-24"
      style={{ backgroundColor: 'var(--pdf-white)' }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pdf-orange)]">
        Legal
      </p>

      <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-[var(--pdf-charcoal)] sm:text-[2.5rem]">
        Privacy Policy
      </h1>

      <p className="mt-4 text-sm" style={{ color: 'var(--pdf-warm-grey)' }}>
        Last updated: <time dateTime="2026-09-20">20 September 2026</time>
      </p>

      <Section title="What we collect">
        <p>
          When you submit the enquiry form we collect the details you enter:
          your name, company, job title, email address, phone number, any
          programmes you select, the number of participants, your preferred
          dates, and your message.
        </p>
        <p>
          When you subscribe to the newsletter we collect your email address and
          the language you were reading the site in.
        </p>
        <p>
          We also record a partially masked IP address with each submission.
          This is used only to detect and limit automated abuse of the form, and
          the final portion of the address is not stored.
        </p>
      </Section>

      <Section title="Why we collect it">
        <p>
          Enquiry details are used to prepare and send you a training proposal,
          and to correspond with you about it. Newsletter details are used only
          to send occasional updates about programmes and articles.
        </p>
        <p>
          We do not use your details for automated decision-making or profiling.
        </p>
      </Section>

      <Section title="Who we share it with">
        <p>
          {/* TODO(user): confirm every processor actually in use. */}
          Enquiry emails are delivered through <strong>Resend</strong>, an email
          delivery service, so the content of your enquiry passes through their
          infrastructure. No other third party receives your data.
        </p>
        <p>
          We do not sell, rent, or trade personal data, and this site runs no
          advertising or analytics trackers.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          {/* TODO(user): decide and state a retention period. PDPA expects data
              to be kept no longer than necessary for the stated purpose. */}
          Enquiry correspondence is retained for as long as needed to manage the
          training engagement. Newsletter subscriptions are retained until you
          unsubscribe.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You may ask to see the personal data we hold about you, ask us to
          correct it, or ask us to delete it. You may unsubscribe from the
          newsletter at any time. To make any of these requests, contact us
          using the details below.
        </p>
      </Section>

      <Section title="Cookies and local storage">
        <p>
          This site sets no advertising or analytics cookies. Your language
          preference is stored in your browser&rsquo;s local storage so the site
          remembers it between visits. It is never transmitted to us.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          {/* TODO(user): add a postal address if one should be listed. */}
          Ts. Mohd Hafiedzzul Bin Malek Riduan
          <br />
          Email:{' '}
          <a
            href="mailto:hafiedzzul@gmail.com"
            className="underline"
            style={{ color: 'var(--pdf-orange)' }}
          >
            hafiedzzul@gmail.com
          </a>
          <br />
          Phone:{' '}
          <a
            href="tel:+60124885247"
            className="underline"
            style={{ color: 'var(--pdf-orange)' }}
          >
            +60 12-488 5247
          </a>
        </p>
      </Section>

      <p className="mt-16">
        <Link
          href="/"
          className="text-sm font-bold underline"
          style={{ color: 'var(--pdf-orange)' }}
        >
          &larr; Back to the site
        </Link>
      </p>
    </main>
  );
}

