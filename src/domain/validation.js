/**
 * validation.js — Domain Layer
 *
 * Validates the complete city scenario and the editable inputs (budget and
 * current importance values) before the calculation pipeline runs.
 *
 * Every function returns an array of errors; an empty array means valid.
 * Each error is { path, message }, where `path` points at the offending value,
 * e.g. "budget", "hotels[2].stay_cost" or "wishlist_places[4].importance".
 * Paths use array indexes rather than IDs so they stay unambiguous even when
 * an ID is itself malformed or duplicated.
 *
 * Map coordinates are only range-checked (0–100). They are presentation data
 * and are never read by calculations.js or ranking.js.
 *
 * This module must never import React, SVG utilities, or
 * tests/fixtures/expectedResults.json.
 */

export const ID_PATTERN = /^[A-Z][A-Z0-9_-]{0,15}$/
export const PLACE_TYPES = ['attraction', 'food']

export const LIMITS = {
  hotelCount: { min: 2, max: 10 },
  placeCount: { min: 3, max: 15 },
  budget: { min: 0, max: 1_000_000 },
  stayCost: { min: 1, max: 1_000_000 },
  importance: { min: 1, max: 5 },
  roundTripMinutes: { min: 1, max: 600 },
  coordinate: { min: 0, max: 100 },
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Number.isInteger rejects strings, NaN, Infinity and fractions in one check.
function checkInteger(value, { min, max }, path, label) {
  if (Number.isInteger(value) && value >= min && value <= max) return []
  return [{ path, message: `${label} must be a whole number from ${min} to ${max} (got ${JSON.stringify(value)}).` }]
}

function checkId(id, path) {
  if (typeof id === 'string' && ID_PATTERN.test(id)) return []
  return [{ path, message: `ID ${JSON.stringify(id)} must start with an uppercase letter followed by up to 15 of A–Z, 0–9, "_" or "-".` }]
}

function checkName(name, path) {
  if (typeof name === 'string' && name.trim() !== '') return []
  return [{ path, message: 'Name must not be empty.' }]
}

function checkMapPosition(position, path) {
  if (!isPlainObject(position)) {
    return [{ path, message: 'Map position must be an object with x and y.' }]
  }
  const { min, max } = LIMITS.coordinate
  const errors = []
  for (const axis of ['x', 'y']) {
    const value = position[axis]
    if (!Number.isFinite(value) || value < min || value > max) {
      errors.push({ path: `${path}.${axis}`, message: `Map coordinate ${axis} must be a number from ${min} to ${max}.` })
    }
  }
  return errors
}

/** Validates the editable budget on its own. */
export function validateBudget(budget) {
  return checkInteger(budget, LIMITS.budget, 'budget', 'Budget')
}

/** Validates one editable importance value on its own. */
export function validateImportance(importance, path = 'importance') {
  return checkInteger(importance, LIMITS.importance, path, 'Importance')
}

function validatePlace(place, index) {
  const path = `wishlist_places[${index}]`
  if (!isPlainObject(place)) return [{ path, message: 'Wishlist place must be an object.' }]

  const errors = [
    ...checkId(place.id, `${path}.id`),
    ...checkName(place.name, `${path}.name`),
    ...validateImportance(place.importance, `${path}.importance`),
    ...checkMapPosition(place.map_position, `${path}.map_position`),
  ]
  if (!PLACE_TYPES.includes(place.type)) {
    errors.push({ path: `${path}.type`, message: `Place type must be "attraction" or "food" (got ${JSON.stringify(place.type)}).` })
  }
  return errors
}

/** Each hotel needs exactly one valid round-trip time per wishlist place: none missing, none unknown. */
function validateTravelMapping(mapping, placeIds, path) {
  if (!isPlainObject(mapping)) {
    return [{ path, message: 'round_trip_minutes must be an object keyed by wishlist place ID.' }]
  }

  const errors = []
  for (const placeId of placeIds) {
    if (!Object.hasOwn(mapping, placeId)) {
      errors.push({ path: `${path}.${placeId}`, message: `Missing round-trip time for wishlist place ${placeId}.` })
    }
  }
  for (const [placeId, minutes] of Object.entries(mapping)) {
    if (!placeIds.includes(placeId)) {
      errors.push({ path: `${path}.${placeId}`, message: `Unknown wishlist place ID ${placeId} in travel mapping.` })
    } else {
      errors.push(...checkInteger(minutes, LIMITS.roundTripMinutes, `${path}.${placeId}`, 'Round-trip time'))
    }
  }
  return errors
}

function validateHotel(hotel, index, placeIds) {
  const path = `hotels[${index}]`
  if (!isPlainObject(hotel)) return [{ path, message: 'Hotel must be an object.' }]

  return [
    ...checkId(hotel.id, `${path}.id`),
    ...checkName(hotel.name, `${path}.name`),
    ...checkInteger(hotel.stay_cost, LIMITS.stayCost, `${path}.stay_cost`, 'Stay cost'),
    ...checkMapPosition(hotel.map_position, `${path}.map_position`),
    ...validateTravelMapping(hotel.round_trip_minutes, placeIds, `${path}.round_trip_minutes`),
  ]
}

/** IDs must be unique across the whole scenario: the city, hotels and places together. */
function checkUniqueIds(city) {
  const entries = [
    { id: city.id, path: 'city.id' },
    ...city.hotels.map((hotel, i) => ({ id: hotel?.id, path: `hotels[${i}].id` })),
    ...city.wishlist_places.map((place, i) => ({ id: place?.id, path: `wishlist_places[${i}].id` })),
  ]

  const firstPathById = new Map()
  const errors = []
  for (const { id, path } of entries) {
    if (typeof id !== 'string') continue
    if (firstPathById.has(id)) {
      errors.push({ path, message: `Duplicate ID ${id} (already used at ${firstPathById.get(id)}).` })
    } else {
      firstPathById.set(id, path)
    }
  }
  return errors
}

/**
 * Validates the complete scenario.
 *
 * `city` is the city object with the *current* importance values already
 * applied to its wishlist places (see applyImportance in calculations.js),
 * and `budget` is the current editable budget.
 *
 * Returns every problem found, not just the first, so all of them can be
 * shown at once.
 */
export function validateScenario(city, budget) {
  if (!isPlainObject(city)) return [{ path: 'city', message: 'City data must be an object.' }]

  const errors = [
    ...checkId(city.id, 'city.id'),
    ...checkName(city.name, 'city.name'),
    ...validateBudget(budget),
  ]

  // Without both lists the remaining checks cannot run.
  if (!Array.isArray(city.hotels)) errors.push({ path: 'hotels', message: 'Hotels must be a list.' })
  if (!Array.isArray(city.wishlist_places)) errors.push({ path: 'wishlist_places', message: 'Wishlist places must be a list.' })
  if (!Array.isArray(city.hotels) || !Array.isArray(city.wishlist_places)) return errors

  const { hotelCount, placeCount } = LIMITS
  if (city.hotels.length < hotelCount.min || city.hotels.length > hotelCount.max) {
    errors.push({ path: 'hotels', message: `Scenario must have ${hotelCount.min}–${hotelCount.max} hotels (got ${city.hotels.length}).` })
  }
  if (city.wishlist_places.length < placeCount.min || city.wishlist_places.length > placeCount.max) {
    errors.push({ path: 'wishlist_places', message: `Scenario must have ${placeCount.min}–${placeCount.max} wishlist places (got ${city.wishlist_places.length}).` })
  }

  const placeIds = city.wishlist_places.map((place) => place?.id)
  city.wishlist_places.forEach((place, i) => errors.push(...validatePlace(place, i)))
  city.hotels.forEach((hotel, i) => errors.push(...validateHotel(hotel, i, placeIds)))
  errors.push(...checkUniqueIds(city))

  return errors
}
