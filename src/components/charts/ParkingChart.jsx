// src/components/charts/ParkingChart.jsx

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles'; // <<< ADDED THIS IMPORT
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineController, // Added for completeness if you ever mix line charts here
  LineElement,    // Added for completeness
  PointElement,   // Added for completeness
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
  const theme = useTheme(); // Now this will work

  const isScenarioSameAsBaseline = useMemo(() => {
    if (!baselineDemand || !scenarioDemand || baselineDemand.length !== scenarioDemand.length) return false; // Added null/undefined checks
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
     const scenarioColor = theme.palette.text.primary; 
     
     const desiredParkingSupplyColor = '#75C1FF'; 
     const parkingSupplyBorderColor = desiredParkingSupplyColor; 
     const parkingSupplyFillColorWithTransparency = 'rgba(117, 193, 255, 0.7)';

     return {
        labels: labels,
        datasets: [
          {
            type: 'line',
            label: 'Projected Parking Demand',
            data: scenarioDemand.map(d => parseFloat(d).toFixed(1)),
            borderColor: scenarioColor,      
            backgroundColor: scenarioColor,    
            borderWidth: 3,
            pointRadius: 3,                 
            pointHoverRadius: 7,
            pointStyle: 'circle',         
            fill: false,
            tension: 0.1,
            yAxisID: 'y',
            order: 0,
            hidden: isScenarioSameAsBaseline,
          },
          {
            type: 'line',
            label: 'Baseline Parking Demand',
            data: baselineDemand.map(d => parseFloat(d).toFixed(1)),
            borderColor: baselineColor,
            backgroundColor: baselineColor,
            borderWidth: 3,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointStyle: 'circle',           
            fill: false,
            tension: 0.1,
            yAxisID: 'y',
            order: 1,
          },
          {
            type: 'bar',
            label: 'Parking Supply',
            data: supply.map(s => Math.round(s)),
            backgroundColor: parkingSupplyFillColorWithTransparency, 
            borderColor: parkingSupplyBorderColor,                 
            borderWidth: 1, 
            yAxisID: 'y',
            order: 2,
          },
        ],
      };
  }, [years, baselineDemand, scenarioDemand, supply, theme, isScenarioSameAsBaseline]);

  const suggestedMaxY = useMemo(() => {
    const allValues = [
        ...(baselineDemand || []),
        ...(scenarioDemand || []),
        ...(supply || [])
    ].map(Number).filter(n => !isNaN(n) && isFinite(n)); 

    if (allValues.length === 0) return 100; 

    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);

    if (maxValue === 0 && minValue === 0) return 100;
    if (maxValue < 10 && maxValue > 0) return Math.ceil(maxValue / 5) * 5 * 1.2; 

    return Math.ceil(maxValue * 1.1 / 10) * 10; 
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
          generateLabels: function(chart) {
              const datasets = chart.data.datasets;
              const allLabelObjects = datasets.map((dataset, i) => {
                  if (chart.isDatasetVisible(i)) { // Only add visible datasets
                      return {
                          text: dataset.label,
                          fillStyle: dataset.backgroundColor,
                          strokeStyle: dataset.borderColor,
                          lineWidth: dataset.borderWidth,
                          pointStyle: dataset.pointStyle || (dataset.type === 'line' ? 'circle' : 'rect'),
                          hidden: !chart.isDatasetVisible(i), // Use current visibility
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
              // Add any remaining labels that weren't in desiredOrder (e.g., if new datasets are added)
              allLabelObjects.forEach(labelObj => {
                  if (!orderedLabels.find(l => l.text === labelObj.text)) {
                      orderedLabels.push(labelObj);
                  }
              });
              return orderedLabels;
          }
        }
      },
      title: { display: false },
      tooltip: { 
          callbacks: { 
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += Math.round(context.parsed.y * 10) / 10; // Round to one decimal place
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
        display: true, 
        position: 'left', 
        title: { display: true, text: 'Number of Spaces' }, 
        beginAtZero: true, 
        suggestedMax: suggestedMaxY 
      },
    },
  };

  const chartKey = useMemo(() => {
    // Create a more robust key based on actual data that might change
    const dataSignature = JSON.stringify({
        labels: chartData.labels,
        datasets: chartData.datasets.map(ds => ({ data: ds.data, hidden: ds.hidden })) // Include hidden status
    });
    return dataSignature;
  }, [chartData]);

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