# Test Plan and Results

**Final run:** 2 November 2026, on commit `7cc02be` (Stage 4) plus the uncommitted Stage 5 documentation. No source or test files changed in Stage 5.

| Check | Command | Result | Evidence |
|---|---|---|---|
| Test suite | `npx vitest run --reporter=verbose` | **7 files, 230 tests passed, 0 failed** | [test-evidence/vitest-run.txt](test-evidence/vitest-run.txt) |
| Lint | `npx oxlint` | exit code 0, no warnings | [test-evidence/oxlint-run.txt](test-evidence/oxlint-run.txt) |
| Production build | `npx vite build` | built successfully, no warnings | [test-evidence/build-run.txt](test-evidence/build-run.txt) |
| Fixture check | `python3 tests/fixtures/verify_expected_results.py` | `OK: expectedResults.json matches the independent calculation` | [test-evidence/fixture-verification.txt](test-evidence/fixture-verification.txt) |
| Dataset, counts, boundaries | see file | dataset unchanged; 10 / 15 / 25 / 150; no fixture imports | [test-evidence/final-verification.txt](test-evidence/final-verification.txt) |

Code coverage was not measured (no coverage tool is installed), so no coverage percentage is claimed.

---

## 1. Test approach

- **Domain logic is tested hardest**, because it holds every business rule. Tests call the pure functions directly, using either the real Aura data or tiny hand-built cities (`tests/testScenarios.js → makeCity`) for tie-break and boundary cases.
- **Expected main-scenario results come from a separate calculation path.** `tests/fixtures/expectedResults.json` is produced by `tests/fixtures/verify_expected_results.py`, which recomputes everything from `data/dataset.json` in Python with exact fractions. JavaScript tests compare the app's own output against it. The fixture is never imported by `src/`.
- **The hook is tested with `renderHook`** to check state, actions and derivation without the UI.
- **The UI is tested by rendering the real `<App />`** and interacting through labels, roles and buttons, as a user would.
- **Many test names carry requirement IDs** (`TC-xx`, `AC-xx` from `requirements.md` §6–7), so the mapping below can be checked by searching the test files.

## 2. Test inventory

| File | Tests | What it covers |
|---|---:|---|
| `tests/validation.test.js` | 81 | Valid dataset; min/max sizes; inclusive bounds; counts; ID pattern, length and global uniqueness (city, hotels, places); names and whitespace; place types; stay cost, travel time, importance and budget bounds (including fractions, strings, NaN); missing, unknown and malformed travel mappings; coordinates; reporting all errors at once |
| `tests/calculations.test.js` | 27 | Contribution arithmetic; totals and importance total; round-half-up including exact halves and values just below; one-decimal formatting; per-place details in wishlist order; Aura totals vs. fixture; importance changes affect exactly one place for every hotel; Gilded 3 → 2 vs. fixture; map-geometry independence |
| `tests/ranking.test.js` | 40 | Affordability boundary; remaining budget and shortfall; ranking order; tie-break by cost and by ASCII ID; exact total vs. displayed average; input-order independence; consecutive ranks; over-budget visibility; no-affordable; Aura initial, ₹41,000, ₹40,999, importance and ₹17,999 scenarios vs. fixture; invalid inputs clear every derived field; purity and determinism |
| `tests/boundaries.test.js` | 3 | No `src/` import of the fixture; no React or DOM in domain modules; no map coordinates in calculations or ranking |
| `tests/useComparator.test.jsx` | 53 | Before loading; `loadCity`; budget updates and boundary; numeric text input; no-affordable; 8 invalid budget forms; recovery; importance updates; 5 invalid importance forms; selection (valid, invalid IDs, over-budget, through an invalid edit); memoised comparison unchanged by selection; reset (including from invalid state and repeated); `toNumberInput` |
| `tests/Dashboard.test.jsx` | 25 | Empty state; loading; 10 hotels in order; recommendation; default inspection; 25 markers; 15 links with labels; schematic note; 15-row breakdown; 10 × 15 table; selection from the ranking and the table; budget ₹41,000 / ₹40,999; invalid and empty budget; recovery; NO_AFFORDABLE_HOTEL; importance 3 → 2 and 3 → 5; invalid importance; reset |
| `tests/setup.test.js` | 1 | Stage 1 smoke test |
| **Total** | **230** | |

## 3. Requirement-to-test mapping

The "Where" column names the test file and the `describe`/`it` text to search for.

### Calculations and rounding

| Requirement | Test(s) | Where |
|---|---|---|
| TC-01–TC-04, AC-19 Contribution arithmetic, totals, average | `contribution arithmetic (AC-19)` | calculations |
| TC-05, AC-20 28.05 → 28.1 | `rounds an exact .x5 up …` | calculations |
| Other rounding cases | `rounds other exact half-way values up`, `rounds values just below half-way down`, 9-case table | calculations |
| TC-06, TC-12, AC-21 Equal display, different exact total | `ranks by exact total even when displayed averages are equal` | ranking |
| FR-15 All places in every comparison | `includes every wishlist place …`, `… sum of its 15 contributions` | calculations |
| TC-68 Geometry independence | `independence from map geometry (TC-68)`; `calculation and ranking code never reads map coordinates` | calculations, boundaries |

### Ranking and affordability

| Requirement | Test(s) | Where |
|---|---|---|
| TC-07 Lower total first | `ranks the lower weighted total first (TC-07)` | ranking |
| TC-08, AC-13 Tie → lower cost | `(TC-08)`; `applies the tie-breaks end to end` | ranking |
| TC-09, AC-14, AC-22 Full tie → ASCII ID | `(TC-09)`; `uses ASCII order, not locale order …` | ranking |
| TC-10 Consecutive ranks | `assigns unique consecutive ranks starting at 1 (TC-10)` | ranking |
| TC-11 Over-budget lowest total never recommended | `(TC-11)`; `recommends rank 1, never the over-budget hotel …` | ranking |
| TC-13–TC-15, AC-11, AC-12, AC-23 Budget boundary | `affordability (AC-11, AC-12, AC-23)`; hook `… exactly the budget … one unit over …`; UI `₹41,000` / `₹40,999` | ranking, hook, UI |
| TC-16–TC-18, AC-24 Budget changes keep contributions | `changes affordability and ranks but not contributions …`; hook `(AC-24)`; UI `… without changing contributions` | ranking, hook, UI |
| TC-19 Budget 0 | `treats budget 0 as valid …`; hook `… no-affordable state …` | ranking, hook |
| TC-20, AC-08 Budget what-if | `makes Celestial Crown the recommendation at exactly ₹41,000 (TC-20)` | ranking, hook, UI |
| TC-21, AC-15, AC-27 No affordable hotel | `no affordable hotel (AC-15, AC-27)`; UI `shows NO_AFFORDABLE_HOTEL …` | ranking, UI |

### Importance

| Requirement | Test(s) | Where |
|---|---|---|
| TC-22–TC-25, AC-25 Importance changes | `%s one importance changes that place's contribution for every hotel …`; hook `(AC-25)`; UI `updates the breakdown and map link labels …` | calculations, hook, UI |
| TC-26, TC-30, AC-09 Gilded 3 → 2 recommends Riverside Atelier | `… Gilded Gallery 3 → 2 …` | calculations, ranking, hook, UI |
| TC-27–TC-29 Importance 0, 6, fractional | validation `rejects importance …`; hook `invalid importance`; UI `rejects an invalid importance …` | validation, hook, UI |

### Validation and invalid state

| Requirement | Test(s) | Where |
|---|---|---|
| TC-31–TC-34 Counts | `validateScenario — counts` | validation |
| TC-35–TC-41, AC-17 IDs and duplicates | `validateScenario — IDs`; ranking `rejects a duplicate-ID scenario (AC-17)` | validation, ranking |
| TC-42–TC-45 Names and types | `validateScenario — names and types` | validation |
| TC-46–TC-51, TC-54–TC-56 Numeric bounds | `validateScenario — numeric bounds` | validation |
| TC-52, TC-53, AC-18 Missing / unknown mappings | `validateScenario — travel-time mappings (AC-18)` | validation |
| Coordinates 0–100 (implementation plan) | `validateScenario — map coordinates` | validation |
| TC-57, TC-58, AC-16, AC-26 Invalid input clears derived results | ranking `invalid input clears all derived results`; hook `invalid budget` / `invalid importance`; UI `rejects invalid text visibly …` | ranking, hook, UI |
| TC-59 No partial ranking | `produces no partial ranking when one record is invalid …` | ranking |
| TC-60 Recovery after correction | ranking `(TC-60)`; hook `recovers …`; UI `recovers when the budget is corrected` | ranking, hook, UI |

### Map, inspection and reset

| Requirement | Test(s) | Where |
|---|---|---|
| TC-61, AC-04 25 labelled markers | `renders all 25 labelled map markers` | UI |
| TC-62, TC-63, AC-05 Only inspected hotel's 15 links | `draws only the inspected hotel's 15 comparison links …`; `updates details, breakdown and map links …` | UI |
| TC-64, AC-06 Times and contributions exposed | link label assertions; `shows all 15 places in the contribution breakdown …` | UI |
| TC-65, AC-28 Inspection doesn't change ranking | hook `does not re-run or change the comparison (AC-28)`; UI `does not change the recommendation or ranking` | hook, UI |
| TC-66 Inspect over-budget hotel | hook `inspects any hotel, including an over-budget one`; UI `… over-budget hotel` | hook, UI |
| TC-67 Link labels update with importance | UI `updates the breakdown and map link labels for the edited place` | UI |
| FR-45 Links are not routes | UI `states that the map is schematic and links are not routes` | UI |
| NFR-13 Synchronized table | UI `shows the full 10 × 15 travel-time table`; `can also be done from the travel-time table …` | UI |
| TC-69–TC-74, AC-10, AC-29 Reset | hook `reset (AC-10, AC-29)` incl. `(TC-73)`; UI `reset` | hook, UI |
| FR-06, AC-01 One-action load | hook `loads the complete Aura scenario in one action`; UI `shows only a Load Aura City action …` | hook, UI |
| AC-02, AC-03 Decision story and independent results | ranking `compareHotels — Aura main scenario (AC-02, AC-03)` | ranking |
| Architecture §10.4 Fixture isolation | `no runtime module imports the expected-results fixture …` | boundaries |

### Not covered by automated tests

- **AC-01 "at least 3 distinct importance values"** is not asserted in JavaScript. It is recorded in the fixture's `dataset_summary` (values 1–5), which the Python script checks, and in `test-evidence/final-verification.txt`.
- **Keyboard-only operation and colour contrast** were not tested automatically. All controls are native `<button>`/`<input>` elements with a visible focus outline.
- **AC-30 budget timeline** is optional and not implemented.

## 4. Expected results (independently calculated)

Source: `tests/fixtures/expectedResults.json`, verified by `verify_expected_results.py`. Each table is asserted value-for-value by the tests listed.

### 4.1 Initial scenario — budget ₹33,000, importance total 45

Recommendation **HOTEL_AURA_03 The Meridian House**. Ranking: 03, 04, 05, 02, 06. Cheapest affordable: HOTEL_AURA_02. Most accessible overall: HOTEL_AURA_01 (over budget). Longest round trip for The Meridian House: 88 min (all ≤ 90); Riverside Atelier has trips over 90 (max 115).

| ID | Hotel | Stay cost | Weighted total | Avg | Affordable | Budget | Rank |
|---|---|---:|---:|---:|---|---|---:|
| HOTEL_AURA_01 | Celestial Crown Hotel | ₹41,000 | 1,558 | 34.6 | No | over by ₹8,000 | — |
| HOTEL_AURA_02 | Juniper Lane Inn | ₹18,000 | 3,159 | 70.2 | Yes | ₹15,000 left | 4 |
| HOTEL_AURA_03 | The Meridian House | ₹22,000 | 2,492 | 55.4 | Yes | ₹11,000 left | 1 |
| HOTEL_AURA_04 | Riverside Atelier | ₹25,000 | 2,546 | 56.6 | Yes | ₹8,000 left | 2 |
| HOTEL_AURA_05 | Amber Courtyard Hotel | ₹29,000 | 2,975 | 66.1 | Yes | ₹4,000 left | 3 |
| HOTEL_AURA_06 | Northstar Lodge | ₹33,000 | 3,456 | 76.8 | Yes | ₹0 left | 5 |
| HOTEL_AURA_07 | Velvet Quay Suites | ₹36,000 | 2,952 | 65.6 | No | over by ₹3,000 | — |
| HOTEL_AURA_08 | The Lantern Residence | ₹45,000 | 2,962 | 65.8 | No | over by ₹12,000 | — |
| HOTEL_AURA_09 | Skyline Pavilion | ₹50,000 | 3,079 | 68.4 | No | over by ₹17,000 | — |
| HOTEL_AURA_10 | Orchid Gate Hotel | ₹55,000 | 2,798 | 62.2 | No | over by ₹22,000 | — |

Tests: `calculations.test.js › matches the independently calculated totals and averages`, `ranking.test.js › reproduces every hotel's independently calculated result`, `useComparator.test.jsx › produces the independently verified initial comparison`.

### 4.2 Budget ₹41,000 (exact cost of Celestial Crown Hotel)

Recommendation **HOTEL_AURA_01 Celestial Crown Hotel** (₹0 left). 7 affordable hotels. Ranking: 01, 03, 04, 07, 05, 02, 06. Over budget: 08 (₹4,000), 09 (₹9,000), 10 (₹14,000). Totals and averages unchanged from 4.1.

### 4.3 Budget ₹40,999 (one rupee below)

Recommendation **HOTEL_AURA_03 The Meridian House**. Celestial Crown Hotel: over budget by ₹1, no rank. 6 affordable hotels. Ranking: 03, 04, 07, 05, 02, 06.

Tests for 4.2 and 4.3: `ranking.test.js › compareHotels — budget what-if`, `useComparator.test.jsx › treats a hotel costing exactly the budget as affordable …`, `Dashboard.test.jsx › recommends Celestial Crown at exactly ₹41,000 …` and `shows Celestial Crown over budget by ₹1 at ₹40,999`.

### 4.4 The Gilded Gallery (PLACE_GILDED_01) importance 3 → 2 — budget ₹33,000, importance total 44

Recommendation **HOTEL_AURA_04 Riverside Atelier**. Ranking: 04, 03, 05, 02, 06.

| ID | Hotel | Weighted total | Avg | Affordable | Rank |
|---|---|---:|---:|---|---:|
| HOTEL_AURA_01 | Celestial Crown Hotel | 1,530 | 34.8 | No | — |
| HOTEL_AURA_02 | Juniper Lane Inn | 3,123 | 71.0 | Yes | 4 |
| HOTEL_AURA_03 | The Meridian House | 2,469 | 56.1 | Yes | 2 |
| HOTEL_AURA_04 | Riverside Atelier | 2,451 | 55.7 | Yes | 1 |
| HOTEL_AURA_05 | Amber Courtyard Hotel | 2,954 | 67.1 | Yes | 3 |
| HOTEL_AURA_06 | Northstar Lodge | 3,426 | 77.9 | Yes | 5 |
| HOTEL_AURA_07 | Velvet Quay Suites | 2,860 | 65.0 | No | — |
| HOTEL_AURA_08 | The Lantern Residence | 2,851 | 64.8 | No | — |
| HOTEL_AURA_09 | Skyline Pavilion | 2,995 | 68.1 | No | — |
| HOTEL_AURA_10 | Orchid Gate Hotel | 2,770 | 63.0 | No | — |

Budget columns are the same as 4.1. Tests: `calculations.test.js › matches the independently calculated Gilded Gallery 3 → 2 results`, `ranking.test.js › recommends Riverside Atelier …`, and the matching hook and UI tests.

### 4.5 No affordable hotel — budget ₹17,999

Status **NO_AFFORDABLE_HOTEL**, no recommendation, no ranks. Every hotel keeps its totals and contributions and shows its shortfall (from ₹1 for Juniper Lane Inn to ₹37,001 for Orchid Gate Hotel). Tests: `ranking.test.js › matches the fixture at ₹17,999 …`, `Dashboard.test.jsx › shows NO_AFFORDABLE_HOTEL with shortfalls and no ranks …`.

## 5. Manual acceptance walkthrough

Done in the running app (Vite dev server) on 2 November 2026. Screenshots were captured from the same running app by a headless Chrome script driving the real UI.

| Check | Observed | Screenshot |
|---|---|---|
| Empty state with one load action | "Load Aura City" only | [01](screenshots/01-empty-state.png) |
| Initial dashboard | Meridian House recommended; 5 of 10 affordable; total importance 45 | [02](screenshots/02-initial-dashboard.png), [03](screenshots/03-recommendation-and-ranking.png) |
| Map | 25 markers; 15 dashed links from H3; "not roads or routes" note | [04](screenshots/04-schematic-map.png) |
| Contribution breakdown | 15 rows; 2,492 ÷ 45 = 55.4 | [05](screenshots/05-contribution-breakdown.png) |
| Travel-time table | 10 × 15 values; H3 row highlighted | [06](screenshots/06-travel-time-table.png) |
| Budget ₹41,000 | Celestial Crown recommended, ₹0 left; 7 of 10 | [07](screenshots/07-budget-41000.png) |
| Budget ₹40,999 | Celestial Crown "Over budget by ₹1", unranked; 6 of 10 | [08](screenshots/08-budget-40999.png) |
| Gilded Gallery 3 → 2 | Riverside Atelier recommended; total importance 44; Meridian 2,469, rank 2 | [09](screenshots/09-importance-gilded-2-ranking.png), [10](screenshots/10-importance-gilded-2-breakdown.png) |
| Budget ₹17,999 | NO_AFFORDABLE_HOTEL; 0 of 10; all shortfalls shown | [11](screenshots/11-no-affordable-hotel.png) |
| Budget `33000.5` | Error at the field and in an alert; ranking, recommendation and links hidden | [12](screenshots/12-invalid-budget.png) |
| Reset | Original budget, importance, inspected hotel and recommendation | [13](screenshots/13-after-reset.png) |
| Phone width (375 px, full page) | Single column; wide tables scroll inside their cards | [14](screenshots/14-mobile.png) |

In the running app, `document.querySelectorAll` counted 10 hotel markers, 9 attraction and 6 food markers (25 total), 15 links, 10 ranking rows, 15 breakdown rows and 150 travel-time cells, with no console errors (recorded in `test-evidence/final-verification.txt`).

## 6. Issues found during testing

| When | Issue | Resolution |
|---|---|---|
| Stage 2 | 15-place test city placed coordinates above 100, so validation (correctly) rejected it | Fixed the test helper's spacing |
| Stage 2 | Boundary test flagged the word `map_position` in a comment | Test now strips comments before checking |
| Stage 4 | All UI tests failed with `React is not defined`: Vitest 3 runs Vite 7, which plugin-react 6 doesn't configure for JSX | `vite.config.js` sets `esbuild.jsx: 'automatic'` only under Vitest; build unaffected |
| Stage 4 | Map place labels included the dataset importance, which would go stale after an edit | Removed importance from marker labels before tests were written |
| Stage 5 | First run of the "no fixture imports" grep in the evidence script didn't execute (zsh expanded an unquoted `*.js`) | Re-ran with quoted patterns; the recorded output is from the corrected run |

No defects were found in the domain logic during Stages 3–5, and the domain modules are unchanged since the Stage 2 commit.
