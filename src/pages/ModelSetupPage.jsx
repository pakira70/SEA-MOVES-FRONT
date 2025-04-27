// src/pages/ModelSetupPage.jsx - CORRECTED for Object Modes

import React from 'react';
import {
    Typography, Paper, Box, Grid, TextField, Divider, Tooltip, IconButton, Stack
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PropTypes from 'prop-types';

function ModelSetupPage({
    baselineState,
    intermediateNumberInputs,
    modes, // <<<< Now expected as an OBJECT { modeKey: "DisplayName", ... }
    onBaselineNumberInputChange,
    onBaselineNumberCommit,
    onBaselineModeShareChange,
    // onBaselineArrayValueChange, // Keep but comment out if not used yet
}) {

    // --- Calculate sum of baseline shares ---
    // --- CHANGE 1: Iterate over object keys ---
    const baselineSum = React.useMemo(() => {
        // Ensure modes is an object and baseline shares exist
        if (!modes || typeof modes !== 'object' || !baselineState?.baselineModeShares) {
             return 0;
        }
        return Object.keys(modes).reduce((sum, modeKey) => {
            // --- CHANGE 2: Use modeKey to access shares ---
            const value = Number(baselineState.baselineModeShares[modeKey]) || 0;
            return sum + value;
        }, 0);
        // --- CHANGE 3: Add dependencies ---
    }, [modes, baselineState?.baselineModeShares]);


    // Helper to trigger commit on Enter key press for number fields
    const handleNumberKeyDown = (event) => {
        if (event.key === 'Enter') {
            onBaselineNumberCommit(event);
            event.preventDefault();
        }
    };

    // --- Get mode keys for iteration ---
    const modeKeys = Object.keys(modes || {});

    // --- JSX Structure ---
    return (
        <Box sx={{ mt: 2 }}>
            <Paper sx={{ p: 3 }}>

                {/* Header */}
                <Typography variant="h5" component="h2" gutterBottom>
                    Model Setup / Baseline Configuration
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                    Adjust the default assumptions and time frame for the model. Changes here affect the 'Reset to Baseline' action on the Scenario Tool.
                </Typography>

                {/* Main Grid Container */}
                <Grid container spacing={3}>

                    {/* === Section 1: Time Frame === */}
                    <Grid item xs={12}> <Typography variant="h6" gutterBottom> Simulation Time Frame </Typography> </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom> Start Year </Typography>
                        <TextField
                            variant="outlined" size="small" sx={{ mb: 2, maxWidth: '100px' }}
                            name="startYear" type="number"
                            value={intermediateNumberInputs.startYear}
                            onChange={onBaselineNumberInputChange}
                            onBlur={onBaselineNumberCommit}
                            onKeyDown={handleNumberKeyDown}
                            inputProps={{ step: "1" }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                         <Typography variant="subtitle1" gutterBottom> Number of Years </Typography>
                         <TextField fullWidth variant="outlined" size="small" sx={{ mb: 2, maxWidth: '100px' }}
                            name="numYears" type="number"
                            value={intermediateNumberInputs.numYears}
                            onChange={onBaselineNumberInputChange}
                            onBlur={onBaselineNumberCommit}
                            onKeyDown={handleNumberKeyDown}
                            inputProps={{ step: "1" }}
                         />
                    </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

                    {/* === Section 2: Population & Attendance === */}
                    <Grid item xs={12}> <Typography variant="h6" gutterBottom> Default Population & Attendance </Typography> </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" gutterBottom> Start Population </Typography>
                         <TextField fullWidth variant="outlined" size="small" sx={{ mb: 2, maxWidth: '100px' }}
                            name="quickStartPopulation" type="number"
                            value={intermediateNumberInputs.quickStartPopulation}
                            onChange={onBaselineNumberInputChange}
                            onBlur={onBaselineNumberCommit}
                            onKeyDown={handleNumberKeyDown}
                            inputProps={{ step: "1" }}
                         />
                    </Grid>
                     <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" gutterBottom> Annual Growth Rate (%) </Typography>
                         <TextField fullWidth variant="outlined" size="small" sx={{ mb: 2, maxWidth: '70px' }}
                             name="quickAnnualGrowthRate" type="number"
                            value={intermediateNumberInputs.quickAnnualGrowthRate}
                            onChange={onBaselineNumberInputChange}
                            onBlur={onBaselineNumberCommit}
                            onKeyDown={handleNumberKeyDown}
                            inputProps={{ step: "0.1" }}
                         />
                    </Grid>
                     <Grid item xs={12} md={4}>
                         <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}> Daily Show Rate (%) <Tooltip title="Percentage of total population assumed to be present on an average day."> <IconButton size="small" sx={{ ml: 0.5 }}><InfoOutlinedIcon fontSize="inherit" /></IconButton> </Tooltip> </Typography>
                         <TextField fullWidth variant="outlined" size="small" sx={{ mb: 2, maxWidth: '70px' }}
                            name="showRate"  type="number"
                            value={intermediateNumberInputs.showRate}
                            onChange={onBaselineNumberInputChange}
                            onBlur={onBaselineNumberCommit}
                            onKeyDown={handleNumberKeyDown}
                            inputProps={{ step: "1" }}
                         />
                    </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

                    {/* === Section 3: Parking === */}
                    <Grid item xs={12}> <Typography variant="h6" gutterBottom> Default Parking Model </Typography> </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom> Starting Parking Supply </Typography>
                         <TextField fullWidth variant="outlined" size="small" sx={{ mb: 2, maxWidth: '150px' }}
                             name="quickStartParkingSupply" type="number"
                            value={intermediateNumberInputs.quickStartParkingSupply}
                            onChange={onBaselineNumberInputChange}
                            onBlur={onBaselineNumberCommit}
                            onKeyDown={handleNumberKeyDown}
                            inputProps={{ step: "1" }}
                         />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom> Cost per Space </Typography>
                        <TextField fullWidth variant="outlined" size="small" sx={{ mb: 2, maxWidth: '150px' }}
                            name="defaultParkingCost" label="Construction Cost ($)" type="number"
                            value={intermediateNumberInputs.defaultParkingCost}
                            onChange={onBaselineNumberInputChange}
                            onBlur={onBaselineNumberCommit}
                            onKeyDown={handleNumberKeyDown}
                            inputProps={{ step: "1" }}
                        />
                    </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

                    {/* === Section 4: Baseline Mode Shares === */}
                   <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom> Baseline Mode Shares </Typography>
                        <Typography variant="subtitle1" gutterBottom>
                            (Sum: {baselineSum.toFixed(1)}% | Remaining: {(100 - baselineSum).toFixed(1)}%)
                            {Math.abs(baselineSum - 100) > 0.1 && ( <Typography component="span" color="error" sx={{ml: 1, fontSize: '0.8rem'}}> Warning: Does not sum to 100% </Typography> )}
                        </Typography>

                        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
                             {/* --- CHANGE 4: Iterate over object keys --- */}
                            {modeKeys.map((modeKey) => {
                                // --- CHANGE 5: Use modes[modeKey] for display name ---
                                const modeDisplayName = modes[modeKey] || modeKey;
                                return (
                                 <TextField
                                    // --- CHANGE 6: Use modeKey for React key ---
                                    key={modeKey}
                                    label={`${modeDisplayName} (%)`} type="number"
                                    // --- CHANGE 7: Use modeKey to access shares ---
                                    value={baselineState.baselineModeShares[modeKey] ?? ''}
                                    // --- CHANGE 8: Pass modeKey to handler ---
                                    onChange={(e) => onBaselineModeShareChange(modeKey, e.target.value)}
                                    inputProps={{ min: 0, max: 100, step: "0.1" }}
                                    variant="outlined" size="small"
                                    sx={{ width: '100px' }}
                                />
                                );
                             })}
                        </Stack>
                    </Grid>

                    {/* Footer Text */}
                    <Grid item xs={12} sx={{mt: 2, textAlign: 'left', width: '100%'}}> <Typography variant="caption" color="text.secondary"> Changes saved automatically. Use 'Reset to Baseline' on Scenario Tool to apply. </Typography> </Grid>

                </Grid> {/* Closes main Grid container */}
            </Paper> {/* Closes Paper */}
        </Box> /* Closes Box */
    ); // Closes return
} // Closes ModelSetupPage Function

// PropTypes Definition
ModelSetupPage.propTypes = {
    baselineState: PropTypes.object.isRequired,
    intermediateNumberInputs: PropTypes.object.isRequired,
    // --- CHANGE 9: Update modes prop type ---
    modes: PropTypes.object.isRequired, // Now an OBJECT { modeKey: "DisplayName", ... }
    onBaselineNumberInputChange: PropTypes.func.isRequired,
    onBaselineNumberCommit: PropTypes.func.isRequired,
    onBaselineModeShareChange: PropTypes.func.isRequired,
    // onBaselineArrayValueChange: PropTypes.func.isRequired, // Keep commented out if not used
};

export default ModelSetupPage;