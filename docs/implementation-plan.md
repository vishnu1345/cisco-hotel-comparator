# Cisco Hotel Base-Camp Comparator — Implementation Plan

## Planning work completed

- Requirements analysis: completed against the finalized requirements baseline.
- Dataset verification: completed for the supplied `dataset.json`.
- Architecture design: completed; implementation follows the finalized four-layer client-side architecture.

### Verified scenario baseline

- City: Aura; currency: INR; initial budget: ₹33,000.
- Dataset contains exactly 10 hotels, 15 wishlist places, and 150 hotel-to-place round-trip times (a complete 10 × 15 matrix).
- The wishlist contains 9 attractions and 6 food stops. Importance values span 1–5.
- Initial affordable hotels: 5. Initial recommendation: The Meridian House (`HOTEL_AURA_03`). The cheapest affordable hotel is Juniper Lane Inn, so the recommendation is not simply the cheapest option.
- The uniquely most accessible hotel is Celestial Crown Hotel (`HOTEL_AURA_01`); its weighted total is 1,558 and complete-stay cost is ₹41,000. At the initial budget it is over budget; raising the budget to exactly ₹41,000 makes it the recommendation.
- At least one affordable hotel has all round trips at or below 90 minutes (The Meridian House, maximum 88); at least one affordable hotel has a round trip over 90 minutes.
- Verified importance what-if: lower The Gilded Gallery (`PLACE_GILDED_01`) from importance 3 to 2. The recommendation changes from The Meridian House to Riverside Atelier (`HOTEL_AURA_04`).
- Map positions are presentation coordinates only. All travel times are supplied by the dataset.

## 1. Project Setup

**Objective**

Create the smallest runnable React + Vite JavaScript project and establish the agreed file layout and test runner.

**Files to create or modify**

- `package.json`, Vite configuration, `index.html`
- `src/main.jsx`, `src/App.jsx`
- `src/data/cityData.json` (copy the verified source dataset without adding calculated results)
- `src/domain/`, `src/hooks/`, `src/components/`
- `vitest.config.js` (or equivalent minimal Vitest setup)

**Ordered tasks**

1. Initialize React with Vite using JavaScript; avoid TypeScript and extra frameworks.
2. Create the four-layer folders: data, domain, application state (`hooks`), and presentation (`components`).
3. Add only the necessary dependencies: React, Vite, Vitest, and React Testing Library.
4. Configure Vitest and a basic test script.
5. Place the verified dataset in `src/data/cityData.json`. Establish `tests/fixtures/` as part of the test folder structure; expected results are created and independently verified in Stage 2.

**Definition of done**

- The starter application runs locally and the test runner discovers a trivial test.
- The agreed folder structure exists and the runtime data file contains no precomputed ranking or recommendation.

**Tests / verification**

- Start the Vite development server and confirm the starter page loads.
- Run Vitest and confirm the initial test passes.
- Check dataset counts: 10 hotels, 15 wishlist places, and exactly 150 round-trip values.

## 2. Domain Logic

**Objective**

Implement and independently test validation, weighted accessibility, affordability, ranking, and recommendation as plain JavaScript functions, independent of React and SVG.

**Files to create or modify**

- `src/domain/validation.js`
- `src/domain/calculations.js`
- `src/domain/ranking.js`
- `tests/validation.test.js`
- `tests/calculations.test.js`
- `tests/ranking.test.js`
- `tests/fixtures/expectedResults.json`

**Ordered tasks**

1. Validate the entire scenario before producing results: hotel count 2–10 and place count 3–15; every city, hotel, and place ID matches `^[A-Z][A-Z0-9_-]{0,15}$`, with IDs unique across the complete scenario (including city, hotels, and places); non-empty trimmed names; valid categories; budget integer 0–1,000,000; hotel stay cost integer 1–1,000,000; importance integer 1–5; map coordinate bounds; and each hotel has exactly one mapping for every wishlist place, with round-trip time an integer 1–600.
2. On any invalid scenario or editable value, return clear validation errors and no partial or stale comparison results.
3. Calculate each contribution as `importance × supplied round-trip minutes`; sum contributions for `weightedTravelTotal` and importance values for `importanceTotal`.
4. Calculate the one-decimal average using Cisco's exact integer-only round-half-up formula for non-negative values: `floor((20 * weightedTravelTotal + importanceTotal) / (2 * importanceTotal))`. This yields rounded tenths; display as tenths divided by 10 with exactly one decimal place. Keep display rounding out of ranking.
5. Classify affordability using `stay_cost <= budget`; calculate remaining budget or shortfall.
6. Rank affordable hotels by exact weighted total ascending, then stay cost ascending, then hotel ID in ascending ASCII order. Assign continuous ranks and recommend rank 1. Keep over-budget hotels visible and unranked; return `NO_AFFORDABLE_HOTEL` if none qualify.
7. Create `tests/fixtures/expectedResults.json` in this stage and independently calculate and verify the main-scenario expected outputs through a separate calculation path (such as a spreadsheet or explicit test constants). Record every hotel's weighted total, rounded one-decimal average, affordability, remaining budget or shortfall, and initial rank where applicable. Never import this fixture from `src/` or use it as runtime input.

**Definition of done**

- Domain modules accept plain data and return deterministic results without importing React, SVG, map coordinates, or the expected-results fixture.
- The expected-results fixture records every hotel's weighted total, one-decimal average, affordability, remaining budget or shortfall, and initial rank where applicable.

**Tests / verification**

- Test valid and invalid datasets, invalid-format IDs and duplicate IDs across city, hotels, and places; missing and unknown place mappings; exact numeric bounds and values just outside them; and invalid editable values.
- Test contribution arithmetic, totals, importance denominator, and round-half-up display rounding.
- Test affordability at the boundary (hotel cost exactly equals budget) and one currency unit above it, plus below-boundary behavior; over-budget visibility; no-affordable-hotel behavior; exact tie-break order; continuous ranks; and that exact totals—not displayed averages—determine ranking.
- Compare calculated main-scenario output with the independently produced test fixture.
- Verify no runtime module imports `tests/fixtures/expectedResults.json` and no calculation reads map geometry.

## 3. Application State

**Objective**

Connect validated inputs to the pure domain functions with one small React hook and predictable derived results.

**Files to create or modify**

- `src/hooks/useComparator.js`
- `tests/useComparator.test.jsx` (or the equivalent focused hook/integration test)

**Ordered tasks**

1. Provide a `loadCity` action that initializes the complete bundled dataset in one state update, including budget and place importance values; retain the original values for reset. Before this action, show no partial comparison.
2. After loading, track the inspected hotel, defaulting to `HOTEL_AURA_03` (the initial recommendation).
3. Expose focused actions for loading the city, budget changes, place-importance changes, hotel inspection, and reset.
4. Derive validation status and comparison results from current inputs using the domain functions; use `useMemo` where it keeps this flow clear.
5. For invalid edits, expose the error and clear derived ranks, recommendation, contributions, and map highlights so stale output is not shown.
6. Ensure budget edits only affect affordability and ranks; importance edits recalculate contributions, totals, averages, ranking, and recommendation.
7. Reset the full original scenario state, including budget, all importance values, inspected hotel, and stable dataset values.

**Definition of done**

- `useComparator.js` is the sole application-state coordination point; calculations remain in domain modules.
- One `loadCity` action initializes the complete scenario, valid edits update the correct derived values, invalid edits expose no stale comparison, and reset exactly restores the baseline.

**Tests / verification**

- Exercise the one-action city load, initial results, budget and importance updates, hotel selection, invalid input handling, and full reset.
- Confirm budget-only edits leave contributions and weighted totals unchanged.
- Confirm the budget what-if recommends Celestial Crown Hotel at exactly ₹41,000.
- Confirm the Gilded Gallery 3→2 what-if recommends Riverside Atelier, and reset restores The Meridian House.

## 4. User Interface

**Objective**

Present the comparison as one understandable dashboard with accessible controls, ranked hotels, transparent details, and a synchronized schematic SVG map.

**Files to create or modify**

- `src/components/Dashboard.jsx`
- `src/components/BudgetControl.jsx`
- `src/components/HotelRanking.jsx`
- `src/components/HotelDetails.jsx`
- `src/components/ContributionBreakdown.jsx`
- `src/components/SchematicMap.jsx`
- `src/App.jsx` and minimal styles (for example, `src/styles.css`)

**Ordered tasks**

1. On the initial screen, provide one clearly labelled `Load Aura City` action. A single activation loads the complete bundled city scenario at once: all hotels, wishlist places and their importance values, the full supplied travel-time matrix, map positions, and initial budget. Do not require the user to add or load these parts separately.
2. Add a budget control and an importance control for each wishlist place, with visible validation feedback.
3. Show all hotels in rank order, including over-budget hotels with their shortfall and no numerical rank. Mark the recommendation and excluded states with text or symbols as well as color.
4. Show selected-hotel details: complete-stay cost, affordability, remaining budget or shortfall, weighted total, one-decimal average, rank when affordable, and all place times and contributions.
5. Add a contribution breakdown traceable to each place.
6. Draw all 10 hotel and 15 place markers from presentation coordinates in the custom SVG. On inspection, highlight only that hotel's 15 comparison links and expose supplied time and weighted contribution.
7. Keep an accessible hotel-by-place time table (or equivalent) synchronized with the SVG. Clearly label links as comparisons rather than routes.
8. Add a reset control wired to the hook.

**Definition of done**

- The dashboard shows the complete 25-marker schematic, all 10 hotels, budget and eligibility, recommendation rationale, and selected hotel's complete contribution explanation.
- Map geometry is used only to position and draw markers and comparison lines; all displayed times and calculations come from dataset/domain results.

**Tests / verification**

- Use React Testing Library to verify one-action city loading, initial recommendation, budget and importance controls, hotel inspection, invalid-state messaging, and reset.
- Confirm all hotels and places remain represented, only selected-hotel comparison links are highlighted, and map/table labels agree.
- Keyboard-operate controls and confirm recommendation/over-budget status is not communicated by color alone.

## 5. Testing and Finalization

**Objective**

Verify the complete assignment against the finalized requirements, document how to run and demonstrate it, and prepare a concise live-interview walkthrough.

**Files to create or modify**

- Domain and UI test files from the previous stages (consume the Stage 2 fixture without recreating or changing it)
- `README.md`
- `docs/ai-interaction-log.md`
- `docs/design-decisions.md`
- `docs/test-plan-and-results.md`
- Application screenshots and test evidence (for example, under `docs/screenshots/` and `docs/test-evidence/`)
- Small fixes in `src/` and `tests/` as findings require

**Ordered tasks**

1. Run the full unit and integration suite and fix discrepancies against the independently verified Stage 2 expected-results fixture.
2. Perform acceptance checks: exactly 10 hotels, 15 places and 25 labelled markers; 4–7 affordable hotels; initial and boundary recommendations; both what-if demonstrations; complete detail inspection; invalid-state clearing; and exact reset.
3. Compare the application's totals, averages, affordability, shortfalls, and initial ranks with the Stage 2 independently verified fixture; resolve any mismatch at its source without recreating or changing the fixture in this stage.
4. Review data flow and code for architecture boundaries: domain logic has no React/SVG dependencies, runtime does not import expected results, and no travel-time calculation uses map geometry or external services.
5. Write a concise README covering setup, run/test commands, four-layer structure, calculation/ranking rules, and the two demonstrations.
6. Complete `docs/ai-interaction-log.md`, `docs/design-decisions.md`, and `docs/test-plan-and-results.md` with concise, accurate records of the assignment work.
7. Capture application screenshots and retain test evidence, including the test run/results and acceptance walkthrough outcomes, in the documentation folders.
8. Prepare a short interview demonstration: initial recommendation and rationale; raise budget to ₹41,000; reset; lower The Gilded Gallery to importance 2; inspect a hotel and trace one contribution; reset again.
9. Keep changes small and direct; omit optional features and additional abstractions.

**Definition of done**

- Tests and acceptance checks pass; the Stage 2 expected results remain independently verified and isolated to tests.
- README and required documentation are complete; application screenshots and test evidence are saved. README instructions reproduce the app and checks. The interview walkthrough can be completed from the default scenario without setup or external services.

**Tests / verification**

- Run the full Vitest suite and the documented development-server command.
- Complete the acceptance walkthrough from a clean reload and verify reset reproduces the same matrix and initial result.
- Confirm no backend, database, external API, route-finding, itinerary, or geometry-derived travel-time logic was introduced.
