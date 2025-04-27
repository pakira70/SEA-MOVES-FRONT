// src/App.jsx - COMPLETE CODE with Infinite Loop Fix

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
    // console.log("Helper: Calculating initial baselineState..."); // Less noisy log
    let loadedState = null;
    try {
        const storedValue = localStorage.getItem(LOCALSTORAGE_KEY);
        if (storedValue) {
            let tempState = JSON.parse(storedValue);
            if (tempState && typeof tempState === 'object' &&
                typeof tempState.startYear === 'number' && tempState.startYear >= 1900 && tempState.startYear <= 2100 &&
                typeof tempState.numYears === 'number' && tempState.numYears >= 1 && tempState.numYears <= 50 &&
                typeof tempState.showRate === 'number' && tempState.showRate >= 0 && tempState.showRate <= 100 &&
                typeof tempState.quickStartPopulation === 'number' && tempState.quickStartPopulation >= 0 &&
                typeof tempState.quickAnnualGrowthRate === 'number' &&
                typeof tempState.quickStartParkingSupply === 'number' && tempState.quickStartParkingSupply >= 0 &&
                Array.isArray(tempState.baselinePopulationValues) &&
                Array.isArray(tempState.baselineParkingSupplyValues) &&
                typeof tempState.baselineModeShares === 'object' && tempState.baselineModeShares !== null &&
                typeof tempState.defaultParkingCost === 'number' && tempState.defaultParkingCost >= 0)
            {
                 // console.log("Helper: Loaded state structure seems valid."); // Less noisy log
                 const expectedLength = tempState.numYears;
                 tempState.baselinePopulationValues = resizeArray(tempState.baselinePopulationValues, expectedLength);
                 tempState.baselineParkingSupplyValues = resizeArray(tempState.baselineParkingSupplyValues, expectedLength);
                 loadedState = tempState;
            } else {
                 console.warn("Helper: Loaded state has invalid structure/missing keys or invalid values, using defaults.");
            }
        }
    } catch (error) { console.error("Helper: Error reading/parsing baseline state from localStorage:", error); }

    if (loadedState) {
        // console.log("Helper: Returning loaded baseline state."); // Less noisy log
        return loadedState;
    } else {
        console.log("Helper: Returning initial default baseline state.");
        const initialPopArray = calculatePopulationArray(INITIAL_QUICK_START_POP, INITIAL_QUICK_GROWTH_RATE, INITIAL_NUM_YEARS);
        const initialSupplyArray = calculateSupplyArray(INITIAL_QUICK_START_SUPPLY, INITIAL_NUM_YEARS);
        return {
          startYear: INITIAL_START_YEAR, numYears: INITIAL_NUM_YEARS, showRate: INITIAL_SHOW_RATE,
          quickStartPopulation: INITIAL_QUICK_START_POP, quickAnnualGrowthRate: INITIAL_QUICK_GROWTH_RATE,
          quickStartParkingSupply: INITIAL_QUICK_START_SUPPLY,
          baselinePopulationValues: initialPopArray,
          baselineParkingSupplyValues: initialSupplyArray,
          baselineModeShares: { ...INITIAL_BASELINE_SHARES },
          defaultParkingCost: INITIAL_PARKING_COST,
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
  // Baseline configuration state (persisted)
  const [baselineState, setBaselineState] = useState(initialBaseline);
  // Interactive scenario input state
  const [inputState, setInputState] = useState(initialInputs);
  // Intermediate text input state for Setup page
  const [intermediateNumberInputs, setIntermediateNumberInputs] = useState(initialIntermediateNumbers);
  // API response for the interactive scenario
  const [apiResponseData, setApiResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading for interactive scenario
  const [error, setError] = useState(null); // Error for interactive scenario
  // API response for the BASELINE scenario
  const [baselineApiResponseData, setBaselineApiResponseData] = useState(null);
  const [baselineIsLoading, setBaselineIsLoading] = useState(true); // Loading for baseline scenario
  const [baselineError, setBaselineError] = useState(null); // Error for baseline scenario

  // Tracking user input for balancing logic
  const [lastUserChange, setLastUserChange] = useState({ mode: null, value: null });
  // Refs to prevent double fetch on mount
  const initialFetchDone = useRef(false);
  const initialBaselineFetchDone = useRef(false);


  // --- Persistence Effect ---
  // Saves baselineState to localStorage whenever it changes.
  useEffect(() => {
       try {
           // console.log("Effect: Saving baseline state to localStorage:", baselineState); // Less noisy log
           localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(baselineState));
       } catch (error) {
           console.error("Effect: Error saving baseline state to localStorage:", error);
       }
  }, [baselineState]);


  // --- Data Fetching (INTERACTIVE Scenario - Debounced) ---
  const fetchData = useCallback(debounce(async (
    currentInputState, currentBaselineState, changedModeKey, changedModeValue
    ) => {
      console.log("fetchData (Interactive): CALLED WITH", "mode:", changedModeKey, "value:", changedModeValue);
      setIsLoading(true);
      setError(null);

      // Payload Preparation & Validation
      const populationPayload = currentInputState.populationValues;
      const supplyPayload = currentInputState.parkingSupplyValues;
      const costPayload = Number(currentInputState.parkingCost);
      const showRatePayload = Number(currentBaselineState.showRate);
      let preFetchError = null;

       if (!Array.isArray(populationPayload) || populationPayload.length === 0) preFetchError = "Population data is missing or invalid.";
       else if (!Array.isArray(supplyPayload) || supplyPayload.length === 0) preFetchError = "Parking Supply data is missing or invalid.";
       else if (populationPayload.length !== supplyPayload.length) preFetchError = `Data length mismatch: Population (${populationPayload.length}) vs Parking Supply (${supplyPayload.length}).`;
       else if (isNaN(costPayload) || costPayload < 0) preFetchError = "Invalid Parking Cost.";
       else if (isNaN(showRatePayload) || showRatePayload < 0 || showRatePayload > 100) preFetchError = "Invalid Show Rate.";
       else if (populationPayload.length !== currentBaselineState.numYears) preFetchError = `Population data length (${populationPayload.length}) does not match Number of Years (${currentBaselineState.numYears}). Reset scenario?`;
       else if (supplyPayload.length !== currentBaselineState.numYears) preFetchError = `Parking Supply data length (${supplyPayload.length}) does not match Number of Years (${currentBaselineState.numYears}). Reset scenario?`;

      if (preFetchError) {
          console.warn("fetchData (Interactive): Validation failed:", preFetchError);
          setError(preFetchError);
          setIsLoading(false);
          setApiResponseData(null);
          return;
      }

      const payload = {
          mode_shares_input: currentInputState.modeShares,
          population_per_year: populationPayload,
          parking_supply_per_year: supplyPayload,
          parking_cost_per_space: costPayload,
          show_rate_percent: showRatePayload,
          changed_mode_key: changedModeKey, // For backend balancing logic
          new_value_percent: changedModeValue // For backend balancing logic
      };

      // API Call
      try {
        console.log("fetchData (Interactive): Sending payload:", payload);
        const response = await axios.post(`${API_BASE_URL}/api/calculate`, payload);
        console.log("fetchData (Interactive): Received API response:", response.data);
        setApiResponseData(response.data);

        // --- State Synchronization ---
        // This check compares the CURRENT inputState with the backend response
        // BEFORE potentially setting state. This helps prevent unnecessary state updates
        // if the backend simply confirmed the values already present in the frontend.
        setInputState(currentState => {
          const backendShares = response.data?.processed_mode_shares;
          if (backendShares) {
            let needsUpdate = false;
            const numericBackendShares = {};
            // Convert backend shares to numbers and check against current state
            for (const mode in backendShares) {
                const backendNum = Number(backendShares[mode]);
                numericBackendShares[mode] = backendNum;
                // Use a tolerance for floating point comparison
                if (Math.abs(Number(currentState.modeShares[mode]) - backendNum) > 1e-7) {
                    needsUpdate = true;
                }
            }
            // Also check if the number of keys differs (e.g., backend added/removed a mode?)
            if (Object.keys(currentState.modeShares).length !== Object.keys(numericBackendShares).length) {
                needsUpdate = true;
            }

            if (needsUpdate) {
                console.log("fetchData (Interactive): Backend shares differ, synchronizing inputState.modeShares");
                // Return new state object ONLY if an update is needed
                return { ...currentState, modeShares: numericBackendShares };
            } else {
                 console.log("fetchData (Interactive): Backend shares match frontend, no state update needed.");
            }
          }
          // If no update needed, return the current state reference to avoid re-render trigger
          return currentState;
        });
        // --- End State Synchronization ---

      } catch (err) {
          console.error("fetchData (Interactive): API Error:", err);
          const errorMsg = err.response?.data?.error || err.message || "Failed to fetch interactive scenario data";
          setError(errorMsg);
          setApiResponseData(null);
      } finally {
          setIsLoading(false);
      }
  }, 500), [API_BASE_URL]); // Dependency: API_BASE_URL


  // --- Data Fetching (BASELINE Scenario - NOT Debounced) ---
  const fetchBaselineData = useCallback(async (currentBaselineState) => {
    console.log("fetchBaselineData: CALLED");
    setBaselineIsLoading(true);
    setBaselineError(null);

    // --- Payload Preparation & Validation ---
    const populationPayload = currentBaselineState.baselinePopulationValues;
    const supplyPayload = currentBaselineState.baselineParkingSupplyValues;
    const costPayload = Number(currentBaselineState.defaultParkingCost);
    const showRatePayload = Number(currentBaselineState.showRate);
    const modeSharesPayload = currentBaselineState.baselineModeShares;
    let preFetchError = null;

    if (!Array.isArray(populationPayload) || populationPayload.length === 0) preFetchError = "Baseline Population data is missing or invalid.";
    else if (!Array.isArray(supplyPayload) || supplyPayload.length === 0) preFetchError = "Baseline Parking Supply data is missing or invalid.";
    else if (populationPayload.length !== supplyPayload.length) preFetchError = `Baseline Data length mismatch: Population (${populationPayload.length}) vs Parking Supply (${supplyPayload.length}).`;
    else if (isNaN(costPayload) || costPayload < 0) preFetchError = "Invalid Baseline Parking Cost.";
    else if (isNaN(showRatePayload) || showRatePayload < 0 || showRatePayload > 100) preFetchError = "Invalid Baseline Show Rate.";
    else if (!modeSharesPayload || typeof modeSharesPayload !== 'object') preFetchError = "Invalid Baseline Mode Shares.";
    else if (populationPayload.length !== currentBaselineState.numYears) preFetchError = `Baseline Population data length (${populationPayload.length}) does not match Number of Years (${currentBaselineState.numYears}).`;
    else if (supplyPayload.length !== currentBaselineState.numYears) preFetchError = `Baseline Parking Supply data length (${supplyPayload.length}) does not match Number of Years (${currentBaselineState.numYears}).`;

    if (preFetchError) {
        console.warn("fetchBaselineData: Validation failed:", preFetchError);
        setBaselineError(preFetchError);
        setBaselineIsLoading(false);
        setBaselineApiResponseData(null);
        return;
    }

    const payload = {
        mode_shares_input: modeSharesPayload,
        population_per_year: populationPayload,
        parking_supply_per_year: supplyPayload,
        parking_cost_per_space: costPayload,
        show_rate_percent: showRatePayload,
    };
    // --- End Payload Preparation ---

    // --- API Call ---
    try {
      console.log("fetchBaselineData: Sending payload:", payload);
      const response = await axios.post(`${API_BASE_URL}/api/calculate`, payload);
      console.log("fetchBaselineData: Received API response:", response.data);
      setBaselineApiResponseData(response.data);

    } catch (err) {
        console.error("fetchBaselineData: API Error:", err);
        const errorMsg = err.response?.data?.error || err.message || "Failed to fetch baseline data";
        setBaselineError(errorMsg);
        setBaselineApiResponseData(null);
    } finally {
        setBaselineIsLoading(false);
    }
    // --- End API Call ---

  }, [API_BASE_URL]); // Dependency: API_BASE_URL


  // --- Effect Hook for INTERACTIVE API Calls ---
  // ***** INFINITE LOOP FIX APPLIED HERE *****
   useEffect(() => {
       // Only run the initial fetch once after mount
       if (!initialFetchDone.current) {
           initialFetchDone.current = true;
           console.log("Effect (Interactive): Initial Fetch Triggered");
           // Pass the *current* state values for the very first fetch
           fetchData(inputState, baselineState, null, null);
           return; // Prevent immediate second fetch
       }

       // Subsequent fetches triggered by dependencies below
       console.log("Effect (Interactive): RUNNING. Triggered By:", { lastUserChange, showRate: baselineState.showRate, numYears: baselineState.numYears });
       // Pass current state and the specific user interaction info
       fetchData(inputState, baselineState, lastUserChange.mode, lastUserChange.value);

       // Cleanup function for debounce
       return () => {
           fetchData.cancel();
       };
   }, [ // Dependencies that trigger a recalculation of the INTERACTIVE scenario
       // --- Trigger based on user input commit ---
       lastUserChange, // This object changes only when user interaction is committed

       // --- Trigger based on relevant baseline changes ---
       baselineState.showRate, // Affects interactive payload
       baselineState.numYears, // Needed for validation inside fetchData

       // --- Include the fetchData function itself ---
       fetchData
       // NOTE: We DO NOT include inputState here directly. The effect reads the *current* inputState
       // when it runs, but changing inputState via setInputState inside fetchData's sync logic
       // will NOT trigger the effect again unless the sync logic *also* updates lastUserChange (it doesn't).
    ]);


  // --- Effect Hook for BASELINE API Calls ---
  useEffect(() => {
        if (!initialBaselineFetchDone.current) {
            initialBaselineFetchDone.current = true;
            console.log("Effect (Baseline): Initial Fetch Triggered");
            fetchBaselineData(baselineState); // Fetch with current (initial) baseline state
            return;
        }

        console.log("Effect (Baseline): RUNNING due to baselineState change.");
        fetchBaselineData(baselineState);

  }, [
      // Dependencies: All parts of baselineState that define the baseline scenario
      baselineState.baselineModeShares,
      baselineState.baselinePopulationValues,
      baselineState.baselineParkingSupplyValues,
      baselineState.defaultParkingCost,
      baselineState.showRate,
      baselineState.numYears,
      // startYear technically doesn't affect API payload but is part of baseline definition
      baselineState.startYear,
      fetchBaselineData // Include the function itself
  ]);


  // --- Event Handlers (Defined ONCE WITH CONST using useCallback where beneficial) ---

  // Handles direct input changes on Scenario Page (if any - currently unused)
  const handleInputChange = useCallback((event) => {
      const { name, value } = event.target;
      if (name.startsWith('modeShares.')) {
          const mode = name.split('.')[1];
          setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: value } }));
      } else {
          console.warn("Handler: Unhandled input change on Scenario Page:", name);
      }
  }, []);

  // Handles slider/numeric input changes for MODE SHARES
  const handleModeShareChange = useCallback((mode, newValue) => {
      const numericValue = Number(newValue);
      if (isNaN(numericValue)) {
          console.warn(`Handler: Invalid non-numeric value passed for mode ${mode}:`, newValue);
          return;
      }
      // Update the input state immediately for responsive UI
      setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: numericValue } }));
      // Track the specific change that should trigger the backend re-balancing
      setLastUserChange({ mode: mode, value: numericValue }); // <-- This triggers the interactive useEffect
      console.log(`Handler: Mode share change - Mode: ${mode}, Value: ${numericValue}`);
  }, []); // No dependencies, safe for useCallback

  // Handles commit from numeric text inputs for MODE SHARES
  const handleModeNumericInputCommit = useCallback((mode, commitedValue) => {
      // Update state (might be redundant if handleModeShareChange already did, but safe)
      setInputState(prevState => ({ ...prevState, modeShares: { ...prevState.modeShares, [mode]: commitedValue } }));
      // Ensure this final value is used for the fetch trigger
      setLastUserChange({ mode: mode, value: commitedValue }); // <-- This triggers the interactive useEffect
      console.log(`Handler: Mode share commit - Mode: ${mode}, Value: ${commitedValue}`);
  }, []); // No dependencies, safe for useCallback

  // Resets the interactive scenario inputs back to the current baseline values
  const handleReset = useCallback(() => {
      console.log("Handler: Resetting scenario inputs to baseline:", baselineState);
      const newInputState = {
          populationValues: [...baselineState.baselinePopulationValues],
          parkingSupplyValues: [...baselineState.baselineParkingSupplyValues],
          parkingCost: baselineState.defaultParkingCost,
          modeShares: { ...baselineState.baselineModeShares },
      };
      setInputState(newInputState); // Update input state

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
      setError(null); // Clear interactive error
      // Reset last change tracker to prevent immediate trigger if reset values match previous user change
      const resetTriggerValue = { mode: null, value: null };
      setLastUserChange(resetTriggerValue);
      // Manually trigger fetch with reset state because setLastUserChange might not trigger if value is same
      // Need to pass the *new* input state we just calculated
      fetchData(newInputState, baselineState, resetTriggerValue.mode, resetTriggerValue.value);

  }, [baselineState, fetchData]); // Depends on baselineState and fetchData


  // --- Handlers for Model Setup Page ---

  // Updates intermediate number state
  const handleBaselineNumberInputChange = useCallback((event) => {
      const { name, value } = event.target;
      // console.log(`Handler: Intermediate change ${name}: '${value}'`); // Less noisy log
      setIntermediateNumberInputs(prevState => ({ ...prevState, [name]: value }));
  }, []);

  // Commits intermediate number to baselineState
  const handleBaselineNumberCommit = useCallback((event) => {
      const { name } = event.target;
      const value = intermediateNumberInputs[name];
      let numericValue;

      if (value === null || value === undefined || String(value).trim() === '') {
          numericValue = null;
      } else {
          numericValue = Number(value);
      }

      if (isNaN(numericValue) && value !== null && String(value).trim() !== '') {
          console.warn(`Handler: Invalid number commit for ${name}: '${value}'. Reverting intermediate input.`);
          setIntermediateNumberInputs(prevState => ({ ...prevState, [name]: String(baselineState[name]) }));
          return;
      }

      // console.log(`Handler: Committing ${name}:`, numericValue); // Less noisy log

      setBaselineState(prevState => {
          let valueToUse = numericValue;
           if (valueToUse === null) {
               switch (name) {
                   case 'numYears': valueToUse = 1; break;
                   case 'startYear': valueToUse = INITIAL_START_YEAR; break;
                   case 'showRate': valueToUse = INITIAL_SHOW_RATE; break;
                   case 'defaultParkingCost': valueToUse = INITIAL_PARKING_COST; break;
                   case 'quickStartPopulation': valueToUse = 0; break;
                   case 'quickAnnualGrowthRate': valueToUse = 0; break;
                   case 'quickStartParkingSupply': valueToUse = 0; break;
                   default: valueToUse = 0; break;
               }
               // console.log(`Handler: Input for ${name} cleared, using default:`, valueToUse); // Less noisy log
           }

           let finalValue = valueToUse;
           switch (name) {
               case 'numYears': finalValue = Math.max(1, Math.min(50, Math.round(finalValue))); break;
               case 'startYear': finalValue = Math.max(1900, Math.min(2100, Math.round(finalValue))); break;
               case 'showRate': finalValue = Math.max(0, Math.min(100, finalValue)); break;
               case 'defaultParkingCost': finalValue = Math.max(0, Math.round(finalValue)); break;
               case 'quickStartPopulation': finalValue = Math.max(0, Math.round(finalValue)); break;
               case 'quickAnnualGrowthRate': finalValue = Math.max(-100, Math.min(100, finalValue)); break;
               case 'quickStartParkingSupply': finalValue = Math.max(0, Math.round(finalValue)); break;
           }

           if (finalValue === prevState[name]) {
               // console.log(`Handler: Baseline ${name} - value unchanged after commit/clamping (${finalValue}), ensuring intermediate matches.`); // Less noisy
               setIntermediateNumberInputs(prevIntermediate => ({ ...prevIntermediate, [name]: String(finalValue) }));
               return prevState; // IMPORTANT: Return previous state ref if value didn't change
           }

          // console.log(`Handler: Baseline ${name} setting final state value:`, finalValue); // Less noisy log
          const newState = { ...prevState, [name]: finalValue };

          // --- Array Resizing/Recalculation Logic ---
          let needsPopulationRecalc = false;
          let needsSupplyRecalc = false;

          // If numYears changed, both need resizing/recalculation
          if (name === 'numYears' && finalValue !== prevState.numYears) {
              needsPopulationRecalc = true;
              needsSupplyRecalc = true;
              // Resize existing arrays based on *new* numYears
              newState.baselinePopulationValues = resizeArray(prevState.baselinePopulationValues, finalValue);
              newState.baselineParkingSupplyValues = resizeArray(prevState.baselineParkingSupplyValues, finalValue);
              // Recalculate based on potentially changed quick start values *and* new length
              newState.baselinePopulationValues = calculatePopulationArray(newState.quickStartPopulation, newState.quickAnnualGrowthRate, finalValue);
              newState.baselineParkingSupplyValues = calculateSupplyArray(newState.quickStartParkingSupply, finalValue);
              console.log("Handler: Recalculated baseline arrays due to numYears change:", finalValue);
          } else {
              // If numYears didn't change, check other triggers
              if ((name === 'quickStartPopulation' && finalValue !== prevState.quickStartPopulation) ||
                  (name === 'quickAnnualGrowthRate' && finalValue !== prevState.quickAnnualGrowthRate)) {
                  needsPopulationRecalc = true;
                  newState.baselinePopulationValues = calculatePopulationArray(newState.quickStartPopulation, newState.quickAnnualGrowthRate, newState.numYears);
                  console.log("Handler: Recalculated baselinePopulationValues:", newState.baselinePopulationValues);
              }
              if (name === 'quickStartParkingSupply' && finalValue !== prevState.quickStartParkingSupply) {
                  needsSupplyRecalc = true;
                  newState.baselineParkingSupplyValues = calculateSupplyArray(newState.quickStartParkingSupply, newState.numYears);
                  console.log("Handler: Recalculated baselineParkingSupplyValues:", newState.baselineParkingSupplyValues);
              }
          }
          // --- End Array Logic ---

          // Ensure intermediate input string matches the final committed numeric value
          setIntermediateNumberInputs(prevIntermediate => ({ ...prevIntermediate, [name]: String(finalValue) }));

          return newState; // Return the updated baseline state
      });
  }, [intermediateNumberInputs, baselineState]); // Depends on intermediate and baseline states

  // Handles changes to baseline mode shares on setup page
  const handleBaselineModeShareChange = useCallback((mode, newValue) => {
      const numericValue = Math.max(0, Math.min(100, Number(newValue) || 0));
      // console.log("Handler: Baseline Mode change:", mode, numericValue); // Less noisy log
      setBaselineState(prevState => {
          // Avoid state update if value hasn't changed
          if (prevState.baselineModeShares[mode] === numericValue) {
              return prevState;
          }
          return {
              ...prevState,
              baselineModeShares: { ...prevState.baselineModeShares, [mode]: numericValue }
          };
      });
  }, []); // No dependencies

  // Handles changes to baseline array values on setup page
  const handleBaselineArrayValueChange = useCallback((arrayName, index, newValue) => {
      const numericValue = Math.max(0, Number(newValue) || 0);
      // console.log(`Handler: Baseline ${arrayName}[${index}] change:`, numericValue); // Less noisy log
      setBaselineState(prevState => {
          const newArray = [...prevState[arrayName]];
          if (index >= 0 && index < newArray.length) {
              // Avoid state update if value hasn't changed
              if (newArray[index] === numericValue) {
                  return prevState;
              }
              newArray[index] = numericValue;
              return { ...prevState, [arrayName]: newArray };
          }
          return prevState; // Return previous state if index is out of bounds
      });
  }, []); // No dependencies


  // --- Style Function for NavLink ---
  const getNavLinkStyle = ({ isActive }) => ({
    color: 'white',
    textDecoration: 'none',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? '2px solid #ffeb3b' : 'none',
    marginRight: '15px',
    paddingBottom: '4px',
    borderRadius: 0,
    transition: 'border-bottom 0.2s ease-in-out',
  });


  // --- JSX Rendering ---
  return (
    <>
      {/* --- Navigation AppBar --- */}
      <AppBar position="static" sx={{ mb: 3, bgcolor: '#004d40' }}>
          <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  SEA MOVES
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
      <Container maxWidth="xl">
          {/* Display global errors - separate for clarity */}
          {error && <Alert severity="warning" sx={{ mb: 2 }}>Interactive Scenario Error: {error}</Alert>}
          {baselineError && <Alert severity="error" sx={{ mb: 2 }}>Baseline Data Error: {baselineError}</Alert>}

          {/* --- Routing --- */}
          <Routes>
            {/* Scenario Page Route */}
            <Route
                path="/"
                element={
                    <ScenarioPage
                        // --- Passed State & Data ---
                        baselineState={baselineState} // Config values for baseline
                        inputState={inputState} // Interactive scenario inputs
                        apiResponseData={apiResponseData} // Interactive scenario results
                        baselineApiResponseData={baselineApiResponseData} // Baseline scenario results
                        modes={MODES}
                        actualYears={Array.from({ length: baselineState.numYears }, (_, i) => baselineState.startYear + i)}

                        // --- Loading & Error States ---
                        isLoading={isLoading} // Interactive scenario loading
                        interactiveError={error} // Interactive error
                        baselineIsLoading={baselineIsLoading} // Baseline loading
                        baselineError={baselineError} // Baseline error

                        // --- Event Handlers ---
                        // onInputChange={handleInputChange} // Pass only if explicitly needed by ScenarioPage/children
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
      </Container>
    </>
  );
} // End of App component

export default App;