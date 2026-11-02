// HotelRanking.jsx — Presentation Layer
// All hotels: affordable ones in rank order, then over-budget ones (unranked,
// in dataset order). Status is shown with text and symbols, not colour alone.
import { NO_AFFORDABLE_HOTEL } from '../domain/ranking.js'
import { formatCurrency, formatNumber } from './format.js'

export default function HotelRanking({ comparison, isValid, selectedHotelId, hotelCodes, onSelectHotel }) {
  if (!isValid) {
    return (
      <section className="card" aria-labelledby="ranking-heading">
        <h2 id="ranking-heading">Hotel ranking</h2>
        <p className="placeholder">Ranking hidden until the input is valid.</p>
      </section>
    )
  }

  const byId = Object.fromEntries(comparison.hotels.map((hotel) => [hotel.hotelId, hotel]))
  const ranked = comparison.rankedHotelIds.map((id) => byId[id])
  const overBudget = comparison.hotels.filter((hotel) => !hotel.affordable)

  const row = (hotel) => {
    const isRecommended = hotel.hotelId === comparison.recommendedHotelId
    const isSelected = hotel.hotelId === selectedHotelId
    const classes = ['ranking-row', isRecommended && 'is-recommended', !hotel.affordable && 'is-over-budget', isSelected && 'is-selected']

    return (
      <tr key={hotel.hotelId} className={classes.filter(Boolean).join(' ')}>
        <td className="rank-cell">
          {hotel.rank ?? <span aria-label="Not ranked">—</span>}
        </td>
        <th scope="row">
          <button
            type="button"
            className="hotel-button"
            aria-pressed={isSelected}
            onClick={() => onSelectHotel(hotel.hotelId)}
          >
            <span className="code-chip">{hotelCodes[hotel.hotelId]}</span> {hotel.hotelName}
          </button>
          <span className="tags">
            {isRecommended && <span className="tag tag-recommended">★ Recommended</span>}
            {isSelected && <span className="tag tag-inspecting">◉ Inspecting</span>}
          </span>
        </th>
        <td className="num">{formatCurrency(hotel.stayCost)}</td>
        <td className="num">{formatNumber(hotel.weightedTravelTotal)}</td>
        <td className="num">{hotel.weightedAverageDisplay}</td>
        <td>
          {hotel.affordable ? (
            <span className="status status-ok">
              ✓ Affordable <span className="status-detail">{formatCurrency(hotel.remainingBudget)} left</span>
            </span>
          ) : (
            <span className="status status-over">✕ Over budget by {formatCurrency(hotel.shortfall)}</span>
          )}
        </td>
      </tr>
    )
  }

  return (
    <section className="card" aria-labelledby="ranking-heading">
      <div className="card-header">
        <h2 id="ranking-heading">Hotel ranking</h2>
        <p className="card-note">
          Ranked by weighted travel total, then stay cost, then hotel ID. Select a hotel to inspect it.
        </p>
      </div>

      {comparison.status === NO_AFFORDABLE_HOTEL && (
        <p className="notice notice-warning">
          <code>{NO_AFFORDABLE_HOTEL}</code> — no hotel fits the budget, so none is ranked.
        </p>
      )}

      <div className="table-scroll">
        <table className="data-table ranking-table">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Hotel</th>
              <th scope="col" className="num">Stay cost</th>
              <th scope="col" className="num">
                Weighted total
              </th>
              <th scope="col" className="num">
                Avg (min)
              </th>
              <th scope="col">Budget status</th>
            </tr>
          </thead>
          {ranked.length > 0 && (
            <tbody>
              <tr className="group-row">
                <th scope="colgroup" colSpan={6}>
                  Affordable — ranked ({ranked.length})
                </th>
              </tr>
              {ranked.map(row)}
            </tbody>
          )}
          {overBudget.length > 0 && (
            <tbody>
              <tr className="group-row">
                <th scope="colgroup" colSpan={6}>
                  Over budget — not ranked ({overBudget.length})
                </th>
              </tr>
              {overBudget.map(row)}
            </tbody>
          )}
        </table>
      </div>
    </section>
  )
}
