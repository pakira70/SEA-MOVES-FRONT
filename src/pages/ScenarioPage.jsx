// src/pages/ScenarioPage.jsx - V2.2 + Step 2 REVISED + Input Fix + Flash Fix Attempt 4 + Layout Changes

import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import {
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';

// Import Components needed for this page
import ControlsPanel from '../components/ControlsPanel.jsx';
import VisualizationsPanel from '../components/VisualizationsPanel.jsx';
import SummaryTable from '../components/SummaryTable.jsx';
import FinalCostDisplay from '../components/FinalCostDisplay.jsx';

// Import Configuration for API URL
import { API_BASE_URL } from '../config';

// Helper to get last element safely
const getLastElement = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) { return null; }
    return arr[arr.length - 1];
};

// Component receiving props from App.jsx
function ScenarioPage({
  baselineState,
  inputState,
  apiResponseData,
  isLoading,
  loadingError,
  modes,
  onModeShareChange,
  onModeNumericInputCommit,
  onReset,
  startYear,
  numYears,
  actualYears
}) {

  // State for Baseline FINAL YEAR Cost Calculation
  const [baselineFinalYearCost, setBaselineFinalYearCost] = useState(null);
  const [baselineCostLoading, setBaselineCostLoading] = useState(false);
  const [baselineCostError, setBaselineCostError] = useState(null);

  // Effect to Calculate Baseline FINAL YEAR Cost
  useEffect(() => {
      // ... (Baseline fetch effect logic - NO CHANGES HERE from previous version) ...
      console.log("[ScenarioPage Effect - Baseline Final Year Cost] Triggered.");
      const currentNumYears = baselineState?.numYears;
      const currentParkingCost = baselineState?.defaultParkingCost;
      const currentShowRate = baselineState?.showRate;
      const currentPopValues = baselineState?.baselinePopulationValues;
      const currentSupplyValues = baselineState?.baselineParkingSupplyValues;
      const currentModeShares = baselineState?.baselineModeShares;
      const isValidBaselineData = /* ... validation logic ... */
          currentPopValues && Array.isArray(currentPopValues) && currentPopValues.length === currentNumYears &&
          currentSupplyValues && Array.isArray(currentSupplyValues) && currentSupplyValues.length === currentNumYears &&
          currentModeShares && typeof currentModeShares === 'object' && Object.keys(currentModeShares).length > 0 &&
          typeof currentParkingCost === 'number' && !isNaN(currentParkingCost) && currentParkingCost >= 0 &&
          typeof currentShowRate === 'number' && !isNaN(currentShowRate) && currentShowRate >= 0 && currentShowRate <= 100;
      if (!isValidBaselineData) {
          console.warn("[ScenarioPage Effect - Baseline Final Year Cost] Baseline data not ready or invalid. Skipping fetch.");
          setBaselineFinalYearCost(null); setBaselineCostError(null); setBaselineCostLoading(false);
          return;
      }
      const calculateBaselineCost = async () => {
          setBaselineCostLoading(true); setBaselineCostError(null);
          const payload = { /* ... payload ... */
              population_per_year: currentPopValues,
              parking_supply_per_year: currentSupplyValues,
              mode_shares_input: currentModeShares,
              parking_cost_per_space: currentParkingCost,
              show_rate_percent: currentShowRate,
          };
          console.log("[ScenarioPage Effect - Baseline Final Year Cost] Fetching baseline cost with payload:", JSON.stringify(payload));
          try {
              const response = await axios.post(`${API_BASE_URL}/api/calculate`, payload);
              console.log("[ScenarioPage Effect - Baseline Final Year Cost] Baseline cost fetched successfully.");
              const costPerYearArray = response.data?.parking?.cost_per_year;
              const finalCost = getLastElement(costPerYearArray);
              setBaselineFinalYearCost(typeof finalCost === 'number' ? finalCost : null);
          } catch (err) { /* ... error handling ... */
              const errorMsg = err.response?.data?.error || err.message || "Failed to fetch baseline cost";
              setBaselineCostError(errorMsg); setBaselineFinalYearCost(null);
          } finally {
              setBaselineCostLoading(false);
              console.log("[ScenarioPage Effect - Baseline Final Year Cost] Fetch process finished.");
          }
      };
      calculateBaselineCost();
  // Dependencies (Fetch Baseline Once Strategy)
  }, [ baselineState?.numYears, baselineState?.startYear, baselineState?.showRate, baselineState?.defaultParkingCost, baselineState?.baselinePopulationValues?.length, baselineState?.baselineParkingSupplyValues?.length, baselineState?.baselineModeShares ? Object.keys(baselineState.baselineModeShares).length : 0, API_BASE_URL ]);

  // Calculate Scenario FINAL YEAR Cost using useMemo
  const scenarioFinalYearCost = useMemo(() => {
      // ... (no changes here) ...
       if (!apiResponseData?.parking?.cost_per_year) { return null; }
       const costPerYearArray = apiResponseData.parking.cost_per_year;
       const finalCost = getLastElement(costPerYearArray);
       return (typeof finalCost === 'number' ? finalCost : null);
  }, [apiResponseData]);

  // Determine Data Availability for Conditional Rendering
  const hasApiResponse = apiResponseData !== null && !loadingError;
  const expectedDataLength = actualYears?.length || numYears || 0;
  const hasSummaryData = hasApiResponse && apiResponseData.summary_table && Array.isArray(apiResponseData.summary_table) && apiResponseData.summary_table.length === expectedDataLength;

  // --- JSX Rendering ---
  return (
    <Grid container spacing={3}>

        {/* --- REMOVED DEBUG INFO BOX --- */}

      {/* === Top Section: Visualizations / Results === */}
      <Grid item xs={12}>
          <Grid container spacing={3}>
               {/* --- Visualizations Panel --- */}
               <Grid item xs={12}>
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 380, position: 'relative', overflow: 'hidden' }}>
                    <Typography variant="h6" gutterBottom>Visualizations</Typography>
                    {!hasApiResponse && isLoading && ( <Box sx={styles.centerBox}><CircularProgress /></Box> )}
                    {!hasApiResponse && loadingError && ( <Box sx={styles.centerBox}><Typography color="error">Error loading scenario: {loadingError}</Typography></Box> )}
                    {!hasApiResponse && !isLoading && !loadingError && ( <Box sx={styles.centerBox}><Typography>Change inputs to run scenario.</Typography></Box> )}
                    {hasApiResponse && (
                       <VisualizationsPanel data={apiResponseData} modes={modes} actualYears={actualYears} />
                    )}
                    {isLoading && hasApiResponse && ( <Box sx={styles.loadingOverlay}><CircularProgress size={40} thickness={4} /></Box> )}
                  </Paper>
               </Grid>

                {/* ======================================================================== */}
                {/* START OF LAYOUT CHANGE AREA */}
                {/* ======================================================================== */}

               {/* --- Parking Summary Table (Now comes first in this row) --- */}
               <Grid item xs={12} md={8}>
                 <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
                   <Typography variant="h6" gutterBottom>Parking Summary</Typography>
                   {/* Loading logic depends only on main isLoading */}
                   {!hasSummaryData && isLoading && ( <Box sx={styles.centerBoxSmall}><CircularProgress size={24} /></Box> )}
                   {!hasSummaryData && !isLoading && ( <Typography sx={styles.placeholderText}>No summary data available.</Typography> )}
                   {hasSummaryData && ( <SummaryTable summaryData={apiResponseData.summary_table} /> )}
                   {isLoading && hasSummaryData && ( <Box sx={styles.loadingOverlay}></Box> )}
                 </Paper>
               </Grid>

               {/* --- Final Cost Display (Now comes second, below Summary Table on larger screens) --- */}
               <Grid item xs={12} md={8}> {/* Changed md=4 to md=8 to match table width */}
                 <Paper sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                   <FinalCostDisplay
                       baselineCost={baselineFinalYearCost}
                       scenarioCost={scenarioFinalYearCost}
                       baselineCostLoading={baselineCostLoading}
                       baselineCostError={baselineCostError}
                       scenarioLoading={isLoading}
                       scenarioError={loadingError}
                       finalYear={actualYears && actualYears.length > 0 ? actualYears[actualYears.length - 1] : null}
                   />
                 </Paper>
               </Grid>
                {/* ======================================================================== */}
                {/* END OF LAYOUT CHANGE AREA */}
                {/* ======================================================================== */}

          </Grid> {/* Closes inner Grid container */}
      </Grid> {/* Closes Top Section Grid item */}

      {/* === Bottom Section: Interactive Controls === */}
      <Grid item xs={12}>
         <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>Interactive Scenario Inputs</Typography>
          <ControlsPanel
            baselineModeShares={baselineState?.baselineModeShares}
            inputState={inputState}
            modes={modes}
            onModeShareChange={onModeShareChange}
            onModeNumericInputCommit={onModeNumericInputCommit}
            onReset={onReset}
            isLoading={isLoading}
          />
        </Paper>
      </Grid>
    </Grid> // Closes main Grid container
  ); // End return
} // End ScenarioPage component

// --- Prop Types ---
// ... (no changes here) ...
ScenarioPage.propTypes = { /* ... */ };

// Define styles locally
// ... (no changes here) ...
const styles = { /* ... */ };

export default ScenarioPage;