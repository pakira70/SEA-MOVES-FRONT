export const API_BASE_URL = 'http://localhost:5001'; // Your backend URL

export const MODES = [
  "Drive", "Light Rail", "Bus", "Drop-off",
  "Walk", "Carpool", "Vanpool", "Bike"
];

// Match the backend defaults
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
export const MODE_CHART_COLORS = [
  // ============================================
  // CHANGE COLOR AT INDEX 0:
  'rgba(255, 99, 132, 1)', // REPLACE with the actual red from ParkingChart's borderColor
  // ============================================
    '#FFC107', '#2196F3', '#9C27B0',
  '#FF5722', '#795548', '#607D8B','#4CAF50'
];