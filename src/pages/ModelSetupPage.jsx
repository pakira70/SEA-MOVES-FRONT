// src/pages/ModelSetupPage.jsx - COMPLETE REFACTOR with Baseline Share Editing

import React, { useState, useMemo } from 'react';
import {
    Typography, Paper, Box, Grid, TextField, Divider, Tooltip, IconButton, Stack, Button, Chip, Alert
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';
import PropTypes from 'prop-types';

// Import the modal component (Ensure path is correct)
import ModeSelectorModal from '../components/ModeSelectorModal.jsx';

// --- Prop types ---
const availableModeShape = PropTypes.shape({
    key: PropTypes.string.isRequired,
    defaultName: PropTypes.string.isRequired,
    defaultColor: PropTypes.string.isRequired,
    flags: PropTypes.object.isRequired,
    isDefaultActive: PropTypes.bool.isRequired,
    parking_factor_per_person: PropTypes.number.isRequired,
    defaultBaselineShare: PropTypes.number, // Allow optional baseline share
});
// --- End Prop types ---


// --- Component Definition ---
function ModelSetupPage({
    // Core baseline config values (non-mode specific)
    baselineConfig,
    intermediateNumberInputs,
    // Mode Definitions and State
    availableModes,         // Array of all possible modes from API
    baselineModeSelection,  // Object: { DRIVE: true, WALK: false, ... } - Which modes constitute the baseline
    baselineModeShares,     // Object: { DRIVE: 71, WALK: 10, ... } - User-defined baseline shares
    modeCustomizations,     // Object: { DRIVE: { name: 'SOV', color: '#...' }, ... } - Display overrides
    // Handlers from App.jsx
    onBaselineNumberInputChange,
    onBaselineNumberCommit,
    onBaselineModeSelectionChange,    // For changing which modes are part of the baseline
    onBaselineModeShareValueChange, // For changing the % value of a baseline mode share
    onModeCustomizationChange,      // For changing display name/color
}) {
    // Log received props for debugging
    console.log("ModelSetupPage RECEIVED PROPS:", { baselineConfig, intermediateNumberInputs, availableModes, baselineModeSelection, baselineModeShares, modeCustomizations });

    // State for controlling the mode selection modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Helper to trigger commit on Enter key press for number fields
    const handleNumberKeyDown = (event) => {
        if (event.key === 'Enter') {
            onBaselineNumberCommit(event);
            event.preventDefault();
        }
    };

    // --- Derive Modes selected for the BASELINE for display ---
    const baselineActiveModesToDisplay = useMemo(() => {
        if (!baselineModeSelection || !availableModes || !modeCustomizations) return [];
        return Object.entries(baselineModeSelection)
            .filter(([key, isSelected]) => isSelected)
            .map(([key]) => {
                const baseMode = availableModes.find(m => m.key === key);
                const custom = modeCustomizations[key] || {};
                return {
                    key: key,
                    name: custom.name || baseMode?.defaultName || key,
                    color: custom.color || baseMode?.defaultColor || '#888888',
                };
            });
    }, [baselineModeSelection, modeCustomizations, availableModes]);

    // --- Calculate sum of CURRENT baseline shares for validation display ---
    const currentBaselineSum = useMemo(() => {
        if (!baselineModeShares) return 0;
        // Sum only the shares for modes currently selected in the baseline
        return Object.entries(baselineModeShares).reduce((sum, [key, value]) => {
            // Check if this key is actually selected in the baseline
            if (baselineModeSelection && baselineModeSelection[key]) {
                return sum + (Number(value) || 0);
            }
            return sum;
        }, 0);
    }, [baselineModeShares, baselineModeSelection]);


    // --- Handle Modal Save ---
    // This handler updates which modes are considered part of the baseline
    const handleModalSave = (newSelectedKeys) => {
         console.log("Modal Save triggered for BASELINE selection:", newSelectedKeys);
         // Compare new selection with old to call handler only for changes
         Object.keys(newSelectedKeys).forEach(key => {
             if (baselineModeSelection.hasOwnProperty(key) && newSelectedKeys[key] !== baselineModeSelection[key]) {
                 onBaselineModeSelectionChange(key, newSelectedKeys[key]); // Call App.jsx handler
             } else if (!baselineModeSelection.hasOwnProperty(key) && newSelectedKeys[key]) {
                  onBaselineModeSelectionChange(key, newSelectedKeys[key]); // Call App.jsx handler
             }
         });
         // Check for deselections
         Object.keys(baselineModeSelection).forEach(key => {
              if (baselineModeSelection[key] && (!newSelectedKeys.hasOwnProperty(key) || !newSelectedKeys[key])) {
                   onBaselineModeSelectionChange(key, false); // Call App.jsx handler
              }
         });
        setIsModalOpen(false); // Close modal
    };

    // --- JSX Structure ---
    return (
        <Box sx={{ mt: 2 }}>
            <Paper sx={{ p: 3 }}>

                {/* Header */}
                <Typography variant="h5" component="h2" gutterBottom>
                    Model Setup / Baseline Configuration
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                    Adjust the default assumptions, time frame, and baseline mode distribution for the model. Changes here define the state restored by 'Reset to Baseline' on the Scenario Tool.
                </Typography>

                {/* Main Grid Container */}
                <Grid container spacing={4}> {/* Increased spacing */}

                    {/* === Section 1: Time Frame (No Change) === */}
                    <Grid item xs={12} md={6}>
                         <Typography variant="h6" gutterBottom> Simulation Time Frame </Typography>
                         <Stack spacing={2}>
                            <TextField label="Start Year" variant="outlined" size="small" sx={{ maxWidth: '120px' }} name="startYear" type="number" value={intermediateNumberInputs.startYear} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} />
                            <TextField label="Number of Years" variant="outlined" size="small" sx={{ maxWidth: '120px' }} name="numYears" type="number" value={intermediateNumberInputs.numYears} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} />
                         </Stack>
                    </Grid>

                     {/* === Section 2: Population & Attendance (No Change) === */}
                     <Grid item xs={12} md={6}>
                         <Typography variant="h6" gutterBottom> Default Population & Attendance </Typography>
                          <Stack spacing={2}>
                            <TextField label="Start Population" variant="outlined" size="small" sx={{ maxWidth: '150px' }} name="quickStartPopulation" type="number" value={intermediateNumberInputs.quickStartPopulation} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} />
                            <TextField label="Annual Growth Rate (%)" variant="outlined" size="small" sx={{ maxWidth: '120px' }} name="quickAnnualGrowthRate" type="number" value={intermediateNumberInputs.quickAnnualGrowthRate} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "0.1" }} />
                            <TextField label="Daily Show Rate (%)" variant="outlined" size="small" sx={{ maxWidth: '120px' }} name="showRate" type="number" value={intermediateNumberInputs.showRate} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} InputProps={{ endAdornment: <Tooltip title="Percentage of total population present on an average day."><InfoOutlinedIcon fontSize='small' sx={{ color: 'action.active' }} /></Tooltip>}} />
                         </Stack>
                    </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

                    {/* === Section 3: Parking (No Change) === */}
                     <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom> Default Parking Model </Typography>
                        <Stack spacing={2}>
                            <TextField label="Starting Parking Supply" variant="outlined" size="small" sx={{ maxWidth: '150px' }} name="quickStartParkingSupply" type="number" value={intermediateNumberInputs.quickStartParkingSupply} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} />
                            <TextField label="Cost per Space ($)" variant="outlined" size="small" sx={{ maxWidth: '150px' }} name="defaultParkingCost" type="number" value={intermediateNumberInputs.defaultParkingCost} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} />
                        </Stack>
                    </Grid>

                    {/* === Section 4: Baseline Active Modes (NEW) === */}
                    <Grid item xs={12} md={6}>
                         <Typography variant="h6" gutterBottom> Baseline Active Modes </Typography>
                         <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Select which modes constitute the baseline scenario. Only these modes will have baseline shares.
                         </Typography>
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1, p: 1.5, border: '1px dashed', borderColor: 'divider', borderRadius: 1, minHeight: '40px' }}>
                             {baselineActiveModesToDisplay.length > 0 ? baselineActiveModesToDisplay.map(mode => (
                                 <Chip
                                     key={mode.key}
                                     label={mode.name}
                                     size="small"
                                     sx={{ backgroundColor: mode.color, color: theme => theme.palette.getContrastText(mode.color || '#888888') }}
                                 />
                             )) : (
                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', width: '100%' }}>No modes selected for baseline.</Typography>
                             )}
                             <Button
                                startIcon={<EditIcon />}
                                onClick={() => setIsModalOpen(true)}
                                size="small"
                                variant="text" // Make button less prominent
                                sx={{ ml: 'auto', alignSelf: 'flex-start' }}
                             >
                                Select Modes
                            </Button>
                         </Box>
                     </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

                    {/* === Section 5: Baseline Mode Shares (NEW - User Input) === */}
                    <Grid item xs={12}>
                         <Typography variant="h6" gutterBottom> Define Baseline Mode Shares </Typography>
                         <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Define the percentage share for each mode selected as active in the baseline above.
                         </Typography>
                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                Current Sum: {currentBaselineSum.toFixed(1)}%
                            </Typography>
                            {Math.abs(currentBaselineSum - 100) > 0.1 && (
                                <Alert severity="warning" sx={{ ml: 2, py: 0, px: 1 }} icon={false}> Sum must be 100% </Alert>
                            )}
                         </Box>

                         <Grid container spacing={2}>
                             {/* Iterate over the modes ACTIVE in the baseline */}
                            {baselineActiveModesToDisplay.map(({ key, name, color }) => (
                                 <Grid item xs={6} sm={4} md={3} lg={2} key={key + '-baseline-share'}>
                                     <TextField
                                        label={name} // Use customized name
                                        type="number"
                                        value={baselineModeShares[key] ?? ''} // Use baseline share state
                                        onChange={(e) => onBaselineModeShareValueChange(key, e.target.value)} // Use specific handler
                                        InputProps={{ endAdornment: '%' }}
                                        inputProps={{ min: 0, max: 100, step: "0.1" }}
                                        variant="outlined"
                                        size="small"
                                        fullWidth // Let grid control width
                                        error={Number(baselineModeShares[key] || 0) < 0 || Number(baselineModeShares[key] || 0) > 100} // Basic validation
                                    />
                                 </Grid>
                             ))}
                             {baselineActiveModesToDisplay.length === 0 && (
                                <Grid item xs={12}>
                                      <Typography sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                          Select baseline active modes above to define shares.
                                      </Typography>
                                  </Grid>
                             )}
                         </Grid>
                     </Grid>

                     <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

                     {/* === Section 6: Customize Mode Display (Name/Color) === */}
                     <Grid item xs={12}>
                         <Typography variant="h6" gutterBottom> Customize Mode Display (Optional) </Typography>
                         <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                             Rename any mode or change its chart color universally across the application.
                         </Typography>
                         <Grid container spacing={3}>
                              {/* Iterate over ALL available modes for customization */}
                             {availableModes.map(mode => {
                                  const custom = modeCustomizations[mode.key] || {};
                                  const currentName = custom.name || mode.defaultName;
                                  const currentColor = custom.color || mode.defaultColor;
                                  return (
                                      <Grid item xs={12} sm={6} md={4} key={mode.key + '-custom'}>
                                         <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>{currentName} <Typography variant="caption" color="text.secondary">(Key: {mode.key})</Typography></Typography>
                                             <Stack spacing={1.5}>
                                                 <TextField label="Display Name" size="small" value={currentName} onChange={(e) => onModeCustomizationChange(mode.key, 'name', e.target.value)} fullWidth />
                                                 <TextField label="Display Color" size="small" type="color" value={currentColor} onChange={(e) => onModeCustomizationChange(mode.key, 'color', e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: '100px', p: 0, border: 'none', '& input': { height: '30px', p: '0 2px' } }} />
                                             </Stack>
                                             {['OTHER_1', 'OTHER_2'].includes(mode.key) && (
                                                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                                                      Note: 'Other' modes affect mode share only.
                                                  </Typography>
                                              )}
                                         </Paper>
                                     </Grid>
                                  );
                             })}
                         </Grid>
                     </Grid>
                     {/* === End Section 6 === */}


                    {/* Footer Text */}
                    <Grid item xs={12} sx={{mt: 3, textAlign: 'left', width: '100%'}}> <Typography variant="caption" color="text.secondary"> Configuration updates are reflected when navigating away or resetting the scenario tool. </Typography> </Grid>

                </Grid> {/* Closes main Grid container */}
            </Paper> {/* Closes Paper */}

            {/* --- Mode Selector Modal --- */}
            {isModalOpen && (
                 <ModeSelectorModal
                    availableModes={availableModes}
                    currentSelection={baselineModeSelection} // Use baseline selection for modal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleModalSave} // handleModalSave calls onBaselineModeSelectionChange
                 />
            )}

        </Box>
    );
}

// --- PropTypes Definition Updated ---
ModelSetupPage.propTypes = {
    baselineConfig: PropTypes.object.isRequired,
    intermediateNumberInputs: PropTypes.object.isRequired,
    availableModes: PropTypes.arrayOf(availableModeShape).isRequired,
    baselineModeSelection: PropTypes.object.isRequired, // { key: boolean }
    baselineModeShares: PropTypes.object.isRequired,    // { key: number }
    modeCustomizations: PropTypes.object.isRequired,    // { key: { name, color } }
    onBaselineNumberInputChange: PropTypes.func.isRequired,
    onBaselineNumberCommit: PropTypes.func.isRequired,
    onBaselineModeSelectionChange: PropTypes.func.isRequired, // For modal save
    onBaselineModeShareValueChange: PropTypes.func.isRequired, // For text field changes
    onModeCustomizationChange: PropTypes.func.isRequired,      // For name/color changes
};

export default ModelSetupPage;