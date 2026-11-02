// ContributionBreakdown.jsx — Presentation Layer
// Per-place contributions for the inspected hotel, plus the importance
// editors. The editors stay visible when the input is invalid so the user
// can correct it; the calculated columns are blanked instead.
import { formatNumber, PLACE_TYPE_LABELS } from './format.js'

export default function ContributionBreakdown({
  places,
  placeCodes,
  importanceInputs,
  importanceErrors,
  onImportanceChange,
  selectedHotel,
  hotelName,
  importanceTotal,
}) {
  const detailsByPlaceId = Object.fromEntries((selectedHotel?.contributions ?? []).map((d) => [d.placeId, d]))
  const largest = Math.max(1, ...Object.values(detailsByPlaceId).map((d) => d.contribution))

  return (
    <section className="card" aria-labelledby="breakdown-heading">
      <div className="card-header">
        <h2 id="breakdown-heading">Contribution breakdown — {hotelName}</h2>
        <p className="card-note">
          Contribution = importance × round-trip minutes. Importance applies to every hotel; edit it here (1–5).
        </p>
      </div>

      <div className="table-scroll">
        <table className="data-table breakdown-table">
          <thead>
            <tr>
              <th scope="col">Place</th>
              <th scope="col">Type</th>
              <th scope="col">Importance</th>
              <th scope="col" className="num">
                Round trip (min)
              </th>
              <th scope="col" className="num">
                Contribution
              </th>
              <th scope="col">
                <span className="sr-only">Share of largest contribution</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {places.map((place) => {
              const detail = detailsByPlaceId[place.id]
              const error = importanceErrors[place.id]
              const inputId = `importance-${place.id}`
              return (
                <tr key={place.id} className={error ? 'is-invalid' : undefined}>
                  <th scope="row">
                    <span className="code-chip code-chip-place">{placeCodes[place.id]}</span> {place.name}
                  </th>
                  <td>
                    <span className={`type-label type-${place.type}`}>{PLACE_TYPE_LABELS[place.type]}</span>
                  </td>
                  <td>
                    <label htmlFor={inputId} className="sr-only">
                      Importance of {place.name}
                    </label>
                    <input
                      id={inputId}
                      className="importance-input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={String(importanceInputs[place.id])}
                      onChange={(event) => onImportanceChange(place.id, event.target.value)}
                      aria-invalid={error ? 'true' : 'false'}
                      aria-describedby={error ? `${inputId}-error` : undefined}
                    />
                    {error && (
                      <p id={`${inputId}-error`} className="field-error">
                        {error}
                      </p>
                    )}
                  </td>
                  <td className="num">{detail ? detail.roundTripMinutes : '—'}</td>
                  <td className="num">
                    {detail ? (
                      <>
                        <span className="formula">
                          {detail.importance} × {detail.roundTripMinutes} ={' '}
                        </span>
                        <strong>{formatNumber(detail.contribution)}</strong>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="bar-cell" aria-hidden="true">
                    {detail && <span className="bar" style={{ width: `${(detail.contribution / largest) * 100}%` }} />}
                  </td>
                </tr>
              )
            })}
          </tbody>
          {selectedHotel && (
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                <td />
                <td>{importanceTotal}</td>
                <td />
                <td className="num">
                  <strong>{formatNumber(selectedHotel.weightedTravelTotal)}</strong>
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {selectedHotel && (
        <p className="formula-summary">
          Weighted average = {formatNumber(selectedHotel.weightedTravelTotal)} ÷ {importanceTotal} ={' '}
          <strong>{selectedHotel.weightedAverageDisplay} min</strong> (rounded half-up to one decimal)
        </p>
      )}
    </section>
  )
}
