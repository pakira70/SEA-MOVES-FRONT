// src/components/ControlsPanel.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Slider, TextField, Button, Grid } from '@mui/material';
// import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // Not used in current code

const formatDisplayValue = (value) => {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) return '';
  const num = Number(value);
  // If the number is very close to an integer (e.g., 25.000000000004), treat as integer for display
  // unless the original string value has more precision (e.g. user typed "25.001")
  const stringValue = String(value);
  if (Math.abs(num - Math.round(num)) < 0.0001 && (!stringValue.includes('.') || stringValue.endsWith('.0'))) {
    return String(Math.round(num));
  }
  // Preserve user's input precision if they typed it, otherwise, default to a reasonable number of decimals for display
  // This part is tricky. The slider will often give many decimals.
  // Let's try to parseFloat to avoid excessive trailing zeros from toFixed if not needed.
  if (typeof value === 'number') {
      return String(parseFloat(value.toFixed(2))); // Display with up to 2 decimals from numeric sources
  }
  return stringValue; // Keep user's typed string as is for intermediate
};


const modeDetailsShape = PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
});


function ControlsPanel({
  inputState, activeModeDetails, sortedActiveModeKeys,
  onModeShareChange, onModeNumericInputCommit, onReset, isLoading,
}) {
  const [intermediateValues, setIntermediateValues] = useState({});
  const focusedInputRef = useRef(null);

  const keysToIterate = useMemo(() => {
    return (Array.isArray(sortedActiveModeKeys) && sortedActiveModeKeys.length > 0)
                    ? sortedActiveModeKeys : Object.keys(activeModeDetails || {});
  }, [sortedActiveModeKeys, activeModeDetails]);

  useEffect(() => {
    const newIntermediateLocal = {};
    let needsUpdate = false;
    const currentInputModeShares = inputState.modeShares || {};

    keysToIterate.forEach(modeKey => {
        const appShareNum = Number(currentInputModeShares[modeKey] ?? 0);
        const formattedAppShareForDisplay = formatDisplayValue(appShareNum);

        if (focusedInputRef.current === modeKey) {
            // If focused, ensure the value exists; if not, initialize from app state
            newIntermediateLocal[modeKey] = intermediateValues[modeKey] !== undefined 
                                       ? intermediateValues[modeKey] 
                                       : formattedAppShareForDisplay;
        } else {
            // If not focused, sync with app state if different
            // Compare numeric values to avoid loops from string formatting differences (e.g. "25" vs "25.0")
            const currentIntermediateNum = parseFloat(intermediateValues[modeKey]);
            if (intermediateValues[modeKey] === undefined || 
                isNaN(currentIntermediateNum) || 
                Math.abs(currentIntermediateNum - appShareNum) > 0.001) { // Compare numerically
                newIntermediateLocal[modeKey] = formattedAppShareForDisplay;
            } else {
                // If numbers are effectively the same, but string format is different, prefer app's formatted version
                // This helps if user typed "25." and app state is 25, it should become "25"
                if (intermediateValues[modeKey] !== formattedAppShareForDisplay) {
                    newIntermediateLocal[modeKey] = formattedAppShareForDisplay;
                } else {
                    newIntermediateLocal[modeKey] = intermediateValues[modeKey]; // Keep existing if no change needed
                }
            }
        }
        if (intermediateValues[modeKey] !== newIntermediateLocal[modeKey]) {
            needsUpdate = true;
        }
    });
    
    // If keys changed, ensure all are present or absent
    if (Object.keys(intermediateValues).length !== keysToIterate.length) {
        needsUpdate = true;
        if (keysToIterate.length === 0) { // No active modes, clear all
            setIntermediateValues({});
            return;
        }
        // Rebuild if keys changed, newIntermediateLocal already respects focus
    }


    if (needsUpdate) {
        setIntermediateValues(newIntermediateLocal);
    }
  }, [inputState.modeShares, keysToIterate]); // Removed intermediateValues from deps


  const handleSliderChange = useCallback((modeKey, newValue) => {
    if (isLoading) return;
    setIntermediateValues(prev => ({ ...prev, [modeKey]: formatDisplayValue(newValue) }));
  }, [isLoading]);

  const handleSliderChangeCommitted = useCallback((modeKey, newValue) => {
    if (isLoading) return;
    const numericValue = Number(parseFloat(Number(newValue).toFixed(2)));
    // setIntermediateValues(prev => ({ ...prev, [modeKey]: formatDisplayValue(numericValue) })); // App.jsx will update inputState, which updates intermediateValues via useEffect
    onModeShareChange(modeKey, numericValue);
  }, [isLoading, onModeShareChange]);

  const handleLocalModeShareTextChange = useCallback((modeKey, event) => {
    if (isLoading) return;
    const { value } = event.target;
    // Allow numbers, a single decimal point, or an empty string
    if (/^(\d+\.?\d*|\d*\.?\d+|\d*)$/.test(value) || value === '') {
        setIntermediateValues(prev => ({ ...prev, [modeKey]: value }));
    }
  }, [isLoading]);

  const handleLocalModeShareTextCommit = useCallback((modeKey) => {
    if (isLoading && focusedInputRef.current === modeKey) {
        focusedInputRef.current = null;
        return;
    }
    if (isLoading) return;

    const rawValue = intermediateValues[modeKey];
    let numericValue = parseFloat(rawValue);

    if (rawValue === '' || isNaN(numericValue)) {
      numericValue = inputState?.modeShares?.[modeKey] ?? 0;
    }
    numericValue = Number(parseFloat(Math.max(0, Math.min(100, numericValue)).toFixed(2)));

    // setIntermediateValues(prev => ({ ...prev, [modeKey]: formatDisplayValue(numericValue) })); // App.jsx will update inputState, which updates intermediateValues via useEffect
    if (focusedInputRef.current === modeKey) focusedInputRef.current = null;
    onModeNumericInputCommit(modeKey, numericValue);
  }, [isLoading, intermediateValues, onModeNumericInputCommit, inputState?.modeShares]);

  const handleKeyDown = useCallback((event, modeKey) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleLocalModeShareTextCommit(modeKey);
      if (event.target && typeof event.target.blur === 'function') {
        event.target.blur(); // Blur the input after Enter
      }
    }
  }, [handleLocalModeShareTextCommit]);

  const currentModeSum = useMemo(() => {
    let sum = 0;
    if (inputState?.modeShares && activeModeDetails) {
        keysToIterate.forEach(modeKey => {
            sum += Number(inputState.modeShares[modeKey] || 0);
        });
    }
    // Round sum to avoid floating point display issues like 99.999999999997
    return parseFloat(sum.toFixed(2));
  }, [inputState?.modeShares, activeModeDetails, keysToIterate]);

  return (
    <Box>
      <Typography variant="h6" component="h3" gutterBottom>
        Mode Shares (Sum: {currentModeSum}%)
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {keysToIterate.map((modeKey) => {
          const modeInfo = activeModeDetails[modeKey];
          if (!modeInfo) return null;

          const liveValueString = intermediateValues[modeKey] !== undefined
                                 ? intermediateValues[modeKey]
                                 : formatDisplayValue(inputState?.modeShares?.[modeKey] ?? 0);
          
          // Slider needs a number. If intermediate is empty string or invalid, default to 0 for slider.
          let liveNumericValueForSlider = parseFloat(liveValueString);
          if (isNaN(liveNumericValueForSlider)) {
              liveNumericValueForSlider = 0;
          }

          const modeDisplayName = modeInfo.name || modeKey;

          return (
            <Grid item xs={12} sm={6} md={4} key={modeKey}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: -0.5 }}>
                  <Typography component="label" htmlFor={`${modeKey}-input`} sx={{ minWidth: '80px', textAlign: 'right', mr:1, fontSize: '0.875rem' }}>{modeDisplayName}:</Typography>
                  <TextField
                    id={`${modeKey}-input`}
                    value={liveValueString}
                    onChange={(e) => handleLocalModeShareTextChange(modeKey, e)}
                    onFocus={() => focusedInputRef.current = modeKey}
                    onBlur={() => { if (focusedInputRef.current === modeKey) handleLocalModeShareTextCommit(modeKey); }}
                    onKeyDown={(e) => handleKeyDown(e, modeKey)}
                    type="text"
                    inputProps={{ style: { textAlign: 'right', paddingRight: '4px' }, maxLength: 6 }}
                    sx={{ width: '70px' }}
                    size="small"
                    disabled={isLoading}
                  />
                  <Typography sx={{ml: 0.5}}>%</Typography>
                </Box>
                <Slider
                  value={liveNumericValueForSlider} // Use the explicitly parsed number
                  onChange={(e, val) => handleSliderChange(modeKey, val)}
                  onChangeCommitted={(e, val) => handleSliderChangeCommitted(modeKey, val)}
                  aria-labelledby={`${modeKey}-slider-label`}
                  valueLabelDisplay="off"
                  step={0.1} min={0} max={100}
                  disabled={isLoading}
                  sx={{
                    color: modeInfo.color || 'primary.main', // Use mode color for slider
                    '& .MuiSlider-thumb': { 
                        width: 12, 
                        height: 12, 
                        marginTop: '-1px', // For 4px track height
                        // backgroundColor: 'currentColor', // Not needed if color prop above works
                    }, 
                    '& .MuiSlider-track': { height: 4 },
                    '& .MuiSlider-rail': { height: 4 },
                  }}
                />
              </Box>
            </Grid>
          );
        })}
        {keysToIterate.length === 0 && ( <Grid item xs={12}> <Typography sx={{p:1, fontStyle: 'italic'}}> No active modes configured.</Typography> </Grid> )}
      </Grid>
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onReset} disabled={isLoading} sx={{ color: 'primary.main', borderColor: 'primary.main' }}> Reset to Baseline </Button>
      </Box>
    </Box>
  );
}

ControlsPanel.propTypes = {
  inputState: PropTypes.shape({
    modeShares: PropTypes.objectOf(PropTypes.number),
  }).isRequired,
  activeModeDetails: PropTypes.objectOf(modeDetailsShape).isRequired,
  sortedActiveModeKeys: PropTypes.arrayOf(PropTypes.string),
  onModeShareChange: PropTypes.func.isRequired,
  onModeNumericInputCommit: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};
ControlsPanel.defaultProps = {
  isLoading: false,
  sortedActiveModeKeys: [],
};

export default ControlsPanel;