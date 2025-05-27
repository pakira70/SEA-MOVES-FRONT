// src/App.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types'; // Keep if other components use it, or remove if not.
import axios from 'axios';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  Container, Typography, Box, AppBar, Toolbar, Button,
  CssBaseline, ThemeProvider, createTheme, CircularProgress, Alert
} from '@mui/material';

import ScenarioPage from './pages/ScenarioPage.jsx';
import ModelSetupPage from './pages/ModelSetupPage.jsx';
import { API_BASE_URL, DEFAULT_PARKING_COST } from './config';

const theme = createTheme({
  palette: {
    primary: { main: '#1976D2' }, // Blue primary color
    secondary: { main: '#ffc107' },
    background: { default: '#f5f5f5' }
  },
  typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
});

const FALLBACK_START_YEAR = 2024;
const FALLBACK_NUM_YEARS = 5;
const FALLBACK_POPULATION = 10000;
const FALLBACK_PARKING_SUPPLY = 5000;


function App() {
  console.log("App Component: Mounting/Rendering");

  // --- State for Available Modes & Initial Setup ---
  const [modesLoading, setModesLoading] = useState(true);
  const [modesError, setModesError] = useState(null);
  const [availableModes, setAvailableModes] = useState([]);

  // --- State for App Configuration (Baseline edited on ModelSetupPage) ---
  const [appConfig, setAppConfig] = useState({
    startYear: FALLBACK_START_YEAR,
    numYears: FALLBACK_NUM_YEARS,
    showRate: 100, // Default show rate percentage
    defaultParkingCost: DEFAULT_PARKING_COST, // Default cost per parking space
    quickStartPopulation: FALLBACK_POPULATION, // Initial population for quick setup
    quickAnnualGrowthRate: 0, // Default annual growth rate
    quickStartParkingSupply: FALLBACK_PARKING_SUPPLY, // Initial parking supply for quick setup
  });

  // Intermediate string values for text fields on ModelSetupPage
  const [intermediateNumberInputs, setIntermediateNumberInputs] = useState({
    startYear: String(appConfig.startYear),
    numYears: String(appConfig.numYears),
    showRate: String(appConfig.showRate),
    defaultParkingCost: String(appConfig.defaultParkingCost),
    quickStartPopulation: String(appConfig.quickStartPopulation),
    quickAnnualGrowthRate: String(appConfig.quickAnnualGrowthRate),
    quickStartParkingSupply: String(appConfig.quickStartParkingSupply),
  });

  // --- State for Scenario Page Interactions & Mode Definitions ---
  // activeModeSelection: which modes are currently selected for the scenario tool
  const [activeModeSelection, setActiveModeSelection] = useState({});
  // modeCustomizations: user overrides for display names/colors
  const [modeCustomizations, setModeCustomizations] = useState({});
  // baselineModeShares: default shares for active modes (can be from API or later from advanced setup)
  const [baselineModeShares, setBaselineModeShares] = useState({});

  // inputState: current values for the Scenario Page sliders and other inputs
  const [inputState, setInputState] = useState({
    modeShares: {}, // Will be initialized from baselineModeShares
    populationValues: Array(appConfig.numYears).fill(appConfig.quickStartPopulation),
    parkingSupplyValues: Array(appConfig.numYears).fill(appConfig.quickStartParkingSupply),
    parkingCost: appConfig.defaultParkingCost,
  });

  // --- State for API Data & Loading/Error ---
  const [baselineApiResponseData, setBaselineApiResponseData] = useState(null);
  const [isBaselineLoading, setIsBaselineLoading] = useState(false);
  const [baselineError, setBaselineError] = useState(null);

  const [apiResponseData, setApiResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [interactiveError, setInteractiveError] = useState(null);


  // --- Derived State & Memos ---
  const activeModeDetails = useMemo(() => {
    // console.log("[ACTIVE_DETAILS_DEBUG] Memo for activeModeDetails: START. availableModes length:", availableModes.length, "activeModeSelection keys:", Object.keys(activeModeSelection).length);
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
        } else {
          // console.warn(`[ACTIVE_DETAILS_DEBUG] activeModeDetails: No baseMode found for active key: ${key}`);
        }
      }
    });
    // console.log("[ACTIVE_DETAILS_DEBUG] Memo for activeModeDetails: RESULT (keys):", JSON.stringify(Object.keys(details)));
    return details;
  }, [availableModes, activeModeSelection, modeCustomizations]);

  const actualYears = useMemo(() =>
    Array.from({ length: appConfig.numYears }, (_, i) => appConfig.startYear + i),
    [appConfig.startYear, appConfig.numYears]
  );

  const sortedActiveModeKeysForDisplay = useMemo(() => {
    // console.log("[SORT_DEBUG] Memo for sortedActiveModeKeysForDisplay: START");
    const currentActiveDetails = activeModeDetails;
    const currentBaselineShares = baselineModeShares;
    if (!currentActiveDetails || Object.keys(currentActiveDetails).length === 0 || !currentBaselineShares || Object.keys(currentBaselineShares).length === 0) {
      return [];
    }
    const activeKeysInput = Object.keys(currentActiveDetails);
    const keysToSort = [...activeKeysInput];
    const sortedResult = keysToSort.sort((keyA, keyB) => {
      const shareA = currentBaselineShares[keyA];
      const shareB = currentBaselineShares[keyB];
      const numShareA = (typeof shareA === 'number' && !isNaN(shareA)) ? shareA : 0;
      const numShareB = (typeof shareB === 'number' && !isNaN(shareB)) ? shareB : 0;
      if (numShareB === numShareA) return keyA.localeCompare(keyB);
      return numShareB - numShareA;
    });
    // console.log("[SORT_DEBUG] Memo for sortedActiveModeKeysForDisplay: FINAL SORTED RESULT:", JSON.stringify(sortedResult));
    return sortedResult;
  }, [activeModeDetails, baselineModeShares]);

  // --- Effects ---

  // Effect 1: Fetch available modes on mount and initialize related states
  useEffect(() => {
    const fetchInitialModes = async () => {
      console.log("App (Effect 1): Fetching available modes...");
      setModesLoading(true); setModesError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/modes/available`);
        const modesData = response.data;
        setAvailableModes(modesData);

        const iActiveSel = {}, iCustom = {}, iBaseShares = {};
        let sumDef = 0;
        modesData.forEach(m => {
          iActiveSel[m.key] = m.isDefaultActive || false;
          iBaseShares[m.key] = m.isDefaultActive ? (m.defaultBaselineShare || 0) : 0;
          if (m.isDefaultActive) sumDef += (m.defaultBaselineShare || 0);
          iCustom[m.key] = { name: m.defaultName, color: m.defaultColor };
        });

        if (sumDef > 0 && Math.abs(sumDef - 100) > 0.01) {
            console.warn(`App (Effect 1): Default shares sum to ${sumDef}, normalizing.`);
            const activeDefaultKeys = modesData.filter(m => m.isDefaultActive).map(m => m.key);
            activeDefaultKeys.forEach(key => {
                if (iBaseShares[key] !== undefined) iBaseShares[key] = (iBaseShares[key] / sumDef) * 100;
            });
        }
        setActiveModeSelection(iActiveSel);
        setModeCustomizations(iCustom);
        setBaselineModeShares(iBaseShares);
        // Initialize inputState.modeShares based on these baseline shares
        setInputState(prev => ({ ...prev, modeShares: { ...iBaseShares } }));
        setModesLoading(false);
      } catch (err) {
          console.error("App (Effect 1): Error fetching modes:", err);
          setModesError(err.message || "Failed to load modes.");
          setModesLoading(false);
      }
    };
    fetchInitialModes();
  }, []); // Removed API_BASE_URL from deps, as it's from config and won't change

  // Effect 2: Update intermediateNumberInputs when appConfig changes (e.g., after commit)
  // This ensures that if a commit changes a value (like parsing "05" to 5), the input field reflects it.
  useEffect(() => {
    setIntermediateNumberInputs({
        startYear: String(appConfig.startYear),
        numYears: String(appConfig.numYears),
        showRate: String(appConfig.showRate),
        defaultParkingCost: String(appConfig.defaultParkingCost),
        quickStartPopulation: String(appConfig.quickStartPopulation),
        quickAnnualGrowthRate: String(appConfig.quickAnnualGrowthRate),
        quickStartParkingSupply: String(appConfig.quickStartParkingSupply),
    });
  }, [appConfig]);


  // --- API Call Functions ---
  const fetchBaselineData = useCallback(async (currentAppConfig) => { // Pass currentAppConfig
    if (Object.keys(baselineModeShares).length === 0 || Object.keys(activeModeDetails).length === 0 || !currentAppConfig) return;
    setIsBaselineLoading(true); setBaselineError(null);
    const currentActiveKeys = Object.keys(activeModeSelection).filter(key => activeModeSelection[key]);
    if (currentActiveKeys.length === 0) { setIsBaselineLoading(false); return; }

    const filteredShares = {}; currentActiveKeys.forEach(k => { filteredShares[k] = baselineModeShares[k] ?? 0; });

    // Generate population and parking arrays based on currentAppConfig for baseline
    let baselinePopulationValues = Array(currentAppConfig.numYears).fill(currentAppConfig.quickStartPopulation);
    if (currentAppConfig.quickAnnualGrowthRate !== 0) {
        for (let i = 1; i < currentAppConfig.numYears; i++) {
            baselinePopulationValues[i] = baselinePopulationValues[i-1] * (1 + currentAppConfig.quickAnnualGrowthRate / 100);
        }
    }
    // For simplicity, parking supply for baseline will use quickStartParkingSupply for all years.
    // This could be made dynamic based on growth if needed in the future.
    const baselineParkingSupplyValues = Array(currentAppConfig.numYears).fill(currentAppConfig.quickStartParkingSupply);


    const payload = {
      activeModeKeys: currentActiveKeys, modeCustomizations,
      inputParameters: {
        modeShares: filteredShares,
        population_per_year: baselinePopulationValues.slice(0, currentAppConfig.numYears),
        parking_supply_per_year: baselineParkingSupplyValues.slice(0, currentAppConfig.numYears),
        parking_cost_per_space: currentAppConfig.defaultParkingCost,
        show_rate_percent: currentAppConfig.showRate,
        num_years: currentAppConfig.numYears,
      }
    };
    console.log("Fetching BASELINE data with payload:", JSON.stringify(payload, null, 2));
    try {
      const response = await axios.post(`${API_BASE_URL}/calculate`, payload);
      setBaselineApiResponseData(response.data);
    } catch (err) {setBaselineError(err.response?.data?.error || err.message);}
    finally { setIsBaselineLoading(false); }
  }, [ API_BASE_URL, activeModeDetails, activeModeSelection, baselineModeShares, modeCustomizations ]); // Removed appConfig direct deps, pass as arg

  const fetchData = useCallback(async (currentInputStateForFetch, currentAppConfig) => { // Pass currentAppConfig
    if (Object.keys(currentInputStateForFetch.modeShares).length === 0 || Object.keys(activeModeDetails).length === 0 || !currentAppConfig) return;
    setIsLoading(true); setInteractiveError(null);
    const currentActiveKeys = Object.keys(activeModeSelection).filter(key => activeModeSelection[key]);
    if (currentActiveKeys.length === 0) { setIsLoading(false); return; }
    const filteredShares = {}; currentActiveKeys.forEach(k => {filteredShares[k] = currentInputStateForFetch.modeShares[k] ?? 0; });
    const payload = {
      activeModeKeys: currentActiveKeys, modeCustomizations,
      inputParameters: {
        modeShares: filteredShares,
        population_per_year: currentInputStateForFetch.populationValues.slice(0, currentAppConfig.numYears),
        parking_supply_per_year: currentInputStateForFetch.parkingSupplyValues.slice(0, currentAppConfig.numYears),
        parking_cost_per_space: currentInputStateForFetch.parkingCost,
        show_rate_percent: currentAppConfig.showRate,
        num_years: currentAppConfig.numYears,
      }
    };
    console.log("Fetching INTERACTIVE data with payload:", JSON.stringify(payload, null, 2));
    try {
      const response = await axios.post(`${API_BASE_URL}/calculate`, payload);
      setApiResponseData(response.data);
    } catch (err) { setInteractiveError(err.response?.data?.error || err.message); }
    finally { setIsLoading(false); }
  }, [ API_BASE_URL, activeModeDetails, activeModeSelection, modeCustomizations ]); // Removed appConfig direct deps, pass as arg

  // Effect 3: Fetch initial baseline and interactive data once modes and appConfig are ready
  const stringifiedInitialModeShares = JSON.stringify(inputState.modeShares); // Used as a proxy for baselineModeShares being ready
  useEffect(() => {
    if (!modesLoading && !modesError && availableModes.length > 0 &&
        Object.keys(baselineModeShares).length > 0 && Object.keys(inputState.modeShares).length > 0 &&
        !baselineApiResponseData ) { // Only run if baseline data hasn't been fetched yet
      console.log("App (Effect 3): Initial data fetch trigger.");
      fetchBaselineData(appConfig); // Pass current appConfig
      fetchData(inputState, appConfig); // Pass current appConfig
    }
  }, [modesLoading, modesError, availableModes, baselineModeShares, stringifiedInitialModeShares,
      baselineApiResponseData, fetchBaselineData, fetchData, inputState, appConfig]); // Added appConfig

  // Effect 4: Re-fetch interactive data when relevant inputState parts change
  const stringifiedInputModeSharesForEffect = JSON.stringify(inputState.modeShares);
  const stringifiedInputPopulationValues = JSON.stringify(inputState.populationValues);
  const stringifiedInputParkingSupplyValues = JSON.stringify(inputState.parkingSupplyValues);
  const inputParkingCostForEffect = inputState.parkingCost;
  useEffect(() => {
    if (modesLoading || !baselineApiResponseData) return; // Don't run if initial setup isn't complete
    console.log("App (Effect 4): Interactive input change detected, re-fetching data.");
    fetchData(inputState, appConfig); // Pass current appConfig
  }, [ stringifiedInputModeSharesForEffect, stringifiedInputPopulationValues, stringifiedInputParkingSupplyValues,
      inputParkingCostForEffect, fetchData, modesLoading, baselineApiResponseData, inputState, appConfig ]); // Added appConfig

  // --- Handlers for ModelSetupPage (Baseline Configuration) ---
  const handleBaselineNumberInputChange = useCallback((event) => {
      const { name, value } = event.target;
      setIntermediateNumberInputs(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBaselineNumberCommit = useCallback((event) => {
      const { name, value } = event.target;
      let numericValue = parseFloat(value);

      // Basic validation for specific fields
      if (name === "numYears" && (isNaN(numericValue) || numericValue <= 0 || numericValue > 50)) {
          console.warn(`App.jsx: Invalid numYears committed: ${value}. Reverting.`);
          setIntermediateNumberInputs(prev => ({ ...prev, [name]: String(appConfig[name] || FALLBACK_NUM_YEARS) }));
          return; // Prevent update to appConfig
      }
      if (name === "startYear" && (isNaN(numericValue) || numericValue < 1900 || numericValue > 2200)) {
          console.warn(`App.jsx: Invalid startYear committed: ${value}. Reverting.`);
          setIntermediateNumberInputs(prev => ({ ...prev, [name]: String(appConfig[name] || FALLBACK_START_YEAR) }));
          return;
      }
      // Add more specific validations for other fields if needed (e.g., showRate between 0-100)

      if (!isNaN(numericValue)) {
          setAppConfig(prevAppConfig => {
              const newConfig = { ...prevAppConfig, [name]: numericValue };

              // If numYears, quickStartPopulation, or quickAnnualGrowthRate changes,
              // we might need to update the inputState's populationValues array.
              // Also, if numYears or quickStartParkingSupply changes, update parkingSupplyValues.
              // This logic also triggers a re-fetch of baseline data if dependent values change.
              let populationValuesUpdated = false;
              let parkingSupplyValuesUpdated = false;
              let newPopulationValues = [...inputState.populationValues];
              let newParkingSupplyValues = [...inputState.parkingSupplyValues];


              if (name === 'numYears' && numericValue !== prevAppConfig.numYears) {
                  console.log(`App.jsx: numYears changed from ${prevAppConfig.numYears} to ${numericValue}. Updating dependent arrays.`);
                  const oldNumYears = prevAppConfig.numYears;
                  const currentQuickStartPop = name === 'quickStartPopulation' ? numericValue : newConfig.quickStartPopulation;
                  const currentGrowthRate = name === 'quickAnnualGrowthRate' ? numericValue : newConfig.quickAnnualGrowthRate;
                  const currentQuickStartParking = name === 'quickStartParkingSupply' ? numericValue : newConfig.quickStartParkingSupply;

                  newPopulationValues = Array(numericValue).fill(currentQuickStartPop);
                  if (currentGrowthRate !== 0) {
                      for (let i = 1; i < numericValue; i++) {
                          newPopulationValues[i] = newPopulationValues[i-1] * (1 + currentGrowthRate / 100);
                      }
                  }
                  newParkingSupplyValues = Array(numericValue).fill(currentQuickStartParking);
                  populationValuesUpdated = true;
                  parkingSupplyValuesUpdated = true;
              } else if (name === 'quickStartPopulation' || name === 'quickAnnualGrowthRate') {
                  const currentNumYears = newConfig.numYears;
                  const currentQuickStartPop = name === 'quickStartPopulation' ? numericValue : newConfig.quickStartPopulation;
                  const currentGrowthRate = name === 'quickAnnualGrowthRate' ? numericValue : newConfig.quickAnnualGrowthRate;

                  newPopulationValues = Array(currentNumYears).fill(currentQuickStartPop);
                  if (currentGrowthRate !== 0) {
                      for (let i = 1; i < currentNumYears; i++) {
                          newPopulationValues[i] = newPopulationValues[i-1] * (1 + currentGrowthRate / 100);
                      }
                  }
                  populationValuesUpdated = true;
              } else if (name === 'quickStartParkingSupply') {
                  const currentNumYears = newConfig.numYears;
                  newParkingSupplyValues = Array(currentNumYears).fill(numericValue);
                  parkingSupplyValuesUpdated = true;
              }

              if (populationValuesUpdated || parkingSupplyValuesUpdated) {
                setInputState(prevInput => ({
                    ...prevInput,
                    ...(populationValuesUpdated && { populationValues: newPopulationValues }),
                    ...(parkingSupplyValuesUpdated && { parkingSupplyValues: newParkingSupplyValues }),
                    // Also update parkingCost if defaultParkingCost changed
                    ...(name === 'defaultParkingCost' && { parkingCost: numericValue }),
                }));
              }
              // Trigger a re-fetch of baseline data since appConfig changed
              fetchBaselineData(newConfig);
              return newConfig;
          });
          // Intermediate input is updated by the useEffect listening to appConfig.
      } else {
          console.warn(`App.jsx: Invalid non-numeric value committed for ${name}: ${value}. Reverting intermediate input.`);
          setIntermediateNumberInputs(prev => ({ ...prev, [name]: String(appConfig[name] || '') }));
      }
  }, [appConfig, inputState.populationValues, inputState.parkingSupplyValues, fetchBaselineData]);


  // --- Handlers for ScenarioPage (Interactive Mode Shares & Reset) ---
  const handleModeShareChange = useCallback((modeKey, newShareRaw) => {
    const newShare = parseFloat(newShareRaw);
    if (isNaN(newShare) || newShare < 0 || newShare > 100) return;
    setInputState(prevState => {
        const currentShares = { ...prevState.modeShares };
        const activeKeys = Object.keys(activeModeSelection).filter(k => activeModeSelection[k]);
        if (!activeKeys.includes(modeKey)) return prevState; // Only adjust active modes

        const otherActiveKeys = activeKeys.filter(k => k !== modeKey);
        const oldShareOfThisMode = currentShares[modeKey] || 0;
        let changeInThisMode = newShare - oldShareOfThisMode;
        const newShares = { ...currentShares };
        newShares[modeKey] = newShare;

        if (otherActiveKeys.length > 0) {
            let totalOtherSharesOriginal = 0;
            otherActiveKeys.forEach(k => { totalOtherSharesOriginal += (currentShares[k] || 0); });

            if (totalOtherSharesOriginal > 0) { // Distribute change proportionally
                otherActiveKeys.forEach(k => {
                    const originalOtherShare = currentShares[k] || 0;
                    let reduction = (originalOtherShare / totalOtherSharesOriginal) * changeInThisMode;
                    newShares[k] = Math.max(0, originalOtherShare - reduction);
                });
            } else if (changeInThisMode < 0 && otherActiveKeys.length > 0) { // If others were 0, distribute added share evenly
                const shareToAdd = -changeInThisMode / otherActiveKeys.length;
                otherActiveKeys.forEach(k => { newShares[k] = (newShares[k] || 0) + shareToAdd; });
            }
        }
        // Normalize to 100%
        let currentTotal = 0;
        activeKeys.forEach(k => currentTotal += (newShares[k] || 0));
        if (Math.abs(currentTotal - 100) > 0.001 && currentTotal > 0) {
            activeKeys.forEach(k => { newShares[k] = ((newShares[k] || 0) / currentTotal) * 100; });
        }
        // Round and adjust last one for precision
        let roundedTotal = 0;
        activeKeys.forEach(k => {
            newShares[k] = Math.round((newShares[k] || 0) * 100) / 100; // Round to 2 decimal places
            roundedTotal += newShares[k];
        });
        if (activeKeys.length > 0 && Math.abs(roundedTotal - 100) > 0.001) {
            const diff = 100 - roundedTotal;
            // Add difference to the mode being changed, or the first active mode if that's not possible
            const keyToAdjust = newShares[modeKey] !== undefined ? modeKey : activeKeys[0];
            newShares[keyToAdjust] = (newShares[keyToAdjust] || 0) + diff;
            newShares[keyToAdjust] = Math.round(newShares[keyToAdjust] * 100) / 100;
        }
        activeKeys.forEach(k => { if (newShares[k] < 0) newShares[k] = 0; }); // Ensure no negative shares

        return { ...prevState, modeShares: newShares };
    });
  }, [activeModeSelection]);

  const handleModeNumericInputCommit = useCallback((modeKey, newNumericValue) => {
    handleModeShareChange(modeKey, newNumericValue);
  }, [handleModeShareChange]);

  const handleReset = useCallback(() => {
    console.log("App.jsx: Resetting to baseline.");
    // Reset inputState based on current appConfig and baselineModeShares
    let resetPopulationValues = Array(appConfig.numYears).fill(appConfig.quickStartPopulation);
    if (appConfig.quickAnnualGrowthRate !== 0) {
        for (let i = 1; i < appConfig.numYears; i++) {
            resetPopulationValues[i] = resetPopulationValues[i-1] * (1 + appConfig.quickAnnualGrowthRate / 100);
        }
    }
    const resetParkingValues = Array(appConfig.numYears).fill(appConfig.quickStartParkingSupply);

    const resetInputStateValues = {
      modeShares: { ...baselineModeShares },
      populationValues: resetPopulationValues,
      parkingSupplyValues: resetParkingValues,
      parkingCost: appConfig.defaultParkingCost,
    };
    setInputState(resetInputStateValues);
    // No need to call fetchData here, the useEffect listening to inputState will trigger it.
  }, [baselineModeShares, appConfig]); // Removed fetchData and inputState from deps


  // --- Handlers for Advanced Model Setup (STUBS for now, to be removed from ModelSetupPage props) ---
  const handleBaselineModeSelectionChange = useCallback((modeKey, isActive) => {
    // This logic would update activeModeSelection for the BASELINE
    // and re-calculate baselineModeShares accordingly.
    // For now, it's a stub as this section is deferred.
    console.log("STUB: handleBaselineModeSelectionChange", modeKey, isActive);
    // Example of what it might do (simplified):
    // setActiveModeSelection(prev => ({...prev, [modeKey]: isActive}));
    // setBaselineModeShares(prev => adjustShares(...));
  }, []);

  const handleBaselineModeShareValueChange = useCallback((modeKey, newShare) => {
    // This logic would update a specific mode's share in baselineModeShares
    // and ensure the sum remains 100%.
    // For now, it's a stub.
    console.log("STUB: handleBaselineModeShareValueChange", modeKey, newShare);
    // setBaselineModeShares(prev => ({...prev, [modeKey]: parseFloat(newShare)}));
  }, []);

  const handleModeCustomizationChange = useCallback((modeKey, field, value) => {
    // This logic would update modeCustomizations (name/color).
    // For now, it's a stub.
    console.log("STUB: handleModeCustomizationChange", modeKey, field, value);
    // setModeCustomizations(prev => ({ ...prev, [modeKey]: { ...(prev[modeKey] || {}), [field]: value, } }));
  }, []);


  // --- Render Logic ---
  if (modesLoading) {
    return ( <ThemeProvider theme={theme}><CssBaseline /><Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /><Typography ml={2}>Loading Mode Configuration...</Typography></Box></ThemeProvider> );
  }
  if (modesError) {
    return ( <ThemeProvider theme={theme}><CssBaseline /><Container maxWidth="sm" sx={{ mt: 5 }}><Alert severity="error">Error loading application: {modesError}. Please check API and refresh.</Alert></Container></ThemeProvider> );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" sx={{ mb: 3, bgcolor: theme.palette.primary.main }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>SEA MOVES</Typography>
          <Button component={NavLink} to="/" style={({ isActive }) => ({ color: 'white', fontWeight: isActive ? 'bold' : 'normal', marginRight: '15px' })}>Scenario Tool</Button>
          <Button component={NavLink} to="/setup" style={({ isActive }) => ({ color: 'white', fontWeight: isActive ? 'bold' : 'normal', marginRight: '15px' })}>Model Setup</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl">
        <Routes>
          <Route path="/" element={
              <ScenarioPage
                inputState={inputState}
                apiResponseData={apiResponseData}
                baselineApiResponseData={baselineApiResponseData}
                activeModeDetails={activeModeDetails}
                actualYears={actualYears}
                sortedActiveModeKeys={sortedActiveModeKeysForDisplay}
                isLoading={isLoading}
                interactiveError={interactiveError}
                baselineIsLoading={isBaselineLoading}
                baselineError={baselineError}
                onModeShareChange={handleModeShareChange}
                onModeNumericInputCommit={handleModeNumericInputCommit}
                onReset={handleReset}
              /> } />
          <Route path="/setup" element={
              <ModelSetupPage
                baselineConfig={appConfig}
                intermediateNumberInputs={intermediateNumberInputs}
                // Props for advanced setup are removed as per simplification
                // availableModes={availableModes}
                // activeModeSelection={activeModeSelection} // This is for scenario, not baseline setup directly
                // baselineModeShares={baselineModeShares}
                // modeCustomizations={modeCustomizations}
                onBaselineNumberInputChange={handleBaselineNumberInputChange}
                onBaselineNumberCommit={handleBaselineNumberCommit}
                // onBaselineModeSelectionChange={handleBaselineModeSelectionChange} // STUB
                // onBaselineModeShareValueChange={handleBaselineModeShareValueChange} // STUB
                // onModeCustomizationChange={handleModeCustomizationChange} // STUB
              /> } />
        </Routes>
      </Container>
    </ThemeProvider>
  );
}

export default App;