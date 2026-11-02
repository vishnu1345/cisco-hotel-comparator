# AI Interaction Log

This log records how AI tools were used to build the Hotel Base-Camp Comparator.

Two AI tools were used:

1. **Google Antigravity** — planning and Stage 1 (project setup).
2. **Claude Code (Claude Opus 5.5)** — inspection of Stage 1, then Stages 2–5, in one session on 2 November 2026.

## Sources and how to read this log

| Label | Meaning |
|---|---|
| **Recorded** | Taken directly from the Claude Code session, the Git history, or files in this repository. |
| **Summarized** | A shortened description of a longer exchange; the wording is not verbatim. |
| **Not available** | No record exists in this repository. Nothing is invented to fill the gap. |

Short quotations in "quotes" are the project owner's own words from the Claude Code session.

---

## Phase A — Planning and Stage 1 in Antigravity

**Not available:** the Antigravity prompts and conversations are not stored in this repository, so they are not reproduced here.

**Recorded (from the artifacts Antigravity left):**

| Activity | Evidence |
|---|---|
| Requirements analysis | `docs/requirements.md` — SRS with FR-01–FR-51, NFRs, AC-01–AC-30, TC-01–TC-74 and open questions |
| Dataset verification | Summarized in `docs/implementation-plan.md` ("Verified scenario baseline"); a separate expected-results file `docs/expectedResults.json` existed at the start of the Claude Code session |
| Architecture design | `docs/architecture.md` — four layers, module responsibilities, state rules, SVG map, testing strategy, trade-offs |
| Implementation planning | `docs/implementation-plan.md` — Stages 1–5 with tasks, definitions of done and verification |
| Stage 1 setup | React + Vite + Vitest scaffold, folder structure, dataset copy at `src/data/cityData.json`, stub modules and components, one smoke test (all present before Git was initialised; committed as the Stage 1 baseline `d8605d0`) |

**Recorded (from the project owner's handover message to Claude Code):** Antigravity was used for planning and completed Stage 1; its usage quota ran out, so implementation continued in Claude Code. The handover listed the verified scenario results (initial recommendation, ₹41,000 what-if, Gilded Gallery 3 → 2 what-if) and set the working rules below.

---

## Phase B — Claude Code session

### Working rules set by the project owner (Recorded, summarized)

The handover message asked Claude to:

- inspect the project and planning documents first, and not code until confirmed;
- implement one stage at a time, explain files and decisions, run tests and show real results, then stop for review;
- avoid new dependencies, abstractions and architectural complexity; prefer code the owner can explain in an interview;
- ask rather than invent when a requirement is ambiguous;
- never claim tests passed without running them.

Every stage below followed this cycle: owner prompt → Claude implements and reports → owner reviews → owner asks for a commit with explicit pre-commit checks → Claude commits and confirms.

### B1. Inspection of Stage 1

**Prompt (summarized):** inspect the three planning docs, the dataset and the Stage 1 files; report what is complete, what is missing, and whether the project is ready for Stage 2.

**What Claude did (Recorded):**
- Read the three planning documents and all Stage 1 files; ran the test suite (1 test passed), the build and oxlint.
- Verified the dataset with a separate Python check: 10 hotels, 15 places, 150 travel times, 9 attractions / 6 food stops, importance 1–5, valid unique IDs, coordinates 0–100; `src/data/cityData.json` byte-identical to `data/dataset.json`.
- Reproduced all handover results (initial ranking, ₹41,000, Gilded 3 → 2) and found that ₹40,999 keeps Celestial Crown excluded.

**Issues reported (Recorded):**
1. `docs/expectedResults.json` used Gilded Gallery **3 → 1** (total 43), while the implementation plan and handover used **3 → 2** (total 44). Both change the recommendation to Riverside Atelier.
2. The expected-results file was in `docs/`, not the planned `tests/fixtures/`.
3. The plan adds city-ID uniqueness and coordinate checks that `requirements.md` doesn't mention.
4. Leftover Vite template files and README.
5. The project was not a Git repository.

**Human decisions (Recorded):**
> "Use Gilded Gallery (`PLACE_GILDED_01`) importance 3 → 2, as specified in the finalized implementation plan."

Also: move the fixture to `tests/fixtures/` and remove the `docs/` copy after verifying it; keep city-ID uniqueness and 0–100 coordinate validation; defer template cleanup to Stage 4 and the README to Stage 5; initialise Git with a baseline Stage 1 commit.

### B2. Git initialisation and Stage 2 — Domain logic

**Prompt (summarized):** implement validation, calculations and ranking as pure functions with comprehensive Vitest tests; create and independently verify `tests/fixtures/expectedResults.json`; no React.

**Claude's implementation decisions (Recorded; reasons in `design-decisions.md`):**
- Initialised Git, added `coverage` to `.gitignore`, committed the Stage 1 baseline.
- `validateScenario` returns all errors as `{ path, message }` with index-based paths.
- `compareHotels()` as the single pipeline that returns no derived results for invalid input.
- `applyImportance()` builds the current scenario before validation, instead of the stub's `validateScenario(city, budget, importanceMap)` signature.
- Integer round-half-up and string formatting from tenths; ASCII ID comparison with `<`/`>` instead of `localeCompare`.
- `verify_expected_results.py` as the independent calculation path (Python, exact fractions), generating and checking the fixture.

**Verification (Recorded):** the new fixture's initial and ₹41,000 values matched the Antigravity `docs/expectedResults.json` exactly; the old file was then removed with `git rm`.

**Problems found by Claude while testing (Recorded):** the 15-place test helper placed coordinates above 100; the boundary test matched `map_position` inside a comment. Both were test-code bugs and were fixed. Result: 152 tests passed.

**Human review:** approved; asked for a commit after `git status`, a generated-file check, tests, oxlint, fixture check and a staged-diff review. Committed as `d797500`.

### B3. Stage 3 — Application state

**Prompt (summarized):** implement `useComparator` with `useState`/`useMemo` only, using `compareHotels()` as the only calculation path; handle text input carefully ("Do not silently turn empty or invalid input into zero"); test the hook.

**Claude's implementation decisions (Recorded):**
- One state object `{ city, budgetInput, importanceInputs, selectedHotelId }`, `null` before loading.
- Raw input stored; `toNumberInput` converts only plain decimal strings.
- Selection excluded from `useMemo` dependencies, so inspection never recalculates.
- Per-field `budgetError` and `importanceErrors` derived from the domain's error paths.
- Unknown hotel or place IDs ignored.

**Deviations reported to the owner (Recorded):** city reference kept in state; one state object instead of three; raw input instead of numbers; `setImportance` takes a place ID.

**Result:** 205 tests passed, oxlint clean, build succeeded. Approved and committed as `6f08ed1` after the same pre-commit checks.

### B4. Stage 4 — User interface

**Prompt (summarized):** build the full dashboard with the existing components and hook; empty state with "Load Aura City"; budget and importance editing; ranking; details; breakdown; SVG map with 25 markers; accessible travel-time table; reset; clean up template files; component and integration tests; don't change domain modules.

**Claude's implementation decisions (Recorded):**
- `Dashboard` is the only component that calls the hook; the rest receive props.
- Added `format.js` for currency and number formatting and H#/P# codes.
- Map markers labelled with codes plus a legend (full names overlapped); shape plus colour per marker type; links only for the inspected hotel.
- `TravelTimeTable` exported from `SchematicMap.jsx` as the map's text equivalent.
- Importance inputs stay editable when input is invalid; calculated cells show "—".
- Removed `src/App.css`, `src/assets/*`, `public/icons.svg`; set the page title; replaced the Vite favicon.

**Iteration in the browser (Recorded):** Claude ran the app in the Claude desktop browser pane and adjusted the layout after seeing wrapped place names and an overflowing ranking table (moved the map next to the ranking and the details next to the breakdown; let status text wrap). It also removed dataset importance from map marker labels, which would have gone stale after an edit.

**Earlier-stage file changed (Recorded):** all new UI tests failed with `React is not defined`. Claude traced it to Vitest 3 using Vite 7, which `@vitejs/plugin-react` 6 doesn't configure for JSX. Claude explained this before making the change, then added a Vitest-only `esbuild.jsx: 'automatic'` setting to `vite.config.js` (the first version caused a harmless build warning, so it was limited to Vitest runs).

**Result:** 230 tests passed, oxlint clean, build succeeded with no warnings.

**Human review (Recorded):**
> "Stage 4 is approved as it currently stands. I do not want any additional UI changes or polish."

Committed as `7cc02be`, with `.claude/launch.json` (the browser-pane dev-server config) deliberately left untracked at the owner's request.

### B5. Stage 5 — Testing and finalization

**Prompt (summarized):** write the README, this log, design decisions and test plan; save genuine screenshots and evidence; run final verification; don't redesign or add features; "Do not invent interview evidence or AI interaction history"; stop before the final commit.

**What Claude did (Recorded):**
- Re-ran all checks and saved their real output to `docs/test-evidence/`.
- Captured 14 screenshots of the running dev server with a headless-Chrome script (kept outside the repository) that clicks and types in the real UI. The browser-pane screenshots were only 800 px wide, so this script was used for full-resolution images.
- Wrote `README.md`, `docs/design-decisions.md`, `docs/test-plan-and-results.md` and this log.
- One evidence command initially failed silently (zsh expanded an unquoted `*.js`); Claude re-ran it correctly and the saved file contains the corrected run.

No source, test, dataset or planning file was changed in Stage 5.

**Human review (Recorded):** the owner asked to "Commit Stage 5"; committed as `d48b3eb` after the same pre-commit checks. The owner then approved a follow-up commit updating this log's commit table.

---

## Commit history (Recorded)

| Commit | Time (IST) | Message |
|---|---|---|
| `d8605d0` | 2026-11-02 19:49 | Stage 1: React + Vite + Vitest project setup |
| `d797500` | 2026-11-02 19:57 | Stage 2: Implement domain validation, calculations, and ranking |
| `6f08ed1` | 2026-11-02 20:01 | Stage 3: Implement React comparator state management |
| `7cc02be` | 2026-11-02 20:19 | Stage 4: Implement hotel comparison dashboard and UI |
| `d48b3eb` | 2026-11-02 20:28 | Stage 5: Add documentation, screenshots, and test evidence |

Each commit made by Claude Code carries a `Co-Authored-By: Claude Opus 5.5` trailer.

## Summary of human control points

| Decision | Made by |
|---|---|
| Use Antigravity, then Claude Code; stage-by-stage workflow with review stops | Project owner |
| Importance what-if 3 → 2 (over the 3 → 1 in the earlier file) | Project owner |
| One authoritative fixture in `tests/fixtures/`; remove the `docs/` copy | Project owner |
| Keep city-ID uniqueness and 0–100 coordinate validation | Project owner |
| Initialise Git; commit only after explicit pre-commit checks | Project owner |
| Approve each stage; freeze the UI after Stage 4; keep `.claude/` out of Git | Project owner |
| Module APIs, error format, pipeline function, hook state shape, input conversion, UI layout, map labelling, test design, JSX test config | Proposed and implemented by Claude; reviewed and approved by the project owner at each stage |
