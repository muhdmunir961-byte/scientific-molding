# ANSWER.md — Decisions, Analysis and Open Questions

> **Purpose.** Every diagnosis, design decision and outstanding question from the
> admin/photo work is recorded here so it can be read in one place, without
> reconstructing it from commit messages or chat.
>
> **How to read it.** Part 1 is the bug diagnoses. Part 2 is the data model.
> Part 3 is every decision I made and *why* — including where I chose against the
> obvious option. Part 4 is what is still open and needs you.
>
> Last updated: after commit `7dfc86d`.

---

## Part 1 — Bug diagnoses

### Bug 1 — `/admin/images` showed `Unknown module ""`

**Root cause.** The page asked for `?group=images`. The parameter was renamed
from `group` to `module` when the admin schema stopped describing fields and
started describing modules, and this one call site kept the old name. The API saw
no `module`, so it returned the **module list**; the page found no `values` in
that list and surfaced an empty-module error.

**Fix, at both ends.**
- The client now asks the images route directly (`?manifest=1`), which is where
  the upload pipeline actually writes.
- The content route now distinguishes `null` (no parameter → a legitimate list
  request) from `''` (present but empty → `400` with a readable message). A
  caller that sends nothing can no longer be silently treated as asking for
  everything.

### Bug 2 — Content → Images showed `PAGE_IMAGES` as `null`

**Root cause.** `PAGE_IMAGES` had no registry entry, so `readExport()` returned
`undefined` and the editor rendered `null`. Underneath that, there was no single
place that could answer "what images does the site currently use?" — the six
defaults were spread across `hero-content.ts`, `about-content.ts` and
`testimonials-content.ts`.

**Fix.** `lib/admin/images-manifest.ts` builds a real structure — one entry per
slot with its `url` and its `source` (`override` / `default` / `unset`). It is
**computed, never stored**, so it cannot be null.

### Bug 3 — Deploy button returned `405`

**Root cause.** `lib/admin/deploy.ts` sent `GET`. Coolify v4 changed the deploy
endpoint to `POST`.

**Confirmed against the live instance**, which is what separates "wrong method"
from "wrong credentials":

| Method | Response |
|---|---|
| GET | `405 {"message":"This endpoint has changed to a POST request."}` |
| POST | `401 {"message":"Unauthenticated."}` |

**Fix.** POST, and the raw JSON envelope is replaced with sentences that say what
to do: `401/403` → the token is missing or lacks the deploy permission, `404` →
the uuid is wrong, `429` → rate-limited, `5xx` → check the dashboard.

### Bug 4 — Inconsistent image paths

Four separate defects, all of which made the panel report success while the site
showed something else.

| Defect | Consequence |
|---|---|
| Key was `images/<slot>.<ext>` | Re-uploading wrote the **same key**. The bytes changed, the URL did not, so every browser kept serving the old image from cache. |
| No namespace | `images/lecture.jpg` said nothing about which module or category it belonged to. |
| No verification | A PUT could succeed into a bucket whose public domain was not attached. The panel said "uploaded" and the site showed nothing. |
| No delete | Objects accumulated forever. |

**New key convention.**

```
images/<moduleSlug>/<category>/<timestamp>-<slug>.<ext>

images/m1-fundamental/lecture/1791578774717-lathe-setup.jpg
```

A timestamp makes every upload a distinct key, so a replacement is a new URL and
cannot be served stale. It also sorts chronologically in a bucket listing, which
is how an operator actually looks for a recent upload.

**New verification.** After the PUT, a `HEAD` on the returned URL. If it does not
resolve, the upload **fails loudly** with the URL named. The object is
deliberately **not** deleted on a failed verify — that would destroy the upload
over what may be a transient propagation delay.

### Bug 5 — Empty placeholder frames on the public About page

**Root cause.** `TrainerPhoto.tsx` maps all four `SESSION_IMAGES`
unconditionally, so a missing file renders the brand-gradient fallback. Four
empty peach frames appear.

**Status: not yet fixed.** It is the smallest remaining item (logic only, no
restyling).

---

## Part 2 — Data model

### `content/modules.json` — the seven modules

**Source of truth: `0_7_Module_SIM_Professional_Training.pdf`. Do not infer,
rename or reorder.**

| slug | title | days | level |
|---|---|---|---|
| `m1-fundamental` | Fundamental of Scientific Molding | 2 | Foundation |
| `m2-processability` | Processability of Thermoplastics in Injection Molding | 2 | Foundation |
| `m3-fundamental-pd` | Fundamental of Scientific Molding - Process Development | 2 | Bridge |
| `m4-process-development` | Scientific Molding - Process Development | 4 | Advanced |
| `m5-parameter-setting` | Systematic Parameter Setting for Injection Molding | 2 | Bridge |
| `m6-defects-troubleshooting` | Scientific Molding: Defects Troubleshooting | 2 | Application |
| `m7-process-portability` | Scientific Molding: Process Portability | 2 | Advanced |

Total: **16 days**.

This one file is read by the admin Overview, the admin dropdown, the per-module
photo manager **and** the public Programs menu. Before it existed the site carried
five modules under different slugs, which is how the menu came to disagree with
the client's document.

### Old slug → new slug mapping

The site previously used five slugs that do not match the PDF. Each module now
carries a `legacySlug` so images uploaded before this change stay reachable and
an old bookmark still resolves.

| PDF module | old site slug | note |
|---|---|---|
| m1-fundamental | `fundamentals` | renamed |
| m2-processability | `materials` | renamed |
| m3-fundamental-pd | — | **new, no page yet** |
| m4-process-development | `process-development` | renamed |
| m5-parameter-setting | — | **new, no page yet** |
| m6-defects-troubleshooting | `defect-troubleshooting` | renamed |
| m7-process-portability | `pathway` | ⚠️ see Part 4 — different subject |

### `content/module-photos.json` — the galleries

```jsonc
{
  "modules": {
    "m1-fundamental": {
      "lecture": [], "practical": [], "discussion": [], "presentation": []
    }
    // ... one entry per module
  }
}
```

Both keys come from other files — module slugs from `modules.json`, categories
from `PHOTO_CATEGORIES` — so the panel can only write keys it was given and the
gallery cannot grow a fifth category by accident.

### `Image` shape

```ts
{
  key: string         // stable identity, never changes
  url: string         // public URL the site renders
  alt: string         // screen-reader description
  caption: string     // optional visible caption
  order: number       // position within its category
  uploadedAt: string  // ISO timestamp
}
```

### Why each image carries a `key`

An image **cannot** be identified by its index. Insert one photo at the top and
every index below shifts, silently re-pairing captions with the wrong
photographs. The key is generated once at upload — derived from the R2 key, so
the manifest entry and the stored object cannot drift — and never changes.

---

## Part 3 — Decisions and why

### The nav links canonical slugs; the sections answer to both

**Decision.** The menu links `#m1-fundamental`. The section still carries
`id="fundamentals"` **and** gains an empty `<span id="m1-fundamental">`.

**Why not just rename the section.** Every existing bookmark, external link and
search result would break, and every prior assertion in `check-entrance.mjs`
would fail. An empty anchor costs nothing visually and keeps all of them working.

**Consequence for the checker.** `NAV_ANCHORS` now asserts the canonical slugs
are *linked*, and `LEGACY_ANCHORS` asserts the old ids still *resolve*. The old
ids are deliberately no longer linked.

### Two modules are listed but not linked

**Decision.** `m3` and `m5` appear in the menu as text carrying "coming soon",
not as links.

**Why.** An anchor pointing at a missing id does nothing when clicked, which a
visitor reads as a broken site rather than as a module that is not published.
Inventing a section for them is a content decision, not one the code should make.

**Asserted.** `PENDING_MODULES` in `check-entrance.mjs` checks they are **not**
linked — so adding a section without removing it from that list is caught.

### Reorder is buttons, not drag-and-drop

**Decision.** Up/down buttons.

**Why.** Buttons are keyboard-operable for free, work on touch without a drag
threshold, and cannot mis-drop. Drag would need a library or a hand-rolled
pointer implementation, a keyboard fallback anyway, and would be the one
interaction in the panel that behaves differently on a phone — for an operator
editing eleven photos at a desk. The brief allowed either.

### A reorder cannot delete

**Decision.** `PATCH` requires every existing key to appear exactly once.

**Why.** Without the check, a dropped key would silently remove a photograph
through what the operator believed was a reorder — the worst possible way to lose
data.

### The manifest is written before the object is deleted

**Decision.** On delete: manifest → commit → then remove the object.

**Why.** Reversed, a failed commit would leave the live site pointing at bytes
that no longer exist. This order's worst case is an orphaned object, which costs
storage and breaks nothing. Whether the object went is reported in the response
rather than hidden.

### Each category saves independently

**Decision.** No form-level Save button. A photo is already in R2 by the time the
upload returns.

**Why.** A form-level save would have to track uploaded-but-uncommitted objects
and reconcile them on failure. Saving per change means panel state and the
repository agree after every action.

### Captions save on blur, not per keystroke

**Decision.** `onBlur`, and only when the value actually changed.

**Why.** A save per keystroke would commit to git on every character. Blur is the
point at which the operator has finished. An untouched field never posts, so
clicking through a gallery produces **no commits at all**.

### `lib/admin/registry.ts` imports modules statically

**Why not a dynamic `import()`.** Turbopack cannot resolve a path built from a
variable — it either fails the build or falls back to tracing the entire project
into the server output, which is the deploy-size problem the content store had
already hit once. A static import map costs one line per module, and
`check-admin.mjs` asserts every registered key is consumed.

### The images route reads its own manifest

**Why.** `PAGE_IMAGES` is the **output of the upload pipeline**, not text an
operator types. Routing its read through the text-content API is exactly what
produced Bug 2. Keeping the read and the write on one route means they cannot
disagree about where the manifest lives.

### `check-admin.mjs` asserts wiring, not just shape

The load-bearing check is: **every registered export must be consumed via
`withOverrides`**. That is the check that would have caught the original image
bug, where the panel wrote the override and the component kept reading its
default while every step reported success.

It also asserts:
- every admin API route calls the session guard
- every admin page calls the page guard
- the module list matches the PDF exactly, on slug, title, days and level
- the days sum to 16
- every route that takes a module slug validates it
- every operator-facing group has a human label

---

## Part 4 — Open questions and outstanding work

### Needs your decision

**1. `pathway` is not "Process Portability".**

The existing `#pathway` section is titled *"7-Module Professional Training
Pathway"* — a portfolio overview. The PDF's m7 is *"Scientific Molding: Process
Portability"*, a different subject. m7 currently maps to `legacySlug: "pathway"`.

Consequence: photos uploaded to m7 will land in a section that talks about
something else. Options are to rename the section, build a section for it, or
re-point m7 at a different anchor. **I have not changed any page copy.**

**2. `m3` and `m5` have no public page.**

They are defined by the PDF, they have photo galleries and admin pages, but the
public site has no section for them. Photos uploaded there are stored and
committed but **never displayed**. Either a section is added, or they stay
menu-only until the content exists. You confirmed: build the slots now, fill them
later.

**3. Coolify auto-deploy is not wired.**

Commits land on `main` and the live site does not change. This was diagnosed by
pushing an empty commit and polling the served CSS hash at +3 and +7 minutes —
unchanged both times. The panel's Deploy button covers it manually once
`COOLIFY_WEBHOOK_URL` + `COOLIFY_API_TOKEN` are set, but auto-deploy on push is
the correct primary mechanism.

### Not yet built

| Item | Size | Notes |
|---|---|---|
| **F** — Testimonials CRUD | medium | add / edit / delete / reorder, publish toggle; render only published ones publicly |
| **G** — Migration of existing slots | medium | the six special slots (logo, hero, trainer, 4 sessions) plus testimonial avatars, into the new schema, keeping old URLs valid |
| **Bug 5** — Empty frames on About | small | logic only, no restyling |
| Public module gallery | small | render the module photos on the public site |

### Known limitations

- **The local filesystem fallback loses images on redeploy.** Coolify rebuilds
  the container from git, so anything written to `public/` at runtime is gone. The
  panel warns about this; R2 is the supported path.
- **`ADMIN_PASSWORD` is still weak.** It can change production content and upload
  to R2. Use `openssl rand -base64 24`.
- **Port 8000 on the Coolify host is reachable from the public internet.** That
  exposes the Coolify dashboard to brute-force. Worth restricting at the firewall.
- **One expected test failure.** `npm run verify` reports `607 pass, 1 fail` —
  the testimonial placeholder gate. That is deliberate: the section ships with
  bracketed placeholders and must not go live unreplaced.

### Verification totals at `7dfc86d`

```
Build          0 errors, 0 warnings
check:admin    26 pass, 0 fail
check:entrance 607 pass, 1 fail (the expected testimonial gate)
```
