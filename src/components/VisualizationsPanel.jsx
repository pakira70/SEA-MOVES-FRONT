// src/components/VisualizationsPanel.jsx - REFACTORED for Dynamic Modes

import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import PropTypes from 'prop-types';

import ModeShareChart from './charts/ModeShareChart.jsx';
import ParkingChart from './charts/ParkingChart.jsx';

// --- Prop type for activeModeDetails (can share or redefine) ---
const modeDetailsShape = PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    flags: PropTypes.object,
});


// --- UPDATED Props ---
function VisualizationsPanel({
  scenarioData,                 // Keep raw scenario data
  baselineParkingDemand,        // Keep for ParkingChart
  adjustedScenarioParkingDemand,// Keep for ParkingChart
  activeModeDetails,          // NEW: Receive active mode details
  actualYears                   // Keep for charts
}) {

  // --- Extract data needed by children ---
  // Mode shares are likely keyed by active mode keys now in the API response
  const processed_mode_shares = scenarioData?.processed_mode_shares || {}; // Default to empty object
  // Parking supply is still likely just an array
  const scenarioParkingSupply = scenarioData?.parking?.supply_per_year || [];

  // --- Basic check: Use activeModeDetails existence as a primary check ---
  if (!scenarioData || !activeModeDetails || Object.keys(activeModeDetails).length === 0) {
    // Also check if parking data specifically needed is missing if that's critical
     if (!scenarioData?.parking) {
        console.warn("VisualizationsPanel: Missing parking data in scenarioData.");
        // Decide if this is fatal or just affects ParkingChart
     }
     if (!processed_mode_shares || Object.keys(processed_mode_shares).length === 0) {
         console.warn("VisualizationsPanel: Missing or empty processed_mode_shares in scenarioData.");
         // Decide if this is fatal or just affects ModeShareChart
     }
     // Return generic message if critical data missing
    return <Typography sx={{ p: 2, color: 'text.secondary' }}>Visualization data unavailable or mode configuration missing.</Typography>;
  }

  // --- Data Validation (Focus on Parking Chart data, as ModeShare validates internally) ---
  const isValidParkingData = Array.isArray(actualYears) &&
                      Array.isArray(adjustedScenarioParkingDemand) &&
                      Array.isArray(baselineParkingDemand) &&
                      Array.isArray(scenarioParkingSupply) &&
                      adjustedScenarioParkingDemand.length > 0 && // Check adjusted demand length
                      adjustedScenarioParkingDemand.length === actualYears.length &&
                      baselineParkingDemand.length === actualYears.length && // Check baseline length
                      scenarioParkingSupply.length === actualYears.length;

  // Only render ParkingChart if its specific data is valid
  const canRenderParkingChart = isValidParkingData;

  // --- Render Charts ---
  return (
    <Grid container spacing={3} alignItems="stretch">

      {/* Mode Share Chart (Pass activeModeDetails) */}
      <Grid item xs={12} md={5}>
         <Typography variant="subtitle1" align="center" gutterBottom>Mode Share</Typography>
         <Box sx={{ height: 300, position: 'relative' }}>
            {/* Pass down mode shares and the active mode details */}
            <ModeShareChart
                modeShares={processed_mode_shares}
                activeModeDetails={activeModeDetails} // Pass the new prop
            />
         </Box>
      </Grid>

      {/* Parking Chart (Props unchanged, but conditionally render based on its data validity) */}
      <Grid item xs={12} md={7}>
         <Typography variant="subtitle1" align="center" gutterBottom>Parking Supply vs. Demand</Typography>
         {canRenderParkingChart ? (
             <ParkingChart
                years={actualYears}
                baselineDemand={baselineParkingDemand}
                scenarioDemand={adjustedScenarioParkingDemand}
                supply={scenarioParkingSupply}
             />
         ) : (
             <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>
                     Parking chart data unavailable or length mismatch.
                 </Typography>
             </Box>
         )}
      </Grid>

    </Grid>
  );
}

// --- PropTypes Definition Updated ---
VisualizationsPanel.propTypes = {
    scenarioData: PropTypes.shape({
        processed_mode_shares: PropTypes.object, // Shares keyed by mode key
        parking: PropTypes.shape({
            supply_per_year: PropTypes.array, // Still expect parking supply array
            // Other parking data like demand/cost might also be here
        }),
        // Include other parts of scenarioData if needed
    }),
    baselineParkingDemand: PropTypes.arrayOf(PropTypes.number),
    adjustedScenarioParkingDemand: PropTypes.arrayOf(PropTypes.number),
    // modes: PropTypes.object.isRequired, // REMOVED
    activeModeDetails: PropTypes.objectOf(modeDetailsShape).isRequired, // NEW: Active mode details object
    actualYears: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])).isRequired,
};

// --- Default Props Update ---
VisualizationsPanel.defaultProps = {
  scenarioData: null,
  baselineParkingDemand: [],
  adjustedScenarioParkingDemand: [],
  activeModeDetails: {}, // Default to empty object
};


export default VisualizationsPanel;