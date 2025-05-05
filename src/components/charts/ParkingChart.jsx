// src/components/charts/ParkingChart.jsx - REFINE LEGEND

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineController, LineElement, PointElement,
  Title, Tooltip, Legend, ChartDataLabels
);

function ParkingChart({ years, baselineDemand, scenarioDemand, supply }) {
  const theme = useTheme();

  const isScenarioSameAsBaseline = useMemo(() => {
    if (baselineDemand.length !== scenarioDemand.length) return false;
    for (let i = 0; i < baselineDemand.length; i++) {
      if (Math.abs(Number(baselineDemand[i]) - Number(scenarioDemand[i])) > 0.001) return false;
    }
    return true;
  }, [baselineDemand, scenarioDemand]);

  const chartData = useMemo(() => {
     if (!Array.isArray(years) || !Array.isArray(baselineDemand) || !Array.isArray(scenarioDemand) || !Array.isArray(supply) ||
         years.length === 0 ||
         years.length !== baselineDemand.length ||
         years.length !== scenarioDemand.length ||
         years.length !== supply.length)
     {
        console.warn("ParkingChart received invalid or mismatched props:", { years, baselineDemand, scenarioDemand, supply });
        return { labels: [], datasets: [] };
     }
     const labels = years.map(String);
     const baselineColor = theme.palette.error.main;
     const scenarioColor = theme.palette.warning.main;
     const supplyColor = theme.palette.primary.main;
     const supplyFillColor = theme.palette.primary.light + '99'; // Example transparency

     return {
        labels: labels,
        datasets: [
          // Order in datasets array can influence default behaviour,
          // but generateLabels will override legend display order.
          // Keeping Scenario first for data processing simplicity if needed.
          { type: 'line', label: 'Projected Parking Demand', data: scenarioDemand.map(d => parseFloat(d).toFixed(1)), borderColor: scenarioColor, backgroundColor: scenarioColor, borderWidth: 3, pointRadius: 4, pointHoverRadius: 6, fill: false, tension: 0.1, yAxisID: 'y', order: 0, hidden: isScenarioSameAsBaseline },
          { type: 'line', label: 'Baseline Parking Demand', data: baselineDemand.map(d => parseFloat(d).toFixed(1)), borderColor: baselineColor, backgroundColor: baselineColor, borderWidth: 3, pointRadius: 4, pointHoverRadius: 6, fill: false, tension: 0.1, yAxisID: 'y', order: 1 },
          { type: 'bar', label: 'Parking Supply', data: supply.map(s => Math.round(s)), backgroundColor: supplyFillColor, borderColor: supplyColor, borderWidth: 1, yAxisID: 'y', order: 2 },
        ],
      };
  }, [years, baselineDemand, scenarioDemand, supply, theme, isScenarioSameAsBaseline]);

  const suggestedMaxY = useMemo(() => {
    const allData = [
        ...(Array.isArray(baselineDemand) ? baselineDemand : []),
        ...(Array.isArray(scenarioDemand) ? scenarioDemand : []),
        ...(Array.isArray(supply) ? supply : [])
    ].map(Number).filter(n => !isNaN(n));
    if (allData.length === 0) return 100;
    return Math.max(100, ...allData) * 1.1;
  }, [baselineDemand, scenarioDemand, supply]);

  const options = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 400, },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        align: 'start', // <-- Align legend block to the left/start
        labels: {
          usePointStyle: true,
          boxWidth: 8,  // <-- Reduced box width further
          boxHeight: 8, // <-- Explicitly set box height
          padding: 15,
          font: { size: 11 },
          // --- UPDATED generateLabels for specific order ---
          generateLabels: function(chart) {
              const datasets = chart.data.datasets;

              // Create potential label objects for all datasets first
              const allLabelObjects = datasets.map((dataset, i) => {
                  // Only create if the dataset is actually visible
                  if (chart.isDatasetVisible(i)) {
                      return {
                          text: dataset.label,
                          fillStyle: dataset.backgroundColor,
                          strokeStyle: dataset.borderColor,
                          lineWidth: dataset.borderWidth,
                          pointStyle: dataset.type === 'line' ? 'circle' : 'rect',
                          hidden: false, // It's visible
                          datasetIndex: i // Keep original index
                      };
                  }
                  return null; // Mark hidden datasets
              }).filter(item => item !== null); // Remove hidden datasets

              // Define desired order of labels
              const desiredOrder = ['Baseline Parking Demand', 'Projected Parking Demand', 'Parking Supply'];
              const orderedLabels = [];

              // Populate orderedLabels array based on the desiredOrder
              desiredOrder.forEach(labelName => {
                  // Find the label object created above that matches the current desired name
                  const foundLabel = allLabelObjects.find(labelObj => labelObj.text === labelName);
                  // If found (i.e., it was visible), add it to the final list
                  if (foundLabel) {
                      orderedLabels.push(foundLabel);
                  }
              });

              return orderedLabels; // Return the specifically ordered list
          }
        }
      },
      title: { display: false },
      tooltip: {
          callbacks: {
             label: function(context) {
                 let label = context.dataset.label || '';
                 if (label) { label += ': '; }
                 if (context.parsed.y !== null) {
                     const value = label.includes('Demand')
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
      y: { display: true, position: 'left', title: { display: true, text: 'Number of Spaces' }, beginAtZero: true, suggestedMax: suggestedMaxY },
    },
  };

  const chartKey = useMemo(() => JSON.stringify(chartData.labels), [chartData.labels]);

  return (
     // Keep fixed height for the container
     <div style={{ position: 'relative', height: '300px', width: '100%' }}>
        <Bar
            options={options}
            data={chartData}
            key={chartKey}
        />
     </div>
  );
}

ParkingChart.propTypes = {
    years: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
    baselineDemand: PropTypes.arrayOf(PropTypes.number).isRequired,
    scenarioDemand: PropTypes.arrayOf(PropTypes.number).isRequired,
    supply: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default ParkingChart;