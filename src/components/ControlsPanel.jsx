import React from 'react';
import { Box, Typography, Slider, TextField, Button, Tooltip, IconButton, Grid } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

function ControlsPanel({
  inputState, // Main state object from App.jsx
  modes,      // Array of mode names
  onInputChange,            // Handler for generic inputs & temporary mode share typing
  onModeShareChange,        // Handler for slider changes
  onModeNumericInputCommit, // Handler for mode share text input commit (Blur/Enter)
  onReset,                  // Handler for Reset button
  isLoading                 // Loading state to disable controls
}) {

  // Handler for Slider changes - Calls App.jsx's slider handler
  const handleSliderChange = (mode, event, newValue) => {
    if (isLoading) return;
    // Ensure value passed up is a number
    const numericValue = typeof newValue === 'number' ? newValue : 0;
    onModeShareChange(mode, numericValue);
  };

  // Handler for typing in Mode Share input box - Calls App.jsx's generic handler
  // App.jsx handles updating the state with the raw string via name check
  const handleModeShareInputChange = (mode, event) => {
      if (isLoading) return;
      onInputChange({
          target: {
              name: `modeShares.${mode}`, // Dot notation identifies the target
              value: event.target.value  // Pass the raw string value being typed
          }
      });
  };

   // Handler for finalizing Mode Share text input (onBlur or Enter)
   // Validates locally and calls the specific commit handler passed from App.jsx
  const handleModeShareInputCommit = (mode, event) => {
      if (isLoading) return;
      let value = parseFloat(event.target.value); // Attempt to parse input
      // Validate and clamp the value locally before sending up
      if (isNaN(value)) {
        value = 0; // Default to 0 if invalid input
      }
      value = Math.max(0, Math.min(100, value)); // Clamp between 0 and 100

      // Call the specific commit handler passed from App.jsx with the validated number
      onModeNumericInputCommit(mode, value);
  };

  // Handler for other text inputs (Population, Supply, Cost) - Calls App.jsx's generic handler
  const handleGenericTextFieldChange = (event) => {
      if (isLoading) return;
      onInputChange(event); // Pass the raw event object to App.jsx's handler
  };


  // --- Safely Calculate Sum for Display ---
  let currentModeSum = 0;
  // Check if inputState and modeShares exist before trying to calculate sum
  if (inputState && inputState.modeShares) {
      currentModeSum = Object.values(inputState.modeShares).reduce((sum, value) => {
          const num = parseFloat(value); // Attempt conversion inside reduce
          return sum + (isNaN(num) ? 0 : num); // Add number or 0 if NaN
      }, 0); // Start sum at 0
  }
  // --- End Sum Calculation ---


  // --- JSX Rendering ---
  return (
    // Use Box as the main container, form tag isn't strictly necessary as we handle commits manually
    <Box>
      {/* === MODE SHARE SECTION === */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
        {/* Display sum safely */}
        Mode Shares ({(typeof currentModeSum === 'number' && !isNaN(currentModeSum)) ? currentModeSum.toFixed(1) : '...'}%)
         <Tooltip title="Adjust percentage via slider or type value in the box (press Enter or click away to apply). Total must be 100%.">
            <IconButton size="small" sx={{ ml: 0.5 }}><InfoOutlinedIcon fontSize="inherit" /></IconButton>
         </Tooltip>
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Safety check before mapping modes */}
          {inputState && inputState.modeShares && modes.map((mode) => {

             // --- Safely get values for this mode ---
             const currentModeStateValue = inputState.modeShares[mode];
             const isValidValue = currentModeStateValue !== undefined && currentModeStateValue !== null;

             let numericValue = 0; // Default numeric value for slider
             if (isValidValue) {
                 const parsed = parseFloat(currentModeStateValue);
                 if (!isNaN(parsed)) {
                     numericValue = parsed; // Use parsed float if valid
                 }
             }
             // Clamp numeric value just in case before passing to slider
             numericValue = Math.max(0, Math.min(100, numericValue));

            // Determine display value for TextField safely
            const displayValue = isValidValue
                                  ? (typeof currentModeStateValue === 'number' ? currentModeStateValue.toFixed(1) : String(currentModeStateValue)) // Show number formatted, or string as-is
                                  : '0'; // Default display string '0'
             // --- End Safe Value Getting ---

             return (
              <Grid item xs={12} sm={6} md={4} key={mode}>
                  <Box>
                    {/* Label and Input Box */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: -0.5 }}> {/* Reduced gap */}
                        <Typography component="label" htmlFor={`${mode}-input`} sx={{ fontSize: '0.875rem', flexShrink: 0, minWidth: '70px' }}> {/* Added minWidth */}
                          {mode}:
                        </Typography>
                        <TextField
                          id={`${mode}-input`}
                          value={displayValue} // Use safe display value
                          onChange={(event) => handleModeShareInputChange(mode, event)}
                          onBlur={(event) => handleModeShareInputCommit(mode, event)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              handleModeShareInputCommit(mode, event);
                              event.preventDefault();
                            }
                          }}
                          type="number"
                          variant="outlined"
                          size="small"
                          disabled={isLoading}
                          inputProps={{
                            step: "0.1",
                            style: {
                                textAlign: 'right',
                                width: '55px', // Adjusted width
                                padding: '8px 5px' // Adjusted padding
                            },
                            'aria-labelledby': `${mode}-slider-label` // Link for accessibility
                          }}
                          sx={{ ml: 'auto' }} // Push input to the right
                        />
                        <Typography sx={{ fontSize: '0.875rem', ml: 0.5 }}>%</Typography> {/* Added margin */}
                    </Box>
                    {/* Slider */}
                    <Slider
                        aria-hidden="true" // Hide from accessibility tree as TextField is primary control now
                        value={numericValue} // Use safe numeric value
                        onChange={(event, newValue) => handleSliderChange(mode, event, newValue)}
                        valueLabelDisplay="off"
                        step={0.1} // Fine step for smooth slider movement linked to text input
                        min={0}
                        max={100}
                        disabled={isLoading}
                        size="small"
                    />
                  </Box>
              </Grid>
            );
          })}
      </Grid>
      {/* === END MODE SHARE SECTION === */}


      {/* === POPULATION SECTION === */}
      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        Population per Year
         <Tooltip title="Enter annual population figures, separated by commas.">
            <IconButton size="small" sx={{ ml: 0.5 }}><InfoOutlinedIcon fontSize="inherit" /></IconButton>
         </Tooltip>
      </Typography>
      <TextField
        label="Population (comma-separated)"
        name="populationString"
        value={inputState?.populationString || ''} // Use optional chaining and default
        onChange={handleGenericTextFieldChange} // Use generic handler
        fullWidth
        variant="outlined"
        size="small"
        disabled={isLoading}
        sx={{ mb: 3 }}
      />
      {/* === END POPULATION SECTION === */}


      {/* === PARKING SECTION === */}
      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        Parking Parameters
         <Tooltip title="Enter annual parking supply (comma-separated, matching population years) and cost per space.">
            <IconButton size="small" sx={{ ml: 0.5 }}><InfoOutlinedIcon fontSize="inherit" /></IconButton>
         </Tooltip>
      </Typography>
       <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={8}>
                 <TextField
                   label="Annual Parking Supply (comma-separated)"
                   name="parkingSupplyString"
                   value={inputState?.parkingSupplyString || ''} // Use optional chaining and default
                   onChange={handleGenericTextFieldChange} // Use generic handler
                   fullWidth variant="outlined" size="small" disabled={isLoading}
                 />
            </Grid>
            <Grid item xs={12} sm={4}>
                 <TextField
                   label="Cost per Space ($)"
                   name="parkingCost"
                   type="number"
                   // Use optional chaining and default '' for potentially null number
                   value={inputState?.parkingCost === null || inputState?.parkingCost === undefined ? '' : inputState.parkingCost }
                   onChange={handleGenericTextFieldChange} // Use generic handler
                   inputProps={{ min: 0, step: "1" }} fullWidth variant="outlined" size="small" disabled={isLoading}
                 />
            </Grid>
       </Grid>
       {/* === END PARKING SECTION === */}


      {/* Reset Button */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={onReset}
          disabled={isLoading}
        >
          Reset to Baseline
        </Button>
      </Box>
    </Box> // End main Box container
  );
}

export default ControlsPanel;