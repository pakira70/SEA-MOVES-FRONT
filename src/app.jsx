import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
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

  // State to track the specific mode/value last changed by user commit action
  const [lastUserChange, setLastUserChange] = useState({ mode: null, value: null });

  // State for data received from the API
  const [apiResponseData, setApiResponseData] = useState(null);
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(true); // Start true for initial load
  // State for displaying errors
  const [error, setError] = useState(null);
  // Ref to prevent initial fetch useEffect from running twice in StrictMode
  const initialFetchDone = useRef(false);


  // Debounced function to fetch data from API via backend
  const fetchData = useCallback(debounce(async (
      currentInputState,
      changedModeKey,
      changedModeValue
      ) => {
    // === DEBUG LOG: Inside fetchData ===
    console.log(`*** fetchData CALLED (debounced) ***`, {
         mode: changedModeKey,
         value: changedModeValue,
         currentDriveState: currentInputState.modeShares.Drive // Log Drive state as fetchData sees it
    }
    , 500 );
    // =====================================

    setIsLoading(true);

    const modeSharesPayload = currentInputState.modeShares;
    const populationPayload = parseNumericString(currentInputState.populationString);
    const supplyPayload = parseNumericString(currentInputState.parkingSupplyString);
    const costPayload = Number(currentInputState.parkingCost);

    // Validation
    let preFetchError = null;
    if (populationPayload.length === 0) preFetchError = "Population data is required.";
    else if (supplyPayload.length === 0) preFetchError = "Parking Supply data is required.";
    else if (isNaN(costPayload) || costPayload < 0) preFetchError = "Invalid Parking Cost.";
    else if (populationPayload.length !== supplyPayload.length) preFetchError = `Input Count Mismatch: Pop ${populationPayload.length}, Supply ${supplyPayload.length}.`;

    if (preFetchError) {
        console.warn(`fetchData validation failed: ${preFetchError}`);
        setError(preFetchError);
        setIsLoading(false);
        return;
    }

    const payload = {
      mode_shares_input: modeSharesPayload,
      population_per_year: populationPayload,
      parking_supply_per_year: supplyPayload,
      parking_cost_per_space: costPayload,
      changed_mode_key: changedModeKey,
      new_value_percent: changedModeValue
    };

     // console.log("Sending payload:", payload); // Keep commented out

    try {
      const response = await axios.post(`${API_BASE_URL}/api/calculate`, payload);
      // console.log("API Response Raw Data:", response.data); // Keep commented out

      setApiResponseData(response.data);
      setError(null);

      // Update input state ONLY IF mode shares returned by backend differ
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
                   console.log("+++ Syncing state with backend:", numericBackendShares); // Log sync
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
      // console.log("--- fetchData FINISHED ---"); // Log completion
      setIsLoading(false);
    }
  }, 500),
  [API_BASE_URL]
  );


  // Effect hook: Runs on mount and when inputState or lastUserChange updates
  useEffect(() => {
    // === DEBUG LOG: useEffect start ===
    console.log("--- useEffect RUNNING ---", {
        inStr: inputState.populationString, // Log a few key state parts
        inDriveShare: inputState.modeShares.Drive, // Log current Drive share state
        lastMode: lastUserChange.mode,
        lastValue: lastUserChange.value
     });
     // =================================

    // Handle initial mount fetch separately using ref
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      console.log("Initial fetch on mount call...");
      fetchData(inputState, null, null); // Initial fetch
      return;
    }

    // For subsequent changes triggered by dependencies:
    console.log("useEffect triggering fetchData due to dependency change...");
    fetchData(inputState, lastUserChange.mode, lastUserChange.value);

    // Cleanup function for the debounce timer
    return () => {
        // console.log("useEffect cleanup: cancelling pending fetchData"); // Log cleanup
        fetchData.cancel();
    }

  }, [
      inputState,
      lastUserChange,
      fetchData
     ]);


  // --- Event Handlers ---

  // Handler for generic input changes AND mode share typing
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    // console.log(`handleInputChange: name=${name}, value=${value}`); // Log basic input change
    if (name.startsWith('modeShares.')) {
        const mode = name.split('.')[1];
        setInputState(prevState => ({
            ...prevState, modeShares: { ...prevState.modeShares, [mode]: value }
        }));
    } else {
        setInputState(prevState => ({ ...prevState, [name]: value }));
    }
  };

  // Handler specifically for Mode Share Slider changes
  const handleModeShareChange = (mode, newValue) => {
    // === DEBUG LOG: Slider Event ===
    console.log(`>>> SLIDER Event Start: ${mode} to ${newValue}`);
    // ===============================
    const numericValue = typeof newValue === 'number' ? newValue : 0;

    // Calculate next state directly for logging clarity
    const nextState = {
        ...inputState,
        modeShares: {
           ...inputState.modeShares,
           [mode]: numericValue
        }
    };
    console.log(">>> SLIDER: Setting inputState with Drive:", nextState.modeShares.Drive);
    setInputState(nextState); // Update state

    console.log(`>>> SLIDER: Setting lastUserChange: mode=${mode}, value=${numericValue}`);
    setLastUserChange({ mode: mode, value: numericValue }); // Record commit
    console.log("<<< SLIDER Event Handled");
    // ===============================
  };

  // Handler specifically for Mode Share numeric input commit (onBlur or Enter)
  const handleModeNumericInputCommit = (mode, commitedValue) => {
    // === DEBUG LOG: Text Commit Event ===
    console.log(`>>> TEXT COMMIT Event Start: ${mode} to ${commitedValue}`);
    // ====================================
    // Calculate next state
     const nextState = {
        ...inputState,
        modeShares: {
            ...inputState.modeShares,
            [mode]: commitedValue // Store validated number
        }
    };
    console.log(">>> TEXT COMMIT: Setting inputState with Drive:", nextState.modeShares.Drive);
    setInputState(nextState); // Update state

    console.log(`>>> TEXT COMMIT: Setting lastUserChange: mode=${mode}, value=${commitedValue}`);
    setLastUserChange({ mode: mode, value: commitedValue }); // Record commit
    console.log("<<< TEXT COMMIT Event Handled");
    // ====================================
  };

  // Handler for Reset button
  const handleReset = () => {
    const resetState = {
      modeShares: { ...BASELINE_MODE_SHARES },
      populationString: DEFAULT_POPULATION_STRING,
      parkingSupplyString: DEFAULT_PARKING_SUPPLY_STRING,
      parkingCost: DEFAULT_PARKING_COST,
    };
    console.log(">>> Reset Button: Resetting state TO:", resetState);
    setInputState(resetState);
    setError(null);
    setLastUserChange({ mode: null, value: null }); // Reset last change
    console.log("<<< Reset Button Finished.");
  };


  // --- JSX Rendering ---
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        SEA MOVE Employee Transportation Model MVP
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
            <ControlsPanel
              inputState={inputState}
              modes={MODES}
              onInputChange={handleInputChange}
              onModeShareChange={handleModeShareChange}
              onModeNumericInputCommit={handleModeNumericInputCommit} // Pass handler
              onReset={handleReset}
              isLoading={isLoading}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

// Optional: Define common styles
const styles = {
  centerBox: { display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  centerBoxSmall: { display: 'flex', justifyContent: 'center', my: 2 },
  placeholderText: { p: 2, fontStyle: 'italic' }
};

export default App;