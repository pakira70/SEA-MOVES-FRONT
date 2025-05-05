// src/components/VisualizationsPanel.jsx - Accept and Pass Adjusted Scenario Demand

import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import PropTypes from 'prop-types';

import ModeShareChart from './charts/ModeShareChart.jsx';
import ParkingChart from './charts/ParkingChart.jsx';

// --- UPDATED Props ---
function VisualizationsPanel({
  scenarioData,
  baselineParkingDemand,
  adjustedScenarioParkingDemand, // <-- NEW: Receive adjusted demand
  modes,
  actualYears
}) {

  // --- Use scenarioData for mode share and supply ---
  const processed_mode_shares = scenarioData?.processed_mode_shares;
  const scenarioParkingData = scenarioData?.parking;
  // Extract supply directly from scenarioData
  const scenarioParkingSupply = scenarioParkingData?.supply_per_year || [];

  // --- Basic check if essential data parts are available ---
  if (!scenarioData || !processed_mode_shares || !scenarioParkingData) {
    return <Typography sx={{ p: 2, color: 'text.secondary' }}>Visualization data unavailable.</Typography>;
  }

  // --- Data Validation ---
  // Validate using years, adjusted scenario demand, baseline demand, and supply
  const isValidData = Array.isArray(actualYears) &&
                      Array.isArray(adjustedScenarioParkingDemand) &&
                      Array.isArray(baselineParkingDemand) && // Added check for baseline
                      Array.isArray(scenarioParkingSupply) &&
                      adjustedScenarioParkingDemand.length > 0 && // Check adjusted demand length
                      adjustedScenarioParkingDemand.length === actualYears.length &&
                      baselineParkingDemand.length === actualYears.length && // Check baseline length
                      scenarioParkingSupply.length === actualYears.length;

  if (!isValidData && actualYears.length > 0) {
      console.error("Data length mismatch or invalid types in VisualizationsPanel:", { actualYears, adjustedScenarioParkingDemand, baselineParkingDemand, scenarioParkingSupply });
      return <Typography sx={{ p: 2, color: 'error.main', textAlign: 'center' }}>Chart data length mismatch detected.</Typography>;
  }
   if (!actualYears.length && adjustedScenarioParkingDemand.length > 0) {
        console.warn("VisualizationsPanel: actualYears array is empty, but data exists.");
        return <Typography sx={{p:2, color: 'text.secondary'}}>Waiting for year configuration...</Typography>
   }
   // Use adjusted demand for the "no data" check
   if (adjustedScenarioParkingDemand.length === 0) {
       return <Typography sx={{p:2, color: 'text.secondary'}}>No data to visualize.</Typography>
   }

  // --- Render Charts ---
  return (
    <Grid container spacing={3} alignItems="stretch">

      {/* Mode Share Chart */}
      <Grid item xs={12} md={5}>
         <Typography variant="subtitle1" align="center" gutterBottom>Mode Share</Typography>
         <Box sx={{ height: 300, position: 'relative' }}>
            <ModeShareChart modeShares={processed_mode_shares} modes={modes} />
         </Box>
      </Grid>

      {/* Parking Chart */}
      <Grid item xs={12} md={7}>
         <Typography variant="subtitle1" align="center" gutterBottom>Parking Supply vs. Demand</Typography>
         {/* --- Pass baselineDemand and ADJUSTED scenarioDemand to ParkingChart --- */}
         <ParkingChart
            years={actualYears}
            baselineDemand={baselineParkingDemand}             // Pass baseline demand
            scenarioDemand={adjustedScenarioParkingDemand}    // Pass ADJUSTED scenario demand
            supply={scenarioParkingSupply}                    // Pass supply (from scenarioData)
          />
      </Grid>

    </Grid>
  );
}

// --- PropTypes Definition ---
VisualizationsPanel.propTypes = {
    scenarioData: PropTypes.shape({
        processed_mode_shares: PropTypes.object,
        parking: PropTypes.shape({
            // demand_per_year is no longer directly needed here, but supply is
            supply_per_year: PropTypes.array,
        }),
    }),
    baselineParkingDemand: PropTypes.arrayOf(PropTypes.number), // Array of baseline demand numbers
    adjustedScenarioParkingDemand: PropTypes.arrayOf(PropTypes.number), // <-- ADDED PropType for adjusted demand
    modes: PropTypes.object.isRequired,
    actualYears: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])).isRequired,
};

// --- Default Props Update ---
VisualizationsPanel.defaultProps = {
  scenarioData: null,
  baselineParkingDemand: [],
  adjustedScenarioParkingDemand: [], // Default to empty array
};


export default VisualizationsPanel;