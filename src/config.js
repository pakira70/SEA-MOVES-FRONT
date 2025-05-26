// src/config.js - UPDATED for Dynamic Modes

// --- Core API Configuration ---
// Set this to your backend server address
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001/api';
// --- Default Baseline Configuration Values ---
// These are used by App.jsx if nothing is found in localStorage
// They DO NOT define the modes themselves anymore.
export const DEFAULT_PARKING_COST = 5000;
// Add other non-mode-specific defaults if needed by App.jsx initialization logic
// export const INITIAL_START_YEAR = 2024; // Example if needed
// export const INITIAL_NUM_YEARS = 5;    // Example if needed


// ========================================================================
// === OBSOLETE Definitions below - Kept for reference, but REMOVE THEM ===
// ========================================================================

/*
// **** REMOVE THIS ****
// MODES are now fetched dynamically from the `/api/modes/available` endpoint.
// Keeping this hardcoded list will cause conflicts and inconsistencies.
export const MODES = {
  "Drive": "Drive",
  "Light Rail": "Light Rail",
  "Bus": "Bus",
  "Drop-off": "Drop-off", // Drop-off is not in the new AVAILABLE_MODES
  "Walk": "Walk",
  "Carpool": "Carpool",
  "Vanpool": "Vanpool", // Vanpool is not in the new AVAILABLE_MODES
  "Bike": "Bike"
};
*/

/*
// **** REMOVE THIS ****
// Baseline mode shares are now initialized in App.jsx based on the
// `isDefaultActive` flag from the fetched available modes.
export const BASELINE_MODE_SHARES = {
  "Drive": 71.0,
  "Light Rail": 10.0,
  "Bus": 9.0,
  "Drop-off": 5.0,
  "Walk": 2.0,
  "Carpool": 1.0,
  "Vanpool": 1.0,
  "Bike": 1.0
};
*/

/*
// **** REMOVE THIS ****
// Population and Parking Supply are now handled dynamically within App.jsx
// based on the `numYears` setting in the baseline configuration.
// Keeping these strings here can lead to mismatches.
export const DEFAULT_POPULATION_STRING = "10000, 10200, 10400, 10600, 10800";
export const DEFAULT_PARKING_SUPPLY_STRING = "5000, 5100, 5100, 5200, 5200";
*/

/*
// **** REMOVE OR REFACTOR THIS ****
// Chart colors should now be driven by the `color` property received
// for each active mode from the API response (`mode_details_for_display`)
// or the `activeModeDetails` state derived in App.jsx.
// Relying on a fixed-order array based on Object.keys is unreliable.
export const MODE_CHART_COLORS = [
  '#d42f2f', // Red
  '#FFC107', // Amber
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#FF5722', // Deep Orange
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#4CAF50', // Green
];
*/

// ========================================================================
// === End of OBSOLETE Definitions ===
// ========================================================================