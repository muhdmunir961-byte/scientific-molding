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
