# FitnessGuru — Role-Based User Journey Design

**Date:** 2026-05-12
**Status:** Approved

---

## Overview

Redesign the FitnessGuru landing page user journey so that visitors first self-select their role — client (looking for a trainer) or trainer (offering sessions) — and then see a landing page tailored entirely to that role's perspective and value proposition.

---

## Entry Point — Split Hero

All new visitors (or returning visitors with no stored role preference) land on a **full-page split hero**:

- Two equal panels side by side (stacked vertically on mobile, client on top)
- **Left panel:** "Find a Trainer" — speaks to clients
- **Right panel:** "I'm a Trainer" — speaks to trainers
- Clicking either panel transitions the full page into that role's tailored experience
- A subtle animated cue (e.g. dimming the unselected side on hover) hints at interactivity

**No content is shown below the split hero** on first load. The selection must happen first.

---

## Role Persistence

- On selection, store `fg_role = 'client' | 'trainer'` in `localStorage`
- On subsequent visits, skip the split hero entirely and render the stored role's page directly
- A small **"Switch to Trainer / Client view"** text link in the navbar allows toggling at any time
- Switching via the nav link updates `localStorage` and re-renders the page in the new mode

---

## Page Transition

- Clicking a split panel: fade out the split hero → fade in the selected role's full page
- Switching via nav link: cross-fade between the two full-page experiences
- Transition duration: ~300ms ease-out (aligns with existing cinematic aesthetic)

---

## Client Mode — Full Page

**Hero**
- Headline: "Find your trainer. Change your life."
- Subtitle: "Browse certified personal trainers across Singapore. Book instantly."
- CTA: "Find a Trainer" (primary green button)

**Problem Section**
Three pain points framed from the client's perspective:
1. Generic gym classes don't deliver personal results
2. Hard to know if a trainer is qualified or right for you
3. Pricing is opaque, and long-term commitments are intimidating

**How It Works (3 steps)**
1. Browse verified trainers — filter by specialty, location, and availability
2. Book a session in minutes — no back-and-forth, no contracts
3. Train and transform — show up, do the work, see results

**Value Propositions**
- Every trainer is certified and vetted by FitnessGuru
- Transparent pricing — see exactly what you pay before you book
- Flexible — your schedule, your location, no lock-in

**Social Proof**
Three client testimonials focused on: finding the right fit, life-changing results, ease of booking.

**CTA Section**
- Headline: "Your transformation starts with one decision."
- Button: "Start your search"

---

## Trainer Mode — Full Page

**Hero**
- Headline: "Your rates. Your schedule. Your clients."
- Subtitle: "Join Singapore's trainer marketplace. List for free. Keep 80%."
- CTA: "Apply as a Trainer" (primary green button)

**Problem Section**
Three pain points framed from the trainer's perspective:
1. Gyms take 50% of every session — you do the work, they keep half
2. You build the gym's brand and client base, not your own
3. No control over your schedule, your pricing, or who you train

**How It Works (3 steps)**
1. Create your profile — showcase your certifications, specialty, and style
2. Set your rates and availability — full control, no platform-imposed pricing
3. Get booked, get paid — FitnessGuru takes 20%, you keep 80%

**Value Propositions**
- Keep 80% of every session — the industry's best split
- Set your own rates — no tiers, no caps, no minimums
- Your profile, your brand, your client relationships — we don't own them

**Social Proof**
Three trainer stories focused on: earnings increase, freedom to build their practice, client retention.

**CTA Section**
- Headline: "Stop splitting your income with a gym you don't own."
- Button: "Join as a Trainer"

---

## Shared Elements

- **Navbar:** Logo (left) + "Switch to Trainer / Client view" text link (right)
- **Footer:** Standard — links, legal, social
- **Visual language:** Unchanged — dark forest green `#0d1a0e` canvas, `#4ade80` accent, Barlow Condensed headings, cinematic dark aesthetic

---

## Technical Notes

- All page content lives in `src/App.jsx`
- Role state managed via `localStorage` + React `useState`
- No routing changes needed — single-page, conditional rendering based on role state
- Split hero, client page, and trainer page are three distinct render branches
- Mobile: split hero stacks vertically (client panel on top); both modes are fully responsive

---

## Out of Scope

- Actual trainer search/browse functionality (not yet built)
- Authentication or user accounts
- Booking flow
- Any backend changes
