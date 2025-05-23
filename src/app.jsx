// src/App.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types'; // ADDED DEFENSIVELY
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

function App() {
  console.log("App Component: Mounting/Rendering");

  const [modesLoading, setModesLoading] = useState(true);
  const [modesError, setModesError] = useState(null);
  const [availableModes, setAvailableModes] = useState([]);
  const [activeModeSelection, setActiveModeSelection] = useState({});
  const [modeCustomizations, setModeCustomizations] = useState({});
  const [baselineModeShares, setBaselineModeShares] = useState({});
  const [inputState, setInputState] = useState({
    modeShares: {},
    populationValues: Array(FALLBACK_NUM_YEARS).fill(10000),
    parkingSupplyValues: Array(FALLBACK_NUM_YEARS).fill(5000),
    parkingCost: DEFAULT_PARKING_COST,
  });
  const [appConfig, setAppConfig] = useState({
    startYear: FALLBACK_START_YEAR, numYears: FALLBACK_NUM_YEARS, showRate: 100,
    defaultParkingCost: DEFAULT_PARKING_COST, quickStartPopulation: 10000,
    quickAnnualGrowthRate: 0, quickStartParkingSupply: 5000,
  });
  const [intermediateNumberInputs, setIntermediateNumberInputs] = useState({
    startYear: String(appConfig.startYear), numYears: String(appConfig.numYears), showRate: String(appConfig.showRate),
    defaultParkingCost: String(appConfig.defaultParkingCost), quickStartPopulation: String(appConfig.quickStartPopulation),
    quickAnnualGrowthRate: String(appConfig.quickAnnualGrowthRate), quickStartParkingSupply: String(appConfig.quickStartParkingSupply),
  });
  const [baselineApiResponseData, setBaselineApiResponseData] = useState(null);
  const [isBaselineLoading, setIsBaselineLoading] = useState(false);
  const [baselineError, setBaselineError] = useState(null);
  const [apiResponseData, setApiResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [interactiveError, setInteractiveError] = useState(null);

  const activeModeDetails = useMemo(() => {
    console.log("[ACTIVE_DETAILS_DEBUG] Memo for activeModeDetails: START. availableModes length:", availableModes.length, "activeModeSelection keys:", Object.keys(activeModeSelection).length);
    if (!availableModes || availableModes.length === 0) {
      console.log("[ACTIVE_DETAILS_DEBUG] activeModeDetails: availableModes empty, returning {}");
      return {};
    }
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
          console.warn(`[ACTIVE_DETAILS_DEBUG] activeModeDetails: No baseMode found for active key: ${key}`);
        }
      }
    });
    console.log("[ACTIVE_DETAILS_DEBUG] Memo for activeModeDetails: RESULT (keys):", JSON.stringify(Object.keys(details)));
    return details;
  }, [availableModes, activeModeSelection, modeCustomizations]);

  const actualYears = useMemo(() =>
    Array.from({ length: appConfig.numYears }, (_, i) => appConfig.startYear + i),
    [appConfig.startYear, appConfig.numYears]
  );

  const sortedActiveModeKeysForDisplay = useMemo(() => {
    console.log("[SORT_DEBUG] Memo for sortedActiveModeKeysForDisplay: START");
    const currentActiveDetails = activeModeDetails;
    const currentBaselineShares = baselineModeShares;

    if (!currentActiveDetails || Object.keys(currentActiveDetails).length === 0) {
      console.log("[SORT_DEBUG] sortedActiveModeKeys: currentActiveDetails not ready. Keys:", currentActiveDetails ? Object.keys(currentActiveDetails) : 'null/undefined');
      return [];
    }
    if (!currentBaselineShares || Object.keys(currentBaselineShares).length === 0) {
      console.log("[SORT_DEBUG] sortedActiveModeKeys: currentBaselineShares not ready. Keys:", currentBaselineShares ? Object.keys(currentBaselineShares) : 'null/undefined');
      return [];
    }

    const activeKeysInput = Object.keys(currentActiveDetails);
    console.log("[SORT_DEBUG] Inputs to sort. Active Keys:", JSON.stringify(activeKeysInput));
    console.log("[SORT_DEBUG] Inputs to sort. Baseline Shares (FULL OBJECT):", JSON.stringify(currentBaselineShares));

    const keysToSort = [...activeKeysInput];
    const sortedResult = keysToSort.sort((keyA, keyB) => {
      const shareA = currentBaselineShares[keyA];
      const shareB = currentBaselineShares[keyB];
      const numShareA = (typeof shareA === 'number' && !isNaN(shareA)) ? shareA : 0;
      const numShareB = (typeof shareB === 'number' && !isNaN(shareB)) ? shareB : 0;
      if (numShareB === numShareA) return keyA.localeCompare(keyB);
      return numShareB - numShareA;
    });
    console.log("[SORT_DEBUG] Memo for sortedActiveModeKeysForDisplay: FINAL SORTED RESULT:", JSON.stringify(sortedResult));
    return sortedResult;
  }, [activeModeDetails, baselineModeShares]); // CORRECTED DEPENDENCIES

  useEffect(() => {
    const fetchInitialModes = async () => {
      console.log("App (Effect 1): Fetching available modes...");
      setModesLoading(true); setModesError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/modes/available`);
        const modesData = response.data;
        console.log("DEBUG App.jsx - fetchInitialModes - RAW MODES FROM API (direct object):", modesData);
        setAvailableModes(modesData);
        const iActiveSel = {}, iCustom = {}, iBaseShares = {}; let sumDef = 0;
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
        console.log("DEBUG App.jsx - fetchInitialModes - iBaseShares BEFORE set:", JSON.stringify(iBaseShares));
        setActiveModeSelection(iActiveSel);
        setModeCustomizations(iCustom);
        setBaselineModeShares(iBaseShares);
        setInputState(prev => ({ ...prev, modeShares: { ...iBaseShares } }));
        setModesLoading(false);
      } catch (err) {
          console.error("App (Effect 1): Error fetching modes:", err);
          setModesError(err.message || "Failed to load modes.");
          setModesLoading(false);
      }
    };
    fetchInitialModes();
  }, [API_BASE_URL]);

  const fetchBaselineData = useCallback(async () => {
    if (Object.keys(baselineModeShares).length === 0 || Object.keys(activeModeDetails).length === 0) return;
    setIsBaselineLoading(true); setBaselineError(null);
    const currentActiveKeys = Object.keys(activeModeSelection).filter(key => activeModeSelection[key]);
    if (currentActiveKeys.length === 0) { setIsBaselineLoading(false); return; }
    const filteredShares = {}; currentActiveKeys.forEach(k => { filteredShares[k] = baselineModeShares[k] ?? 0; });
    const payload = {
      activeModeKeys: currentActiveKeys, modeCustomizations,
      inputParameters: {
        modeShares: filteredShares, population_per_year: inputState.populationValues.slice(0, appConfig.numYears),
        parking_supply_per_year: inputState.parkingSupplyValues.slice(0, appConfig.numYears),
        parking_cost_per_space: appConfig.defaultParkingCost, show_rate_percent: appConfig.showRate, num_years: appConfig.numYears,
      }
    };
    try {
      const response = await axios.post(`${API_BASE_URL}/calculate`, payload);
      setBaselineApiResponseData(response.data);
    } catch (err) {setBaselineError(err.response?.data?.error || err.message);}
    finally { setIsBaselineLoading(false); }
  }, [ API_BASE_URL, activeModeDetails, activeModeSelection, appConfig.defaultParkingCost, appConfig.numYears, appConfig.showRate, baselineModeShares, inputState.parkingSupplyValues, inputState.populationValues, modeCustomizations ]);

  const fetchData = useCallback(async (currentInputStateForFetch) => {
    if (Object.keys(currentInputStateForFetch.modeShares).length === 0 || Object.keys(activeModeDetails).length === 0) return;
    setIsLoading(true); setInteractiveError(null);
    const currentActiveKeys = Object.keys(activeModeSelection).filter(key => activeModeSelection[key]);
    if (currentActiveKeys.length === 0) { setIsLoading(false); return; }
    const filteredShares = {}; currentActiveKeys.forEach(k => {filteredShares[k] = currentInputStateForFetch.modeShares[k] ?? 0; });
    const payload = {
      activeModeKeys: currentActiveKeys, modeCustomizations,
      inputParameters: {
        modeShares: filteredShares, population_per_year: currentInputStateForFetch.populationValues.slice(0, appConfig.numYears),
        parking_supply_per_year: currentInputStateForFetch.parkingSupplyValues.slice(0, appConfig.numYears),
        parking_cost_per_space: currentInputStateForFetch.parkingCost, show_rate_percent: appConfig.showRate, num_years: appConfig.numYears,
      }
    };
    try {
      const response = await axios.post(`${API_BASE_URL}/calculate`, payload);
      setApiResponseData(response.data);
    } catch (err) { setInteractiveError(err.response?.data?.error || err.message); }
    finally { setIsLoading(false); }
  }, [ API_BASE_URL, activeModeDetails, activeModeSelection, appConfig.numYears, appConfig.showRate, modeCustomizations ]);

  const stringifiedInitialModeShares = JSON.stringify(inputState.modeShares);
  useEffect(() => {
    if (!modesLoading && !modesError && availableModes.length > 0 &&
        Object.keys(baselineModeShares).length > 0 && Object.keys(inputState.modeShares).length > 0 &&
        !baselineApiResponseData ) {
      fetchBaselineData();
      fetchData(inputState);
    }
  }, [modesLoading, modesError, availableModes, baselineModeShares, stringifiedInitialModeShares,
      baselineApiResponseData, fetchBaselineData, fetchData, inputState]);

  const stringifiedInputModeSharesForEffect = JSON.stringify(inputState.modeShares);
  const stringifiedInputPopulationValues = JSON.stringify(inputState.populationValues);
  const stringifiedInputParkingSupplyValues = JSON.stringify(inputState.parkingSupplyValues);
  const inputParkingCostForEffect = inputState.parkingCost;
  useEffect(() => {
    if (modesLoading || !baselineApiResponseData) return;
    fetchData(inputState);
  }, [ stringifiedInputModeSharesForEffect, stringifiedInputPopulationValues, stringifiedInputParkingSupplyValues,
      inputParkingCostForEffect, fetchData, modesLoading, baselineApiResponseData, inputState ]);

  const handleModeShareChange = useCallback((modeKey, newShareRaw) => {
    const newShare = parseFloat(newShareRaw);
    if (isNaN(newShare) || newShare < 0 || newShare > 100) return;
    setInputState(prevState => {
        const currentShares = { ...prevState.modeShares };
        const activeKeys = Object.keys(activeModeSelection).filter(k => activeModeSelection[k]);
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
                    const originalOtherShare = currentShares[k] || 0;
                    let reduction = (originalOtherShare / totalOtherSharesOriginal) * changeInThisMode;
                    newShares[k] = Math.max(0, originalOtherShare - reduction);
                });
            } else if (changeInThisMode < 0 && otherActiveKeys.length > 0) {
                const shareToAdd = -changeInThisMode / otherActiveKeys.length;
                otherActiveKeys.forEach(k => { newShares[k] = (newShares[k] || 0) + shareToAdd; });
            }
        }
        let currentTotal = 0;
        activeKeys.forEach(k => currentTotal += (newShares[k] || 0));
        if (Math.abs(currentTotal - 100) > 0.001 && currentTotal > 0) {
            activeKeys.forEach(k => { newShares[k] = ((newShares[k] || 0) / currentTotal) * 100; });
        }
        let roundedTotal = 0;
        activeKeys.forEach(k => {
            newShares[k] = Math.round((newShares[k] || 0) * 100) / 100;
            roundedTotal += newShares[k];
        });
        if (activeKeys.length > 0 && Math.abs(roundedTotal - 100) > 0.001) {
            const diff = 100 - roundedTotal;
            newShares[modeKey] = (newShares[modeKey] || 0) + diff;
            newShares[modeKey] = Math.round(newShares[modeKey] * 100) / 100;
        }
        activeKeys.forEach(k => { if (newShares[k] < 0) newShares[k] = 0; });
        return { ...prevState, modeShares: newShares };
    });
  }, [activeModeSelection]);

  const handleModeNumericInputCommit = useCallback((modeKey, newNumericValue) => {
    handleModeShareChange(modeKey, newNumericValue);
  }, [handleModeShareChange]);

  const handleReset = useCallback(() => {
    const resetInputStateValues = {
      ...inputState,
      modeShares: { ...baselineModeShares },
      parkingCost: appConfig.defaultParkingCost,
    };
    setInputState(resetInputStateValues);
    fetchData(resetInputStateValues);
  }, [baselineModeShares, appConfig.defaultParkingCost, fetchData, inputState]);

  const handleBaselineNumberInputChange = useCallback((field, value) => {
    setIntermediateNumberInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleBaselineNumberCommit = useCallback((field, value) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      setAppConfig(prev => {
        const newConfig = {...prev, [field]: numericValue};
        if (field === 'numYears' && numericValue !== prev.numYears) {
          setInputState(prevInput => ({
            ...prevInput,
            populationValues: Array(numericValue).fill(prevInput.populationValues[0] || newConfig.quickStartPopulation),
            parkingSupplyValues: Array(numericValue).fill(prevInput.parkingSupplyValues[0] || newConfig.quickStartParkingSupply),
          }));
        }
        return newConfig;
      });
    }
  }, [appConfig.quickStartPopulation, appConfig.quickStartParkingSupply]);

  const handleBaselineModeSelectionChange = useCallback((modeKey, isActive) => {
    setActiveModeSelection(prevActiveSelection => {
      const newActiveSelection = {...prevActiveSelection, [modeKey]: isActive };
      setBaselineModeShares(prevShares => {
        let newShares = {...prevShares};
        const modeFromAvailable = availableModes.find(m => m.key === modeKey);
        const modeDefaultShare = modeFromAvailable?.defaultBaselineShare || 0;
        if (isActive) {
          newShares[modeKey] = prevShares[modeKey] !== undefined ? prevShares[modeKey] : modeDefaultShare;
        } else { delete newShares[modeKey]; }
        let currentTotal = 0;
        const currentActiveKeysInSelection = Object.keys(newActiveSelection).filter(k => newActiveSelection[k] && newShares[k] !== undefined);
        currentActiveKeysInSelection.forEach(k => { currentTotal += newShares[k]; });
        if (currentTotal > 0 && Math.abs(currentTotal - 100) > 0.01) {
          currentActiveKeysInSelection.forEach(k => {
            newShares[k] = (newShares[k] / currentTotal) * 100;
            newShares[k] = Math.round(newShares[k] * 100) / 100;
          });
          let finalSum = 0; let firstActiveKey = null;
          currentActiveKeysInSelection.forEach(k => {
            finalSum += newShares[k]; if (!firstActiveKey) firstActiveKey = k;
          });
          if (firstActiveKey && Math.abs(finalSum - 100) > 0.001) {
            const diff = 100 - finalSum; newShares[firstActiveKey] += diff;
            newShares[firstActiveKey] = Math.round(newShares[firstActiveKey] * 100) / 100;
          }
        } else if (currentActiveKeysInSelection.length === 1 && newActiveSelection[modeKey] && isActive) {
            newShares[modeKey] = 100;
        }
        return newShares;
      });
      return newActiveSelection;
    });
  }, [availableModes]);

  const handleBaselineModeShareValueChange = useCallback((modeKey, newShare) => {
    const numShare = parseFloat(newShare);
    if(!isNaN(numShare) && numShare >= 0 && numShare <= 100) {
        setBaselineModeShares(prevShares => {
            const updatedShares = {...prevShares, [modeKey]: numShare };
            let currentTotal = 0;
            const activeKeys = Object.keys(activeModeSelection).filter(k => activeModeSelection[k] && updatedShares[k] !== undefined);
            activeKeys.forEach(k => currentTotal += updatedShares[k]);
            if (currentTotal > 0 && Math.abs(currentTotal-100) > 0.01) {
                activeKeys.forEach(k => {
                    updatedShares[k] = (updatedShares[k]/currentTotal) * 100;
                    updatedShares[k] = Math.round(updatedShares[k]*100)/100;
                });
                let finalSum = 0;
                if(activeKeys.length > 0 ){
                    activeKeys.forEach(k => finalSum += updatedShares[k]);
                    if(Math.abs(finalSum-100)>0.001){
                        const diff = 100 - finalSum; updatedShares[activeKeys[0]] += diff;
                        updatedShares[activeKeys[0]] = Math.round(updatedShares[activeKeys[0]]*100)/100;
                    }
                }
            }
            return updatedShares;
        });
    }
  }, [activeModeSelection]);

  const handleModeCustomizationChange = useCallback((modeKey, field, value) => {
    setModeCustomizations(prev => ({ ...prev, [modeKey]: { ...(prev[modeKey] || {}), [field]: value, } }));
  }, []);

  console.log("[PROP_DRILL_DEBUG] App.jsx - Value of sortedActiveModeKeysForDisplay before passing to ScenarioPage:",
              JSON.stringify(sortedActiveModeKeysForDisplay));

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
                availableModes={availableModes}
                activeModeSelection={activeModeSelection}
                baselineModeShares={baselineModeShares}
                modeCustomizations={modeCustomizations}
                onBaselineNumberInputChange={handleBaselineNumberInputChange}
                onBaselineNumberCommit={handleBaselineNumberCommit}
                onBaselineModeSelectionChange={handleBaselineModeSelectionChange}
                onBaselineModeShareValueChange={handleBaselineModeShareValueChange}
                onModeCustomizationChange={handleModeCustomizationChange}
              /> } />
        </Routes>
      </Container>
    </ThemeProvider>
  );
}

export default App;