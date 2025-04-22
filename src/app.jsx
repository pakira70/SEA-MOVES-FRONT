import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce'; // Keep debounce
import {
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button
} from '@mui/material';

// Import Components
import ControlsPanel from './components/ControlsPanel.jsx';
import VisualizationsPanel from './components/VisualizationsPanel.jsx';
import SummaryTable from './components/SummaryTable.jsx';
import FinalCostDisplay from './components/FinalCostDisplay.jsx';

// Import Configuration and Constants
import {
  API_BASE_URL,
  BASELINE_MODE_SHARES,
  DEFAULT_POPULATION_STRING,
  DEFAULT_PARKING_SUPPLY_STRING,
  DEFAULT_PARKING_COST,
  MODES
} from './config';

// Helper function
const parseNumericString = (str) => {
  if (!str || typeof str !== 'string') return [];
  return str.split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(Number)
            .filter(n => !isNaN(n));
};

// Main Application Component
function App() {
  // State for user inputs
  const [inputState, setInputState] = useState({
    modeShares: { ...BASELINE_MODE_SHARES },
    populationString: DEFAULT_POPULATION_STRING,
    parkingSupplyString: DEFAULT_PARKING_SUPPLY_STRING,
    parkingCost: DEFAULT_PARKING_COST,
  });
  // NOTE: lastUserChange state is removed

  const [apiResponseData, setApiResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start true for initial load
  const [error, setError] = useState(null);
  const initialFetchDone = useRef(false);


  // --- fetchData function - Debounced, called directly by handlers ---
  const fetchData = useCallback(debounce(async (
      stateForCalc, // The state representing the inputs for this calculation
      changedModeKey = null,
      changedModeValue = null
      ) => {
    // Prevent concurrent fetches check (optional but good practice with direct calls)
    // We might need a separate isLoading ref if setIsLoading causes issues here
    // For now, assume setIsLoading is sufficient guard.

    setIsLoading(true);
    // Don't clear error here, handlers clear it optimistically

    // Extract and PARSE numeric values just before sending
    const modeSharesPayload = stateForCalc.modeShares; // Backend handles potential strings
    const populationPayload = parseNumericString(stateForCalc.populationString);
    const supplyPayload = parseNumericString(stateForCalc.parkingSupplyString);
    const costPayload = Number(stateForCalc.parkingCost);

    // --- Validation ---
    let preFetchError = null;
    if (populationPayload.length === 0) preFetchError = "Population data is required.";
    else if (supplyPayload.length === 0) preFetchError = "Parking Supply data is required.";
    else if (isNaN(costPayload) || costPayload < 0) preFetchError = "Invalid Parking Cost.";
    else if (populationPayload.length > 0 && supplyPayload.length > 0 && populationPayload.length !== supplyPayload.length) {
         preFetchError = `Input Count Mismatch: Pop ${populationPayload.length}, Supply ${supplyPayload.length}.`;
    }

    if (preFetchError) {
        console.warn(`fetchData validation failed: ${preFetchError}`);
        setError(preFetchError); // Show validation error
        setIsLoading(false); // MUST stop loading
        return; // Stop
    }
    // If validation passed, clear any previous errors before making call
    setError(null);
    // --- End Validation ---

    const payload = {
      mode_shares_input: modeSharesPayload,
      population_per_year: populationPayload,
      parking_supply_per_year: supplyPayload,
      parking_cost_per_space: costPayload,
      // Pass the change info provided by the handler
      changed_mode_key: changedModeKey,
      new_value_percent: changedModeValue
    };

    // console.log("Sending payload:", payload);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/calculate`, payload);
      setApiResponseData(response.data);
      // setError(null); // Already cleared above

      // Sync input state with backend result IF necessary
      setInputState(currentState => {
          const backendShares = response.data.processed_mode_shares;
          if (backendShares) {
               const numericBackendShares = {};
               let changed = false;
               for (const mode in backendShares) {
                   const backendNum = Number(backendShares[mode]);
                   numericBackendShares[mode] = backendNum;
                   if (String(currentState.modeShares[mode]) !== String(backendNum)) {
                       changed = true;
                   }
               }
               if (changed) {
                  // console.log("Syncing state with backend:", numericBackendShares);
                  return { ...currentState, modeShares: numericBackendShares };
                }
          }
          return currentState; // No change needed
      });

    } catch (err) {
      console.error("API Error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to fetch data";
      setError(errorMsg);
      setApiResponseData(null);
    } finally {
      setIsLoading(false); // Ensure loading always stops
    }
  }, 500), // Keep debounce delay
  [API_BASE_URL] // Dependency for useCallback (only API base URL)
  ); // End of useCallback


  // --- useEffect for INITIAL data fetch ON MOUNT ONLY ---
  useEffect(() => {
    // Prevent double fetch in React StrictMode during development
    if (initialFetchDone.current) {
        return;
    }
    initialFetchDone.current = true;

    // console.log("Initial fetch on mount...");
    // Fetch data using the initial state, no specific change info
    fetchData(inputState, null, null);

    // No cleanup needed as fetchData is stable and called only once here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // EMPTY dependency array ensures this runs only once on mount


  // --- Event Handlers ---
  // Handlers now calculate the next state and call fetchData directly

  // Generic input change (Population, Supply, Cost, and MODE TYPING)
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    let nextState;

    if (name.startsWith('modeShares.')) {
        // Only update state for typing, NO fetch here
        const mode = name.split('.')[1];
        nextState = {
            ...inputState,
            modeShares: { ...inputState.modeShares, [mode]: value } // Store raw string
        };
        setInputState(nextState);
    } else {
        // Calculate and set state for Pop/Supply/Cost
        nextState = { ...inputState, [name]: value };
        setInputState(nextState); // Update UI immediately
        // Trigger fetch immediately for these non-mode changes
        setError(null); // Clear previous errors optimistically
        fetchData.cancel(); // Cancel any pending debounced calls
        fetchData(nextState, null, null); // Pass next state, no specific mode change
    }
  };

  // Slider changes
  const handleModeShareChange = (mode, newValue) => {
    const numericValue = typeof newValue === 'number' ? newValue : 0;
    // Calculate the state as it *will be* after this change
    const nextState = {
        ...inputState,
        modeShares: { ...inputState.modeShares, [mode]: numericValue }
    };
    // Update state visually immediately
    setInputState(nextState);
    // Immediately call fetch with the NEXT state and the change info
    setError(null);
    fetchData.cancel();
    fetchData(nextState, mode, numericValue);
  };

  // Mode share text input COMMIT (Blur/Enter)
  const handleModeNumericInputCommit = (mode, commitedValue) => {
    // commitedValue is the validated numeric value from ControlsPanel
    // Calculate the state as it *will be* after this commit
     const nextState = {
        ...inputState,
        modeShares: { ...inputState.modeShares, [mode]: commitedValue }
    };
    // Update state visually immediately
    setInputState(nextState);
    // Immediately call fetch with the NEXT state and the change info
    setError(null);
    fetchData.cancel();
    fetchData(nextState, mode, commitedValue);
  };

  // Reset button
  const handleReset = () => {
    const resetState = {
       modeShares: { ...BASELINE_MODE_SHARES },
       populationString: DEFAULT_POPULATION_STRING,
       parkingSupplyString: DEFAULT_PARKING_SUPPLY_STRING,
       parkingCost: DEFAULT_PARKING_COST,
    };
    setInputState(resetState); // Update visually
    setError(null);
    // Immediately call fetch with the reset state
    fetchData.cancel();
    fetchData(resetState, null, null);
  };


  // --- JSX Rendering ---
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        SEA MOVES Employee Transportation Model MVP
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Visualizations/Results Section */}
        <Grid item xs={12} md={12}>
            <Grid container spacing={3}>
                 <Grid item xs={12}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 380 }}>
                      <Typography variant="h6" gutterBottom>Visualizations</Typography>
                      {isLoading && !apiResponseData ? ( <Box sx={styles.centerBox}><CircularProgress /></Box>
                      ) : apiResponseData ? ( <VisualizationsPanel data={apiResponseData} modes={MODES} />
                      ) : ( <Box sx={styles.centerBox}><Typography>Enter valid inputs...</Typography></Box>
                      )}
                    </Paper>
                 </Grid>
                 <Grid item xs={12}>
                   <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                     <Typography variant="h6" gutterBottom>Parking Summary</Typography>
                     {isLoading && !apiResponseData ? ( <Box sx={styles.centerBoxSmall}><CircularProgress size={24} /></Box>
                     ) : apiResponseData?.summary_table ? ( <SummaryTable summaryData={apiResponseData.summary_table} />
                     ) : ( <Typography sx={styles.placeholderText}>Parking summary...</Typography>
                     )}
                   </Paper>
                 </Grid>
                 <Grid item xs={12}>
                  {apiResponseData?.parking && apiResponseData?.years && apiResponseData.years.length > 0 ? (
                    (() => {
                      const yearsArray = apiResponseData.years;
                      const shortfallArray = apiResponseData.parking.shortfall_per_year;
                      const costPerSpace = apiResponseData.parking.cost_per_space;
                      if (yearsArray.length > 0 && shortfallArray && shortfallArray.length === yearsArray.length && typeof costPerSpace === 'number') {
                          const lastYear = yearsArray[yearsArray.length - 1];
                          const lastShortfall = shortfallArray[shortfallArray.length - 1];
                          const finalCost = Math.max(0, lastShortfall) * costPerSpace;
                          return <FinalCostDisplay lastYear={lastYear} finalCost={finalCost} />;
                      } else { return <FinalCostDisplay lastYear={null} finalCost={null} />; }
                    })()
                  ) : ( !isLoading && <FinalCostDisplay lastYear={null} finalCost={null} /> )}
                 </Grid>
            </Grid>
        </Grid>

        {/* Controls Section */}
        <Grid item xs={12} md={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>Inputs</Typography>
            {/* NOTE: No need to pass onModeNumericInputCommit separately if using this pattern */}
            {/* ControlsPanel just needs onInputChange and onModeShareChange */}
            {/* Let's adjust ControlsPanel call slightly */}
            <ControlsPanel
              inputState={inputState}
              modes={MODES}
              onInputChange={handleInputChange} // Handles generic AND mode typing
              onModeShareChange={handleModeShareChange} // Handles slider commit
              onModeNumericInputCommit={handleModeNumericInputCommit} // Handles text commit
              onReset={handleReset}
              isLoading={isLoading}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  ); // End return
} // End App component

// Optional: Define common styles
const styles = {
  centerBox: { display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  centerBoxSmall: { display: 'flex', justifyContent: 'center', my: 2 },
  placeholderText: { p: 2, fontStyle: 'italic' }
};

export default App;