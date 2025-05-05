// src/components/FinalCostDisplay.jsx - Updated Baseline Cost Color

import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Box, CircularProgress, Tooltip, Divider, IconButton } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Helper function to format currency
const formatCurrency = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '$ -';
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
// Helper function to format large numbers (for stalls)
const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return Math.round(num).toLocaleString('en-US');
};

const costLineMinHeight = '2.5rem';
const stallDifferenceBlue = '#2196F3'; // Or use theme color like 'info.main'

// Define the specific red color for consistency
const baselineRedColor = 'rgb(212, 47, 47)';

function FinalCostDisplay({
    baselineCost, scenarioCost, baselineShortfall, scenarioShortfall,
    baselineCostLoading, baselineCostError, scenarioLoading, scenarioError,
    finalYear
}) {

    const isLoading = baselineCostLoading || scenarioLoading;
    const error = baselineCostError || scenarioError;
    const showData = !isLoading && !error;

    // --- Calculate Cost Difference ---
    let costDifference = null; let costDifferenceText = '...'; let costDifferenceColor = 'text.secondary'; let CostDifferenceIcon = null;
    if (showData && typeof baselineCost === 'number' && typeof scenarioCost === 'number') {
        costDifference = scenarioCost - baselineCost;
        const absDifference = Math.abs(costDifference); const formattedDifference = formatCurrency(absDifference);
        if (costDifference < -1e-7) { costDifferenceText = `${formattedDifference} Savings`; costDifferenceColor = 'success.main'; CostDifferenceIcon = CheckCircleOutlineIcon; }
        // Using warning color for added cost might be better than red, which implies error
        else if (costDifference > 1e-7) { costDifferenceText = `+${formattedDifference} Added Cost`; costDifferenceColor = 'warning.dark'; CostDifferenceIcon = WarningAmberIcon; }
        else { costDifferenceText = `${formatCurrency(0)} No Change`; costDifferenceColor = 'text.secondary'; }
    } else if (error) { costDifferenceText = 'Cannot calculate'; costDifferenceColor = 'error.main'; CostDifferenceIcon = ErrorOutlineIcon; }
    else if (isLoading) { costDifferenceText = 'Calculating...'; costDifferenceColor = 'text.secondary'; }
    else { costDifferenceText = 'Awaiting...'; costDifferenceColor = 'text.secondary'; }

    // --- Calculate Stall Difference ---
    let stallDifference = null; let stallDifferenceText = '...'; let StallDifferenceIcon = null;
    if (showData && typeof baselineShortfall === 'number' && typeof scenarioShortfall === 'number') {
        stallDifference = scenarioShortfall - baselineShortfall;
        const absDifference = Math.abs(stallDifference); const formattedDifference = formatNumber(absDifference);
        if (stallDifference < -0.5) { stallDifferenceText = `${formattedDifference} fewer stalls`; StallDifferenceIcon = ArrowDownwardIcon; }
        else if (stallDifference > 0.5) { stallDifferenceText = `+${formattedDifference} more stalls`; StallDifferenceIcon = ArrowUpwardIcon; }
        else { stallDifferenceText = `No Change`; }
    } else if (error) { stallDifferenceText = 'Cannot calculate'; }
    else if (isLoading) { stallDifferenceText = 'Calculating...'; }
    else { stallDifferenceText = 'Awaiting...'; }

    const displayYear = finalYear ?? 'N/A';

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Title Row */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div">Parking Impact</Typography>
                        <Typography variant="caption" color="text.secondary" component="div">Projections for Final Year ({displayYear})</Typography>
                    </Box>
                    <Tooltip title={`Comparison of projected parking cost and shortfall in the final simulation year (${displayYear}). Cost primarily driven by Drive mode share.`}>
                        <IconButton size="small" sx={{ mt: 0.5, color: 'action.active' }}> <InfoOutlinedIcon fontSize="inherit" /> </IconButton>
                    </Tooltip>
                </Box>

                {/* Conditional Content */}
                {isLoading && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, minHeight: 150 }}><CircularProgress /></Box> )}
                {!isLoading && error && ( <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'error.main', flexGrow: 1, minHeight: 150, textAlign: 'center', p: 1 }}><ErrorOutlineIcon sx={{ fontSize: '2rem', mb: 1 }}/><Typography color="error" variant="body2" sx={{ fontWeight: 'medium' }}>Error Calculating Data</Typography><Typography color="error" variant="caption" sx={{ mt: 0.5 }}>{error}</Typography></Box> )}
                {showData && (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        {/* Top part: Costs & Shortfall */}
                        <Box>
                            {/* Baseline */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body1" color="text.secondary">Baseline Projection:</Typography>
                                {/* --- CHANGE HERE: Use specific red color --- */}
                                <Typography variant="h5" sx={{ fontWeight: 'medium', minHeight: costLineMinHeight, color: baselineRedColor, lineHeight: 1.2 }}>
                                    {formatCurrency(baselineCost)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: -0.5 }}>({formatNumber(baselineShortfall)} stalls needed)</Typography>
                            </Box>
                            {/* Scenario */}
                            <Box>
                                <Typography variant="body1" color="text.secondary">Scenario Projection:</Typography>
                                {/* Scenario cost can keep default color or use a different one */}
                                <Typography variant="h5" sx={{ fontWeight: 'medium', minHeight: costLineMinHeight, lineHeight: 1.2 }}>
                                    {formatCurrency(scenarioCost)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: -0.5 }}>({formatNumber(scenarioShortfall)} stalls needed)</Typography>
                            </Box>
                        </Box>

                        {/* Bottom part: Differences */}
                        <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                             {/* Cost Difference */}
                            <Box sx={{ mb: 1.5 }}>
                                 <Typography variant="body1" color="text.secondary">Cost Difference:</Typography>
                                 <Box sx={{ display: 'flex', alignItems: 'center', color: costDifferenceColor, mt: 0.5 }}>
                                    {CostDifferenceIcon && <CostDifferenceIcon sx={{ mr: 0.5, fontSize: '1.3rem', verticalAlign: 'bottom' }} />}
                                    <Typography variant="h5" sx={{ fontWeight: 'medium' }} color="inherit">{costDifferenceText}</Typography>
                                </Box>
                             </Box>
                             {/* Stall Difference */}
                             <Box>
                                 <Typography variant="body1" color="text.secondary">Change in Stalls Needed:</Typography>
                                 <Box sx={{ display: 'flex', alignItems: 'center', color: stallDifferenceBlue, mt: 0.5 }}>
                                    {StallDifferenceIcon && <StallDifferenceIcon sx={{ mr: 0.5, fontSize: '1.3rem', verticalAlign: 'bottom' }} />}
                                    <Typography variant="h5" sx={{ fontWeight: 'medium' }} color="inherit">{stallDifferenceText}</Typography>
                                </Box>
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
    baselineCost: PropTypes.number,
    scenarioCost: PropTypes.number,
    baselineShortfall: PropTypes.number,
    scenarioShortfall: PropTypes.number,
    baselineCostLoading: PropTypes.bool.isRequired,
    baselineCostError: PropTypes.string,
    scenarioLoading: PropTypes.bool.isRequired,
    scenarioError: PropTypes.string,
    finalYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
// --- Default Props ---
FinalCostDisplay.defaultProps = {
    baselineCost: null,
    scenarioCost: null,
    baselineShortfall: null,
    scenarioShortfall: null,
    baselineCostError: null,
    scenarioError: null,
    finalYear: null,
};

export default FinalCostDisplay;