# Scientific Molding Training Landing Page

Production landing page for the Scientific Molding Training Series — 7 in-house
modules for injection molding engineers.

**Trainer:** Ts. Mohd Hafiedzzul Bin Malek Riduan

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript strict mode
- Tailwind CSS 4 (CSS-first, no JS config)
- Framer Motion
- Resend (contact form email)
- Lucide React (icons)

## Page Sections

1. **Hero** — entrance animation (burn-out), two-tone headline, animated stat strip, CTAs, hero image slot
2. **About** — trainer bio (60/40), credentials, track record, portrait + session gallery
3. **Programs** — 5 program sections (Fundamentals, Materials, Process Development, Defect Troubleshooting, Pathway)
4. **Why Scientific Molding** — the one canonical before/after comparison
5. **Track Record** — dark trust section: ranked stats, HRDC badge, credentials grid
6. **Testimonials** — participant quotes ⚠️ **CONTENT REQUIRED — testimonials from user** (see `components/testimonials/testimonials-content.ts`; every string is a bracketed placeholder and must not be published as-is)
7. **Contact** — the one big CTA, form with validation, Resend integration, direct contact links
8. **Footer** — links, legal, compliance

### Images to upload

The page renders six image positions through `<ImageSlot>`, which shows a brand
gradient until the file exists. See **Images Required** below for the paths and
dimensions — dropping the files into `public/images/` is the only step needed.

## Navigation

- Sticky header with scrollspy
- Mobile hamburger + slide-in panel
- Mobile sticky action bar (Call / WhatsApp / Email)

## Local Development

```bash
npm install
npm run dev          # http://localhost:5555
npm run verify       # 605 assertions (typecheck + timeline + entrance)
npm run build        # production build
```

`npm run verify` runs three passes and is the gate to run before any push:
`tsc --noEmit`, then the entrance-timeline check, then the output checker. The
output checker reads the built stylesheet from `.next/` on disk rather than
fetching it over HTTP, so a proxy that mangles CSS cannot make its CSS
assertions pass vacuously.

**One assertion is expected to fail until the testimonials are supplied** — see
*Content Required* below. The checker names it explicitly in the summary rather
than emitting the generic "stale server" hint, so a non-zero exit is unambiguous.

## Environment Variables

Copy `.env.local.example` to `.env.local`:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_EMAIL=hafiedzzul@gmail.com
NEXT_PUBLIC_SITE_URL=http://localhost:5555
```

**Without `RESEND_API_KEY`** the contact form runs in **test mode**: `POST
/api/contact` logs the payload and a preview of both emails to the server
console, returns `200`, and sends nothing. The whole form flow is testable with
no email account.

**In production** the key is **required**: with `NODE_ENV=production` and no key
the route returns `500` rather than accepting an enquiry it cannot deliver.
Silently swallowing a real lead while showing the visitor success is the worst
of both outcomes, so the route fails closed. `npm run verify` reports the same
condition as a failure.

Get a key at <https://resend.com/api-keys>. Verify the sending domain and set up
SPF, DKIM and DMARC before going live — an unverified domain lands in spam.

## Images Required

Upload to `public/images/`. The page renders six `<ImageSlot>` frames that show a
brand gradient until each file exists, so publishing is a file drop with no code
change:

| File | Size | Used by |
|---|---|---|
| `hero-training.jpg` | 800×1000 | Hero (4:5) |
| `trainer-portrait.jpg` | 600×800 | About (3:4) |
| `session-1.jpg` … `session-4.jpg` | 800×600 | About session gallery (4:3) |
| `testimonial-1.jpg` … `testimonial-3.jpg` | 240×240 | Testimonial avatars |

Extract from PDFs in `/pdf-source/` or use original training-session
photography. **Do not use third-party stock without rights** — PRD Section 5.2
is explicit on this point.

## Content Required

**CONTENT REQUIRED — testimonials from user.** Every quote in
`components/testimonials/testimonials-content.ts` is a bracketed placeholder:

```
[name]     full name, as the person will be quoted
[role]     job title at the time of training
[company]  company name — ONLY with that company's written permission
[quote]    2-3 sentences naming a specific change
[avatar]   square headshot, 240×240+ (optional; falls back to an initial tile)
[rating]   1-5, only if the person actually gave one
```

`npm run verify` **fails** while a bracketed placeholder remains. That is
deliberate: a fabricated testimonial is a published claim in a real customer's
name, and a warning that still exits 0 is a warning that gets ignored.

## Design System

See `docs/design-system.md` for tokens (`--ds-*`), shadow rules and interactive
patterns.

### Polish #7 — compact + premium refine

Session 1 (visual only). The rules this pass established, so a later edit does
not undo them:

| Rule | Where |
|---|---|
| Section rhythm 64px desktop / 40px mobile (`--ds-section-padding-y-*`) | `globals.css` `:root` |
| Type weights step 800 → 800 → 700 → 600 → 500 | `.text-hero` … `.text-h4` |
| Uppercase only on `.eyebrow`; headings are sentence case | `.eyebrow` / every heading |
| Body paragraphs at 1.65 leading, 65ch measure | `.text-body`, `.text-prose` |
| One big CTA, in Contact only | `.program-cta-footer` |
| Programs keep one small outline button each | `.program-request-button` |
| Images render through one component | `components/shared/ImageSlot.tsx` |
| One continuous animation on the page: none | `.hero-scroll-cue`, `.cta-primary` |
| Numbers use tabular figures and count up once | `components/shared/CountUp.tsx` |
| Dark/light rhythm: Track Record is `--ds-neutral-900` | `.track-section` |

## Deployment

Deployed via Coolify — auto-deploy on push to `main`. The app listens on port
`5555`, so the Coolify port mapping must match.

---

**Internal docs:** the PRD and business strategy are kept in `.private/`
(gitignored, not part of the public repo).
