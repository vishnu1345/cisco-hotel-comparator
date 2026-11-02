/**
 * useComparator.js — Application / State Layer
 *
 * Connects the React UI to the domain layer. It stores only the inputs that
 * change and derives everything else through compareHotels().
 *
 * State (one useState object, null until the city is loaded):
 *  - city            : the bundled city data (never modified)
 *  - budgetInput     : budget exactly as entered (number or string)
 *  - importanceInputs: { [placeId]: importance exactly as entered }
 *  - selectedHotelId : hotel currently being inspected
 *
 * Derived with useMemo (never stored):
 *  - comparison      : compareHotels() result — validation errors, totals,
 *                      affordability, ranks and recommendation
 *  - selectedHotel   : the inspected hotel's entry in that comparison, or
 *                      null when the scenario is invalid
 *
 * Raw inputs are kept so the UI can show and correct what the user typed.
 * They are converted to numbers here, at the application boundary, and all
 * validation happens in the domain layer.
 *
 * This hook must not import tests/fixtures/expectedResults.json and must not
 * perform business calculations itself — those live in src/domain/.
 */

import { useMemo, useState } from 'react'
import cityData from '../data/cityData.json'
import { compareHotels, INVALID_SCENARIO } from '../domain/ranking.js'

/** Hotel inspected after loading and after reset: the initial recommendation. */
export const DEFAULT_SELECTED_HOTEL_ID = 'HOTEL_AURA_03'

const DECIMAL_NUMBER = /^-?\d+(\.\d+)?$/

/**
 * Converts a typed value to a number when it is a plain decimal string such
 * as "41000" or " 2 ". Anything else (empty text, "abc", "1e3", "33,000") is
 * returned unchanged so domain validation rejects it — it never becomes 0.
 */
export function toNumberInput(value) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return DECIMAL_NUMBER.test(trimmed) ? Number(trimmed) : value
}

/** The complete original scenario, built fresh from the static dataset. */
function createInitialState(city) {
  return {
    city,
    budgetInput: city.initial_budget,
    importanceInputs: Object.fromEntries(city.wishlist_places.map((place) => [place.id, place.importance])),
    selectedHotelId: DEFAULT_SELECTED_HOTEL_ID,
  }
}

/** Maps domain error paths like "wishlist_places[2].importance" to place IDs. */
function importanceErrorsByPlaceId(errors, places) {
  const result = {}
  for (const error of errors) {
    const match = /^wishlist_places\[(\d+)\]\.importance$/.exec(error.path)
    if (match) result[places[Number(match[1])].id] = error.message
  }
  return result
}

export default function useComparator() {
  const [state, setState] = useState(null)

  const city = state?.city ?? null
  const budgetInput = state?.budgetInput ?? null
  const importanceInputs = state?.importanceInputs ?? null
  const selectedHotelId = state?.selectedHotelId ?? null

  // Selection is deliberately not a dependency: inspecting a hotel never re-runs the comparison.
  const comparison = useMemo(() => {
    if (!city) return null
    const importanceByPlaceId = Object.fromEntries(
      Object.entries(importanceInputs).map(([placeId, value]) => [placeId, toNumberInput(value)]),
    )
    return compareHotels(city, toNumberInput(budgetInput), importanceByPlaceId)
  }, [city, budgetInput, importanceInputs])

  const selectedHotel = comparison?.hotels.find((hotel) => hotel.hotelId === selectedHotelId) ?? null
  const errors = comparison?.errors ?? []

  /** Loads the complete bundled city in one state update. */
  function loadCity() {
    setState(createInitialState(cityData.city))
  }

  function setBudget(value) {
    setState((current) => (current ? { ...current, budgetInput: value } : current))
  }

  /** Changes one place's importance; unknown place IDs are ignored. */
  function setImportance(placeId, value) {
    setState((current) => {
      if (!current || !Object.hasOwn(current.importanceInputs, placeId)) return current
      return { ...current, importanceInputs: { ...current.importanceInputs, [placeId]: value } }
    })
  }

  /** Inspects a hotel; unknown hotel IDs are ignored and the current selection is kept. */
  function selectHotel(hotelId) {
    setState((current) => {
      if (!current || !current.city.hotels.some((hotel) => hotel.id === hotelId)) return current
      return { ...current, selectedHotelId: hotelId }
    })
  }

  /** Restores the original budget, importance values, selection and results. */
  function reset() {
    setState(createInitialState(cityData.city))
  }

  return {
    isLoaded: city !== null,
    city,
    budgetInput,
    importanceInputs,
    selectedHotelId,
    comparison,
    selectedHotel,
    isValid: comparison !== null && comparison.status !== INVALID_SCENARIO,
    errors,
    budgetError: errors.find((error) => error.path === 'budget')?.message ?? null,
    importanceErrors: city ? importanceErrorsByPlaceId(errors, city.wishlist_places) : {},
    loadCity,
    setBudget,
    setImportance,
    selectHotel,
    reset,
  }
}
