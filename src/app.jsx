// src/App.jsx - CLEAN V2.1 - Intermediate State Handling

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

// Initial Baseline Parameters (Constants)
const INITIAL_START_YEAR = 2024;
const INITIAL_NUM_YEARS = 5;
const INITIAL_SHOW_RATE = 100;
const INITIAL_QUICK_START_POP = 10000;
const INITIAL_QUICK_GROWTH_RATE = 2.0;
const INITIAL_QUICK_START_SUPPLY = 5000;

// localStorage Key
const LOCALSTORAGE_KEY = 'seaMovesBaselineConfig';

// --- Helper Functions (Defined ONCE with const, OUTSIDE App component) ---
const parseNumericString = (str) => { if (!str || typeof str !== 'string') return []; return str.split(',').map(s => s.trim()).filter(s => s !== '').map(Number).filter(n => !isNaN(n)); };
const parseAndFitArray = (str, targetLength) => { const parsed = str.split(',').map(s => s.trim()).filter(s => s !== '').map(Number).filter(n => !isNaN(n) && n >= 0); if (parsed.length === 0) { console.warn("Helper: Failed to parse array string or string was empty, defaulting to zeros:", str); return Array(Math.max(1, targetLength)).fill(0); } const safeTargetLength = Math.max(1, targetLength); if (parsed.length === safeTargetLength) return parsed; else if (parsed.length > safeTargetLength) return parsed.slice(0, safeTargetLength); else { const lastValue = parsed.length > 0 ? parsed[parsed.length - 1] : 0; const padding = Array(safeTargetLength - parsed.length).fill(lastValue); return [...parsed, ...padding]; } };
const resizeArray = (originalArray, newLength) => { const currentArray = Array.isArray(originalArray) ? originalArray : []; const currentLength = currentArray.length; if (newLength === currentLength) return currentArray; const safeNewLength = Math.max(1, newLength); if (safeNewLength < currentLength) { return currentArray.slice(0, safeNewLength); } else { const lastValue = currentLength > 0 ? currentArray[currentLength - 1] : 0; const padding = Array(safeNewLength - currentLength).fill(lastValue); return [...currentArray, ...padding]; } };
const calculatePopulationArray = (startPop, growthRatePercent, numYears) => { const years = Math.max(1, numYears); const rate = growthRatePercent / 100.0; const popArray = []; let currentPop = Math.max(0, startPop); for (let i = 0; i < years; i++) { popArray.push(Math.round(currentPop)); currentPop *= (1 + rate); } return popArray; };
const calculateSupplyArray = (startSupply, numYears) => { const years = Math.max(1, numYears); const supply = Math.max(0, startSupply); return Array(years).fill(supply); };

const getInitialBaselineState = () => {
    console.log("Helper: Calculating initial baselineState...");
    let loadedState = null;
    try {
        const storedValue = localStorage.getItem(LOCALSTORAGE_KEY);
        if (storedValue) {
            let tempState = JSON.parse(storedValue);
            // --- Start Validation of Loaded State ---
            if (tempState && typeof tempState === 'object' &&
                typeof tempState.startYear === 'number' &&
                typeof tempState.numYears === 'number' && tempState.numYears >= 1 &&
                typeof tempState.showRate === 'number' &&
                typeof tempState.quickStartPopulation === 'number' &&
                typeof tempState.quickAnnualGrowthRate === 'number' &&
                typeof tempState.quickStartParkingSupply === 'number' &&
                Array.isArray(tempState.baselinePopulationValues) &&
                Array.isArray(tempState.baselineParkingSupplyValues) &&
                typeof tempState.baselineModeShares === 'object' && tempState.baselineModeShares !== null &&
                typeof tempState.defaultParkingCost === 'number')
            {
                 console.log("Helper: Loaded state structure seems valid.");
                 // Ensure arrays match numYears after loading
                 const expectedLength = tempState.numYears;
                 tempState.baselinePopulationValues = resizeArray(tempState.baselinePopulationValues, expectedLength);
                 tempState.baselineParkingSupplyValues = resizeArray(tempState.baselineParkingSupplyValues, expectedLength);
                 loadedState = tempState; // Assign validated & potentially resized state
            } else {
                 console.warn("Helper: Loaded state has invalid structure/missing keys or invalid numYears, using defaults.");
                 // loadedState remains null
            }
            // --- End Validation ---
        }
    } catch (error) { console.error("Helper: Error reading/parsing baseline state from localStorage:", error); }

    if (loadedState) {
        console.log("Helper: Returning loaded baseline state.");
        return loadedState;
    } else {
        console.log("Helper: Returning initial default baseline state.");
        const initialPopArray = calculatePopulationArray(INITIAL_QUICK_START_POP, INITIAL_QUICK_GROWTH_RATE, INITIAL_NUM_YEARS);
        const initialSupplyArray = calculateSupplyArray(INITIAL_QUICK_START_SUPPLY, INITIAL_NUM_YEARS);
        return {
          startYear: INITIAL_START_YEAR, numYears: INITIAL_NUM_YEARS, showRate: INITIAL_SHOW_RATE,
          quickStartPopulation: INITIAL_QUICK_START_POP, quickAnnualGrowthRate: INITIAL_QUICK_GROWTH_RATE,
          quickStartParkingSupply: INITIAL_QUICK_START_SUPPLY, baselinePopulationValues: initialPopArray,
          baselineParkingSupplyValues: initialSupplyArray, baselineModeShares: { ...INITIAL_BASELINE_SHARES },
          defaultParkingCost: INITIAL_PARKING_COST,
        };
    }
};


// --- Main Application Component ---
function App() {

  // --- Calculate Initial State Values ONCE before useState ---
  const initialBaseline = getInitialBaselineState();
  const initialInputs = {
      populationValues: [...initialBaseline.baselinePopulationValues],
      parkingSupplyValues: [...initialBaseline.baselineParkingSupplyValues],
      parkingCost: initialBaseline.defaultParkingCost,
      modeShares: { ...initialBaseline.baselineModeShares },
  };
  // Initial state for intermediate string inputs
  const initialIntermediateNumbers = {
      startYear: String(initialBaseline.startYear),
      numYears: String(initialBaseline.numYears),
      showRate: String(initialBaseline.showRate),
      defaultParkingCost: String(initialBaseline.defaultParkingCost),
      quickStartPopulation: String(initialBaseline.quickStartPopulation),
      quickAnnualGrowthRate: String(initialBaseline.quickAnnualGrowthRate),
      quickStartParkingSupply: String(initialBaseline.quickStartParkingSupply),
  };


  // --- State Hooks ---
  const [baselineState, setBaselineState] = useState(initialBaseline);
  const [inputState, setInputState] = useState(initialInputs);
  const [intermediateNumberInputs, setIntermediateNumberInputs] = useState(initialIntermediateNumbers);
  const [apiResponseData, setApiResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUserChange, setLastUserChange] = useState({ mode: null, value: null });
  const initialFetchDone = useRef(false);


  // --- Persistence Effect ---
  useEffect(() => {
       try { console.log("Effect: Saving baseline state to localStorage:", baselineState); localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(baselineState)); } catch (error) { console.error("Effect: Error saving baseline state to localStorage:", error); }
  }, [baselineState]);


  // --- Data Fetching (useCallback) ---
  const fetchData = useCallback(debounce(async (
    currentInputState, currentBaselineState, changedModeKey, changedModeValue
    ) => {
      console.log("fetchData: CALLED WITH", "mode:", changedModeKey, "value:", changedModeValue);
      setIsLoading(true); setError(null);
      const populationPayload = currentInputState.populationValues;
      const supplyPayload = currentInputState.parkingSupplyValues;
      const costPayload = Number(currentInputState.parkingCost);
      const showRatePayload = Number(currentBaselineState.showRate) || 100;
      let preFetchError = null;
      // Validation checks...
       if (!Array.isArray(populationPayload) || populationPayload.length === 0) preFetchError = "Population data is missing or invalid.";
       else if (!Array.isArray(supplyPayload) || supplyPayload.length === 0) preFetchError = "Parking Supply data is missing or invalid.";
       else if (populationPayload.length !== supplyPayload.length) preFetchError = `Data length mismatch: Population (${populationPayload.length}) vs Parking Supply (${supplyPayload.length}).`;
       else if (isNaN(costPayload) || costPayload < 0) preFetchError = "Invalid Parking Cost.";
       else if (isNaN(showRatePayload) || showRatePayload <= 0 || showRatePayload > 100) preFetchError = "Invalid Show Rate.";
       else if (populationPayload.length !== currentBaselineState.numYears) preFetchError = `Population data length (${populationPayload.length}) does not match Number of Years (${currentBaselineState.numYears}). Reset scenario?`;
       else if (supplyPayload.length !== currentBaselineState.numYears) preFetchError = `Parking Supply data length (${supplyPayload.length}) does not match Number of Years (${currentBaselineState.numYears}). Reset scenario?`;
      if (preFetchError) { console.warn("fetchData: Validation failed:", preFetchError); setError(preFetchError); setIsLoading(false); setApiResponseData(null); return; }
      // Payload creation...
      const payload = { mode_shares_input: currentInputState.modeShares, population_per_year: populationPayload, parking_supply_per_year: supplyPayload, parking_cost_per_space: costPayload, show_rate_percent: showRatePayload, changed_mode_key: changedModeKey, new_value_percent: changedModeValue };
      // API Call...
      try {
        console.log("fetchData: Sending payload:", payload); const response = await axios.post(`${API_BASE_URL}/api/calculate`, payload); console.log("fetchData: Received API response:", response.data); setApiResponseData(response.data);
        // State sync...
        setInputState(currentState => {
          const backendShares = response.data.processed_mode_shares;
          if (backendShares) {
            let changed = false; const numericBackendShares = {};
            for (const mode in backendShares) { const backendNum = Number(backendShares[mode]); numericBackendShares[mode] = backendNum; if (String(currentState.modeShares[mode]) !== String(backendNum)) { changed = true; } }
            if (changed) { console.log("fetchData: Backend shares differ, updating inputState.modeShares"); return { ...currentState, modeShares: numericBackendShares }; }
          }
          return currentState;
        });
      } catch (err) { console.error("fetchData: API Error:", err); const errorMsg = err.response?.data?.error || err.message || "Failed to fetch data"; setError(errorMsg); setApiResponseData(null);
      } finally { setIsLoading(false); }
  }, 500), [API_BASE_URL]);


  // --- Effect Hook for API Calls ---
   useEffect(() => {
       if (!initialFetchDone.current) { initialFetchDone.current = true; console.log("Effect: Initial Fetch Triggered"); fetchData(inputState, baselineState, null, null); return; }
       console.log("Effect: RUNNING. lastUserChange:", lastUserChange);
       fetchData(inputState, baselineState, lastUserChange.mode, lastUserChange.value);
       return () => { fetchData.cancel(); };
   }, [ // Dependencies
       inputState.populationValues, inputState.parkingSupplyValues, inputState.parkingCost,
       lastUserChange, baselineState.showRate, baselineState.numYears, fetchData
    ]);


  // --- Event Handlers (Defined ONCE WITH CONST) ---
  const handleInputChange = (event) => { const { name, value } = event.target; if (name.startsWith('modeShares.')) { const mode = name.split('.')[1]; setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: value } })); } else { console.warn("Handler: Unhandled input change on Scenario Page:", name); } };
  const handleModeShareChange = (mode, newValue) => { const numericValue = typeof newValue === 'number' ? newValue : 0; setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: numericValue } })); setLastUserChange({ mode: mode, value: numericValue }); };
  const handleModeNumericInputCommit = (mode, commitedValue) => { setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: commitedValue } })); setLastUserChange({ mode: mode, value: commitedValue }); };
  const handleReset = () => { console.log("Handler: Resetting scenario inputs to baseline:", baselineState); setInputState({ populationValues: [...baselineState.baselinePopulationValues], parkingSupplyValues: [...baselineState.baselineParkingSupplyValues], parkingCost: baselineState.defaultParkingCost, modeShares: { ...baselineState.baselineModeShares }, }); setIntermediateNumberInputs({ startYear: String(baselineState.startYear), numYears: String(baselineState.numYears), showRate: String(baselineState.showRate), defaultParkingCost: String(baselineState.defaultParkingCost), quickStartPopulation: String(baselineState.quickStartPopulation), quickAnnualGrowthRate: String(baselineState.quickAnnualGrowthRate), quickStartParkingSupply: String(baselineState.quickStartParkingSupply), }); setError(null); setLastUserChange({ mode: null, value: null }); };

  const handleBaselineNumberInputChange = (event) => {
      const { name, value } = event.target;
      console.log(`Handler: Intermediate change ${name}: '${value}'`);
      setIntermediateNumberInputs(prevState => ({ ...prevState, [name]: value }));
  };

  const handleBaselineNumberCommit = (event) => {
      const { name } = event.target;
      const value = intermediateNumberInputs[name];
      let numericValue;
      if (value === null || value === undefined || value.trim() === '') { numericValue = null; } else { numericValue = Number(value); }
      if (isNaN(numericValue) && value !== null && value.trim() !== '') { console.warn(`Handler: Invalid number commit for ${name}: '${value}'. Reverting intermediate input.`); setIntermediateNumberInputs(prevState => ({ ...prevState, [name]: String(baselineState[name]) })); return; }
      console.log(`Handler: Committing ${name}:`, numericValue);
      setBaselineState(prevState => {
          let valueToClamp = numericValue;
          if (valueToClamp === null) { if (name === 'numYears') valueToClamp = 1; else if (name === 'startYear') valueToClamp = 1900; else if (name === 'showRate') valueToClamp = 0; else if (name === 'defaultParkingCost') valueToClamp = 0; else if (name === 'quickStartPopulation') valueToClamp = 0; else if (name === 'quickAnnualGrowthRate') valueToClamp = 0; else if (name === 'quickStartParkingSupply') valueToClamp = 0; else valueToClamp = 0; }
           let finalValue = valueToClamp;
           if (name === 'numYears') finalValue = Math.max(1, Math.min(50, Math.round(finalValue)));
           else if (name === 'startYear') finalValue = Math.max(1900, Math.min(2100, Math.round(finalValue)));
           else if (name === 'showRate') finalValue = Math.max(0, Math.min(100, finalValue));
           else if (name === 'defaultParkingCost') finalValue = Math.max(0, Math.round(finalValue));
           else if (name === 'quickStartPopulation') finalValue = Math.max(0, Math.round(finalValue));
           else if (name === 'quickAnnualGrowthRate') finalValue = Math.max(-100, Math.min(100, finalValue));
           else if (name === 'quickStartParkingSupply') finalValue = Math.max(0, Math.round(finalValue));
           if (finalValue === prevState[name]) { console.log(`Handler: Baseline ${name} - value unchanged after commit/clamping (${finalValue}), ensuring intermediate matches.`); setIntermediateNumberInputs(prevIntermediate => ({ ...prevIntermediate, [name]: String(finalValue) })); return prevState; }
          console.log(`Handler: Baseline ${name} setting final state value:`, finalValue);
          const newState = { ...prevState, [name]: finalValue };
          if (name === 'numYears' || name === 'quickStartPopulation' || name === 'quickAnnualGrowthRate') { newState.baselinePopulationValues = calculatePopulationArray(newState.quickStartPopulation, newState.quickAnnualGrowthRate, newState.numYears); }
          if (name === 'numYears' || name === 'quickStartParkingSupply') { newState.baselineParkingSupplyValues = calculateSupplyArray(newState.quickStartParkingSupply, newState.numYears); }
          setIntermediateNumberInputs(prevIntermediate => ({ ...prevIntermediate, [name]: String(finalValue) }));
          return newState;
      });
  };

  const handleBaselineModeShareChange = (mode, newValue) => { const numericValue = Math.max(0, Math.min(100, Number(newValue) || 0)); console.log("Handler: Baseline Mode change:", mode, numericValue); setBaselineState(prevState => ({ ...prevState, baselineModeShares: { ...prevState.baselineModeShares, [mode]: numericValue } })); };
  const handleBaselineArrayValueChange = (arrayName, index, newValue) => { const numericValue = Math.max(0, Number(newValue) || 0); console.log(`Handler: Baseline ${arrayName}[${index}] change:`, numericValue); setBaselineState(prevState => { const newArray = [...prevState[arrayName]]; if (index >= 0 && index < newArray.length) newArray[index] = numericValue; return { ...prevState, [arrayName]: newArray }; }); };

  // --- Style Function ---
  const getNavLinkStyle = ({ isActive }) => ({ color: 'white', textDecoration: 'none', fontWeight: isActive ? 'bold' : 'normal', borderBottom: isActive ? '2px solid #ffeb3b' : 'none', marginRight: '15px', paddingBottom: '4px', borderRadius: 0 });


  // --- JSX Rendering ---
  return (
    <>
      <AppBar position="static" sx={{ mb: 3, bgcolor: '#004d40' }}>
          <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}> SEA MOVES </Typography>
              <Button component={NavLink} to="/" style={getNavLinkStyle}> Scenario Tool </Button>
              <Button component={NavLink} to="/setup" style={getNavLinkStyle}> Model Setup </Button>
          </Toolbar>
      </AppBar>
      <Container maxWidth="xl">
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Routes>
            {/* Scenario Page Route */}
            <Route path="/" element={
                <ScenarioPage
                    inputState={inputState} apiResponseData={apiResponseData} isLoading={isLoading} modes={MODES}
                    onInputChange={handleInputChange} onModeShareChange={handleModeShareChange}
                    onModeNumericInputCommit={handleModeNumericInputCommit} onReset={handleReset}
                    numYears={baselineState.numYears} startYear={baselineState.startYear} />
            }/>
            {/* Model Setup Page Route */}
            <Route path="/setup" element={
                <ModelSetupPage
                    baselineState={baselineState}
                    intermediateNumberInputs={intermediateNumberInputs} // Pass intermediate state
                    modes={MODES}
                    // Pass correct handlers
                    onBaselineNumberInputChange={handleBaselineNumberInputChange}
                    onBaselineNumberCommit={handleBaselineNumberCommit}
                    onBaselineModeShareChange={handleBaselineModeShareChange}
                    onBaselineArrayValueChange={handleBaselineArrayValueChange}
                 />
             }/>
          </Routes>
      </Container>
    </>
  );
} // End of App component

export default App; // MUST be at top level