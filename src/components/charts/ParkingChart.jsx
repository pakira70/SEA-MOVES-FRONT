// src/components/charts/ParkingChart.jsx - FIXED Chart.js Registration

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineController, // Needed because you have type: 'line'
  LineElement,    // Needed for drawing lines
  PointElement,   // Needed for drawing points on lines
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register all necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineController, // Added
  LineElement,    // Added
  PointElement,   // Added
  Title,
  Tooltip,
  Legend,
  ChartDataLabels // Keep if used, currently disabled in options
);

function ParkingChart({ years, demand, supply }) {

  const chartData = useMemo(() => {
     if (!Array.isArray(years) || !Array.isArray(demand) || !Array.isArray(supply) || years.length === 0 || years.length !== demand.length || years.length !== supply.length) {
        console.warn("ParkingChart received invalid or mismatched props:", { years, demand, supply });
        return { labels: [], datasets: [] };
     }
     const labels = years.map(String);

     const dataToReturn = {
        labels: labels,
        datasets: [
         {
            type: 'bar',
            label: 'Parking Supply', data: supply.map(s => Math.round(s)),
            backgroundColor: 'rgba(54, 162, 235, 0.6)', borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1, yAxisID: 'y', order: 2
          },
          {
            type: 'line',
            label: 'Parking Demand', data: demand.map(d => parseFloat(d).toFixed(1)),
            borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 3, pointRadius: 4, pointHoverRadius: 6, fill: false, tension: 0.1,
            yAxisID: 'y', order: 1
          },
        ],
      };
      return dataToReturn;
  }, [years, demand, supply]);

  const options = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 400, },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 20, padding: 15, usePointStyle: true, } },
      title: { display: false },
      tooltip: {
          callbacks: {
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
      x: { display: true, title: { display: true, text: 'Year' } },
      y: {
        display: true, position: 'left', title: { display: true, text: 'Number of Spaces' },
        beginAtZero: true,
        // You might want to adjust suggestedMax if needed
        // suggestedMax: Math.max(100, ...demand.map(Number), ...supply.map(Number)) * 1.1,
      },
    },
  };

  const chartKey = useMemo(() => JSON.stringify(chartData.labels), [chartData.labels]);

  return (
     <div style={{ position: 'relative', height: '300px', width: '100%' }}>
        <Bar
            options={options}
            data={chartData}
            key={chartKey}
            // updateMode="active" // Removed unless needed
        />
     </div>
  );
}

ParkingChart.propTypes = {
    years: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
    demand: PropTypes.arrayOf(PropTypes.number).isRequired,
    supply: PropTypes.arrayOf(PropTypes.number).isRequired,
};


export default ParkingChart;