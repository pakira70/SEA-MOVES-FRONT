import { AVAILABLE_MODES, calculateScenario } from '../src/localCalculation.js';

const details = Object.fromEntries(AVAILABLE_MODES.map((mode) => [mode.key, mode]));
const shares = Object.fromEntries(AVAILABLE_MODES.map((mode) => [mode.key, mode.defaultBaselineShare]));
const appConfig = {
  numYears: 5,
  showRate: 100,
  defaultParkingCost: 5000,
  quickStartPopulation: 10000,
  quickAnnualGrowthRate: 0,
  quickStartParkingSupply: 5000,
  includeShuttleCosts: false,
};
const inputState = {
  modeShares: shares,
  populationValues: Array(5).fill(10000),
  parkingSupplyValues: Array(5).fill(5000),
  parkingCost: 5000,
};

const { baselineResults, scenarioResults } = calculateScenario({
  inputState,
  appConfig,
  baselineModeShares: shares,
  activeModeDetails: details,
});

function assertClose(actual, expected, label) {
  if (Math.abs(actual - expected) > 1e-8) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

assertClose(baselineResults.total_daily_trips_per_year[0], 10000, 'daily trips');
assertClose(baselineResults.trips_per_mode_per_year.DRIVE[0], 7100, 'drive trips');
assertClose(baselineResults.parking.demand_per_year[0], 7170, 'parking demand');
assertClose(baselineResults.parking.shortfall_per_year[0], 2170, 'first-year parking shortfall');
assertClose(baselineResults.parking.shortfall_per_year[1], 0, 'second-year cumulative shortfall');
assertClose(baselineResults.parking.cost_per_year[0], 10850000, 'parking cost');
assertClose(scenarioResults.parking.demand_per_year[4], baselineResults.parking.demand_per_year[4], 'scenario parity');
if (baselineResults.shuttle.annual_cost_per_year.length !== 0) {
  throw new Error('Disabled shuttle should return no annual costs.');
}

const shuttleScenario = calculateScenario({
  inputState: {
    ...inputState,
    modeShares: { ...shares, DRIVE: 50, TRANSIT: 40 },
  },
  appConfig: {
    ...appConfig,
    includeShuttleCosts: true,
    shuttleBaselineCost: 12000000,
    shuttleParkingPercentage: 50,
    shuttleCostPerHour: 100,
    shuttlePeakHours: 3,
    shuttleVehicleCapacity: 30,
    shuttleMinContractHours: 4,
    shuttleOperatingDays: 280,
  },
  baselineModeShares: shares,
  activeModeDetails: details,
});
assertClose(shuttleScenario.baselineResults.shuttle.total_shuttles_per_year[0], 40, 'baseline shuttles');
assertClose(shuttleScenario.scenarioResults.shuttle.total_shuttles_per_year[0], 28, 'scenario shuttles');
assertClose(shuttleScenario.scenarioResults.shuttle.annual_cost_per_year[0], 10656000, 'scenario shuttle cost');
console.log('Static SEA MOVES model matches the backend baseline fixtures.');
