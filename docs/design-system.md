# Design System — Shadow Usage Rule

| Token | Usage | Example |
|---|---|---|
| `--ds-shadow-sm` | White surfaces, default cards | Header, form inputs, plain cards |
| `--ds-shadow-md` | Elevated content cards | Program cards, stat cards, module cards |
| `--ds-shadow-lg` | Floating elements | Dropdown, mobile panel, hero image, sticky bar |
| `--ds-shadow-warm` | Brand-colored surfaces | CTA buttons, HRDC badge, success card |

**Rule:** Jangan campur. White surface → sm. Brand surface → warm. Elevated → md. Floating → lg.

**Reasoning:** `--ds-shadow-warm` guna rgba orange untuk "glow" effect pada brand elements. White surface dengan warm shadow nampak kotor. Sebaliknya, CTA orange dengan grey shadow nampak matte — hilang "brand glow".

---

## Note on the nav hover state

`.nav-shell[data-scrolled='true']` is a white surface, so it takes `--ds-shadow-sm`
per the table above — not `--ds-shadow-md`. It was flagged during Polish #1 as a
possible deviation from the spec, reviewed, and kept deliberately.

The header is not an elevated content card. It is a white bar sitting directly
on the page, and the job of its shadow is to state *where the bar ends* — a tight
contact shadow. `--ds-shadow-md` is the rung reserved for cards that carry
content and are meant to read as lifted off the page; using it on the header
would flatten that distinction and cost the two-shadow budget its meaning.

---

## Interactive pattern: card hover lift

**Rule:** A card that lifts on hover moves by `translateY(-2px)` and steps
**one** elevation rung (`sm` → `md`, or `md` → `lg`). Never `scale()` a card
that contains text.

**Reasoning.** `scale()` on a text-bearing element re-rasterises the glyphs
mid-transition: the browser rasterises at the pre-transform size and only
resamples the result, so the label visibly softens while the transform is
running and then snaps sharp when it settles. `translateY` moves the already-
rasterised layer and leaves the text crisp.

`scale()` is fine — and preferred — on a frame whose content is a bitmap or a
photograph, where there is no hinting to lose. `.hero-frame` therefore takes
`scale(1.01)` while `.hero-stat` takes `translateY(-2px)`; the two sit a few
hundred pixels apart, which is exactly why the rule needs to be written down
rather than inferred.

**Why one rung and not two.** The elevation step is the signal that the card
has *responded*. Going `sm` straight to `lg` skips the middle of the scale and
reads as the card jumping forward, and it burns the `md`/`lg` distinction the
shadow table above exists to protect.

**Companion rule — pair the lift with a keyboard path.** A hover-only lift is
invisible to anyone navigating by keyboard, so any element with a `:hover`
elevation change must also be focusable. `.hero-stat` carries `tabIndex={0}`
for this reason. The hover rule alone is not the feature.

---

## Interactive pattern: icon tile

An icon sitting in its own tinted tile (`.credential-icon`, `.trainer-stat-numeral`,
`.cta-secondary-icon`) carries its **own** radius and its **own** hover state,
rather than inheriting the parent's.

Two reasons. The tile's radius is what gives a focus ring a shape to hug — a
square tile inside a rounded card otherwise draws a ring that matches neither.
And a tile that changes colour when the parent is hovered makes the row read as
one control, instead of a tile that happens to be sitting inside a box.

---

## Motion budget

**Rule:** the page has no continuous animation. Every animation either plays
once on entry or is triggered by a hover or a focus.

| Allowed | Where | Duration |
|---|---|---|
| EntranceLoader burn-out | mount, once | 2200ms total |
| `ScrollReveal` fade-in-up | first view, once | 600ms |
| Hover lift + elevation step | pointer / focus | 250ms |
| Button arrow `translateX(0→4px)` | pointer | 250ms |
| Stat counter | first view, once | 2000ms |
| Mobile sticky bar slide-in | scroll > 400px | 400ms |

**Removed in Polish #7:** the scroll cue's infinite `hero-cue-bob` (a 2.4s
`translateY` loop that never stopped), and the hero CTA's Orange → Yellow
gradient in favour of one solid brand fill. Both were the only places on the
page where a surface or a shape kept moving, or kept changing colour, without a
pointer doing anything.

**Reasoning.** Continuous motion competes with reading for the same attention
budget and never stops competing — a visitor cannot dismiss it. A one-shot
animation that has finished is *gone*; a loop is a permanent tax. For a B2B
training page whose reader is a procurement engineer, the eye should be doing
one thing at a time.

Easing is `--ds-ease-out` only, durations come from `--ds-duration-*`, and
`prefers-reduced-motion: reduce` removes the transforms outright rather than
shortening them — a 0.01ms transition still teleports the element to its end
state and leaves it there.

---

## Images: one slot, one empty state

Every image position renders through `components/shared/ImageSlot.tsx`. It takes
`src` / `width` / `height` / `alt` plus a `radius` and an `elevation` that map to
`--ds-radius-*` and `--ds-shadow-*` values.

**Rule:** if the file is missing, the frame shows
`linear-gradient(135deg, var(--ds-orange-50), var(--ds-yellow-50))`. No icon, no
caption, no shimmer, no skeleton.

**Reasoning.** A labelled placeholder reads as *unfinished*, and a visitor cannot
tell a deliberate "photo coming" state from a broken asset. A shimmer is worse
still: it is a continuous animation (see the motion budget above) and it tells
the reader the page is still loading when it has finished. A warm gradient says
"a photograph goes here" and stops.

`src` is set to the path the asset *will* live at, so publishing is a file drop.
`onError` — not a build-time `fs.existsSync` — is what switches to the fallback,
because a filesystem check breaks the moment the app is deployed somewhere the
build's filesystem is not.
