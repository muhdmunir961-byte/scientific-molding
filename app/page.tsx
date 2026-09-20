import EntranceLoader from '@/components/EntranceLoader';
import About from '@/components/about/About';
import Hero from '@/components/hero/Hero';
import ProgramFundamentals from '@/components/programs/ProgramFundamentals';
import ProgramMaterials from '@/components/programs/ProgramMaterials';
import ProgramProcessDevelopment from '@/components/programs/ProgramProcessDevelopment';
import ProgramDefectTroubleshooting from '@/components/programs/ProgramDefectTroubleshooting';
import ProgramPathway from '@/components/programs/ProgramPathway';
import Why from '@/components/why/Why';
import TrackRecord from '@/components/track-record/TrackRecord';
import Contact from '@/components/contact/Contact';
import Footer from '@/components/footer/Footer';
import NavChrome from '@/components/nav/NavChrome';

/**
 * Home page.
 *
 * Composition, in scroll order — matching PRD Section 4 (Information
 * Architecture), which is explicit about the order:
 *
 *   1. `#hero`                Hero
 *   2. `#about`               About the Trainer
 *   3. `#fundamentals` …      the five programs, A → E (`#pathway` last)
 *   4. `#why`                 Why Scientific Molding
 *   5. `#track-record`        Track Record
 *   6. `#contact`             Request a Proposal
 *   7. —                        Footer (no anchor; the end of the page)
 *
 * `#why` sits AFTER the programs, not before: the PRD lists it as a
 * "cross-cutting problem/benefit summary", which only reads as a summary once
 * the visitor has seen the programs it summarises.
 *
 * ── Why only the Hero is inside the loader ──────────────────────────
 * Only the Hero is above the fold and therefore part of the entrance
 * choreography. Everything below it uses `<ScrollReveal>` internally: an
 * observer that fades each block in on first view. Wrapping below-the-fold
 * sections in the loader would delay their reveal for a visitor who has already
 * scrolled to them, and would re-run the burn whenever this route is entered.
 *
 * ── Where the loader lives, and why ─────────────────────────────────
 * The loader wraps content HERE, in `page.tsx`, rather than in `layout.tsx`.
 *
 * `layout.tsx` does not remount between client-side navigations: it persists
 * across route changes. Mounting a refresh animation there would replay it on
 * every in-app link click, which is not what "plays on every page refresh"
 * means. In `page.tsx` the component mounts when the route is entered fresh,
 * which is exactly a refresh — and it stays out of the way for soft navigation.
 *
 * ── Surface alternation ─────────────────────────────────────────────
 * The dark program heroes separate the programs visually; the light bodies
 * underneath alternate so no two adjacent sections merge:
 *
 *   About                    --prd-white      (white)
 *   Program A body           off-white
 *   Program B body           white
 *   Program C body           off-white
 *   Program D body           white
 *   Program E body           off-white
 *   Why                      --pdf-white      (white)
 *   Track Record             --prd-offwhite   (warm off-white)
 *   Contact                  --pdf-white      (white)
 *   Footer                   --pdf-dark       (dark, matching program heroes)
 *
 * Note the two white tokens are not interchangeable: About and Track Record
 * follow the PRD 13.1 palette, while Why and Contact follow the PDF palette
 * along with the programs. The values happen to match; the tokens do not.
 */
export default function HomePage() {
  return (
    <>
      <EntranceLoader>
        <Hero />
      </EntranceLoader>
      <NavChrome />
      <About />
      <ProgramFundamentals />
      <ProgramMaterials />
      <ProgramProcessDevelopment />
      <ProgramDefectTroubleshooting />
      <ProgramPathway />
      <Why />
      <TrackRecord />
      <Contact />
      <Footer />
    </>
  );
}
