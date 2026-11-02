import { validateBudget, validateImportance, validateScenario } from '../src/domain/validation.js'
import { AURA_BUDGET, auraCity, makeCity } from './testScenarios.js'

const paths = (errors) => errors.map((e) => e.path)

function smallCity(hotelCount, placeCount) {
  return makeCity({
    importances: Array(placeCount).fill(1),
    hotels: Array.from({ length: hotelCount }, (_, i) => ({
      id: `HOTEL_${i}`,
      cost: 1000,
      minutes: Array(placeCount).fill(30),
    })),
  })
}

describe('validateScenario — valid data', () => {
  it('accepts the supplied Aura dataset at the initial budget', () => {
    expect(validateScenario(auraCity(), AURA_BUDGET)).toEqual([])
  })

  it('accepts the minimum (2 hotels, 3 places) and maximum (10 hotels, 15 places) sizes', () => {
    expect(validateScenario(smallCity(2, 3), 0)).toEqual([])
    expect(validateScenario(smallCity(10, 15), 0)).toEqual([])
  })

  it('accepts every inclusive numeric bound', () => {
    const city = makeCity({
      importances: [1, 5, 3],
      hotels: [
        { id: 'A', cost: 1, minutes: [1, 600, 30] },
        { id: 'B', cost: 1_000_000, minutes: [600, 1, 30] },
      ],
    })
    city.wishlist_places[0].map_position = { x: 0, y: 100 }
    expect(validateScenario(city, 0)).toEqual([])
    expect(validateScenario(city, 1_000_000)).toEqual([])
  })

  it('does not modify the input', () => {
    const city = auraCity()
    const before = structuredClone(city)
    validateScenario(city, AURA_BUDGET)
    expect(city).toEqual(before)
  })
})

describe('validateScenario — counts', () => {
  it.each([
    ['fewer than 2 hotels (TC-31)', 1, 3, 'hotels'],
    ['more than 10 hotels (TC-32)', 11, 3, 'hotels'],
    ['fewer than 3 places (TC-33)', 2, 2, 'wishlist_places'],
    ['more than 15 places (TC-34)', 2, 16, 'wishlist_places'],
  ])('rejects %s', (_, hotels, places, path) => {
    expect(paths(validateScenario(smallCity(hotels, places), 0))).toContain(path)
  })

  it('rejects missing hotel or place lists without throwing', () => {
    const city = auraCity()
    delete city.hotels
    city.wishlist_places = 'not a list'
    expect(paths(validateScenario(city, 0))).toEqual(['hotels', 'wishlist_places'])
  })

  it('rejects a non-object city', () => {
    expect(paths(validateScenario(null, 0))).toEqual(['city'])
  })
})

describe('validateScenario — IDs', () => {
  it('rejects duplicate hotel IDs (TC-35, AC-17)', () => {
    const city = auraCity()
    city.hotels[1].id = city.hotels[0].id
    const errors = validateScenario(city, AURA_BUDGET)
    expect(paths(errors)).toEqual(['hotels[1].id'])
    expect(errors[0].message).toMatch(/Duplicate ID HOTEL_AURA_01/)
  })

  it('rejects duplicate place IDs (TC-36)', () => {
    const city = makeCity({
      hotels: [
        { id: 'A', cost: 10, minutes: [10, 20, 30] },
        { id: 'B', cost: 10, minutes: [10, 20, 30] },
      ],
    })
    city.wishlist_places[2].id = 'PLACE_1'
    expect(paths(validateScenario(city, 0))).toContain('wishlist_places[2].id')
  })

  it('rejects a hotel ID equal to a place ID (TC-37)', () => {
    const city = auraCity()
    city.hotels[0].id = 'PLACE_CROWN_01'
    expect(paths(validateScenario(city, AURA_BUDGET))).toContain('wishlist_places[0].id')
  })

  it('rejects a hotel or place ID equal to the city ID', () => {
    const city = auraCity()
    city.hotels[0].id = 'AURA'
    expect(paths(validateScenario(city, AURA_BUDGET))).toContain('hotels[0].id')
  })

  it.each([
    ['starts with a lowercase letter (TC-38)', 'hotel1'],
    ['starts with a number (TC-39)', '1HOTEL'],
    ['contains an unsupported character (TC-40)', 'HOTEL@1'],
    ['is longer than 16 characters (TC-41)', 'A2345678901234567'],
    ['is empty', ''],
    ['is not a string', 7],
  ])('rejects an ID that %s', (_, badId) => {
    const city = auraCity()
    city.hotels[3].id = badId
    expect(paths(validateScenario(city, AURA_BUDGET))).toContain('hotels[3].id')
  })

  it.each(['HOTEL1', 'CLOCK_TOWER', 'FOOD-01', 'A', 'A234567890123456'])('accepts the valid ID %s', (goodId) => {
    const city = auraCity()
    city.hotels[3].id = goodId
    expect(validateScenario(city, AURA_BUDGET)).toEqual([])
  })

  it('rejects a malformed city ID', () => {
    const city = auraCity()
    city.id = 'aura'
    expect(paths(validateScenario(city, AURA_BUDGET))).toEqual(['city.id'])
  })
})

describe('validateScenario — names and types', () => {
  it.each([
    ['empty hotel name (TC-42)', (c) => (c.hotels[0].name = ''), 'hotels[0].name'],
    ['empty place name (TC-43)', (c) => (c.wishlist_places[0].name = ''), 'wishlist_places[0].name'],
    ['whitespace-only name (TC-44)', (c) => (c.hotels[2].name = '   \t '), 'hotels[2].name'],
    ['missing name', (c) => delete c.wishlist_places[4].name, 'wishlist_places[4].name'],
    ['unsupported place type (TC-45)', (c) => (c.wishlist_places[5].type = 'shopping'), 'wishlist_places[5].type'],
    ['wrongly cased place type', (c) => (c.wishlist_places[5].type = 'Food'), 'wishlist_places[5].type'],
  ])('rejects %s', (_, mutate, path) => {
    const city = auraCity()
    mutate(city)
    expect(paths(validateScenario(city, AURA_BUDGET))).toEqual([path])
  })

  it('accepts a name with surrounding whitespace around real text', () => {
    const city = auraCity()
    city.hotels[0].name = '  Celestial Crown Hotel  '
    expect(validateScenario(city, AURA_BUDGET)).toEqual([])
  })
})

describe('validateScenario — numeric bounds', () => {
  it.each([
    ['stay cost 0 (TC-46)', 0],
    ['stay cost 1,000,001 (TC-47)', 1_000_001],
    ['fractional stay cost (TC-48)', 22000.5],
    ['stay cost given as a string', '22000'],
  ])('rejects %s', (_, cost) => {
    const city = auraCity()
    city.hotels[2].stay_cost = cost
    expect(paths(validateScenario(city, AURA_BUDGET))).toEqual(['hotels[2].stay_cost'])
  })

  it.each([
    ['travel time 0 (TC-49)', 0],
    ['travel time 601 (TC-50)', 601],
    ['fractional travel time (TC-51)', 30.5],
    ['missing value', null],
  ])('rejects %s', (_, minutes) => {
    const city = auraCity()
    city.hotels[4].round_trip_minutes.PLACE_FORT_01 = minutes
    expect(paths(validateScenario(city, AURA_BUDGET))).toEqual(['hotels[4].round_trip_minutes.PLACE_FORT_01'])
  })

  it.each([
    ['importance 0 (TC-27)', 0],
    ['importance 6 (TC-28)', 6],
    ['fractional importance (TC-29)', 2.5],
  ])('rejects %s', (_, importance) => {
    const city = auraCity()
    city.wishlist_places[2].importance = importance
    expect(paths(validateScenario(city, AURA_BUDGET))).toEqual(['wishlist_places[2].importance'])
  })

  it.each([
    ['budget -1 (TC-54)', -1],
    ['budget 1,000,001 (TC-55)', 1_000_001],
    ['fractional budget (TC-56)', 33000.5],
    ['NaN budget', NaN],
    ['empty-string budget', ''],
  ])('rejects %s', (_, budget) => {
    expect(paths(validateScenario(auraCity(), budget))).toEqual(['budget'])
  })
})

describe('validateScenario — travel-time mappings (AC-18)', () => {
  it('rejects a mapping that misses a wishlist place (TC-52)', () => {
    const city = auraCity()
    delete city.hotels[6].round_trip_minutes.PLACE_SWEET_01
    const errors = validateScenario(city, AURA_BUDGET)
    expect(paths(errors)).toEqual(['hotels[6].round_trip_minutes.PLACE_SWEET_01'])
    expect(errors[0].message).toMatch(/Missing/)
  })

  it('rejects a mapping with an unknown place ID (TC-53)', () => {
    const city = auraCity()
    city.hotels[6].round_trip_minutes.PLACE_UNKNOWN_01 = 40
    const errors = validateScenario(city, AURA_BUDGET)
    expect(paths(errors)).toEqual(['hotels[6].round_trip_minutes.PLACE_UNKNOWN_01'])
    expect(errors[0].message).toMatch(/Unknown/)
  })

  it('rejects a mapping where one ID was replaced by another (missing + unknown)', () => {
    const city = auraCity()
    const mapping = city.hotels[0].round_trip_minutes
    mapping.PLACE_CROWN_02 = mapping.PLACE_CROWN_01
    delete mapping.PLACE_CROWN_01
    expect(validateScenario(city, AURA_BUDGET)).toHaveLength(2)
  })

  it('rejects a missing or non-object mapping', () => {
    const city = auraCity()
    delete city.hotels[0].round_trip_minutes
    city.hotels[1].round_trip_minutes = [51, 45, 28]
    expect(paths(validateScenario(city, AURA_BUDGET))).toEqual([
      'hotels[0].round_trip_minutes',
      'hotels[1].round_trip_minutes',
    ])
  })
})

describe('validateScenario — map coordinates', () => {
  it.each([
    ['x below 0', { x: -1, y: 50 }, ['hotels[0].map_position.x']],
    ['y above 100', { x: 50, y: 100.5 }, ['hotels[0].map_position.y']],
    ['non-numeric coordinates', { x: '50', y: null }, ['hotels[0].map_position.x', 'hotels[0].map_position.y']],
  ])('rejects %s', (_, position, expectedPaths) => {
    const city = auraCity()
    city.hotels[0].map_position = position
    expect(paths(validateScenario(city, AURA_BUDGET))).toEqual(expectedPaths)
  })

  it('rejects a missing place map position', () => {
    const city = auraCity()
    delete city.wishlist_places[0].map_position
    expect(paths(validateScenario(city, AURA_BUDGET))).toEqual(['wishlist_places[0].map_position'])
  })
})

describe('validateScenario — reporting', () => {
  it('reports every problem at once, not just the first', () => {
    const city = auraCity()
    city.hotels[0].stay_cost = 0
    city.wishlist_places[1].importance = 9
    city.hotels[9].name = ''
    expect(paths(validateScenario(city, -5))).toEqual([
      'budget',
      'wishlist_places[1].importance',
      'hotels[0].stay_cost',
      'hotels[9].name',
    ])
  })

  it('gives every error a readable message', () => {
    const city = auraCity()
    city.hotels[0].stay_cost = 0
    const [error] = validateScenario(city, AURA_BUDGET)
    expect(error.message).toBe('Stay cost must be a whole number from 1 to 1000000 (got 0).')
  })
})

describe('validateBudget and validateImportance', () => {
  it.each([0, 1, 33000, 1_000_000])('accepts budget %s', (budget) => {
    expect(validateBudget(budget)).toEqual([])
  })

  it.each([-1, 1_000_001, 0.5, '33000', null, undefined, Infinity])('rejects budget %s', (budget) => {
    expect(validateBudget(budget)).toHaveLength(1)
  })

  it.each([1, 2, 3, 4, 5])('accepts importance %s', (value) => {
    expect(validateImportance(value)).toEqual([])
  })

  it.each([0, 6, 2.5, -1, '3', null])('rejects importance %s', (value) => {
    expect(validateImportance(value, 'wishlist_places[0].importance')).toEqual([
      expect.objectContaining({ path: 'wishlist_places[0].importance' }),
    ])
  })
})
