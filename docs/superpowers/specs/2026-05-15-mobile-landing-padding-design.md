# Mobile Landing Page Padding Fix — Design Spec

**Goal:** Eliminate the large empty spaces between sections on the ReadyPT landing page when viewed on mobile browsers, without affecting the desktop experience.

---

## Problem

Every landing page section in `src/App.jsx` uses `padding: '104px 24px'` — 208px of vertical padding per section. Hero sections add `minHeight: '100dvh'` on top of `padding: '140px 24px 100px'`. On a 667px-tall mobile screen this creates massive dead space between sections, making the page feel broken.

The layout itself (grid → single column) already works via existing CSS media queries. Only the padding values need to change.

---

## Approach

**JS-based responsive hook + React context.**

- `useMobile()` hook: reads `window.innerWidth < 768`, attaches a debounced `resize` listener, returns a boolean
- `MobileContext`: created once at the root, calls `useMobile()` once — avoids N separate resize listeners across N sections
- Each section: calls `useContext(MobileContext)` to get `isMobile`, then uses a conditional inline style for padding

All changes are in `src/App.jsx`. No new files.

---

## Sections and Padding Overrides

| Component | Desktop | Mobile (< 768px) |
|---|---|---|
| `FeaturedTrainers` section | `104px 24px` | `64px 20px` |
| `ClientHowItWorks` section | `104px 24px` | `64px 20px` |
| `ClientReassurance` section | `104px 24px` | `64px 20px` |
| `ClientTestimonials` section | `104px 24px` | `64px 20px` |
| `ClientCTA` section | `104px 24px` | `64px 20px` |
| `TrainerAspiration` section | `104px 24px` | `64px 20px` |
| `TrainerHowItWorks` section | `104px 24px` | `64px 20px` |
| `TrainerValueProps` section | `104px 24px` | `64px 20px` |
| `TrainerTestimonials` section | `104px 24px` | `64px 20px` |
| `TrainerCTA` section | `104px 24px` | `64px 20px` |
| `Waitlist` section | `104px 24px` | `64px 20px` |
| `ClientHero` inner container | `140px 24px 100px` | `80px 20px 60px` |
| `TrainerHero` inner container | `140px 24px 100px` | `80px 20px 60px` |
| `SplitHero` panels | `100px 48px` | `60px 20px` |

### `minHeight: '100dvh'` on heroes

`SplitHero`, `ClientHero`, and `TrainerHero` all have `minHeight: '100dvh'` on the section wrapper. On mobile this forces a full-screen blank appearance. Remove `minHeight` on mobile by setting it to `'auto'` (or omitting it) via the `isMobile` conditional.

---

## Implementation Details

### `useMobile` hook (add near top of App.jsx)

```js
function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    let t
    const handler = () => {
      clearTimeout(t)
      t = setTimeout(() => setIsMobile(window.innerWidth < breakpoint), 100)
    }
    window.addEventListener('resize', handler)
    return () => { window.removeEventListener('resize', handler); clearTimeout(t) }
  }, [breakpoint])
  return isMobile
}
```

### `MobileContext` (add after hook)

```js
const MobileContext = createContext(false)
```

### Provider location

Wrap content in the top-level `App` component:

```jsx
function App() {
  const isMobile = useMobile()
  return (
    <MobileContext.Provider value={isMobile}>
      <AuthProvider>
        ...existing JSX...
      </AuthProvider>
    </MobileContext.Provider>
  )
}
```

### Per-section usage (pattern repeated for all 14 affected components)

```jsx
function FeaturedTrainers() {
  const isMobile = useContext(MobileContext)
  return (
    <section style={{ padding: isMobile ? '64px 20px' : '104px 24px', ... }}>
```

---

## Constraints

- **No CSS modules, no Tailwind** — inline styles only, consistent with existing codebase
- **No new files** — all changes in `src/App.jsx`
- **Desktop unchanged** — all desktop values are identical to today
- **SSR not applicable** — Vite SPA, `window` is always available in the browser

---

## Out of Scope

- Font size adjustments on mobile (copy is already readable)
- Grid layout changes (already handled by existing CSS media queries)
- `SplitHero` layout fix beyond padding (the existing `.split-hero-left/.split-hero-right` media query already stacks the panels)
