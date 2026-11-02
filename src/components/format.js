// format.js — Presentation Layer
// Display helpers shared by the components. Formatting only: no business rules.

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const plain = new Intl.NumberFormat('en-IN')

/** 41000 → "₹41,000" */
export function formatCurrency(amount) {
  return rupees.format(amount)
}

/** 2492 → "2,492" */
export function formatNumber(value) {
  return plain.format(value)
}

/** Short map/table code for a hotel by its position in the dataset: H1 … H10. */
export function hotelCode(index) {
  return `H${index + 1}`
}

/** Short map/table code for a wishlist place by its position in the dataset: P1 … P15. */
export function placeCode(index) {
  return `P${index + 1}`
}

export const PLACE_TYPE_LABELS = { attraction: 'Attraction', food: 'Food stop' }
