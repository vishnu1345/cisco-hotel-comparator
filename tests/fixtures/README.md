# tests/fixtures/

This directory holds **test-only** data.

| File | Purpose |
|---|---|
| `expectedResults.json` | Independently calculated expected results for the main Aura scenario: initial results, budget what-if (₹41,000 and ₹40,999), importance what-if (`PLACE_GILDED_01` 3 → 2) and a no-affordable budget (₹17,999). The single authoritative fixture. |
| `verify_expected_results.py` | The independent calculation path. Recomputes every value from `data/dataset.json` in Python using exact fractions, separately from the JavaScript in `src/domain/`. |

Check the fixture against the dataset:

```bash
python3 tests/fixtures/verify_expected_results.py
```

Regenerate it (only if the scenario definition changes):

```bash
python3 tests/fixtures/verify_expected_results.py --write
```

> **Important:** Nothing in `src/` may import from this directory. Expected results verify the calculation engine; they are never calculation inputs (architecture.md §8.2, §10.4). `tests/boundaries.test.js` enforces this.
