import React from 'react';
import { Box, Typography, Slider, TextField, Button, Tooltip, IconButton, Grid } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

function ControlsPanel({ inputState, modes, onInputChange, onModeShareChange, onReset, isLoading }) {

  const handleSliderChange = (mode, event, newValue) => {
    // Prevent updates if loading to avoid race conditions, though debounce helps
    if (isLoading) return;
    onModeShareChange(mode, newValue);
  };

  const handleTextFieldChange = (event) => {
      if (isLoading) return;
      onInputChange(event);
  };


  const currentModeSum = Object.values(inputState.modeShares).reduce((a, b) => a + b, 0);

  return (
    <Box component="form" noValidate autoComplete="off">
      {/* Mode Share Controls */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
        Mode Shares ({currentModeSum.toFixed(1)}%)
         <Tooltip title="Adjust the percentage for each travel mode. The total must always be 100%. Changes are distributed proportionally among other modes.">
            <IconButton size="small" sx={{ ml: 0.5 }}><InfoOutlinedIcon fontSize="inherit" /></IconButton>
         </Tooltip>
      </Typography>
      {modes.map((mode) => (
        <Box key={mode} sx={{ mb: 1 }}>
          <Typography gutterBottom id={`${mode}-slider-label`}>
            {mode} ({inputState.modeShares[mode]?.toFixed(1) || '0.0'}%)
          </Typography>
          <Slider
            aria-labelledby={`${mode}-slider-label`}
            value={inputState.modeShares[mode] || 0}
            onChange={(event, newValue) => handleSliderChange(mode, event, newValue)}
            valueLabelDisplay="auto"
            step={0.1}
            marks
            min={0}
            max={100}
            disabled={isLoading} // Disable while loading
          />
        </Box>
      ))}

      {/* Population Input */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
        Population per Year
         <Tooltip title="Enter annual population figures for the simulation period, separated by commas (e.g., 10000, 10200, 10450).">
            <IconButton size="small" sx={{ ml: 0.5 }}><InfoOutlinedIcon fontSize="inherit" /></IconButton>
         </Tooltip>
      </Typography>
      <TextField
        label="Population (comma-separated)"
        name="populationString"
        value={inputState.populationString}
        onChange={handleTextFieldChange}
        fullWidth
        variant="outlined"
        size="small"
        disabled={isLoading}
        sx={{ mb: 2 }}
      />

      {/* Parking Inputs */}
       <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
        Parking Parameters
         <Tooltip title="Enter annual parking supply (comma-separated, matching population years) and the cost per new parking space.">
            <IconButton size="small" sx={{ ml: 0.5 }}><InfoOutlinedIcon fontSize="inherit" /></IconButton>
         </Tooltip>
      </Typography>
       <Grid container spacing={2}>
            <Grid item xs={12}>
                 <TextField
                   label="Annual Parking Supply (comma-separated)"
                   name="parkingSupplyString"
                   value={inputState.parkingSupplyString}
                   onChange={handleTextFieldChange}
                   fullWidth
                   variant="outlined"
                   size="small"
                   disabled={isLoading}
                 />
            </Grid>
            <Grid item xs={12}>
                 <TextField
                   label="Cost per Parking Space ($)"
                   name="parkingCost"
                   type="number"
                   value={inputState.parkingCost}
                   onChange={handleTextFieldChange}
                    inputProps={{ min: 0, step: "1" }}
                   fullWidth
                   variant="outlined"
                   size="small"
                   disabled={isLoading}
                 />
            </Grid>
       </Grid>


      {/* Reset Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={onReset}
          disabled={isLoading}
        >
          Reset to Baseline
        </Button>
      </Box>
    </Box>
  );
}

export default ControlsPanel;