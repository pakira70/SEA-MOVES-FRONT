import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

// Helper to format numbers with commas
const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return Math.round(num).toLocaleString();
};


function SummaryTable({ summaryData }) {
  if (!summaryData || summaryData.length === 0) {
    return <Typography>No summary data available.</Typography>;
  }

  const columns = [
    { id: 'year', label: 'Year', minWidth: 50 },
    { id: 'population', label: 'Population', minWidth: 100, align: 'right', format: formatNumber },
    { id: 'total_daily_trips', label: 'Total Daily Trips', minWidth: 120, align: 'right', format: formatNumber },
    { id: 'parking_demand', label: 'Parking Demand', minWidth: 120, align: 'right', format: formatNumber },
    { id: 'parking_supply', label: 'Parking Supply', minWidth: 120, align: 'right', format: formatNumber },
    { id: 'parking_shortfall', label: 'Parking Shortfall', minWidth: 120, align: 'right', format: formatNumber },
  ];

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}> {/* Adjust max height as needed */}
        <Table stickyHeader aria-label="sticky summary table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth, fontWeight: 'bold' }}
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
                      <TableCell key={column.id} align={column.align}>
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