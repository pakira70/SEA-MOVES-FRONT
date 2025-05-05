// src/components/charts/ParkingChart.jsx - ADJUST MARKER/COLOR

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

     // --- UPDATED Colors ---
     const baselineColor = theme.palette.error.main; // Red
     const scenarioColor = theme.palette.text.primary; // Black (Primary text color)
     const supplyColor = theme.palette.primary.main; // Blue
     const supplyFillColor = theme.palette.primary.light + '99'; // Lighter blue with transparency

     return {
        labels: labels,
        datasets: [
          // --- Projected Demand Dataset (UPDATED Color and Point Style) ---
          {
            type: 'line',
            label: 'Projected Parking Demand',
            data: scenarioDemand.map(d => parseFloat(d).toFixed(1)),
            borderColor: scenarioColor,      // Use black
            backgroundColor: scenarioColor,    // Use black
            borderWidth: 3,
            pointRadius: 3,                 // Slightly larger radius for visibility? Adjust if needed.
            pointHoverRadius: 7,
            pointStyle: 'circle',         // Use triangles
            fill: false,
            tension: 0.1,
            yAxisID: 'y',
            order: 0,
            hidden: isScenarioSameAsBaseline,
          },
          // --- Baseline Demand Dataset (No change) ---
          {
            type: 'line',
            label: 'Baseline Parking Demand',
            data: baselineDemand.map(d => parseFloat(d).toFixed(1)),
            borderColor: baselineColor,
            backgroundColor: baselineColor,
            borderWidth: 3,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointStyle: 'circle',           // Explicitly circle (default)
            fill: false,
            tension: 0.1,
            yAxisID: 'y',
            order: 1,
          },
          // --- Supply Dataset (No change) ---
          {
            type: 'bar',
            label: 'Parking Supply',
            data: supply.map(s => Math.round(s)),
            backgroundColor: supplyFillColor,
            borderColor: supplyColor,
            borderWidth: 1,
            yAxisID: 'y',
            order: 2,
          },
        ],
      };
  }, [years, baselineDemand, scenarioDemand, supply, theme, isScenarioSameAsBaseline]);

  const suggestedMaxY = useMemo(() => {
    // ... (logic remains the same)
    const allData = [ /* ... */ ].map(Number).filter(n => !isNaN(n));
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
        align: 'start',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 15,
          font: { size: 11 },
          // --- UPDATED generateLabels to use dataset's pointStyle ---
          generateLabels: function(chart) {
              const datasets = chart.data.datasets;
              const allLabelObjects = datasets.map((dataset, i) => {
                  if (chart.isDatasetVisible(i)) {
                      return {
                          text: dataset.label,
                          fillStyle: dataset.backgroundColor,
                          strokeStyle: dataset.borderColor,
                          lineWidth: dataset.borderWidth,
                          // Use the pointStyle defined in the dataset if it exists,
                          // otherwise default based on type.
                          pointStyle: dataset.pointStyle || (dataset.type === 'line' ? 'circle' : 'rect'),
                          hidden: false,
                          datasetIndex: i
                      };
                  }
                  return null;
              }).filter(item => item !== null);

              const desiredOrder = ['Baseline Parking Demand', 'Projected Parking Demand', 'Parking Supply'];
              const orderedLabels = [];
              desiredOrder.forEach(labelName => {
                  const foundLabel = allLabelObjects.find(labelObj => labelObj.text === labelName);
                  if (foundLabel) {
                      orderedLabels.push(foundLabel);
                  }
              });
              return orderedLabels;
          }
        }
      },
      title: { display: false },
      tooltip: { /* unchanged */
          callbacks: { label: function(context) { /* unchanged */ } }
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