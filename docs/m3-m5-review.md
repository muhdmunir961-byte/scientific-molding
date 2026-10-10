# M3 and M5 — Content Review

**For:** Ts. Mohd Hafiedzzul Bin Malek Riduan
**Status of everything below:** draft, pending your approval

---

## How to read this

These two modules have **no source PDF**. Every word of course content in them was
written for this review — nothing was extracted, because there was nothing to
extract from. The other five modules are a verbatim copy of the approved PDFs.

### The two labels used in the JSON files

| Label | Meaning |
|---|---|
| `status: "fact"` | Came from `content/modules.json`, or is a series-wide value already used on the site. Not drafted. |
| `status: "draft-needs-trainer-review"` | **Written for this review. Needs your approval before anything is built.** |

### Nothing is published

Both files carry `"published": false`. No drafted content is reachable from any
component — verified: nothing in the codebase imports `content/modules/`. The two
modules still appear in the public Programs menu with **title, days and level
only**, marked "coming soon" rather than linking anywhere.

**Nothing goes live until you say so.**

---

## What is fact (already yours, not drafted)

| Field | M3 | M5 |
|---|---|---|
| Slug | `m3-fundamental-pd` | `m5-parameter-setting` |
| Title | Fundamental of Scientific Molding - Process Development | Systematic Parameter Setting for Injection Molding |
| Days | 2 | 2 |
| Level | Bridge | Bridge |
| Promise | Build the essential principles behind structured process development. | Introduce a consistent framework for parameter-setting decisions. |
| Tags | Development basics, Process phases, Data thinking | Parameter logic, Structured method, Consistency |
| Series outcome | Prepare the team for more advanced process-development learning. | Promote a logical, shared approach to process-setting discussions. |
| Philosophy | Material + Mould + Machine + Process; the four plastic conditions | same |
| Safety notice | Equipment operation, process changes and mould service restricted to qualified, authorised personnel | same |
| Contact routes | +60 12-488 5247 / hafiedzzul@gmail.com | same |

All of the above comes from `content/modules.json` or a series-wide constant.
**If any of it is wrong, it is wrong in the manifest, not in these drafts.**

---

# M3 — Fundamental of Scientific Molding - Process Development

Tick to approve, or write the correction beside the item.

## 1. Headline + promise

- [ ] Headline: **FUNDAMENTAL OF SCIENTIFIC MOULDING - PROCESS DEVELOPMENT**
- [ ] Promise: *Build the essential principles behind structured process development.* ← fact from the manifest

## 2. Six problems this module helps solve

- [ ] **Development happens by trial and error** — Settings are adjusted until a part looks acceptable, with no record of what was learned.
- [ ] **No shared definition of finished** — A process is called ready on one shift and questioned on the next.
- [ ] **Process data is collected but not read** — Cycle figures are recorded because the form asks for them, then filed without interpretation.
- [ ] **Every setup starts from scratch** — A previous job is treated as a fresh problem rather than as a starting point.
- [ ] **Development work depends on one person** — Progress stalls when the engineer who set the process is absent.
- [ ] **Handover loses the reasoning** — The production team receives a running process but not the thinking that produced it.

## 3. Five business benefits for management

Each carries a category label — the management concern it speaks to.

- [ ] **01 · Development time becomes predictable** *(Time)* — A structured sequence replaces open-ended trial and error.
- [ ] **02 · Fewer unexplained process changes** *(Stability)* — Settings move for a recorded reason rather than at the machine.
- [ ] **03 · Faster, cleaner handover to production** *(Handover)* — The receiving team inherits the reasoning, not only the numbers.
- [ ] **04 · Knowledge stays with the company** *(Risk)* — Development method is documented, so it survives staff movement.
- [ ] **05 · A team ready for advanced development** *(Readiness)* — Engineers arrive at the four-day programme with the foundations in place.

## 4. Before / After

- [ ] Adjusts settings until the part looks acceptable → Follows defined process phases and records each decision
- [ ] Judges a process ready by appearance alone → Decides readiness against agreed, observable evidence
- [ ] Treats each setup as a new problem → Starts from the previous job and develops deliberately

## 5. Five practical outcomes for engineers

Each starts with a verb, as the other modules do.

- [ ] **Describe** the phases of structured process development — Name each stage and explain what it is for.
- [ ] **Collect** basic process data with purpose — Record the figures that answer a stated question.
- [ ] **Read** a process record and explain what it shows — Turn recorded numbers into a plain statement about the process.
- [ ] **Judge** whether a process is repeatable — Decide readiness from evidence rather than from appearance.
- [ ] **Explain** a development decision to another engineer — Justify a setting or a change using the record, not memory.

## 6. Course structure

**DAY 1 — FOUNDATIONS OF DEVELOPMENT**

- [ ] Why process development must be structured — the cost of trial and error
- [ ] The phases of development, in order, and what each phase produces
- [ ] Machine settings are inputs, not proof — what that changes about how we work
- [ ] Connecting a setting to an observable effect using the four plastic conditions

**DAY 2 — DATA AND REPEATABILITY**

- [ ] Collecting basic process data: what to record and what to leave out
- [ ] Reading a process record — turning numbers into a statement about the process
- [ ] What "repeatable" means, and how to decide a process is ready
- [ ] Recording and explaining a development decision for the next engineer

## 7. Who should attend

- [ ] Process and production engineers moving into development work
- [ ] Engineering graduates preparing to run trials under supervision
- [ ] Technicians who support process setup and changeovers
- [ ] Team leaders who approve a process as ready for production

**Learning format** — reuses the series list: guided discussions, prepared samples
and case studies, process diagrams, participant worksheets.

- [ ] Approve as-is
- [ ] Change to: ______________________________________________

## 8. Management takeaway

- [ ] *Structured development is what turns a process into an asset the organisation owns. Two days here gives the team a shared method for building it, and the foundation the four-day advanced programme requires.*

## 9. CTA

- [ ] Headline: **BUILD A SHARED DEVELOPMENT METHOD**
- [ ] Body: *Request a customised in-house training proposal for your engineering team.*
- [ ] Contact routes read from the site config, not retyped

---

# M5 — Systematic Parameter Setting for Injection Molding

## 1. Headline + promise

- [ ] Headline: **SYSTEMATIC PARAMETER SETTING FOR INJECTION MOULDING**
  *(the manifest title says "Injection Molding"; this draft uses "Moulding" to match the site's headings — see question 4)*
- [ ] Promise: *Introduce a consistent framework for parameter-setting decisions.* ← fact from the manifest

## 2. Six problems this module helps solve

- [ ] **Settings are copied from the last job** — A previous setup is reused on a different tool or material without checking whether it still applies.
- [ ] **No agreed order for setting a process** — Two engineers reach a workable process by different routes, so neither can explain the other's.
- [ ] **Changes are made without a stated reason** — A parameter moves to fix one symptom and creates another nobody connects to it.
- [ ] **Discussions rely on opinion** — Production and engineering disagree about a setting with no shared framework to resolve it.
- [ ] **Records do not explain the decision** — The sheet shows the final numbers but not why they are those numbers.
- [ ] **Setup depends on who is on shift** — The same job runs differently depending on which engineer set the machine.

## 3. Five business benefits for management

- [ ] **01 · Consistent setups across shifts** *(Consistency)* — One method produces the same process whoever is running it.
- [ ] **02 · Faster, more confident decision-making** *(Speed)* — A defined order removes the guesswork from where to start.
- [ ] **03 · Fewer 'fix one, break another' changes** *(Stability)* — Decisions are made in sequence, so the effect of each is visible.
- [ ] **04 · Shared language between teams** *(Collaboration)* — Production, engineering and quality discuss settings using the same terms.
- [ ] **05 · Setups that can be repeated and audited** *(Traceability)* — The record explains the reasoning, not only the final figures.

## 4. Before / After

- [ ] Copies settings from the previous job → Establishes settings in a defined order, starting from what the material requires
- [ ] Adjusts a parameter to quiet a symptom → States the reason for each change and checks its effect before moving on
- [ ] Explains a setting from memory or experience → Explains a setting from the method and the recorded evidence

## 5. Five practical outcomes for engineers

- [ ] **Explain** why a setting is a decision rather than a value — State what a chosen parameter is intended to achieve.
- [ ] **Apply** a defined order when setting up a process — Establish parameters in sequence rather than adjusting at random.
- [ ] **Justify** a parameter change with evidence — Support each move with an observation rather than an opinion.
- [ ] **Record** settings so another engineer can repeat them — Capture the reasoning alongside the numbers.
- [ ] **Discuss** a setting using shared terminology — Take part in a production-versus-engineering discussion with a common framework.

## 6. Course structure

**DAY 1 — PARAMETER LOGIC**

- [ ] Machine settings are inputs, not proof — revisiting what a parameter actually does
- [ ] The four plastic conditions as the frame for every setting decision
- [ ] A defined order for setting up a process, and why the order is not arbitrary
- [ ] Why there are no universal setpoints: method over recipes

**DAY 2 — JUSTIFYING AND RECORDING**

- [ ] Connecting each setting to an observable effect before moving to the next
- [ ] Justifying a change: what evidence supports a parameter move
- [ ] Recording a setup so it can be repeated by another engineer
- [ ] Agreeing terminology for setting discussions across production, engineering and quality

## 7. Who should attend

- [ ] Process engineers who set and adjust injection moulding parameters
- [ ] Setup technicians responsible for repeatable changeovers
- [ ] Production supervisors who approve a running process
- [ ] Quality engineers involved in setting-related discussions

**Learning format** — reuses the series list.

- [ ] Approve as-is
- [ ] Change to: ______________________________________________

## 8. Management takeaway

- [ ] *Consistency at the machine is a decision-making problem before it is a technical one. Two days here gives the team one order for setting a process, so the same job runs the same way on every shift.*

## 9. CTA

- [ ] Headline: **SET A PROCESS THE SAME WAY EVERY TIME**
- [ ] Body: *Request a customised in-house training proposal for your engineering team.*
- [ ] Contact routes read from the site config, not retyped

---

# Questions for the trainer

These cannot be answered from the repository. Each one changes what gets built.

**1. Do M3 and M5 exist as separate courses, or are they parts of other modules?**

M3 is "Fundamental of Scientific Molding - Process Development" and M4 is
"Scientific Molding - Process Development" (4 days, Advanced). The overlap in name
is close. If M3 is really the first part of M4 rather than a course sold
separately, they should probably be presented that way — and M5 raises the same
question against M1 and M6.

**2. Is the two-day split right?**

The draft puts foundations on Day 1 and data-and-repeatability on Day 2 for M3,
and parameter logic then justification-and-recording for M5. That is a guess at a
teaching order, not a statement of one.

**3. Are the six problems the right six?**

They were written to sit between M1's basics and M4's advanced evidence work. If
your classroom experience says a different six, these are the ones to replace.

**4. Which spelling does the series use — Moulding or Molding?**

The site uses both. The manifest titles use "Molding" while the page headings use
"Moulding". This draft used "Moulding" in the headline to match the headings. Tell
me which is correct and it will be made consistent everywhere.

**5. Does M5 cover the four plastic conditions again, or assume M1 did?**

The draft revisits them as the frame for setting decisions, which is a deliberate
repetition. If M1 is a prerequisite, that slide may not be needed.

**6. Is there a safety boundary specific to parameter setting?**

The series line is kept verbatim. If this module needs its own note — for example
about who may change a running process — it should be added here rather than
inferred.

**7. Are any of the tags, days or levels wrong?**

They come from `content/modules.json`, so if something is off it should be
corrected there.

---

# How to approve

Reply with either:

- **"Approved"** — the drafts become the module content and the pages get built, or
- the items to change, in any format you like.

Nothing is published until then. `npm run check:drafts` fails the build if a draft
is ever marked published, or if drafted copy ever appears in the served page.

