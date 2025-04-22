import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import ModeShareChart from './charts/ModeShareChart.jsx';
import ParkingChart from './charts/ParkingChart.jsx';

function VisualizationsPanel({ data, modes }) {

 // ============================================
  // PASTE CONSOLE.LOG HERE:
  console.log("VisualizationsPanel received props:", { data, modes });
  // ============================================
  if (!data) {
    return <Typography>No data available for visualization.</Typography>;
  }

  return (
    <Grid container spacing={3} alignItems="stretch">
      {/* Mode Share Chart */}
      <Grid item xs={12} md={6} sx={{minHeight: '300px'}}>
         <Typography variant="subtitle2" align="center" gutterBottom>Mode Share Distribution</Typography>
        {data.processed_mode_shares && (
          <ModeShareChart modeShares={data.processed_mode_shares} modes={modes} />
        )}
      </Grid>

      {/* Parking Demand vs Supply Chart */}
       <Grid item xs={12} md={6} sx={{minHeight: '300px'}}>
          <Typography variant="subtitle2" align="center" gutterBottom>Parking Demand vs. Supply</Typography>
        {data.parking && data.years && (
          <ParkingChart
            years={data.years}
            demand={data.parking.demand_per_year}
            supply={data.parking.supply_per_year}
          />
        )}
      </Grid>
        {/* Add placeholder for CO2 chart if needed later */}
    </Grid>
  );
}

export default VisualizationsPanel;