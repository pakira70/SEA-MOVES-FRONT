// src/pages/ScenarioPage.jsx - Calculate and Pass Actual Years

import React, { useMemo } from 'react'; // Import useMemo
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

// Receive props from App.jsx, including startYear and numYears
function ScenarioPage({
  inputState,
  apiResponseData,
  isLoading,
  modes,
  onInputChange,
  onModeShareChange,
  onModeNumericInputCommit,
  onReset,
  startYear, // Receive startYear
  numYears   // Receive numYears
}) {

  // --- Calculate Actual Years ---
  // Use useMemo to prevent recalculating on every render unless props change
  const actualYears = useMemo(() => {
    if (typeof startYear !== 'number' || typeof numYears !== 'number' || numYears < 1) {
      // Return default or empty array if props are invalid
      // Match length of data if possible, otherwise default
      const dataLength = apiResponseData?.years?.length || 0;
      return Array.from({ length: dataLength }, (_, i) => `Year ${i + 1}`); // Fallback
    }
    // Generate array like [2024, 2025, 2026, ...]
    return Array.from({ length: numYears }, (_, i) => startYear + i);
  }, [startYear, numYears, apiResponseData?.years?.length]); // Recompute if these change

  // --- Determine Data Availability ---
  const hasApiResponse = apiResponseData !== null;
  // Use actualYears length for consistency checks if available and valid
  const expectedDataLength = actualYears.length;
  const hasSummaryData = hasApiResponse && apiResponseData.summary_table && apiResponseData.summary_table.length === expectedDataLength;
  const hasParkingDataForCost = hasApiResponse && apiResponseData.parking && apiResponseData.parking.demand_per_year?.length === expectedDataLength;


  // --- JSX Rendering (Pass actualYears down) ---
  return (
    <Grid container spacing={3}>

      {/* === Top Section: Visualizations / Results === */}
      <Grid item xs={12}>
          <Grid container spacing={3}>
               {/* --- Visualizations Panel --- */}
               <Grid item xs={12}>
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 380, position: 'relative', overflow: 'hidden' }}>
                    <Typography variant="h6" gutterBottom>Visualizations</Typography>
                    {!hasApiResponse && isLoading && ( <Box sx={styles.centerBox}><CircularProgress /></Box> )}
                    {!hasApiResponse && !isLoading && ( <Box sx={styles.centerBox}><Typography>Run scenario to view visualizations.</Typography></Box> )}
                    {hasApiResponse && (
                       // Pass actualYears to VisualizationsPanel
                       <VisualizationsPanel
                           data={apiResponseData}
                           modes={modes}
                           actualYears={actualYears} // Pass the calculated years
                        />
                    )}
                    {isLoading && hasApiResponse && ( <Box sx={styles.loadingOverlay}><CircularProgress size={40} thickness={4} /></Box> )}
                  </Paper>
               </Grid>

               {/* --- Parking Summary Table --- */}
               {/* Note: SummaryTable likely uses the 'year' field from the data directly, */}
               {/* which might need adjustment if backend sends 1,2,3... but we want 2024, 2025... */}
               {/* Let's assume backend summary_table will be updated or we adjust here later */}
               <Grid item xs={12} md={8}>
                 <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
                   <Typography variant="h6" gutterBottom>Parking Summary</Typography>
                   {!hasSummaryData && isLoading && ( <Box sx={styles.centerBoxSmall}><CircularProgress size={24} /></Box> )}
                   {!hasSummaryData && !isLoading && ( <Typography sx={styles.placeholderText}>No summary data available.</Typography> )}
                   {hasSummaryData && (
                     // Pass actualYears if SummaryTable needs them for display formatting?
                     // For now, assume it uses data[i].year
                     <SummaryTable summaryData={apiResponseData.summary_table} />
                   )}
                   {isLoading && hasSummaryData && ( <Box sx={styles.loadingOverlay}></Box> )}
                 </Paper>
               </Grid>

               {/* --- Final Cost Display --- */}
               <Grid item xs={12} md={4}>
                 <Paper sx={{ p: 2, height: '100%', position: 'relative', overflow: 'hidden' }}>
                   {!hasParkingDataForCost && isLoading && ( <Box sx={styles.centerBoxSmall}><CircularProgress size={24} /></Box> )}
                   {!hasParkingDataForCost && !isLoading && ( <FinalCostDisplay lastYear={null} finalCost={null} /> )}
                   {hasParkingDataForCost && (
                       (() => {
                         // Use the last year from actualYears for display
                         const lastActualYear = actualYears[actualYears.length - 1];
                         const shortfallArray = apiResponseData.parking.shortfall_per_year;
                         const costPerSpace = apiResponseData.parking.cost_per_space;
                         let finalCost = null;

                         if (shortfallArray && shortfallArray.length === actualYears.length && typeof costPerSpace === 'number') {
                             const lastShortfall = shortfallArray[shortfallArray.length - 1];
                             finalCost = Math.max(0, lastShortfall) * costPerSpace;
                         }
                         // Pass the actual last year to the component
                         return <FinalCostDisplay lastYear={lastActualYear} finalCost={finalCost} />;
                       })()
                   )}
                   {isLoading && hasParkingDataForCost && ( <Box sx={styles.loadingOverlay}></Box> )}
                 </Paper>
               </Grid>
          </Grid> {/* Closes inner Grid container */}
      </Grid> {/* Closes Top Section Grid item */}

      {/* === Bottom Section: Interactive Controls === */}
      <Grid item xs={12}>
         {/* ... ControlsPanel ... */}
         <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>Interactive Scenario Inputs</Typography>
          <ControlsPanel
            inputState={inputState} modes={modes}
            onInputChange={onInputChange} onModeShareChange={onModeShareChange}
            onModeNumericInputCommit={onModeNumericInputCommit} onReset={onReset}
            isLoading={isLoading}
          />
        </Paper>
      </Grid>
    </Grid> // Closes main Grid container
  ); // End return
} // End ScenarioPage component

// Add prop types for new props
import PropTypes from 'prop-types';
ScenarioPage.propTypes = {
    inputState: PropTypes.object.isRequired,
    apiResponseData: PropTypes.object, // Can be null initially
    isLoading: PropTypes.bool.isRequired,
    modes: PropTypes.arrayOf(PropTypes.string).isRequired,
    onInputChange: PropTypes.func.isRequired,
    onModeShareChange: PropTypes.func.isRequired,
    onModeNumericInputCommit: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
    startYear: PropTypes.number.isRequired, // Added
    numYears: PropTypes.number.isRequired,  // Added
};


// Define styles locally or import from a shared file
const styles = {
  centerBox: { display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', minHeight: '200px' },
  centerBoxSmall: { display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, minHeight: '50px'},
  placeholderText: { p: 2, fontStyle: 'italic', color: 'text.secondary', textAlign: 'center' },
  loadingOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, backdropFilter: 'blur(1px)', borderRadius: 'inherit' }
};

export default ScenarioPage;