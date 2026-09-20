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

1. **Hero** — entrance animation (burn-out), stat strip, CTAs
2. **About** — trainer bio, credentials, track record
3. **Programs** — 5 program sections (Fundamentals, Materials, Process Development, Defect Troubleshooting, Pathway)
4. **Why Scientific Molding** — before/after comparison
5. **Track Record** — stats, HRDC badge, credentials grid
6. **Contact** — form with validation, Resend integration, direct contact links
7. **Footer** — links, legal, compliance

## Navigation

- Sticky header with scrollspy
- Mobile hamburger + slide-in panel
- Mobile sticky action bar (Call / WhatsApp / Email)

## Local Development

```bash
npm install
npm run dev          # http://localhost:5555
npm run verify       # 474 assertions (typecheck + timeline + entrance)
npm run build        # production build
```

`npm run verify` runs three passes and is the gate to run before any push:
`tsc --noEmit`, then the entrance-timeline check, then the output checker. The
output checker reads the built stylesheet from `.next/` on disk rather than
fetching it over HTTP, so a proxy that mangles CSS cannot make its CSS
assertions pass vacuously.

## Environment Variables

Copy `.env.local.example` to `.env.local`:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_EMAIL=hafiedzzul@gmail.com
NEXT_PUBLIC_SITE_URL=http://localhost:5555
```

**Note:** Without `RESEND_API_KEY` the contact form runs in test mode — it logs
the payload and returns 200 without sending anything. The key is **required in
production**: with `NODE_ENV=production` and no key the route fails rather than
accepting an enquiry it cannot deliver, and `npm run verify` reports it as a
failure.

## Design System

See `docs/design-system.md` for tokens (`--ds-*`), shadow rules and interactive
patterns.

## Deployment

Deployed via Coolify — auto-deploy on push to `main`. The app listens on port
`5555`, so the Coolify port mapping must match.

---

**Internal docs:** the PRD and business strategy are kept in `.private/`
(gitignored, not part of the public repo).
