import {
  applyImportance,
  calculateAccessibility,
  contribution,
  contributionDetails,
  displayAverage,
  importanceTotal,
  roundedTenths,
  weightedAverageMinutes,
  weightedTravelTotal,
} from '../src/domain/calculations.js'
import expected from './fixtures/expectedResults.json'
import { auraCity, makeCity } from './testScenarios.js'

describe('contribution arithmetic (AC-19)', () => {
  it('multiplies importance by round-trip minutes (TC-01, TC-02)', () => {
    expect(contribution(3, 20)).toBe(60)
    expect(contribution(2, 40)).toBe(80)
  })

  it('sums contributions into the weighted travel total and averages by total importance (TC-03, TC-04)', () => {
    const city = makeCity({
      importances: [3, 2],
      hotels: [{ id: 'A', cost: 1, minutes: [20, 40] }],
    })
    const [hotel] = city.hotels
    expect(weightedTravelTotal(hotel, city.wishlist_places)).toBe(140)
    expect(importanceTotal(city.wishlist_places)).toBe(5)
    expect(weightedAverageMinutes(140, 5)).toBe(28)
    expect(displayAverage(roundedTenths(140, 5))).toBe('28.0')
  })
})

describe('round-half-up display (AC-20)', () => {
  it('rounds an exact .x5 up: 561 / 20 = 28.05 displays as 28.1 (TC-05)', () => {
    expect(roundedTenths(561, 20)).toBe(281)
    expect(displayAverage(281)).toBe('28.1')
  })

  it('rounds other exact half-way values up', () => {
    expect(roundedTenths(201, 4)).toBe(503) // 50.25 → 50.3
    expect(roundedTenths(1, 4)).toBe(3) // 0.25 → 0.3
    expect(roundedTenths(1, 20)).toBe(1) // 0.05 → 0.1
  })

  it('rounds values just below half-way down', () => {
    expect(roundedTenths(1121, 40)).toBe(280) // 28.025 → 28.0
    expect(roundedTenths(5609, 200)).toBe(280) // 28.045 → 28.0
  })

  it.each([
    // [total, importanceTotal, expected display]
    [2492, 45, '55.4'], // 55.377…
    [2546, 45, '56.6'], // 56.577…
    [1558, 45, '34.6'], // 34.622…
    [3456, 45, '76.8'], // 76.8 exactly
    [100, 3, '33.3'], // 33.333…
    [200, 3, '66.7'], // 66.666…
    [499, 10, '49.9'],
    [0, 7, '0.0'],
    [3396, 43, '79.0'], // 78.976… → keeps the trailing zero
  ])('%i / %i displays as %s', (total, impTotal, shown) => {
    expect(displayAverage(roundedTenths(total, impTotal))).toBe(shown)
  })

  it('always shows exactly one decimal place', () => {
    expect(displayAverage(5)).toBe('0.5')
    expect(displayAverage(100)).toBe('10.0')
    expect(displayAverage(12345)).toBe('1234.5')
  })
})

describe('contributionDetails', () => {
  it('includes every wishlist place, in wishlist order, for every hotel', () => {
    const city = auraCity()
    const placeIds = city.wishlist_places.map((p) => p.id)
    for (const hotel of city.hotels) {
      const details = contributionDetails(hotel, city.wishlist_places)
      expect(details.map((d) => d.placeId)).toEqual(placeIds)
    }
  })

  it('exposes importance, supplied minutes and contribution per place', () => {
    const city = auraCity()
    const meridian = city.hotels.find((h) => h.id === 'HOTEL_AURA_03')
    const gilded = contributionDetails(meridian, city.wishlist_places).find((d) => d.placeId === 'PLACE_GILDED_01')
    expect(gilded).toEqual({
      placeId: 'PLACE_GILDED_01',
      placeName: 'The Gilded Gallery',
      importance: 3,
      roundTripMinutes: 23,
      contribution: 69,
    })
  })
})

describe('calculateAccessibility on the Aura dataset', () => {
  const city = auraCity()
  const result = calculateAccessibility(city.hotels, city.wishlist_places)

  it('uses an importance total of 45', () => {
    expect(result.importanceTotal).toBe(expected.initial.importance_total)
  })

  it('matches the independently calculated totals and averages for all 10 hotels', () => {
    expect(result.hotels.map((h) => [h.hotelId, h.weightedTravelTotal, h.weightedAverageDisplay])).toEqual(
      expected.initial.results.map((r) => [r.hotel_id, r.weighted_travel_total, r.weighted_average_display]),
    )
  })

  it('makes each weighted total equal the sum of its 15 contributions', () => {
    for (const hotel of result.hotels) {
      expect(hotel.contributions).toHaveLength(15)
      expect(hotel.contributions.reduce((sum, d) => sum + d.contribution, 0)).toBe(hotel.weightedTravelTotal)
    }
  })

  it('identifies Celestial Crown Hotel as uniquely most accessible (1558)', () => {
    const totals = result.hotels.map((h) => h.weightedTravelTotal).sort((a, b) => a - b)
    expect(totals[0]).toBe(1558)
    expect(totals[1]).toBeGreaterThan(1558)
  })
})

describe('applyImportance and importance changes (TC-22 – TC-25)', () => {
  it('returns a new city without modifying the original', () => {
    const city = auraCity()
    const changed = applyImportance(city, { PLACE_GILDED_01: 2 })
    expect(city.wishlist_places[2].importance).toBe(3)
    expect(changed.wishlist_places[2].importance).toBe(2)
    expect(changed.hotels).toBe(city.hotels)
  })

  it('keeps original values for places that are not overridden', () => {
    const city = auraCity()
    const changed = applyImportance(city, { PLACE_GILDED_01: 2 })
    expect(changed.wishlist_places.filter((p) => p.id !== 'PLACE_GILDED_01')).toEqual(
      city.wishlist_places.filter((p) => p.id !== 'PLACE_GILDED_01'),
    )
  })

  it.each([
    ['increasing', 5],
    ['decreasing', 1],
  ])('%s one importance changes that place’s contribution for every hotel and nothing else', (_, newValue) => {
    const city = auraCity()
    const before = calculateAccessibility(city.hotels, city.wishlist_places)
    const changed = applyImportance(city, { PLACE_GILDED_01: newValue })
    const after = calculateAccessibility(changed.hotels, changed.wishlist_places)

    expect(after.importanceTotal).toBe(45 - 3 + newValue)
    before.hotels.forEach((oldHotel, i) => {
      const newHotel = after.hotels[i]
      const minutes = city.hotels[i].round_trip_minutes.PLACE_GILDED_01
      oldHotel.contributions.forEach((oldDetail, j) => {
        const expectedContribution = oldDetail.placeId === 'PLACE_GILDED_01' ? newValue * minutes : oldDetail.contribution
        expect(newHotel.contributions[j].contribution).toBe(expectedContribution)
      })
      expect(newHotel.weightedTravelTotal).toBe(oldHotel.weightedTravelTotal + (newValue - 3) * minutes)
    })
  })

  it('matches the independently calculated Gilded Gallery 3 → 2 results', () => {
    const changed = applyImportance(auraCity(), { PLACE_GILDED_01: 2 })
    const result = calculateAccessibility(changed.hotels, changed.wishlist_places)
    expect(result.importanceTotal).toBe(44)
    expect(result.hotels.map((h) => [h.hotelId, h.weightedTravelTotal, h.weightedAverageDisplay])).toEqual(
      expected.importance_what_if.results.map((r) => [r.hotel_id, r.weighted_travel_total, r.weighted_average_display]),
    )
  })
})

describe('independence from map geometry (TC-68)', () => {
  it('gives identical results when every map position is moved', () => {
    const city = auraCity()
    const moved = auraCity()
    for (const item of [...moved.hotels, ...moved.wishlist_places]) {
      item.map_position = { x: 100 - item.map_position.x, y: 0 }
    }
    expect(calculateAccessibility(moved.hotels, moved.wishlist_places)).toEqual(
      calculateAccessibility(city.hotels, city.wishlist_places),
    )
  })
})
