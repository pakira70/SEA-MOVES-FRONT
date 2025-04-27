// src/components/ControlsPanel.jsx - MINIMALLY MODIFIED for Object Modes

import React, { useState, useEffect, useRef } from 'react';
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
  inputState,
  modes,      // <<<< Now expected as an OBJECT { modeKey: "DisplayName", ... }
  onModeShareChange,
  onModeNumericInputCommit,
  onReset,
  isLoading,
  // baselineModeShares // Removed from props as it wasn't used internally
}) {

  // --- Local State for Intermediate Text Input Values ---
  const [intermediateValues, setIntermediateValues] = useState({});
  const focusedInputRef = useRef(null);

  // --- Effect to Initialize and Sync Local State with Props ---
  useEffect(() => {
    // console.log("ControlsPanel Effect: Syncing intermediateValues with inputState.modeShares"); // Keep logging minimal
    const newIntermediate = {};
    if (inputState && inputState.modeShares && modes && typeof modes === 'object') {
      // --- CHANGE 1: Iterate over object keys ---
      Object.keys(modes).forEach(modeKey => {
        // Initialize with formatted numeric value from inputState using modeKey
        // --- CHANGE 2: Use modeKey to access inputState ---
        newIntermediate[modeKey] = formatDisplayValue(inputState.modeShares[modeKey]);
      });
    }
    setIntermediateValues(newIntermediate);
    // --- CHANGE 3: Dependency checks specific relevant parts ---
  }, [inputState?.modeShares, modes]); // Rerun if the numeric shares from App change or modes object changes


  // Handler for Slider changes - Calls App.jsx's slider handler
  // Parameter renamed 'mode' to 'modeKey' for clarity
  const handleSliderChange = (modeKey, event, newValue) => {
    if (isLoading) return;
    const numericValue = typeof newValue === 'number' ? Math.max(0, Math.min(100, newValue)) : 0;
    // Update intermediate value visually immediately using modeKey
    // --- CHANGE 4: Use modeKey for intermediate state ---
    setIntermediateValues(prev => ({ ...prev, [modeKey]: formatDisplayValue(numericValue) }));
    // Pass the modeKey and numeric change up to App.jsx
    onModeShareChange(modeKey, numericValue);
  };

  // Handler for TYPING in Mode Share input box - Updates LOCAL state only
  // Parameter renamed 'mode' to 'modeKey'
  const handleModeShareTextChange = (modeKey, event) => {
      if (isLoading) return;
      const typedValue = event.target.value;
      // Update only the local intermediate state as the user types using modeKey
      // --- CHANGE 5: Use modeKey for intermediate state ---
      setIntermediateValues(prev => ({ ...prev, [modeKey]: typedValue }));
  };

   // Handler for finalizing Mode Share text input (onBlur or Enter)
   // Parameter renamed 'mode' to 'modeKey'
  const handleModeShareTextCommit = (modeKey) => {
      if (isLoading) return;
      focusedInputRef.current = null; // Clear focus ref on commit

      // --- CHANGE 6: Use modeKey to access intermediate state ---
      const currentValue = intermediateValues[modeKey]; // Get value from LOCAL state
      let value = parseFloat(currentValue); // Attempt to parse local string input

      // Validate and clamp the value locally before sending up
      if (isNaN(value)) {
        value = 0; // Default to 0 if invalid input
      }
      value = Math.max(0, Math.min(100, value)); // Clamp between 0 and 100

      // Update local state to the cleaned/formatted value using modeKey
      // --- CHANGE 7: Use modeKey for intermediate state ---
      setIntermediateValues(prev => ({ ...prev, [modeKey]: formatDisplayValue(value) }));

      // Call the specific commit handler passed from App.jsx with the modeKey and validated number
      // console.log(`ControlsPanel: Committing text input for ${modeKey} with value: ${value}`); // Keep logging minimal
      onModeNumericInputCommit(modeKey, value);
  };

  // --- Safely Calculate Sum for Display ---
  // This logic remains the same as it iterates over values of inputState.modeShares
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
          {/* --- CHANGE 8: Iterate over object keys --- */}
          {/* Also added safety checks for inputState and modes */}
          {inputState && inputState.modeShares && modes && typeof modes === 'object' && Object.keys(modes).map((modeKey) => {
             // --- CHANGE 9: Use modeKey to access inputState ---
             const numericValue = Math.max(0, Math.min(100, Number(inputState.modeShares[modeKey]) || 0));
             // --- CHANGE 10: Use modeKey to access intermediateValues ---
             const displayValue = intermediateValues[modeKey] ?? ''; // Use local state for display
             // --- CHANGE 11: Use modes[modeKey] for display name ---
             const modeDisplayName = modes[modeKey] || modeKey; // Get display name from modes object

             return (
              // --- CHANGE 12: Use modeKey for React key ---
              <Grid item xs={12} sm={6} md={4} key={modeKey}>
                  <Box>
                    {/* Label and Input Box */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: -0.5 }}>
                        <Typography component="label" htmlFor={`${modeKey}-input`} sx={{ fontSize: '0.875rem', flexShrink: 0, minWidth: '70px' }}>
                          {/* Use display name */}
                          {modeDisplayName}:
                        </Typography>
                        <TextField
                          id={`${modeKey}-input`}
                          value={displayValue}
                          // --- CHANGE 13: Pass modeKey to handlers ---
                          onChange={(event) => handleModeShareTextChange(modeKey, event)}
                          onBlur={() => handleModeShareTextCommit(modeKey)}
                          onFocus={() => focusedInputRef.current = modeKey}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              handleModeShareTextCommit(modeKey);
                              event.preventDefault();
                              event.target.blur();
                            } else if (event.key === 'Escape') {
                               // --- CHANGE 14: Use modeKey for intermediate state ---
                               setIntermediateValues(prev => ({...prev, [modeKey]: formatDisplayValue(numericValue)}));
                               event.target.blur();
                            }
                          }}
                          type="text"
                          inputMode="decimal"
                          variant="outlined"
                          size="small"
                          disabled={isLoading}
                          inputProps={{
                            step: "0.1",
                            style: { textAlign: 'right', width: '55px', padding: '8px 5px' },
                            'aria-labelledby': `${modeKey}-slider-label`
                          }}
                          sx={{ ml: 'auto' }}
                        />
                        <Typography sx={{ fontSize: '0.875rem', ml: 0.5 }}>%</Typography>
                    </Box>
                    {/* Slider */}
                    <Slider
                        aria-labelledby={`${modeKey}-slider-label`} // Label uses modeKey
                        value={numericValue}
                        // --- CHANGE 15: Pass modeKey to handler ---
                        onChange={(event, newValue) => handleSliderChange(modeKey, event, newValue)}
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
    inputState: PropTypes.object,
    // --- CHANGE 16: Update modes prop type ---
    modes: PropTypes.object.isRequired, // Now an OBJECT { modeKey: "DisplayName", ... }
    onModeShareChange: PropTypes.func.isRequired,
    onModeNumericInputCommit: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    // baselineModeShares: PropTypes.object // Removed prop type as it wasn't used
};

ControlsPanel.defaultProps = {
    isLoading: false,
    inputState: { modeShares: {} },
    // baselineModeShares: {}, // Removed default prop
    modes: {} // Add default for modes object
};


export default ControlsPanel;