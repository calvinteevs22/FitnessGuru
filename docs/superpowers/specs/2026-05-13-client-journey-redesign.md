# Client Journey Redesign — Design Spec
**Date:** 2026-05-13
**Status:** Approved

## Problem

The existing client landing page had several conversion issues: decorative filter tabs that did nothing, redundant Problem and ValueProps sections covering the same ground, fear-based problem framing, trainer rates too low relative to the market, and a section order that presented the solution before the problem. The primary conversion goal is: browse trainer profiles → join waitlist.

## Primary Personas

All three are in scope — the page must work for each without alienating any:
- **Novice** — hasn't trained with a PT before, needs reassurance on trust and commitment
- **Dropout** — tried group classes or gym memberships, needs proof this is different
- **Experienced buyer** — knows what they want, needs to find their specific fit fast

## Section Order (revised)

Old: Hero → FeaturedTrainers → HowItWorks → Problem → ValueProps → Testimonials → CTA → Waitlist

New: **Hero → FeaturedTrainers → ClientReassurance → HowItWorks → Testimonials → CTA → Waitlist**

Logic: desire (trainer cards) → doubt removal (concerns addressed) → process clarity → proof → action.

---

## Section-by-Section Design

### 1. ClientHero — minor changes

**Add below the "Browse Trainers" CTA:**
> *"Looking for weight loss · strength · prenatal · sports performance?"*

This primes goal-based thinking before the user reaches FeaturedTrainers. Rendered as small muted text, not a heading.

**Mobile trainer preview:**
Currently `chero-cards` is `display:none` on mobile. Change to show 2 trainer mini cards stacked vertically on mobile (remove the `display:none`, reduce to 2 cards on small screens using a media query).

---

### 2. FeaturedTrainers — significant rework

#### Goal chips (replace filter tabs)

Replace the `FILTERS` array and tab buttons with goal-based chips:

| Chip label | Trainer tags to highlight |
|---|---|
| Lose weight | HIIT, Fat Loss |
| Build muscle | Strength & Conditioning, Powerlifting |
| Train through pregnancy | Pre & Postnatal |
| Improve sports performance | Athletic Performance, Sports |
| Just start somewhere | all trainers (same as default) |

#### Goal click behaviour

When a goal chip is clicked, a **goal spotlight** renders above the full trainer grid:
- One-line context message: e.g. *"Singapore's top trainers for fat loss"*
- 2–3 trainer cards tagged for that goal, displayed in a visually distinct row (slightly lighter background, a goal-colour accent)
- Full grid remains below, unchanged
- No cards are hidden — the spotlight is additive, not a filter
- Default state (no chip selected): no spotlight, full grid, neutral heading

#### Footer CTA — updated copy
- Before: *"Join waitlist to unlock all profiles"*
- After: *"Join the waitlist to book any of these trainers →"*

#### Trainer card CTA — updated copy
- Before: *"Join waitlist"* or *"Book Session"*
- After: *"Reserve this trainer →"*

---

### 3. ClientReassurance — new section (replaces ClientProblem + ClientValueProps)

**Section label:** "Why FitnessGuru"
**Headline:** "We thought about what holds people back. Then we fixed it."

Three cards, each structured as: **concern header → resolution body**. Acknowledge friction honestly without fear-mongering.

**Card 1**
> **Not sure who to trust?**
> Every trainer on FitnessGuru is certified and verified before going live. You see their qualifications, real client reviews, and training style — before you commit to anything.

**Card 2**
> **Worried about hidden costs?**
> Every trainer lists their exact session rate upfront. You know what you're paying before you book. No hidden platform fees, no surprises at checkout.

**Card 3**
> **Not ready to commit long-term?**
> Book a single session first. See how it feels. No packages, no contracts, no pressure to sign anything before you're ready.

Layout: same 3-column card grid as existing sections. Border-left green accent per card.

---

### 4. ClientHowItWorks — copy polish only

Keep 3-step layout. Updated step bodies:

**Step 01 — Browse verified trainers**
Filter by goal, location, and price. Every trainer is certified with real client reviews. No guessing.

**Step 02 — Book in minutes**
Pick a time, pay securely. No emails, no contracts, no commitment beyond the session.

**Step 03 — Train and transform**
Your trainer, your goals, your pace. One session or a full programme — entirely your call.

---

### 5. ClientTestimonials — trim quotes

Trim all three testimonials to 2 sentences maximum. Keep the specific outcome in each. Suggested edits:

**Natasha L. · Client · Tampines**
> "I found Marcus in a week after reading his real reviews and seeing his actual training style. Six months later I'm down 14kg — something three different gym trainers couldn't do."

**Divya R. · Client · River Valley**
> "Being able to book a single session first made all the difference — no long-term commitment before I knew it was right. Priya has been training me through my second pregnancy and I feel stronger than ever."

**Wei Ming T. · Client · Jurong**
> "FitnessGuru showed me certified trainers at every price point, with rates listed upfront. I know what I pay, my trainer knows what I need."

---

### 6. ClientCTA — remove offer line

**Headline:** "Your transformation starts with one decision." *(keep)*
**Subtext:** Remove *"Join the waitlist. Get SGD $20 off your first session when we launch."* entirely.
**CTA button:** "Find your trainer →" *(keep)*

---

### 7. Waitlist — update client copy

- Before: *"Be first to book. Get SGD $20 off your first session at launch."*
- After: *"Be first to access Singapore's top verified trainers when we launch."*

---

### 8. TRAINERS mock data — rate updates

Update all trainer `rate` values upward to reflect realistic Singapore PT market rates ($95–$130 range), consistent with the $120 default used in the trainer earnings calculator.

| Trainer | Specialty | Old rate | New rate |
|---|---|---|---|
| Marcus Tan | Strength & Conditioning | $90 | $120 |
| Priya Shankar | Pre & Postnatal Fitness | $85 | $110 |
| Daniel Wong | HIIT & Fat Loss | $75 | $100 |
| Sarah Lim | Yoga & Mobility | $70 | $95 |
| Ryan Koh | *(check current)* | — | $130 |
| Amira Hassan | *(check current)* | — | $115 |

---

## What Was Removed

- `ClientProblem` component — merged into `ClientReassurance`
- `ClientValueProps` component — merged into `ClientReassurance`
- Decorative `FILTERS` array and filter tab buttons
- "$20 off first session" offer from ClientCTA and Waitlist
- `chero-cards` mobile `display:none` override (replace with 2-card mobile layout)

## Implementation Notes

- Goal chip state: `useState(null)` — null means no goal selected, string means active goal
- Goal spotlight: conditional render above the trainer grid, not a filter — all cards remain visible below
- Trainer card CTA maps to `scrollToWaitlist()` same as before — only the label changes
- `ClientReassurance` is a new component; `ClientProblem` and `ClientValueProps` are deleted
- Section order in `ClientPage` must be updated
- No backend changes — all mock data, all React state
