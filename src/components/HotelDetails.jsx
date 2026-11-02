// HotelDetails.jsx — Presentation Layer
// Summary of the inspected hotel. Inspecting a hotel never changes the
// recommendation, so the two are shown separately.
import { formatCurrency, formatNumber } from './format.js'

export default function HotelDetails({ inspectedHotel, selectedHotel, recommended, affordableCount, hotelCode }) {
  return (
    <section className="card details-card" aria-label="Inspected hotel details">
      <p className="eyebrow">◉ Inspecting {hotelCode}</p>
      <h2>{inspectedHotel.name}</h2>

      {!selectedHotel ? (
        <p className="placeholder">Details hidden until the input is valid.</p>
      ) : (
        <>
          <p className={`details-status ${selectedHotel.affordable ? 'status-ok' : 'status-over'}`}>
            {statusText(selectedHotel, recommended, affordableCount)}
          </p>

          <dl className="details-list">
            <div>
              <dt>Complete-stay cost</dt>
              <dd>{formatCurrency(selectedHotel.stayCost)}</dd>
            </div>
            <div>
              <dt>{selectedHotel.affordable ? 'Remaining budget' : 'Budget shortfall'}</dt>
              <dd>
                {selectedHotel.affordable
                  ? formatCurrency(selectedHotel.remainingBudget)
                  : `Over budget by ${formatCurrency(selectedHotel.shortfall)}`}
              </dd>
            </div>
            <div>
              <dt>Weighted travel total</dt>
              <dd>{formatNumber(selectedHotel.weightedTravelTotal)} importance-min</dd>
            </div>
            <div>
              <dt>Weighted average</dt>
              <dd>{selectedHotel.weightedAverageDisplay} min per round trip</dd>
            </div>
            <div>
              <dt>Rank</dt>
              <dd>{selectedHotel.rank ? `${selectedHotel.rank} of ${affordableCount}` : 'Not ranked (over budget)'}</dd>
            </div>
          </dl>

          {recommended && recommended.hotelId !== selectedHotel.hotelId && (
            <p className="card-note">
              Inspecting this hotel does not change the recommendation: <strong>{recommended.hotelName}</strong>.
            </p>
          )}
        </>
      )}
    </section>
  )
}

function statusText(hotel, recommended, affordableCount) {
  if (!hotel.affordable) return `✕ Over budget by ${formatCurrency(hotel.shortfall)} — not ranked, never recommended`
  if (recommended?.hotelId === hotel.hotelId) return `★ Recommended — rank 1 of ${affordableCount} affordable hotels`
  return `✓ Affordable — rank ${hotel.rank} of ${affordableCount}`
}
