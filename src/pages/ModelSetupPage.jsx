// src/pages/ModelSetupPage.jsx - SIMPLIFIED VERSION

import React from 'react'; // Removed useState, useMemo
import {
    Typography, Paper, Box, Grid, TextField, Divider, Tooltip, Alert 
    // Removed IconButton, Stack, Button, Chip, EditIcon
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PropTypes from 'prop-types';

// ModeSelectorModal import can be removed
// import ModeSelectorModal from '../components/ModeSelectorModal.jsx'; 

// Prop types can be simplified if availableModes etc. are fully removed
// For now, this definition is here but not used by the simplified component itself.
// const availableModeShape = PropTypes.shape({
//     key: PropTypes.string.isRequired,
//     defaultName: PropTypes.string.isRequired,
//     defaultColor: PropTypes.string.isRequired,
//     flags: PropTypes.object.isRequired,
//     isDefaultActive: PropTypes.bool.isRequired,
//     parking_factor_per_person: PropTypes.number.isRequired,
//     defaultBaselineShare: PropTypes.number,
// });

function ModelSetupPage({
    // Props for the simplified version:
    baselineConfig,
    intermediateNumberInputs,
    onBaselineNumberInputChange,
    onBaselineNumberCommit,
    // REMOVED PROPS that were causing errors:
    // availableModes, 
    // baselineModeSelection,
    // baselineModeShares,
    // modeCustomizations,
    // onBaselineModeSelectionChange,
    // onBaselineModeShareValueChange,
    // onModeCustomizationChange,
}) {
    // console.log("ModelSetupPage Simplified - RECEIVED PROPS:", { baselineConfig, intermediateNumberInputs });

    const handleNumberKeyDown = (event) => {
        if (event.key === 'Enter') {
            onBaselineNumberCommit(event);
            event.preventDefault();
        }
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Model Setup / Baseline Configuration
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                    Adjust the default assumptions, time frame, and baseline model parameters. Changes here define the state restored by 'Reset to Baseline' on the Scenario Tool.
                </Typography>

                <Grid container spacing={4}>
                    {/* === Section 1: Time Frame === */}
                    <Grid item xs={12} md={6}>
                         <Typography variant="h6" gutterBottom> Simulation Time Frame </Typography>
                         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField label="Start Year" variant="outlined" size="small" sx={{ maxWidth: '120px' }} name="startYear" type="number" value={intermediateNumberInputs.startYear} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} />
                            <TextField label="Number of Years" variant="outlined" size="small" sx={{ maxWidth: '120px' }} name="numYears" type="number" value={intermediateNumberInputs.numYears} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} />
                         </Box>
                    </Grid>

                     {/* === Section 2: Population & Attendance === */}
                     <Grid item xs={12} md={6}>
                         <Typography variant="h6" gutterBottom> Default Population & Attendance </Typography>
                         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField label="Start Population" variant="outlined" size="small" sx={{ maxWidth: '150px' }} name="quickStartPopulation" type="number" value={intermediateNumberInputs.quickStartPopulation} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} />
                            <TextField label="Annual Growth Rate (%)" variant="outlined" size="small" sx={{ maxWidth: '180px' }} name="quickAnnualGrowthRate" type="number" value={intermediateNumberInputs.quickAnnualGrowthRate} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "0.1" }} />
                            <TextField label="Daily Show Rate (%)" variant="outlined" size="small" sx={{ maxWidth: '180px' }} name="showRate" type="number" value={intermediateNumberInputs.showRate} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} InputProps={{ endAdornment: <Tooltip title="Percentage of total population present on an average day."><InfoOutlinedIcon fontSize='small' sx={{ color: 'action.active' }} /></Tooltip>}} />
                         </Box>
                    </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

                    {/* === Section 3: Parking === */}
                     <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom> Default Parking Model </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField 
                                label="Starting Parking Supply" 
                                variant="outlined" 
                                size="small" 
                                sx={{ minWidth: '200px', maxWidth: '220px' }} // ADJUSTED WIDTH
                                name="quickStartParkingSupply" 
                                type="number" 
                                value={intermediateNumberInputs.quickStartParkingSupply} 
                                onChange={onBaselineNumberInputChange} 
                                onBlur={onBaselineNumberCommit} 
                                onKeyDown={handleNumberKeyDown} 
                                inputProps={{ step: "1" }} 
                            />
                            <TextField label="Cost per Space ($)" variant="outlined" size="small" sx={{ maxWidth: '150px' }} name="defaultParkingCost" type="number" value={intermediateNumberInputs.defaultParkingCost} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} />
                        </Box>
                    </Grid>

                    {/* Empty Grid item for layout consistency if needed */}
                    <Grid item xs={12} md={6}></Grid> 

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

                    {/* === Placeholder for Advanced Sections === */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Advanced Baseline Configuration
                        </Typography>
                        <Alert severity="info" sx={{ mt: 1 }}>
                            Detailed setup for baseline active modes, their percentage shares, and display customizations (name/color)
                            will be available in an "Advanced Setup" section soon.
                            For now, the model uses system defaults for these.
                        </Alert>
                    </Grid>
                    {/* === End Placeholder === */}

                    <Grid item xs={12} sx={{mt: 3, textAlign: 'left', width: '100%'}}>
                        <Typography variant="caption" color="text.secondary">
                            Configuration updates are saved as you make them and will be used when 'Reset to Baseline' is triggered on the Scenario Tool.
                        </Typography>
                    </Grid>

                </Grid>
            </Paper>

            {/* Mode Selector Modal is not used in this simplified version */}
        </Box>
    );
}

ModelSetupPage.propTypes = {
    baselineConfig: PropTypes.object.isRequired,
    intermediateNumberInputs: PropTypes.object.isRequired,
    onBaselineNumberInputChange: PropTypes.func.isRequired,
    onBaselineNumberCommit: PropTypes.func.isRequired,
    // --- Removed Proptypes for simplified version ---
    // availableModes: PropTypes.arrayOf(availableModeShape),
    // activeModeSelection: PropTypes.object,
    // baselineModeShares: PropTypes.object,
    // modeCustomizations: PropTypes.object,
    // onBaselineModeSelectionChange: PropTypes.func,
    // onBaselineModeShareValueChange: PropTypes.func,
    // onModeCustomizationChange: PropTypes.func,
};

export default ModelSetupPage;