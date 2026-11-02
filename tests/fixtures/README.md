# tests/fixtures/

This directory holds **test fixture data only**.

| File | Stage | Purpose |
|---|---|---|
| `expectedResults.json` | Stage 2 | Independently calculated expected results for the main Aura scenario. Used exclusively by automated tests; never imported into application source code. |

> **Important:** Do not import any file from this directory into `src/`. See architecture.md §10.4 and §8.2.
