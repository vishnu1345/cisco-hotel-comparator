// Application-state tests for useComparator. Calculation details are covered
// by the Stage 2 domain tests; these focus on state, actions and derivation.
import { act, renderHook } from '@testing-library/react'
import cityData from '../src/data/cityData.json'
import { INVALID_SCENARIO, NO_AFFORDABLE_HOTEL, RECOMMENDATION_FOUND } from '../src/domain/ranking.js'
import useComparator, { DEFAULT_SELECTED_HOTEL_ID, toNumberInput } from '../src/hooks/useComparator.js'
import expected from './fixtures/expectedResults.json'
import { fixtureRow, toFixtureShape } from './testScenarios.js'

const INITIAL_RANKING = ['HOTEL_AURA_03', 'HOTEL_AURA_04', 'HOTEL_AURA_05', 'HOTEL_AURA_02', 'HOTEL_AURA_06']

function renderLoaded() {
  const hook = renderHook(() => useComparator())
  act(() => hook.result.current.loadCity())
  return hook
}

/** The parts of a comparison that depend only on importance and travel time. */
const accessibilityOf = (comparison) =>
  comparison.hotels.map((h) => [h.hotelId, h.contributions, h.weightedTravelTotal, h.weightedAverageDisplay])

/** Asserts that nothing derived from a previous valid comparison is still exposed. */
function expectNoStaleResults(current) {
  expect(current.isValid).toBe(false)
  expect(current.comparison.status).toBe(INVALID_SCENARIO)
  expect(current.comparison.recommendedHotelId).toBeNull()
  expect(current.comparison.rankedHotelIds).toEqual([])
  expect(current.comparison.hotels).toEqual([])
  expect(current.selectedHotel).toBeNull()
}

describe('before loading', () => {
  it('exposes no city and no comparison', () => {
    const { result } = renderHook(() => useComparator())
    expect(result.current).toMatchObject({
      isLoaded: false,
      city: null,
      comparison: null,
      selectedHotel: null,
      isValid: false,
      errors: [],
      budgetError: null,
    })
  })

  it('ignores edits until a city is loaded', () => {
    const { result } = renderHook(() => useComparator())
    act(() => {
      result.current.setBudget(41_000)
      result.current.setImportance('PLACE_GILDED_01', 2)
      result.current.selectHotel('HOTEL_AURA_01')
    })
    expect(result.current.isLoaded).toBe(false)
    expect(result.current.comparison).toBeNull()
  })
})

describe('loadCity', () => {
  it('loads the complete Aura scenario in one action', () => {
    const { result } = renderLoaded()
    const { current } = result
    expect(current.isLoaded).toBe(true)
    expect(current.city.hotels).toHaveLength(10)
    expect(current.city.wishlist_places).toHaveLength(15)
    expect(current.budgetInput).toBe(33_000)
    expect(current.importanceInputs).toEqual(
      Object.fromEntries(cityData.city.wishlist_places.map((p) => [p.id, p.importance])),
    )
    expect(current.selectedHotelId).toBe(DEFAULT_SELECTED_HOTEL_ID)
  })

  it('produces the independently verified initial comparison', () => {
    const { comparison, isValid, errors } = renderLoaded().result.current
    expect(isValid).toBe(true)
    expect(errors).toEqual([])
    expect(comparison.status).toBe(RECOMMENDATION_FOUND)
    expect(comparison.importanceTotal).toBe(45)
    expect(comparison.recommendedHotelId).toBe('HOTEL_AURA_03')
    expect(comparison.rankedHotelIds).toEqual(INITIAL_RANKING)
    expect(comparison.hotels.map(toFixtureShape)).toEqual(expected.initial.results.map(fixtureRow))
  })

  it('inspects The Meridian House by default', () => {
    const { selectedHotel } = renderLoaded().result.current
    expect(selectedHotel).toMatchObject({ hotelId: 'HOTEL_AURA_03', hotelName: 'The Meridian House', rank: 1 })
    expect(selectedHotel.contributions).toHaveLength(15)
  })
})

describe('budget updates', () => {
  it('recalculates affordability, ranking and recommendation but not accessibility (AC-24)', () => {
    const { result } = renderLoaded()
    const before = result.current.comparison
    act(() => result.current.setBudget(41_000))
    const after = result.current.comparison

    expect(after.recommendedHotelId).toBe('HOTEL_AURA_01')
    expect(after.rankedHotelIds).toEqual(expected.budget_what_if.ranking)
    expect(accessibilityOf(after)).toEqual(accessibilityOf(before))
  })

  it('treats a hotel costing exactly the budget as affordable and one unit over as unranked', () => {
    const { result } = renderLoaded()
    act(() => result.current.setBudget(41_000))
    expect(result.current.comparison.hotels[0]).toMatchObject({ hotelId: 'HOTEL_AURA_01', affordable: true, rank: 1, remainingBudget: 0 })

    act(() => result.current.setBudget(40_999))
    expect(result.current.comparison.hotels[0]).toMatchObject({ affordable: false, rank: null, shortfall: 1 })
    expect(result.current.comparison.recommendedHotelId).toBe('HOTEL_AURA_03')
  })

  it('accepts numeric text from an input field', () => {
    const { result } = renderLoaded()
    act(() => result.current.setBudget(' 41000 '))
    expect(result.current.budgetInput).toBe(' 41000 ')
    expect(result.current.comparison.recommendedHotelId).toBe('HOTEL_AURA_01')
  })

  it('reaches the no-affordable state as a valid result, not an error', () => {
    const { result } = renderLoaded()
    act(() => result.current.setBudget('0'))
    expect(result.current.isValid).toBe(true)
    expect(result.current.comparison.status).toBe(NO_AFFORDABLE_HOTEL)
    expect(result.current.comparison.recommendedHotelId).toBeNull()
    // The inspected hotel stays inspectable, with a shortfall and no rank.
    expect(result.current.selectedHotel).toMatchObject({ hotelId: 'HOTEL_AURA_03', rank: null, shortfall: 22_000 })
  })
})

describe('invalid budget', () => {
  it.each([
    ['empty text', ''],
    ['whitespace', '   '],
    ['non-numeric text', 'abc'],
    ['a negative number', '-1'],
    ['more than 1,000,000', 1_000_001],
    ['a fraction', '33000.5'],
    ['exponent notation', '1e3'],
    ['a thousands separator', '33,000'],
  ])('rejects %s and clears every derived result', (_, value) => {
    const { result } = renderLoaded()
    act(() => result.current.setBudget(value))
    expectNoStaleResults(result.current)
    expect(result.current.budgetError).toMatch(/Budget must be a whole number from 0 to 1000000/)
    expect(result.current.budgetInput).toBe(value) // kept so the user can correct it
  })

  it('never turns empty input into a budget of 0', () => {
    const { result } = renderLoaded()
    act(() => result.current.setBudget(''))
    expect(result.current.comparison.status).not.toBe(NO_AFFORDABLE_HOTEL)
    expect(result.current.comparison.status).toBe(INVALID_SCENARIO)
  })

  it('recovers with fresh results once corrected', () => {
    const { result } = renderLoaded()
    act(() => result.current.setBudget('-5'))
    act(() => result.current.setBudget('41000'))
    expect(result.current.isValid).toBe(true)
    expect(result.current.budgetError).toBeNull()
    expect(result.current.comparison.recommendedHotelId).toBe('HOTEL_AURA_01')
    expect(result.current.selectedHotel.hotelId).toBe('HOTEL_AURA_03')
  })
})

describe('importance updates', () => {
  it('recommends Riverside Atelier when The Gilded Gallery drops from 3 to 2 (AC-09)', () => {
    const { result } = renderLoaded()
    act(() => result.current.setImportance('PLACE_GILDED_01', 2))
    const { comparison } = result.current
    expect(comparison.importanceTotal).toBe(44)
    expect(comparison.recommendedHotelId).toBe('HOTEL_AURA_04')
    expect(comparison.rankedHotelIds).toEqual(expected.importance_what_if.ranking)
    expect(comparison.hotels.map(toFixtureShape)).toEqual(expected.importance_what_if.results.map(fixtureRow))
  })

  it('changes only the edited place and keeps every other importance', () => {
    const { result } = renderLoaded()
    const before = result.current.importanceInputs
    act(() => result.current.setImportance('PLACE_GILDED_01', '2'))
    expect(result.current.importanceInputs).toEqual({ ...before, PLACE_GILDED_01: '2' })
  })

  it('updates the inspected hotel’s contribution for that place (AC-25)', () => {
    const { result } = renderLoaded()
    const gildedOf = () => result.current.selectedHotel.contributions.find((d) => d.placeId === 'PLACE_GILDED_01')
    expect(gildedOf()).toMatchObject({ importance: 3, roundTripMinutes: 23, contribution: 69 })
    act(() => result.current.setImportance('PLACE_GILDED_01', 5))
    expect(gildedOf()).toMatchObject({ importance: 5, roundTripMinutes: 23, contribution: 115 })
  })

  it('ignores unknown place IDs', () => {
    const { result } = renderLoaded()
    const before = result.current.importanceInputs
    act(() => result.current.setImportance('PLACE_NOPE', 2))
    expect(result.current.importanceInputs).toBe(before)
  })
})

describe('invalid importance', () => {
  it.each([
    ['0', 0],
    ['6', 6],
    ['a fraction', '2.5'],
    ['empty text', ''],
    ['non-numeric text', 'high'],
  ])('rejects %s and clears every derived result', (_, value) => {
    const { result } = renderLoaded()
    act(() => result.current.setImportance('PLACE_GILDED_01', value))
    expectNoStaleResults(result.current)
    expect(result.current.importanceErrors).toEqual({
      PLACE_GILDED_01: expect.stringMatching(/Importance must be a whole number from 1 to 5/),
    })
    expect(result.current.budgetError).toBeNull()
  })

  it('recovers once corrected', () => {
    const { result } = renderLoaded()
    act(() => result.current.setImportance('PLACE_GILDED_01', 9))
    act(() => result.current.setImportance('PLACE_GILDED_01', '2'))
    expect(result.current.isValid).toBe(true)
    expect(result.current.importanceErrors).toEqual({})
    expect(result.current.comparison.recommendedHotelId).toBe('HOTEL_AURA_04')
  })

  it('reports budget and importance errors together', () => {
    const { result } = renderLoaded()
    act(() => {
      result.current.setBudget(-1)
      result.current.setImportance('PLACE_CROWN_01', 0)
    })
    expect(result.current.budgetError).not.toBeNull()
    expect(Object.keys(result.current.importanceErrors)).toEqual(['PLACE_CROWN_01'])
  })
})

describe('hotel selection', () => {
  it('inspects any hotel, including an over-budget one', () => {
    const { result } = renderLoaded()
    act(() => result.current.selectHotel('HOTEL_AURA_01'))
    expect(result.current.selectedHotelId).toBe('HOTEL_AURA_01')
    expect(result.current.selectedHotel).toMatchObject({ hotelId: 'HOTEL_AURA_01', affordable: false, rank: null, shortfall: 8_000 })
    expect(result.current.selectedHotel.contributions).toHaveLength(15)
  })

  it('does not re-run or change the comparison (AC-28)', () => {
    const { result } = renderLoaded()
    const before = result.current.comparison
    act(() => result.current.selectHotel('HOTEL_AURA_09'))
    expect(result.current.comparison).toBe(before) // same memoised object
    expect(result.current.comparison.recommendedHotelId).toBe('HOTEL_AURA_03')
  })

  it.each([['an unknown ID', 'HOTEL_NOPE'], ['a place ID', 'PLACE_CROWN_01'], ['undefined', undefined]])(
    'keeps the current selection when given %s',
    (_, badId) => {
      const { result } = renderLoaded()
      act(() => result.current.selectHotel('HOTEL_AURA_05'))
      act(() => result.current.selectHotel(badId))
      expect(result.current.selectedHotelId).toBe('HOTEL_AURA_05')
    },
  )

  it('keeps the selection through an invalid edit but exposes no stale details', () => {
    const { result } = renderLoaded()
    act(() => result.current.selectHotel('HOTEL_AURA_07'))
    act(() => result.current.setBudget('abc'))
    expect(result.current.selectedHotelId).toBe('HOTEL_AURA_07')
    expect(result.current.selectedHotel).toBeNull()
    act(() => result.current.setBudget(41_000))
    expect(result.current.selectedHotel).toMatchObject({ hotelId: 'HOTEL_AURA_07', rank: 4 })
  })
})

describe('reset (AC-10, AC-29)', () => {
  it('restores the full original scenario after budget, importance and selection changes', () => {
    const { result } = renderLoaded()
    const original = result.current

    act(() => {
      result.current.setBudget(41_000)
      result.current.setImportance('PLACE_GILDED_01', 2)
      result.current.selectHotel('HOTEL_AURA_10')
    })
    expect(result.current.comparison.recommendedHotelId).toBe('HOTEL_AURA_01')

    act(() => result.current.reset())
    expect(result.current.budgetInput).toBe(33_000)
    expect(result.current.importanceInputs).toEqual(original.importanceInputs)
    expect(result.current.selectedHotelId).toBe('HOTEL_AURA_03')
    expect(result.current.city).toBe(original.city)
    expect(result.current.comparison).toEqual(original.comparison)
    expect(result.current.comparison.recommendedHotelId).toBe('HOTEL_AURA_03')
  })

  it('restores the baseline from an invalid state', () => {
    const { result } = renderLoaded()
    act(() => result.current.setImportance('PLACE_GILDED_01', 0))
    act(() => result.current.reset())
    expect(result.current.isValid).toBe(true)
    expect(result.current.comparison.rankedHotelIds).toEqual(INITIAL_RANKING)
  })

  it('gives identical results on repeated resets and never modifies the dataset (TC-73)', () => {
    const datasetBefore = structuredClone(cityData)
    const { result } = renderLoaded()
    const first = result.current.comparison

    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current.setImportance('PLACE_NIGHT_01', 1)
        result.current.setBudget(50_000)
      })
      act(() => result.current.reset())
      expect(result.current.comparison).toEqual(first)
    }
    expect(cityData).toEqual(datasetBefore)
  })
})

describe('toNumberInput', () => {
  it.each([
    ['41000', 41000],
    [' 2 ', 2],
    ['-1', -1],
    ['33000.5', 33000.5],
    [7, 7],
  ])('converts %j to %j', (input, output) => {
    expect(toNumberInput(input)).toBe(output)
  })

  it.each(['', '  ', 'abc', '1e3', '0x10', '33,000', '+5', null, undefined])('leaves %j unchanged', (input) => {
    expect(toNumberInput(input)).toBe(input)
  })
})
