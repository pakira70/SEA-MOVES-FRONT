import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

// Helper to format currency
const formatCurrency = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '$ -';
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0, // No cents needed
    maximumFractionDigits: 0,
  });
};

function FinalCostDisplay({ lastYear, finalCost }) {
  // Basic validation of props
  const isValidYear = typeof lastYear === 'number' && lastYear > 0;
  const isValidCost = typeof finalCost === 'number'; // Allow zero cost

  // Determine display values or placeholders
  const displayYear = isValidYear ? lastYear : 'N/A';
  const displayCost = isValidCost ? formatCurrency(finalCost) : '$ -';
  const costColor = isValidCost && finalCost > 0 ? 'error.main' : 'text.secondary'; // Red only if > 0

  return (
    <Paper sx={{ p: 2, mt: 3 }}> {/* Add margin-top */}
      <Typography variant="h6" gutterBottom>
        Projected Parking Construction Cost
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1">
          Cost in Final Year ({isValidYear ? `Year ${displayYear}` : 'N/A'}):
        </Typography>
        <Typography variant="h5" component="span" sx={{ color: costColor, fontWeight: 'bold' }}>
          {displayCost}
        </Typography>
      </Box>
      {isValidCost && finalCost > 0 && (
         <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
           Based on projected shortfall in the final simulation year.
         </Typography>
       )}
       {!isValidCost && (
         <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
           Cost cannot be calculated (missing data).
         </Typography>
       )}
    </Paper>
  );
}

export default FinalCostDisplay;