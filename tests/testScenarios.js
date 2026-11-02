// Shared builders for domain tests. Test-only; never imported by src/.
import cityData from '../src/data/cityData.json'

/** A fresh deep copy of the Aura city, safe to mutate in a test. */
export function auraCity() {
  return structuredClone(cityData.city)
}

export const AURA_BUDGET = cityData.city.initial_budget

/**
 * Builds a small valid city for focused ranking and calculation tests.
 *
 *   makeCity({
 *     importances: [3, 2, 1],                       // one entry per place
 *     hotels: [{ id: 'HOTEL_A', cost: 100, minutes: [20, 40, 10] }],
 *   })
 *
 * Places are named PLACE_1, PLACE_2, … in order.
 */
export function makeCity({ importances = [1, 1, 1], hotels }) {
  const places = importances.map((importance, i) => ({
    id: `PLACE_${i + 1}`,
    name: `Place ${i + 1}`,
    type: i % 2 === 0 ? 'attraction' : 'food',
    importance,
    map_position: { x: 5 * i, y: 5 * i },
  }))

  return {
    id: 'TEST_CITY',
    name: 'Test City',
    hotels: hotels.map((hotel, i) => ({
      id: hotel.id,
      name: hotel.name ?? `Hotel ${hotel.id}`,
      stay_cost: hotel.cost,
      map_position: { x: 50, y: 5 * i },
      round_trip_minutes: Object.fromEntries(places.map((place, j) => [place.id, hotel.minutes[j]])),
    })),
    wishlist_places: places,
  }
}

/** Projects a compareHotels() hotel onto the field names used in expectedResults.json. */
export function toFixtureShape(hotel) {
  return {
    hotel_id: hotel.hotelId,
    weighted_travel_total: hotel.weightedTravelTotal,
    weighted_average_display: hotel.weightedAverageDisplay,
    affordable: hotel.affordable,
    remaining_budget: hotel.remainingBudget,
    budget_shortfall: hotel.shortfall,
    rank: hotel.rank,
  }
}

/** The same projection applied to a fixture result row, dropping descriptive fields. */
export function fixtureRow({ hotel_id, weighted_travel_total, weighted_average_display, affordable, remaining_budget, budget_shortfall, rank }) {
  return { hotel_id, weighted_travel_total, weighted_average_display, affordable, remaining_budget, budget_shortfall, rank }
}
