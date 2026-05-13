# Location Filter — Design Spec
**Date:** 2026-05-13
**Status:** Approved

## Problem

Clients browsing the FeaturedTrainers section have no way to filter by location. Trainer `areas` strings are displayed on cards but are not filterable. A client in Tampines has no way to surface trainers who operate in the East without reading every card manually.

## Design

### Region pills — five Singapore planning regions

```
Central · East · West · North · North-East
```

Rendered as a second row of pills below the goal chips in `FeaturedTrainers`. Same pill styling as goal chips. Active pill highlights in green (`rgba(74,222,128,0.12)` background, `rgba(74,222,128,0.55)` border, `#4ade80` text). Clicking an active pill deselects it (toggles off).

**Row labels:**
- Row 1: "What's your goal?"
- Row 2: "Where do you train?"

---

## Data Layer

Add `regions: string[]` to each trainer object in the `TRAINERS` array.

| Trainer | Specialty | Areas | Regions |
|---|---|---|---|
| Marcus Tan | Strength & Conditioning | Tampines · Bedok · Pasir Ris | `['East']` |
| Priya Shankar | Pre & Postnatal Fitness | Orchard · River Valley · Buona Vista | `['Central', 'West']` |
| Daniel Wong | HIIT & Fat Loss | CBD · Marina Bay · Raffles Place | `['Central']` |
| Sarah Lim | Yoga & Mobility | Bishan · Ang Mo Kio · Thomson | `['Central', 'North-East']` |
| Ryan Koh | Sports Performance | Jurong · Clementi · West Coast | `['West']` |
| Amira Hassan | Pilates & Core Strength | Novena · Toa Payoh · Central | `['Central']` |

---

## Filter State

Add `activeRegion` state (`useState(null)`) to `FeaturedTrainers`, alongside existing `activeGoal`.

```js
const [activeGoal, setActiveGoal] = useState(null)
const [activeRegion, setActiveRegion] = useState(null)
```

Region pill click: `setActiveRegion(activeRegion === r ? null : r)` — toggle behaviour.

---

## Spotlight Logic

The existing goal spotlight is extended to handle both filters.

| activeGoal | activeRegion | Spotlight behaviour |
|---|---|---|
| null | null | No spotlight — full grid only |
| set | null | Trainers matching goal |
| null | set | Trainers matching region |
| set | set | Trainers matching both — empty state if none match |

**Filtering functions:**
```js
const matchesGoal = t => !activeGoal || t.goals.includes(activeGoal)
const matchesRegion = t => !activeRegion || t.regions.includes(activeRegion)
const spotlightTrainers = TRAINERS.filter(t => matchesGoal(t) && matchesRegion(t))
const showSpotlight = (activeGoal || activeRegion) && spotlightTrainers.length > 0
```

---

## Spotlight Context Message

Dynamically composed from active filters:

| State | Message |
|---|---|
| Goal only | `"Singapore's top trainers for [goal context]"` (existing behaviour) |
| Region only | `"Trainers available in the [region]"` |
| Goal + Region | `"[Goal context] in the [region]"` |

Examples:
- "Lose weight" + "East" → *"Fat loss trainers in the East"*
- "Train through pregnancy" + "Central" → *"Prenatal & postnatal trainers in Central"*
- Region only "West" → *"Trainers available in the West"*

---

## Empty State

When both goal and region are active but no trainers match:

> "No [goal label] specialists in the [region] yet — showing all [goal label] trainers instead."

With a small "Clear location ×" link that calls `setActiveRegion(null)` and keeps the goal active. The spotlight then falls back to goal-only results.

Empty state is only possible when both filters are set. A region-only selection will always return at least one trainer (Central covers 4 of 6 trainers).

---

## Implementation Notes

- `REGIONS` constant: `['Central', 'East', 'West', 'North', 'North-East']`
- No backend — pure React state, all filtering client-side
- `regions[]` field added to each trainer object in `TRAINERS` array
- Region pills rendered in `FeaturedTrainers` below goal chips, same component
- No new components required — all changes within `FeaturedTrainers` and `TRAINERS` data
- The full trainer grid below the spotlight is always shown regardless of active filters
