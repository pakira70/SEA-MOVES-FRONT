// src/components/charts/ModeShareChart.jsx

import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Import the plugin

// Register the plugin with ChartJS. If already registered globally (e.g. in ParkingChart.js or a main app file),
// this specific registration might not be strictly necessary but doesn't hurt.
ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels); // ADDED ChartDataLabels here

function ModeShareChart({ modeShares, activeModeDetails }) {
  const chartData = useMemo(() => {
     if (!modeShares || typeof modeShares !== 'object' ||
         !activeModeDetails || typeof activeModeDetails !== 'object' || Object.keys(activeModeDetails).length === 0)
     {
         console.warn("ModeShareChart received invalid props or no active modes:", { modeShares, activeModeDetails });
         return { labels: [], datasets: [] };
     }

    const labels = [];
    const dataValues = [];
    const backgroundColors = [];

    const activeModeKeys = Object.keys(activeModeDetails);

    activeModeKeys.forEach((modeKey) => {
        const share = parseFloat(modeShares[modeKey]) || 0;
        if (share > 1e-6) { 
           const modeInfo = activeModeDetails[modeKey];
           labels.push(modeInfo?.name || modeKey); 
           // Keep dataValues as numbers for the chart, formatting will be done by datalabels plugin
           dataValues.push(share); // Store as number, not toFixed string yet
           backgroundColors.push(modeInfo?.color || '#cccccc'); 
        }
     });

     if (labels.length === 0 && activeModeKeys.length > 0) {
         console.log("ModeShareChart: All active modes have zero share, chart will be empty.");
     }

    return {
      labels: labels,
      datasets: [
        {
          label: 'Mode Share %',
          data: dataValues, // dataValues are now numbers
          backgroundColor: backgroundColors,
          borderColor: '#ffffff', 
          borderWidth: 1,
        },
      ],
    };
  }, [modeShares, activeModeDetails]);


  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 400,
    },
    plugins: {
      legend: {
        position: 'right', 
        labels: {
            boxWidth: 12,
            padding: 15,
         }
      },
      title: { display: false },
      tooltip: { // Tooltip configuration remains good
          callbacks: {
             label: function(context) {
                 let label = context.label || '';
                 if (label) { label += ': '; }
                 // context.raw is the original data value (number)
                 if (context.raw !== null) {
                      // Format tooltip value with one decimal place and %
                      label += parseFloat(context.raw).toFixed(1) + '%';
                 }
                 return label;
             }
          }
      },
      // --- DATALABELS PLUGIN CONFIGURATION ---
      datalabels: {
        display: function(context) {
          // Only display label if the share is significant (e.g., > 1%)
          return context.dataset.data[context.dataIndex] > 1; 
        },
        formatter: (value, context) => {
          // value is the raw data value for this segment
          // We want whole number + %
          return Math.round(value) + '%';
        },
        color: '#ffffff', // White color for the labels
        font: {
          weight: 'bold',
          size: 10, // Adjust size as needed
        },
        // Optional: Add a shadow or stroke for better readability on varied backgrounds
        // textStrokeColor: 'black',
        // textStrokeWidth: 1,
        // align: 'center', // 'start', 'center', 'end'
        // anchor: 'center', // 'center', 'start', 'end'
      }
    },
    cutout: '50%',
  };

  const chartKey = useMemo(() => JSON.stringify(chartData.datasets[0]?.data || []), [chartData.datasets]);

  return (
       <div style={{ position: 'relative', height: '300px', width: '100%' }}>
          <Doughnut
              data={chartData}
              options={options}
              plugins={[ChartDataLabels]} // Optionally pass plugin instance here if not globally registered or for specific instances
              key={chartKey} 
           />
       </div>
   );
}

ModeShareChart.propTypes = {
    modeShares: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
    activeModeDetails: PropTypes.objectOf(PropTypes.shape({
        key: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
        flags: PropTypes.object, 
    })).isRequired,
};

export default ModeShareChart;