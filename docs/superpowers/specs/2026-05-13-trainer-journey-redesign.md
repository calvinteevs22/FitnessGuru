# Trainer Journey Redesign — Design Spec
**Date:** 2026-05-13
**Status:** Approved

## Problem

The existing trainer landing page used combative, confrontational language that positioned gyms as the enemy. This is off-brand and off-putting — FitnessGuru is not anti-gym, it is pro-trainer. The page needs to be rebuilt around empowerment, professional pride, and the concrete benefits of listing on the platform.

## Design Direction

**Emotional driver:** Pride — "Your expertise deserves a platform worthy of it."
**Positioning:** Option C — Lead with craft pride as the emotional hook, back it up with concrete growth benefits as proof.
**Audience:** All trainer types — gym-employed trainers, independent freelancers, and specialists. Language must resonate across all without alienating any.
**Tone:** Empowering, aspirational, professional. No blame, no antagonism, no comparison framing.

---

## Section-by-Section Design

### 1. TrainerHero

**Badge:** "For Personal Trainers in Singapore"

**Headline:**
> "Singapore's top trainers deserve better than word of mouth."

**Subheading:**
> "A verified profile, instant booking, and clients who find you — so you can focus on what you do best."

**Trust metrics (3 chips):**
- **80%** — you keep per session
- **Free** — to list your profile
- **90 days** — commission-free at launch

**CTA:** "Apply as a Trainer →"

**Right panel — Interactive Earnings Calculator:**
- Label: "What could you earn on FitnessGuru?"
- Input 1: Session rate slider — $50 to $200, default **$120**
- Input 2: Sessions per week slider — 1 to 20, default **12**
- Output 1: Monthly take-home = rate × sessions × 4.3 × 80%
- Output 2: Annual projection = monthly × 12
- At defaults: **$4,954/month · ~$59,450/year**
- No gym comparison. No external reference. Standalone.

**Market research basis:**
- Mid-range Singapore PTs charge $100–$130/session (verified, experienced, home/studio)
- Gym-employed PTs earn $2,900–$3,800/month on average
- $120/session at 12 sessions/week on FitnessGuru = $4,954/month — meaningfully above market average, aspirational but achievable

---

### 2. TrainerAspiration *(replaces TrainerProblem)*

**Section label:** "Built For Trainers"
**Section headline:** *(none — let the three cards carry the section)*

Three cards, each validating a trainer's natural self-image then showing FitnessGuru as the enabler. No villain. No blame.

**Card 01 — Skills**
> "Your skills should speak for themselves."

*Your FitnessGuru profile makes sure the right clients see exactly why you're the right fit — before they even reach out.*

**Card 02 — Client Discovery**
> "The right clients should be able to find you."

*Motivated, ready-to-book clients searching specifically for your specialty. Not random enquiries — people who already want what you offer, finding you directly.*

**Card 03 — Income**
> "Your income should reflect your expertise."

*Set the rate that matches your experience and results. Keep 80% of every session. As your reputation on the platform grows, so does your earning power.*

---

### 3. TrainerHowItWorks

**Section label:** "How It Works"
**Headline:** "List once. Train on your terms."

**Step 01 — Build your profile**
Showcase your certifications, specialty, training style, and locations. Your profile is your professional home on FitnessGuru — and it works for you around the clock.

**Step 02 — Set your rates and availability**
You decide your price per session and when you're available. No imposed tiers, no minimums. Entirely on your terms.

**Step 03 — Get booked, get paid**
Clients discover you, book, and pay through FitnessGuru. You keep 80% of every session, paid out automatically.

---

### 4. TrainerValueProps

**Section label:** "Why FitnessGuru"
**Headline:** "A platform that works as hard as you do."

**Item 01**
*Keep 80% of every session you run.*
Set a rate of $120 per session and take home $96 — every time. Transparent, consistent, and yours.

**Item 02**
*Set your rate, on your terms.*
Charge what your experience is worth. FitnessGuru has no imposed tiers, no caps, and no minimums. As your reputation grows, so can your rate.

**Item 03**
*Every client relationship is yours to keep.*
Your profile builds your reputation. Your reviews travel with you. The practice you build on FitnessGuru belongs to you.

---

### 5. TrainerTestimonials

**Section label:** "Trainer Stories"
**Headline:** "Real trainers. Real earnings."

All quotes focus on positive outcomes only — new clients found, discoverability, income consistency. No mention of previous employment situations, gym splits, or studios.

**Marcus T. · Strength & Conditioning · Tampines**
> "I listed my profile in under 20 minutes. Within two weeks I had three new clients booking regular sessions. FitnessGuru brought me people I never would have reached through referrals alone."

**Priya S. · Pre & Postnatal · Orchard**
> "My prenatal specialisation finally has an audience. Clients searching for exactly what I offer find my profile, read my reviews, and book — often the same day. It's the most efficient part of running my practice."

**Daniel W. · HIIT & Fat Loss · CBD**
> "The income consistency has been the biggest change. I set my rate, I show up, I get paid. FitnessGuru handles everything in between so I can focus entirely on my clients."

---

### 6. TrainerCTA

**Section label:** "Apply Now"
**Headline:** "List your profile. Reach more clients. Grow your practice."
**Subtext:** "Join the waitlist. Get 90 days commission-free when we launch."
**CTA:** "Apply as a Trainer →"

---

### 7. Waitlist Section (trainer variant)

**Aspirational opener:** "The first step to more clients starts here."
**Offer mechanic:** 90 days commission-free at launch

---

## What Was Removed

- All references to gym commission splits as a problem
- "The gym model is broken for trainers" — removed
- "Gyms take half. You do all the work." — removed
- "You're building their brand, not yours." — removed
- "Built for trainers who are done compromising." — removed
- "Stop splitting your income with a gym you don't own." — removed
- Side-by-side gym vs FitnessGuru earnings comparison — replaced with standalone calculator
- Testimonial references to leaving gyms or studios — removed

---

## Implementation Notes

- Earnings calculator: pure React state, no backend. Two sliders (rate, sessions/week), two computed outputs (monthly, annual).
- All amber theme (`#fbbf24`) remains unchanged — only copy and content changes.
- Section order unchanged: Hero → Aspiration → HowItWorks → ValueProps → Testimonials → CTA → Waitlist
- TrainerAspiration replaces TrainerProblem component entirely (rename + rewrite).
