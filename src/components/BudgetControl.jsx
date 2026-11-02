// BudgetControl.jsx — Presentation Layer
// Editable complete-stay budget. Keeps the typed text as-is so invalid
// entries can be seen and corrected; validation happens in the domain layer.
import { formatCurrency } from './format.js'

export default function BudgetControl({ budgetInput, budgetError, originalBudget, onBudgetChange }) {
  const describedBy = budgetError ? 'budget-help budget-error' : 'budget-help'

  return (
    <div className="card budget-card">
      <label htmlFor="budget-input" className="card-title">
        Complete-stay budget
      </label>
      <div className={`currency-input${budgetError ? ' is-invalid' : ''}`}>
        <span aria-hidden="true">₹</span>
        <input
          id="budget-input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={String(budgetInput)}
          onChange={(event) => onBudgetChange(event.target.value)}
          aria-invalid={budgetError ? 'true' : 'false'}
          aria-describedby={describedBy}
        />
      </div>
      <p id="budget-help" className="field-help">
        Whole rupees from 0 to 10,00,000. Original budget {formatCurrency(originalBudget)}.
      </p>
      {budgetError && (
        <p id="budget-error" className="field-error">
          {budgetError}
        </p>
      )}
    </div>
  )
}
