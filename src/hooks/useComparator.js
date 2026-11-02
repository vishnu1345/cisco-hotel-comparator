/**
 * useComparator.js — Application / State Layer
 *
 * Custom React hook that connects the domain calculation modules with the
 * React UI. Implemented in Stage 3.
 *
 * State managed (Stage 3):
 *  - budget          : current accommodation budget (number)
 *  - importanceMap   : { [placeId]: importance } current importance values
 *  - selectedHotelId : hotel currently being inspected
 *
 * Actions exposed (Stage 3):
 *  - loadCity()                          : initialize the complete bundled scenario
 *  - setBudget(value)                    : update budget and recalculate affordability/ranking
 *  - setImportance(placeId, value)       : update one place importance and recalculate all
 *  - selectHotel(hotelId)                : change the inspected hotel
 *  - reset()                             : restore original budget, importance, selected hotel
 *
 * Derived values (computed via domain functions, memoised with useMemo):
 *  - validationErrors, comparisonResults, recommendation
 *
 * This hook must not import tests/fixtures/expectedResults.json and
 * must not perform business calculations itself — those live in domain/.
 */

// Stage 3: implement and export default useComparator.
