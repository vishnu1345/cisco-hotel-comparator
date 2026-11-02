/**
 * calculations.js — Domain Layer
 *
 * Pure functions for weighted accessibility calculations. Implemented in Stage 2.
 *
 * Responsibilities (Stage 2):
 *  - contribution(importance, roundTripMinutes) → importance × roundTripMinutes
 *  - importanceTotal(places) → sum of all place importance values
 *  - weightedTravelTotal(hotel, places) → sum of all contributions for a hotel
 *  - weightedAverageMinutes(weightedTotal, importanceTotal) → exact rational value
 *  - roundedTenths(weightedTotal, importanceTotal) → integer tenths via round-half-up
 *    formula: floor((20 * weightedTotal + importanceTotal) / (2 * importanceTotal))
 *  - displayAverage(roundedTenths) → string to one decimal place, e.g. "55.4"
 *
 * Ranking metric is the exact weightedTravelTotal integer; displayAverage must
 * never influence ranking.
 *
 * This module must never import React, SVG utilities, or
 * tests/fixtures/expectedResults.json.
 */

// Stage 2: implement and export the functions listed above.
