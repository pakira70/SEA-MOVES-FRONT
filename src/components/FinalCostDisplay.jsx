// src/components/FinalCostDisplay.jsx - Fix Shrink/Flash, Ensure Red Color

import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Box, CircularProgress, Tooltip } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Helper function to format currency
const formatCurrency = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '$ -';
  return num.toLocaleString('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  });
};

// Define a minimum height for the cost display lines
// Ensure this value is large enough for your largest expected number string
const costLineMinHeight = '2.5rem'; // Adjust if needed (e.g., '2.8rem')

function FinalCostDisplay({
    baselineCost,
    scenarioCost,
    baselineCostLoading,
    baselineCostError,
    scenarioLoading,
    scenarioError,
    finalYear
}) {

    // Determine combined loading state: TRUE if EITHER is loading.
    const isLoading = baselineCostLoading || scenarioLoading;
    // Determine combined error state: Prioritize baseline error.
    const error = baselineCostError || scenarioError;

    let difference = null;
    let differenceText = 'Calculating...';
    let differenceColor = 'text.secondary';
    let DifferenceIcon = null;

    // --- NEW Condition for showing cost numbers ---
    // Show numbers ONLY if NOT loading AND NO error exists for EITHER calculation.
    const showCosts = !isLoading && !error;

    // Calculate difference ONLY if we are ready to show costs and have valid numbers
    if (showCosts && typeof baselineCost === 'number' && typeof scenarioCost === 'number') {
        difference = scenarioCost - baselineCost;
        const absDifference = Math.abs(difference);
        const formattedDifference = formatCurrency(absDifference);
        if (difference < -1e-7) {
            differenceText = `${formattedDifference} Savings`; differenceColor = 'success.main'; DifferenceIcon = CheckCircleOutlineIcon;
        } else if (difference > 1e-7) {
            differenceText = `+${formattedDifference} Added Cost`; differenceColor = 'warning.dark'; DifferenceIcon = WarningAmberIcon;
        } else {
            differenceText = `${formatCurrency(0)} No Change`; differenceColor = 'text.secondary';
        }
    } else if (error) {
         differenceText = 'Cannot calculate difference'; differenceColor = 'error.main'; DifferenceIcon = ErrorOutlineIcon;
    } else if (isLoading) {
         differenceText = 'Calculating difference...'; differenceColor = 'text.secondary';
    } else {
        // Handles case where !isLoading and !error, but numbers aren't valid yet
        differenceText = 'Awaiting cost data...'; differenceColor = 'text.secondary';
    }

    const displayYear = finalYear ?? 'N/A';

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* --- Title Row --- */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Final Year Parking Cost
                    </Typography>
                    <Tooltip title={`Projected parking construction cost based on shortfall in the final simulation year (${displayYear}).`}>
                        <InfoOutlinedIcon sx={{ color: 'action.active', fontSize: '1.1rem', cursor: 'help' }} />
                    </Tooltip>
                </Box>

                {/* --- Conditional Content --- */}
                {/* Show Loading spinner if isLoading is true */}
                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, minHeight: 150 }}> {/* Increased minHeight for loading */}
                        <CircularProgress />
                    </Box>
                )}

                {/* Show Error message if error exists AND not loading */}
                {!isLoading && error && (
                     <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'error.main', flexGrow: 1, minHeight: 150, textAlign: 'center', p: 1 }}>
                         <ErrorOutlineIcon sx={{ fontSize: '2rem', mb: 1 }}/>
                         <Typography color="error" variant="body2" sx={{ fontWeight: 'medium' }}>Error Calculating Costs</Typography>
                         <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>{error}</Typography>
                     </Box>
                )}

                {/* Show Cost Data ONLY if not loading AND no error */}
                {showCosts && (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        {/* Top part: Baseline and Scenario Costs */}
                        <Box>
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="body1" color="text.secondary">
                                    Baseline Projection ({displayYear}):
                                </Typography>
                                {/* Apply minHeight and RED color */}
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 'medium',
                                        minHeight: costLineMinHeight, // Prevent resizing
                                        color: 'red', // Explicit red color <<<<<<<<<<<<<<<<<<<<<<<<
                                        lineHeight: 1.2 // Adjust line height to fit minHeight better potentially
                                    }}
                                >
                                    {/* Format cost, shows '$ -' if null/invalid */}
                                    {formatCurrency(baselineCost)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="body1" color="text.secondary">
                                    Scenario Projection ({displayYear}):
                                </Typography>
                                {/* Apply minHeight */}
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 'medium',
                                        minHeight: costLineMinHeight, // Prevent resizing
                                        lineHeight: 1.2
                                    }}
                                >
                                    {/* Format cost, shows '$ -' if null/invalid */}
                                    {formatCurrency(scenarioCost)}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Bottom part: Difference (with divider) */}
                        <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                             <Typography variant="body1" color="text.secondary">
                                Difference:
                            </Typography>
                             <Box sx={{ display: 'flex', alignItems: 'center', color: differenceColor, mt: 0.5 }}>
                                {DifferenceIcon && <DifferenceIcon sx={{ mr: 0.5, fontSize: '1.3rem', verticalAlign: 'bottom' }} />}
                                <Typography variant="h5" sx={{ fontWeight: 'medium' }} color="inherit">
                                    {differenceText}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

// --- Prop Types ---
FinalCostDisplay.propTypes = {
    baselineCost: PropTypes.number, scenarioCost: PropTypes.number,
    baselineCostLoading: PropTypes.bool, baselineCostError: PropTypes.string,
    scenarioLoading: PropTypes.bool, scenarioError: PropTypes.string,
    finalYear: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

// --- Default Props ---
FinalCostDisplay.defaultProps = {
    baselineCostLoading: false, scenarioLoading: false, baselineCostError: null,
    scenarioError: null, baselineCost: null, scenarioCost: null, finalYear: null,
};

export default FinalCostDisplay;