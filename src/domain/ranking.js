/**
 * ranking.js — Domain Layer
 *
 * Pure functions for hotel affordability classification and ranking.
 * Implemented in Stage 2.
 *
 * Responsibilities (Stage 2):
 *  - isAffordable(stayCost, budget) → stayCost <= budget (equality is affordable)
 *  - remainingBudget(stayCost, budget) → budget - stayCost (affordable hotels)
 *  - shortfall(stayCost, budget)       → stayCost - budget (over-budget hotels)
 *  - rankHotels(hotels, weightedTotals, budget) →
 *      Sort affordable hotels by:
 *        1. weightedTravelTotal ascending
 *        2. stayCost ascending
 *        3. hotel ID ascending ASCII order
 *      Assign consecutive ranks 1, 2, 3, …
 *      Over-budget hotels remain visible with no rank.
 *      If no hotel is affordable, return NO_AFFORDABLE_HOTEL sentinel.
 *
 * Ranking uses exact integer weightedTravelTotal, never displayed averages.
 *
 * This module must never import React, SVG utilities, or
 * tests/fixtures/expectedResults.json.
 */

// Stage 2: implement and export the functions listed above.
