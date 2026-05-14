# ReadyPT Rebrand Implementation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename the product from FitnessGuru to ReadyPT across all user-facing surfaces — frontend UI, email templates, iCal feeds, and package metadata — and update all domain references from `fitnessguru.sg` to `readyptsg.com`.

**Architecture:** Hybrid approach — mechanical find-and-replace for structural/config items, deliberate copy pass for user-facing text in `App.jsx` and email HTML templates. No new dependencies, no color changes (existing dark forest green palette is retained), no database migrations required.

**Domain:** `readyptsg.com` (owned). Email sender domain (`support@readyptsg.com`, `noreply@readyptsg.com`) requires a verified sender domain to be configured in Resend — noted as a follow-up operational task outside this implementation plan.

**Deployment note:** To serve the app on `readyptsg.com`, deploy to Vercel (free tier, connects to GitHub) then point the registrar's DNS CNAME/A record to the Vercel deployment URL. This is a separate operational task, not part of this rebrand implementation.

---

## Logo

The new ReadyPT logo (approved design) consists of:

- **Primary mark:** Large white bold "R" on a dark forest green rounded square (`#1a3320` background, `rx=6`)
- **Badge:** Smaller rounded rectangle (`#2d6a2e`) overlaid at top-right of the R, containing bold white "PT" text
- **Wordmark:** "ReadyPT" in bold sans-serif, rendered next to the mark in the nav and footer
- **Favicon:** Same lockup at 32×32 viewBox — R mark with PT badge, no wordmark text

The logo lockup replaces the current "FG" box + "FitnessGuru" text in the nav (`src/App.jsx`) and footer (`src/App.jsx`).

---

## Section 1 — Structural / Config Changes

### `package.json`
- `"name"`: `"fitnessguru"` → `"readypt"`

### `index.html`
- `<title>`: `"FitnessGuru - Singapore's Personal Training Marketplace"` → `"ReadyPT - Singapore's Personal Training Marketplace"`
- `<meta name="description">`: Replace `"FitnessGuru"` with `"ReadyPT"`

### `public/favicon.svg`
Rebuild the SVG entirely. Current file shows `"FG"` text inside a green rectangle. New favicon:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <!-- Dark green background -->
  <rect width="32" height="32" rx="6" fill="#1a3320"/>
  <!-- Large white R -->
  <text x="6" y="24" font-family="Arial Black, Arial, sans-serif" font-weight="900"
        font-size="22" fill="white">R</text>
  <!-- PT badge -->
  <rect x="17" y="3" width="13" height="11" rx="3" fill="#2d6a2e"/>
  <text x="23.5" y="12" font-family="Arial, sans-serif" font-weight="700"
        font-size="7.5" fill="white" text-anchor="middle">PT</text>
</svg>
```

### `supabase/functions/trainer-calendar/index.ts`
- PRODID line: `'-//FitnessGuru//Trainer Calendar//EN'` → `'-//ReadyPT//Trainer Calendar//EN'`
- Calendar name line: `` `X-WR-CALNAME:FitnessGuru — ${escapeIcal(trainerName)}` `` → `` `X-WR-CALNAME:ReadyPT — ${escapeIcal(trainerName)}` ``
- UID line: `` `UID:${booking.id}@fitnessguru.sg` `` → `` `UID:${booking.id}@readyptsg.com` ``

---

## Section 2 — Logo Implementation in UI (`src/App.jsx`)

### Nav logo (appears twice — top nav and footer)
Replace the current logo JSX (green box with "FG" + "FitnessGuru" text) with a new `<ReadyPTLogo />` inline component:

```jsx
function ReadyPTLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Mark: R with PT badge */}
      <div style={{ position: 'relative', width: 40, height: 40 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, background: '#1a3320',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-heading)', fontWeight: 900,
            fontSize: 26, color: '#fff', lineHeight: 1, paddingLeft: 2,
          }}>R</span>
        </div>
        {/* PT badge */}
        <div style={{
          position: 'absolute', top: -4, right: -6,
          background: '#2d6a2e', borderRadius: 4,
          padding: '1px 5px',
        }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontWeight: 700,
            fontSize: 9, color: '#fff', letterSpacing: '0.05em',
          }}>PT</span>
        </div>
      </div>
      {/* Wordmark */}
      <span style={{
        fontFamily: 'var(--font-heading)', fontWeight: 700,
        fontSize: 20, color: '#EEF2EE', letterSpacing: '-0.01em',
      }}>
        Ready<span style={{ color: '#4ade80' }}>PT</span>
      </span>
    </div>
  )
}
```

- Replace the nav `<a aria-label="FitnessGuru home">` → `<a aria-label="ReadyPT home">` containing `<ReadyPTLogo />`
- Replace the footer logo with `<ReadyPTLogo />` (same component)

### `src/pages/SignupEntryPage.jsx`
- Brand name text "FitnessGuru" → "ReadyPT"

### `src/pages/TrainerDashboardPage.jsx`
- `'Your profile is approved and live. Clients can find you on FitnessGuru.'` → `'Your profile is approved and live. Clients can find you on ReadyPT.'`
- `'Subscribe to this URL in Google Calendar or Apple Calendar. Your FitnessGuru sessions will appear automatically.'` → `'…Your ReadyPT sessions will appear automatically.'`

---

## Section 3 — Landing Page Copy (`src/App.jsx`)

All occurrences are direct name swaps. No phrasing changes required.

**Find → Replace (all instances):**
- `"FitnessGuru"` → `"ReadyPT"` (covers section headers, testimonial quotes, FAQ answers, earnings section, trainer value prop cards)
- `"© 2026 FitnessGuru Pte Ltd"` → `"© 2026 ReadyPT Pte Ltd"`
- `"FitnessGuru · Singapore"` (footer line) → `"ReadyPT · Singapore"`
- `aria-label="FitnessGuru home"` → `aria-label="ReadyPT home"` (handled in Section 2 logo refactor)

**Specific strings to update in `App.jsx`:**
1. Badge pill text remains `"SINGAPORE'S PERSONAL TRAINING MARKETPLACE"` — no change
2. `"Why FitnessGuru"` (client section label) → `"Why ReadyPT"`
3. `"Why FitnessGuru"` (trainer section label) → `"Why ReadyPT"`
4. `"What could you earn on FitnessGuru?"` → `"What could you earn on ReadyPT?"`
5. Testimonial quote: `"FitnessGuru showed me certified trainers…"` → `"ReadyPT showed me certified trainers…"`
6. Testimonial quote: `"I listed my profile in under 20 minutes…FitnessGuru brought me…"` → `"…ReadyPT brought me…"`
7. Testimonial quote: `"…I get paid. FitnessGuru handles everything…"` → `"…ReadyPT handles everything…"`
8. Value prop card: `"Your profile is your professional home on FitnessGuru"` → `"…on ReadyPT"`
9. Value prop card: `"The practice you build on FitnessGuru belongs to you."` → `"…on ReadyPT…"`
10. Value prop card: `"Clients discover you, book, and pay through FitnessGuru."` → `"…through ReadyPT."`
11. Value prop card: `"FitnessGuru has no imposed tiers…"` → `"ReadyPT has no imposed tiers…"`
12. Value prop card: `"Your reviews travel with you. The practice you build on FitnessGuru belongs to you."` → `"…on ReadyPT…"`
13. FAQ: `"Every trainer on FitnessGuru is certified…"` → `"Every trainer on ReadyPT is certified…"`
14. Trainer sign-up pitch: `"Your FitnessGuru profile makes sure the right clients see…"` → `"Your ReadyPT profile makes sure…"`
15. Footer copyright + location line (items above)

---

## Section 4 — Edge Function Email Templates

### `supabase/functions/notify-booking/index.ts`

Subject line changes:
- `'Booking confirmed — FitnessGuru'` → `'Booking confirmed — ReadyPT'`
- `'Booking cancelled — FitnessGuru'` → `'Booking cancelled — ReadyPT'`

No body HTML changes needed in this function (body does not reference brand name).

### `supabase/functions/notify-trainer/index.ts`

Subject line changes:
- `'Application received — FitnessGuru'` → `'Application received — ReadyPT'`
- `'🎉 Your FitnessGuru application has been approved!'` → `'🎉 Your ReadyPT application has been approved!'`
- `'Update on your FitnessGuru application'` → `'Update on your ReadyPT application'`

Body HTML changes (all inline brand name occurrences):
- `'Thanks for applying to join FitnessGuru as a trainer.'` → `'Thanks for applying to join ReadyPT as a trainer.'`
- `'Welcome to FitnessGuru, ${safeName}!'` → `'Welcome to ReadyPT, ${safeName}!'`
- `'you're now part of the FitnessGuru network.'` → `'you're now part of the ReadyPT network.'`
- `'Thank you for applying to FitnessGuru.'` → `'Thank you for applying to ReadyPT.'`
- `support@fitnessguru.sg` → `support@readyptsg.com` (hardcoded href and display text)

---

## What Is Not Changing

- **Supabase project URL** (`wnwmlaqhyztwxyvzuqpe.supabase.co`) — infrastructure, not brand-facing
- **Color palette** — dark forest green (`#0d1a0e`, `#1a3320`, `#4ade80`) is retained as-is
- **`FROM_EMAIL` env var** — currently defaults to Resend's `onboarding@resend.dev` for test mode; updating to `noreply@readyptsg.com` requires a verified sender domain on Resend (separate operational task)
- **Historical spec/plan docs** in `docs/superpowers/` — internal development docs, not user-facing
- **Git history** — no scrubbing needed, brand name was never a secret

---

## Follow-Up Operational Tasks (Out of Scope for This Plan)

1. **Resend sender domain:** Add `readyptsg.com` as a verified sender domain in the Resend dashboard, then update the `FROM_EMAIL` Supabase secret to `noreply@readyptsg.com`
2. **Supabase project rename:** Optionally rename the Supabase project from "fitnessguru" to "readypt" in the dashboard (cosmetic only, does not affect the URL)
3. **Vercel deployment + DNS:** Deploy app to Vercel, point `readyptsg.com` DNS to the deployment
4. **Stripe dashboard:** Update the business name in Stripe settings from FitnessGuru to ReadyPT (affects card statement descriptors for customers)
