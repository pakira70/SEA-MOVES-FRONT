// src/components/charts/ModeShareChart.jsx - MINIMALLY MODIFIED for Object Modes

import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
// Adjust path if needed
import { MODE_CHART_COLORS } from '../../config';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

// --- CHANGE 1: Expect modes as an object { key: "Display Name" } ---
function ModeShareChart({ modeShares, modes }) {
  // console.log("ModeShareChart received props:", { modeShares, modes });

  const chartData = useMemo(() => {
     // --- CHANGE 2: Update validation check ---
     if (!modeShares || typeof modeShares !== 'object' || !modes || typeof modes !== 'object') {
         console.warn("ModeShareChart received invalid props:", { modeShares, modes });
         return { labels: [], datasets: [] };
     }

    const labels = [];
    const dataValues = [];
    const backgroundColors = [];

    // --- CHANGE 3: Iterate over object keys ---
    const modeKeys = Object.keys(modes); // Get the keys ["Drive", "Bike", ...]

    modeKeys.forEach((modeKey, index) => { // Iterate using keys and index
        // --- CHANGE 4: Access share using modeKey ---
        const share = parseFloat(modeShares[modeKey]) || 0;

        if(share > 0) { // Keep including all > 0 for now
           // --- CHANGE 5: Get display name from modes object ---
           labels.push(modes[modeKey] || modeKey); // Use display name, fallback to key
           dataValues.push(share.toFixed(1));
           // Keep using index for color lookup (potential future improvement: map key to color)
           backgroundColors.push(MODE_CHART_COLORS[index % MODE_CHART_COLORS.length]);
        }
     });

    return {
      labels: labels,
      datasets: [
        {
          label: 'Mode Share %',
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: '#ffffff',
          borderWidth: 1,
        },
      ],
    };
    // --- CHANGE 6: Add modes object to dependencies ---
  }, [modeShares, modes]); // Dependencies: modeShares and the modes object


  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 400,
    },
    plugins: {
      legend: {
        // Keep legend config for now, address positioning later if needed
        position: 'right', labels: { boxWidth: 12, padding: 15 }
      },
      title: { display: false },
      tooltip: {
          callbacks: {
             label: function(context) {
                 let label = context.label || '';
                 if (label) { label += ': '; }
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

  const chartKey = useMemo(() => JSON.stringify(chartData.labels), [chartData.labels]);


  return (
       <div style={{ position: 'relative', height: '300px', width: '100%' }}>
          <Doughnut
              data={chartData}
              options={options}
              key={chartKey}
              // updateMode="active" // You can keep or remove this - investigate if needed
           />
       </div>
   );
}

// --- PropTypes ---
ModeShareChart.propTypes = {
    modeShares: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
    // --- CHANGE 7: Update modes prop type ---
    modes: PropTypes.object.isRequired, // Now an OBJECT { key: "Display Name" }
};

export default ModeShareChart;