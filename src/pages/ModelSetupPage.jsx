// src/pages/ModelSetupPage.jsx - SIMPLIFYING SHUTTLE LAYOUT
import React from 'react';
import {
    Typography, Paper, Box, Grid, TextField, Divider, Tooltip, Alert,
    Checkbox, FormControlLabel, InputAdornment
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PropTypes from 'prop-types';

function ModelSetupPage({
    baselineConfig,
    intermediateNumberInputs,
    onBaselineNumberInputChange,
    onBaselineNumberCommit,
    onBaselineCheckboxChange,
}) {
    const handleNumberKeyDown = (event) => {
        if (event.key === 'Enter') {
            onBaselineNumberCommit(event);
            event.preventDefault();
        }
    };

    const shuttleFieldsDisabled = !baselineConfig.includeShuttleCosts;

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
                    {/* === Section 1: Time Frame & Population === */}
                    <Grid item xs={12} md={6}>
                         <Typography variant="h6" gutterBottom> Simulation Time Frame </Typography>
                         <TextField fullWidth label="Start Year" variant="outlined" size="small" name="startYear" type="number" value={intermediateNumberInputs.startYear || ''} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} sx={{ mb: 2 }} />
                         <TextField fullWidth label="Number of Years" variant="outlined" size="small" name="numYears" type="number" value={intermediateNumberInputs.numYears || ''} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} />
                    </Grid>
                     <Grid item xs={12} md={6}>
                         <Typography variant="h6" gutterBottom> Default Population & Attendance </Typography>
                         <TextField fullWidth label="Start Population" variant="outlined" size="small" name="quickStartPopulation" type="number" value={intermediateNumberInputs.quickStartPopulation || ''} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} sx={{ mb: 2 }}/>
                         <TextField fullWidth label="Annual Growth Rate (%)" variant="outlined" size="small" name="quickAnnualGrowthRate" type="number" value={intermediateNumberInputs.quickAnnualGrowthRate || ''} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "0.1" }} sx={{ mb: 2 }}/>
                         <TextField 
                            fullWidth 
                            label="Daily Show Rate (%)" 
                            variant="outlined" 
                            size="small" 
                            name="showRate" 
                            type="number" 
                            value={intermediateNumberInputs.showRate || ''}
                            onChange={onBaselineNumberInputChange} 
                            onBlur={onBaselineNumberCommit} 
                            onKeyDown={handleNumberKeyDown} 
                            inputProps={{ step: "1" }} 
                            InputProps={{ 
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Tooltip title="Percentage of total population present on an average day.">
                                            <InfoOutlinedIcon fontSize='small' sx={{ color: 'action.active' }} />
                                        </Tooltip>
                                    </InputAdornment>
                                )
                            }} 
                         />
                    </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>
                    
                    {/* === Section 2: Parking & Shuttle (REORGANIZED) === */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>Default Parking Model</Typography>
                        <TextField fullWidth label="Starting Parking Supply" variant="outlined" size="small" name="quickStartParkingSupply" type="number" value={intermediateNumberInputs.quickStartParkingSupply || ''} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} sx={{ mb: 2 }}/>
                        <TextField fullWidth label="Cost per Space ($)" variant="outlined" size="small" name="defaultParkingCost" type="number" value={intermediateNumberInputs.defaultParkingCost || ''} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} inputProps={{ step: "1" }} />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>Off-site Shuttle Model</Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={baselineConfig.includeShuttleCosts || false}
                                    onChange={onBaselineCheckboxChange}
                                    name="includeShuttleCosts"
                                />
                            }
                            label="Include shuttle operation costs"
                            sx={{ display: 'block', mb: 2 }}
                        />
                        
                        {/* THE WRAPPING BOX HAS BEEN REMOVED. MARGINS ARE NOW USED FOR SPACING. */}
                        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>Core Shuttle Parameters</Typography>
                        <TextField fullWidth label="Starting Annual Shuttle Cost ($)" name="shuttleBaselineCost" type="number" value={intermediateNumberInputs.shuttleBaselineCost || ''} disabled={shuttleFieldsDisabled} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} size="small" InputProps={{ endAdornment: <InputAdornment position="end"><Tooltip title="The current, total annual cost of running the baseline shuttle service."><InfoOutlinedIcon fontSize='small' sx={{ color: 'action.active' }} /></Tooltip></InputAdornment> }} sx={{ mb: 2 }}/>
                        <TextField fullWidth label="% of Parking Served by Shuttle" name="shuttleParkingPercentage" type="number" value={intermediateNumberInputs.shuttleParkingPercentage || ''} disabled={shuttleFieldsDisabled} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} size="small" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} sx={{ mb: 2 }}/>
                        <TextField fullWidth label="All-in Operating Cost per Hour ($)" name="shuttleCostPerHour" type="number" value={intermediateNumberInputs.shuttleCostPerHour || ''} disabled={shuttleFieldsDisabled} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} size="small" />

                        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 3, mb: 1 }}>Service Calculation Inputs</Typography>
                        <TextField fullWidth label="Peak Period Duration (hours)" name="shuttlePeakHours" type="number" value={intermediateNumberInputs.shuttlePeakHours || ''} disabled={shuttleFieldsDisabled} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} size="small" InputProps={{ endAdornment: <InputAdornment position="end"><Tooltip title="The number of hours over which peak demand is spread (e.g., 3 hours for 7-10 AM)."><InfoOutlinedIcon fontSize='small' sx={{ color: 'action.active' }} /></Tooltip></InputAdornment> }} sx={{ mb: 2 }}/>
                        <TextField fullWidth label="Passengers per Vehicle" name="shuttleVehicleCapacity" type="number" value={intermediateNumberInputs.shuttleVehicleCapacity || ''} disabled={shuttleFieldsDisabled} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} size="small" sx={{ mb: 2 }}/>
                        <TextField fullWidth label="Min. Contract Increment (hours)" name="shuttleMinContractHours" type="number" value={intermediateNumberInputs.shuttleMinContractHours || ''} disabled={shuttleFieldsDisabled} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} size="small" InputProps={{ endAdornment: <InputAdornment position="end"><Tooltip title="The minimum block of service hours you can add for each additional shuttle (e.g., 4 hours)."><InfoOutlinedIcon fontSize='small' sx={{ color: 'action.active' }} /></Tooltip></InputAdornment> }} sx={{ mb: 2 }}/>
                        <TextField fullWidth label="Annual Operating Days" name="shuttleOperatingDays" type="number" value={intermediateNumberInputs.shuttleOperatingDays || ''} disabled={shuttleFieldsDisabled} onChange={onBaselineNumberInputChange} onBlur={onBaselineNumberCommit} onKeyDown={handleNumberKeyDown} size="small" />
                    </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom> Advanced Baseline Configuration </Typography>
                        <Alert severity="info" sx={{ mt: 1 }}> Detailed setup for baseline active modes, their percentage shares, and display customizations (name/color) will be available in an "Advanced Setup" section soon. For now, the model uses system defaults for these. </Alert>
                    </Grid>

                    <Grid item xs={12} sx={{mt: 3, textAlign: 'left', width: '100%'}}>
                        <Typography variant="caption" color="text.secondary"> Configuration updates are saved as you make them and will be used when 'Reset to Baseline' is triggered on the Scenario Tool. </Typography>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}

ModelSetupPage.propTypes = {
    baselineConfig: PropTypes.object.isRequired,
    intermediateNumberInputs: PropTypes.object.isRequired,
    onBaselineNumberInputChange: PropTypes.func.isRequired,
    onBaselineNumberCommit: PropTypes.func.isRequired,
    onBaselineCheckboxChange: PropTypes.func.isRequired,
};

export default ModelSetupPage;