/**
 * ranking.js — Domain Layer
 *
 * Pure functions for affordability, ranking and recommendation, plus
 * compareHotels(), the single entry point that runs the whole pipeline:
 *
 *   validate → (stop if invalid) → accessibility → affordability → ranking
 *
 * Rules:
 *  - A hotel is affordable exactly when stay_cost <= budget.
 *  - Only affordable hotels are ranked, by:
 *      1. weighted travel total ascending (exact integer, never the rounded average)
 *      2. stay cost ascending
 *      3. hotel ID ascending, ASCII order
 *  - Ranks are 1, 2, 3, … with no gaps; rank 1 is the recommendation.
 *  - Over-budget hotels stay in the results with a shortfall and no rank.
 *  - No affordable hotel is a valid result (NO_AFFORDABLE_HOTEL), not an error.
 *
 * This module must never import React, SVG utilities, or
 * tests/fixtures/expectedResults.json.
 */

import { applyImportance, calculateAccessibility } from './calculations.js'
import { validateScenario } from './validation.js'

export const NO_AFFORDABLE_HOTEL = 'NO_AFFORDABLE_HOTEL'
export const RECOMMENDATION_FOUND = 'RECOMMENDATION_FOUND'
export const INVALID_SCENARIO = 'INVALID_SCENARIO'

/** Equality counts as affordable. */
export function isAffordable(stayCost, budget) {
  return stayCost <= budget
}

/** Money left after paying for the stay (negative when over budget). */
export function remainingBudget(stayCost, budget) {
  return budget - stayCost
}

/** How far over budget a hotel is (negative or zero when affordable). */
export function shortfall(stayCost, budget) {
  return stayCost - budget
}

/**
 * Sort comparator for affordable hotels. Each argument needs
 * { hotelId, stayCost, weightedTravelTotal }.
 *
 * IDs are compared with < and > (UTF-16 code units, identical to ASCII for
 * valid IDs) rather than localeCompare, whose order depends on the locale.
 */
export function compareForRanking(a, b) {
  if (a.weightedTravelTotal !== b.weightedTravelTotal) return a.weightedTravelTotal - b.weightedTravelTotal
  if (a.stayCost !== b.stayCost) return a.stayCost - b.stayCost
  if (a.hotelId < b.hotelId) return -1
  if (a.hotelId > b.hotelId) return 1
  return 0
}

/**
 * Classifies and ranks hotels against a budget.
 *
 * `entries` is a list of { hotelId, stayCost, weightedTravelTotal }.
 * Returns { status, recommendedHotelId, rankedHotelIds, hotels } where
 * `hotels` keeps the input order and adds
 * { affordable, remainingBudget, shortfall, rank } to each entry.
 * remainingBudget is null for over-budget hotels; shortfall and rank are
 * null for affordable and over-budget hotels respectively.
 */
export function rankHotels(entries, budget) {
  const rankedHotelIds = entries
    .filter((entry) => isAffordable(entry.stayCost, budget))
    .sort(compareForRanking)
    .map((entry) => entry.hotelId)

  const hotels = entries.map((entry) => {
    const affordable = isAffordable(entry.stayCost, budget)
    return {
      ...entry,
      affordable,
      remainingBudget: affordable ? remainingBudget(entry.stayCost, budget) : null,
      shortfall: affordable ? null : shortfall(entry.stayCost, budget),
      rank: affordable ? rankedHotelIds.indexOf(entry.hotelId) + 1 : null,
    }
  })

  return {
    status: rankedHotelIds.length > 0 ? RECOMMENDATION_FOUND : NO_AFFORDABLE_HOTEL,
    recommendedHotelId: rankedHotelIds[0] ?? null,
    rankedHotelIds,
    hotels,
  }
}

/**
 * Runs the full comparison for the current inputs.
 *
 * `city` is the static city data, `budget` the current budget, and
 * `importanceByPlaceId` (optional) the current importance values keyed by
 * place ID.
 *
 * Always returns the same shape. When the scenario is invalid, `errors` lists
 * the problems and every derived field is empty — no partial ranking,
 * recommendation or contributions are produced.
 */
export function compareHotels(city, budget, importanceByPlaceId = {}) {
  const scenario = applyImportanceSafely(city, importanceByPlaceId)
  const errors = validateScenario(scenario, budget)

  if (errors.length > 0) {
    return {
      status: INVALID_SCENARIO,
      errors,
      importanceTotal: null,
      recommendedHotelId: null,
      rankedHotelIds: [],
      hotels: [],
    }
  }

  const accessibility = calculateAccessibility(scenario.hotels, scenario.wishlist_places)
  const entries = scenario.hotels.map((hotel, i) => ({
    hotelId: hotel.id,
    hotelName: hotel.name,
    stayCost: hotel.stay_cost,
    ...accessibility.hotels[i],
  }))
  const ranking = rankHotels(entries, budget)

  return {
    status: ranking.status,
    errors: [],
    importanceTotal: accessibility.importanceTotal,
    recommendedHotelId: ranking.recommendedHotelId,
    rankedHotelIds: ranking.rankedHotelIds,
    hotels: ranking.hotels,
  }
}

// Only apply importance overrides when the place list is usable; otherwise
// leave the city untouched so validateScenario can report the problem.
function applyImportanceSafely(city, importanceByPlaceId) {
  if (!Array.isArray(city?.wishlist_places)) return city
  return applyImportance(city, importanceByPlaceId)
}
