// UI integration tests: render the real App (hook + domain + components) and
// interact with it the way a user would.
import { fireEvent, render, screen, within } from '@testing-library/react'
import App from '../src/App.jsx'

function renderLoadedApp() {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Load Aura City' }))
}

const region = (name) => screen.getByRole('region', { name })
const ranking = () => region('Hotel ranking')
const details = () => region('Inspected hotel details')
const map = () => region('Schematic city map')
const breakdown = () => region(/^Contribution breakdown/)
const recommendation = () => screen.queryByRole('status', { name: 'Recommended hotel' })
const budgetInput = () => screen.getByLabelText('Complete-stay budget')
const setBudget = (value) => fireEvent.change(budgetInput(), { target: { value } })
const setImportance = (placeName, value) =>
  fireEvent.change(screen.getByLabelText(`Importance of ${placeName}`), { target: { value } })
const mapLinks = () => within(map()).queryAllByRole('img', { name: /^Comparison link/ })
const scenarioValue = (label) => screen.getByText(label).nextElementSibling.textContent

/** The ranking-table row for a hotel, found from its inspect button. */
function rankingRow(hotelName) {
  return within(ranking()).getByRole('button', { name: new RegExp(`${hotelName}$`) }).closest('tr')
}

describe('initial empty state', () => {
  it('shows only a Load Aura City action and no comparison', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Load Aura City' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Hotel ranking' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Complete-stay budget')).not.toBeInTheDocument()
    expect(recommendation()).not.toBeInTheDocument()
  })
})

describe('after loading Aura City', () => {
  beforeEach(renderLoadedApp)

  it('shows the city, currency and original budget', () => {
    expect(screen.getByText(/Aura City · prices in INR/)).toBeInTheDocument()
    expect(budgetInput()).toHaveValue('33000')
    expect(scenarioValue('Affordable hotels')).toBe('5 of 10')
    expect(scenarioValue('Total importance')).toBe('45')
  })

  it('recommends The Meridian House with its totals', () => {
    const card = recommendation()
    expect(within(card).getByText('The Meridian House')).toBeInTheDocument()
    expect(card).toHaveTextContent('2,492')
    expect(card).toHaveTextContent('55.4 min')
    expect(card).toHaveTextContent('₹11,000 left in budget')
  })

  it('lists all 10 hotels: 5 ranked, 5 over budget without a rank', () => {
    const buttons = within(ranking()).getAllByRole('button')
    expect(buttons).toHaveLength(10)

    const rankCells = buttons.map((button) => button.closest('tr').querySelector('.rank-cell').textContent)
    expect(rankCells).toEqual(['1', '2', '3', '4', '5', '—', '—', '—', '—', '—'])
    expect(buttons.slice(0, 5).map((b) => b.textContent)).toEqual([
      'H3 The Meridian House',
      'H4 Riverside Atelier',
      'H5 Amber Courtyard Hotel',
      'H2 Juniper Lane Inn',
      'H6 Northstar Lodge',
    ])
    expect(rankingRow('Celestial Crown Hotel')).toHaveTextContent('✕ Over budget by ₹8,000')
  })

  it('marks the recommendation with text, not colour alone', () => {
    expect(within(rankingRow('The Meridian House')).getByText('★ Recommended')).toBeInTheDocument()
    expect(within(ranking()).getAllByText('★ Recommended')).toHaveLength(1)
  })

  it('inspects the recommended hotel by default', () => {
    expect(within(details()).getByRole('heading', { name: 'The Meridian House' })).toBeInTheDocument()
    expect(details()).toHaveTextContent('★ Recommended — rank 1 of 5')
    expect(within(rankingRow('The Meridian House')).getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders all 25 labelled map markers', () => {
    const hotels = within(map()).getAllByRole('img', { name: /^Hotel H\d+: / })
    const places = within(map()).getAllByRole('img', { name: /^(Attraction|Food stop) P\d+: / })
    expect(hotels).toHaveLength(10)
    expect(places).toHaveLength(15)
    expect(places.filter((p) => p.getAttribute('aria-label').startsWith('Attraction'))).toHaveLength(9)
  })

  it('draws only the inspected hotel’s 15 comparison links, labelled with time and contribution', () => {
    const links = mapLinks()
    expect(links).toHaveLength(15)
    expect(links.every((link) => link.getAttribute('aria-label').includes('The Meridian House'))).toBe(true)
    expect(links.map((l) => l.getAttribute('aria-label'))).toContain(
      'Comparison link The Meridian House to The Gilded Gallery: 23 min round trip, contribution 69',
    )
  })

  it('states that the map is schematic and links are not routes', () => {
    expect(map()).toHaveTextContent('Lines are hotel-to-place comparisons, not roads or routes')
  })

  it('shows all 15 places in the contribution breakdown with type, importance, time and contribution', () => {
    const rows = within(breakdown()).getAllByRole('textbox', { name: /^Importance of / })
    expect(rows).toHaveLength(15)
    const gildedRow = screen.getByLabelText('Importance of The Gilded Gallery').closest('tr')
    expect(gildedRow).toHaveTextContent('Attraction')
    expect(gildedRow).toHaveTextContent('3 × 23 = 69')
    expect(breakdown()).toHaveTextContent('2,492 ÷ 45 = 55.4 min')
  })

  it('shows the full 10 × 15 travel-time table', () => {
    const table = region('Round-trip travel times (minutes)')
    expect(within(table).getAllByRole('rowheader')).toHaveLength(10)
    expect(table.querySelectorAll('tbody td')).toHaveLength(150)
  })
})

describe('hotel selection', () => {
  beforeEach(renderLoadedApp)

  it('updates details, breakdown and map links for an over-budget hotel', () => {
    fireEvent.click(within(ranking()).getByRole('button', { name: /Celestial Crown Hotel$/ }))

    expect(within(details()).getByRole('heading', { name: 'Celestial Crown Hotel' })).toBeInTheDocument()
    expect(details()).toHaveTextContent('Over budget by ₹8,000')
    expect(details()).toHaveTextContent('Not ranked (over budget)')
    expect(breakdown()).toHaveTextContent('1,558 ÷ 45 = 34.6 min')
    expect(mapLinks()).toHaveLength(15)
    expect(mapLinks().every((l) => l.getAttribute('aria-label').includes('Celestial Crown Hotel'))).toBe(true)
  })

  it('does not change the recommendation or ranking', () => {
    const rankingBefore = within(ranking()).getAllByRole('button').map((b) => b.textContent)
    fireEvent.click(within(ranking()).getByRole('button', { name: /Skyline Pavilion$/ }))

    expect(within(recommendation()).getByText('The Meridian House')).toBeInTheDocument()
    expect(within(ranking()).getAllByRole('button').map((b) => b.textContent)).toEqual(rankingBefore)
    expect(details()).toHaveTextContent('Inspecting this hotel does not change the recommendation: The Meridian House')
  })

  it('can also be done from the travel-time table, keeping both views in sync', () => {
    const table = region('Round-trip travel times (minutes)')
    fireEvent.click(within(table).getByRole('button', { name: /Velvet Quay Suites$/ }))
    expect(within(details()).getByRole('heading', { name: 'Velvet Quay Suites' })).toBeInTheDocument()
    expect(within(rankingRow('Velvet Quay Suites')).getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('budget control', () => {
  beforeEach(renderLoadedApp)

  it('recommends Celestial Crown at exactly ₹41,000 without changing contributions', () => {
    setBudget('41000')
    expect(within(recommendation()).getByText('Celestial Crown Hotel')).toBeInTheDocument()
    expect(rankingRow('Celestial Crown Hotel').querySelector('.rank-cell')).toHaveTextContent('1')
    expect(rankingRow('Celestial Crown Hotel')).toHaveTextContent('₹0 left')
    expect(scenarioValue('Affordable hotels')).toBe('7 of 10')
    expect(breakdown()).toHaveTextContent('2,492 ÷ 45 = 55.4 min')
  })

  it('shows Celestial Crown over budget by ₹1 at ₹40,999', () => {
    setBudget('40999')
    expect(rankingRow('Celestial Crown Hotel')).toHaveTextContent('✕ Over budget by ₹1')
    expect(rankingRow('Celestial Crown Hotel').querySelector('.rank-cell')).toHaveTextContent('—')
    expect(within(recommendation()).getByText('The Meridian House')).toBeInTheDocument()
  })

  it('rejects invalid text visibly, keeps it for correction and clears every derived result', () => {
    setBudget('33000.5')

    expect(budgetInput()).toHaveValue('33000.5')
    expect(budgetInput()).toHaveAttribute('aria-invalid', 'true')
    expect(budgetInput()).toHaveAccessibleDescription(/Budget must be a whole number from 0 to 1000000/)
    expect(screen.getByRole('alert')).toHaveTextContent('Comparison paused')

    expect(recommendation()).not.toBeInTheDocument()
    expect(ranking()).toHaveTextContent('Ranking hidden until the input is valid.')
    expect(screen.queryByText('★ Recommended')).not.toBeInTheDocument()
    expect(details()).toHaveTextContent('Details hidden until the input is valid.')
    expect(mapLinks()).toHaveLength(0)
    expect(breakdown()).not.toHaveTextContent('3 × 23 = 69')
    expect(scenarioValue('Affordable hotels')).toBe('—')
  })

  it('never treats an empty budget as ₹0', () => {
    setBudget('')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText('NO_AFFORDABLE_HOTEL')).not.toBeInTheDocument()
  })

  it('recovers when the budget is corrected', () => {
    setBudget('abc')
    setBudget('33000')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(within(recommendation()).getByText('The Meridian House')).toBeInTheDocument()
    expect(mapLinks()).toHaveLength(15)
  })

  it('shows NO_AFFORDABLE_HOTEL with shortfalls and no ranks when nothing fits', () => {
    setBudget('17999')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(recommendation()).not.toBeInTheDocument()
    expect(screen.getAllByText('NO_AFFORDABLE_HOTEL').length).toBeGreaterThan(0)
    const buttons = within(ranking()).getAllByRole('button')
    expect(buttons).toHaveLength(10)
    expect(buttons.every((b) => b.closest('tr').querySelector('.rank-cell').textContent === '—')).toBe(true)
    expect(rankingRow('Juniper Lane Inn')).toHaveTextContent('Over budget by ₹1')
    expect(scenarioValue('Affordable hotels')).toBe('0 of 10')
    // The inspected hotel is still explained, with its shortfall.
    expect(details()).toHaveTextContent('Over budget by ₹4,001')
  })
})

describe('importance editing', () => {
  beforeEach(renderLoadedApp)

  it('recommends Riverside Atelier when The Gilded Gallery drops from 3 to 2', () => {
    setImportance('The Gilded Gallery', '2')

    expect(scenarioValue('Total importance')).toBe('44')
    expect(within(recommendation()).getByText('Riverside Atelier')).toBeInTheDocument()
    expect(within(ranking()).getAllByRole('button')[0]).toHaveTextContent('Riverside Atelier')
  })

  it('updates the breakdown and map link labels for the edited place', () => {
    setImportance('The Gilded Gallery', '5')
    const gildedRow = screen.getByLabelText('Importance of The Gilded Gallery').closest('tr')
    expect(gildedRow).toHaveTextContent('5 × 23 = 115')
    expect(mapLinks().map((l) => l.getAttribute('aria-label'))).toContain(
      'Comparison link The Meridian House to The Gilded Gallery: 23 min round trip, contribution 115',
    )
  })

  it('rejects an invalid importance next to its input and clears derived results', () => {
    setImportance('The Gilded Gallery', '6')

    const input = screen.getByLabelText('Importance of The Gilded Gallery')
    expect(input).toHaveValue('6')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/Importance must be a whole number from 1 to 5/)
    expect(recommendation()).not.toBeInTheDocument()
    expect(mapLinks()).toHaveLength(0)
    expect(within(breakdown()).getAllByRole('textbox')).toHaveLength(15) // still editable
  })
})

describe('reset', () => {
  beforeEach(renderLoadedApp)

  it('restores the budget, importance, inspected hotel, ranking and recommendation', () => {
    setBudget('41000')
    setImportance('The Gilded Gallery', '2')
    fireEvent.click(within(ranking()).getByRole('button', { name: /Orchid Gate Hotel$/ }))

    fireEvent.click(screen.getByRole('button', { name: /Reset to original scenario/ }))

    expect(budgetInput()).toHaveValue('33000')
    expect(screen.getByLabelText('Importance of The Gilded Gallery')).toHaveValue('3')
    expect(within(recommendation()).getByText('The Meridian House')).toBeInTheDocument()
    expect(within(details()).getByRole('heading', { name: 'The Meridian House' })).toBeInTheDocument()
    expect(scenarioValue('Affordable hotels')).toBe('5 of 10')
    expect(scenarioValue('Total importance')).toBe('45')
    expect(breakdown()).toHaveTextContent('3 × 23 = 69')
    expect(within(ranking()).getAllByRole('button').slice(0, 5).map((b) => b.textContent)).toEqual([
      'H3 The Meridian House',
      'H4 Riverside Atelier',
      'H5 Amber Courtyard Hotel',
      'H2 Juniper Lane Inn',
      'H6 Northstar Lodge',
    ])
  })

  it('restores a valid comparison from an invalid state', () => {
    setBudget('-1')
    fireEvent.click(screen.getByRole('button', { name: /Reset to original scenario/ }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(mapLinks()).toHaveLength(15)
  })
})
