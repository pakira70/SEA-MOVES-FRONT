export const AVAILABLE_MODES = [
  { key: 'DRIVE', defaultName: 'Drive', defaultColor: '#D32F2F', category: 'Personal Vehicles', flags: { affects_parking: true, affects_emissions: true, affects_cost: true }, parking_factor_per_person: 1, isDefaultActive: true, defaultBaselineShare: 71 },
  { key: 'DROPOFF', defaultName: 'Drop-off', defaultColor: '#455A64', category: 'Personal Transport', flags: { affects_parking: false, affects_emissions: true, affects_cost: true }, parking_factor_per_person: 0, isDefaultActive: true, defaultBaselineShare: 5 },
  { key: 'CARPOOL', defaultName: 'Carpool', defaultColor: '#FF6F00', category: 'Carpool & Vanpool', flags: { affects_parking: true, affects_emissions: true, affects_cost: true }, parking_factor_per_person: 0.5, isDefaultActive: true, defaultBaselineShare: 1 },
  { key: 'VANPOOL', defaultName: 'Vanpool', defaultColor: '#4E342E', category: 'Carpool & Vanpool', flags: { affects_parking: true, affects_emissions: true, affects_cost: true }, parking_factor_per_person: 0.2, isDefaultActive: true, defaultBaselineShare: 1 },
  { key: 'BIKE', defaultName: 'Bike', defaultColor: '#0288D1', category: 'Micromobility & Active', flags: { affects_parking: false, affects_emissions: false, affects_cost: false }, parking_factor_per_person: 0, isDefaultActive: true, defaultBaselineShare: 1 },
  { key: 'WALK', defaultName: 'Walk', defaultColor: '#388E3C', category: 'Micromobility & Active', flags: { affects_parking: false, affects_emissions: false, affects_cost: false }, parking_factor_per_person: 0, isDefaultActive: true, defaultBaselineShare: 2 },
  { key: 'TRANSIT', defaultName: 'Transit', defaultColor: '#F57C00', category: 'Transit', flags: { affects_parking: false, affects_emissions: true, affects_cost: true }, parking_factor_per_person: 0, isDefaultActive: true, defaultBaselineShare: 19 },
];

function calculateTrips(population, modeShares, showRate) {
  const effectivePopulation = population.map((value) => Number(value || 0) * Number(showRate || 0) / 100);
  const tripsPerMode = {};
  Object.keys(modeShares).forEach((modeKey) => {
    tripsPerMode[modeKey] = effectivePopulation.map((value) => (
      value * Number(modeShares[modeKey] || 0) / 100
    ));
  });
  return { tripsPerMode, totalTrips: effectivePopulation };
}

function calculateParking(params, modeDetails) {
  const showRate = Number(params.showRate || 0) / 100;
  let cumulativeSupply = Number(params.parkingSupply[0] || 0);
  const demand = [];
  const shortfall = [];
  const cost = [];
  params.population.forEach((rawPopulation) => {
    const effectivePopulation = Number(rawPopulation || 0) * showRate;
    const currentDemand = Object.keys(params.modeShares).reduce((total, modeKey) => {
      const mode = modeDetails[modeKey];
      if (!mode?.flags?.affects_parking) return total;
      return total + effectivePopulation
        * Number(params.modeShares[modeKey] || 0) / 100
        * Number(mode.parking_factor_per_person || 0);
    }, 0);
    const currentShortfall = Math.max(0, currentDemand - cumulativeSupply);
    demand.push(currentDemand);
    shortfall.push(currentShortfall);
    cost.push(currentShortfall * Number(params.costPerSpace || 0));
    cumulativeSupply += currentShortfall;
  });
  return {
    demand_per_year: demand,
    supply_per_year: [...params.parkingSupply],
    shortfall_per_year: shortfall,
    cost_per_year: cost,
    cost_per_space: Number(params.costPerSpace || 0),
  };
}

function calculateResult(params, modeDetails) {
  const { tripsPerMode, totalTrips } = calculateTrips(params.population, params.modeShares, params.showRate);
  return {
    trips_per_mode_per_year: tripsPerMode,
    total_daily_trips_per_year: totalTrips,
    processed_mode_shares: { ...params.modeShares },
    parking: calculateParking(params, modeDetails),
  };
}

function calculateShuttle(baselineDriveTrips, scenarioDriveTrips, config) {
  if (!config.includeShuttleCosts) {
    return {
      baseline_annual_cost_per_year: [], scenario_annual_cost_per_year: [],
      baseline_shuttles_per_year: [], scenario_shuttles_per_year: [],
    };
  }
  const peakHours = Number(config.shuttlePeakHours || 0);
  const vehicleCapacity = Number(config.shuttleVehicleCapacity || 0);
  if (!(peakHours > 0) || !(vehicleCapacity > 0)) {
    throw new Error('Shuttle peak hours and vehicle capacity must be positive numbers.');
  }
  const baselineCost = Number(config.shuttleBaselineCost || 0);
  const parkingFraction = Number(config.shuttleParkingPercentage || 0) / 100;
  const shuttles = (trips) => trips.map((value) => (
    Math.ceil(Number(value || 0) * parkingFraction / peakHours / vehicleCapacity)
  ));
  const baselineShuttles = shuttles(baselineDriveTrips);
  const scenarioShuttles = shuttles(scenarioDriveTrips);
  const blockCost = Number(config.shuttleCostPerHour || 0)
    * Number(config.shuttleMinContractHours || 0)
    * Number(config.shuttleOperatingDays || 0);
  return {
    baseline_annual_cost_per_year: baselineShuttles.map(() => baselineCost),
    scenario_annual_cost_per_year: scenarioShuttles.map((value, index) => (
      baselineCost + (value - (baselineShuttles[index] || 0)) * blockCost
    )),
    baseline_shuttles_per_year: baselineShuttles,
    scenario_shuttles_per_year: scenarioShuttles,
  };
}

export function calculateScenario({ inputState, appConfig, baselineModeShares, activeModeDetails }) {
  const horizon = appConfig.numYears;
  const baselinePopulation = Array(horizon).fill(Number(appConfig.quickStartPopulation || 0));
  for (let index = 1; index < horizon; index += 1) {
    baselinePopulation[index] = baselinePopulation[index - 1]
      * (1 + Number(appConfig.quickAnnualGrowthRate || 0) / 100);
  }
  const baseline = calculateResult({
    modeShares: baselineModeShares,
    population: baselinePopulation,
    parkingSupply: Array(horizon).fill(Number(appConfig.quickStartParkingSupply || 0)),
    costPerSpace: appConfig.defaultParkingCost,
    showRate: appConfig.showRate,
  }, activeModeDetails);
  const scenario = calculateResult({
    modeShares: inputState.modeShares,
    population: inputState.populationValues,
    parkingSupply: inputState.parkingSupplyValues,
    costPerSpace: inputState.parkingCost,
    showRate: appConfig.showRate,
  }, activeModeDetails);
  const shuttle = calculateShuttle(
    baseline.trips_per_mode_per_year.DRIVE || [],
    scenario.trips_per_mode_per_year.DRIVE || [],
    appConfig,
  );
  baseline.shuttle = {
    annual_cost_per_year: shuttle.baseline_annual_cost_per_year,
    total_shuttles_per_year: shuttle.baseline_shuttles_per_year,
  };
  scenario.shuttle = {
    annual_cost_per_year: shuttle.scenario_annual_cost_per_year,
    total_shuttles_per_year: shuttle.scenario_shuttles_per_year,
  };
  return { baselineResults: baseline, scenarioResults: scenario };
}
