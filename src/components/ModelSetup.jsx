// src/pages/ModelSetupPage.jsx - Added StartYear, NumYears, ShowRate Inputs

import React from 'react';
import {
    Typography, Paper, Box, Grid, TextField, Divider, Tooltip, IconButton
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Receive props from App.jsx, including the specific handlers
function ModelSetupPage({
    baselineState,
    modes,
    onBaselineNumberChange, // For simple numeric inputs (Year, NumYears, Rate, Cost)
    onBaselineModeShareChange, // For baseline mode shares
    onBaselineArrayValueChange // For future table input for Pop/Supply Arrays
    // Add handlers for QuickStart Pop/Supply generation later
}) {

    // Calculate current sum of baseline shares for display (optional)
    const baselineSum = modes.reduce((sum, mode) => {
        const value = Number(baselineState.baselineModeShares[mode]) || 0;
        return sum + value;
    }, 0);

    // We need handlers for the Quick Start inputs for Pop/Supply
    // These are placeholders for now - they should eventually calculate the array
    // and call a function passed from App.jsx to update baselineState.baselinePopulationValues/baselineParkingSupplyValues
    const handleQuickPopChange = (event) => {
        // TODO: Implement logic to calculate array from startPop + growthRate
        console.log("Quick Pop Input Changed (Not implemented yet):", event.target.name, event.target.value);
        // Example: Need state for startPop/growthRate or calculate on the fly
        // Then call a prop function like: onBaselineQuickPopUpdate(startPop, growthRate);
    };
    const handleQuickSupplyChange = (event) => {
        // TODO: Implement logic to calculate array from startSupply (flat)
        console.log("Quick Supply Input Changed (Not implemented yet):", event.target.name, event.target.value);
         // Example: Need state for startSupply
        // Then call a prop function like: onBaselineQuickSupplyUpdate(startSupply);
    };


    return (
        <Box sx={{ mt: 2 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Model Setup / Baseline Configuration
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                    Adjust the default assumptions and time frame for the model. Changes here affect the 'Reset to Baseline' action on the Scenario Tool.
                </Typography>

                <Grid container spacing={3}>

                    {/* === Time Frame === */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" gutterBottom> Simulation Start Year </Typography>
                        <TextField
                            label="Start Year"
                            name="startYear" // Matches key in baselineState
                            type="number"
                            value={baselineState.startYear}
                            onChange={onBaselineNumberChange} // Use generic number handler
                            inputProps={{ min: 2000, max: 2100, step: "1" }} // Example range
                            fullWidth variant="outlined" size="small" sx={{ mb: 2 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                         <Typography variant="subtitle1" gutterBottom> Number of Years </Typography>
                         <TextField
                            label="Years to Project"
                            name="numYears" // Matches key in baselineState
                            type="number"
                            value={baselineState.numYears}
                            onChange={onBaselineNumberChange} // Use generic number handler
                            inputProps={{ min: 1, max: 50, step: "1" }} // Example range
                            fullWidth variant="outlined" size="small" sx={{ mb: 2 }}
                         />
                    </Grid>
                     <Grid item xs={12} md={4}>
                         <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                             Daily Show Rate (%)
                              <Tooltip title="Percentage of total population assumed to be present on an average day (e.g., commuting to work). Affects daily trips and parking demand calculations.">
                                 <IconButton size="small" sx={{ ml: 0.5 }}><InfoOutlinedIcon fontSize="inherit" /></IconButton>
                              </Tooltip>
                         </Typography>
                          <TextField
                            label="Show Rate (%)"
                            name="showRate" // Matches key in baselineState
                            type="number"
                            value={baselineState.showRate}
                            onChange={onBaselineNumberChange} // Use generic number handler
                            inputProps={{ min: 0, max: 100, step: "1" }} // 0-100
                            fullWidth variant="outlined" size="small" sx={{ mb: 2 }}
                         />
                    </Grid>

                     <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>


                    {/* === Population (Quick Start Placeholder) === */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom> Default Population Model </Typography>
                        {/* TODO: Add Quick/Advanced Toggle Here */}
                        <Typography variant="subtitle2" color="text.secondary" sx={{mb: 1}}>(Quick Start - Input fields below are placeholders for now)</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom> Start Population </Typography>
                         <TextField
                            label="Population in Start Year"
                            name="quickStartPopulation" // Temporary name
                            type="number"
                            // value={??} // Need local state or derive from array[0]
                            value={baselineState.baselinePopulationValues[0] ?? ''} // Display first year value for now
                            onChange={handleQuickPopChange} // Use placeholder handler
                            inputProps={{ min: 0, step: "1" }}
                            fullWidth variant="outlined" size="small" sx={{ mb: 2 }}
                            disabled // Disable until handler is implemented
                         />
                    </Grid>
                     <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom> Annual Growth Rate (%) </Typography>
                         <TextField
                            label="Avg. Annual Growth (%)"
                            name="quickAnnualGrowthRate" // Temporary name
                            type="number"
                            // value={??} // Need local state or derive from array
                            onChange={handleQuickPopChange} // Use placeholder handler
                            inputProps={{ min: -10, max: 20, step: "0.1" }} // Example range
                            fullWidth variant="outlined" size="small" sx={{ mb: 2 }}
                            disabled // Disable until handler is implemented
                         />
                    </Grid>
                    {/* TODO: Add Advanced Section (Editable Table for baselinePopulationValues) */}
                    {/* Displaying the array for debugging */}
                     <Grid item xs={12}>
                         <Typography variant="caption" sx={{wordBreak: 'break-all'}}>Current Pop Array: {JSON.stringify(baselineState.baselinePopulationValues)}</Typography>
                     </Grid>

                     <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                    {/* === Parking (Quick Start Placeholder & Cost) === */}
                     <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom> Default Parking Model </Typography>
                         {/* TODO: Add Quick/Advanced Toggle Here */}
                        <Typography variant="subtitle2" color="text.secondary" sx={{mb: 1}}>(Quick Start - Input fields below are placeholders for now)</Typography>
                    </Grid>
                     <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom> Starting Parking Supply </Typography>
                         <TextField
                            label="Supply in Start Year"
                            name="quickStartParkingSupply" // Temporary name
                            type="number"
                            // value={??} // Need local state or derive from array[0]
                            value={baselineState.baselineParkingSupplyValues[0] ?? ''} // Display first year value for now
                            onChange={handleQuickSupplyChange} // Use placeholder handler
                            inputProps={{ min: 0, step: "1" }}
                            fullWidth variant="outlined" size="small" sx={{ mb: 2 }}
                            disabled // Disable until handler is implemented
                         />
                         {/* TODO: Add option for "Constant Supply" */}
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom> Cost per Space </Typography>
                         <TextField
                            label="Construction Cost ($)"
                            name="defaultParkingCost" // Matches key in baselineState
                            type="number"
                            value={baselineState.defaultParkingCost}
                            onChange={onBaselineNumberChange} // Use generic number handler
                            inputProps={{ min: 0, step: "1" }}
                            fullWidth variant="outlined" size="small" sx={{ mb: 2 }}
                         />
                    </Grid>
                     {/* TODO: Add Advanced Section (Editable Table for baselineParkingSupplyValues) */}
                     {/* Displaying the array for debugging */}
                     <Grid item xs={12}>
                         <Typography variant="caption" sx={{wordBreak: 'break-all'}}>Current Supply Array: {JSON.stringify(baselineState.baselineParkingSupplyValues)}</Typography>
                     </Grid>

                    <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                     {/* === Baseline Mode Shares === */}
                    <Grid item xs={12}>
                         <Typography variant="h6" gutterBottom> Baseline Mode Shares </Typography>
                         <Typography variant="subtitle1" gutterBottom>
                            (Sum: {baselineSum.toFixed(1)}%
                            {Math.abs(baselineSum - 100) > 0.1 && (
                                <Typography component="span" color="error" sx={{ml: 1, fontSize: '0.8rem'}}>
                                    Warning: Does not sum to 100%
                                </Typography>
                            )}
                            {/* Add Remainder Display */}
                             | Remaining: {(100 - baselineSum).toFixed(1)}%
                            )
                        </Typography>
                    </Grid>

                    {/* Loop through modes to create inputs */}
                    {modes.map((mode) => (
                         <Grid item xs={6} sm={4} md={3} key={mode}> {/* Adjust grid sizing */}
                            <TextField
                                label={`${mode} (%)`}
                                name={`baselineModeShares.${mode}`} // Identifier for handler
                                type="number"
                                value={baselineState.baselineModeShares[mode] ?? ''} // Handle potential undefined
                                onChange={(e) => onBaselineModeShareChange(mode, e.target.value)} // Use specific handler
                                inputProps={{ min: 0, max: 100, step: "0.1" }}
                                variant="outlined" size="small" fullWidth
                            />
                         </Grid>
                    ))}

                     <Grid item xs={12} sx={{mt: 2, textAlign: 'right'}}>
                         <Typography variant="caption" color="text.secondary">
                             Changes are saved automatically (for this session). Use 'Reset to Baseline' on the Scenario Tool page to apply them there.
                         </Typography>
                     </Grid>

                </Grid> {/* Closes main Grid container */}
            </Paper>
        </Box>
    );
}

// Add PropTypes if desired for better component definition
import PropTypes from 'prop-types';
ModelSetupPage.propTypes = {
    baselineState: PropTypes.shape({
        startYear: PropTypes.number.isRequired,
        numYears: PropTypes.number.isRequired,
        showRate: PropTypes.number.isRequired,
        baselinePopulationValues: PropTypes.arrayOf(PropTypes.number).isRequired,
        baselineParkingSupplyValues: PropTypes.arrayOf(PropTypes.number).isRequired,
        baselineModeShares: PropTypes.object.isRequired,
        defaultParkingCost: PropTypes.number.isRequired,
    }).isRequired,
    modes: PropTypes.arrayOf(PropTypes.string).isRequired,
    onBaselineNumberChange: PropTypes.func.isRequired,
    onBaselineModeShareChange: PropTypes.func.isRequired,
    onBaselineArrayValueChange: PropTypes.func.isRequired,
};


export default ModelSetupPage;