# ReadyPT Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the product from FitnessGuru to ReadyPT across all user-facing surfaces — frontend UI, email templates, iCal feeds, and package metadata — and update all domain references from `fitnessguru.sg` / `fitness-guru-seven.vercel.app` to `readyptsg.com`.

**Architecture:** Hybrid approach — mechanical edits for structural/config files, deliberate copy pass for App.jsx and email templates. The `ReadyPTLogo` component is defined once in `src/App.jsx` and reused in both nav and footer. Edge functions are updated locally then redeployed to Supabase. No new dependencies, no color changes, no database migrations.

**Tech Stack:** React 19, Vite, Supabase Edge Functions (Deno), Resend (email), Vitest

---

## File Map

| File | What changes |
|---|---|
| `package.json` | `name` field |
| `index.html` | `<title>` and `<meta description>` |
| `public/favicon.svg` | Full SVG rebuild — R mark + PT badge |
| `src/App.jsx` | `ReadyPTLogo` component added; nav + footer logo replaced; 15 copy mentions swapped |
| `src/pages/SignupEntryPage.jsx` | 1 brand mention (line 27) |
| `src/pages/TrainerDashboardPage.jsx` | 2 brand mentions (lines 24, 337) |
| `supabase/functions/notify-booking/index.ts` | 2 subject lines + 2 hardcoded vercel URLs |
| `supabase/functions/notify-trainer/index.ts` | 3 subject lines + 5 body HTML mentions + support email + 2 vercel URLs |
| `supabase/functions/trainer-calendar/index.ts` | PRODID, calendar name, UID domain, Content-Disposition filename |

---

### Task 1: Structural config — package.json, index.html, favicon.svg

**Files:**
- Modify: `package.json`
- Modify: `index.html`
- Modify: `public/favicon.svg`

- [ ] **Step 1: Update package.json name**

Replace line 2 in `package.json`:
```json
"name": "readypt",
```

- [ ] **Step 2: Update index.html title and meta description**

Replace the `<title>` and `<meta name="description">` lines in `index.html`:
```html
<meta name="description" content="ReadyPT - Singapore's Personal Training Marketplace. Find certified personal trainers from SGD $65/session. No gym membership required." />
<title>ReadyPT - Singapore's Personal Training Marketplace</title>
```

- [ ] **Step 3: Rebuild favicon.svg**

Replace the entire contents of `public/favicon.svg` with:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#1a3320"/>
  <text x="6" y="24" font-family="Arial Black, Arial, sans-serif" font-weight="900"
        font-size="22" fill="white">R</text>
  <rect x="17" y="3" width="13" height="11" rx="3" fill="#2d6a2e"/>
  <text x="23.5" y="12" font-family="Arial, sans-serif" font-weight="700"
        font-size="7.5" fill="white" text-anchor="middle">PT</text>
</svg>
```

- [ ] **Step 4: Verify no FitnessGuru remains in these files**

Run:
```bash
grep -n "FitnessGuru\|fitnessguru" package.json index.html public/favicon.svg
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add package.json index.html public/favicon.svg
git commit -m "rebrand: update package name, page title, and favicon to ReadyPT"
```

---

### Task 2: ReadyPTLogo component + nav logo

**Files:**
- Modify: `src/App.jsx` (around lines 344–390)

**Context:** `Nav` is defined at line 345. The current nav logo is an `<a>` tag at line 372 containing a gradient green box with "FG" text and "FitnessGuru" wordmark. We add `ReadyPTLogo` as a standalone function just before `Nav`, then use it inside.

- [ ] **Step 1: Add the ReadyPTLogo component just before the Nav function**

In `src/App.jsx`, find the line:
```jsx
function Nav({ role, onSwitch }) {
```
Insert the following function definition immediately above it (before line 345):
```jsx
function ReadyPTLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

- [ ] **Step 2: Replace the nav logo JSX**

Find and replace the entire nav logo `<a>` block (the one with `aria-label="FitnessGuru home"` that contains the gradient FG box). Replace this block:
```jsx
        <a href="#" aria-label="FitnessGuru home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'linear-gradient(135deg, #1a5c1b 0%, #2d8a2e 60%, #3dab3e 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'logo-pulse 3s ease-in-out infinite',
            border: '1px solid rgba(74,222,128,0.35)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: '-60%', width: '40%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)', transform: 'skewX(-15deg)', animation: 'card-shine 4s ease-in-out infinite 1.5s' }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 15, color: '#fff', letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>FG</span>
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 21, color: '#EEF2EE', letterSpacing: '0.01em' }}>
            Fitness<span style={{ color: accent, transition: 'color 0.3s' }}>Guru</span>
          </span>
        </a>
```
With:
```jsx
        <a href="#" aria-label="ReadyPT home" style={{ textDecoration: 'none' }}>
          <ReadyPTLogo />
        </a>
```

- [ ] **Step 3: Start dev server and verify nav logo renders**

Run: `npm run dev`

Open `http://localhost:5173` and confirm:
- The nav shows the R mark with a green PT badge and "ReadyPT" wordmark
- No "FitnessGuru" text or "FG" box appears in the nav

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "rebrand: add ReadyPTLogo component and replace nav logo"
```

---

### Task 3: Footer logo

**Files:**
- Modify: `src/App.jsx` (Footer function, around line 1537)

**Context:** The `Footer` function is at line 1537. The footer logo is a second `<a aria-label="FitnessGuru home">` block containing a plain `#2d6a2e` box with "FG" text.

- [ ] **Step 1: Replace the footer logo JSX**

Find and replace the footer logo block in the `Footer` function. Replace:
```jsx
        <a href="#" aria-label="FitnessGuru home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: '#2d6a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 12, color: '#fff' }}>FG</span>
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: '#EEF2EE' }}>
            Fitness<span style={{ color: '#4ade80' }}>Guru</span>
          </span>
        </a>
```
With:
```jsx
        <a href="#" aria-label="ReadyPT home" style={{ textDecoration: 'none' }}>
          <ReadyPTLogo />
        </a>
```

- [ ] **Step 2: Verify footer renders correctly**

With the dev server running, scroll to the bottom of `http://localhost:5173`. Confirm:
- Footer shows the R + PT badge logo and "ReadyPT" wordmark
- No "FG" box or "FitnessGuru" text in the footer

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "rebrand: replace footer logo with ReadyPTLogo component"
```

---

### Task 4: Landing page copy in App.jsx + supporting pages

**Files:**
- Modify: `src/App.jsx` (all remaining FitnessGuru copy)
- Modify: `src/pages/SignupEntryPage.jsx` (line 27)
- Modify: `src/pages/TrainerDashboardPage.jsx` (lines 24, 337)

**Context:** After Tasks 2 and 3, all remaining `FitnessGuru` occurrences in `App.jsx` are in landing page copy — section headers, testimonials, value prop cards, FAQ, earnings section, and footer copyright. They are all direct name swaps.

- [ ] **Step 1: Replace all remaining FitnessGuru mentions in App.jsx**

Make the following exact string replacements in `src/App.jsx` (each is a distinct string):

| Find | Replace |
|---|---|
| `'Why FitnessGuru'` (appears twice — client section and trainer section) | `'Why ReadyPT'` |
| `'What could you earn on FitnessGuru?'` | `'What could you earn on ReadyPT?'` |
| `'FitnessGuru showed me certified trainers at every price point'` | `'ReadyPT showed me certified trainers at every price point'` |
| `'FitnessGuru brought me people I never would have reached'` | `'ReadyPT brought me people I never would have reached'` |
| `'FitnessGuru handles everything in between'` | `'ReadyPT handles everything in between'` |
| `'on FitnessGuru — and it works for you around the clock.'` | `'on ReadyPT — and it works for you around the clock.'` |
| `'Clients discover you, book, and pay through FitnessGuru.'` | `'Clients discover you, book, and pay through ReadyPT.'` |
| `'FitnessGuru has no imposed tiers'` | `'ReadyPT has no imposed tiers'` |
| `'The practice you build on FitnessGuru belongs to you.'` (appears twice) | `'The practice you build on ReadyPT belongs to you.'` |
| `'Every trainer on FitnessGuru is certified'` | `'Every trainer on ReadyPT is certified'` |
| `'Your FitnessGuru profile makes sure the right clients'` | `'Your ReadyPT profile makes sure the right clients'` |
| `'FitnessGuru · Singapore'` | `'ReadyPT · Singapore'` |
| `'© 2026 FitnessGuru Pte Ltd'` | `'© 2026 ReadyPT Pte Ltd'` |

- [ ] **Step 2: Verify no FitnessGuru remains in App.jsx**

Run:
```bash
grep -n "FitnessGuru\|fitnessguru" src/App.jsx
```
Expected: no output.

- [ ] **Step 3: Update SignupEntryPage.jsx**

In `src/pages/SignupEntryPage.jsx`, line 27, replace:
```jsx
          FitnessGuru
```
With:
```jsx
          ReadyPT
```

- [ ] **Step 4: Update TrainerDashboardPage.jsx**

In `src/pages/TrainerDashboardPage.jsx`, make two replacements:

Line 24 — replace:
```js
  approved: 'Your profile is approved and live. Clients can find you on FitnessGuru.',
```
With:
```js
  approved: 'Your profile is approved and live. Clients can find you on ReadyPT.',
```

Line 337 — replace:
```jsx
          Subscribe to this URL in Google Calendar or Apple Calendar. Your FitnessGuru sessions will appear automatically.
```
With:
```jsx
          Subscribe to this URL in Google Calendar or Apple Calendar. Your ReadyPT sessions will appear automatically.
```

- [ ] **Step 5: Verify no FitnessGuru remains in any src/ file**

Run:
```bash
grep -rn "FitnessGuru\|fitnessguru" src/
```
Expected: no output.

- [ ] **Step 6: Run the test suite**

Run:
```bash
npm test -- --run
```
Expected: all tests pass. If any test fails, read the failure output and fix it before committing.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/pages/SignupEntryPage.jsx src/pages/TrainerDashboardPage.jsx
git commit -m "rebrand: replace all FitnessGuru copy with ReadyPT across frontend"
```

---

### Task 5: notify-booking edge function

**Files:**
- Modify: `supabase/functions/notify-booking/index.ts`

**Context:** Two email subject lines reference FitnessGuru (lines 62, 79). The email body HTML also contains two hardcoded `fitness-guru-seven.vercel.app` URLs that need to become `readyptsg.com`.

- [ ] **Step 1: Update booking confirmed subject line**

In `supabase/functions/notify-booking/index.ts`, line 62, replace:
```ts
    subject = 'Booking confirmed — FitnessGuru'
```
With:
```ts
    subject = 'Booking confirmed — ReadyPT'
```

- [ ] **Step 2: Update booking cancelled subject line**

Line 79, replace:
```ts
    subject = 'Booking cancelled — FitnessGuru'
```
With:
```ts
    subject = 'Booking cancelled — ReadyPT'
```

- [ ] **Step 3: Update hardcoded Vercel URLs in email body HTML**

Line 74, replace:
```ts
        <a href="https://fitness-guru-seven.vercel.app/dashboard/client"
```
With:
```ts
        <a href="https://readyptsg.com/dashboard/client"
```

Line 85, replace:
```ts
        <a href="https://fitness-guru-seven.vercel.app/trainers"
```
With:
```ts
        <a href="https://readyptsg.com/trainers"
```

- [ ] **Step 4: Verify no FitnessGuru or old vercel URL remains**

Run:
```bash
grep -n "FitnessGuru\|fitnessguru\|fitness-guru-seven" supabase/functions/notify-booking/index.ts
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/notify-booking/index.ts
git commit -m "rebrand: update notify-booking email subjects and URLs to ReadyPT"
```

---

### Task 6: notify-trainer edge function

**Files:**
- Modify: `supabase/functions/notify-trainer/index.ts`

**Context:** Three subject lines, five body HTML brand mentions, one hardcoded support email (`support@fitnessguru.sg`), and two hardcoded `fitness-guru-seven.vercel.app` URLs.

- [ ] **Step 1: Update submitted subject line**

In `supabase/functions/notify-trainer/index.ts`, line 51, replace:
```ts
    subject = 'Application received — FitnessGuru'
```
With:
```ts
    subject = 'Application received — ReadyPT'
```

- [ ] **Step 2: Update approved subject line**

Line 63, replace:
```ts
    subject = '🎉 Your FitnessGuru application has been approved!'
```
With:
```ts
    subject = '🎉 Your ReadyPT application has been approved!'
```

- [ ] **Step 3: Update rejected subject line**

Line 75, replace:
```ts
    subject = 'Update on your FitnessGuru application'
```
With:
```ts
    subject = 'Update on your ReadyPT application'
```

- [ ] **Step 4: Update submitted email body**

Line 55, replace:
```ts
        <p>Thanks for applying to join FitnessGuru as a trainer. Your profile is now under review and we'll get back to you within 48 hours.</p>
```
With:
```ts
        <p>Thanks for applying to join ReadyPT as a trainer. Your profile is now under review and we'll get back to you within 48 hours.</p>
```

- [ ] **Step 5: Update approved email body (2 mentions)**

Line 66, replace:
```ts
        <h2 style="color: #0d1a0e;">Welcome to FitnessGuru, ${safeName}!</h2>
```
With:
```ts
        <h2 style="color: #0d1a0e;">Welcome to ReadyPT, ${safeName}!</h2>
```

Line 67, replace:
```ts
        <p>Your trainer profile has been reviewed and <strong>approved</strong>. You're now part of the FitnessGuru network.</p>
```
With:
```ts
        <p>Your trainer profile has been reviewed and <strong>approved</strong>. You're now part of the ReadyPT network.</p>
```

- [ ] **Step 6: Update rejected email body and support email**

Line 79, replace:
```ts
        <p>Thank you for applying to FitnessGuru. After reviewing your application, we're unable to approve your profile at this time.</p>
```
With:
```ts
        <p>Thank you for applying to ReadyPT. After reviewing your application, we're unable to approve your profile at this time.</p>
```

Line 81, replace:
```ts
        <p>If you have questions or would like to reapply, please contact us at <a href="mailto:support@fitnessguru.sg">support@fitnessguru.sg</a>.</p>
```
With:
```ts
        <p>If you have questions or would like to reapply, please contact us at <a href="mailto:support@readyptsg.com">support@readyptsg.com</a>.</p>
```

- [ ] **Step 7: Update hardcoded Vercel URLs in email body**

Line 57, replace:
```ts
        <a href="https://fitness-guru-seven.vercel.app/dashboard/trainer"
```
With:
```ts
        <a href="https://readyptsg.com/dashboard/trainer"
```

Line 69, replace:
```ts
        <a href="https://fitness-guru-seven.vercel.app/dashboard/trainer"
```
With:
```ts
        <a href="https://readyptsg.com/dashboard/trainer"
```

- [ ] **Step 8: Verify no FitnessGuru or old URLs remain**

Run:
```bash
grep -n "FitnessGuru\|fitnessguru\|fitness-guru-seven" supabase/functions/notify-trainer/index.ts
```
Expected: no output.

- [ ] **Step 9: Commit**

```bash
git add supabase/functions/notify-trainer/index.ts
git commit -m "rebrand: update notify-trainer email subjects, body copy, and URLs to ReadyPT"
```

---

### Task 7: trainer-calendar edge function

**Files:**
- Modify: `supabase/functions/trainer-calendar/index.ts`

**Context:** Four references — the iCal PRODID (line 58), calendar display name (line 61), event UID domain (line 70), and the Content-Disposition download filename (line 88).

- [ ] **Step 1: Update PRODID**

In `supabase/functions/trainer-calendar/index.ts`, line 58, replace:
```ts
    'PRODID:-//FitnessGuru//Trainer Calendar//EN',
```
With:
```ts
    'PRODID:-//ReadyPT//Trainer Calendar//EN',
```

- [ ] **Step 2: Update calendar display name**

Line 61, replace:
```ts
    `X-WR-CALNAME:FitnessGuru — ${escapeIcal(trainerName)}`,
```
With:
```ts
    `X-WR-CALNAME:ReadyPT — ${escapeIcal(trainerName)}`,
```

- [ ] **Step 3: Update event UID domain**

Line 70, replace:
```ts
    lines.push(`UID:${booking.id}@fitnessguru.sg`)
```
With:
```ts
    lines.push(`UID:${booking.id}@readyptsg.com`)
```

- [ ] **Step 4: Update Content-Disposition filename**

Line 88 (inside the `Content-Disposition` header), replace:
```ts
      'Content-Disposition': 'attachment; filename="fitnessguru-schedule.ics"',
```
With:
```ts
      'Content-Disposition': 'attachment; filename="readypt-schedule.ics"',
```

- [ ] **Step 5: Verify no FitnessGuru or fitnessguru.sg remains**

Run:
```bash
grep -n "FitnessGuru\|fitnessguru" supabase/functions/trainer-calendar/index.ts
```
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/trainer-calendar/index.ts
git commit -m "rebrand: update trainer-calendar iCal PRODID, name, UID, and filename to ReadyPT"
```

---

### Task 8: Deploy updated edge functions

**Context:** The three modified edge functions need to be redeployed to Supabase. You need the Supabase CLI and a valid access token. If not already logged in, authenticate first.

- [ ] **Step 1: Authenticate with Supabase CLI (if not already logged in)**

```bash
supabase login
```
Follow the browser prompt. If you have an access token, you can run:
```bash
supabase login --token <your-supabase-access-token>
```

- [ ] **Step 2: Link to the project (if not already linked)**

```bash
supabase link --project-ref wnwmlaqhyztwxyvzuqpe
```

- [ ] **Step 3: Deploy notify-booking**

```bash
supabase functions deploy notify-booking --project-ref wnwmlaqhyztwxyvzuqpe
```
Expected: `Deployed Function notify-booking`

- [ ] **Step 4: Deploy notify-trainer**

```bash
supabase functions deploy notify-trainer --project-ref wnwmlaqhyztwxyvzuqpe
```
Expected: `Deployed Function notify-trainer`

- [ ] **Step 5: Deploy trainer-calendar**

```bash
supabase functions deploy trainer-calendar --project-ref wnwmlaqhyztwxyvzuqpe
```
Expected: `Deployed Function trainer-calendar`

- [ ] **Step 6: Final verification — no FitnessGuru anywhere in src/ or supabase/functions/**

Run:
```bash
grep -rn "FitnessGuru\|fitnessguru\|fitness-guru-seven" src/ supabase/functions/
```
Expected: no output.

- [ ] **Step 7: Commit and push**

```bash
git push
```

---

## Out-of-Scope Follow-Up Tasks

These are operational tasks to complete after this plan is done:

1. **Resend sender domain:** Add `readyptsg.com` as a verified sender domain in the Resend dashboard → update the `FROM_EMAIL` Supabase secret to `noreply@readyptsg.com`
2. **Vercel deploy + DNS:** Deploy the app to Vercel → point `readyptsg.com` DNS (A or CNAME) at the Vercel deployment URL
3. **Stripe dashboard:** Update business name from FitnessGuru to ReadyPT in Stripe Settings → Business (affects statement descriptors)
4. **Supabase project rename:** Optional cosmetic rename in the Supabase dashboard (does not affect the project URL)
