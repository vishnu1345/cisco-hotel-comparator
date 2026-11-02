// Dashboard.jsx — Presentation Layer
// Owns the useComparator hook and arranges the comparison workspace.
// Components below receive plain props; none of them calculate results.
import useComparator from '../hooks/useComparator.js'
import { NO_AFFORDABLE_HOTEL } from '../domain/ranking.js'
import BudgetControl from './BudgetControl.jsx'
import ContributionBreakdown from './ContributionBreakdown.jsx'
import HotelDetails from './HotelDetails.jsx'
import HotelRanking from './HotelRanking.jsx'
import SchematicMap, { TravelTimeTable } from './SchematicMap.jsx'
import { formatCurrency, formatNumber, hotelCode, placeCode } from './format.js'

export default function Dashboard() {
  const comparator = useComparator()
  const { isLoaded, city, comparison, selectedHotel, selectedHotelId, isValid, errors } = comparator

  if (!isLoaded) {
    return (
      <div className="app">
        <AppHeader />
        <main className="empty-state">
          <h2>Find the best base camp for your trip</h2>
          <p>
            Compare 10 hotels against 15 wishlist places using weighted round-trip travel time, then see which
            affordable hotel is the most accessible.
          </p>
          <button type="button" className="button button-primary" onClick={comparator.loadCity}>
            Load Aura City
          </button>
        </main>
      </div>
    )
  }

  const hotelCodes = Object.fromEntries(city.hotels.map((hotel, i) => [hotel.id, hotelCode(i)]))
  const placeCodes = Object.fromEntries(city.wishlist_places.map((place, i) => [place.id, placeCode(i)]))
  const recommended = comparison.hotels.find((hotel) => hotel.hotelId === comparison.recommendedHotelId) ?? null
  const inspectedHotel = city.hotels.find((hotel) => hotel.id === selectedHotelId)

  return (
    <div className="app">
      <AppHeader city={city} onReset={comparator.reset} />

      <main className="workspace">
        <section className="summary-grid" aria-label="Comparison summary">
          <BudgetControl
            budgetInput={comparator.budgetInput}
            budgetError={comparator.budgetError}
            originalBudget={city.initial_budget}
            onBudgetChange={comparator.setBudget}
          />

          <div className="card stat-card">
            <h2 className="card-title">Scenario</h2>
            <dl className="stat-list">
              <div>
                <dt>Affordable hotels</dt>
                <dd>{isValid ? `${comparison.rankedHotelIds.length} of ${comparison.hotels.length}` : '—'}</dd>
              </div>
              <div>
                <dt>Wishlist places</dt>
                <dd>{city.wishlist_places.length}</dd>
              </div>
              <div>
                <dt>Total importance</dt>
                <dd>{isValid ? comparison.importanceTotal : '—'}</dd>
              </div>
            </dl>
          </div>

          <RecommendationCard comparison={comparison} recommended={recommended} isValid={isValid} />
        </section>

        {!isValid && <ErrorBanner errors={errors} />}

        <div className="grid grid-ranking">
          <HotelRanking
            comparison={comparison}
            isValid={isValid}
            selectedHotelId={selectedHotelId}
            hotelCodes={hotelCodes}
            onSelectHotel={comparator.selectHotel}
          />
          <SchematicMap
            city={city}
            selectedHotel={selectedHotel}
            recommendedHotelId={comparison.recommendedHotelId}
            hotelCodes={hotelCodes}
            placeCodes={placeCodes}
          />
        </div>

        <div className="grid grid-details">
          <HotelDetails
            inspectedHotel={inspectedHotel}
            selectedHotel={selectedHotel}
            recommended={recommended}
            affordableCount={comparison.rankedHotelIds.length}
            hotelCode={hotelCodes[selectedHotelId]}
          />
          <ContributionBreakdown
            places={city.wishlist_places}
            placeCodes={placeCodes}
            importanceInputs={comparator.importanceInputs}
            importanceErrors={comparator.importanceErrors}
            onImportanceChange={comparator.setImportance}
            selectedHotel={selectedHotel}
            hotelName={inspectedHotel.name}
            importanceTotal={comparison.importanceTotal}
          />
        </div>

        <TravelTimeTable
          city={city}
          selectedHotelId={selectedHotel ? selectedHotelId : null}
          hotelCodes={hotelCodes}
          placeCodes={placeCodes}
          onSelectHotel={comparator.selectHotel}
        />
      </main>
    </div>
  )
}

function AppHeader({ city, onReset }) {
  return (
    <header className="app-header">
      <div>
        <h1>Hotel Base-Camp Comparator</h1>
        <p className="app-subtitle">
          {city ? `${city.name} City · prices in ${city.currency} (₹) · complete-stay costs` : 'Weighted accessibility vs. budget'}
        </p>
      </div>
      {onReset && (
        <button type="button" className="button" onClick={onReset}>
          ↺ Reset to original scenario
        </button>
      )}
    </header>
  )
}

function RecommendationCard({ comparison, recommended, isValid }) {
  if (!isValid) {
    return (
      <div className="card recommendation-card is-muted">
        <h2 className="card-title">Recommendation</h2>
        <p className="recommendation-empty">Hidden until the input is valid.</p>
      </div>
    )
  }

  if (comparison.status === NO_AFFORDABLE_HOTEL) {
    return (
      <div className="card recommendation-card is-warning" role="status">
        <h2 className="card-title">Recommendation</h2>
        <p className="recommendation-name">
          <code>{NO_AFFORDABLE_HOTEL}</code>
        </p>
        <p>Every hotel exceeds the budget, so no hotel is ranked or recommended. Raise the budget to compare.</p>
      </div>
    )
  }

  return (
    <div className="card recommendation-card" role="status" aria-label="Recommended hotel">
      <h2 className="card-title">★ Recommended hotel</h2>
      <p className="recommendation-name">{recommended.hotelName}</p>
      <p>
        Lowest weighted travel total among {comparison.rankedHotelIds.length} affordable hotel
        {comparison.rankedHotelIds.length === 1 ? '' : 's'}:{' '}
        <strong>{formatNumber(recommended.weightedTravelTotal)}</strong> importance-minutes (average{' '}
        <strong>{recommended.weightedAverageDisplay} min</strong> per round trip).
      </p>
      <p>
        Costs {formatCurrency(recommended.stayCost)} · {formatCurrency(recommended.remainingBudget)} left in budget
      </p>
    </div>
  )
}

function ErrorBanner({ errors }) {
  return (
    <div className="error-banner" role="alert">
      <strong>Comparison paused — fix the input to see results.</strong>
      <p>Rankings, the recommendation, contributions and map links are hidden so nothing out of date is shown.</p>
      <ul>
        {errors.map((error) => (
          <li key={error.path}>{error.message}</li>
        ))}
      </ul>
    </div>
  )
}
