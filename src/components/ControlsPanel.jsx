// src/components/ControlsPanel.jsx - UPDATED FOR SMOOTH SLIDER & INTEGER DISPLAY
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Slider, TextField, Button, Grid } from '@mui/material';

// Helper function to format values for display as whole numbers.
const formatForIntegerDisplay = (value) => {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) return '';
  return String(Math.round(Number(value)));
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
  // NEW: This state holds the LIVE numeric values during user interaction (drag or typing).
  // It allows for smooth slider movement because it's updated in real-time.
  const [liveShares, setLiveShares] = useState({});
  const focusedInputRef = useRef(null);

  const keysToIterate = useMemo(() => {
    return (Array.isArray(sortedActiveModeKeys) && sortedActiveModeKeys.length > 0)
                    ? sortedActiveModeKeys : Object.keys(activeModeDetails || {});
  }, [sortedActiveModeKeys, activeModeDetails]);

  // This effect syncs our live state with the main app state when it changes.
  useEffect(() => {
    // We don't want to overwrite the user's interaction, so we only sync
    // if no text field is focused. A more advanced version might also track slider drag state.
    if (!focusedInputRef.current) {
      setLiveShares(inputState.modeShares || {});
    }
  }, [inputState.modeShares]);

  // When the slider is dragged, update the live numeric state with the precise value.
  const handleSliderChange = useCallback((modeKey, newValue) => {
    if (isLoading) return;
    setLiveShares(prev => ({ ...prev, [modeKey]: newValue }));
  }, [isLoading]);

  // When the slider interaction is committed, send the precise value to App.jsx.
  const handleSliderChangeCommitted = useCallback((modeKey, newValue) => {
    if (isLoading) return;
    const numericValue = Number(parseFloat(Number(newValue).toFixed(2)));
    onModeShareChange(modeKey, numericValue);
  }, [isLoading, onModeShareChange]);

  // When the user types in the text field, update the live numeric state.
  const handleLocalModeShareTextChange = useCallback((modeKey, event) => {
    if (isLoading) return;
    const { value } = event.target;
    if (/^\d*$/.test(value)) { // Only allow whole numbers
      // Update liveShares with the number, or 0 if the field is empty.
      const numericValue = value === '' ? 0 : parseInt(value, 10);
      setLiveShares(prev => ({ ...prev, [modeKey]: numericValue }));
    }
  }, [isLoading]);

  // When the text field is committed, send the number to App.jsx.
  const handleLocalModeShareTextCommit = useCallback((modeKey) => {
    if (isLoading && focusedInputRef.current === modeKey) {
        focusedInputRef.current = null;
        return;
    }
    if (isLoading) return;

    let numericValue = liveShares[modeKey];

    if (numericValue === undefined || isNaN(numericValue)) {
      numericValue = Math.round(inputState?.modeShares?.[modeKey] ?? 0);
    }
    numericValue = Math.max(0, Math.min(100, numericValue));

    if (focusedInputRef.current === modeKey) focusedInputRef.current = null;
    onModeNumericInputCommit(modeKey, numericValue);
  }, [isLoading, liveShares, onModeNumericInputCommit, inputState?.modeShares]);

  // Handler for the Enter key.
  const handleKeyDown = useCallback((event, modeKey) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleLocalModeShareTextCommit(modeKey);
      if (event.target && typeof event.target.blur === 'function') {
        event.target.blur();
      }
    }
  }, [handleLocalModeShareTextCommit]);

  const currentModeSum = useMemo(() => {
    let sum = 0;
    if (inputState?.modeShares) {
        Object.values(inputState.modeShares).forEach(share => {
            sum += Number(share || 0);
        });
    }
    return Math.round(sum);
  }, [inputState?.modeShares]);

  return (
    <Box>
      <Typography variant="h6" component="h3" gutterBottom>
        Mode Shares (Sum: {currentModeSum}%)
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {keysToIterate.map((modeKey) => {
          const modeInfo = activeModeDetails[modeKey];
          if (!modeInfo) return null;
          
          // The value for both the slider and the text field's display formatting
          // now comes from our new 'liveShares' state.
          const liveNumericValue = liveShares[modeKey] ?? 0;

          const modeDisplayName = modeInfo.name || modeKey;

          return (
            <Grid item xs={12} sm={6} md={4} key={modeKey}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: -0.5 }}>
                  <Typography component="label" htmlFor={`${modeKey}-input`} sx={{ minWidth: '80px', textAlign: 'right', mr:1, fontSize: '0.875rem' }}>{modeDisplayName}:</Typography>
                  <TextField
                    id={`${modeKey}-input`}
                    // The text field displays the ROUNDED version of the live value.
                    value={formatForIntegerDisplay(liveNumericValue)}
                    onChange={(e) => handleLocalModeShareTextChange(modeKey, e)}
                    onFocus={() => focusedInputRef.current = modeKey}
                    onBlur={() => { if (focusedInputRef.current === modeKey) handleLocalModeShareTextCommit(modeKey); }}
                    onKeyDown={(e) => handleKeyDown(e, modeKey)}
                    type="text"
                    inputProps={{ style: { textAlign: 'right', paddingRight: '4px' }, maxLength: 3, pattern: "\\d*" }}
                    sx={{ width: '70px' }}
                    size="small"
                    disabled={isLoading}
                  />
                  <Typography sx={{ml: 0.5}}>%</Typography>
                </Box>
                <Slider
                  // The slider's value is the PRECISE live value, allowing smooth movement.
                  value={liveNumericValue}
                  onChange={(e, val) => handleSliderChange(modeKey, val)}
                  onChangeCommitted={(e, val) => handleSliderChangeCommitted(modeKey, val)}
                  aria-labelledby={`${modeKey}-slider-label`}
                  valueLabelDisplay="off"
                  step={1} // Step is 1 for whole number snapping.
                  min={0} max={100}
                  disabled={isLoading}
                  sx={{
                    color: modeInfo.color || 'primary.main',
                    '& .MuiSlider-thumb': { 
                        width: 12, 
                        height: 12, 
                        marginTop: '-1px', // As you fixed.
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