import { displayAverage, roundedTenths } from '../src/domain/calculations.js'
import {
  compareForRanking,
  compareHotels,
  INVALID_SCENARIO,
  isAffordable,
  NO_AFFORDABLE_HOTEL,
  rankHotels,
  RECOMMENDATION_FOUND,
  remainingBudget,
  shortfall,
} from '../src/domain/ranking.js'
import expected from './fixtures/expectedResults.json'
import { AURA_BUDGET, auraCity, fixtureRow, makeCity, toFixtureShape } from './testScenarios.js'

const entry = (hotelId, weightedTravelTotal, stayCost) => ({ hotelId, weightedTravelTotal, stayCost })

describe('affordability (AC-11, AC-12, AC-23)', () => {
  it('is affordable one unit below, exactly at, but not one unit above the budget (TC-13 – TC-15)', () => {
    expect(isAffordable(19_999, 20_000)).toBe(true)
    expect(isAffordable(20_000, 20_000)).toBe(true)
    expect(isAffordable(20_001, 20_000)).toBe(false)
  })

  it('calculates remaining budget and shortfall', () => {
    expect(remainingBudget(22_000, 33_000)).toBe(11_000)
    expect(remainingBudget(33_000, 33_000)).toBe(0)
    expect(shortfall(41_000, 33_000)).toBe(8_000)
  })

  it('gives a hotel exactly on budget rank and ₹0 remaining; one unit over gets no rank', () => {
    const result = rankHotels([entry('A', 100, 500), entry('B', 50, 501)], 500)
    expect(result.hotels).toEqual([
      { ...entry('A', 100, 500), affordable: true, remainingBudget: 0, shortfall: null, rank: 1 },
      { ...entry('B', 50, 501), affordable: false, remainingBudget: null, shortfall: 1, rank: null },
    ])
  })
})

describe('ranking order and tie-breaks (AC-13, AC-14, AC-21, AC-22)', () => {
  it('ranks the lower weighted total first (TC-07)', () => {
    expect(rankHotels([entry('B', 120, 1), entry('A', 100, 1)], 10).rankedHotelIds).toEqual(['A', 'B'])
  })

  it('breaks an accessibility tie by lower stay cost, regardless of ID (TC-08)', () => {
    const result = rankHotels([entry('A', 100, 12_000), entry('B', 100, 10_000)], 20_000)
    expect(result.rankedHotelIds).toEqual(['B', 'A'])
  })

  it('breaks a full tie by ascending ASCII hotel ID (TC-09)', () => {
    const result = rankHotels([entry('HOTEL_B', 100, 10_000), entry('HOTEL_A', 100, 10_000)], 20_000)
    expect(result.rankedHotelIds).toEqual(['HOTEL_A', 'HOTEL_B'])
  })

  it('uses ASCII order, not locale order, for IDs with "-", digits and "_"', () => {
    // ASCII: "-" (45) < "0" (48) < "A" (65) < "_" (95)
    const ids = ['H_1', 'HA', 'H0', 'H-1']
    const result = rankHotels(ids.map((id) => entry(id, 100, 1)), 1)
    expect(result.rankedHotelIds).toEqual(['H-1', 'H0', 'HA', 'H_1'])
  })

  it('ranks by exact total even when displayed averages are equal (TC-06, TC-12)', () => {
    // With importance total 45, both 2493 and 2492 display as 55.4.
    expect(displayAverage(roundedTenths(2493, 45))).toBe(displayAverage(roundedTenths(2492, 45)))
    const result = rankHotels([entry('A', 2493, 1_000), entry('B', 2492, 9_000)], 10_000)
    expect(result.rankedHotelIds).toEqual(['B', 'A'])
  })

  it('does not depend on input order', () => {
    const entries = [entry('C', 90, 3), entry('A', 90, 3), entry('B', 80, 9), entry('D', 90, 2)]
    const forwards = rankHotels(entries, 10).rankedHotelIds
    const backwards = rankHotels([...entries].reverse(), 10).rankedHotelIds
    expect(forwards).toEqual(['B', 'D', 'A', 'C'])
    expect(backwards).toEqual(forwards)
  })

  it('compareForRanking returns 0 only for identical keys', () => {
    expect(compareForRanking(entry('A', 1, 1), entry('A', 1, 1))).toBe(0)
    expect(compareForRanking(entry('A', 1, 1), entry('B', 1, 1))).toBeLessThan(0)
  })

  it('applies the tie-breaks end to end through compareHotels', () => {
    const city = makeCity({
      importances: [3, 2, 1],
      hotels: [
        { id: 'HOTEL_C', cost: 500, minutes: [10, 20, 30] }, // total 100
        { id: 'HOTEL_B', cost: 400, minutes: [10, 20, 30] }, // total 100, cheaper
        { id: 'HOTEL_A', cost: 500, minutes: [10, 20, 30] }, // total 100, ties HOTEL_C on cost
      ],
    })
    expect(compareHotels(city, 1000).rankedHotelIds).toEqual(['HOTEL_B', 'HOTEL_A', 'HOTEL_C'])
  })
})

describe('ranks, visibility and recommendation', () => {
  const entries = [entry('A', 300, 10), entry('B', 100, 99), entry('C', 200, 20), entry('D', 400, 30), entry('E', 50, 25)]
  const result = rankHotels(entries, 30)

  it('assigns unique consecutive ranks starting at 1 (TC-10)', () => {
    expect(result.hotels.filter((h) => h.affordable).map((h) => h.rank).sort()).toEqual([1, 2, 3, 4])
    expect(result.rankedHotelIds).toEqual(['E', 'C', 'A', 'D'])
  })

  it('keeps over-budget hotels visible, unranked, with their shortfall (TC-11)', () => {
    expect(result.hotels).toHaveLength(5)
    expect(result.hotels.find((h) => h.hotelId === 'B')).toMatchObject({ affordable: false, rank: null, shortfall: 69 })
  })

  it('recommends rank 1, never the over-budget hotel with the lowest total', () => {
    expect(result.status).toBe(RECOMMENDATION_FOUND)
    expect(result.recommendedHotelId).toBe('E')
  })

  it('keeps hotels in input order', () => {
    expect(result.hotels.map((h) => h.hotelId)).toEqual(['A', 'B', 'C', 'D', 'E'])
  })
})

describe('no affordable hotel (AC-15, AC-27)', () => {
  it('returns NO_AFFORDABLE_HOTEL with no recommendation and no ranks', () => {
    const result = rankHotels([entry('A', 1, 100), entry('B', 2, 200)], 99)
    expect(result.status).toBe(NO_AFFORDABLE_HOTEL)
    expect(result.recommendedHotelId).toBeNull()
    expect(result.rankedHotelIds).toEqual([])
    expect(result.hotels.map((h) => [h.rank, h.shortfall])).toEqual([[null, 1], [null, 101]])
  })

  it('treats budget 0 as valid with every hotel over budget (TC-19)', () => {
    const result = compareHotels(auraCity(), 0)
    expect(result.status).toBe(NO_AFFORDABLE_HOTEL)
    expect(result.errors).toEqual([])
    expect(result.hotels.every((h) => !h.affordable && h.rank === null && h.shortfall === h.stayCost)).toBe(true)
  })

  it('matches the fixture at ₹17,999, keeping contributions and every shortfall (TC-21)', () => {
    const result = compareHotels(auraCity(), 17_999)
    expect(result.status).toBe(NO_AFFORDABLE_HOTEL)
    expect(result.recommendedHotelId).toBeNull()
    expect(result.hotels.map(toFixtureShape)).toEqual(expected.no_affordable.results.map(fixtureRow))
    expect(result.hotels.every((h) => h.contributions.length === 15)).toBe(true)
  })
})

describe('compareHotels — Aura main scenario (AC-02, AC-03)', () => {
  const result = compareHotels(auraCity(), AURA_BUDGET)

  it('reproduces every hotel’s independently calculated result', () => {
    expect(result.status).toBe(RECOMMENDATION_FOUND)
    expect(result.importanceTotal).toBe(45)
    expect(result.hotels.map(toFixtureShape)).toEqual(expected.initial.results.map(fixtureRow))
  })

  it('ranks 5 affordable hotels and recommends The Meridian House', () => {
    expect(result.rankedHotelIds).toEqual(['HOTEL_AURA_03', 'HOTEL_AURA_04', 'HOTEL_AURA_05', 'HOTEL_AURA_02', 'HOTEL_AURA_06'])
    expect(result.rankedHotelIds).toEqual(expected.initial.ranking)
    expect(result.recommendedHotelId).toBe('HOTEL_AURA_03')
  })

  it('shows the recommendation at 2492 / 55.4 with ₹11,000 remaining', () => {
    const meridian = result.hotels.find((h) => h.hotelId === 'HOTEL_AURA_03')
    expect(meridian).toMatchObject({
      hotelName: 'The Meridian House',
      stayCost: 22_000,
      weightedTravelTotal: 2492,
      weightedAverageDisplay: '55.4',
      remainingBudget: 11_000,
      rank: 1,
    })
  })

  it('satisfies the decision story', () => {
    const affordable = result.hotels.filter((h) => h.affordable)
    const cheapest = affordable.reduce((a, b) => (b.stayCost < a.stayCost ? b : a))
    const mostAccessible = result.hotels.reduce((a, b) => (b.weightedTravelTotal < a.weightedTravelTotal ? b : a))

    expect(affordable.length).toBeGreaterThanOrEqual(4)
    expect(affordable.length).toBeLessThanOrEqual(7)
    expect(cheapest.hotelId).toBe('HOTEL_AURA_02')
    expect(result.recommendedHotelId).not.toBe(cheapest.hotelId)
    expect(mostAccessible).toMatchObject({ hotelId: 'HOTEL_AURA_01', weightedTravelTotal: 1558, affordable: false, shortfall: 8_000 })

    const maxTrip = (h) => Math.max(...h.contributions.map((d) => d.roundTripMinutes))
    expect(affordable.some((h) => maxTrip(h) <= 90)).toBe(true)
    expect(affordable.some((h) => maxTrip(h) > 90)).toBe(true)
  })
})

describe('compareHotels — budget what-if (AC-08, AC-24)', () => {
  it('makes Celestial Crown the recommendation at exactly ₹41,000 (TC-20)', () => {
    const result = compareHotels(auraCity(), 41_000)
    expect(result.recommendedHotelId).toBe('HOTEL_AURA_01')
    expect(result.rankedHotelIds).toEqual([
      'HOTEL_AURA_01', 'HOTEL_AURA_03', 'HOTEL_AURA_04', 'HOTEL_AURA_07', 'HOTEL_AURA_05', 'HOTEL_AURA_02', 'HOTEL_AURA_06',
    ])
    expect(result.hotels.map(toFixtureShape)).toEqual(expected.budget_what_if.results.map(fixtureRow))
  })

  it('keeps Celestial Crown unranked at ₹40,999', () => {
    const result = compareHotels(auraCity(), 40_999)
    expect(result.recommendedHotelId).toBe('HOTEL_AURA_03')
    expect(result.hotels.find((h) => h.hotelId === 'HOTEL_AURA_01')).toMatchObject({ rank: null, shortfall: 1 })
    expect(result.hotels.map(toFixtureShape)).toEqual(expected.budget_one_below_what_if.results.map(fixtureRow))
  })

  it('changes affordability and ranks but not contributions, totals or averages (TC-16 – TC-18)', () => {
    const accessibility = (r) => r.hotels.map((h) => [h.contributions, h.weightedTravelTotal, h.weightedAverageDisplay])
    const base = compareHotels(auraCity(), AURA_BUDGET)
    const raised = compareHotels(auraCity(), 41_000)
    const lowered = compareHotels(auraCity(), 25_000)

    expect(accessibility(raised)).toEqual(accessibility(base))
    expect(accessibility(lowered)).toEqual(accessibility(base))
    expect(lowered.rankedHotelIds).toEqual(['HOTEL_AURA_03', 'HOTEL_AURA_04', 'HOTEL_AURA_02'])
    expect(raised.rankedHotelIds).toHaveLength(7)
  })
})

describe('compareHotels — importance what-if (AC-09, AC-25)', () => {
  it('recommends Riverside Atelier when The Gilded Gallery drops from 3 to 2 (TC-30)', () => {
    const result = compareHotels(auraCity(), AURA_BUDGET, { PLACE_GILDED_01: 2 })
    expect(result.importanceTotal).toBe(44)
    expect(result.recommendedHotelId).toBe('HOTEL_AURA_04')
    expect(result.rankedHotelIds).toEqual(expected.importance_what_if.ranking)
    expect(result.hotels.map(toFixtureShape)).toEqual(expected.importance_what_if.results.map(fixtureRow))
  })

  it('restores the original result when the importance is set back to 3', () => {
    expect(compareHotels(auraCity(), AURA_BUDGET, { PLACE_GILDED_01: 3 })).toEqual(compareHotels(auraCity(), AURA_BUDGET))
  })
})

describe('compareHotels — invalid input clears all derived results (AC-16, AC-26)', () => {
  const emptyResult = {
    status: INVALID_SCENARIO,
    importanceTotal: null,
    recommendedHotelId: null,
    rankedHotelIds: [],
    hotels: [],
  }

  it.each([
    ['budget -1', -1, {}],
    ['budget 1,000,001', 1_000_001, {}],
    ['fractional budget', 33_000.5, {}],
    ['importance 0', AURA_BUDGET, { PLACE_GILDED_01: 0 }],
    ['importance 6', AURA_BUDGET, { PLACE_GILDED_01: 6 }],
    ['fractional importance', AURA_BUDGET, { PLACE_GILDED_01: 2.5 }],
  ])('returns errors and no ranks, recommendation or contributions for %s (TC-57, TC-58)', (_, budget, importance) => {
    const result = compareHotels(auraCity(), budget, importance)
    expect(result).toMatchObject(emptyResult)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('identifies which input is invalid', () => {
    expect(compareHotels(auraCity(), -1).errors.map((e) => e.path)).toEqual(['budget'])
    expect(compareHotels(auraCity(), AURA_BUDGET, { PLACE_GILDED_01: 9 }).errors.map((e) => e.path)).toEqual([
      'wishlist_places[2].importance',
    ])
  })

  it('produces no partial ranking when one record is invalid among valid ones (TC-59)', () => {
    const city = auraCity()
    delete city.hotels[9].round_trip_minutes.PLACE_CAFE_01
    expect(compareHotels(city, AURA_BUDGET)).toMatchObject(emptyResult)
  })

  it('rejects a duplicate-ID scenario (AC-17)', () => {
    const city = auraCity()
    city.hotels[1].id = 'HOTEL_AURA_01'
    expect(compareHotels(city, AURA_BUDGET).status).toBe(INVALID_SCENARIO)
  })

  it('calculates a fresh valid comparison once the input is corrected (TC-60)', () => {
    expect(compareHotels(auraCity(), -1).status).toBe(INVALID_SCENARIO)
    expect(compareHotels(auraCity(), AURA_BUDGET).recommendedHotelId).toBe('HOTEL_AURA_03')
  })

  it('reports a non-object city instead of throwing', () => {
    expect(compareHotels(null, AURA_BUDGET)).toMatchObject(emptyResult)
  })
})

describe('compareHotels — purity and determinism', () => {
  it('does not modify the city data', () => {
    const city = auraCity()
    const before = structuredClone(city)
    compareHotels(city, 41_000, { PLACE_GILDED_01: 2 })
    expect(city).toEqual(before)
  })

  it('returns identical results for identical inputs', () => {
    expect(compareHotels(auraCity(), AURA_BUDGET)).toEqual(compareHotels(auraCity(), AURA_BUDGET))
  })
})
