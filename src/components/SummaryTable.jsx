import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography
} from '@mui/material';

// Helper to format numbers with commas
const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    // Use default locale formatting for integers
    return Math.round(num).toLocaleString();
};

function SummaryTable({ summaryData }) {
  // console.log("SummaryTable received summaryData:", summaryData); // Keep commented unless debugging

  if (!summaryData || summaryData.length === 0) {
    // Keep this fallback or adjust as needed
    return <Typography sx={{ p: 2, fontStyle: 'italic' }}>Summary data not available.</Typography>;
  }

  // === MODIFIED COLUMNS ARRAY ===
  const columns = [
    { id: 'year', label: 'Year', minWidth: 50, align: 'center' }, // Centered year
    { id: 'population', label: 'Population', minWidth: 100, align: 'right', format: formatNumber },
    // { id: 'total_daily_trips', label: 'Total Daily Trips', minWidth: 120, align: 'right', format: formatNumber }, // REMOVED
    { id: 'parking_demand', label: 'Parking Demand', minWidth: 110, align: 'right', format: formatNumber },
    { id: 'parking_supply', label: 'Parking Supply', minWidth: 110, align: 'right', format: formatNumber },
    { id: 'parking_shortfall', label: 'Parking Shortfall', minWidth: 110, align: 'right', format: formatNumber },
  ];
  // === END MODIFIED COLUMNS ARRAY ===

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}> {/* Adjust max height as needed */}
        {/* === ADDED size="small" PROP === */}
        <Table stickyHeader aria-label="sticky summary table" size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  // === ADDED/MODIFIED sx FOR TIGHTER PADDING ===
                  sx={{
                      minWidth: column.minWidth,
                      fontWeight: 'bold',
                      padding: '6px 10px' // Reduced padding (vertical, horizontal)
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {summaryData.map((row, index) => {
              return (
                <TableRow hover role="checkbox" tabIndex={-1} key={row.year || index}>
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        // === ADDED/MODIFIED sx FOR TIGHTER PADDING ===
                        sx={{ padding: '6px 10px' }} // Reduced padding
                      >
                        {column.format ? column.format(value) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default SummaryTable;