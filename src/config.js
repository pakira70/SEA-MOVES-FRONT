// src/config.js

export const API_BASE_URL = 'https://sea-moves-back.onrender.com'; // Your backend URL

// **** CHANGE THIS ****
// Define MODES as an object: { internal_key: "Display Name" }
// Ensure keys match BASELINE_MODE_SHARES and API keys
export const MODES = {
  "Drive": "Drive",
  "Light Rail": "Light Rail", // Make sure API uses "Light Rail"
  "Bus": "Bus",
  "Drop-off": "Drop-off",
  "Walk": "Walk",
  "Carpool": "Carpool",
  "Vanpool": "Vanpool",
  "Bike": "Bike"
  // If you add Telework or Other, add them here too
  // "Telework": "Telework",
  // "Other": "Other",
};

// Ensure keys here EXACTLY match the keys in the MODES object above
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

// Match backend defaults or provide sensible starting points
export const DEFAULT_POPULATION_STRING = "10000, 10200, 10400, 10600, 10800";
export const DEFAULT_PARKING_SUPPLY_STRING = "5000, 5100, 5100, 5200, 5200";
export const DEFAULT_PARKING_COST = 5000;

// Chart Colors (customize as needed)
// NOTE: The component using this (ModeShareChart?) will need to iterate
// over Object.keys(MODES) and use the index to get the color.
// Ensure the order Object.keys provides is consistent or consider
// changing this to an object mapping mode keys to colors for robustness.
export const MODE_CHART_COLORS = [
  // Drive (assuming it's first in Object.keys(MODES))
  '#d42f2f', // Red (from your comment)
  // Light Rail
  '#FFC107', // Amber
  // Bus
  '#2196F3', // Blue
  // Drop-off
  '#9C27B0', // Purple
  // Walk
  '#FF5722', // Deep Orange
  // Carpool
  '#795548', // Brown
  // Vanpool
  '#607D8B', // Blue Grey
  // Bike
  '#4CAF50', // Green
];