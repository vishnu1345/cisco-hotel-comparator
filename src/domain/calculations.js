/**
 * calculations.js — Domain Layer
 *
 * Pure functions for weighted accessibility. All inputs are assumed to have
 * passed validateScenario(); these functions do no validation themselves.
 *
 *   contribution(h, p)      = importance(p) × round_trip_minutes(h, p)
 *   weightedTravelTotal(h)  = Σ contribution(h, p) over every wishlist place
 *   importanceTotal         = Σ importance(p)
 *   weightedAverage(h)      = weightedTravelTotal(h) / importanceTotal
 *
 * The exact integer weightedTravelTotal is the ranking metric. The one-decimal
 * average is for display only and must never influence ranking.
 *
 * Only importance values and supplied round-trip minutes are read here —
 * never map_position or any other geometry.
 *
 * This module must never import React, SVG utilities, or
 * tests/fixtures/expectedResults.json.
 */

/** Weighted contribution of one hotel–place pair, in importance-minutes. */
export function contribution(importance, roundTripMinutes) {
  return importance * roundTripMinutes
}

/** Sum of the importance of every wishlist place. */
export function importanceTotal(places) {
  return places.reduce((sum, place) => sum + place.importance, 0)
}

/** Per-place breakdown for one hotel, in wishlist order. Every place is included. */
export function contributionDetails(hotel, places) {
  return places.map((place) => {
    const roundTripMinutes = hotel.round_trip_minutes[place.id]
    return {
      placeId: place.id,
      placeName: place.name,
      importance: place.importance,
      roundTripMinutes,
      contribution: contribution(place.importance, roundTripMinutes),
    }
  })
}

/** Exact integer weighted travel total for one hotel. */
export function weightedTravelTotal(hotel, places) {
  return contributionDetails(hotel, places).reduce((sum, detail) => sum + detail.contribution, 0)
}

/** Unrounded weighted average in minutes. Not used for ranking or display. */
export function weightedAverageMinutes(weightedTotal, totalImportance) {
  return weightedTotal / totalImportance
}

/**
 * Weighted average rounded half-up to tenths, returned as an integer number
 * of tenths (e.g. 554 means 55.4). Uses the assignment's integer-only formula:
 *
 *   floor((20 × weightedTotal + importanceTotal) / (2 × importanceTotal))
 *
 * Integer arithmetic avoids floating-point errors such as 28.05 being stored
 * as 28.04999… and rounding down.
 */
export function roundedTenths(weightedTotal, totalImportance) {
  return Math.floor((20 * weightedTotal + totalImportance) / (2 * totalImportance))
}

/** Formats integer tenths as a string with exactly one decimal place: 554 → "55.4". */
export function displayAverage(tenths) {
  return `${Math.floor(tenths / 10)}.${tenths % 10}`
}

/**
 * Returns a copy of `city` whose wishlist places carry the given importance
 * values. Places missing from `importanceByPlaceId` keep their original value.
 * The original city object is not modified.
 */
export function applyImportance(city, importanceByPlaceId) {
  return {
    ...city,
    wishlist_places: city.wishlist_places.map((place) =>
      Object.hasOwn(importanceByPlaceId, place?.id)
        ? { ...place, importance: importanceByPlaceId[place.id] }
        : place,
    ),
  }
}

/**
 * Accessibility results for every hotel against every wishlist place.
 *
 * Returns { importanceTotal, hotels } where each hotel entry is
 * { hotelId, contributions, weightedTravelTotal, weightedAverageTenths, weightedAverageDisplay }.
 */
export function calculateAccessibility(hotels, places) {
  const totalImportance = importanceTotal(places)

  return {
    importanceTotal: totalImportance,
    hotels: hotels.map((hotel) => {
      const contributions = contributionDetails(hotel, places)
      const total = contributions.reduce((sum, detail) => sum + detail.contribution, 0)
      const tenths = roundedTenths(total, totalImportance)
      return {
        hotelId: hotel.id,
        contributions,
        weightedTravelTotal: total,
        weightedAverageTenths: tenths,
        weightedAverageDisplay: displayAverage(tenths),
      }
    }),
  }
}
