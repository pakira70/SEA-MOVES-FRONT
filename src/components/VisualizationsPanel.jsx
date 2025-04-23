// src/components/VisualizationsPanel.jsx - Corrected Import Paths

import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import PropTypes from 'prop-types'; // Import PropTypes

// Import Chart Components - Assuming both are in src/components/charts/
import ModeShareChart from './charts/ModeShareChart.jsx';
import ParkingChart from './charts/ParkingChart.jsx';
// Import other chart components if you have them, adjusting paths as needed

// Receive actualYears prop
function VisualizationsPanel({ data, modes, actualYears }) {

  // Basic check if essential data parts are available
  if (!data || !data.processed_mode_shares || !data.parking) {
    // Optionally return null or a more specific message if needed
    return <Typography sx={{ p: 2, color: 'text.secondary' }}>Visualization data unavailable.</Typography>;
  }

  const { processed_mode_shares, parking } = data;
  // Defensive check for parking data arrays
  const demand_per_year = parking?.demand_per_year || [];
  const supply_per_year = parking?.supply_per_year || [];

  // Validate that actualYears array matches expected data length (using demand array length)
  const isValidData = Array.isArray(actualYears) &&
                      Array.isArray(demand_per_year) &&
                      Array.isArray(supply_per_year) &&
                      demand_per_year.length > 0 && // Ensure there's actual data
                      demand_per_year.length === actualYears.length &&
                      supply_per_year.length === actualYears.length;

  // If data lengths don't match, show an error instead of trying to render charts
  if (!isValidData && actualYears.length > 0) { // Only show error if years array exists but data doesn't match
      console.error("Data length mismatch or invalid types in VisualizationsPanel:", { actualYears, demand_per_year, supply_per_year });
      return <Typography sx={{ p: 2, color: 'error.main', textAlign: 'center' }}>Chart data length mismatch detected. Please check inputs or reset.</Typography>;
  }
   // If actualYears is empty but data exists, it might be an initial loading state issue
   if (!actualYears.length && demand_per_year.length > 0) {
        console.warn("VisualizationsPanel: actualYears array is empty, but data exists.");
        // Decide how to handle: show error, placeholder, or try rendering with default labels?
        // Let's show a placeholder for now.
        return <Typography sx={{p:2, color: 'text.secondary'}}>Waiting for year configuration...</Typography>
   }
   // If no data arrays exist at all, just return null or a simple message
   if (demand_per_year.length === 0) {
       return <Typography sx={{p:2, color: 'text.secondary'}}>No data to visualize.</Typography>
   }

  // --- Render Charts if data is valid ---
  return (
    <Grid container spacing={3} alignItems="stretch"> {/* alignItems stretch helps columns have same height potentially */}

      {/* Mode Share Chart */}
      <Grid item xs={12} md={5}>
         <Typography variant="subtitle1" align="center" gutterBottom>Mode Share</Typography>
         {/* Ensure Box has height for the chart to render into */}
         <Box sx={{ height: 300, position: 'relative' }}>
            <ModeShareChart modeShares={processed_mode_shares} modes={modes} />
         </Box>
      </Grid>

      {/* Parking Chart */}
      <Grid item xs={12} md={7}>
         <Typography variant="subtitle1" align="center" gutterBottom>Parking Supply vs. Demand</Typography>
         {/* ParkingChart component manages its own internal div/height */}
         <ParkingChart
            years={actualYears}
            demand={demand_per_year}
            supply={supply_per_year}
          />
      </Grid>

      {/* Add other charts here if needed */}

    </Grid>
  );
}

// --- PropTypes Definition ---
VisualizationsPanel.propTypes = {
    data: PropTypes.shape({
        processed_mode_shares: PropTypes.object,
        parking: PropTypes.shape({
            demand_per_year: PropTypes.array,
            supply_per_year: PropTypes.array,
            // Include other expected keys if needed
        }),
        // Include other expected top-level keys if needed
    }), // Allow data to be potentially null or undefined initially
    modes: PropTypes.arrayOf(PropTypes.string).isRequired,
    actualYears: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])).isRequired,
};

export default VisualizationsPanel;