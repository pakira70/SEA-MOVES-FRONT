// src/pages/ScenarioPage.jsx - RESTORED to state before width/glitch fixes

import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { Grid, Paper, Typography, CircularProgress, Box } from '@mui/material';

// Import Components
import ControlsPanel from '../components/ControlsPanel.jsx';
import VisualizationsPanel from '../components/VisualizationsPanel.jsx';
// import SummaryTable from '../components/SummaryTable.jsx'; // Keep commented out
import FinalCostDisplay from '../components/FinalCostDisplay.jsx';

// Import Config
import { API_BASE_URL } from '../config';

// --- Helper Definition (Defined ONCE, outside component) ---
const getLastElement = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) { return null; }
    return arr[arr.length - 1];
};
// -----------------------------------------------------------

function ScenarioPage({
  baselineState, inputState, apiResponseData, isLoading, loadingError,
  modes, onModeShareChange, onModeNumericInputCommit, onReset,
  startYear, numYears, actualYears
}) {

  // --- State for Baseline FINAL YEAR Cost & Shortfall Calculation (Managed Internally) ---
  const [baselineFinalYearCost, setBaselineFinalYearCost] = useState(null);
  const [baselineFinalYearShortfall, setBaselineFinalYearShortfall] = useState(null);
  const [baselineLoading, setBaselineLoading] = useState(true); // Start true for initial fetch
  const [baselineCostError, setBaselineCostError] = useState(null);

  // --- Effect to Calculate Baseline FINAL YEAR Cost & Shortfall (Managed Internally) ---
  useEffect(() => {
      console.log("[ScenarioPage Effect - Baseline Final Year] Triggered.");
      const currentNumYears = baselineState?.numYears;
      const currentParkingCost = baselineState?.defaultParkingCost;
      const currentShowRate = baselineState?.showRate;
      const currentPopValues = baselineState?.baselinePopulationValues;
      const currentSupplyValues = baselineState?.baselineParkingSupplyValues;
      const currentModeShares = baselineState?.baselineModeShares;

      // Validation Logic
      const isValidBaselineData =
          currentPopValues && Array.isArray(currentPopValues) && currentPopValues.length === currentNumYears &&
          currentSupplyValues && Array.isArray(currentSupplyValues) && currentSupplyValues.length === currentNumYears &&
          currentModeShares && typeof currentModeShares === 'object' && Object.keys(currentModeShares).length > 0 &&
          typeof currentParkingCost === 'number' && !isNaN(currentParkingCost) && currentParkingCost >= 0 &&
          typeof currentShowRate === 'number' && !isNaN(currentShowRate) && currentShowRate >= 0 && currentShowRate <= 100;

      if (!isValidBaselineData) {
          console.warn("[ScenarioPage Effect] Invalid baseline data, skipping fetch.");
          setBaselineFinalYearCost(null); setBaselineFinalYearShortfall(null);
          setBaselineCostError("Invalid baseline config"); setBaselineLoading(false);
          return;
      }

      const calculateBaselineData = async () => {
          console.log("[ScenarioPage Effect] Fetching baseline data...");
          setBaselineLoading(true); setBaselineCostError(null); // Use correct setters
          const payload = {
              population_per_year: currentPopValues, parking_supply_per_year: currentSupplyValues,
              mode_shares_input: currentModeShares, parking_cost_per_space: currentParkingCost,
              show_rate_percent: currentShowRate,
          };
          try {
              const response = await axios.post(`${API_BASE_URL}/api/calculate`, payload);
              console.log("[ScenarioPage Effect] Baseline data fetched successfully.");
              const costPerYearArray = response.data?.parking?.cost_per_year;
              const finalCost = getLastElement(costPerYearArray);
              setBaselineFinalYearCost(typeof finalCost === 'number' ? finalCost : null);
              const shortfallPerYearArray = response.data?.parking?.shortfall_per_year;
              const finalShortfall = getLastElement(shortfallPerYearArray);
              setBaselineFinalYearShortfall(typeof finalShortfall === 'number' ? Math.round(finalShortfall) : null);
          } catch (err) {
              const errorMsg = err.response?.data?.error || err.message || "Failed to fetch baseline data";
              console.error("[ScenarioPage Effect] Error fetching baseline data:", errorMsg, err);
              setBaselineCostError(errorMsg); setBaselineFinalYearCost(null); setBaselineFinalYearShortfall(null);
          } finally {
              setBaselineLoading(false); // Use correct setter
              console.log("[ScenarioPage Effect] Fetch finished.");
          }
      };
      calculateBaselineData();

  // Dependencies (Fetch Baseline Once Strategy)
  }, [ baselineState?.numYears, baselineState?.startYear, baselineState?.showRate, baselineState?.defaultParkingCost, baselineState?.baselinePopulationValues?.length, baselineState?.baselineParkingSupplyValues?.length, baselineState?.baselineModeShares ? Object.keys(baselineState.baselineModeShares).length : 0, API_BASE_URL ]);

  // Calculate Scenario FINAL YEAR Cost & Shortfall using useMemo (with fixed destructuring)
  const { scenarioFinalYearCost, scenarioFinalYearShortfall } = useMemo(() => {
      const result = { scenarioFinalYearCost: null, scenarioFinalYearShortfall: null };
      if (!apiResponseData?.parking) { return result; }
      const costPerYearArray = Array.isArray(apiResponseData.parking.cost_per_year) ? apiResponseData.parking.cost_per_year : [];
      const finalCost = getLastElement(costPerYearArray);
      result.scenarioFinalYearCost = (typeof finalCost === 'number' ? finalCost : null);
      const shortfallPerYearArray = Array.isArray(apiResponseData.parking.shortfall_per_year) ? apiResponseData.parking.shortfall_per_year : [];
      const finalShortfall = getLastElement(shortfallPerYearArray);
      result.scenarioFinalYearShortfall = (typeof finalShortfall === 'number' ? Math.round(finalShortfall) : null);
      return result;
  }, [apiResponseData]) ?? {}; // Keep fallback


  // --- JSX Rendering (Layout Adjusted) ---
  return (
    <Grid container spacing={3}>
      {/* Top Section */}
      <Grid item xs={12}> <Grid container spacing={3}>
               {/* Visualizations Panel */}
               <Grid item xs={12}>
                 <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 430, position: 'relative', overflow: 'hidden' }}>
                   <Typography variant="h6" gutterBottom>Visualizations</Typography>
                   {/* Conditional rendering */}
                   {!apiResponseData && isLoading && ( <Box sx={styles.centerBox}><CircularProgress /></Box> )}
                   {!apiResponseData && loadingError && ( <Box sx={styles.centerBox}><Typography color="error">Error: {loadingError}</Typography></Box> )}
                   {!apiResponseData && !isLoading && !loadingError && ( <Box sx={styles.centerBox}><Typography>Change inputs to run.</Typography></Box> )}
                   {apiResponseData && (<VisualizationsPanel data={apiResponseData} modes={modes} actualYears={actualYears} />)}
                   {isLoading && apiResponseData && ( <Box sx={styles.loadingOverlay}><CircularProgress size={40} /></Box> )}
                 </Paper>
                </Grid>

               {/* Final Cost Display (md=8) */}
               <Grid item xs={12} md={8}>
                 <Paper sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                   <FinalCostDisplay
                       baselineCost={baselineFinalYearCost}
                       scenarioCost={scenarioFinalYearCost}
                       baselineShortfall={baselineFinalYearShortfall}
                       scenarioShortfall={scenarioFinalYearShortfall}
                       baselineCostLoading={baselineLoading}
                       baselineCostError={baselineCostError}
                       scenarioLoading={isLoading}
                       scenarioError={loadingError}
                       finalYear={actualYears && actualYears.length > 0 ? actualYears[actualYears.length - 1] : null}
                   />
                 </Paper>
               </Grid>
      </Grid> </Grid>
      {/* Bottom Section */}
      <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>Interactive Scenario Inputs</Typography>
            <ControlsPanel
                baselineModeShares={baselineState?.baselineModeShares}
                inputState={inputState} modes={modes}
                onModeShareChange={onModeShareChange} onModeNumericInputCommit={onModeNumericInputCommit}
                onReset={onReset} isLoading={isLoading}
            />
          </Paper>
      </Grid>
    </Grid>
  );
}

// --- Prop Types ---
ScenarioPage.propTypes = { /* ... props passed from App ... */ };
// --- Styles ---
const styles = { /* ... styles from previous versions ... */
  centerBox: { display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', minHeight: '200px', textAlign: 'center', p: 2 },
  centerBoxSmall: { display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, minHeight: '50px'},
  placeholderText: { p: 2, fontStyle: 'italic', color: 'text.secondary', textAlign: 'center' },
  loadingOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, backdropFilter: 'blur(1px)', borderRadius: 'inherit' }
};

export default ScenarioPage;