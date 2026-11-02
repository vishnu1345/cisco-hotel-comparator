# Design Decisions

This document records the main design decisions in the Hotel Base-Camp Comparator: what was chosen, why, and what alternatives were considered. Decisions marked **(planning)** were made during the planning phase and recorded in `architecture.md`; decisions marked **(implementation)** were made while building Stages 1–5 and are visible in the code and Git history.

---

## 1. Four-layer client-side architecture (planning)

**Decision.** Data → Domain → Application state → Presentation, all in the browser.

| Layer | Location | Responsibility |
|---|---|---|
| Data | `src/data/cityData.json` | Static Aura scenario. Never modified at runtime. |
| Domain | `src/domain/*.js` | Validation, calculations, affordability, ranking. Pure JavaScript. |
| Application | `src/hooks/useComparator.js` | Editable inputs and user actions; derives results. |
| Presentation | `src/components/*.jsx` | Rendering only. |

**Why.** The assignment's core is a set of exact business rules. Keeping them in their own layer makes them testable without React and easy to change during a live modification. The scope (one city, three changing inputs) doesn't justify more layers.

**Alternatives considered.**
- *Calculations inside components* — less structure up front, but mixes UI with rules and makes them hard to test in isolation.
- *Backend / service layer* — rejected: no requirement for persistence or remote data, and the assignment excludes external services.

---

## 2. Pure domain modules (planning, implemented in Stage 2)

**Decision.** `validation.js`, `calculations.js` and `ranking.js` export plain functions that take data and return data. They do not import React, read the DOM, mutate inputs, or read map coordinates (except `validation.js`, which range-checks them).

**Why.** Pure functions are deterministic, so the same inputs always give the same ranking — and tests can call them directly with tiny hand-built scenarios (for example the tie-break cases).

**How it is enforced.**
- Tests assert inputs are not mutated (`does not modify the city data`).
- `tests/boundaries.test.js` fails if any `src/` file imports the fixture, if a domain module imports React or uses `document`/`window`, or if `calculations.js`/`ranking.js` reference `map_position` or `.x`/`.y`.
- A moved-coordinates test proves calculations are identical when every map position changes (TC-68).

**Error format.** Validation returns every problem as `{ path, message }`, with array-index paths such as `hotels[4].round_trip_minutes.PLACE_FORT_01`. Index paths stay unambiguous even when the ID itself is malformed or duplicated. All errors are returned, not just the first.

---

## 3. `compareHotels()` as the single calculation pipeline (implementation, Stage 2)

**Decision.** `ranking.js` exports `compareHotels(city, budget, importanceByPlaceId)`, which runs:

```text
applyImportance → validateScenario → (stop if invalid) → calculateAccessibility → rankHotels
```

It always returns the same shape: `{ status, errors, importanceTotal, recommendedHotelId, rankedHotelIds, hotels }`. If the scenario is invalid, `status` is `INVALID_SCENARIO`, `errors` lists the problems and every derived field is empty or `null`.

**Why.** The rule "an invalid scenario never produces a ranking" belongs to the business logic, not to the UI. Putting it in one function means it is tested once (in `ranking.test.js`) and the hook cannot accidentally show a partial result. It also keeps the hook to a single `useMemo` call.

**Alternative considered.** The hook calling validate, calculate and rank separately. Rejected: it would spread the stale-result rule into the application layer.

**Related choice.** The Stage 1 stub suggested `validateScenario(city, budget, importanceMap)`. Instead, `applyImportance()` first builds a copy of the city with the current importance values, and both validation and calculation work on that same copy — so they can never disagree about which importance values are in effect.

---

## 4. React state through `useComparator` (planning, implemented in Stage 3)

**Decision.** One custom hook with one `useState` object and one `useMemo`. No Redux, Zustand or Context.

```text
state = null                                    before "Load Aura City"
state = { city, budgetInput, importanceInputs, selectedHotelId }
comparison = useMemo(() => compareHotels(...), [city, budgetInput, importanceInputs])
```

**Why.**
- Only three values change (budget, importance values, selected hotel), so built-in React state is enough.
- Derived values (contributions, totals, ranks, recommendation) are never stored, so they cannot drift out of sync with the inputs.
- `selectedHotelId` is deliberately **not** a `useMemo` dependency: inspecting a hotel cannot recalculate the comparison. A test checks the comparison object is identical before and after selection.
- `loadCity()` and `reset()` both rebuild the original state from the static dataset in one update, so reset cannot drift from the original.

**Deviations from the architecture document (recorded in Stage 3).**
1. The loaded `city` reference is part of state, because the plan requires a "not loaded" state before `loadCity`.
2. One state object rather than three `useState` calls, so load and reset are each a single assignment.
3. Raw typed input is stored (`budgetInput`, `importanceInputs`), not numbers, so invalid text stays visible for correction (architecture §5.8).

**Input conversion.** `toNumberInput` converts only plain decimal strings (`"41000"`, `" 2 "`). Anything else — `""`, `"abc"`, `"1e3"`, `"33,000"` — is passed through unchanged so domain validation rejects it. An empty budget therefore never silently becomes ₹0.

---

## 5. Exact integer rounding (planning, implemented in Stage 2)

**Decision.** Averages are rounded half-up to tenths with the assignment's integer formula:

```text
tenths = floor((20 × weightedTotal + importanceTotal) / (2 × importanceTotal))
```

and displayed by building the string from the integer (`554 → "55.4"`, `790 → "79.0"`).

**Why.** Floating-point division can store a value like 28.05 as 28.0499…, which `Math.round` or `toFixed` would round down. The integer formula is exact for all valid inputs (the largest possible total is 15 × 5 × 600 = 45,000, far within safe-integer range).

**Alternative considered.** `(total / importanceTotal).toFixed(1)` — rejected because its rounding of exact halves depends on binary representation.

Display rounding never affects ranking: ranking uses the exact integer total. A test shows two hotels with totals 2,492 and 2,493 (both displaying 55.4) ranked by the exact total.

---

## 6. Ranking and tie-breaking (planning, implemented in Stage 2)

**Decision.** Affordable hotels (`stay_cost ≤ budget`) are sorted by weighted total, then stay cost, then hotel ID; ranks are 1…n without gaps; rank 1 is recommended.

**Implementation choices.**
- IDs are compared with `<` / `>`, not `localeCompare`. `localeCompare` can order `-`, `_` and digits differently by locale; plain comparison gives ASCII order for valid IDs. Tested with `H-1 < H0 < HA < H_1`.
- `remainingBudget` is set only for affordable hotels and `shortfall` only for over-budget ones (the other is `null`), matching the requirement's "remaining budget or shortfall".
- Over-budget hotels are listed after ranked ones in dataset order, so their order does not look like a ranking.
- No affordable hotel returns status `NO_AFFORDABLE_HOTEL` with `errors: []` — a valid result, kept distinct from `INVALID_SCENARIO`.

---

## 7. Schematic SVG map (planning, implemented in Stage 4)

**Decision.** A hand-written SVG. The dataset's normalized 0–100 coordinates are scaled into a 1000 × 1000 viewBox. Only the inspected hotel's 15 comparison links are drawn.

**Why.** The assignment requires a schematic, not a geographic map. A custom SVG needs no dependency and gives full control over markers and links.

**Implementation choices.**
- Markers use shape *and* colour: hotels are squares, attractions circles, food stops diamonds. The recommended hotel gets a ★.
- Markers are labelled with short codes (H1–H10, P1–P15) rather than full names, because 25 full names overlap — some markers almost coincide (Celestial Crown Hotel at (50,50) and Honeycomb Sweet House at (48,48)). Full names are in each marker's accessible label and tooltip, the legend, and the travel-time table.
- Each link's accessible label and tooltip state the supplied round-trip time and the contribution, taken from the domain result. A note says lines are comparisons, not roads, and that their length has no relation to travel time.
- `TravelTimeTable` (exported from `SchematicMap.jsx`) is the map's accessible text equivalent: the full 10 × 15 matrix, with the inspected hotel's row highlighted.
- When input is invalid, markers stay (they are presentation data) but links and highlights are removed.

**Alternative considered.** A mapping library (Leaflet, etc.) — rejected: adds a dependency and implies real geography.

---

## 8. Static dataset, no backend (planning)

**Decision.** The Aura scenario is a static JSON file bundled with the app. All calculation is local.

**Why.** The assignment excludes databases, external APIs, live maps and geocoding, and requires deterministic data that reset restores exactly. A bundled JSON import is immutable in practice and loads in one action.

`data/dataset.json` (as supplied) and `src/data/cityData.json` (runtime copy) are byte-identical; the Python verification script fails if they ever differ.

---

## 9. Testing strategy and expected-results fixture (planning + implementation)

**Decision.** Most tests target the pure domain layer; the hook and UI get focused tests; expected main-scenario results live in a test-only fixture produced by a separate calculation path.

| Level | File(s) | Focus |
|---|---|---|
| Domain unit | `validation.test.js`, `calculations.test.js`, `ranking.test.js` | Every rule and boundary, tie-breaks, invalid inputs, fixture comparison |
| Architecture | `boundaries.test.js` | No fixture imports, no React in domain, no coordinates in calculations |
| Hook | `useComparator.test.jsx` | Load, edits, selection, invalid input, reset |
| UI integration | `Dashboard.test.jsx` | Renders the real `App` and drives it like a user |

**The fixture.** `tests/fixtures/expectedResults.json` is generated and checked by `tests/fixtures/verify_expected_results.py`, which recomputes every value from the original `data/dataset.json` in Python using exact `Fraction` arithmetic — a different method from the JavaScript integer formula. During Stage 2, its initial-scenario and ₹41,000 values were also cross-checked against the expected-results file produced in the Antigravity planning phase (`docs/expectedResults.json`, since removed); they matched exactly.

**What changed during implementation.** The planning-phase file documented the importance what-if as Gilded Gallery 3 → 1 (total 43), while `implementation-plan.md` specified 3 → 2 (total 44). Both change the recommendation to Riverside Atelier. The project owner chose 3 → 2; the new fixture uses it and the old file was removed so there is a single authoritative fixture.

**Test tooling fix (Stage 4).** Vitest 3 runs on its own bundled Vite 7, which `@vitejs/plugin-react` 6 (built for Vite 8) does not configure for JSX. `vite.config.js` therefore sets `esbuild: { jsx: 'automatic' }` only when `process.env.VITEST` is set. The production build is unaffected. The alternative was upgrading to Vitest 4; a one-line, test-only config was preferred over changing dependencies.

---

## 10. Things deliberately not built

- Optional budget timeline (AC-30) — optional; not implemented.
- Persistence, accounts, itinerary planning, routing, geocoding, file import, city editor — out of scope per `requirements.md` §1.4.
- Clickable map markers — selection is done from the ranking table and the travel-time table, keeping the SVG simple.
