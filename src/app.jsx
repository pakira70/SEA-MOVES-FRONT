// src/App.jsx - Corrected State Initialization and useEffect Deps

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Box,
  AppBar,
  Toolbar,
  Button,
} from '@mui/material';

// Import Page Components
import ScenarioPage from './pages/ScenarioPage.jsx'; // Verify path
import ModelSetupPage from './pages/ModelSetupPage.jsx'; // Verify path

// Import Configuration Constants
import {
  API_BASE_URL,
  BASELINE_MODE_SHARES as INITIAL_BASELINE_SHARES,
  DEFAULT_POPULATION_STRING as INITIAL_POP_STRING,
  DEFAULT_PARKING_SUPPLY_STRING as INITIAL_SUPPLY_STRING,
  DEFAULT_PARKING_COST as INITIAL_PARKING_COST,
  MODES
} from './config'; // Verify path

// Helper function
const parseNumericString = (str) => {
  if (!str || typeof str !== 'string') return [];
  return str.split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(Number)
            .filter(n => !isNaN(n));
};

// --- Main Application Component ---
function App() {

  // --- State ---

  // 1. Configurable Baselines/Defaults (Initialized directly in useState)
  const [baselineState, setBaselineState] = useState({
      baselineModeShares: { ...INITIAL_BASELINE_SHARES },
      defaultPopulationString: INITIAL_POP_STRING,
      defaultParkingSupplyString: INITIAL_SUPPLY_STRING,
      defaultParkingCost: INITIAL_PARKING_COST,
  });
  // REMOVED incorrect reassignment line

  // 2. Interactive Scenario Inputs (Initialized using baselineState values in useState)
  const [inputState, setInputState] = useState({
    modeShares: { ...baselineState.baselineModeShares }, // Use initial baseline values
    populationString: baselineState.defaultPopulationString,
    parkingSupplyString: baselineState.defaultParkingSupplyString,
    parkingCost: baselineState.defaultParkingCost,
  });
   // REMOVED incorrect reassignment line

  // 3. API/UI State
  const [apiResponseData, setApiResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 4. Tracking User Actions
  const [lastUserChange, setLastUserChange] = useState({ mode: null, value: null });
  const initialFetchDone = useRef(false);

  // --- Data Fetching ---
  const fetchData = useCallback(debounce(async (
      currentInputState, changedModeKey, changedModeValue
      ) => {
        console.log("fetchData called...");
        setIsLoading(true);
        setError(null);

        const modeSharesPayload = currentInputState.modeShares;
        const populationPayload = parseNumericString(currentInputState.populationString);
        const supplyPayload = parseNumericString(currentInputState.parkingSupplyString);
        const costPayload = Number(currentInputState.parkingCost);

        let preFetchError = null;
        if (populationPayload.length === 0) preFetchError = "Population data is required.";
        else if (supplyPayload.length === 0) preFetchError = "Parking Supply data is required.";
        else if (isNaN(costPayload) || costPayload < 0) preFetchError = "Invalid Parking Cost (must be non-negative number).";
        else if (populationPayload.length > 0 && supplyPayload.length > 0 && populationPayload.length !== supplyPayload.length) {
             preFetchError = `Input Count Mismatch: Population (${populationPayload.length}) vs Parking Supply (${supplyPayload.length}).`;
        }
        if (preFetchError) {
            console.warn(`fetchData validation failed: ${preFetchError}`);
            setError(preFetchError); setIsLoading(false); setApiResponseData(null); return;
        }

        const payload = {
          mode_shares_input: modeSharesPayload, population_per_year: populationPayload,
          parking_supply_per_year: supplyPayload, parking_cost_per_space: costPayload,
          changed_mode_key: changedModeKey, new_value_percent: changedModeValue
        };

        try {
          const response = await axios.post(`${API_BASE_URL}/api/calculate`, payload);
          setApiResponseData(response.data);
          setInputState(currentState => {
              const backendShares = response.data.processed_mode_shares;
              if (backendShares) {
                   let changed = false; const numericBackendShares = {};
                   for (const mode in backendShares) {
                       const backendNum = Number(backendShares[mode]);
                       numericBackendShares[mode] = backendNum;
                       if (String(currentState.modeShares[mode]) !== String(backendNum)) { changed = true; }
                   }
                   if (changed) {
                       console.log("Backend shares differ, updating inputState.modeShares");
                       return { ...currentState, modeShares: numericBackendShares };
                   }
              }
              return currentState;
          });
        } catch (err) {
          console.error("API Error:", err);
          const errorMsg = err.response?.data?.error || err.message || "Failed to fetch data";
          setError(errorMsg); setApiResponseData(null);
        } finally { setIsLoading(false); }
  }, 500), [API_BASE_URL]);

  // --- Effect Hook for API Calls (Corrected Dependencies) ---
   useEffect(() => {
       if (!initialFetchDone.current) {
           initialFetchDone.current = true;
           console.log("Initial Fetch Triggered");
           // Use the state that was just initialized for the first fetch
           fetchData(inputState, null, null);
           return;
       }
       console.log("Effect triggered by change in dependencies.");
       fetchData(inputState, lastUserChange.mode, lastUserChange.value);
       return () => { fetchData.cancel(); };
   }, [
       // Dependencies that indicate user interaction or non-mode data change
       inputState.populationString,
       inputState.parkingSupplyString,
       inputState.parkingCost,
       lastUserChange, // Captures committed mode changes
       fetchData // Stable callback
       // REMOVED inputState.modeShares
    ]);

  // --- Event Handlers (Scenario Inputs - defined with const) ---
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name.startsWith('modeShares.')) {
        const mode = name.split('.')[1];
        setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: value } }));
    } else {
        setInputState(prevState => ({ ...prevState, [name]: value })); // Will trigger useEffect
    }
  };

  const handleModeShareChange = (mode, newValue) => {
    const numericValue = typeof newValue === 'number' ? newValue : 0;
    setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: numericValue } }));
    setLastUserChange({ mode: mode, value: numericValue }); // Will trigger useEffect
  };

  const handleModeNumericInputCommit = (mode, commitedValue) => {
    setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: commitedValue } }));
    setLastUserChange({ mode: mode, value: commitedValue }); // Will trigger useEffect
  };

  // --- Event Handler (Reset Button - defined with const) ---
  const handleReset = () => {
    console.log("Resetting scenario inputs to baseline:", baselineState);
    const resetScenarioState = {
      modeShares: { ...baselineState.baselineModeShares },
      populationString: baselineState.defaultPopulationString,
      parkingSupplyString: baselineState.defaultParkingSupplyString,
      parkingCost: baselineState.defaultParkingCost,
    };
    setInputState(resetScenarioState); // Will trigger useEffect
    setError(null);
    setLastUserChange({ mode: null, value: null });
  };

  // --- Event Handlers (Baseline Config - defined with const) ---
  const handleBaselineChange = (event) => {
      const { name, value } = event.target;
      console.log("Baseline change:", name, value);
      setBaselineState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleBaselineModeShareChange = (mode, newValue) => {
      const numericValue = Math.max(0, Math.min(100, Number(newValue) || 0));
      console.log("Baseline Mode change:", mode, numericValue);
      setBaselineState(prevState => ({
          ...prevState,
          baselineModeShares: { ...prevState.baselineModeShares, [mode]: numericValue }
      }));
  };

  // --- Style Function for NavLinks ---
  const getNavLinkStyle = ({ isActive }) => ({
    color: 'white', textDecoration: 'none', fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? '2px solid #ffeb3b' : 'none', marginRight: '15px',
    paddingBottom: '4px', borderRadius: 0
  });

  // --- JSX Rendering ---
  return (
    <>
      {/* Navigation */}
      <AppBar position="static" sx={{ mb: 3, bgcolor: '#004d40' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}> SEA MOVES </Typography>
          <Button component={NavLink} to="/" style={getNavLinkStyle}> Scenario Tool </Button>
          <Button component={NavLink} to="/setup" style={getNavLinkStyle}> Model Setup </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Container maxWidth="xl">
          {/* Global Error Display */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Routes - Always Rendered */}
          <Routes>
            {/* Scenario Page Route */}
            <Route
              path="/"
              element={
                <ScenarioPage
                  inputState={inputState}
                  apiResponseData={apiResponseData}
                  isLoading={isLoading} // Pass loading state down
                  modes={MODES}
                  onInputChange={handleInputChange}
                  onModeShareChange={handleModeShareChange}
                  onModeNumericInputCommit={handleModeNumericInputCommit}
                  onReset={handleReset}
                />
              }
            />
            {/* Model Setup Page Route */}
            <Route
              path="/setup"
              element={
                <ModelSetupPage
                  baselineState={baselineState}
                  modes={MODES}
                  onBaselineChange={handleBaselineChange}
                  onBaselineModeShareChange={handleBaselineModeShareChange}
                />
              }
            />
          </Routes>
      </Container>
    </>
  );
}

export default App;