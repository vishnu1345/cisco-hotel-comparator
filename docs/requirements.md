# Hotel Base-Camp Comparator - Requirements Specification

**Document:** `requirements.md`  
**Project:** SPR26_D2_P03 — Hotel Base-Camp Comparator  
**Context:** Cisco AI-Assisted Coding Interview  
**Document Type:** Software Requirements Specification (SRS)  
**Status:** Approved baseline for pre-implementation planning  
**Version:** 1.0

---

## 1. Project Overview

### 1.1 Problem Statement

A group of friends is planning a city trip and has already finalized a wishlist of places they intend to visit. The wishlist includes famous landmarks, museums, night markets, riverside walks, and signature food destinations.

The group needs to select a hotel that balances two competing factors:

1. **Affordability:** The complete hotel stay must fit within the group's predefined accommodation budget.
2. **Accessibility:** The hotel should minimize the weighted round-trip travel time to all wishlist places, giving greater importance to places the group values more.

Choosing the cheapest hotel may result in excessive travel time, while choosing the most accessible hotel may exceed the accommodation budget.

The application must objectively compare the available hotels, recommend the most accessible affordable option, and explain the recommendation using transparent calculations.

### 1.2 Project Objective

Build an interactive Hotel Base-Camp Comparator that:

- Compares complete-stay hotel prices against a user-defined budget.
- Calculates weighted accessibility using the importance of each wishlist place and its corresponding round-trip travel time.
- Ranks affordable hotels according to exact mathematical rules.
- Recommends the highest-ranked affordable hotel.
- Explains the recommendation through individual travel-time contributions and aggregate calculations.
- Displays all hotels and wishlist places on a labelled schematic city map.
- Allows users to experiment with budget and place-importance changes.
- Restores the original scenario through a reset operation.

The application must calculate recommendations from actual hotel costs, place importance values, and supplied travel times. Documented expected results must never be used as calculation inputs.

### 1.3 Scope

The project includes:

- One fictional city.
- A predefined main demonstration scenario containing exactly 10 hotels and 15 wishlist places.
- A deterministic 10 × 15 round-trip travel-time matrix.
- Hotel affordability calculations.
- Weighted accessibility calculations.
- Exact hotel ranking and recommendation.
- A schematic map containing 25 labelled markers.
- Hotel inspection and contribution explanations.
- Editable budget and place-importance values.
- Reset functionality.
- Input and scenario validation.
- Repeatable testing and independent verification of expected results.

The calculation engine must support configurations containing:

| Entity | Minimum | Maximum | Main scenario |
|---|---:|---:|---:|
| Hotels | 2 | 10 | 10 |
| Wishlist places | 3 | 15 | 15 |

### 1.4 Out-of-Scope Features

The application is a base-camp decision aid, not an itinerary planner.

The following features are explicitly outside the assignment scope:

- Selecting, adding, or removing wishlist places.
- Automatically arranging places into travel days.
- Itinerary planning.
- Route finding.
- Calculating actual roads or driving routes.
- Calculating travel times from map distances or geometry.
- Estimating admission costs.
- Estimating meal costs.
- Estimating transportation costs.
- Hotel booking or reservation functionality.
- User accounts and authentication.
- Database integration.
- Live maps.
- Geocoding.
- Traffic services.
- External APIs.
- A general-purpose city editor.
- A file importer.
- A 150-cell manual travel-time data-entry interface.

The application must use locally processed, candidate-created demonstration data without depending on external services.

---

## 2. Functional Requirements

### 2.1 Scenario and Initial Data Requirements

**FR-01: Fictional City Creation**

The application must provide one fictional city with candidate-created demonstration and test data.

**FR-02: Main Scenario Size**

The main demonstration scenario must contain:

- Exactly 10 hotels.
- Exactly 15 wishlist places.
- Exactly 25 labelled map markers.

**FR-03: Wishlist Place Categories**

The wishlist must contain both:

- Attractions.
- Signature food stops.

There must be at least three places of each category.

**FR-04: Importance Diversity**

The main scenario must use at least three different importance values.

Each place must have an integer importance between 1 and 5, inclusive.

**FR-05: Memorable Display Names**

All 10 hotels and 15 wishlist places must have memorable, non-empty display names.

**FR-06: One-Action City Loading**

The application must allow the user to load the complete fictional city in one action.

Loading must initialize the candidate-created scenario, including:

- Hotels.
- Wishlist places.
- Importance values.
- Travel-time mappings.
- Map marker positions.
- Original budget.

**FR-07: Deterministic Demonstration Data**

The candidate-created travel-time matrix may be:

- Stored as constants, or
- Produced once using a deterministic generator.

The generator must not use:

- Map geometry.
- Randomness.

The same stable 10 × 15 matrix must be materialized and inspected after every reset.

**FR-08: Independent Expected Results**

The candidate must independently document the expected results for the main scenario.

The documented results must include:

- Weighted travel total for every hotel.
- One-decimal weighted average for every hotel.
- Affordability status for every hotel.
- Remaining budget or shortfall for every hotel.
- Initial rank for every affordable hotel.

Expected results must be independently verified through a separate calculation path, such as a spreadsheet or explicit test constants.

The application must calculate its decisions independently from the underlying hotel costs, importance values, and travel times.

Documented answers must not be used as ranking inputs.

### 2.2 Hotel Requirements

**FR-09: Hotel Data**

Each hotel must contain:

| Attribute | Description |
|---|---|
| `id` | Unique hotel identifier |
| `name` | Non-empty hotel display name |
| `stay_cost` | Quoted whole-number price for the complete hotel stay |
| `round_trip_minutes` | Mapping of wishlist place IDs to complete round-trip travel times |

**FR-10: Complete-Stay Pricing**

The hotel price must represent the complete stay, not a nightly allowance.

Every hotel must have a `stay_cost` between 1 and 1,000,000, inclusive.

**FR-11: Hotel Visibility**

All hotels must remain visible in the comparison results, including hotels that exceed the current budget.

Over-budget hotels must not be removed from the results.

### 2.3 Wishlist Place Requirements

**FR-12: Wishlist Place Data**

Each wishlist place must contain:

| Attribute | Description |
|---|---|
| `id` | Unique place identifier |
| `name` | Non-empty display name |
| `type` | Either `attraction` or `food` |
| `importance` | Whole-number importance from 1 to 5 |
| Map position | Presentation coordinates |

**FR-13: Place Importance**

The importance of every wishlist place must influence hotel accessibility calculations.

The application must support changing the importance of a place within the range 1–5, inclusive.

**FR-14: Importance What-If Scenario**

One specific wishlist place must be selected for the main importance what-if demonstration.

Changing its importance to a documented alternative value within 1–5 must result in a different recommended affordable hotel.

The original importance value and the alternative value must be documented.

**FR-15: All Places Participate**

Every wishlist place must participate in every baseline hotel accessibility comparison.

No place may be omitted from the calculation because:

- It is a food stop.
- It is an attraction.
- Another hotel is being inspected.
- The hotel is currently over budget.

### 2.4 Travel-Time Matrix Requirements

**FR-16: Complete Hotel-to-Place Mapping**

Each hotel must have a `round_trip_minutes` mapping containing exactly one entry for every wishlist place.

For the main scenario, this produces a complete 10 × 15 matrix containing 150 travel-time values.

**FR-17: Round-Trip Semantics**

Each travel-time value represents the complete round trip:

`Hotel → Wishlist Place → Hotel`

It must not represent a one-way journey.

**FR-18: Travel-Time Bounds**

Every travel-time value must be a whole number between 1 and 600 minutes, inclusive.

**FR-19: Mapping Completeness**

A mapping is invalid if:

- A wishlist place ID is missing.
- An unknown place ID is included.
- The mapping does not correspond exactly to the complete wishlist.

**FR-20: Travel-Time Independence from Map Geometry**

Travel times must be supplied through the candidate-created matrix.

Pixel distances, marker positions, and comparison-line lengths must never be used to calculate:

- Travel time.
- Accessibility.
- Weighted travel total.
- Hotel ranking.

### 2.5 Budget Management

**FR-21: Editable Complete-Stay Budget**

The user must be able to change the accommodation budget.

The budget must be a whole-number amount between 0 and 1,000,000, inclusive.

**FR-22: Budget Currency**

One currency must be used consistently throughout the application.

**FR-23: Budget-Driven Recalculation**

Changing the budget must recalculate:

- Hotel affordability.
- Remaining budgets.
- Over-budget shortfalls.
- Affordable hotel rankings.
- Hotel recommendation.

**FR-24: Budget Changes Must Not Affect Contributions**

Changing only the budget must not change:

- Individual travel contributions.
- Weighted travel totals.
- Weighted averages.

These calculations depend on place importance and travel time, not budget.

### 2.6 Accessibility Calculations

**FR-25: Individual Contributions**

The application must calculate the weighted travel contribution for every hotel-place pair.

**FR-26: Importance Total**

The application must calculate the sum of all wishlist place importance values.

**FR-27: Weighted Travel Total**

The application must calculate the sum of all individual weighted travel contributions for each hotel.

**FR-28: Weighted Average**

The application must calculate each hotel's weighted average travel time and display it to exactly one decimal place using the specified round-half-up rule.

**FR-29: Exact Ranking Metric**

The weighted travel total must be the primary accessibility ranking metric.

The displayed weighted average must not influence ranking.

**FR-30: Importance-Driven Recalculation**

Changing any place's importance must recalculate:

- Its contribution for every hotel.
- Every hotel's weighted travel total.
- Every hotel's weighted average.
- Hotel rankings.
- Hotel recommendation.
- Relevant chart or map-link contribution labels.

### 2.7 Hotel Ranking and Recommendation

**FR-31: Affordability Classification**

A hotel is affordable exactly when:

`stay_cost <= budget`

Equality is included.

**FR-32: Affordable Hotel Ranking**

Only affordable hotels may receive numerical ranks.

Affordable hotels must be sorted using the following priorities:

1. Weighted travel total, ascending.
2. Complete-stay cost, ascending.
3. Hotel ID, ascending ASCII order.

**FR-33: Unique Continuous Ranks**

Assign ranks starting from 1 without gaps:

`1, 2, 3, ...`

Every affordable hotel must receive a unique rank.

**FR-34: Recommended Hotel**

The affordable hotel assigned rank 1 must be marked as the Recommended hotel.

There must be exactly one recommendation whenever at least one hotel is affordable.

**FR-35: Over-Budget Hotel Handling**

An over-budget hotel must:

- Remain visible.
- Have no numerical rank.
- Never be recommended.
- Display its shortfall using the label `Over budget by X`.

**FR-36: No Affordable Hotel**

If no hotel is affordable:

- Display `NO_AFFORDABLE_HOTEL`.
- Retain each hotel's shortfall.
- Display no recommendation.
- Assign no numerical ranks.

This is a valid comparison result, not a data-validation error.

### 2.8 Hotel Inspection and Contribution Breakdown

**FR-37: Hotel Selection**

The user must be able to inspect any hotel.

**FR-38: Inspection Details**

When a hotel is inspected, the application must expose:

- Hotel name.
- Complete-stay cost.
- Affordability status.
- Remaining budget or shortfall.
- Weighted travel total.
- Weighted average travel time.
- Rank, if affordable.
- Individual travel times for all 15 places.
- Individual weighted contributions for all 15 places.

**FR-39: Inspection Independence**

Inspecting another hotel must change only the visible explanation and highlighted comparison links.

It must not change:

- The underlying travel-time matrix.
- Any hotel's calculated accessibility.
- Hotel affordability.
- Ranking.
- Recommendation.

**FR-40: Contribution Explanation**

The application must provide a contribution detail or chart that makes the calculation understandable.

The individual contributions must be traceable to the corresponding wishlist places.

### 2.9 Map and Visualization

**FR-41: Schematic City Map**

The application must display one labelled schematic map containing all 25 markers:

- 10 hotel markers.
- 15 wishlist place markers.

**FR-42: Marker Labelling**

Every marker must identify its corresponding hotel or wishlist place.

**FR-43: Selected-Hotel Comparison Links**

When a hotel is inspected, highlight only the 15 comparison links connecting that hotel to the wishlist places.

Do not display comparison links for all 10 hotels simultaneously.

**FR-44: Link Information**

Each highlighted comparison link must expose:

- Supplied round-trip travel time.
- Corresponding weighted travel contribution.

**FR-45: Comparison Links Are Not Routes**

The highlighted links represent hotel-to-place comparisons.

They must not be represented or calculated as actual roads, driving routes, or geographically derived travel paths.

**FR-46: Synchronized Comparison Views**

The map must remain synchronized with an accessible hotel-by-place time table or equivalent view.

The overall comparison workspace must include:

- Labelled schematic map.
- Ranked hotel cards or rows.
- Cost and budget information.
- Eligibility reasons.
- Contribution detail or chart.
- Selected-hotel calculation explanation.

**FR-47: Non-Colour Identification**

The recommendation and excluded hotels must be distinguishable using text or symbols in addition to colour.

Colour must not be the only way of communicating these statuses.

### 2.10 Reset and What-If Interactions

**FR-48: Budget What-If Demonstration**

The initial scenario must contain a uniquely most accessible hotel that is over budget.

Increasing the budget to exactly that hotel's complete-stay cost must make it the recommended hotel.

**FR-49: Importance What-If Demonstration**

Changing the selected wishlist place's importance to the documented alternative value must produce a different affordable recommendation.

**FR-50: Reset Functionality**

The application must provide a reset action that restores:

- All original candidate-created city data.
- The original travel-time matrix.
- The original budget.
- All original importance values.
- The documented initial recommendation.
- The default inspected hotel.

**FR-51: Exact Reset**

Reset must restore the original scenario and its results exactly, including the stable travel-time matrix.

Repeated resets must reproduce the same original data and results.

---

## 3. Non-Functional Requirements

This section distinguishes explicit constraints and evaluation expectations from qualities that are not assigned measurable targets by the source documents.

### 3.1 Correctness and Determinism

**NFR-01: Mathematical Correctness — Mandatory**

All accessibility calculations must follow the exact mathematical formulas and ranking rules defined in Section 4.

**NFR-02: Deterministic Data — Mandatory**

The candidate-created demonstration data must be deterministic.

The travel-time matrix must remain stable across resets.

**NFR-03: No Randomness — Mandatory**

The travel-time matrix generator, if used, must not rely on randomness.

**NFR-04: No Geometry-Based Calculations — Mandatory**

Map geometry must never influence accessibility or ranking.

**NFR-05: Complete Validation — Mandatory**

The complete scenario must be validated before ranking.

Partial ranking from valid-looking records must not be produced when the complete scenario is invalid.

**NFR-06: Independent Verification — Mandatory**

Expected main-scenario results must be calculated through a separate verification path.

### 3.2 Usability

**NFR-07: Clear Comparison Workspace — Mandatory**

The application must combine ranked hotel results, map visualization, budget information, and calculation explanations in one understandable workspace.

**NFR-08: Clear Eligibility Explanations — Mandatory**

Users must be able to understand why a hotel is ranked or excluded.

**NFR-09: Transparent Recommendation — Mandatory**

The recommendation must be supported by visible numerical calculations.

**NFR-10: Interactive What-If Behaviour — Mandatory**

Budget and importance changes must visibly update the relevant comparison results.

**NFR-11: One-Action Loading — Mandatory**

The main fictional city must be loadable in one action.

### 3.3 Accessibility

**NFR-12: Multiple Visual Identification Methods — Mandatory**

The recommendation and excluded hotels must be identified through text or symbols as well as colour.

**NFR-13: Accessible Data Presentation — Mandatory**

The map must be synchronized with an accessible hotel-by-place time table or equivalent view.

The exact accessibility standard or compliance level is not specified.

### 3.4 Maintainability

The following are engineering expectations supported by the Student Guide, rather than additional functional contracts.

**NFR-14: Simple Architecture — Recommended**

Prefer a simple, maintainable design appropriate for the assignment's limited scope.

**NFR-15: Familiar Technology — Recommended**

Use technologies that the candidate can explain, understand, and debug confidently.

**NFR-16: Understandable Calculations — Recommended**

Calculation and ranking behaviour should be straightforward to explain and verify.

**NFR-17: Avoid Over-Engineering — Explicit Evaluation Expectation**

Avoid unnecessary frameworks, complex abstractions, or architectural layers.

### 3.5 Performance

The assignment does not prescribe numerical performance requirements, response-time targets, memory limits, or supported device specifications.

**NFR-18: Local Calculation — Mandatory**

Processing must happen locally.

The application must not depend on external APIs or remote services to perform its core calculations.

**NFR-19: Interactive Recalculation — Functional Expectation**

Budget and importance changes must trigger the recalculations specified in the functional requirements.

Specific maximum recalculation times are not defined.

### 3.6 Local-Only Operation and Technology Constraints

**NFR-20: Local Operation — Mandatory**

The application must operate without external services for its core functionality.

**NFR-21: Technology Choice — Flexible**

A browser application is a natural fit.

Another local interactive solution is acceptable if it provides an equally clear visual map.

No specific programming language, frontend framework, backend framework, chart library, or map library is mandated.

---

## 4. Business Rules and Mathematical Formulas

This section defines the authoritative mathematical contract.

All calculations must use the supplied importance values and round-trip travel times.

Let:

- `h` represent a hotel.
- `p` represent a wishlist place.
- `n` represent the number of wishlist places.
- `importance(p)` represent the importance of place `p`.
- `round_trip_minutes(h,p)` represent the supplied round-trip time from hotel `h` to place `p` and back.
- `stay_cost(h)` represent the hotel's complete-stay price.
- `budget` represent the current accommodation budget.

### 4.1 Contribution Formula

For every hotel-place pair:

\[
contribution(h,p)
=
importance(p)
\times
round\_trip\_minutes(h,p)
\]

The contribution is measured in importance-minutes.

Example:

- Importance = 3.
- Round-trip travel time = 20 minutes.

\[
3\times20=60
\]

Contribution = 60 importance-minutes.

### 4.2 Importance Total

The total importance of the wishlist is:

\[
\boxed{
importance\_total
=
\sum_{p=1}^{n}importance(p)
}
\]

Every wishlist place must be included.

Since valid importance values are between 1 and 5 and the minimum number of places is 3, the importance total is always positive for a valid scenario.

### 4.3 Weighted Travel Total

For each hotel:

\[
\boxed{
weighted\_travel\_total(h)
=
\sum_{p=1}^{n}
\left(
importance(p)
\times
round\_trip\_minutes(h,p)
\right)
}
\]

This is the sum of all individual contributions.

Properties:

- The result is an integer.
- The unit is importance-minutes.
- Lower values represent better accessibility.
- This exact total is the primary ranking metric.

### 4.4 Weighted Average Travel Time

For each hotel:

\[
\boxed{
weighted\_average\_minutes(h)
=
\frac{
weighted\_travel\_total(h)
}{
importance\_total
}
}
\]

The result represents the importance-weighted average round-trip travel time.

The displayed value must have exactly one decimal place.

### 4.5 Exact Rounding Rule

Use round-half-up for non-negative values.

The assignment provides the following integer-only equivalent:

\[
\boxed{
rounded\_tenths
=
\left\lfloor
\frac{
20\times weighted\_travel\_total
+
importance\_total
}{
2\times importance\_total
}
\right\rfloor
}
\]

Display:

\[
\boxed{
\frac{rounded\_tenths}{10}
}
\]

Example:

If:

\[
weighted\_travel\_total=140
\]

and:

\[
importance\_total=5
\]

Then:

\[
weighted\_average\_minutes
=
\frac{140}{5}
=
28.0
\]

Displayed average = 28.0 minutes.

**Critical ranking rule:** Display rounding must never influence ranking.

Hotels must be compared using their exact integer weighted travel totals, not their rounded averages.

### 4.6 Remaining Budget

For each hotel:

\[
\boxed{
remaining\_budget(h)
=
budget-stay\_cost(h)
}
\]

Interpretation:

| Result | Meaning |
|---|---|
| Positive | Money remains after accommodation |
| Zero | Hotel is exactly on budget |
| Negative | Hotel exceeds the budget |

For an over-budget hotel:

\[
\boxed{
shortfall(h)
=
stay\_cost(h)-budget
}
\]

Display the shortfall as:

`Over budget by X`

### 4.7 Affordability Condition

A hotel is affordable exactly when:

\[
\boxed{
stay\_cost(h)\leq budget
}
\]

Equality is included.

Examples:

| Budget | Stay cost | Classification |
|---:|---:|---|
| 20,000 | 19,999 | Affordable |
| 20,000 | 20,000 | Affordable |
| 20,000 | 20,001 | Over budget |

An over-budget hotel remains visible but receives no numerical rank.

### 4.8 Ranking Rules

Only affordable hotels participate in ranking.

Sort affordable hotels by the following ordered comparison:

**Priority 1: Weighted travel total**

Ascending order.

The hotel with the lowest exact weighted travel total is preferred.

**Priority 2: Complete-stay cost**

If weighted travel totals are equal, the hotel with the lower `stay_cost` is preferred.

**Priority 3: Hotel ID**

If both weighted travel total and stay cost are equal, compare hotel IDs in ascending ASCII order.

Names, input order, map position, and displayed weighted averages must not break ties.

### 4.9 Rank Assignment

Assign unique consecutive ranks:

\[
1,2,3,\ldots
\]

There must be no gaps.

Rank 1 is the single Recommended hotel whenever at least one hotel is affordable.

Over-budget hotels receive no numerical rank.

### 4.10 No-Affordable-Hotel Behaviour

If no hotel satisfies the affordability condition:

- Display `NO_AFFORDABLE_HOTEL`.
- Retain each hotel's shortfall.
- Show no recommendation.
- Show no numerical rank.

This state is a valid business result, not a validation error.

### 4.11 Calculation Independence

The calculation engine must derive its results from:

- Current budget.
- Hotel stay costs.
- Wishlist place importance.
- Supplied round-trip travel times.

It must not use:

- Documented expected results.
- Map marker coordinates.
- Pixel distances.
- Comparison-line lengths.
- Randomly generated travel times.

---

## 5. Data Model and Validation Rules

### 5.1 Hotel Schema

Each hotel must contain the following logical fields:

| Field | Type | Required | Constraints |
|---|---|---|---|
| `id` | String | Yes | Valid ID format; globally unique |
| `name` | String | Yes | Non-empty after trimming surrounding whitespace |
| `stay_cost` | Integer | Yes | 1–1,000,000 inclusive |
| `round_trip_minutes` | Mapping | Yes | Exactly one entry per wishlist place |

### 5.2 Wishlist Place Schema

Each wishlist place must contain:

| Field | Type | Required | Constraints |
|---|---|---|---|
| `id` | String | Yes | Valid ID format; globally unique |
| `name` | String | Yes | Non-empty after trimming surrounding whitespace |
| `type` | String | Yes | `attraction` or `food` |
| `importance` | Integer | Yes | 1–5 inclusive |
| Map position | Presentation data | Yes for map display | Exact representation unspecified |

### 5.3 Travel-Time Mapping

Each hotel must have a mapping of wishlist place IDs to round-trip travel times.

For every hotel:

- All wishlist place IDs must be present.
- No unknown place ID may be present.
- Every travel time must be an integer.
- Every travel time must be between 1 and 600 minutes, inclusive.

The mapping must be complete and consistent with the current scenario.

### 5.4 ID Constraints

Both hotel and place IDs must satisfy:

`[A-Z][A-Z0-9_-]{0,15}`

Equivalent regular expression:

```regex
^[A-Z][A-Z0-9_-]{0,15}$
```

Examples of valid IDs:

- `HOTEL1`
- `CLOCK_TOWER`
- `FOOD-01`
- `A`

Examples of invalid IDs:

- `hotel1`
- `1HOTEL`
- `HOTEL@1`

IDs must be unique across the complete scenario.

A hotel ID and a wishlist place ID must not be identical.

### 5.5 Numeric Bounds

| Field | Minimum | Maximum | Type |
|---|---:|---:|---|
| Hotel count | 2 | 10 | Integer count |
| Wishlist place count | 3 | 15 | Integer count |
| Budget | 0 | 1,000,000 | Whole number |
| Stay cost | 1 | 1,000,000 | Whole number |
| Place importance | 1 | 5 | Whole number |
| Round-trip travel time | 1 | 600 | Whole number |

All bounds are inclusive.

### 5.6 Name Validation

Hotel and wishlist place display names must be non-empty after removing surrounding whitespace.

A name containing only whitespace is invalid.

Whether display names must be unique is not explicitly specified.

### 5.7 Completeness and Consistency Validation

The complete scenario must be validated before ranking.

The application must reject:

1. Invalid hotel count.
2. Invalid wishlist place count.
3. Malformed hotel IDs.
4. Malformed place IDs.
5. Duplicate IDs.
6. Empty hotel names.
7. Empty place names.
8. Unsupported place types.
9. Invalid budget values.
10. Invalid stay costs.
11. Invalid importance values.
12. Invalid travel-time values.
13. Missing hotel-to-place mappings.
14. Extra or unknown hotel-to-place mappings.

### 5.8 Invalid-Data Behaviour

An invalid result must:

- Identify the validation problem.
- Clear stale numerical ranks.
- Clear the previous recommendation.
- Clear previous contributions.
- Clear derived map highlights.
- Avoid producing a partial ranking from valid-looking records.

The application must visibly demonstrate invalid handling for an editable budget or importance value.

Structural validation errors may be demonstrated through repeatable candidate-authored tests.

A general-purpose city-data editor is not required.

### 5.9 Valid No-Affordable State

A valid scenario in which every hotel exceeds the current budget must not be rejected.

It must produce the `NO_AFFORDABLE_HOTEL` state.

This must be distinguished from invalid scenario data.

---

## 6. Acceptance Criteria

All criteria in this section are mandatory unless explicitly identified as optional.

Each criterion has a stable identifier for implementation tracking and testing.

### 6.1 Scenario and Data Acceptance Criteria

**AC-01: Main Scenario Creation**

The application must create and load a deterministic fictional city in one action containing exactly:

- 10 hotels.
- 15 wishlist places.
- At least 3 attractions.
- At least 3 food stops.
- At least 3 distinct importance values.
- A complete 10 × 15 round-trip travel-time mapping.

The scenario must not depend on supplied assets or external services.

**AC-02: Main Scenario Decision Story**

The initial scenario must satisfy all the following:

- Between 4 and 7 hotels, inclusive, are affordable.
- The uniquely most accessible hotel is over budget.
- The recommended affordable hotel is not the cheapest affordable hotel.
- At least one affordable hotel has every round trip at or below 90 minutes.
- At least one affordable hotel has at least one round trip above 90 minutes.
- Raising the budget to the most accessible hotel's exact stay cost makes that hotel the recommendation.

**AC-03: Independent Expected Results**

Independently document every hotel's:

- Weighted travel total.
- One-decimal weighted average.
- Affordability.
- Shortfall or remaining budget.
- Initial rank, where applicable.

The application must reproduce these results using its own calculations.

The documented expected answers must not be used as calculation inputs.

### 6.2 Map and Comparison Acceptance Criteria

**AC-04: Complete Map**

Display all 25 labelled map markers.

**AC-05: Selected Hotel Links**

When a hotel is inspected, highlight only that hotel's 15 comparison links.

**AC-06: Link Information**

Show the supplied round-trip time and weighted contribution for each highlighted link.

**AC-07: Complete Comparison Workspace**

Show:

- Complete-stay price comparison.
- Ranked hotel results.
- Eligibility reasons for unranked hotels.
- Selected hotel's calculation details.
- Map and synchronized hotel-by-place information.

### 6.3 What-If and Reset Acceptance Criteria

**AC-08: Budget Boundary Demonstration**

Increase the budget to the documented complete-stay cost of the uniquely most accessible hotel.

That hotel must become the recommendation at the exact cost boundary.

**AC-09: Importance Change Demonstration**

Change the selected wishlist place's importance to the documented alternative value.

The affordable recommendation must change to a different hotel.

**AC-10: Exact Reset**

Reset must restore both changes exactly, including:

- Original budget.
- Original importance values.
- Original city data.
- Original recommendation.
- Default inspected hotel.
- Original travel-time matrix.

### 6.4 Ranking and Affordability Acceptance Criteria

**AC-11: Budget Equality**

Demonstrate that a hotel whose complete-stay cost equals the current budget is affordable.

**AC-12: One-Unit Budget Excess**

Demonstrate that a hotel costing one currency unit more than the budget is over budget and receives no numerical rank.

**AC-13: Accessibility Tie-Break**

Demonstrate that two affordable hotels with equal weighted travel totals are ranked by lower complete-stay cost.

**AC-14: Complete Tie-Break**

Demonstrate that hotels tied on both weighted travel total and stay cost are ranked using ascending ASCII hotel ID.

These tie cases may use smaller candidate-authored test scenarios.

### 6.5 Validation and No-Affordable Acceptance Criteria

**AC-15: No Affordable Hotel**

Demonstrate `NO_AFFORDABLE_HOTEL` with:

- No recommendation.
- No numerical ranks.
- Every hotel's shortfall retained.

**AC-16: Visible Invalid Input Rejection**

Visibly reject at least one invalid editable budget or importance value.

Invalid input must not leave stale derived results visible.

**AC-17: Duplicate-ID Rejection**

Provide repeatable test evidence showing that a duplicate-ID scenario is rejected.

**AC-18: Invalid Travel Mapping Rejection**

Provide repeatable test evidence showing rejection of at least one incomplete or unknown hotel-to-place travel-time mapping.

### 6.6 Calculation and Interaction Test Acceptance Criteria

**AC-19: Contribution Arithmetic**

Provide focused tests or equivalent repeatable evidence for contribution arithmetic.

**AC-20: Round-Half-Up Display**

Verify the exact one-decimal round-half-up display rule.

**AC-21: Exact Ranking**

Verify that ranking uses exact weighted travel totals even when displayed averages are equal.

**AC-22: Tie-Breaking**

Verify both:

- Equal accessibility resolved by stay cost.
- Complete tie resolved by ascending ASCII hotel ID.

**AC-23: Budget Equality**

Test the exact affordability boundary.

**AC-24: Budget Changes**

Verify that budget changes recalculate affordability, shortfalls, ranks and recommendation without changing contributions.

**AC-25: Importance Changes**

Verify that importance changes recalculate contributions, totals, averages, ranks and relevant chart or link labels.

**AC-26: Invalid-State Clearing**

Verify that invalid input clears stale ranks, recommendation, contributions and derived map highlights.

**AC-27: No-Affordable Result**

Verify the no-affordable state and absence of stale recommendation or ranks.

**AC-28: Hotel Inspection**

Verify that inspecting another hotel changes only the visible explanation and highlighted comparison links.

**AC-29: Reset**

Verify that reset restores the original scenario and default inspected hotel exactly.

### 6.7 Optional Acceptance Criterion

**AC-30: Budget Timeline — Optional**

Optionally, the application may include a compact budget timeline showing the amounts at which the recommendation changes.

If implemented, it must preserve the same affordability and ranking rules.

---

## 7. Edge Cases and Test Scenarios

The following test scenarios provide repeatable verification coverage.

The expected outcomes are derived from the official contracts. Where the assignment does not prescribe a particular error-message format, only rejection and the required invalid-state behaviour are specified.

### 7.1 Calculation Tests

| Test ID | Scenario | Expected Outcome |
|---|---|---|
| TC-01 | Importance = 3, round trip = 20 | Contribution = 60 |
| TC-02 | Importance = 2, round trip = 40 | Contribution = 80 |
| TC-03 | Contributions = 60 and 80 | Weighted total = 140 |
| TC-04 | Weighted total = 140, importance total = 5 | Average = 28.0 |
| TC-05 | Weighted average = 28.05 | Display = 28.1 |
| TC-06 | Two hotels have equal displayed averages but different exact totals | Lower exact total ranks higher |

### 7.2 Ranking and Tie-Break Tests

| Test ID | Scenario | Expected Outcome |
|---|---|---|
| TC-07 | Hotel A total = 100, Hotel B total = 120; both affordable | Hotel A ranks higher |
| TC-08 | Equal totals; Hotel A costs 10,000 and Hotel B costs 12,000 | Hotel A ranks higher |
| TC-09 | Equal totals and costs; different IDs | Ascending ASCII ID determines ranking |
| TC-10 | Multiple affordable hotels | Unique consecutive ranks beginning at 1 |
| TC-11 | Over-budget hotel has the lowest weighted total | It remains unranked and is never recommended |
| TC-12 | Equal displayed average but different exact weighted total | Exact total determines ranking |

### 7.3 Budget Tests

| Test ID | Scenario | Expected Outcome |
|---|---|---|
| TC-13 | Hotel cost is one unit below budget | Affordable |
| TC-14 | Hotel cost exactly equals budget | Affordable |
| TC-15 | Hotel cost is one unit above budget | Over budget; no numerical rank |
| TC-16 | Budget decreases | Affordability, shortfalls, ranks and recommendation update |
| TC-17 | Budget increases | Newly affordable hotels enter ranking |
| TC-18 | Budget changes without importance changes | Contributions, totals and averages remain unchanged |
| TC-19 | Budget = 0 | All valid positive-cost hotels are over budget |
| TC-20 | Budget reaches the most accessible hotel's exact cost | That hotel becomes recommended |
| TC-21 | All hotels exceed budget | `NO_AFFORDABLE_HOTEL` is displayed |

### 7.4 Importance Tests

| Test ID | Scenario | Expected Outcome |
|---|---|---|
| TC-22 | Increase a place's importance | Its contribution increases for every hotel |
| TC-23 | Decrease a place's importance | Its contribution decreases for every hotel |
| TC-24 | Change one place's importance | Every hotel's weighted total is recalculated |
| TC-25 | Change one place's importance | Every hotel's weighted average is recalculated |
| TC-26 | Change one place's importance | Rankings and recommendation are recalculated |
| TC-27 | Change importance to 0 | Input rejected |
| TC-28 | Change importance to 6 | Input rejected |
| TC-29 | Enter fractional importance | Input rejected |
| TC-30 | Perform documented importance what-if change | Different affordable hotel is recommended |

### 7.5 Scenario Validation Tests

| Test ID | Scenario | Expected Outcome |
|---|---|---|
| TC-31 | Fewer than 2 hotels | Scenario rejected |
| TC-32 | More than 10 hotels | Scenario rejected |
| TC-33 | Fewer than 3 wishlist places | Scenario rejected |
| TC-34 | More than 15 wishlist places | Scenario rejected |
| TC-35 | Duplicate hotel IDs | Scenario rejected |
| TC-36 | Duplicate place IDs | Scenario rejected |
| TC-37 | Hotel ID equals place ID | Scenario rejected |
| TC-38 | ID starts with a lowercase letter | Scenario rejected |
| TC-39 | ID starts with a number | Scenario rejected |
| TC-40 | ID contains an unsupported character | Scenario rejected |
| TC-41 | ID exceeds the allowed length | Scenario rejected |
| TC-42 | Empty hotel name | Scenario rejected |
| TC-43 | Empty place name | Scenario rejected |
| TC-44 | Name contains only surrounding whitespace | Scenario rejected |
| TC-45 | Unsupported place type | Scenario rejected |
| TC-46 | Stay cost = 0 | Scenario rejected |
| TC-47 | Stay cost = 1,000,001 | Scenario rejected |
| TC-48 | Stay cost is fractional | Scenario rejected |
| TC-49 | Travel time = 0 | Scenario rejected |
| TC-50 | Travel time = 601 | Scenario rejected |
| TC-51 | Travel time is fractional | Scenario rejected |
| TC-52 | Travel mapping misses a wishlist place | Scenario rejected |
| TC-53 | Travel mapping contains an unknown place ID | Scenario rejected |
| TC-54 | Budget = -1 | Input rejected |
| TC-55 | Budget = 1,000,001 | Input rejected |
| TC-56 | Budget is fractional | Input rejected |

### 7.6 Invalid-State Tests

| Test ID | Scenario | Expected Outcome |
|---|---|---|
| TC-57 | Valid results exist, then invalid budget is entered | Error identified; stale ranks, recommendation, contributions and map highlights cleared |
| TC-58 | Valid results exist, then invalid importance is entered | Error identified; stale ranks, recommendation, contributions and map highlights cleared |
| TC-59 | Scenario contains one invalid record and several valid records | No partial ranking produced |
| TC-60 | Invalid input is corrected | A new valid comparison can be calculated |

### 7.7 Map and Inspection Tests

| Test ID | Scenario | Expected Outcome |
|---|---|---|
| TC-61 | Load the main city | All 25 labelled markers appear |
| TC-62 | Inspect a hotel | Only its 15 comparison links are highlighted |
| TC-63 | Inspect another hotel | Previous hotel's links are replaced by the newly inspected hotel's links |
| TC-64 | Inspect a hotel | All 15 round-trip times and contributions are exposed |
| TC-65 | Inspect a different hotel | Overall ranking and recommendation remain unchanged |
| TC-66 | Inspect an over-budget hotel | Details are visible, but no numerical rank is assigned |
| TC-67 | Change a place's importance | Relevant contribution information and map-link labels update |
| TC-68 | Inspect map geometry | Pixel distance and line length do not affect calculations |

### 7.8 Reset Tests

| Test ID | Scenario | Expected Outcome |
|---|---|---|
| TC-69 | Change budget and reset | Original budget restored |
| TC-70 | Change importance and reset | Original importance values restored |
| TC-71 | Inspect another hotel and reset | Default inspected hotel restored |
| TC-72 | Change budget, importance and inspected hotel, then reset | Entire original scenario restored |
| TC-73 | Reset repeatedly | Same stable matrix and original results every time |
| TC-74 | Reset after recommendation changes | Original documented recommendation restored |

---

## 8. Mandatory vs Optional Requirements

### 8.1 Mandatory Requirements

The following are mandatory for assignment completion.

| Category | Mandatory requirement |
|---|---|
| Main data | Exactly 10 hotels and 15 wishlist places |
| Place categories | At least 3 attractions and 3 food stops |
| Importance diversity | At least 3 distinct importance values |
| Data loading | Complete city loaded in one action |
| Travel matrix | Complete deterministic 10 × 15 mapping |
| Data validity | Correct IDs, names, types and numeric bounds |
| Accessibility | Exact weighted contribution and total calculations |
| Average | One-decimal round-half-up display |
| Affordability | Complete-stay cost compared against budget |
| Ranking | Exact total, stay cost, ASCII ID ordering |
| Recommendation | Rank 1 among affordable hotels |
| Over-budget handling | Visible, unranked, shortfall explained |
| No-affordable handling | `NO_AFFORDABLE_HOTEL` with no stale winner |
| Main scenario | All specified decision-story conditions |
| What-if budget | Most accessible hotel becomes recommended at its cost boundary |
| What-if importance | Different affordable recommendation |
| Map | All 25 labelled markers |
| Comparison links | Only inspected hotel's 15 links |
| Explanation | Supplied times and weighted contributions |
| Synchronization | Map and comparison information synchronized |
| Invalid handling | Full validation and stale-state clearing |
| Reset | Restore original scenario exactly |
| Testing | Arithmetic, rounding, ranking, ties, validation and interactions |
| Independent verification | Documented expected results verified separately |

### 8.2 Optional Features

**Optional Feature 1: Budget Timeline**

A compact budget timeline may show the amounts at which the recommendation changes.

If included, it must preserve the exact affordability and ranking rules.

### 8.3 Features Not Required

The following are not optional enhancements specified by the assignment; they are outside the scope:

- Itinerary planner.
- Actual route visualization.
- External maps.
- Hotel booking.
- User authentication.
- Database.
- External API integration.
- Geocoding.
- Traffic information.
- General city editing.
- File importing.

---

## 9. Open Questions and Ambiguities

The following items are not explicitly determined by the source documents and must remain implementation decisions or clarification points.

No assumption in this section should be treated as an official assignment requirement.

| ID | Area | Open Question |
|---|---|---|
| OQ-01 | Fictional city | What should the fictional city be named, and what theme should its demonstration data follow? |
| OQ-02 | Currency | Which single currency should be used throughout the application? |
| OQ-03 | Initial budget | What exact initial budget should be selected to satisfy the mandatory scenario conditions? |
| OQ-04 | Hotel and place names | What memorable names should be assigned to the 10 hotels and 15 places? |
| OQ-05 | Initial importance | What importance value should each wishlist place receive? |
| OQ-06 | Alternative importance | Which wishlist place should be selected for the importance what-if demonstration, and what alternative importance value should be used? |
| OQ-07 | Travel-time generation | Should the matrix be stored as constants or generated through a deterministic generator? Both are permitted. |
| OQ-08 | Default inspected hotel | Which hotel should be selected by default and restored during reset? |
| OQ-09 | Map presentation | What schematic map dimensions, marker positions, and visual styling should be used? |
| OQ-10 | Map interaction | Should comparison-link information appear through a tooltip, selected-link detail, table, or another presentation? The exact interaction is unspecified. |
| OQ-11 | Budget input | Should the budget be edited using a numeric input, slider, or another control? |
| OQ-12 | Importance input | Should importance be edited using a dropdown, slider, stepper, or another control? |
| OQ-13 | Invalid input presentation | What exact visual format should be used for validation errors? The source requires identifying the problem and clearing stale results, but does not prescribe the error UI. |
| OQ-14 | Chart presentation | Should contribution details be presented using a chart, table, or both? The assignment accepts a contribution detail or chart. |
| OQ-15 | Display-name uniqueness | Must hotel and place display names be unique? The source explicitly requires unique IDs but does not impose display-name uniqueness. |
| OQ-16 | Whitespace normalization | Should trimmed display names be stored in normalized form, or should trimming be performed only during validation? The source only defines non-emptiness after trimming surrounding whitespace. |
| OQ-17 | UI responsiveness | What screen sizes and device breakpoints should be supported? No specific responsive-layout requirement is provided. |
| OQ-18 | Performance | What response-time or rendering-performance targets should be used? No numerical targets are specified. |
| OQ-19 | Accessibility standard | Is a particular accessibility standard required? The source only explicitly requires text or symbols alongside colour and an accessible comparison view. |
| OQ-20 | Technology stack | Which frontend framework and visualization libraries should be selected? The assignment permits a browser application or another equivalent local interactive solution and does not prescribe a stack. |
| OQ-21 | Optional budget timeline | Should the optional recommendation-change timeline be implemented? It is not required. |

### 9.1 Clarifications That Must Not Be Assumed

The following are not requirements unless separately decided:

- Actual geographical accuracy of the fictional map.
- Realistic traffic conditions.
- Real-world hotel or place data.
- Travel-time calculation from coordinates.
- Hotel room counts or nightly prices.
- Number of nights in the stay.
- Number of travellers.
- Tax or additional fee calculations.
- Weighted importance normalization beyond the specified formula.
- Filtering or removing wishlist places.
- Custom user-created scenarios.
- Persistence after closing the browser.

---

## 10. Requirement Traceability

This section maps major requirements to acceptance criteria and repeatable test scenarios.

| Requirement Area | Functional Requirements | Acceptance Criteria | Test Scenarios |
|---|---|---|---|
| Fictional city and scenario data | FR-01–FR-08 | AC-01, AC-02, AC-03 | TC-31–TC-36 |
| Hotel information | FR-09–FR-11 | AC-01, AC-03 | TC-35–TC-48 |
| Wishlist place information | FR-12–FR-15 | AC-01, AC-02, AC-09 | TC-27–TC-30, TC-43–TC-45 |
| Travel-time matrix | FR-16–FR-20 | AC-01, AC-03, AC-18 | TC-49–TC-53, TC-68 |
| Budget management | FR-21–FR-24 | AC-08, AC-11, AC-12, AC-24 | TC-13–TC-21, TC-54–TC-56 |
| Accessibility calculations | FR-25–FR-30 | AC-19, AC-20, AC-21, AC-25 | TC-01–TC-06, TC-22–TC-30 |
| Affordability and ranking | FR-31–FR-36 | AC-11–AC-15, AC-21–AC-23 | TC-07–TC-12 |
| Hotel inspection | FR-37–FR-40 | AC-05, AC-06, AC-07, AC-28 | TC-61–TC-66 |
| Map and visualization | FR-41–FR-47 | AC-04, AC-05, AC-06, AC-07 | TC-61–TC-68 |
| Budget what-if | FR-48 | AC-08 | TC-20 |
| Importance what-if | FR-49 | AC-09 | TC-30 |
| Reset | FR-50–FR-51 | AC-10, AC-29 | TC-69–TC-74 |
| Validation | Section 5 | AC-16, AC-17, AC-18, AC-26 | TC-31–TC-60 |
| No-affordable state | FR-36 | AC-15, AC-27 | TC-19, TC-21 |
| Independent verification | FR-08 | AC-03 | TC-01–TC-12 |
| Optional budget timeline | Optional feature | AC-30 | Not mandatory |

### 10.1 Traceability and Verification Rules

1. Every mandatory functional requirement must be addressed during development.
2. Acceptance criteria must be independently verifiable.
3. Tests must verify the exact mathematical rules, not merely whether the UI displays a plausible answer.
4. Main-scenario expected results must be checked independently.
5. Invalid-state tests must verify the absence of stale derived information.
6. Reset tests must verify the complete original state, not just individual input values.
7. Optional features must not be treated as prerequisites for assignment completion.

---

## Document Control and Source References

### Primary Source 1: Official Problem Statement

**Document:** `SPR26_D2_P03 — Hotel Base-Camp Comparator`

**Pages:** 1–6

Authoritative source for:

- Project objective and scope.
- Fictional city requirements.
- Main scenario conditions.
- Data contracts.
- Mathematical formulas.
- Ranking rules.
- Validation.
- Interaction behaviour.
- Acceptance criteria.
- Optional budget timeline.
- Evaluation criteria.

### Primary Source 2: Student Guide

**Document:** `STUDENT_GUIDE — AI-Assisted Coding Interview`

**Pages:** 1–4

Authoritative source for:

- Interview structure and timeline.
- Implementation planning.
- AI-assisted development expectations.
- Required deliverables.
- Architecture and design summary.
- Testing evidence.
- Live modification preparation.
- Evaluation expectations.
- Areas to avoid.

### Source-of-Truth Policy

In case of uncertainty:

1. The official problem statement governs application functionality, data contracts, mathematical rules, scope, and acceptance criteria.
2. The Student Guide governs interview preparation, AI-assisted workflow, deliverables, and evaluation expectations.
3. Open questions must remain explicitly identified until a decision is made.
4. Implementation choices must not silently change the requirements.
5. Optional features must remain separate from mandatory requirements.

---

**End of Requirements Specification**

**Document:** `docs/requirements.md`  
**Version:** 1.0  
**Status:** Baseline for implementation planning  
**Implementation Status:** Not started