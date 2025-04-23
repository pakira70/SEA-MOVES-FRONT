// src/pages/ModelSetupPage.jsx - CORRECTED baselineSum definition

import React from 'react';
import {
    Typography, Paper, Box, Grid, TextField, Divider, Tooltip, IconButton
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PropTypes from 'prop-types';

// Receive NEW props from App.jsx
function ModelSetupPage({
    baselineState,
    modes,
    onBaselineNumberChange,
    onBaselineModeShareChange,
    onBaselineArrayValueChange, // Keep for future table
    onBaselineQuickPopChange, // NEW Handler
    onBaselineQuickSupplyChange // NEW Handler
}) {

    // Calculate current sum of baseline shares for display (Defined ONCE with const)
    const baselineSum = modes.reduce((sum, mode) => {
        const value = Number(baselineState.baselineModeShares[mode]) || 0;
        return sum + value;
    }, 0);
    // REMOVED erroneous second assignment to baselineSum


    // --- JSX Rendering ---
    return (
        <Box sx={{ mt: 2 }}>
            <Paper sx={{ p: 3 }}>
                {/* Header */}
                <Typography variant="h5" component="h2" gutterBottom> Model Setup / Baseline Configuration </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 3 }}> Adjust the default assumptions and time frame for the model. Changes here affect the 'Reset to Baseline' action on the Scenario Tool. </Typography>

                <Grid container spacing={3}>
                    {/* Time Frame */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" gutterBottom> Simulation Start Year </Typography>
                        <TextField name="startYear" label="Start Year" type="number" value={baselineState.startYear} onChange={onBaselineNumberChange} inputProps={{ min: 2000, max: 2100, step: "1" }} fullWidth variant="outlined" size="small" sx={{ mb: 2 }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                         <Typography variant="subtitle1" gutterBottom> Number of Years </Typography>
                         <TextField name="numYears" label="Years to Project" type="number" value={baselineState.numYears} onChange={onBaselineNumberChange} inputProps={{ min: 1, max: 50, step: "1" }} fullWidth variant="outlined" size="small" sx={{ mb: 2 }} />
                    </Grid>
                     <Grid item xs={12} md={4}>
                         <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}> Daily Show Rate (%) <Tooltip title="Percentage of total population assumed to be present on an average day (e.g., commuting to work). Affects daily trips and parking demand calculations."> <IconButton size="small" sx={{ ml: 0.5 }}><InfoOutlinedIcon fontSize="inherit" /></IconButton> </Tooltip> </Typography>
                         <TextField name="showRate" label="Show Rate (%)" type="number" value={baselineState.showRate} onChange={onBaselineNumberChange} inputProps={{ min: 0, max: 100, step: "1" }} fullWidth variant="outlined" size="small" sx={{ mb: 2 }} />
                    </Grid>
                    <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                    {/* Population (Enable Quick Start) */}
                    <Grid item xs={12}> <Typography variant="h6" gutterBottom> Default Population Model </Typography> </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom> Start Population </Typography>
                         <TextField
                            label="Population in Start Year" name="quickStartPopulation" type="number"
                            value={baselineState.quickStartPopulation} onChange={onBaselineQuickPopChange}
                            inputProps={{ min: 0, step: "1" }} fullWidth variant="outlined" size="small" sx={{ mb: 2 }}
                         />
                    </Grid>
                     <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom> Annual Growth Rate (%) </Typography>
                         <TextField
                            label="Avg. Annual Growth (%)" name="quickAnnualGrowthRate" type="number"
                            value={baselineState.quickAnnualGrowthRate} onChange={onBaselineQuickPopChange}
                            inputProps={{ min: -100, max: 100, step: "0.1" }} fullWidth variant="outlined" size="small" sx={{ mb: 2 }}
                         />
                    </Grid>
                    {/* Debug display for array */}
                     <Grid item xs={12}> <Typography variant="caption" sx={{wordBreak: 'break-all'}}>Calculated Pop Array: {JSON.stringify(baselineState.baselinePopulationValues)}</Typography> </Grid>
                     <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                    {/* Parking (Enable Quick Start) */}
                    <Grid item xs={12}> <Typography variant="h6" gutterBottom> Default Parking Model </Typography> </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom> Starting Parking Supply </Typography>
                         <TextField
                            label="Supply in Start Year (Assumed Constant)" name="quickStartParkingSupply" type="number"
                            value={baselineState.quickStartParkingSupply} onChange={onBaselineQuickSupplyChange}
                            inputProps={{ min: 0, step: "1" }} fullWidth variant="outlined" size="small" sx={{ mb: 2 }}
                         />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom> Cost per Space </Typography>
                        <TextField name="defaultParkingCost" label="Construction Cost ($)" type="number" value={baselineState.defaultParkingCost} onChange={onBaselineNumberChange} inputProps={{ min: 0, step: "1" }} fullWidth variant="outlined" size="small" sx={{ mb: 2 }} />
                    </Grid>
                    {/* Debug display for array */}
                     <Grid item xs={12}> <Typography variant="caption" sx={{wordBreak: 'break-all'}}>Calculated Supply Array: {JSON.stringify(baselineState.baselineParkingSupplyValues)}</Typography> </Grid>
                     <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                    {/* Baseline Mode Shares */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom> Baseline Mode Shares </Typography>
                        <Typography variant="subtitle1" gutterBottom>
                            (Sum: {baselineSum.toFixed(1)}% | Remaining: {(100 - baselineSum).toFixed(1)}%)
                            {Math.abs(baselineSum - 100) > 0.1 && (
                                <Typography component="span" color="error" sx={{ml: 1, fontSize: '0.8rem'}}> Warning: Does not sum to 100% </Typography>
                            )}
                        </Typography>
                    </Grid>
                    {modes.map((mode) => (
                         <Grid item xs={6} sm={4} md={3} key={mode}>
                            <TextField label={`${mode} (%)`} type="number" value={baselineState.baselineModeShares[mode] ?? ''} onChange={(e) => onBaselineModeShareChange(mode, e.target.value)} inputProps={{ min: 0, max: 100, step: "0.1" }} variant="outlined" size="small" fullWidth />
                         </Grid>
                    ))}
                    <Grid item xs={12} sx={{mt: 2, textAlign: 'right'}}> <Typography variant="caption" color="text.secondary"> Changes saved automatically. Use 'Reset to Baseline' on Scenario Tool to apply. </Typography> </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}

// PropTypes Definition
ModelSetupPage.propTypes = {
    baselineState: PropTypes.shape({
        startYear: PropTypes.number.isRequired, numYears: PropTypes.number.isRequired, showRate: PropTypes.number.isRequired,
        quickStartPopulation: PropTypes.number.isRequired, quickAnnualGrowthRate: PropTypes.number.isRequired,
        quickStartParkingSupply: PropTypes.number.isRequired,
        baselinePopulationValues: PropTypes.arrayOf(PropTypes.number).isRequired,
        baselineParkingSupplyValues: PropTypes.arrayOf(PropTypes.number).isRequired,
        baselineModeShares: PropTypes.object.isRequired, defaultParkingCost: PropTypes.number.isRequired,
    }).isRequired,
    modes: PropTypes.arrayOf(PropTypes.string).isRequired,
    onBaselineNumberChange: PropTypes.func.isRequired, onBaselineModeShareChange: PropTypes.func.isRequired,
    onBaselineArrayValueChange: PropTypes.func.isRequired,
    onBaselineQuickPopChange: PropTypes.func.isRequired, onBaselineQuickSupplyChange: PropTypes.func.isRequired,
};

export default ModelSetupPage;