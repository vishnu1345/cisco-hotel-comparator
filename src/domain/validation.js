/**
 * validation.js — Domain Layer
 *
 * Validates the complete city scenario and editable user inputs before the
 * calculation pipeline runs. Implemented in Stage 2.
 *
 * Responsibilities (Stage 2):
 *  - Hotel and wishlist-place counts (2–10 hotels, 3–15 places).
 *  - Globally unique IDs matching ^[A-Z][A-Z0-9_-]{0,15}$.
 *  - Non-empty trimmed names.
 *  - Supported place types: "attraction" or "food".
 *  - Importance integer 1–5.
 *  - Budget integer 0–1,000,000.
 *  - Hotel stay cost integer 1–1,000,000.
 *  - Complete hotel-to-place round_trip_minutes mappings (integer 1–600).
 *  - Map coordinate bounds within the normalized 100×100 coordinate system.
 *
 * This module must never import React, SVG utilities, or
 * tests/fixtures/expectedResults.json.
 */

// Stage 2: implement and export validateScenario(cityData, budget, importanceMap)
