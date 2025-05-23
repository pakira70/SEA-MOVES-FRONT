// src/components/ControlsPanel.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Slider, TextField, Button, Tooltip, IconButton, Grid } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const formatDisplayValue = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return '';
  const num = Number(value);
  const fixedNum = num.toFixed(1);
  return String(parseFloat(fixedNum));
};

const modeDetailsShape = PropTypes.shape({ /* ... */ });

function ControlsPanel({
  inputState, activeModeDetails, sortedActiveModeKeys,
  onModeShareChange, onModeNumericInputCommit, onReset, isLoading,
}) {
  console.log("[CRITICAL_PROP_LOG] ControlsPanel.jsx - RECEIVED sortedActiveModeKeys:", JSON.stringify(sortedActiveModeKeys));
  const [intermediateValues, setIntermediateValues] = useState({});
  const focusedInputRef = useRef(null);

  const keysToIterate = useMemo(() => {
    const result = (Array.isArray(sortedActiveModeKeys) && sortedActiveModeKeys.length > 0)
                    ? sortedActiveModeKeys : Object.keys(activeModeDetails || {});
    console.log("[CRITICAL_PROP_LOG] ControlsPanel.jsx - keysToIterate (used for .map):", JSON.stringify(result));
    return result;
  }, [sortedActiveModeKeys, activeModeDetails]);

  useEffect(() => {
    // Sync intermediateValues with inputState.modeShares when props change,
    // but respect focused input.
    const newIntermediate = {};
    let needsUpdate = false;
    keysToIterate.forEach(modeKey => {
      const appShare = inputState.modeShares[modeKey];
      const formattedAppShare = formatDisplayValue(appShare ?? 0);
      if (focusedInputRef.current === modeKey) {
        // If focused, keep the user's current typing in intermediateValues
        newIntermediate[modeKey] = intermediateValues[modeKey] !== undefined ? intermediateValues[modeKey] : formattedAppShare;
      } else {
        newIntermediate[modeKey] = formattedAppShare;
      }
      if (intermediateValues[modeKey] !== newIntermediate[modeKey]) {
        needsUpdate = true;
      }
    });
    // If the set of keys changed, also mark for update
    if (Object.keys(intermediateValues).length !== keysToIterate.length) {
        needsUpdate = true;
    }

    if (needsUpdate) {
      setIntermediateValues(newIntermediate);
    }
  }, [inputState.modeShares, keysToIterate]); // Removed activeModeDetails, covered by keysToIterate

  const handleSliderChange = useCallback((modeKey, newValue) => {
    if (isLoading) return;
    // Update intermediateValue for both slider visual and text field
    setIntermediateValues(prev => ({ ...prev, [modeKey]: formatDisplayValue(newValue) }));
    // NO call to onModeShareChange here for live app state update
  }, [isLoading]);

  const handleSliderChangeCommitted = useCallback((modeKey, newValue) => {
    if (isLoading) return;
    const numericValue = Math.max(0, Math.min(100, Number(newValue))); // Clamp
    // Ensure intermediate reflects this final clamped value
    setIntermediateValues(prev => ({ ...prev, [modeKey]: formatDisplayValue(numericValue) }));
    onModeShareChange(modeKey, numericValue); // Update App.jsx state
  }, [isLoading, onModeShareChange]);

  const handleLocalModeShareTextChange = useCallback((modeKey, event) => {
    if (isLoading) return;
    setIntermediateValues(prev => ({ ...prev, [modeKey]: event.target.value }));
  }, [isLoading]);

  const handleLocalModeShareTextCommit = useCallback((modeKey) => {
    if (isLoading) {
      if (focusedInputRef.current === modeKey) focusedInputRef.current = null;
      return;
    }
    const rawValue = intermediateValues[modeKey];
    let numericValue = parseFloat(rawValue);

    if (isNaN(numericValue)) {
      numericValue = inputState?.modeShares?.[modeKey] ?? 0;
    }
    numericValue = Math.max(0, Math.min(100, numericValue)); // Clamp

    setIntermediateValues(prev => ({ ...prev, [modeKey]: formatDisplayValue(numericValue) }));
    if (focusedInputRef.current === modeKey) focusedInputRef.current = null;
    onModeNumericInputCommit(modeKey, numericValue); // Update App.jsx state
  }, [isLoading, intermediateValues, onModeNumericInputCommit, inputState?.modeShares]);

  const currentModeSum = useMemo(() => { /* ... as before ... */
    let sum = 0;
    if (inputState?.modeShares && activeModeDetails) {
        keysToIterate.forEach(modeKey => {
            sum += Number(inputState.modeShares[modeKey] || 0);
        });
    }
    return parseFloat(sum.toFixed(1));
  }, [inputState?.modeShares, activeModeDetails, keysToIterate]);

  useEffect(() => { /* ... [RENDER_ORDER_DEBUG] log as before ... */ });

  return (
    <Box>
      <Typography /* ... */ >Mode Shares (Sum: {currentModeSum}%)</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {keysToIterate.map((modeKey) => {
          const modeInfo = activeModeDetails[modeKey];
          if (!modeInfo) return null;

          // Slider value should now come from intermediateValues for responsiveness,
          // falling back to app state if intermediate isn't set.
          const liveValueString = intermediateValues[modeKey] !== undefined 
                                 ? intermediateValues[modeKey] 
                                 : formatDisplayValue(inputState?.modeShares?.[modeKey] ?? 0);
          const liveNumericValue = Number(liveValueString || 0);

          const modeDisplayName = modeInfo.name || modeKey;

          return (
            <Grid item xs={12} sm={6} md={4} key={modeKey}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: -0.5 }}>
                  <Typography component="label" htmlFor={`${modeKey}-input`} sx={{ minWidth: '80px', textAlign: 'right', mr:1, fontSize: '0.875rem' }}>{modeDisplayName}:</Typography>
                  <TextField
                    id={`${modeKey}-input`}
                    value={liveValueString} // Driven by intermediateValues
                    onChange={(e) => handleLocalModeShareTextChange(modeKey, e)}
                    onFocus={() => focusedInputRef.current = modeKey}
                    onBlur={() => { if (focusedInputRef.current === modeKey) handleLocalModeShareTextCommit(modeKey); }}
                    onKeyDown={(e) => { /* ... as before ... */ }}
                    type="text"
                    inputProps={{ style: { textAlign: 'right', paddingRight: '4px' }, maxLength: 5 }}
                    sx={{ width: '70px' }}
                    size="small"
                    disabled={isLoading}
                  />
                  <Typography sx={{ml: 0.5}}>%</Typography>
                </Box>
                <Slider
                  value={liveNumericValue} // Driven by intermediateValues (converted to number)
                  onChange={(e, val) => handleSliderChange(modeKey, val)} // Updates intermediateValues
                  onChangeCommitted={(e, val) => handleSliderChangeCommitted(modeKey, val)} // Updates App.jsx state
                  aria-labelledby={`${modeKey}-slider-label`}
                  valueLabelDisplay="off"
                  step={0.1} min={0} max={100}
                  disabled={isLoading}
                  sx={{
                    color: 'primary.main',
                    '& .MuiSlider-thumb': { width: 12, height: 12, marginTop: '-1px' }, // Item 2: Centering (12h thumb on 4h track)
                                                                                      // If track height is 6px, marginTop: -3px
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

ControlsPanel.propTypes = { /* ... as before ... */
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
ControlsPanel.defaultProps = { /* ... as before ... */
  isLoading: false,
  sortedActiveModeKeys: [],
};

export default ControlsPanel;