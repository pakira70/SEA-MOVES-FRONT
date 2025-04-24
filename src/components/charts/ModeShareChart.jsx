// src/components/charts/ModeShareChart.jsx - Added updateMode prop

import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import PropTypes from 'prop-types'; // Import PropTypes
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
// Assuming MODE_CHART_COLORS is correctly imported relative to this file path
// If config.js is in src/, the path would be ../../config
// Adjust if your config file is elsewhere
import { MODE_CHART_COLORS } from '../../config'; // Adjust path if needed

ChartJS.register(ArcElement, Tooltip, Legend, Title);

function ModeShareChart({ modeShares, modes }) {
  // console.log("ModeShareChart received props:", { modeShares, modes }); // Keep commented

  const chartData = useMemo(() => {
     // Basic validation
     if (!modeShares || typeof modeShares !== 'object' || !Array.isArray(modes)) {
         console.warn("ModeShareChart received invalid props:", { modeShares, modes });
         return { labels: [], datasets: [] };
     }

    const labels = [];
    const dataValues = []; // Use a different name to avoid conflict with 'data' key
    const backgroundColors = [];

     modes.forEach((mode, index) => {
        const share = parseFloat(modeShares[mode]) || 0; // Ensure number
        // Optional: Only include modes with share > threshold (e.g., 0.1%)?
        // if(share > 0.1) {
        if(share > 0) { // Keep including all > 0 for now
           labels.push(mode);
           dataValues.push(share.toFixed(1)); // Keep data as string with 1 decimal for display consistency
           backgroundColors.push(MODE_CHART_COLORS[index % MODE_CHART_COLORS.length]);
        }
     });

    return {
      labels: labels,
      datasets: [
        {
          label: 'Mode Share %',
          data: dataValues, // Assign the calculated data array
          backgroundColor: backgroundColors,
          borderColor: '#ffffff',
          borderWidth: 1,
        },
      ],
    };
  }, [modeShares, modes]); // Dependencies


  const options = {
    responsive: true,
    maintainAspectRatio: false,
    // Optimize animations slightly
    animation: {
        duration: 400,
        // easing: 'linear'
    },
    // Disable transitions if needed
    // transitions: { update: { animation: { duration: 0 } } },
    plugins: {
      legend: {
        position: 'right', labels: { boxWidth: 12, padding: 15 }
      },
      title: { display: false },
      tooltip: {
          callbacks: {
             label: function(context) {
                 let label = context.label || '';
                 if (label) { label += ': '; }
                 // context.formattedValue already contains the formatted string (e.g., "71.0")
                 if (context.formattedValue !== null) {
                      label += context.formattedValue + '%';
                 }
                 return label;
             }
          }
      }
    },
    cutout: '50%',
  };

  // Key based on labels to help with re-renders if needed
  const chartKey = useMemo(() => JSON.stringify(chartData.labels), [chartData.labels]);


  return (
       <div style={{ position: 'relative', height: '300px', width: '100%' }}>
          <Doughnut
              data={chartData}
              options={options}
              key={chartKey}
              updateMode="active" // <-- ADDED PROP
           />
       </div>
   );
}

// --- PropTypes ---
ModeShareChart.propTypes = {
    // modeShares might contain strings or numbers initially
    modeShares: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
    modes: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ModeShareChart;