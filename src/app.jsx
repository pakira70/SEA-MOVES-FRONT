// src/App.jsx - REFACTORED FOR NEW API PAYLOAD
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  Container, Typography, Box, AppBar, Toolbar, Button,
  CssBaseline, ThemeProvider, createTheme, CircularProgress, Alert, Link
} from '@mui/material';

import ScenarioPage from './pages/ScenarioPage.jsx';
import ModelSetupPage from './pages/ModelSetupPage.jsx';
import { API_BASE_URL, DEFAULT_PARKING_COST } from './config';

const theme = createTheme({
  palette: {
    primary: { main: '#1976D2' },
    secondary: { main: '#ffc107' },
    background: { 
      default: '#f5f5f5',
      paper: '#ffffff'
    }
  },
  typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
});

const FALLBACK_START_YEAR = 2024;
const FALLBACK_NUM_YEARS = 5;
const FALLBACK_POPULATION = 10000;
const FALLBACK_PARKING_SUPPLY = 5000;

function App() {
  const [modesLoading, setModesLoading] = useState(true);
  const [modesError, setModesError] = useState(null);
  const [availableModes, setAvailableModes] = useState([]);

  const [appConfig, setAppConfig] = useState({
    startYear: FALLBACK_START_YEAR,
    numYears: FALLBACK_NUM_YEARS,
    showRate: 100,
    defaultParkingCost: DEFAULT_PARKING_COST,
    quickStartPopulation: FALLBACK_POPULATION,
    quickAnnualGrowthRate: 0,
    quickStartParkingSupply: FALLBACK_PARKING_SUPPLY,
    includeShuttleCosts: false,
    shuttleBaselineCost: 12000000,
    shuttleParkingPercentage: 50,
    shuttleCostPerHour: 100,
    shuttlePeakHours: 3,
    shuttleVehicleCapacity: 30,
    shuttleMinContractHours: 4,
    shuttleOperatingDays: 280,
  });

  const [intermediateNumberInputs, setIntermediateNumberInputs] = useState({
    ...Object.fromEntries(Object.entries(appConfig).map(([key, value]) => [key, String(value)]))
  });

  const [activeModeSelection, setActiveModeSelection] = useState({});
  const [modeCustomizations, setModeCustomizations] = useState({});
  const [baselineModeShares, setBaselineModeShares] = useState({});

  const [inputState, setInputState] = useState({
    modeShares: {},
    populationValues: Array(appConfig.numYears).fill(appConfig.quickStartPopulation),
    parkingSupplyValues: Array(appConfig.numYears).fill(appConfig.quickStartParkingSupply),
    parkingCost: appConfig.defaultParkingCost,
  });

  const [baselineApiResponseData, setBaselineApiResponseData] = useState(null);
  const [apiResponseData, setApiResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [interactiveError, setInteractiveError] = useState(null);

  const activeModeDetails = useMemo(() => {
    if (!availableModes || availableModes.length === 0) return {};
    const details = {};
    Object.keys(activeModeSelection).forEach(key => {
      if (activeModeSelection[key]) {
        const baseMode = availableModes.find(m => m.key === key);
        if (baseMode) {
          const custom = modeCustomizations[key] || {};
          details[key] = {
            key: baseMode.key, name: custom.name || baseMode.defaultName, color: custom.color || baseMode.defaultColor,
            flags: baseMode.flags, parking_factor_per_person: baseMode.parking_factor_per_person,
          };
        }
      }
    });
    return details;
  }, [availableModes, activeModeSelection, modeCustomizations]);

  const actualYears = useMemo(() =>
    Array.from({ length: appConfig.numYears }, (_, i) => appConfig.startYear + i),
    [appConfig.startYear, appConfig.numYears]
  );

  const sortedActiveModeKeysForDisplay = useMemo(() => {
    const currentActiveDetails = activeModeDetails;
    const currentBaselineShares = baselineModeShares;
    if (!currentActiveDetails || Object.keys(currentActiveDetails).length === 0 || !currentBaselineShares || Object.keys(currentBaselineShares).length === 0) {
      return [];
    }
    const keysToSort = [...Object.keys(currentActiveDetails)];
    keysToSort.sort((keyA, keyB) => (currentBaselineShares[keyB] ?? 0) - (currentBaselineShares[keyA] ?? 0) || keyA.localeCompare(keyB));
    return keysToSort;
  }, [activeModeDetails, baselineModeShares]);

  // --- NEW UNIFIED API CALL FUNCTION ---
  const fetchCalculations = useCallback(async (currentInputState, currentAppConfig, currentBaselineShares) => {
    if (Object.keys(currentBaselineShares).length === 0 || !currentAppConfig) return;
    setIsLoading(true);
    setInteractiveError(null);

    // --- Build BASELINE parameters ---
    const baselinePopulation = Array(currentAppConfig.numYears).fill(currentAppConfig.quickStartPopulation);
    if (currentAppConfig.quickAnnualGrowthRate !== 0) {
      for (let i = 1; i < currentAppConfig.numYears; i++) {
        baselinePopulation[i] = baselinePopulation[i-1] * (1 + currentAppConfig.quickAnnualGrowthRate / 100);
      }
    }
    const baselineParking = Array(currentAppConfig.numYears).fill(currentAppConfig.quickStartParkingSupply);
    const baselineInputParameters = {
        modeShares: currentBaselineShares,
        population_per_year: baselinePopulation,
        parking_supply_per_year: baselineParking,
        parking_cost_per_space: currentAppConfig.defaultParkingCost,
        show_rate_percent: currentAppConfig.showRate,
        num_years: currentAppConfig.numYears,
    };

    // --- Build SCENARIO parameters ---
    const scenarioInputParameters = {
        modeShares: currentInputState.modeShares,
        population_per_year: currentInputState.populationValues,
        parking_supply_per_year: currentInputState.parkingSupplyValues,
        parking_cost_per_space: currentInputState.parkingCost,
        show_rate_percent: currentAppConfig.showRate,
        num_years: currentAppConfig.numYears,
    };
    
    // --- Build SHUTTLE parameters ---
    const shuttleParameters = {
        includeShuttleCosts: currentAppConfig.includeShuttleCosts,
        shuttleBaselineCost: currentAppConfig.shuttleBaselineCost,
        shuttleParkingPercentage: currentAppConfig.shuttleParkingPercentage,
        shuttleCostPerHour: currentAppConfig.shuttleCostPerHour,
        shuttlePeakHours: currentAppConfig.shuttlePeakHours,
        shuttleVehicleCapacity: currentAppConfig.shuttleVehicleCapacity,
        shuttleMinContractHours: currentAppConfig.shuttleMinContractHours,
        shuttleOperatingDays: currentAppConfig.shuttleOperatingDays,
    };

    const payload = {
        baselineInputParameters,
        scenarioInputParameters,
        shuttleParameters,
        modeCustomizations,
    };

    try {
        const response = await axios.post(`${API_BASE_URL}/calculate`, payload);
        const { baselineResults, scenarioResults, shuttleResults } = response.data;

        // Attach shuttle results to their respective data objects for easier prop passing
        baselineResults.shuttle = {
            annual_cost_per_year: shuttleResults.baseline_annual_cost_per_year,
            total_shuttles_per_year: shuttleResults.baseline_shuttles_per_year
        };
        scenarioResults.shuttle = {
            annual_cost_per_year: shuttleResults.scenario_annual_cost_per_year,
            total_shuttles_per_year: shuttleResults.scenario_shuttles_per_year
        };

        setBaselineApiResponseData(baselineResults);
        setApiResponseData(scenarioResults);

    } catch (err) {
        setInteractiveError(err.response?.data?.error || err.message || "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  }, [modeCustomizations]);


  useEffect(() => {
    const fetchInitialModes = async () => {
      setModesLoading(true); setModesError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/modes/available`);
        const modesData = response.data;
        setAvailableModes(modesData);
        const iActiveSel = {}, iCustom = {}, iBaseShares = {};
        modesData.forEach(m => {
          iActiveSel[m.key] = m.isDefaultActive || false;
          iBaseShares[m.key] = m.isDefaultActive ? (m.defaultBaselineShare || 0) : 0;
          iCustom[m.key] = { name: m.defaultName, color: m.defaultColor };
        });
        setActiveModeSelection(iActiveSel);
        setModeCustomizations(iCustom);
        setBaselineModeShares(iBaseShares);
        setInputState(prev => ({ ...prev, modeShares: { ...iBaseShares } }));
        setModesLoading(false);
      } catch (err) {
          setModesError(err.message || "Failed to load modes.");
          setModesLoading(false);
      }
    };
    fetchInitialModes();
  }, []);

  useEffect(() => {
    setIntermediateNumberInputs({
      ...Object.fromEntries(Object.entries(appConfig).map(([key, value]) => [key, String(value)]))
    });
  }, [appConfig]);

  // Effect to run calculations when core data is ready or changes
  useEffect(() => {
    if (!modesLoading && Object.keys(baselineModeShares).length > 0) {
      fetchCalculations(inputState, appConfig, baselineModeShares);
    }
  }, [modesLoading, inputState, appConfig, baselineModeShares, fetchCalculations]);

  // --- Handlers ---
  const handleBaselineNumberInputChange = useCallback((event) => {
      const { name, value } = event.target;
      setIntermediateNumberInputs(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handler for custom number format component
  const handleBaselineFormattedNumberChange = useCallback((payload) => {
    const {name, value} = payload.target;
    setIntermediateNumberInputs(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBaselineNumberCommit = useCallback((event) => {
      const { name, value } = event.target;
      let numericValue = parseFloat(String(value).replace(/[$,]/g, ''));
      if (isNaN(numericValue)) {
        numericValue = appConfig[name] || 0;
      }
      setAppConfig(prevAppConfig => ({ ...prevAppConfig, [name]: numericValue }));
  }, [appConfig]);

  const handleBaselineCheckboxChange = useCallback((event) => {
    const { name, checked } = event.target;
    setAppConfig(prevAppConfig => ({ ...prevAppConfig, [name]: checked }));
  }, []);

  const handleModeShareChange = useCallback((modeKey, newShareRaw) => {
    const newShare = parseFloat(newShareRaw);
    if (isNaN(newShare) || newShare < 0 || newShare > 100) return;
    setInputState(prevState => {
        const currentShares = { ...prevState.modeShares };
        const activeKeys = Object.keys(activeModeSelection).filter(k => activeModeSelection[k]);
        if (!activeKeys.includes(modeKey)) return prevState;
        const otherActiveKeys = activeKeys.filter(k => k !== modeKey);
        const oldShareOfThisMode = currentShares[modeKey] || 0;
        let changeInThisMode = newShare - oldShareOfThisMode;
        const newShares = { ...currentShares };
        newShares[modeKey] = newShare;
        if (otherActiveKeys.length > 0) {
            let totalOtherSharesOriginal = 0;
            otherActiveKeys.forEach(k => { totalOtherSharesOriginal += (currentShares[k] || 0); });
            if (totalOtherSharesOriginal > 0) {
                otherActiveKeys.forEach(k => {
                    const reduction = (currentShares[k] / totalOtherSharesOriginal) * changeInThisMode;
                    newShares[k] = Math.max(0, currentShares[k] - reduction);
                });
            } else if (changeInThisMode < 0) {
                const shareToAdd = -changeInThisMode / otherActiveKeys.length;
                otherActiveKeys.forEach(k => { newShares[k] = (newShares[k] || 0) + shareToAdd; });
            }
        }
        let currentTotal = 0;
        activeKeys.forEach(k => currentTotal += (newShares[k] || 0));
        if (Math.abs(currentTotal - 100) > 0.001 && currentTotal > 0) {
            activeKeys.forEach(k => { newShares[k] = (newShares[k] / currentTotal) * 100; });
        }
        return { ...prevState, modeShares: newShares };
    });
  }, [activeModeSelection]);

  const handleModeNumericInputCommit = useCallback((modeKey, newNumericValue) => {
    handleModeShareChange(modeKey, newNumericValue);
  }, [handleModeShareChange]);

  const handleReset = useCallback(() => {
    let resetPopulationValues = Array(appConfig.numYears).fill(appConfig.quickStartPopulation);
    if (appConfig.quickAnnualGrowthRate !== 0) {
        for (let i = 1; i < appConfig.numYears; i++) {
            resetPopulationValues[i] = resetPopulationValues[i-1] * (1 + appConfig.quickAnnualGrowthRate / 100);
        }
    }
    const resetParkingValues = Array(appConfig.numYears).fill(appConfig.quickStartParkingSupply);
    setInputState({
      modeShares: { ...baselineModeShares },
      populationValues: resetPopulationValues,
      parkingSupplyValues: resetParkingValues,
      parkingCost: appConfig.defaultParkingCost,
    });
  }, [baselineModeShares, appConfig]);

  if (modesLoading) { return ( <ThemeProvider theme={theme}><CssBaseline /><Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /><Typography ml={2}>Loading Mode Configuration...</Typography></Box></ThemeProvider> ); }
  if (modesError) { return ( <ThemeProvider theme={theme}><CssBaseline /><Container maxWidth="sm" sx={{ mt: 5 }}><Alert severity="error">Error loading application: {modesError}. Please check API and refresh.</Alert></Container></ThemeProvider> ); }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" sx={{ mb: 3, bgcolor: theme.palette.primary.main, flexShrink: 0 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>SEA MOVES</Typography>
            <Button component={NavLink} to="/" style={({ isActive }) => ({ color: 'white', fontWeight: isActive ? 'bold' : 'normal' })}>Scenario Tool</Button>
            <Button component={NavLink} to="/setup" style={({ isActive }) => ({ color: 'white', fontWeight: isActive ? 'bold' : 'normal' })}>Model Setup</Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="xl" component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', py: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={
                  <ScenarioPage
                    inputState={inputState} apiResponseData={apiResponseData} baselineApiResponseData={baselineApiResponseData}
                    activeModeDetails={activeModeDetails} actualYears={actualYears} sortedActiveModeKeys={sortedActiveModeKeysForDisplay}
                    isLoading={isLoading} interactiveError={interactiveError} baselineIsLoading={isLoading} baselineError={interactiveError} // Simplification: Use main loading/error for both for now
                    onModeShareChange={handleModeShareChange} onModeNumericInputCommit={handleModeNumericInputCommit} onReset={handleReset}
                  /> } />
              <Route path="/setup" element={
                  <ModelSetupPage
                    baselineConfig={appConfig}
                    intermediateNumberInputs={intermediateNumberInputs}
                    onBaselineNumberInputChange={handleBaselineFormattedNumberChange} // Use the new handler for formatted inputs
                    onBaselineNumberCommit={handleBaselineNumberCommit}
                    onBaselineCheckboxChange={handleBaselineCheckboxChange}
                  /> } />
            </Routes>
          </Box>
          <Box component="footer" sx={{ py: 2, mt: 4, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
              <img src="/images/NUClogo.png" alt="Nunes-Ueno Consulting Logo" style={{ height: '30px', marginRight: '15px' }} />
              <Typography variant="caption" component="span"> © {new Date().getFullYear()} Nunes-Ueno Consulting. </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;