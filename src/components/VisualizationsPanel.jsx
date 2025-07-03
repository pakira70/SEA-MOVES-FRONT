// src/components/VisualizationsPanel.jsx - CORRECTED SIMPLE PASS-THROUGH
import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import PropTypes from 'prop-types';

import ModeShareChart from './charts/ModeShareChart.jsx';
import ParkingChart from './charts/ParkingChart.jsx';

function VisualizationsPanel({
  // Receive simple, direct props. No more complex nested objects.
  modeShares,
  parkingSupply,
  parkingDemand,
  baselineParkingDemand,
  activeModeDetails,
  actualYears
}) {

  return (
    <Grid container spacing={3} alignItems="stretch">
      <Grid item xs={12} md={5}>
         <Typography variant="subtitle1" align="center" gutterBottom>Mode Share</Typography>
         <Box sx={{ height: 300, position: 'relative' }}>
            <ModeShareChart
                modeShares={modeShares}
                activeModeDetails={activeModeDetails}
            />
         </Box>
      </Grid>
      <Grid item xs={12} md={7}>
         <Typography variant="subtitle1" align="center" gutterBottom>Parking Supply vs. Demand</Typography>
         <Box sx={{ height: 300, position: 'relative' }}>
            <ParkingChart
                years={actualYears}
                baselineDemand={baselineParkingDemand}
                scenarioDemand={parkingDemand}
                supply={parkingSupply}
            />
         </Box>
      </Grid>
    </Grid>
  );
}

VisualizationsPanel.propTypes = {
    modeShares: PropTypes.object.isRequired,
    parkingSupply: PropTypes.array.isRequired,
    parkingDemand: PropTypes.array.isRequired,
    baselineParkingDemand: PropTypes.array.isRequired,
    activeModeDetails: PropTypes.object.isRequired,
    actualYears: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])).isRequired,
};

export default VisualizationsPanel;