// src/App.jsx - V2.2 + Step 1 Modifications (Pass props to ScenarioPage)

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
  DEFAULT_POPULATION_STRING as INITIAL_POP_STRING, // Keep even if unused directly here
  DEFAULT_PARKING_SUPPLY_STRING as INITIAL_SUPPLY_STRING, // Keep even if unused directly here
  DEFAULT_PARKING_COST as INITIAL_PARKING_COST, MODES
} from './config';

// Initial Baseline Parameters (Constants) - These define the *defaults* if localStorage is empty/invalid
const INITIAL_START_YEAR = 2024;
const INITIAL_NUM_YEARS = 5;
const INITIAL_SHOW_RATE = 100;
const INITIAL_QUICK_START_POP = 10000;
const INITIAL_QUICK_GROWTH_RATE = 2.0;
const INITIAL_QUICK_START_SUPPLY = 5000;

// localStorage Key
const LOCALSTORAGE_KEY = 'seaMovesBaselineConfig';

// --- Helper Functions (Defined ONCE with const, OUTSIDE App component) ---
// NOTE: These helpers are primarily for the SETUP page and INITIAL baseline calculation
// They are NOT used for the main scenario API call payload generation.
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
            // Check for essential keys and valid types/values
            if (tempState && typeof tempState === 'object' &&
                typeof tempState.startYear === 'number' && tempState.startYear >= 1900 && tempState.startYear <= 2100 &&
                typeof tempState.numYears === 'number' && tempState.numYears >= 1 && tempState.numYears <= 50 &&
                typeof tempState.showRate === 'number' && tempState.showRate >= 0 && tempState.showRate <= 100 &&
                typeof tempState.quickStartPopulation === 'number' && tempState.quickStartPopulation >= 0 &&
                typeof tempState.quickAnnualGrowthRate === 'number' &&
                typeof tempState.quickStartParkingSupply === 'number' && tempState.quickStartParkingSupply >= 0 &&
                Array.isArray(tempState.baselinePopulationValues) && // Check if array exists
                Array.isArray(tempState.baselineParkingSupplyValues) && // Check if array exists
                typeof tempState.baselineModeShares === 'object' && tempState.baselineModeShares !== null &&
                typeof tempState.defaultParkingCost === 'number' && tempState.defaultParkingCost >= 0)
            {
                 console.log("Helper: Loaded state structure seems valid.");
                 // Ensure arrays match numYears after loading
                 const expectedLength = tempState.numYears;
                 tempState.baselinePopulationValues = resizeArray(tempState.baselinePopulationValues, expectedLength);
                 tempState.baselineParkingSupplyValues = resizeArray(tempState.baselineParkingSupplyValues, expectedLength);
                 loadedState = tempState; // Assign validated & potentially resized state
            } else {
                 console.warn("Helper: Loaded state has invalid structure/missing keys or invalid values, using defaults.");
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
        // Calculate initial arrays based on default quick start params
        const initialPopArray = calculatePopulationArray(INITIAL_QUICK_START_POP, INITIAL_QUICK_GROWTH_RATE, INITIAL_NUM_YEARS);
        const initialSupplyArray = calculateSupplyArray(INITIAL_QUICK_START_SUPPLY, INITIAL_NUM_YEARS);
        return {
          startYear: INITIAL_START_YEAR, numYears: INITIAL_NUM_YEARS, showRate: INITIAL_SHOW_RATE,
          quickStartPopulation: INITIAL_QUICK_START_POP, quickAnnualGrowthRate: INITIAL_QUICK_GROWTH_RATE,
          quickStartParkingSupply: INITIAL_QUICK_START_SUPPLY,
          baselinePopulationValues: initialPopArray, // Use calculated defaults
          baselineParkingSupplyValues: initialSupplyArray, // Use calculated defaults
          baselineModeShares: { ...INITIAL_BASELINE_SHARES }, // Use configured defaults
          defaultParkingCost: INITIAL_PARKING_COST, // Use configured default
        };
    }
};


// --- Main Application Component ---
function App() {

  // --- Calculate Initial State Values ONCE before useState ---
  const initialBaseline = getInitialBaselineState();
  // Initial input state MIRRORS the initial baseline state
  const initialInputs = {
      populationValues: [...initialBaseline.baselinePopulationValues],
      parkingSupplyValues: [...initialBaseline.baselineParkingSupplyValues],
      parkingCost: initialBaseline.defaultParkingCost,
      modeShares: { ...initialBaseline.baselineModeShares },
  };
  // Initial state for intermediate string inputs on Setup page
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
  const [isLoading, setIsLoading] = useState(true); // Start true for initial fetch
  const [error, setError] = useState(null); // For API errors
  const [lastUserChange, setLastUserChange] = useState({ mode: null, value: null }); // To track specific mode share interaction
  const initialFetchDone = useRef(false); // To prevent double fetch on mount


  // --- Persistence Effect ---
  // Saves baselineState to localStorage whenever it changes.
  useEffect(() => {
       try {
           console.log("Effect: Saving baseline state to localStorage:", baselineState);
           localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(baselineState));
       } catch (error) {
           console.error("Effect: Error saving baseline state to localStorage:", error);
       }
  }, [baselineState]);


  // --- Data Fetching (useCallback with debounce) ---
  // This fetches the results for the INTERACTIVE scenario based on inputState
  const fetchData = useCallback(debounce(async (
    currentInputState, currentBaselineState, changedModeKey, changedModeValue
    ) => {
      console.log("fetchData: CALLED WITH", "mode:", changedModeKey, "value:", changedModeValue);
      setIsLoading(true);
      setError(null); // Clear previous errors

      // --- Payload Preparation & Validation ---
      const populationPayload = currentInputState.populationValues;
      const supplyPayload = currentInputState.parkingSupplyValues;
      const costPayload = Number(currentInputState.parkingCost); // Use interactive cost
      const showRatePayload = Number(currentBaselineState.showRate); // Use baseline showRate
      let preFetchError = null;

       if (!Array.isArray(populationPayload) || populationPayload.length === 0) preFetchError = "Population data is missing or invalid.";
       else if (!Array.isArray(supplyPayload) || supplyPayload.length === 0) preFetchError = "Parking Supply data is missing or invalid.";
       else if (populationPayload.length !== supplyPayload.length) preFetchError = `Data length mismatch: Population (${populationPayload.length}) vs Parking Supply (${supplyPayload.length}).`;
       else if (isNaN(costPayload) || costPayload < 0) preFetchError = "Invalid Parking Cost.";
       else if (isNaN(showRatePayload) || showRatePayload < 0 || showRatePayload > 100) preFetchError = "Invalid Show Rate."; // Changed check to allow 0
       // Check against numYears from baseline (source of truth for length)
       else if (populationPayload.length !== currentBaselineState.numYears) preFetchError = `Population data length (${populationPayload.length}) does not match Number of Years (${currentBaselineState.numYears}). Reset scenario?`;
       else if (supplyPayload.length !== currentBaselineState.numYears) preFetchError = `Parking Supply data length (${supplyPayload.length}) does not match Number of Years (${currentBaselineState.numYears}). Reset scenario?`;

      if (preFetchError) {
          console.warn("fetchData: Validation failed:", preFetchError);
          setError(preFetchError);
          setIsLoading(false);
          setApiResponseData(null); // Clear data on validation error
          return;
      }

      const payload = {
          mode_shares_input: currentInputState.modeShares,
          population_per_year: populationPayload,
          parking_supply_per_year: supplyPayload,
          parking_cost_per_space: costPayload, // Send interactive cost
          show_rate_percent: showRatePayload, // Send baseline show rate
          changed_mode_key: changedModeKey, // For backend balancing logic
          new_value_percent: changedModeValue // For backend balancing logic
      };
      // --- End Payload Preparation ---


      // --- API Call ---
      try {
        console.log("fetchData: Sending payload:", payload);
        const response = await axios.post(`${API_BASE_URL}/api/calculate`, payload);
        console.log("fetchData: Received API response:", response.data);
        setApiResponseData(response.data); // Set the response data

        // --- State Synchronization (Optional but recommended) ---
        // If backend returns adjusted shares, update frontend input state to match
        setInputState(currentState => {
          const backendShares = response.data?.processed_mode_shares;
          if (backendShares) {
            let changed = false;
            const numericBackendShares = {};
            // Convert backend shares to numbers for comparison
            for (const mode in backendShares) {
                const backendNum = Number(backendShares[mode]);
                numericBackendShares[mode] = backendNum;
                // Check if frontend state differs significantly (handle float precision)
                if (Math.abs(Number(currentState.modeShares[mode]) - backendNum) > 1e-7) {
                    changed = true;
                }
            }
            if (changed) {
                console.log("fetchData: Backend shares differ, updating inputState.modeShares");
                // Return new state object with updated modeShares
                return { ...currentState, modeShares: numericBackendShares };
            }
          }
          // If no change needed, return the current state
          return currentState;
        });
        // --- End State Synchronization ---

      } catch (err) {
          console.error("fetchData: API Error:", err);
          // Extract error message from backend response if possible
          const errorMsg = err.response?.data?.error || err.message || "Failed to fetch data";
          setError(errorMsg);
          setApiResponseData(null); // Clear data on API error
      } finally {
          setIsLoading(false); // Ensure loading is set to false
      }
      // --- End API Call ---

  }, 500), [API_BASE_URL]); // Dependency: API_BASE_URL (if it could change)


  // --- Effect Hook for API Calls ---
  // Triggers fetchData when relevant state changes
   useEffect(() => {
       // Only run the initial fetch once after mount
       if (!initialFetchDone.current) {
           initialFetchDone.current = true;
           console.log("Effect: Initial Fetch Triggered");
           // Use initial state values for the very first fetch
           fetchData(initialInputs, initialBaseline, null, null);
           return; // Prevent immediate second fetch due to state updates from first fetch
       }

       // Subsequent fetches triggered by changes in dependencies
       console.log("Effect: RUNNING. lastUserChange:", lastUserChange);
       // Pass current state and the specific user interaction info
       fetchData(inputState, baselineState, lastUserChange.mode, lastUserChange.value);

       // Cleanup function for debounce
       return () => {
           fetchData.cancel(); // Cancel any pending debounced calls if component unmounts or dependencies change quickly
       };
   }, [ // Dependencies that trigger a recalculation of the INTERACTIVE scenario
       inputState, // Check whole object for simplicity, fine with debounce
       // Include specific baseline values if they influence the interactive scenario PAYLOAD (like showRate)
       baselineState.showRate,
       baselineState.numYears, // Needed for validation checks inside fetchData
       // lastUserChange is implicitly covered by inputState dependency
       fetchData // Include the debounced function itself
       // Removed population/supply/cost from inputState dependencies as they are inside inputState object
    ]);


  // --- Event Handlers (Defined ONCE WITH CONST using useCallback where beneficial) ---

  // Handles direct input changes on Scenario Page (if any inputs existed there)
  // Currently unused in V2.2 ScenarioPage but kept for potential future use
  const handleInputChange = useCallback((event) => {
      const { name, value } = event.target;
      if (name.startsWith('modeShares.')) {
          const mode = name.split('.')[1];
          // NOTE: This direct handler might bypass the intended debounce/lastUserChange logic
          // Prefer using handleModeShareChange for mode share updates.
          setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: value } }));
      } else {
          console.warn("Handler: Unhandled input change on Scenario Page:", name);
      }
  }, []); // No dependencies, safe for useCallback

  // Handles slider/numeric input changes for MODE SHARES (preferred method)
  const handleModeShareChange = useCallback((mode, newValue) => {
      // Ensure value is somewhat numeric before setting state/triggering fetch
      const numericValue = Number(newValue);
      if (isNaN(numericValue)) {
          console.warn(`Handler: Invalid non-numeric value passed for mode ${mode}:`, newValue);
          return; // Or handle as needed (e.g., reset to previous value?)
      }
      // Update the input state immediately for responsive UI
      setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: numericValue } }));
      // Track the specific change that should trigger the backend re-balancing
      setLastUserChange({ mode: mode, value: numericValue });
      console.log(`Handler: Mode share change - Mode: ${mode}, Value: ${numericValue}`);
  }, []); // No dependencies, safe for useCallback

  // Handles commit from numeric text inputs for MODE SHARES
  // Ensures the final committed value triggers the fetch
  const handleModeNumericInputCommit = useCallback((mode, commitedValue) => {
      // Update state (might be redundant if handleModeShareChange already did, but safe)
      setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: commitedValue } }));
      // Ensure this final value is used for the fetch trigger
      setLastUserChange({ mode: mode, value: commitedValue });
      console.log(`Handler: Mode share commit - Mode: ${mode}, Value: ${commitedValue}`);
  }, []); // No dependencies, safe for useCallback

  // Resets the interactive scenario inputs back to the current baseline values
  const handleReset = useCallback(() => {
      console.log("Handler: Resetting scenario inputs to baseline:", baselineState);
      // Reset inputState based on the CURRENT baselineState
      setInputState({
          populationValues: [...baselineState.baselinePopulationValues],
          parkingSupplyValues: [...baselineState.baselineParkingSupplyValues],
          parkingCost: baselineState.defaultParkingCost, // Reset interactive cost to baseline default
          modeShares: { ...baselineState.baselineModeShares },
      });
      // Also reset the intermediate number inputs on the setup page to match baseline
      setIntermediateNumberInputs({
          startYear: String(baselineState.startYear),
          numYears: String(baselineState.numYears),
          showRate: String(baselineState.showRate),
          defaultParkingCost: String(baselineState.defaultParkingCost),
          quickStartPopulation: String(baselineState.quickStartPopulation),
          quickAnnualGrowthRate: String(baselineState.quickAnnualGrowthRate),
          quickStartParkingSupply: String(baselineState.quickStartParkingSupply),
      });
      setError(null); // Clear any existing errors
      setLastUserChange({ mode: null, value: null }); // Reset last change tracker
      // The useEffect hook will trigger fetchData due to inputState change
  }, [baselineState]); // Depends on baselineState

  // --- Handlers for Model Setup Page ---

  // Updates the intermediate string state as the user types in baseline number fields
  const handleBaselineNumberInputChange = useCallback((event) => {
      const { name, value } = event.target;
      console.log(`Handler: Intermediate change ${name}: '${value}'`);
      setIntermediateNumberInputs(prevState => ({ ...prevState, [name]: value }));
  }, []); // No dependencies needed

  // Commits the intermediate number input to the actual baselineState after validation/blur
  const handleBaselineNumberCommit = useCallback((event) => {
      const { name } = event.target;
      const value = intermediateNumberInputs[name]; // Get value from intermediate state
      let numericValue;

      // Convert to number, handling empty string as null temporarily
      if (value === null || value === undefined || String(value).trim() === '') {
          numericValue = null;
      } else {
          numericValue = Number(value);
      }

      // If conversion failed (and input wasn't empty), revert intermediate state and return
      if (isNaN(numericValue) && value !== null && String(value).trim() !== '') {
          console.warn(`Handler: Invalid number commit for ${name}: '${value}'. Reverting intermediate input.`);
          // Revert intermediate input back to the current value in baselineState
          setIntermediateNumberInputs(prevState => ({ ...prevState, [name]: String(baselineState[name]) }));
          return;
      }

      console.log(`Handler: Committing ${name}:`, numericValue);

      // Update baselineState
      setBaselineState(prevState => {
          let valueToUse = numericValue;
          // Assign defaults if user cleared the field (numericValue is null)
           if (valueToUse === null) {
               switch (name) {
                   case 'numYears': valueToUse = 1; break;
                   case 'startYear': valueToUse = INITIAL_START_YEAR; break; // Use constant default
                   case 'showRate': valueToUse = INITIAL_SHOW_RATE; break; // Use constant default
                   case 'defaultParkingCost': valueToUse = INITIAL_PARKING_COST; break; // Use constant default
                   case 'quickStartPopulation': valueToUse = 0; break; // Default to 0
                   case 'quickAnnualGrowthRate': valueToUse = 0; break; // Default to 0
                   case 'quickStartParkingSupply': valueToUse = 0; break; // Default to 0
                   default: valueToUse = 0; break; // General fallback
               }
               console.log(`Handler: Input for ${name} cleared, using default:`, valueToUse);
           }

           // Clamp values within reasonable ranges
           let finalValue = valueToUse;
           switch (name) {
               case 'numYears': finalValue = Math.max(1, Math.min(50, Math.round(finalValue))); break;
               case 'startYear': finalValue = Math.max(1900, Math.min(2100, Math.round(finalValue))); break;
               case 'showRate': finalValue = Math.max(0, Math.min(100, finalValue)); break; // Allow 0 show rate
               case 'defaultParkingCost': finalValue = Math.max(0, Math.round(finalValue)); break;
               case 'quickStartPopulation': finalValue = Math.max(0, Math.round(finalValue)); break;
               case 'quickAnnualGrowthRate': finalValue = Math.max(-100, Math.min(100, finalValue)); break; // Allow negative growth
               case 'quickStartParkingSupply': finalValue = Math.max(0, Math.round(finalValue)); break;
           }

           // If the clamped value hasn't changed, just ensure intermediate matches and return
           if (finalValue === prevState[name]) {
               console.log(`Handler: Baseline ${name} - value unchanged after commit/clamping (${finalValue}), ensuring intermediate matches.`);
               setIntermediateNumberInputs(prevIntermediate => ({ ...prevIntermediate, [name]: String(finalValue) }));
               return prevState;
           }

          console.log(`Handler: Baseline ${name} setting final state value:`, finalValue);
          const newState = { ...prevState, [name]: finalValue };

          // Recalculate derived arrays if relevant inputs changed
          if (name === 'numYears' || name === 'quickStartPopulation' || name === 'quickAnnualGrowthRate') {
              newState.baselinePopulationValues = calculatePopulationArray(newState.quickStartPopulation, newState.quickAnnualGrowthRate, newState.numYears);
              console.log("Handler: Recalculated baselinePopulationValues:", newState.baselinePopulationValues);
          }
          if (name === 'numYears' || name === 'quickStartParkingSupply') {
              newState.baselineParkingSupplyValues = calculateSupplyArray(newState.quickStartParkingSupply, newState.numYears);
              console.log("Handler: Recalculated baselineParkingSupplyValues:", newState.baselineParkingSupplyValues);
          }

          // Ensure intermediate input string matches the final committed numeric value
          setIntermediateNumberInputs(prevIntermediate => ({ ...prevIntermediate, [name]: String(finalValue) }));

          return newState; // Return the updated baseline state
      });
  }, [intermediateNumberInputs, baselineState]); // Depends on intermediate and baseline states

  // Handles changes to baseline mode shares on the setup page
  const handleBaselineModeShareChange = useCallback((mode, newValue) => {
      const numericValue = Math.max(0, Math.min(100, Number(newValue) || 0));
      console.log("Handler: Baseline Mode change:", mode, numericValue);
      setBaselineState(prevState => ({
          ...prevState,
          baselineModeShares: { ...prevState.baselineModeShares, [mode]: numericValue }
      }));
  }, []); // No dependencies

  // Handles changes to baseline population/supply array values on the setup page
  const handleBaselineArrayValueChange = useCallback((arrayName, index, newValue) => {
      const numericValue = Math.max(0, Number(newValue) || 0);
      console.log(`Handler: Baseline ${arrayName}[${index}] change:`, numericValue);
      setBaselineState(prevState => {
          const newArray = [...prevState[arrayName]];
          if (index >= 0 && index < newArray.length) {
              newArray[index] = numericValue;
          }
          return { ...prevState, [arrayName]: newArray };
      });
  }, []); // No dependencies


  // --- Style Function for NavLink ---
  const getNavLinkStyle = ({ isActive }) => ({
    color: 'white',
    textDecoration: 'none',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? '2px solid #ffeb3b' : 'none', // Example active style
    marginRight: '15px',
    paddingBottom: '4px',
    borderRadius: 0, // Flat bottom edge
    transition: 'border-bottom 0.2s ease-in-out', // Smooth transition
  });


  // --- JSX Rendering ---
  return (
    <>
      {/* --- Navigation AppBar --- */}
      <AppBar position="static" sx={{ mb: 3, bgcolor: '#004d40' }}> {/* Example color */}
          <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  SEA MOVES {/* Or your app name */}
              </Typography>
              <Button component={NavLink} to="/" style={getNavLinkStyle}>
                  Scenario Tool
              </Button>
              <Button component={NavLink} to="/setup" style={getNavLinkStyle}>
                  Model Setup
              </Button>
          </Toolbar>
      </AppBar>

      {/* --- Main Content Area --- */}
      <Container maxWidth="xl"> {/* Use extra-large container */}
          {/* Display global errors */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* --- Routing --- */}
          <Routes>
            {/* Scenario Page Route */}
            <Route
                path="/"
                element={
                    <ScenarioPage
                        // **** ADDED/MODIFIED PROPS for Step 1 ****
                        baselineState={baselineState}
                        loadingError={error} // Pass the main error state
                        actualYears={Array.from({ length: baselineState.numYears }, (_, i) => baselineState.startYear + i)} // Calculate and pass years

                        // --- Existing V2.2 props ---
                        inputState={inputState}
                        apiResponseData={apiResponseData}
                        isLoading={isLoading}
                        modes={MODES}
                        onInputChange={handleInputChange} // Keep if needed by child controls?
                        onModeShareChange={handleModeShareChange}
                        onModeNumericInputCommit={handleModeNumericInputCommit}
                        onReset={handleReset}
                        // Pass startYear/numYears for potential direct use if needed, though actualYears is preferred
                        startYear={baselineState.startYear}
                        numYears={baselineState.numYears}
                    />
                }
            />

            {/* Model Setup Page Route */}
            <Route
                path="/setup"
                element={
                    <ModelSetupPage
                        // Pass necessary state and handlers
                        baselineState={baselineState}
                        intermediateNumberInputs={intermediateNumberInputs}
                        modes={MODES}
                        onBaselineNumberInputChange={handleBaselineNumberInputChange}
                        onBaselineNumberCommit={handleBaselineNumberCommit}
                        onBaselineModeShareChange={handleBaselineModeShareChange}
                        onBaselineArrayValueChange={handleBaselineArrayValueChange}
                     />
                 }
             />
          </Routes>
          {/* --- End Routing --- */}

      </Container>
      {/* --- End Main Content Area --- */}
    </>
  );
} // End of App component

export default App; // MUST be at top level