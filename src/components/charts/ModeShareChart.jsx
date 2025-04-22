import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { MODE_CHART_COLORS } from '../../config'; // Import colors

ChartJS.register(ArcElement, Tooltip, Legend, Title);

function ModeShareChart({ modeShares, modes }) {
  // ============================================
  // ADD CONSOLE.LOG HERE:
  console.log("ModeShareChart received props:", { modeShares, modes });
  // ============================================

  const chartData = useMemo(() => {
     if (!modeShares || !modes) return { labels: [], datasets: [] };

    const labels = [];
    const data = [];
    const backgroundColors = [];

     modes.forEach((mode, index) => {
        const share = modeShares[mode] || 0;
        if(share > 0) { // Only include modes with share > 0 in the chart
           labels.push(mode);
           data.push(share.toFixed(1));
           backgroundColors.push(MODE_CHART_COLORS[index % MODE_CHART_COLORS.length]); // Cycle through colors
        }
     });
      // Temporary object for logging before formatting
    const intermediateChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Mode Share %',
          data: data, // Log the array of numbers
          backgroundColor: backgroundColors,
          borderColor: '#ffffff',
          borderWidth: 1,
        },
      ],
    };

    // ============================================
    // ADD CONSOLE.LOG HERE:
    console.log("ModeShareChart calculated chartData:", intermediateChartData);
    // ============================================


    // Original return still formats data if needed (though perhaps not necessary)

    return {
      labels: labels,
      datasets: [
        {
          label: 'Mode Share %',
          // Chart.js v3/v4 usually handles numbers fine, converting to string here might be unnecessary
          // Let's try passing numbers directly later if needed
          data: data,
          backgroundColor: backgroundColors,
          borderColor: '#ffffff', // White border for separation
          borderWidth: 1,
        },
      ],
    };
  }, [modeShares, modes]);


  const options = {
    responsive: true,
    maintainAspectRatio: false, // Important for sizing within container
    plugins: {
      legend: {
        position: 'right', // Position legend
         labels: {
            boxWidth: 12, // Smaller legend color boxes
             padding: 15 // Padding between legend items
             
         }
      },
      title: {
        display: false, // Title is handled outside chart component
        // text: 'Mode Share Distribution',
      },
      tooltip: {
          callbacks: {
             label: function(context) {
                 let label = context.label || '';
                 if (label) {
                     label += ': ';
                 }
                 if (context.parsed !== null) {
                     // Ensure the value from the dataset (which might be string) is treated as number for formatting
                     label += parseFloat(context.parsed).toFixed(1) + '%';
                 }
                 return label;
             }
          }
      }
    },
    cutout: '50%', // Make it a doughnut chart
  };

  // Add a key to force re-render when data structure changes significantly
  // This helps if modes are added/removed causing labels/datasets to change length
  const chartKey = useMemo(() => JSON.stringify(chartData.labels), [chartData.labels]);


  return (
       <div style={{ position: 'relative', height: '300px', width: '100%' }}> {/* Adjust height as needed */}
          <Doughnut data={chartData} options={options} key={chartKey}/>
       </div>
   );
}

export default ModeShareChart;