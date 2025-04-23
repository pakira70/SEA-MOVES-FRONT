// src/pages/ModelSetupPage.jsx - Updated with Controls

import React from 'react';
import {
    Typography, Paper, Box, Grid, TextField,
    // Consider adding Slider for baseline mode shares if desired
} from '@mui/material';
// Removed Link, navigation is in AppBar now

// Receive props from App.jsx
function ModelSetupPage({
    baselineState,
    modes,
    onBaselineChange,
    onBaselineModeShareChange
}) {

    // Helper to prevent direct modification of prop object
    const handleInputChange = (event) => {
        onBaselineChange(event); // Pass event up to App.jsx handler
    };

    // Handler for baseline mode share text input changes (could add validation/commit logic)
    const handleModeShareInputChange = (mode, event) => {
         // Simple pass-through for now, App.jsx handles conversion/clamping
         onBaselineModeShareChange(mode, event.target.value);
    };

    // Calculate current sum of baseline shares for display (optional)
    const baselineSum = modes.reduce((sum, mode) => {
        const value = Number(baselineState.baselineModeShares[mode]) || 0;
        return sum + value;
    }, 0);

    return (
        <Box sx={{ mt: 2 }}> {/* Reduced top margin slightly */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Model Setup / Baseline Configuration
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                    Adjust the default values used when resetting the Scenario Tool.
                </Typography>

                <Grid container spacing={3}>
                    {/* === Baseline Population === */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Default Population per Year
                        </Typography>
                        <TextField
                            label="Default Population (comma-separated)"
                            name="defaultPopulationString" // Matches key in baselineState
                            value={baselineState.defaultPopulationString}
                            onChange={handleInputChange} // Use generic handler
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                        />
                    </Grid>

                    {/* === Baseline Parking === */}
                    <Grid item xs={12} md={8}>
                        <Typography variant="subtitle1" gutterBottom>
                            Default Parking Supply per Year
                        </Typography>
                        <TextField
                            label="Default Annual Supply (comma-separated)"
                            name="defaultParkingSupplyString" // Matches key in baselineState
                            value={baselineState.defaultParkingSupplyString}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" gutterBottom>
                            Default Cost per Space
                        </Typography>
                         <TextField
                            label="Default Cost ($)"
                            name="defaultParkingCost" // Matches key in baselineState
                            type="number"
                            value={baselineState.defaultParkingCost}
                            onChange={handleInputChange}
                            inputProps={{ min: 0, step: "1" }}
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                        />
                    </Grid>

                     {/* === Baseline Mode Shares === */}
                    <Grid item xs={12}>
                         <Typography variant="subtitle1" gutterBottom>
                            Baseline Mode Shares (Sum: {baselineSum.toFixed(1)}%)
                            {Math.abs(baselineSum - 100) > 0.1 && (
                                <Typography component="span" color="error" sx={{ml: 1, fontSize: '0.8rem'}}>
                                    (Warning: Does not sum to 100%)
                                </Typography>
                            )}
                        </Typography>
                        {/* Maybe add note that these need to sum to 100 */}
                    </Grid>

                    {/* Loop through modes to create inputs */}
                    {modes.map((mode) => (
                         <Grid item xs={6} sm={4} md={3} key={mode}> {/* Adjust grid sizing */}
                            <TextField
                                label={`${mode} (%)`}
                                name={`baselineModeShares.${mode}`} // Special handling needed or use specific handler
                                type="number"
                                value={baselineState.baselineModeShares[mode] ?? ''} // Handle potential undefined
                                onChange={(e) => handleModeShareInputChange(mode, e)}
                                // Could add onBlur for validation/normalization trigger
                                inputProps={{ min: 0, max: 100, step: "0.1" }}
                                variant="outlined"
                                size="small"
                                fullWidth
                            />
                         </Grid>
                    ))}
                    {/* Add a button to normalize baseline shares? */}
                     <Grid item xs={12} sx={{mt: 2, textAlign: 'right'}}>
                         <Typography variant="caption" color="text.secondary">
                             Changes are saved automatically. Use 'Reset to Baseline' on the Scenario Tool page to apply them there.
                         </Typography>
                         {/* Add save/apply button if auto-save isn't desired */}
                     </Grid>

                </Grid>
            </Paper>
        </Box>
    );
}

export default ModelSetupPage;