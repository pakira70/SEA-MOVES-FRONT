// src/components/FinalCostDisplay.jsx - UPDATED TO FOCUS ON PARKING
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, CircularProgress, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return 'N/A';
    }
    const num = Number(value);
    if (Math.abs(num) >= 1_000_000) {
        return `$${(num / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(num) >= 1_000) {
        return `$${(num / 1_000).toFixed(0)}k`;
    }
    return `$${num.toFixed(0)}`;
};

function FinalCostDisplay({
    baselineCost,
    scenarioCost,
    baselineShortfall,
    scenarioShortfall,
    isLoading,
    error,
    finalYear
}) {
    const hasData = baselineCost !== null && scenarioCost !== null;
    const costDifference = hasData ? scenarioCost - baselineCost : null;

    return (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Parking Capital Cost ({finalYear})
                <Tooltip title="Compares the one-time capital cost required to build parking to meet the demand in the final year of the scenario vs. the baseline.">
                    <InfoOutlinedIcon fontSize="inherit" sx={{ ml: 0.5, verticalAlign: 'middle', color: 'action.active' }} />
                </Tooltip>
            </Typography>
            {isLoading && <CircularProgress size={24} />}
            {error && !isLoading && <Typography color="error" variant="body2">Error: {error}</Typography>}
            {!isLoading && !error && hasData && (
                <Box>
                    <Typography variant="h4" component="p" fontWeight="bold" color={costDifference > 0 ? 'error.main' : 'success.main'}>
                        {costDifference >= 0 ? '+' : ''}{formatCurrency(costDifference)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="p">
                        Shortfall: {scenarioShortfall?.toLocaleString() ?? 'N/A'} spaces
                    </Typography>
                </Box>
            )}
             {!isLoading && !error && !hasData && (
                 <Typography variant="body2" color="text.secondary">Awaiting calculation...</Typography>
            )}
        </Box>
    );
}

FinalCostDisplay.propTypes = {
    baselineCost: PropTypes.number,
    scenarioCost: PropTypes.number,
    baselineShortfall: PropTypes.number,
    scenarioShortfall: PropTypes.number,
    isLoading: PropTypes.bool,
    error: PropTypes.string,
    finalYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

FinalCostDisplay.defaultProps = {
    baselineCost: null,
    scenarioCost: null,
    baselineShortfall: null,
    scenarioShortfall: null,
    isLoading: false,
    error: null,
    finalYear: 'Final Year',
};

export default FinalCostDisplay;