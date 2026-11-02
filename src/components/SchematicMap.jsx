// SchematicMap.jsx — Presentation Layer
// Custom SVG schematic: 10 hotel markers, 15 place markers, and the 15
// comparison links for the inspected hotel only. Coordinates position
// markers and nothing else — every time and contribution shown comes from
// the dataset or the domain results, never from line length.
//
// TravelTimeTable is the map's accessible text equivalent: the full supplied
// hotel-by-place round-trip matrix, kept in sync with the inspected hotel.
import { formatNumber, PLACE_TYPE_LABELS } from './format.js'

// Normalized 0–100 dataset coordinates → SVG units, leaving room for labels.
const VIEW_SIZE = 1000
const MARGIN = 60
const SCALE = (VIEW_SIZE - 2 * MARGIN) / 100
const toSvg = (value) => MARGIN + value * SCALE

export default function SchematicMap({ city, selectedHotel, recommendedHotelId, hotelCodes, placeCodes }) {
  const inspected = selectedHotel ? city.hotels.find((hotel) => hotel.id === selectedHotel.hotelId) : null

  return (
    <section className="card map-card" aria-labelledby="map-heading">
      <div className="card-header">
        <h2 id="map-heading">Schematic city map</h2>
        <p className="card-note" id="map-note">
          Not to scale. Lines are hotel-to-place comparisons, not roads or routes; their length has no relation to
          travel time.
        </p>
      </div>

      <svg
        className="map"
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        role="group"
        aria-labelledby="map-heading"
        aria-describedby="map-note"
      >
        <rect className="map-background" x="0" y="0" width={VIEW_SIZE} height={VIEW_SIZE} rx="16" />

        {inspected && (
          <g aria-label={`Comparison links for ${inspected.name}`}>
            {selectedHotel.contributions.map((detail) => {
              const place = city.wishlist_places.find((p) => p.id === detail.placeId)
              const label = `Comparison link ${inspected.name} to ${detail.placeName}: ${detail.roundTripMinutes} min round trip, contribution ${formatNumber(detail.contribution)}`
              return (
                <line
                  key={detail.placeId}
                  className="map-link"
                  x1={toSvg(inspected.map_position.x)}
                  y1={toSvg(inspected.map_position.y)}
                  x2={toSvg(place.map_position.x)}
                  y2={toSvg(place.map_position.y)}
                  role="img"
                  aria-label={label}
                >
                  <title>{label}</title>
                </line>
              )
            })}
          </g>
        )}

        {city.wishlist_places.map((place) => (
          <PlaceMarker key={place.id} place={place} code={placeCodes[place.id]} />
        ))}

        {city.hotels.map((hotel) => (
          <HotelMarker
            key={hotel.id}
            hotel={hotel}
            code={hotelCodes[hotel.id]}
            isInspected={hotel.id === inspected?.id}
            isRecommended={hotel.id === recommendedHotelId}
          />
        ))}
      </svg>

      <MapLegend city={city} hotelCodes={hotelCodes} placeCodes={placeCodes} />
    </section>
  )
}

function HotelMarker({ hotel, code, isInspected, isRecommended }) {
  const x = toSvg(hotel.map_position.x)
  const y = toSvg(hotel.map_position.y)
  const size = isInspected ? 30 : 24
  const status = [isInspected && 'inspected', isRecommended && 'recommended'].filter(Boolean).join(', ')
  const label = `Hotel ${code}: ${hotel.name}${status ? ` (${status})` : ''}`

  return (
    <g className={`marker marker-hotel${isInspected ? ' is-inspected' : ''}`} role="img" aria-label={label}>
      <title>{label}</title>
      <rect x={x - size / 2} y={y - size / 2} width={size} height={size} rx="4" />
      <text x={x + size / 2 + 6} y={y + 8} className="marker-label">
        {code}
        {isRecommended ? ' ★' : ''}
      </text>
    </g>
  )
}

function PlaceMarker({ place, code }) {
  const x = toSvg(place.map_position.x)
  const y = toSvg(place.map_position.y)
  const label = `${PLACE_TYPE_LABELS[place.type]} ${code}: ${place.name}`

  return (
    <g className={`marker marker-${place.type}`} role="img" aria-label={label}>
      <title>{label}</title>
      {place.type === 'food' ? (
        <rect x={x - 11} y={y - 11} width="22" height="22" transform={`rotate(45 ${x} ${y})`} />
      ) : (
        <circle cx={x} cy={y} r="12" />
      )}
      <text x={x - 18} y={y + 8} className="marker-label" textAnchor="end">
        {code}
      </text>
    </g>
  )
}

function MapLegend({ city, hotelCodes, placeCodes }) {
  return (
    <div className="map-legend">
      <ul className="legend-key" aria-label="Marker shapes">
        <li>
          <span className="key key-hotel" aria-hidden="true" /> Hotel (square, H#)
        </li>
        <li>
          <span className="key key-attraction" aria-hidden="true" /> Attraction (circle, P#)
        </li>
        <li>
          <span className="key key-food" aria-hidden="true" /> Food stop (diamond, P#)
        </li>
        <li>
          <span className="key key-link" aria-hidden="true" /> Comparison link (inspected hotel only)
        </li>
        <li>★ Recommended hotel</li>
      </ul>
      <details>
        <summary>Marker codes</summary>
        <div className="legend-codes">
          <ul aria-label="Hotel codes">
            {city.hotels.map((hotel) => (
              <li key={hotel.id}>
                <strong>{hotelCodes[hotel.id]}</strong> {hotel.name}
              </li>
            ))}
          </ul>
          <ul aria-label="Place codes">
            {city.wishlist_places.map((place) => (
              <li key={place.id}>
                <strong>{placeCodes[place.id]}</strong> {place.name}
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  )
}

export function TravelTimeTable({ city, selectedHotelId, hotelCodes, placeCodes, onSelectHotel }) {
  return (
    <section className="card" aria-labelledby="matrix-heading">
      <div className="card-header">
        <h2 id="matrix-heading">Round-trip travel times (minutes)</h2>
        <p className="card-note">
          The supplied hotel-by-place matrix — the text equivalent of the map. The inspected hotel&apos;s row matches its
          highlighted links.
        </p>
      </div>
      <div className="table-scroll">
        <table className="data-table matrix-table">
          <thead>
            <tr>
              <th scope="col">Hotel</th>
              {city.wishlist_places.map((place) => (
                <th scope="col" key={place.id} className="num">
                  <abbr title={place.name}>{placeCodes[place.id]}</abbr>
                  <span className="sr-only"> {place.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {city.hotels.map((hotel) => {
              const isSelected = hotel.id === selectedHotelId
              return (
                <tr key={hotel.id} className={isSelected ? 'is-selected' : undefined}>
                  <th scope="row">
                    <button
                      type="button"
                      className="hotel-button"
                      aria-pressed={isSelected}
                      onClick={() => onSelectHotel(hotel.id)}
                    >
                      <span className="code-chip">{hotelCodes[hotel.id]}</span> {hotel.name}
                    </button>
                  </th>
                  {city.wishlist_places.map((place) => (
                    <td key={place.id} className="num">
                      {hotel.round_trip_minutes[place.id]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
