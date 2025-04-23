// src/pages/ScenarioPage.jsx - Revised Rendering Logic for Smoother Updates

import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';

// Import Components needed for this page
import ControlsPanel from '../components/ControlsPanel.jsx'; // Verify path
import VisualizationsPanel from '../components/VisualizationsPanel.jsx'; // Verify path
import SummaryTable from '../components/SummaryTable.jsx'; // Verify path
import FinalCostDisplay from '../components/FinalCostDisplay.jsx'; // Verify path

// Receive props from App.jsx
function ScenarioPage({
  inputState,
  apiResponseData,
  isLoading, // Still needed for overlays and disabling controls
  modes,
  onInputChange,
  onModeShareChange,
  onModeNumericInputCommit,
  onReset
}) {

  // Determine if we have valid data (even if potentially stale during load)
  const hasApiResponse = apiResponseData !== null;
  const hasSummaryData = hasApiResponse && apiResponseData.summary_table && apiResponseData.summary_table.length > 0;
  const hasParkingDataForCost = hasApiResponse && apiResponseData.parking && apiResponseData.years && apiResponseData.years.length > 0;

  // --- JSX Rendering (Main Layout Grid) ---
  return (
    <Grid container spacing={3}>

      {/* === Top Section: Visualizations / Results === */}
      <Grid item xs={12}>
          <Grid container spacing={3}>

               {/* --- Visualizations Panel --- */}
               <Grid item xs={12}>
                  {/* Add position: relative for the overlay */}
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 380, position: 'relative', overflow: 'hidden' }}>
                    <Typography variant="h6" gutterBottom>Visualizations</Typography>

                    {/* Show initial loading/placeholder ONLY if no data exists yet */}
                    {!hasApiResponse && isLoading && (
                       <Box sx={styles.centerBox}><CircularProgress /></Box>
                    )}
                    {!hasApiResponse && !isLoading && (
                       <Box sx={styles.centerBox}><Typography>Run scenario to view visualizations.</Typography></Box>
                    )}

                    {/* ALWAYS Render the VizPanel if data exists. It will update internally when apiResponseData changes. */}
                    {hasApiResponse && (
                       <VisualizationsPanel data={apiResponseData} modes={modes} />
                    )}

                    {/* Subtle Loading Overlay: Shows on top ONLY when loading AND old data exists */}
                    {isLoading && hasApiResponse && (
                        <Box sx={styles.loadingOverlay}>
                            <CircularProgress size={40} thickness={4} />
                        </Box>
                    )}
                  </Paper>
               </Grid>

               {/* --- Parking Summary Table --- */}
               <Grid item xs={12} md={8}>
                 <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
                   <Typography variant="h6" gutterBottom>Parking Summary</Typography>

                   {/* Show initial loading/placeholder ONLY if no summary data exists yet */}
                    {!hasSummaryData && isLoading && (
                       <Box sx={styles.centerBoxSmall}><CircularProgress size={24} /></Box>
                    )}
                   {!hasSummaryData && !isLoading && (
                     <Typography sx={styles.placeholderText}>No summary data available.</Typography>
                   )}

                   {/* ALWAYS Render the Table if data exists. It updates when apiResponseData changes. */}
                   {hasSummaryData && (
                     <SummaryTable summaryData={apiResponseData.summary_table} />
                   )}

                   {/* Subtle Loading Overlay */}
                   {isLoading && hasSummaryData && (
                        <Box sx={styles.loadingOverlay}>
                            {/* Optionally add a smaller spinner or just rely on dimming */}
                            {/* <CircularProgress size={24} /> */}
                        </Box>
                   )}
                 </Paper>
               </Grid>

               {/* --- Final Cost Display --- */}
               <Grid item xs={12} md={4}>
                 <Paper sx={{ p: 2, height: '100%', position: 'relative', overflow: 'hidden' }}>
                   {/* Show initial loading/placeholder ONLY if no cost data exists yet */}
                   {!hasParkingDataForCost && isLoading && (
                       <Box sx={styles.centerBoxSmall}><CircularProgress size={24} /></Box>
                   )}
                   {/* Render default display if no data and not loading */}
                   {!hasParkingDataForCost && !isLoading && (
                       <FinalCostDisplay lastYear={null} finalCost={null} />
                   )}

                   {/* ALWAYS Render the component if data exists. It recalculates/updates when apiResponseData changes. */}
                   {hasParkingDataForCost && (
                       (() => {
                         const yearsArray = apiResponseData.years;
                         const shortfallArray = apiResponseData.parking.shortfall_per_year;
                         const costPerSpace = apiResponseData.parking.cost_per_space;
                         let finalCost = null;
                         let lastYear = null;
                         if (yearsArray && yearsArray.length > 0 && shortfallArray && shortfallArray.length === yearsArray.length && typeof costPerSpace === 'number') {
                             lastYear = yearsArray[yearsArray.length - 1];
                             const lastShortfall = shortfallArray[shortfallArray.length - 1];
                             finalCost = Math.max(0, lastShortfall) * costPerSpace;
                         }
                         return <FinalCostDisplay lastYear={lastYear} finalCost={finalCost} />;
                       })()
                   )}

                   {/* Subtle Loading Overlay */}
                   {isLoading && hasParkingDataForCost && (
                        <Box sx={styles.loadingOverlay}>
                           {/* <CircularProgress size={24} /> */}
                        </Box>
                   )}
                 </Paper>
               </Grid>
          </Grid> {/* Closes inner Grid container */}
      </Grid> {/* Closes Top Section Grid item */}


      {/* === Bottom Section: Interactive Controls === */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>Interactive Scenario Inputs</Typography>
          {/* ControlsPanel handles its own disabling via the isLoading prop */}
          <ControlsPanel
            inputState={inputState} modes={modes}
            onInputChange={onInputChange} onModeShareChange={onModeShareChange}
            onModeNumericInputCommit={onModeNumericInputCommit} onReset={onReset}
            isLoading={isLoading}
          />
        </Paper>
      </Grid> {/* Closes Bottom Section Grid item */}

    </Grid> // Closes main Grid container for the page
  ); // End return
} // End ScenarioPage component

// Define styles locally including the overlay
const styles = {
  centerBox: { display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', minHeight: '200px' },
  centerBoxSmall: { display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, minHeight: '50px'},
  placeholderText: { p: 2, fontStyle: 'italic', color: 'text.secondary', textAlign: 'center' },
  loadingOverlay: { // Style for the overlay
    position: 'absolute',
    inset: 0, // Shortcut for top, right, bottom, left = 0
    backgroundColor: 'rgba(255, 255, 255, 0.65)', // Semi-transparent white background
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Ensure it's above the chart/table content
    backdropFilter: 'blur(1px)', // Optional: Add a slight blur effect
    borderRadius: 'inherit', // Inherit border radius from parent Paper
  }
};

export default ScenarioPage;