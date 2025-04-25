// src/components/ControlsPanel.jsx - V2.2 + Step 2.3 Modifications (Local State for Text Inputs)

import React, { useState, useEffect, useRef } from 'react'; // Added useState, useEffect, useRef
import PropTypes from 'prop-types'; // Import PropTypes
import { Box, Typography, Slider, TextField, Button, Tooltip, IconButton, Grid } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Helper to format number for display (e.g., one decimal place)
const formatDisplayValue = (value) => {
    const num = Number(value);
    if (isNaN(num)) {
        return ''; // Return empty string if not a valid number
    }
    // Format to one decimal place, remove trailing .0 if it exists
    const formatted = num.toFixed(1);
    return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
};


function ControlsPanel({
  inputState, // Main state object from App.jsx (contains numeric modeShares)
  modes,      // Array of mode names
  // onInputChange, // NO LONGER NEEDED for mode shares
  onModeShareChange,        // Handler for slider changes (passed up)
  onModeNumericInputCommit, // Handler for mode share text input commit (passed up)
  onReset,                  // Handler for Reset button
  isLoading,                // Loading state to disable controls
  baselineModeShares        // Added in ScenarioPage - Pass down if needed
}) {

  // --- Local State for Intermediate Text Input Values ---
  // Stores the string values currently being typed in the TextFields
  const [intermediateValues, setIntermediateValues] = useState({});
  // Ref to track which input has focus to prevent overwriting user typing
  const focusedInputRef = useRef(null);

  // --- Effect to Initialize and Sync Local State with Props ---
  useEffect(() => {
    console.log("ControlsPanel Effect: Syncing intermediateValues with inputState.modeShares");
    const newIntermediate = {};
    if (inputState && inputState.modeShares) {
      modes.forEach(mode => {
        // Initialize with formatted numeric value from inputState
        newIntermediate[mode] = formatDisplayValue(inputState.modeShares[mode]);
      });
    }
    setIntermediateValues(newIntermediate);
  }, [inputState?.modeShares, modes]); // Rerun if the numeric shares from App change


  // Handler for Slider changes - Calls App.jsx's slider handler
  const handleSliderChange = (mode, event, newValue) => {
    if (isLoading) return;
    const numericValue = typeof newValue === 'number' ? Math.max(0, Math.min(100, newValue)) : 0;
    // Update intermediate value visually immediately
    setIntermediateValues(prev => ({ ...prev, [mode]: formatDisplayValue(numericValue) }));
    // Pass the numeric change up to App.jsx
    onModeShareChange(mode, numericValue);
  };

  // Handler for TYPING in Mode Share input box - Updates LOCAL state only
  const handleModeShareTextChange = (mode, event) => {
      if (isLoading) return;
      const typedValue = event.target.value;
      // Update only the local intermediate state as the user types
      setIntermediateValues(prev => ({ ...prev, [mode]: typedValue }));
  };

   // Handler for finalizing Mode Share text input (onBlur or Enter)
   // Validates local intermediate value and calls the specific commit handler from App.jsx
  const handleModeShareTextCommit = (mode) => {
      if (isLoading) return;
      focusedInputRef.current = null; // Clear focus ref on commit

      const currentValue = intermediateValues[mode]; // Get value from LOCAL state
      let value = parseFloat(currentValue); // Attempt to parse local string input

      // Validate and clamp the value locally before sending up
      if (isNaN(value)) {
        value = 0; // Default to 0 if invalid input
      }
      value = Math.max(0, Math.min(100, value)); // Clamp between 0 and 100

      // Update local state to the cleaned/formatted value
      setIntermediateValues(prev => ({ ...prev, [mode]: formatDisplayValue(value) }));

      // Call the specific commit handler passed from App.jsx with the validated number
      // This is the unified point that triggers the proportional calculation in App.jsx
      console.log(`ControlsPanel: Committing text input for ${mode} with value: ${value}`);
      onModeNumericInputCommit(mode, value);
  };

  // --- Safely Calculate Sum for Display ---
  let currentModeSum = 0;
  if (inputState && inputState.modeShares) {
      currentModeSum = Object.values(inputState.modeShares).reduce((sum, value) => {
          const num = parseFloat(value);
          return sum + (isNaN(num) ? 0 : num);
      }, 0);
  }
  // --- End Sum Calculation ---


  // --- JSX Rendering ---
  return (
    <Box>
      {/* === MODE SHARE SECTION === */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
        Mode Shares ({(typeof currentModeSum === 'number' && !isNaN(currentModeSum)) ? currentModeSum.toFixed(1) : '...'}%)
         <Tooltip title="Adjust percentage via slider or type value in the box (press Enter or click away to apply). Total must be 100%.">
            <IconButton size="small" sx={{ ml: 0.5 }}><InfoOutlinedIcon fontSize="inherit" /></IconButton>
         </Tooltip>
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
          {inputState && inputState.modeShares && modes.map((mode) => {
             // Get the actual numeric value from the main inputState (source of truth)
             const numericValue = Math.max(0, Math.min(100, Number(inputState.modeShares[mode]) || 0));
             // Get the potentially different intermediate string value for the text box
             const displayValue = intermediateValues[mode] ?? ''; // Use local state for display

             return (
              <Grid item xs={12} sm={6} md={4} key={mode}>
                  <Box>
                    {/* Label and Input Box */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: -0.5 }}>
                        <Typography component="label" htmlFor={`${mode}-input`} sx={{ fontSize: '0.875rem', flexShrink: 0, minWidth: '70px' }}>
                          {mode}:
                        </Typography>
                        <TextField
                          id={`${mode}-input`}
                          // VALUE comes from LOCAL intermediate state
                          value={displayValue}
                          // ONCHANGE updates LOCAL intermediate state
                          onChange={(event) => handleModeShareTextChange(mode, event)}
                          // ONBLUR commits the LOCAL state via handler from App
                          onBlur={() => handleModeShareTextCommit(mode)}
                          onFocus={() => focusedInputRef.current = mode} // Track focus
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              handleModeShareTextCommit(mode); // Commit on Enter
                              event.preventDefault(); // Prevent form submission
                              event.target.blur(); // Optional: remove focus
                            } else if (event.key === 'Escape') {
                               // Optional: Revert intermediate value to actual value on Escape
                               setIntermediateValues(prev => ({...prev, [mode]: formatDisplayValue(numericValue)}));
                               event.target.blur();
                            }
                          }}
                          type="text" // Use text to allow intermediate typing like "5."
                          inputMode="decimal" // Hint for mobile keyboards
                          variant="outlined"
                          size="small"
                          disabled={isLoading}
                          inputProps={{
                            step: "0.1",
                            style: { textAlign: 'right', width: '55px', padding: '8px 5px' },
                            'aria-labelledby': `${mode}-slider-label`
                          }}
                          sx={{ ml: 'auto' }}
                        />
                        <Typography sx={{ fontSize: '0.875rem', ml: 0.5 }}>%</Typography>
                    </Box>
                    {/* Slider */}
                    <Slider
                        aria-labelledby={`${mode}-slider-label`} // Use actual label ID if available
                        // VALUE is the actual numeric value from inputState props
                        value={numericValue}
                        // ONCHANGE updates intermediate text AND calls handler passed up
                        onChange={(event, newValue) => handleSliderChange(mode, event, newValue)}
                        valueLabelDisplay="off"
                        step={0.1}
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


      {/* === OTHER INPUTS (Population, Supply, Cost) === */}
      {/* These sections were removed from V2.2 ControlsPanel as they belong on Setup page */}
      {/* If they were intended here, they need separate state/handlers */}


      {/* Reset Button */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onReset} disabled={isLoading}>
          Reset to Baseline
        </Button>
      </Box>
    </Box>
  );
}

// --- Prop Types ---
ControlsPanel.propTypes = {
    inputState: PropTypes.object, // Can be null initially
    modes: PropTypes.arrayOf(PropTypes.string).isRequired,
    // onInputChange: PropTypes.func, // REMOVED
    onModeShareChange: PropTypes.func.isRequired,
    onModeNumericInputCommit: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    baselineModeShares: PropTypes.object // Optional prop
};

ControlsPanel.defaultProps = {
    isLoading: false,
    inputState: { modeShares: {} }, // Provide default structure
    baselineModeShares: {}
};


export default ControlsPanel;