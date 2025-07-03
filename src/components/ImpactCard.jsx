// src/components/ImpactCard.jsx - FINAL POLISHED VERSION
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Divider, Grid, CircularProgress } from '@mui/material';

// --- Helper Functions ---
const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '$ -';
    return `$${Math.round(value).toLocaleString()}`;
};

const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    return Math.round(value).toLocaleString();
}

// --- Main Component ---
function ImpactCard({
    title,
    finalYear,
    baselineCost,
    scenarioCost,
    baselineMetricValue,
    scenarioMetricValue,
    metricLabel,
    isLoading,
    error,
}) {
    if (isLoading) {
        return <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}><CircularProgress size={24} /></Box>;
    }
    if (error) {
        return <Box sx={{ p: 2 }}><Typography color="error" variant="body2">Error loading data.</Typography></Box>;
    }
    if (baselineCost === null || scenarioCost === null) {
        return <Box sx={{ p: 2 }}><Typography color="text.secondary" variant="body2">Awaiting calculation...</Typography></Box>;
    }

    const costDifference = scenarioCost - baselineCost;
    const metricDifference = scenarioMetricValue - baselineMetricValue;
    
    const isSameAsBaseline = Math.abs(costDifference) < 1 && Math.abs(metricDifference) < 1;
    const isCostIncrease = costDifference > 0;
    const differenceLabel = isCostIncrease ? 'Added Cost' : 'Savings';
    const differenceColor = isCostIncrease ? 'error.main' : 'success.main';

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Projections for Final Year ({finalYear})
            </Typography>

            <Divider sx={{ my: 1.5 }} />

            <Grid container spacing={2} sx={{ mb: 1.5 }}>
                <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold">Baseline</Typography>
                    <Typography variant="h6">{formatCurrency(baselineCost)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        ({formatNumber(baselineMetricValue)} {metricLabel})
                    </Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold">Scenario</Typography>
                    {isSameAsBaseline ? (
                        <Typography variant="h6" color="text.secondary" sx={{ fontStyle: 'italic' }}>--</Typography>
                    ) : (
                        <>
                            <Typography variant="h6">{formatCurrency(scenarioCost)}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                ({formatNumber(scenarioMetricValue)} {metricLabel})
                            </Typography>
                        </>
                    )}
                </Grid>
            </Grid>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ mt: 1.5 }}>
                <Typography variant="body2" fontWeight="bold">Cost Difference</Typography>
                <Typography variant="h5" sx={{ color: differenceColor, fontWeight: 'bold' }}>
                    {isSameAsBaseline ? '$0' : `${formatCurrency(Math.abs(costDifference))} ${differenceLabel}`}
                </Typography>

                <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>Change in {metricLabel}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {metricDifference >= 0 ? '+' : ''}{formatNumber(metricDifference)}
                </Typography>
            </Box>
        </Box>
    );
}

ImpactCard.propTypes = {
    title: PropTypes.string.isRequired,
    finalYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    baselineCost: PropTypes.number,
    scenarioCost: PropTypes.number,
    baselineMetricValue: PropTypes.number,
    scenarioMetricValue: PropTypes.number,
    metricLabel: PropTypes.string.isRequired,
    isLoading: PropTypes.bool,
    error: PropTypes.string,
};

ImpactCard.defaultProps = {
    baselineCost: null, scenarioCost: null,
    baselineMetricValue: null, scenarioMetricValue: null,
    isLoading: false, error: null,
};

export default ImpactCard;