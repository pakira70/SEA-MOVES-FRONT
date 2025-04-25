// src/pages/ModelSetupPage.jsx - Clean Structure

import React from 'react';
import {
    Typography, Paper, Box, Grid, TextField, Divider, Tooltip, IconButton, Stack
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PropTypes from 'prop-types';

// Receive props from App.jsx
function ModelSetupPage({
    baselineState,
    intermediateNumberInputs,
    modes,
    onBaselineNumberInputChange,
    onBaselineNumberCommit,
    onBaselineModeShareChange,
    onBaselineArrayValueChange, // Keep for future table implementation
}) {

    // Calculate sum of baseline shares (using final baselineState)
    const baselineSum = modes.reduce((sum, mode) => {
        const value = Number(baselineState.baselineModeShares[mode]) || 0;
        return sum + value;
    }, 0);

    // Helper to trigger commit on Enter key press for number fields
    const handleNumberKeyDown = (event) => {
        if (event.key === 'Enter') {
            onBaselineNumberCommit(event); // Call the commit handler passed via props
            event.preventDefault();
        }
    };

    // --- JSX Structure ---
    // Outermost element is Box. Inside Box is Paper. Inside Paper is Grid container.
    return (
        <Box sx={{ mt: 2 }}> {/* Add top margin */}
            <Paper sx={{ p: 3 }}> {/* Padding inside the paper */}

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
                            variant="outlined" size="small" sx={{ mb: 2, maxWidth: '100px' }} // Use maxWidth
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
                         <TextField fullWidth variant="outlined" size="small" sx={{ mb: 2, maxWidth: '100px' }} // Use maxWidth
                            name="numYears" type="number"
                            value={intermediateNumberInputs.numYears}
                            onChange={onBaselineNumberInputChange}
                            onBlur={onBaselineNumberCommit}
                            onKeyDown={handleNumberKeyDown}
                            inputProps={{ step: "1" }}
                         />
                    </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid> {/* Increased divider margin */}

                    {/* === Section 2: Population & Attendance === */}
                    <Grid item xs={12}> <Typography variant="h6" gutterBottom> Default Population & Attendance </Typography> </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" gutterBottom> Start Population </Typography>
                         <TextField fullWidth variant="outlined" size="small" sx={{ mb: 2, maxWidth: '100px' }} // Use maxWidth
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
                         <TextField fullWidth variant="outlined" size="small" sx={{ mb: 2, maxWidth: '70px' }} // Use maxWidth
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
                         <TextField fullWidth variant="outlined" size="small" sx={{ mb: 2, maxWidth: '70px' }} // Use maxWidth
                            name="showRate"  type="number"
                            value={intermediateNumberInputs.showRate}
                            onChange={onBaselineNumberInputChange}
                            onBlur={onBaselineNumberCommit}
                            onKeyDown={handleNumberKeyDown}
                            inputProps={{ step: "1" }}
                         />
                    </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid> {/* Increased divider margin */}

                    {/* === Section 3: Parking === */}
                    <Grid item xs={12}> <Typography variant="h6" gutterBottom> Default Parking Model </Typography> </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom> Starting Parking Supply </Typography>
                         <TextField fullWidth variant="outlined" size="small" sx={{ mb: 2, maxWidth: '150px' }} // Use maxWidth
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
                        <TextField fullWidth variant="outlined" size="small" sx={{ mb: 2, maxWidth: '150px' }} // Use maxWidth
                            name="defaultParkingCost" label="Construction Cost ($)" type="number"
                            value={intermediateNumberInputs.defaultParkingCost}
                            onChange={onBaselineNumberInputChange}
                            onBlur={onBaselineNumberCommit}
                            onKeyDown={handleNumberKeyDown}
                            inputProps={{ step: "1" }}
                        />
                    </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid> {/* Increased divider margin */}

                    {/* === Section 4: Baseline Mode Shares === */}
                   <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom> Baseline Mode Shares </Typography>
                        <Typography variant="subtitle1" gutterBottom>
                            (Sum: {baselineSum.toFixed(1)}% | Remaining: {(100 - baselineSum).toFixed(1)}%)
                            {Math.abs(baselineSum - 100) > 0.1 && ( <Typography component="span" color="error" sx={{ml: 1, fontSize: '0.8rem'}}> Warning: Does not sum to 100% </Typography> )}
                        </Typography>
                   
                        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
                            {modes.map((mode) => (
                                 <TextField
                                    key={mode} label={`${mode} (%)`} type="number"
                                    value={baselineState.baselineModeShares[mode] ?? ''}
                                    onChange={(e) => onBaselineModeShareChange(mode, e.target.value)}
                                    inputProps={{ min: 0, max: 100, step: "0.1" }}
                                    variant="outlined" size="small"
                                    sx={{ width: '100px' }} // Keep fixed width for stack items
                                />
                            ))}
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
ModelSetupPage.propTypes = { /* ... same as before ... */ };
ModelSetupPage.propTypes = { baselineState: PropTypes.object.isRequired, intermediateNumberInputs: PropTypes.object.isRequired, modes: PropTypes.arrayOf(PropTypes.string).isRequired, onBaselineNumberInputChange: PropTypes.func.isRequired, onBaselineNumberCommit: PropTypes.func.isRequired, onBaselineModeShareChange: PropTypes.func.isRequired, onBaselineArrayValueChange: PropTypes.func.isRequired, };


export default ModelSetupPage; // MUST be at top level