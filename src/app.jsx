// src/App.jsx - FINAL FINAL Corrected Version (No Reassignments Anywhere)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  Container, Typography, CircularProgress, Alert, Box, AppBar, Toolbar, Button,
} from '@mui/material';

// Import Page Components
import ScenarioPage from './pages/ScenarioPage.jsx';
import ModelSetupPage from './pages/ModelSetupPage.jsx';

// Import Configuration Constants
import {
  API_BASE_URL, BASELINE_MODE_SHARES as INITIAL_BASELINE_SHARES,
  DEFAULT_POPULATION_STRING as INITIAL_POP_STRING,
  DEFAULT_PARKING_SUPPLY_STRING as INITIAL_SUPPLY_STRING,
  DEFAULT_PARKING_COST as INITIAL_PARKING_COST, MODES
} from './config';

// Initial Baseline Parameters
const INITIAL_START_YEAR = 2024;
const INITIAL_NUM_YEARS = 5;
const INITIAL_SHOW_RATE = 100;
const INITIAL_QUICK_START_POP = 10000;
const INITIAL_QUICK_GROWTH_RATE = 2.0;
const INITIAL_QUICK_START_SUPPLY = 5000;

// localStorage Key
const LOCALSTORAGE_KEY = 'seaMovesBaselineConfig';

// --- Helper Functions (Defined ONCE with const, OUTSIDE App component) ---
const parseNumericString = (str) => {
  if (!str || typeof str !== 'string') return [];
  return str.split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(Number)
            .filter(n => !isNaN(n));
};
// Ensure NO 'parseNumericString = ...' line follows this

const parseAndFitArray = (str, targetLength) => {
  const parsed = str.split(',')
                   .map(s => s.trim())
                   .filter(s => s !== '')
                   .map(Number)
                   .filter(n => !isNaN(n) && n >= 0);
  if (parsed.length === 0) {
    console.warn("Failed to parse array string or string was empty, defaulting to zeros:", str);
    return Array(Math.max(1, targetLength)).fill(0);
  }
  const safeTargetLength = Math.max(1, targetLength);
  if (parsed.length === safeTargetLength) return parsed;
  else if (parsed.length > safeTargetLength) return parsed.slice(0, safeTargetLength);
  else {
    const lastValue = parsed.length > 0 ? parsed[parsed.length - 1] : 0; // Added check for empty parsed array
    const padding = Array(safeTargetLength - parsed.length).fill(lastValue);
    return [...parsed, ...padding];
  }
};
// Ensure NO 'parseAndFitArray = ...' line follows this

const resizeArray = (originalArray, newLength) => {
    const currentArray = Array.isArray(originalArray) ? originalArray : [];
    const currentLength = currentArray.length;
    if (newLength === currentLength) return currentArray;
    const safeNewLength = Math.max(1, newLength);
    if (safeNewLength < currentLength) {
        return currentArray.slice(0, safeNewLength); // Truncate
    } else {
        const lastValue = currentLength > 0 ? currentArray[currentLength - 1] : 0;
        const padding = Array(safeNewLength - currentLength).fill(lastValue);
        return [...currentArray, ...padding];
    }
};
// Ensure NO 'resizeArray = ...' line follows this

const calculatePopulationArray = (startPop, growthRatePercent, numYears) => {
    const years = Math.max(1, numYears);
    const rate = growthRatePercent / 100.0;
    const popArray = [];
    let currentPop = Math.max(0, startPop);
    for (let i = 0; i < years; i++) {
        popArray.push(Math.round(currentPop));
        currentPop *= (1 + rate);
    }
    return popArray;
};
// Ensure NO 'calculatePopulationArray = ...' line follows this

const calculateSupplyArray = (startSupply, numYears) => {
    const years = Math.max(1, numYears);
    const supply = Math.max(0, startSupply);
    return Array(years).fill(supply);
};
// Ensure NO 'calculateSupplyArray = ...' line follows this

const getInitialBaselineState = () => {
    // ... (logic to load from localStorage or return defaults, using the helpers above) ...
     console.log("Calculating initial baselineState..."); let loadedState = null; try { const storedValue = localStorage.getItem(LOCALSTORAGE_KEY); if (storedValue) { let tempState = JSON.parse(storedValue); console.log("Loaded baseline state from localStorage:", tempState); if (tempState && typeof tempState === 'object' && typeof tempState.startYear === 'number' && typeof tempState.numYears === 'number' && tempState.numYears >= 1 && typeof tempState.showRate === 'number' && typeof tempState.quickStartPopulation === 'number' && typeof tempState.quickAnnualGrowthRate === 'number' && typeof tempState.quickStartParkingSupply === 'number' && Array.isArray(tempState.baselinePopulationValues) && Array.isArray(tempState.baselineParkingSupplyValues) && typeof tempState.baselineModeShares === 'object' && tempState.baselineModeShares !== null && typeof tempState.defaultParkingCost === 'number') { const expectedLength = tempState.numYears; tempState.baselinePopulationValues = resizeArray(tempState.baselinePopulationValues, expectedLength); tempState.baselineParkingSupplyValues = resizeArray(tempState.baselineParkingSupplyValues, expectedLength); loadedState = tempState; } else { console.warn("Loaded state has invalid structure/missing keys or invalid numYears, using defaults."); } } } catch (error) { console.error("Error reading/parsing baseline state from localStorage:", error); } if (loadedState) { return loadedState; } else { console.log("Using initial default baseline state."); const initialPopArray = calculatePopulationArray(INITIAL_QUICK_START_POP, INITIAL_QUICK_GROWTH_RATE, INITIAL_NUM_YEARS); const initialSupplyArray = calculateSupplyArray(INITIAL_QUICK_START_SUPPLY, INITIAL_NUM_YEARS); return { startYear: INITIAL_START_YEAR, numYears: INITIAL_NUM_YEARS, showRate: INITIAL_SHOW_RATE, quickStartPopulation: INITIAL_QUICK_START_POP, quickAnnualGrowthRate: INITIAL_QUICK_GROWTH_RATE, quickStartParkingSupply: INITIAL_QUICK_START_SUPPLY, baselinePopulationValues: initialPopArray, baselineParkingSupplyValues: initialSupplyArray, baselineModeShares: { ...INITIAL_BASELINE_SHARES }, defaultParkingCost: INITIAL_PARKING_COST, }; }
};
// Ensure NO 'getInitialBaselineState = ...' line follows this


// --- Main Application Component ---
function App() {

  // --- Calculate Initial State Values BEFORE useState ---
  const initialBaseline = getInitialBaselineState();
  const initialInputs = {
      populationValues: [...initialBaseline.baselinePopulationValues],
      parkingSupplyValues: [...initialBaseline.baselineParkingSupplyValues],
      parkingCost: initialBaseline.defaultParkingCost,
      modeShares: { ...initialBaseline.baselineModeShares },
  };

  // --- State (Initialize using the pre-calculated initial values) ---
  const [baselineState, setBaselineState] = useState(initialBaseline);
  const [inputState, setInputState] = useState(initialInputs);
  const [apiResponseData, setApiResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUserChange, setLastUserChange] = useState({ mode: null, value: null });
  const initialFetchDone = useRef(false);

  // --- Persistence Effect ---
  useEffect(() => {
       try { console.log("Saving baseline state to localStorage:", baselineState); localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(baselineState)); } catch (error) { console.error("Error saving baseline state to localStorage:", error); }
  }, [baselineState]);

  // --- Data Fetching (useCallback) ---
  const fetchData = useCallback(debounce(async (
    currentInputState, currentBaselineState, changedModeKey, changedModeValue
    ) => {
      // ... (fetch logic - NO CHANGES) ...
      console.log("fetchData called..."); setIsLoading(true); setError(null); const populationPayload = currentInputState.populationValues; const supplyPayload = currentInputState.parkingSupplyValues; const costPayload = Number(currentInputState.parkingCost); const showRatePayload = Number(currentBaselineState.showRate) || 100; let preFetchError = null; if (!Array.isArray(populationPayload) || populationPayload.length === 0) preFetchError = "Population data is missing or invalid."; else if (!Array.isArray(supplyPayload) || supplyPayload.length === 0) preFetchError = "Parking Supply data is missing or invalid."; else if (populationPayload.length !== supplyPayload.length) preFetchError = `Data length mismatch: Population (${populationPayload.length}) vs Parking Supply (${supplyPayload.length}).`; else if (isNaN(costPayload) || costPayload < 0) preFetchError = "Invalid Parking Cost."; else if (isNaN(showRatePayload) || showRatePayload <= 0 || showRatePayload > 100) preFetchError = "Invalid Show Rate."; else if (populationPayload.length !== currentBaselineState.numYears) preFetchError = `Population data length (${populationPayload.length}) does not match Number of Years (${currentBaselineState.numYears}). Reset scenario?`; else if (supplyPayload.length !== currentBaselineState.numYears) preFetchError = `Parking Supply data length (${supplyPayload.length}) does not match Number of Years (${currentBaselineState.numYears}). Reset scenario?`; if (preFetchError) { console.warn(`fetchData validation failed: ${preFetchError}`); setError(preFetchError); setIsLoading(false); setApiResponseData(null); return; } const payload = { mode_shares_input: currentInputState.modeShares, population_per_year: populationPayload, parking_supply_per_year: supplyPayload, parking_cost_per_space: costPayload, show_rate_percent: showRatePayload, changed_mode_key: changedModeKey, new_value_percent: changedModeValue }; try { console.log("Sending payload:", payload); const response = await axios.post(`${API_BASE_URL}/api/calculate`, payload); console.log("Received API response:", response.data); setApiResponseData(response.data); setInputState(currentState => { const backendShares = response.data.processed_mode_shares; if (backendShares) { let changed = false; const numericBackendShares = {}; for (const mode in backendShares) { const backendNum = Number(backendShares[mode]); numericBackendShares[mode] = backendNum; if (String(currentState.modeShares[mode]) !== String(backendNum)) { changed = true; } } if (changed) { console.log("Backend shares differ, updating inputState.modeShares"); return { ...currentState, modeShares: numericBackendShares }; } } return currentState; }); } catch (err) { console.error("API Error:", err); const errorMsg = err.response?.data?.error || err.message || "Failed to fetch data"; setError(errorMsg); setApiResponseData(null); } finally { setIsLoading(false); }
  }, 500), [API_BASE_URL]);

  // --- Effect Hook for API Calls ---
   useEffect(() => {
       // ... (useEffect logic - NO CHANGES) ...
       if (!initialFetchDone.current) { initialFetchDone.current = true; console.log("Initial Fetch Triggered"); fetchData(inputState, baselineState, null, null); return; } console.log("Effect triggered by change in dependencies."); fetchData(inputState, baselineState, lastUserChange.mode, lastUserChange.value); return () => { fetchData.cancel(); };
   }, [
       inputState.populationValues, inputState.parkingSupplyValues, inputState.parkingCost,
       inputState.modeShares, lastUserChange, baselineState.showRate, baselineState.numYears, fetchData
    ]);

  // --- Event Handlers (Defined ONCE WITH CONST inside App) ---
  const handleInputChange = (event) => { const { name, value } = event.target; if (name.startsWith('modeShares.')) { const mode = name.split('.')[1]; setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: value } })); } else { console.warn("Unhandled input change on Scenario Page:", name); } };
  const handleModeShareChange = (mode, newValue) => { const numericValue = typeof newValue === 'number' ? newValue : 0; setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: numericValue } })); setLastUserChange({ mode: mode, value: numericValue }); };
  const handleModeNumericInputCommit = (mode, commitedValue) => { setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: commitedValue } })); setLastUserChange({ mode: mode, value: commitedValue }); };
  const handleReset = () => { console.log("Resetting scenario inputs to baseline:", baselineState); setInputState({ populationValues: [...baselineState.baselinePopulationValues], parkingSupplyValues: [...baselineState.baselineParkingSupplyValues], parkingCost: baselineState.defaultParkingCost, modeShares: { ...baselineState.baselineModeShares }, }); setError(null); setLastUserChange({ mode: null, value: null }); };
  const handleBaselineNumberChange = (event) => { const { name, value } = event.target; let numericValue = Number(value); if (name === 'numYears') numericValue = Math.max(1, Math.min(50, Math.round(numericValue))); else if (name === 'startYear') numericValue = Math.max(1900, Math.min(2100, Math.round(numericValue))); else if (name === 'showRate') numericValue = Math.max(0, Math.min(100, numericValue)); else if (name === 'defaultParkingCost') numericValue = Math.max(0, numericValue); else { console.warn("Unhandled numeric baseline change:", name); return; } console.log(`Baseline ${name} change:`, numericValue); setBaselineState(prevState => { const newState = { ...prevState, [name]: numericValue }; if (name === 'numYears' && numericValue !== prevState.numYears) { console.log(`Resizing arrays from ${prevState.numYears} to ${numericValue} years.`); newState.baselinePopulationValues = resizeArray(prevState.baselinePopulationValues, numericValue); newState.baselineParkingSupplyValues = resizeArray(prevState.baselineParkingSupplyValues, numericValue); } return newState; }); };
  const handleBaselineQuickPopChange = (event) => { const { name, value } = event.target; const numericValue = Number(value); setBaselineState(prevState => { let newQuickPop = prevState.quickStartPopulation; let newGrowthRate = prevState.quickAnnualGrowthRate; if (name === 'quickStartPopulation') { newQuickPop = Math.max(0, numericValue || 0); } else if (name === 'quickAnnualGrowthRate') { newGrowthRate = numericValue; } else { return prevState; } const newPopArray = calculatePopulationArray(newQuickPop, newGrowthRate, prevState.numYears); return { ...prevState, quickStartPopulation: newQuickPop, quickAnnualGrowthRate: newGrowthRate, baselinePopulationValues: newPopArray }; }); };
  const handleBaselineQuickSupplyChange = (event) => { const { name, value } = event.target; if (name !== 'quickStartParkingSupply') return; const numericValue = Math.max(0, Number(value) || 0); setBaselineState(prevState => { const newQuickSupply = numericValue; const newSupplyArray = calculateSupplyArray(newQuickSupply, prevState.numYears); return { ...prevState, quickStartParkingSupply: newQuickSupply, baselineParkingSupplyValues: newSupplyArray }; }); };
  const handleBaselineModeShareChange = (mode, newValue) => { const numericValue = Math.max(0, Math.min(100, Number(newValue) || 0)); console.log("Baseline Mode change:", mode, numericValue); setBaselineState(prevState => ({ ...prevState, baselineModeShares: { ...prevState.baselineModeShares, [mode]: numericValue } })); };
  const handleBaselineArrayValueChange = (arrayName, index, newValue) => { const numericValue = Math.max(0, Number(newValue) || 0); console.log(`Baseline ${arrayName}[${index}] change:`, numericValue); setBaselineState(prevState => { const newArray = [...prevState[arrayName]]; if (index >= 0 && index < newArray.length) newArray[index] = numericValue; return { ...prevState, [arrayName]: newArray }; }); };

  // --- Style Function for NavLinks (Defined ONCE WITH CONST inside App) ---
  const getNavLinkStyle = ({ isActive }) => ({ color: 'white', textDecoration: 'none', fontWeight: isActive ? 'bold' : 'normal', borderBottom: isActive ? '2px solid #ffeb3b' : 'none', marginRight: '15px', paddingBottom: '4px', borderRadius: 0 });

  // --- JSX Rendering ---
  return (
    <>
      {/* ... AppBar ... */}
      <AppBar position="static" sx={{ mb: 3, bgcolor: '#004d40' }}> <Toolbar> <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}> SEA MOVES </Typography> <Button component={NavLink} to="/" style={getNavLinkStyle}> Scenario Tool </Button> <Button component={NavLink} to="/setup" style={getNavLinkStyle}> Model Setup </Button> </Toolbar> </AppBar>
      <Container maxWidth="xl">
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Routes>
            {/* Pass props */}
            <Route path="/" element={ <ScenarioPage inputState={inputState} apiResponseData={apiResponseData} isLoading={isLoading} modes={MODES} onInputChange={handleInputChange} onModeShareChange={handleModeShareChange} onModeNumericInputCommit={handleModeNumericInputCommit} onReset={handleReset} numYears={baselineState.numYears} startYear={baselineState.startYear} /> } />
            <Route path="/setup" element={ <ModelSetupPage baselineState={baselineState} modes={MODES} onBaselineNumberChange={handleBaselineNumberChange} onBaselineModeShareChange={handleBaselineModeShareChange} onBaselineArrayValueChange={handleBaselineArrayValueChange} onBaselineQuickPopChange={handleBaselineQuickPopChange} onBaselineQuickSupplyChange={handleBaselineQuickSupplyChange} /> } />
          </Routes>
      </Container>
    </>
  );
}

export default App;