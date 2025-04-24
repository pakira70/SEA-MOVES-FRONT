// src/components/charts/ParkingChart.jsx - Added updateMode prop

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import PropTypes from 'prop-types'; // Import PropTypes
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ChartDataLabels
);

// Receive 'years' prop which now contains actual years [2024, 2025, ...]
function ParkingChart({ years, demand, supply }) {

  const chartData = useMemo(() => {
     // Validate required props
     if (!Array.isArray(years) || !Array.isArray(demand) || !Array.isArray(supply) || years.length === 0 || years.length !== demand.length || years.length !== supply.length) {
        console.warn("ParkingChart received invalid or mismatched props:", { years, demand, supply });
        return { labels: [], datasets: [] }; // Return empty structure
     }

     // Use the 'years' prop directly as labels
     const labels = years.map(String); // Ensure labels are strings for Chart.js

     const dataToReturn = {
        labels: labels, // Use actual years
        datasets: [
         {
            type: 'bar', label: 'Parking Supply', data: supply.map(s => Math.round(s)),
            backgroundColor: 'rgba(54, 162, 235, 0.6)', borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1, yAxisID: 'y', order: 2
          },
          {
            type: 'line', label: 'Parking Demand', data: demand.map(d => parseFloat(d).toFixed(1)), // Keep demand precise
            borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 3, pointRadius: 4, pointHoverRadius: 6, fill: false, tension: 0.1,
            yAxisID: 'y', order: 1
          },
        ],
      };
      return dataToReturn;

  }, [years, demand, supply]); // Dependencies for recalculating data

  // --- Chart Options ---
  const options = {
    responsive: true, maintainAspectRatio: false,
    // Optimize animations slightly - might help reduce flicker perception
    animation: {
        duration: 400, // Slightly faster animation
        // easing: 'linear' // Optional: simpler easing
    },
    // Disable animations entirely during updates if needed (uncomment below)
    // transitions: {
    //   active: {
    //     animation: {
    //       duration: 0 // No animation on hover/active
    //     }
    //   },
      // Can disable specific update transitions if problems persist
      // update: {
      //   animation: {
      //     duration: 0
      //   }
      // }
    // },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top', labels: { boxWidth: 20, padding: 15, usePointStyle: true, }
      },
      title: { display: false },
      tooltip: {
          callbacks: { // Keep existing tooltip formatting
             label: function(context) {
                 let label = context.dataset.label || '';
                 if (label) { label += ': '; }
                 if (context.parsed.y !== null) {
                     const value = context.dataset.label === 'Parking Demand'
                                   ? parseFloat(context.parsed.y).toFixed(1)
                                   : Math.round(context.parsed.y).toLocaleString();
                     label += value;
                 }
                 return label;
             }
          }
      },
      datalabels: { display: false }
    },
    scales: {
      x: {
          display: true, title: { display: true, text: 'Year' }
       },
      y: {
        display: true, position: 'left', title: { display: true, text: 'Number of Spaces' },
        beginAtZero: true,
        suggestedMax: Math.max(100, ...(demand?.map(d => parseFloat(d)) ?? [0]), ...(supply?.map(s => s) ?? [0])) * 1.1, // Added null checks and default
      },
    },
  };

  // Key based on labels to help with re-renders if needed
  const chartKey = useMemo(() => JSON.stringify(chartData.labels), [chartData.labels]);

  return (
     // Ensure container has height (e.g., from VisualizationsPanel or style here)
     <div style={{ position: 'relative', height: '300px', width: '100%' }}>
        <Bar
            options={options}
            data={chartData}
            key={chartKey}
            updateMode="active" // <-- ADDED PROP
        />
     </div>
  );
}

// --- PropTypes ---
ParkingChart.propTypes = {
    years: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
    demand: PropTypes.arrayOf(PropTypes.number).isRequired,
    supply: PropTypes.arrayOf(PropTypes.number).isRequired,
};


export default ParkingChart;